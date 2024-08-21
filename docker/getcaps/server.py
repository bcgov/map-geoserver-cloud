import hashlib
import os
import re
import sys
import logging
from fastapi import FastAPI, Request, HTTPException
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
        logger.error("MISS URL  %s" % url)
        logger.error("MISS PATH %s" % filepath)
        raise HTTPException(status_code=404, detail="File not found")
