const express = require("express");

const app = express();

app.get("/health", (req, res) => {
    res.status(200).send('up');
});

app.use(express.static("www"));

app.listen(8000);
