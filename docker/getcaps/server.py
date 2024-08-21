import hashlib
import os
import re
import sys
import logging
import requests
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import FileResponse
from urllib.parse import urlencode
from urllib.parse import parse_qsl

logger = logging.getLogger(__name__)

app = FastAPI()

# Directory where static files will be stored
cache_path = os.environ['CACHE_PATH']

@app.get("/health")
def health():
    return {"status": "up"}

@app.get("/{rest_of_path:path}")
async def download_file(request: Request, rest_of_path: str):

    url = request.url.path + "?" + urlencode(sorted(parse_qsl(request.url.query)))
    filename = re.sub(r'[^a-zA-Z0-9]', '-', url.lower()[1:])
    filename = f'{filename}.xml'

    # Create a filename from the encoded URL
    filepath = os.path.join(cache_path, filename)

    # Check if the file already exists
    if os.path.isfile(filepath):
        return FileResponse(filepath)
    else:
        logger.warn("MISS URL  %s" % url)
        base_url = get_base_url(request.url)
        logger.warn("Forwarding to %s.." % base_url)
        fwd_res = requests.get(f'{base_url}{url}')
        return Response(status_code=fwd_res.status_code, content=fwd_res.content, media_type=fwd_res.headers['content-type'], headers=fwd_res.headers)


def get_base_url (url):
    query = parse_qsl(url.query)
    if '/wms' in url.path or ('service' in query and query['service'].upper() == 'WMS'):
        return os.environ['GEOSERVER_WMS_URL']
    else:
        return os.environ['GEOSERVER_WFS_URL']
