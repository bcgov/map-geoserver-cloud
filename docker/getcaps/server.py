import hashlib
import os
import re
import sys
import logging
import requests
from typing import Annotated
from xml.dom.pulldom import parseString, START_ELEMENT
from fastapi import FastAPI, Depends, Request, Response, HTTPException, Header
from fastapi.responses import FileResponse
from urllib.parse import urlencode
from urllib.parse import parse_qsl, parse_qs
from refresh_task import is_ready

logger = logging.getLogger(__name__)

app = FastAPI()

# Directory where static files will be stored
cache_path = os.environ['CACHE_PATH']

def get_request_from_xml (xml_buffer: bytes):
    event_stream = parseString(xml_buffer.decode())
    for event, node in event_stream:
        if event == START_ELEMENT:
            return node.tagName
    return None

async def get_body(request: Request):
    return await request.body()

def get_base_url (url):
    query = parse_qs(url.query)
    if '/wms' in url.path or \
        ('SERVICE' in query and query['SERVICE'][0].upper() == 'WMS') or \
        ('service' in query and query['service'][0].upper() == 'WMS'):
        return os.environ['GEOSERVER_WMS_URL']
    else:
        return os.environ['GEOSERVER_WFS_URL']

@app.get("/health")
def health():
    if is_ready():
        return {"status": "up"}
    else:
        raise HTTPException(503)

@app.post("{rest_of_path:path}")
def download_post_file(request: Request,
                    content_type: Annotated[str | None, Header()] = None,
                    rest_of_path: str = None,
                    bytes = Depends(get_body)):
    url = request.url.path + "?" + urlencode(sorted(parse_qsl(request.url.query)))

    request_type = None
    if "xml" in content_type:
        request_type : str = get_request_from_xml(bytes)

    cache : bool = False
    if request_type is not None and request_type.casefold() == "GetCapabilities".casefold():
        cache = True

    filename = re.sub(r'[^a-zA-Z0-9]', '-', "%s-%s" % (url.lower()[1:], str(bytes)))
    if len(filename) > 200:
        hash_object = hashlib.md5(filename.encode())
        filename = "%s-%s" % (filename[:200], hash_object.hexdigest())

    filename = f'POST_{filename}.xml'

    # Create a filename from the encoded URL
    filepath = os.path.join(cache_path, filename)

    # Check if the file already exists
    if os.path.isfile(filepath):
        return FileResponse(filepath)
    else:
        logger.warning("POST %s (%s) %s" % (content_type, request_type, url))
        base_url = f'{get_base_url(request.url)}'
        logger.warning("Forwarding to %s" % base_url)
        url_str = f'{base_url}{url}'

        headers = request.headers.mutablecopy()
        headers.__delitem__("Host")
        headers["Forwarded"] = os.environ["PROXY_FORWARDED"]

        fwd_res = requests.post(url_str, headers=headers, data=bytes)
        if cache and fwd_res.status_code == 200:
            logger.warning("SAVING %s" % filepath)
            with open(filepath, "wb") as f:
                f.write(fwd_res.content)
        return Response(status_code=fwd_res.status_code, content=fwd_res.content, media_type=fwd_res.headers['content-type'], headers=fwd_res.headers)


@app.get("{rest_of_path:path}")
def download_file(request: Request, rest_of_path: str):

    url = request.url.path + "?" + urlencode(sorted(parse_qsl(request.url.query)))
    filename = re.sub(r'[^a-zA-Z0-9]', '-', url.lower()[1:])
    if len(filename) > 200:
        hash_object = hashlib.md5(filename.encode())
        filename = "%s-%s" % (filename[:200], hash_object.hexdigest())

    filename = f'GET_{filename}.xml'

    # Create a filename from the encoded URL
    filepath = os.path.join(cache_path, filename)

    # Check if the file already exists
    if os.path.isfile(filepath):
        return FileResponse(filepath)
    else:
        logger.warning("MISS URL  %s" % url)
        base_url = f'{get_base_url(request.url)}'
        logger.warning("Forwarding to %s" % base_url)
        url_str = f'{base_url}{url}'

        headers = request.headers.mutablecopy()
        headers.__delitem__("Host")
        headers["Forwarded"] = os.environ["PROXY_FORWARDED"]

        fwd_res = requests.get(url_str, headers=headers)
        if fwd_res.status_code == 200:
            logger.warning("SAVING %s" % filepath)
            with open(filepath, "wb") as f:
                f.write(fwd_res.content)
        return Response(status_code=fwd_res.status_code, content=fwd_res.content, media_type=fwd_res.headers['content-type'], headers=fwd_res.headers)

