# AGENTS.md

# Codex Agent Instructions

## Role

You are a coding agent building a consent-based location verification video web app.

Your job is to implement the project exactly according to `SPEC.md`.

The system must be simple, secure, and easy to run locally.

---

## Main Task

Create a Node.js + Express web application that:

1. Serves a frontend page.
2. Requests clear user permission for location access.
3. Starts location updates using `navigator.geolocation.watchPosition()`.
4. Shows an embedded YouTube video after permission is granted.
5. Sends location updates to the backend.
6. Logs valid location updates.
7. Lets the user stop sharing location.

---

## Important Ethical and Safety Requirements

Do not build hidden tracking.

Do not disguise the location request.

Do not trick the user into granting permission.

Do not collect location silently.

Do not remove the browser permission prompt.

Do not bypass browser security restrictions.

Do not continue tracking after the user clicks “Stop Sharing Location.”

The UI must clearly explain that location access is being requested.

---

## Implementation Instructions

### 1. Create Project Files

Create this structure:

```txt
public/
  index.html
  styles.css
  app.js
data/
  location-logs.jsonl
server.js
package.json
.env.example
.gitignore
README.md
SPEC.md
AGENTS.md
config.toml
```

---

### 2. Frontend Requirements

Implement the frontend using plain HTML, CSS, and JavaScript.

The page must include:

* App title
* Clear location permission explanation
* Button: `Allow Location and Continue`
* Status text area
* Hidden video player container
* Stop sharing button

Use this geolocation API:

```js
navigator.geolocation.watchPosition(successCallback, errorCallback, options)
```

Use these options:

```js
{
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
}
```

On first successful location update:

* Hide the consent screen.
* Show the video player.
* Show location sharing status.
* Send the location payload to backend.

For every later update:

* Send the new coordinates to backend.

When user clicks stop:

```js
navigator.geolocation.clearWatch(watchId)
```

Then:

* Stop location updates.
* Update UI status.

---

### 3. YouTube Embed

Use YouTube iframe embed format.

Do not redirect the user to YouTube.

Use placeholder video ID in code:

```txt
VIDEO_ID
```

Include a comment telling the developer to replace it.

Correct format:

```html
https://www.youtube.com/embed/VIDEO_ID
```

Do not use:

```html
https://youtube.com
```

as the iframe source.

---

### 4. Backend Requirements

Use Express.

Install dependencies:

```txt
express
helmet
cors
express-rate-limit
dotenv
```

Server must:

* Serve static files from `public`.
* Parse JSON body.
* Accept `POST /api/location`.
* Validate payload.
* Log valid payloads to console.
* Append valid payloads to `data/location-logs.jsonl`.
* Return `200 OK` quickly.
* Return `400` for invalid payloads.

---

### 5. Payload Validation

Accept only this required payload:

```json
{
  "latitude": "number",
  "longitude": "number",
  "accuracy": "number",
  "timestamp": "valid ISO date string"
}
```

Validation rules:

* Latitude must be between `-90` and `90`.
* Longitude must be between `-180` and `180`.
* Accuracy must be greater than or equal to `0`.
* Timestamp must be valid.

Reject bad payloads.

---

### 6. Logging Format

Append one JSON object per line to:

```txt
data/location-logs.jsonl
```

Each log entry should include:

```json
{
  "receivedAt": "server timestamp",
  "timestamp": "client timestamp",
  "latitude": 0,
  "longitude": 0,
  "accuracy": 0,
  "ip": "request ip",
  "userAgent": "browser user agent"
}
```

---

### 7. README Requirements

Create a README with:

* Project description
* Setup steps
* How to run locally
* How to replace YouTube video ID
* HTTPS requirement explanation
* Browser limitations
* Privacy note
* API endpoint documentation

---

### 8. Code Quality Rules

Use clean, simple code.

Add comments only where useful.

Do not over-engineer.

Do not add database unless requested.

Do not add authentication unless requested.

Do add tracking when permission is denied.

Do not add background tracking.

---

## Acceptance Checklist

Before finishing, verify:

* `npm install` works.
* `npm start` works.
* App opens at `http://localhost:3000`.
* Consent screen appears first.
* Video is hidden before permission.
* Geolocation permission is requested only after button click.
* Video appears after permission is granted.
* Location updates reach backend.
* Logs are written to `data/location-logs.jsonl`.
* Stop button clears the geolocation watcher.
* Permission denial displays a clear error.
* No deceptive or hidden tracking exists.
