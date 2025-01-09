import hashlib
import os
import re
import logging
import requests
from typing import Annotated
from xml.dom.pulldom import parseString, START_ELEMENT
from fastapi import FastAPI, Depends, Request, Response, HTTPException, Header
from fastapi.responses import FileResponse
from starlette.responses import StreamingResponse
from starlette.background import BackgroundTask
from urllib.parse import urlencode
from urllib.parse import parse_qsl, parse_qs
from refresh_task import is_ready
import httpx

logger = logging.getLogger(__name__)

app = FastAPI()

client_wfs = httpx.AsyncClient(base_url=os.environ['GEOSERVER_WFS_URL'])
client_wms = httpx.AsyncClient(base_url=os.environ['GEOSERVER_WMS_URL'])

async def _reverse_proxy(request: Request, request_body: bytes, checked_service: str):
    url = httpx.URL(path=request.url.path,
                    query=request.url.query.encode("utf-8"))

    headers = request.headers.mutablecopy()
    headers.__delitem__("Host")
    headers["Forwarded"] = os.environ["PROXY_FORWARDED"]

    client = client_wfs
    if checked_service == "wms":
        client = client_wms

    logger.info("%s -> %s" % (url, checked_service))
    rp_req = client.build_request(request.method, url,
                                  headers=headers,
                                  content=request_body,
                                  timeout=60.0)

    rp_resp = await client.send(rp_req, stream=True)
    return StreamingResponse(
        rp_resp.aiter_raw(),
        status_code=rp_resp.status_code,
        headers=rp_resp.headers,
        background=BackgroundTask(rp_resp.aclose),
    )

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

def check_service(path: str, query: bytes):
    query = parse_qs(query)
    if '/wms' in path:
        return "wms"
    elif '/wfs' in path:
        return "wfs"
    elif 'SERVICE' in query or 'service' in query:
        is_wms = ('SERVICE' in query and query['SERVICE'][0].upper() == 'WMS') or \
                 ('service' in query and query['service'][0].upper() == 'WMS')
        if is_wms:
            return "wms"
        else:
            return "wfs"    
    elif b'SERVICE' in query or b'service' in query:
        is_wms = (b'SERVICE' in query and query[b'SERVICE'][0].upper() == b'WMS') or \
                 (b'service' in query and query[b'service'][0].upper() == b'WMS')
        if is_wms:
            return "wms"
        else:
            return "wfs"    
    else:
        return None

def get_base_url (url):
    if check_service(url.path, url.query) == "wms":
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
async def download_post_file(request: Request,
                    content_type: Annotated[str | None, Header()] = None,
                    rest_of_path: str = None,
                    request_body = Depends(get_body)):
    url = request.url.path + "?" + urlencode(sorted(parse_qsl(request.url.query)))

    request_type = None
    if content_type is not None and "xml" in content_type:
        request_type : str = get_request_from_xml(request_body)

    cache : bool = False
    if request_type is not None and request_type.casefold() == "GetCapabilities".casefold():
        cache = True

    # If no caching then act as a simple reverse proxy
    if cache is False:
        checked_service = check_service(request.url.path, request.url.query)
        if checked_service is None and content_type is not None and content_type.casefold() == "application/x-www-form-urlencoded".casefold():
            try:
                checked_service = check_service(request.url.path, request_body)
            except Exception as ex:
                logger.error("Error checking body: %s", ex)
                raise HTTPException(status_code=400, detail="Invalid data")
        return await _reverse_proxy(request, request_body, checked_service)

    filename = re.sub(r'[^a-zA-Z0-9]', '-', "%s-%s" % (url.lower()[1:], str(request_body)))
    if len(filename) > 200:
        hash_object = hashlib.md5(filename.encode())
        filename = "%s-%s" % (filename[:200], hash_object.hexdigest())

    filename = f'POST_{filename}.xml'

    # Create a filename from the encoded URL
    filepath = os.path.normpath(os.path.join(cache_path, filename))
    if not filepath.startswith(os.path.normpath(cache_path)):
        raise HTTPException(status_code=400, detail="Invalid file path")

    # Check if the file already exists
    if os.path.isfile(filepath):
        return FileResponse(filepath)
    else:
        logger.info("POST %s (%s) %s" % (content_type, request_type, url))
        base_url = f'{get_base_url(request.url)}'
        logger.info("Forwarding to %s" % base_url)
        url_str = f'{base_url}{url}'

        headers = request.headers.mutablecopy()
        headers.__delitem__("Host")
        headers["Forwarded"] = os.environ["PROXY_FORWARDED"]

        fwd_res = requests.post(url_str, headers=headers, data=request_body)
        if fwd_res.status_code == 200:
            logger.info("SAVING %s" % filepath)
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
    filepath = os.path.normpath(os.path.join(cache_path, filename))
    if not filepath.startswith(os.path.normpath(cache_path)):
        raise HTTPException(status_code=400, detail="Invalid file path")

    # Check if the file already exists
    if os.path.isfile(filepath):
        return FileResponse(filepath)
    else:
        logger.info("MISS URL  %s" % url)
        base_url = f'{get_base_url(request.url)}'
        logger.info("Forwarding to %s" % base_url)
        url_str = f'{base_url}{url}'

        headers = request.headers.mutablecopy()
        headers.__delitem__("Host")
        headers["Forwarded"] = os.environ["PROXY_FORWARDED"]

        fwd_res = requests.get(url_str, headers=headers)
        if fwd_res.status_code == 200:
            logger.info("SAVING %s" % filepath)
            with open(filepath, "wb") as f:
                f.write(fwd_res.content)
        return Response(status_code=fwd_res.status_code, content=fwd_res.content, media_type=fwd_res.headers['content-type'], headers=fwd_res.headers)

