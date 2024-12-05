const fs = require("fs");
const express = require("express");
const config = require("./config.json");

const app = express();
const port = 5001;

app.get("/favicon.ico", (req, res) => res.status(404));

app.get("/**", (req, res) => {
  try {
    console.log(req.url);
    const testId = config[req.url].testId;

    const fileType = config[req.url].type
      ? "txt"
      : fs.existsSync(`testData/${testId}.xml`)
      ? "xml"
      : "json";
    const contentType = config[req.url].type
      ? "text/plain"
      : fs.existsSync(`testData/${testId}.xml`)
      ? "application/xml"
      : "application/json";

    fs.readFile(`testData/${testId}.${fileType}`, "utf8", (err, data) => {
      if (err) {
        res.status(400).send("file not found");
        return;
      }
      res.set("content-type", contentType);
      res.send(data);
    });
  } catch (err) {
    console.error("ERROR: test not found");
    res.status(400).send("test not found");
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
