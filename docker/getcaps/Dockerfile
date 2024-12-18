FROM docker.io/python:3.13.1-slim-bookworm

WORKDIR /app

RUN pip install requests python-dateutil fastapi uvicorn

COPY . .

ENTRYPOINT [ "python", "main.py" ]
