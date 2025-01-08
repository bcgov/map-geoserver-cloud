import os
import logging
import asyncio
from multiprocessing import Process

logging.basicConfig(
    format='%(asctime)s [%(levelname)-5s] %(message)s',
    level=os.environ.get('LOGLEVEL', 'INFO').upper()
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    from server import app

    from refresh_task import refresh_task
    process = None
    if os.environ.get('ENV', 'prod') == "prod":
        process = Process(target=refresh_task)
        process.start()

    logger.info("Starting HTTP Server on port 8000")
    import uvicorn

    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["formatters"]["access"]["fmt"] = "%(asctime)s [%(levelname)-5s] %(message)s"
    log_config["formatters"]["default"]["fmt"] = "%(asctime)s [%(levelname)-5s] %(message)s"

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info", log_config=log_config)

    if process is not None:
        process.join()