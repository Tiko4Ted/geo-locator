const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const logFile = process.env.LOCATION_LOG_FILE
  ? path.resolve(process.env.LOCATION_LOG_FILE)
  : process.env.VERCEL
  ? path.join(os.tmpdir(), "location-logs.jsonl")
  : path.join(__dirname, "data", "location-logs.jsonl");
const logDir = path.dirname(logFile);

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        upgradeInsecureRequests: null
      }
    }
  })
);

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : false;

app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: "10kb" }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidTimestamp(value) {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function isValidLocationPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }

  const { latitude, longitude, accuracy, timestamp } = payload;

  return (
    isFiniteNumber(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    isFiniteNumber(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    isFiniteNumber(accuracy) &&
    accuracy >= 0 &&
    isValidTimestamp(timestamp)
  );
}

async function appendLocationLog(entry) {
  await fs.mkdir(logDir, { recursive: true });
  await fs.appendFile(logFile, `${JSON.stringify(entry)}\n`, "utf8");
}

function createLocationLogEntry(payload, ip, userAgent) {
  const { latitude, longitude, accuracy, timestamp } = payload;

  return {
    receivedAt: new Date().toISOString(),
    timestamp,
    latitude,
    longitude,
    accuracy,
    ip,
    userAgent
  };
}

app.post("/api/location", apiLimiter, async (req, res, next) => {
  if (!isValidLocationPayload(req.body)) {
    return res.status(400).json({ error: "Invalid location payload" });
  }

  const entry = createLocationLogEntry(req.body, req.ip, req.get("user-agent") || "");

  try {
    await appendLocationLog(entry);
    console.log("Location update received:", entry);
    return res.status(200).json({ status: "received" });
  } catch (error) {
    return next(error);
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Server error" });
});

function startServer() {
  return app.listen(port, () => {
    console.log(`Consent location video app running at http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.appendLocationLog = appendLocationLog;
module.exports.app = app;
module.exports.createLocationLogEntry = createLocationLogEntry;
module.exports.isValidLocationPayload = isValidLocationPayload;
module.exports.startServer = startServer;
