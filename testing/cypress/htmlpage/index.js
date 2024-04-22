import express from "express";
import fetch from "node-fetch";
import { readFileSync, createWriteStream } from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import querystring from "node:querystring";
import { createHash, randomBytes } from "node:crypto";

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
    }
  });
}

function randomString(length) {
  if (length % 2 !== 0) {
    length++;
  }
  return randomBytes(length / 2).toString("hex");
}

const secret = randomString(16);

const targetUrl = process.env.TARGET_URL;
console.log(`Proxy to ${targetUrl}`);

const app = express();

app.get("/_/**", (req, res) => {
  res.send(readFileSync(req.path.substring(3)));
});

app.get("/favicon.ico", (req, res) => {
  res.sendStatus(404);
});

app.get("/**", async (req, res) => {
  const proxyUrl = `${targetUrl}${req.path}?${querystring.stringify(
    req.query
  )}`;

  console.log(proxyUrl);

  const hash = createHash("sha256", secret).update(proxyUrl).digest("hex");

  const response = await fetch(proxyUrl);

  var contype = response.headers.get("content-type");

  if (!response.ok || contype === "application/vnd.ogc.se_xml;charset=UTF-8") {
    console.error(`unexpected response ${response.statusText}`);
    const responseText = await response.text();
    res.set("Content-Type", "text/html");
    res.send(
      `
      <html>
        <head>
          <style>
            pre {
              display: flex;
              justify-content: left;
              align-items: top;
              flex-wrap: wrap;
              font-weight: 800;
              font-family: "Courier New", Courier, monospace;
              margin: 2px;
              background-color: blue;
              color: white;
            }
            div.xml {
              width: auto;
              display: flex;
              flex-wrap: wrap;
              justify-content: left;
              align-items: top;
              font-weight: 800;
              word-break: break-word;
              white-space: pre-wrap;
              font-family: "Courier New", Courier, monospace;
              margin: 2px;
              padding: 5px;
              border: 5px solid lightgray;
            }            
            div.img {
              width: auto;
              text-align: center;
              padding: 5px;
              border: 5px solid lightgray;
            }
          </style>
        </head>
      <body>
        <div>
          <pre>${JSON.stringify(req.query, null, 4)}</pre>
        </div>
        <div class="xml">${response.status} ${
        response.statusText
      } (${contype})</div>
        <div class="xml">${escapeXml(responseText)}
        </div>

      </body>
    </html>`
    );
    return;
  }

  if (contype == "text/xml") {
    res.set("Content-Type", "text/html");
    res.send(
      `
      <html>
        <head>
          <style>
            pre {
              display: flex;
              justify-content: left;
              align-items: top;
              flex-wrap: wrap;
              font-weight: 800;
              font-family: "Courier New", Courier, monospace;
              margin: 2px;
              background-color: blue;
              color: white;
            }
            div.xml {
              width: auto;
              display: flex;
              flex-wrap: wrap;
              justify-content: left;
              align-items: top;
              font-weight: 800;
              word-break: break-word;
              white-space: pre-wrap;
              font-family: "Courier New", Courier, monospace;
              margin: 2px;
              padding: 5px;
              border: 5px solid lightgray;
            }            
            div.img {
              width: auto;
              text-align: center;
              padding: 5px;
              border: 5px solid lightgray;
            }
          </style>
        </head>
      <body>
        <div>
          <pre>${JSON.stringify(req.query, null, 4)}</pre>
        </div>
        <div class="xml">${escapeXml(await response.text())}
          
        </div>
      </body>
    </html>`
    );
    return;
  } else if (contype != "image/png") {
    console.log(contype);
    response.body.pipe(res);
    return;
  }

  const filename = `_tmp_${hash}.png`;
  const fileStream = createWriteStream(filename);
  const streamPipeline = promisify(pipeline);
  await streamPipeline(response.body, fileStream);

  res.set("Content-Type", "text/html");
  res.send(
    `
    <html>
      <head>
        <style>
          pre {
            display: flex;
            justify-content: left;
            align-items: top;
            flex-wrap: wrap;
            font-weight: 800;
            font-family: "Courier New", Courier, monospace;
            margin: 2px;
            background-color: blue;
            color: white;
          }
          div.img {
            width: auto;
            text-align: center;
            padding: 5px;
            border: 5px solid lightgray;
          }
        </style>
      </head>
    <body>
      <div>
        <pre>${JSON.stringify(req.query, null, 4)}</pre>
      </div>
      <div class="img">
        <img src="/_/${filename}">
      </div>
    </body>
  </html>`
  );
});

console.log("Listening...");
app.listen(3000);

process.on("SIGINT", function () {
  process.exit();
});
