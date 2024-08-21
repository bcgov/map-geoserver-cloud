import os
import logging
import asyncio
from multiprocessing import Process

logging.basicConfig(
    format='%(asctime)s [%(levelname)-5s] %(message)s',
    level=os.environ.get('LOGLEVEL', 'INFO').upper()
)
logging.getLogger("uvicorn.access").propagate = False
logging.getLogger("uvicorn.error").propagate = False

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    from server import app

    from refresh_task import refresh_task
    process = Process(target=refresh_task)
    process.start()

    logger.info("Starting HTTP Server on port 8000")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

    process.join()