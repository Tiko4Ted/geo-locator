const {
  appendLocationLog,
  createLocationLogEntry,
  isValidLocationPayload
} = require("../server");

function readJsonBody(req) {
  if (Buffer.isBuffer(req.body)) {
    return Promise.resolve(JSON.parse(req.body.toString("utf8")));
  }

  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === "string" && req.body.trim() !== "") {
    return Promise.resolve(JSON.parse(req.body));
  }

  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim() !== "") {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "";
}

module.exports = async function locationHandler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let payload;

  try {
    payload = await readJsonBody(req);
  } catch (error) {
    return res.status(400).json({ error: "Invalid location payload" });
  }

  if (!isValidLocationPayload(payload)) {
    return res.status(400).json({ error: "Invalid location payload" });
  }

  const entry = createLocationLogEntry(
    payload,
    getClientIp(req),
    req.headers["user-agent"] || ""
  );

  try {
    await appendLocationLog(entry);
    console.log("Location update received:", entry);
    return res.status(200).json({ status: "received" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};
