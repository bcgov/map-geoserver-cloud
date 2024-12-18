const express = require("express");

const app = express();

require("./modules/makeExpressStaticCaseInsensitive")(express);

app.get("/health", (req, res) => {
  res.status(200).send("up");
});

app.use(express.static("www", { redirect: false }));

app.listen(8000);

process.on("SIGINT", function () {
  console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
  process.exit();
});
