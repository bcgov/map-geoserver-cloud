FROM docker.io/python:latest

WORKDIR /app

RUN pip install requests python-dateutil fastapi uvicorn

COPY . .

ENTRYPOINT [ "python", "main.py" ]
