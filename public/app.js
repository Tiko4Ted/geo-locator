const allowButton = document.querySelector("#allowButton");
const stopButton = document.querySelector("#stopButton");
const consentPanel = document.querySelector("#consentPanel");
const videoSection = document.querySelector("#videoSection");
const statusText = document.querySelector("#statusText");
const statusIndicator = document.querySelector("#statusIndicator");

const locationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

let watchId = null;
let hasShownVideo = false;
let isSharing = false;

function setStatus(message, state = "idle") {
  statusText.textContent = message;
  statusIndicator.className = `status-indicator ${state}`;
}

function showVideo() {
  if (hasShownVideo) {
    return;
  }

  hasShownVideo = true;
  consentPanel.hidden = true;
  videoSection.hidden = false;
}

async function sendLocation(position) {
  const payload = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: new Date(position.timestamp).toISOString()
  };

  const response = await fetch("/api/location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Location update was rejected by the server.");
  }
}

async function handleLocationSuccess(position) {
  showVideo();
  setStatus("Location sharing is active.", "active");

  try {
    await sendLocation(position);
  } catch (error) {
    setStatus(`${error.message} New updates will continue while sharing is active.`, "warning");
  }
}

function handleLocationError(error) {
  isSharing = false;
  allowButton.disabled = false;
  allowButton.textContent = "Allow Location and Continue";

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  const messages = {
    1: "Location permission was denied. The video will remain hidden until permission is granted.",
    2: "Your location is currently unavailable. Check your device settings and try again.",
    3: "Getting your location took too long. Try again when your device has a better signal."
  };

  setStatus(messages[error.code] || "Unable to get your location.", "error");
}

function startLocationSharing() {
  if (!("geolocation" in navigator)) {
    setStatus("Geolocation is not supported by this browser.", "error");
    return;
  }

  if (isSharing) {
    return;
  }

  isSharing = true;
  allowButton.disabled = true;
  allowButton.textContent = "Waiting for permission...";
  setStatus("Waiting for your browser location permission.", "pending");

  watchId = navigator.geolocation.watchPosition(
    handleLocationSuccess,
    handleLocationError,
    locationOptions
  );
}

function stopLocationSharing() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  isSharing = false;
  setStatus("Location sharing stopped.", "stopped");
  stopButton.disabled = true;
}

allowButton.addEventListener("click", startLocationSharing);
stopButton.addEventListener("click", stopLocationSharing);
