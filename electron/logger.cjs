// Logger simples com escrita em ficheiro rotativo (1 por dia, mantém 14)
const fs = require("fs");
const path = require("path");

let logDir = null;
let currentFile = null;

function init(baseDir) {
  logDir = path.join(baseDir, "logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  rotate();
  cleanupOld();
}

function rotate() {
  const stamp = new Date().toISOString().slice(0, 10);
  currentFile = path.join(logDir, `pharmasys-${stamp}.log`);
}

function cleanupOld() {
  try {
    const files = fs
      .readdirSync(logDir)
      .filter((f) => f.startsWith("pharmasys-") && f.endsWith(".log"))
      .sort();
    while (files.length > 14) {
      const old = files.shift();
      fs.unlinkSync(path.join(logDir, old));
    }
  } catch {
    /* noop */
  }
}

function write(level, args) {
  const line = `[${new Date().toISOString()}] [${level}] ${args
    .map((a) => (a instanceof Error ? `${a.message}\n${a.stack}` : typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ")}\n`;
  if (level === "ERROR" || level === "WARN") process.stderr.write(line);
  else process.stdout.write(line);
  if (currentFile) {
    try {
      fs.appendFileSync(currentFile, line);
    } catch {
      /* noop */
    }
  }
}

module.exports = {
  init,
  info: (...a) => write("INFO", a),
  warn: (...a) => write("WARN", a),
  error: (...a) => write("ERROR", a),
  getDir: () => logDir,
  getFile: () => currentFile,
};
