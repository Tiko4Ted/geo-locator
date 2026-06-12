const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

process.env.LOCATION_LOG_FILE = path.join(
  os.tmpdir(),
  `consent-location-test-${process.pid}.jsonl`
);

const { app, isValidLocationPayload } = require("../server");
const locationHandler = require("../api/location");

function listen(serverApp) {
  return new Promise((resolve) => {
    const server = serverApp.listen(0, () => resolve(server));
  });
}

test("validates required location payload fields", () => {
  assert.equal(
    isValidLocationPayload({
      latitude: -1.286389,
      longitude: 36.817223,
      accuracy: 12,
      timestamp: "2026-06-12T10:30:00.000Z"
    }),
    true
  );

  assert.equal(
    isValidLocationPayload({
      latitude: 120,
      longitude: 36.817223,
      accuracy: 12,
      timestamp: "2026-06-12T10:30:00.000Z"
    }),
    false
  );
});

test("serves consent page and validates location API", async (t) => {
  await fs.rm(process.env.LOCATION_LOG_FILE, { force: true });

  const server = await listen(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const homeResponse = await fetch(baseUrl);
  const homeHtml = await homeResponse.text();

  assert.equal(homeResponse.status, 200);
  assert.match(homeHtml, /Allow Location and Continue/);
  assert.match(homeHtml, /id="videoSection"[^>]*hidden/);

  const validPayload = {
    latitude: -1.286389,
    longitude: 36.817223,
    accuracy: 12,
    timestamp: "2026-06-12T10:30:00.000Z"
  };

  const validResponse = await fetch(`${baseUrl}/api/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validPayload)
  });

  assert.equal(validResponse.status, 200);
  assert.deepEqual(await validResponse.json(), { status: "received" });

  const logContents = await fs.readFile(process.env.LOCATION_LOG_FILE, "utf8");
  const logEntry = JSON.parse(logContents.trim().split("\n").at(-1));

  assert.equal(logEntry.latitude, validPayload.latitude);
  assert.equal(logEntry.longitude, validPayload.longitude);
  assert.equal(logEntry.accuracy, validPayload.accuracy);
  assert.equal(logEntry.timestamp, validPayload.timestamp);
  assert.ok(logEntry.receivedAt);
  assert.ok("ip" in logEntry);
  assert.ok("userAgent" in logEntry);

  const invalidResponse = await fetch(`${baseUrl}/api/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...validPayload, latitude: 200 })
  });

  assert.equal(invalidResponse.status, 400);
  assert.deepEqual(await invalidResponse.json(), { error: "Invalid location payload" });
});

function createResponse() {
  return {
    body: undefined,
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test("Vercel location handler accepts valid payloads", async () => {
  await fs.rm(process.env.LOCATION_LOG_FILE, { force: true });

  const req = {
    body: {
      latitude: -1.286389,
      longitude: 36.817223,
      accuracy: 12,
      timestamp: "2026-06-12T10:30:00.000Z"
    },
    headers: {
      "user-agent": "node-test",
      "x-forwarded-for": "127.0.0.1"
    },
    method: "POST",
    socket: {
      remoteAddress: "127.0.0.1"
    }
  };
  const res = createResponse();

  await locationHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { status: "received" });

  const logContents = await fs.readFile(process.env.LOCATION_LOG_FILE, "utf8");
  const logEntry = JSON.parse(logContents.trim().split("\n").at(-1));

  assert.equal(logEntry.userAgent, "node-test");
  assert.equal(logEntry.ip, "127.0.0.1");
});
