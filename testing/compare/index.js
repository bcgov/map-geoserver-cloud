const fs = require("fs");
const url = require("node:url");
const querystring = require("node:querystring");
const readline = require("readline");
const xmlFormat = require("xml-formatter");
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");
require("colors");
const Diff = require("diff");

const express = require("express");
const app = express();
const port = 5002;

const siteA = process.env.SITE_A_URL;
const siteB = process.env.SITE_B_URL;

function log(url) {
  fs.writeFileSync("pages-2.txt", url + "\n", { flag: "a" }, (err) => {
    console.log("ERR " + err);
  });
}

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

const normalizeLineEndings = (str, normalized = "\n") =>
  str.replace(/\r?\n/g, normalized);

async function processRequest(res) {
  const type = res.headers.get("Content-Type");

  if (type.indexOf("json") >= 0) {
    const jso = await res.json();

    jso["timeStamp"] = "";
    for (const feat of jso["features"]) {
      feat["id"] = feat["id"].substring(0, feat["id"].lastIndexOf("."));
    }
    return {
      type,
      file: JSON.stringify(jso, null, 4),
    };
  } else if (type.indexOf("xml") >= 0 || type.indexOf("gml") >= 0) {
    console.log(type);
    const options = {
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      allowBooleanAttributes: true,
      preserveOrder: true,
    };
    const xmlData = await res.text();
    const parser = new XMLParser(options);
    let jObj = parser.parse(xmlData);

    console.log(xmlFormat(xmlData));
    jObj[1][":@"]["@_timeStamp"] = "";

    // if ("@_xsi:schemaLocation" in jObj[1][":@"]) {
    //   jObj[1][":@"]["@_xsi:schemaLocation"] = jObj[1][":@"][
    //     "@_xsi:schemaLocation"
    //   ].replace("http://openmaps.gov.bc.ca", "https://gscloud.api.gov.bc.ca");
    // }

    // if ("@_next" in jObj[1][":@"]) {
    //   jObj[1][":@"]["@_next"] = new URL(
    //     jObj[1][":@"]["@_next"].replace(
    //       "https://openmaps.gov.bc.ca",
    //       "https://gscloud.api.gov.bc.ca"
    //     )
    //   ).href;

    //   jObj[1][":@"]["@_next"] = jObj[1][":@"]["@_next"].replace(
    //     "RESULTTYPE=results&REQUEST=GetFeature",
    //     "REQUEST=GetFeature&RESULTTYPE=results"
    //   );
    // }
    return {
      type,
      orig: xmlFormat(xmlData),
      file: JSON.stringify(jObj, null, 4),
    };
  } else if (type.indexOf("png") >= 0) {
    return {
      type,
      file: "--image--",
    };
  } else if (type.indexOf("javascript") >= 0) {
    return {
      type,
      file: "--javascript--",
    };
  } else {
    console.log(type);
    const fileText = await res.text();
    return {
      type,
      file: normalizeLineEndings(fileText),
    };
  }
}

function get(host, path, extra = "") {
  const start = Date.now();
  return fetch(`${host}${path}${extra}`, {
    signal: AbortSignal.timeout(10000),
  })
    .then(processRequest)
    .then((x) => {
      x.time = (Date.now() - start) / 1000;
      x.host = host;
      x.success = true;
      return x;
    })
    .catch((err) => {
      console.log("error occured", err);
      return {
        file: "ERROR " + err,
        time: (Date.now() - start) / 1000,
        host,
        success: false,
      };
    });
}

app.use("/static", express.static("public"));

// app.get("/", async (req, res) => {
//   let html = '<html><head><link rel="stylesheet" href="static/base.css"><body>';
//   html += `
//         <form method="GET" action="/compare">
//         <input type="text" name="page"></input>
//         </form>
//     `;
//   var lineReader = require("readline").createInterface({
//     input: require("fs").createReadStream("pages.txt"),
//   });

//   lineReader.on("line", function (line) {
//     url = new URL("https://placeholder" + line);

//     html += `<li><a href="/compare?page=${encodeURIComponent(line)}">${
//       url.pathname
//     }</a></li>`;
//   });

//   lineReader.on("close", function () {
//     html += "</body></html>";
//     res.setHeader("Content-Type", "text/html");

//     res.send(html);
//   });
// });

const line = (valA, valB) => `<tr><td>${valA}</td><td>${valB}</td></tr>`;

app.get("/favicon.ico", (req, res) => res.status(404));

app.get("/**", async (req, res) => {
  const page = req.url;
  console.log("Open " + page);
  var url_parts = url.parse(req.url, true);
  const page1 = get(siteA, page);
  const page2 = get(siteB, page);
  const pages = await Promise.all([page1, page2]);
  const diff = Diff.diffLines(pages[0].file, pages[1].file);

  console.log(pages[0].file);
  const error = pages[0].success == false || pages[1].success == false;

  let differences = 0;
  let html =
    '<html><head><link rel="stylesheet" href="/static/base.css"></head><body>';
  html += `<h3>${page}</h3><hr/>`;
  html += "<table class='params'>";

  for (const part of Object.keys(url_parts.query)) {
    html +=
      "<tr><td>" + part + "</td><td>" + url_parts.query[part] + "</td></tr>";
  }
  html += "</table>";

  html += `<table>`;
  html += line(pages[0].host, pages[1].host);
  html += line(
    `${pages[0].host}${page}&gscloud=false`,
    `${pages[1].host}${page}&gscloud=true`
  );
  html += line(pages[0].type, pages[1].type);
  html += line(pages[0].time, pages[1].time);
  html += "</table>";
  diff.forEach((part) => {
    // green for additions, red for deletions
    const color = part.added ? "green" : part.removed ? "red" : "grey";
    if (color != "grey") {
      differences++;
      html += `<span style="color: ${color};">${part.value}</span>`;
    }
  });

  html += "<hr/>";

  if (differences == 0) {
    html += "<h1>EXACTLY THE SAME</h1>";
    diff.forEach((part) => {
      // green for additions, red for deletions
      const color = part.added ? "green" : part.removed ? "red" : "grey";
      html += `<span style="color: ${color};">${part.value}</span>`;
    });
  } else if (error == false) {
    log(page);
  }
  html += "<hr/>";
  if (pages[0].orig) {
    html += `<pre lang="xml" style="background-color: #EFEFEF; white-space: break-spaces">${escapeXml(
      pages[0].orig
    )}</pre>`;
  } else {
    html += `<pre style="background-color: #EFEFEF;">${pages[0].file}</pre>`;
  }
  html += "<hr/>";
  if (pages[1].orig) {
    html += `<pre lang="xml" style="background-color: #EFEFEF; white-space: break-spaces">${escapeXml(
      pages[1].orig
    )}</pre>`;
  } else {
    html += `<pre style="background-color: #EFEFEF;">${pages[1].file}</pre>`;
  }

  html += "</body></html>";
  res.setHeader("Content-Type", "text/html");

  res.status(differences == 0 && error == false ? 200 : 400).send(html);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
