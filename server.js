// @ts-check
const { createServer } = require("https");
const { parse } = require("url");
const next = require("next").default;
const fs = require("fs");

const port = process.env.PORT || 4443;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const certs = {
  key: fs.readFileSync("./certs/localdev.kth.se-key.pem"),
  cert: fs.readFileSync("./certs/localdev.kth.se.pem"),
};

app.prepare().then(() => {
  createServer(certs, (req, res) => {
    if (req.url) {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }
  }).listen(port, () => {
    console.log("ready - started server on url: https://localhost:" + port);
  });
});
