
import os
import os.path
import re
import time
import requests
import logging
import dateutil.parser
from urllib.parse import urlparse
from urllib.parse import urlencode
from urllib.parse import parse_qsl

logger = logging.getLogger(__name__)
cache_path = os.environ['CACHE_PATH']

def refresh_task():
    base_urls = [
        { 
            "url": os.environ['GEOSERVER_WMS_URL'],
            "getcaps": [
                "/ows?service=WMS&version=1.3.0&request=GetCapabilities",
                "/ows?service=WMS&version=1.1.1&request=GetCapabilities",
                "/pub/ows?service=WMS&version=1.3.0&request=GetCapabilities",
                "/pub/ows?service=WMS&version=1.1.1&request=GetCapabilities"
            ]
        },
        {
            "url": os.environ['GEOSERVER_WFS_URL'],
            "getcaps": [
                "/ows?service=WFS&version=2.0.0&request=GetCapabilities",
                "/ows?service=WFS&version=1.1.0&request=GetCapabilities",
                "/ows?service=WFS&version=1.0.0&request=GetCapabilities",
                "/pub/ows?service=WFS&version=2.0.0&request=GetCapabilities",
                "/pub/ows?service=WFS&version=1.1.0&request=GetCapabilities",
                "/pub/ows?service=WFS&version=1.0.0&request=GetCapabilities",
            ]
        }
    ]


    patch_http_and_https_connection()

    while True:
        for idx, base_url in enumerate(base_urls):
            try:
                r = requests.get(f'{base_url['url']}:8081/actuator/env')
                if r.status_code == 200:
                    d = r.json()
                    ip = r.raw._original_response._remote[0]
                    logger.debug(f"IP = {r.raw._original_response._remote}")

                    s3_data = {}
                    for sources in d['propertySources']:
                        if 'properties' in sources:
                            for prop, value in sources['properties'].items():
                                if prop.startswith('s3-data.'):
                                    s3_data[prop[8:]] = value['value']


                    if is_cache_old(idx, s3_data['lastModified']):
                        logger.info(f'New! DATE:{s3_data['lastModified']:22} ETAG:{s3_data['etag']}')
                        for url in base_url['getcaps']:
                            the_url = urlparse(f'http://{ip}:8080{url}')
                            url = the_url.path + "?" + urlencode(sorted(parse_qsl(the_url.query)))
                            filename = re.sub(r'[^a-zA-Z0-9]', '-', url.lower()[1:])
                            fileoutput = f'{cache_path}/{filename}.xml'
                            logger.info(f"Getting {url}")

                            response = requests.get(f'http://{ip}:8080{url}')
                            if response.status_code == 200:
                                with open(fileoutput, "wb") as f:
                                    f.write(response.content)
                            else:
                                raise Exception(response.text)
                            
                        update_cache_state(idx, s3_data['lastModified'])
                    else:
                        logger.debug("Cache up to date, skipping calls to geoserver.")
                else:
                    raise Exception(r.status_code)
                
                with open(f"{cache_path}/ready", "w") as f:
                    f.write('up')

            except KeyboardInterrupt:
                raise ex
            except SystemExit as ex:
                raise ex
            except BaseException as ex:
                logger.error(f"Failed to call geoserver {ex}")

        time.sleep(60)


def is_cache_old (idx, current):
    file = f"{cache_path}/state{idx}"
    if os.path.isfile(file):
        cur = dateutil.parser.isoparse(current)
        with open(file, "r") as f:
            cached = dateutil.parser.isoparse(f.read())
            
            if (cur-cached).total_seconds() > 0:
                return True
            else:
                return False
    else:
        return True

def update_cache_state (idx, current):
    with open(f"{cache_path}/state{idx}", "w") as f:
        f.write(current)

def patch_http_and_https_connection():
    import http.client

    def getresponse(self, *args, **kwargs):
        response = self._old_getresponse(*args, **kwargs)
        if self.sock:
            response._local = self.sock.getsockname()
            response._remote = self.sock.getpeername()
        else:
            response._local = None
            response._remote = None
        return response

    http.client.HTTPConnection._old_getresponse = http.client.HTTPConnection.getresponse
    http.client.HTTPConnection.getresponse = getresponse
