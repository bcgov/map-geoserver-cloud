const fs = require("node:fs");
const readline = require("readline");
const url = require("node:url");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const winston = require("winston");
const { combine, timestamp, json } = winston.format;

const app = express();

const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), json()),
  transports: [new winston.transports.Console()],
});

const file = readline.createInterface({
  input: fs.createReadStream("geoserver_styles_lut.txt"),
  output: process.stdout,
  terminal: false,
});

const map = {};

file.on("line", (line) => {
  const parts = line.split(":");
  map[parts[0]] = parts[1];
});
file.on("close", () => {
  logger.info(`Map has ${Object.keys(map).length} items.`);

  const modifyQueryParameter = (proxyReq, req) => {
    const originalUrl = req.url;
    const parsedUrl = url.parse(originalUrl, true);
    const query = parsedUrl.query;

    // Modify the query parameter
    if ("styles" in query || "STYLES" in query) {
      const style = query["styles"] || query["STYLES"];
      if (map.hasOwnProperty(style)) {
        logger.info(`Map ${style} to ${map[style]}`);
        query.styles = map[style];
      } else {
        logger.error(`Mapper did not have style ${originalUrl}`);
      }
    } else if ("style" in query || "STYLE" in query) {
      const style = query["style"] || query["STYLE"];
      if (map.hasOwnProperty(style)) {
        logger.info(`Map ${style} to ${map[style]}`);
        query.style = map[style];
      } else {
        logger.error(`Mapper did not have style ${originalUrl}`);
      }
    } else {
      logger.error(`Query did not have styles ${originalUrl}`);
    }

    // Reconstruct the URL with the modified query
    const newUrl = url.format({
      pathname: parsedUrl.pathname,
      query: query,
    });

    // Set the new path on the proxy request
    proxyReq.path = newUrl;
  };

  app.get("/health", (req, res) => {
    res.status(200).send('up');
  });

  app.use(
    "/",
    createProxyMiddleware({
      target: process.env.TARGET_URL,
      changeOrigin: true,
      on: {
        proxyReq: modifyQueryParameter,
      },
    })
  );
  logger.info("Listening on port 8000");
  app.listen(8000);
});
