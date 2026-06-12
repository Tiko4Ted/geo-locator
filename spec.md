# Consent-Based Location Verification Video App

## 1. Project Objective

Build a web application that allows a user to watch an embedded YouTube video after they give clear permission for location access.

The app must keep the user on the same website by embedding the YouTube video inside the page instead of redirecting them to YouTube. This allows the app to verify the user's location while the video page remains open.

This system must be built with clear user consent, visible disclosure, and safe data handling.

---

## 2. Core Goal

The application should:

1. Display a location permission screen before showing the video.
2. Explain why location permission is needed.
3. Request browser geolocation permission using `navigator.geolocation`.
4. Show the embedded YouTube video only after permission is granted.
5. Send allowed location updates to the backend.
6. Store or log the location updates securely.
7. Allow the user to stop location sharing.
8. Avoid hidden or deceptive tracking.

---

## 3. Important Safety and Privacy Rules

The system must NOT:

* Track users secretly.
* Mislead users about why location is being requested.
* Continue collecting data after the user stops sharing or leaves the page.
* Pretend the user is going to YouTube while actually tracking them.
* Use fake wording such as "verification required" unless there is a real business/legal reason.
* Collect unnecessary personal information.
* Sell or expose user location data.

The system MUST:

* Clearly tell the user that location access is required before video playback.
* Ask for permission using the browser's native geolocation prompt.
* Show a visible location-sharing status.
* Include a "Stop Sharing Location" button.
* Send only necessary location fields.
* Handle permission denial gracefully.
* Use HTTPS in production.
* Work on `localhost` during development.

---

## 4. Main User Flow

### Step 1: User opens the shared website link

The user lands on a page containing:

* App title
* Short explanation
* Location permission notice
* "Allow Location and Continue" button

The video must not be visible yet.

---

### Step 2: User grants location permission

When the user clicks the button:

* The frontend calls `navigator.geolocation.watchPosition()`.
* The browser displays the native location permission popup.
* If permission is granted, the app receives the first location fix.
* The video player becomes visible.
* The app begins sending location updates to the backend.

---

### Step 3: User watches embedded YouTube video

The video should be embedded using a YouTube iframe.

The user should remain on the app domain while watching the video.

Example iframe format:

```html
<iframe
  width="100%"
  height="450"
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="Embedded video player"
  frameborder="0"
  allow="autoplay; encrypted-media; picture-in-picture"
  allowfullscreen>
</iframe>
```

The developer must replace `VIDEO_ID` with the actual YouTube video ID.

---

### Step 4: Location updates are sent to the backend

The frontend should send location data to:

```txt
POST /api/location
```

Payload format:

```json
{
  "latitude": -1.286389,
  "longitude": 36.817223,
  "accuracy": 12,
  "timestamp": "2026-06-12T10:30:00.000Z"
}
```

Optional safe fields:

```json
{
  "sessionId": "random-session-id",
  "userAgent": "browser user agent"
}
```

Do not collect unnecessary private data.

---

### Step 5: User can stop sharing

The frontend must include a visible button:

```txt
Stop Sharing Location
```

When clicked:

* Call `navigator.geolocation.clearWatch(watchId)`.
* Stop sending updates.
* Update the UI status to "Location sharing stopped."
* Video playback may continue unless the product requirement says otherwise.

---

## 5. Technical Requirements

### Frontend

Use a simple frontend page.

Recommended files:

```txt
public/
  index.html
  styles.css
  app.js
```

Frontend responsibilities:

* Display consent screen.
* Request geolocation permission.
* Start `watchPosition`.
* Send location updates to backend.
* Show video after permission is granted.
* Show errors when permission is denied.
* Provide stop-sharing button.
* Avoid repeated unnecessary requests.

---

### Backend

Use Node.js with Express.

Recommended files:

```txt
server.js
package.json
.env.example
data/
  location-logs.jsonl
```

Backend responsibilities:

* Serve static frontend files.
* Accept location updates from the frontend.
* Validate incoming payloads.
* Save logs to console or file.
* Return fast `200 OK` responses.
* Avoid blocking the frontend.
* Add basic security middleware.

Recommended endpoint:

```txt
POST /api/location
```

Recommended response:

```json
{
  "status": "received"
}
```

---

## 6. Backend Validation Rules

The backend must validate:

* `latitude` must be a number between `-90` and `90`.
* `longitude` must be a number between `-180` and `180`.
* `accuracy` must be a positive number.
* `timestamp` must be a valid date string.

If validation fails, return:

```json
{
  "error": "Invalid location payload"
}
```

Status code:

```txt
400
```

---

## 7. Data Storage

For the first version, store location updates in a `.jsonl` file.

Each line should be one JSON object.

Example:

```json
{"timestamp":"2026-06-12T10:30:00.000Z","latitude":-1.286389,"longitude":36.817223,"accuracy":12,"ip":"127.0.0.1"}
```

Do not expose this file publicly.

Later, this can be upgraded to:

* PostgreSQL
* MongoDB
* SQLite
* Supabase

---

## 8. Security Requirements

Use:

* `helmet`
* `cors`
* `express-rate-limit`
* `express.json()`

The app must:

* Run on HTTPS in production.
* Support local development on `localhost`.
* Avoid exposing logs publicly.
* Avoid storing secrets in code.
* Include `.env.example`.

---

## 9. Browser Limitations

The app must document these limitations:

1. If the user closes the tab, tracking stops.
2. If the user leaves the site, tracking stops.
3. If the user locks the phone or backgrounds the browser, updates may pause.
4. Mobile browsers may reduce location update frequency to save battery.
5. The app cannot track continuously in the background like a native mobile app.
6. If the user opens the video directly in YouTube, the page script stops running.

---

## 10. Expected Final Project Structure

```txt
location-video-app/
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

## 11. Success Criteria

The project is complete when:

* The app runs locally using `npm install` and `npm start`.
* Visiting `http://localhost:3000` shows the consent screen.
* The video is hidden before permission.
* The video appears after location permission is granted.
* Location updates are posted to `/api/location`.
* Backend validates and logs received coordinates.
* User can stop sharing location.
* Permission denial shows a useful error message.
* No hidden tracking exists.
* README explains setup, HTTPS requirement, and browser limitations.

---

## 12. Development Command

Expected command:

```bash
npm install
npm start
```

Server should run on:

```txt
http://localhost:3000
```
