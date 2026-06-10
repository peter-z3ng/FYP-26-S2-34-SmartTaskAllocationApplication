const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const next = require("next");

const cwd = process.cwd();
const host = process.env.HOSTNAME || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const logPath = path.join(os.tmpdir(), "optima-local-next-server.log");

function log(message) {
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
}

process.on("uncaughtException", (error) => {
  log(error.stack || String(error));
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  log(error?.stack || String(error));
  process.exit(1);
});

const app = next({ dev: false, dir: cwd, hostname: host, port });
const handle = app.getRequestHandler();
let server;

log(`starting pid=${process.pid} cwd=${cwd}`);

app
  .prepare()
  .then(() => {
    server = http.createServer((request, response) => handle(request, response)).listen(port, host, () => {
      log(`ready http://${host}:${port}`);
      console.log(`Optima local server ready: http://${host}:${port}`);
    });

    // Keep detached Windows launches alive even when no console is attached.
    setInterval(() => {}, 1 << 30);
  })
  .catch((error) => {
    log(error.stack || String(error));
    console.error(error);
    process.exit(1);
  });
