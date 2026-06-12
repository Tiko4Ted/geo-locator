# Consent Location Video App

This is a Node.js and Express web app that shows an embedded YouTube video only after the user grants browser location permission. Location updates are sent to the backend while sharing is active and are appended to a private JSONL log file.

The app is intentionally explicit: it does not hide tracking, bypass the browser permission prompt, or continue collecting location data after the user stops sharing.

## Setup

```bash
npm install
npm start
```

Open:

```txt
http://localhost:3000
```

## Replace The YouTube Video

Edit `public/index.html` and replace `VIDEO_ID` in this iframe URL with the actual YouTube video ID:

```html
https://www.youtube.com/embed/VIDEO_ID
```

Keep the `/embed/` format so the user remains on this site while watching.

## HTTPS Requirement

Browser geolocation works on secure origins. `localhost` is allowed for local development, but production deployments must use HTTPS or browsers will block the location prompt.

## Browser Limitations

Location sharing stops when the user closes the tab or leaves the site. Mobile browsers may pause or reduce updates when the phone is locked, the browser is backgrounded, or battery-saving behavior is active. This web app cannot track continuously in the background like a native mobile app.

## Privacy Note

The frontend sends only latitude, longitude, accuracy, and the browser-reported timestamp. The backend adds the server receive time, request IP, and user-agent to the local JSONL log. Do not expose `data/location-logs.jsonl` publicly, and do not commit real location logs.

Users can click `Stop Sharing Location` at any time. That calls `navigator.geolocation.clearWatch()` and stops new browser location updates.

## API

### `POST /api/location`

Request body:

```json
{
  "latitude": -1.286389,
  "longitude": 36.817223,
  "accuracy": 12,
  "timestamp": "2026-06-12T10:30:00.000Z"
}
```

Validation:

- `latitude` must be a number from `-90` to `90`.
- `longitude` must be a number from `-180` to `180`.
- `accuracy` must be a number greater than or equal to `0`.
- `timestamp` must be a valid date string.

Successful response:

```json
{
  "status": "received"
}
```

Invalid response:

```json
{
  "error": "Invalid location payload"
}
```

Invalid payloads return HTTP `400`.
