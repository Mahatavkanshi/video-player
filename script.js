const video = document.getElementById("video");
const player = document.querySelector(".player");
const controls = document.querySelector(".controls");
const playBtn = document.getElementById("playBtn");
const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("timeDisplay");
const volume = document.getElementById("volume");
const muteIcon = document.getElementById("muteIcon");
const muteState = document.getElementById("muteState");
const speed = document.getElementById("speed");
const pipBtn = document.getElementById("pipBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const fileInput = document.getElementById("fileInput");
const dropHint = document.getElementById("dropHint");

const VOLUME_KEY = "playerVolume";
const MUTED_KEY = "playerMuted";
const SPEED_KEY = "playerSpeed";
let hideControlsTimer;
let clickTimer;
let lastVolume = 1;

function formatTime(value) {
  if (!Number.isFinite(value)) {
    return "00:00";
  }

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateTimeDisplay() {
  timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
}

function getCurrentVideoKey() {
  const src = video.currentSrc || video.getAttribute("src") || "default-video";
  if (src.startsWith("blob:")) {
    return null;
  }
  return `playerTime:${src}`;
}

function savePlaybackPosition() {
  const key = getCurrentVideoKey();
  if (!key || !Number.isFinite(video.currentTime)) {
    return;
  }

  localStorage.setItem(key, String(video.currentTime));
}

function restorePlaybackPosition() {
  const key = getCurrentVideoKey();
  if (!key) {
    return;
  }

  const stored = Number(localStorage.getItem(key));
  if (!Number.isFinite(stored) || stored <= 0) {
    return;
  }

  if (video.duration && stored < video.duration) {
    video.currentTime = stored;
  }
}

function showControls() {
  player.classList.remove("hide-controls");
}

function scheduleHideControls() {
  clearTimeout(hideControlsTimer);
  if (video.paused) {
    return;
  }

  hideControlsTimer = setTimeout(() => {
    player.classList.add("hide-controls");
  }, 2000);
}

function updatePlayButtonText() {
  playBtn.textContent = video.paused ? "Play" : "Pause";
}

function updateVolumeIcon() {
  const isMuted = video.muted;
  muteIcon.innerHTML = isMuted ? "&#128263;" : "&#128266;";
  muteState.textContent = isMuted ? "Muted" : "Unmuted";
  muteIcon.title = isMuted ? "Unmute" : "Mute";
  muteIcon.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
}

playBtn.addEventListener("click", () => {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
});

video.addEventListener("click", () => {
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, 200);
});

video.addEventListener("dblclick", () => {
  clearTimeout(clickTimer);
  if (!document.fullscreenElement) {
    video.requestFullscreen().catch((err) => {
      console.error("Fullscreen failed:", err);
    });
  } else {
    document.exitFullscreen().catch((err) => {
      console.error("Exit fullscreen failed:", err);
    });
  }
});

backBtn.addEventListener("click", () => {
  video.currentTime = Math.max(0, video.currentTime - 5);
});

forwardBtn.addEventListener("click", () => {
  const endTime = Number.isFinite(video.duration) ? video.duration : video.currentTime + 5;
  video.currentTime = Math.min(endTime, video.currentTime + 5);
});

progress.addEventListener("input", () => {
  if (!video.duration) {
    return;
  }

  const time = (Number(progress.value) / 100) * video.duration;
  video.currentTime = time;
});

video.addEventListener("timeupdate", () => {
  if (!video.duration) {
    progress.value = 0;
    updateTimeDisplay();
    return;
  }

  const value = (video.currentTime / video.duration) * 100;
  progress.value = value;
  updateTimeDisplay();
  savePlaybackPosition();
});

volume.addEventListener("input", () => {
  const newVolume = Number(volume.value);
  video.volume = newVolume;

  if (newVolume === 0) {
    video.muted = true;
    return;
  }

  lastVolume = newVolume;
  if (video.muted) {
    video.muted = false;
  }
});

muteIcon.addEventListener("click", () => {
  if (video.muted || video.volume === 0) {
    video.muted = false;
    if (video.volume === 0) {
      const restoredVolume = lastVolume > 0 ? lastVolume : 0.5;
      video.volume = restoredVolume;
      volume.value = String(restoredVolume);
    }
    return;
  }

  if (video.volume > 0) {
    lastVolume = video.volume;
  }
  video.muted = true;
});

speed.addEventListener("change", () => {
  video.playbackRate = Number(speed.value);
  localStorage.setItem(SPEED_KEY, speed.value);
});

video.addEventListener("volumechange", () => {
  if (!video.muted) {
    volume.value = String(video.volume);
  }
  localStorage.setItem(VOLUME_KEY, String(video.volume));
  localStorage.setItem(MUTED_KEY, String(video.muted));
  updateVolumeIcon();
});

pipBtn.addEventListener("click", async () => {
  if (!document.pictureInPictureEnabled) {
    return;
  }

  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      pipBtn.textContent = "PiP";
    } else {
      await video.requestPictureInPicture();
      pipBtn.textContent = "Exit PiP";
    }
  } catch (err) {
    console.error("PiP failed:", err);
  }
});

video.addEventListener("enterpictureinpicture", () => {
  pipBtn.textContent = "Exit PiP";
});

video.addEventListener("leavepictureinpicture", () => {
  pipBtn.textContent = "PiP";
});

fullscreenBtn.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await video.requestFullscreen();
      fullscreenBtn.textContent = "Exit Fullscreen";
    } else {
      await document.exitFullscreen();
      fullscreenBtn.textContent = "Fullscreen";
    }
  } catch (err) {
    console.error("Fullscreen failed:", err);
  }
});

document.addEventListener("fullscreenchange", () => {
  fullscreenBtn.textContent = document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen";
});

function loadVideoFile(file) {
  if (!file || !file.type.startsWith("video/")) {
    return;
  }

  const fileUrl = URL.createObjectURL(file);
  video.src = fileUrl;
  video.load();
  video.play().catch((err) => {
    console.error("Autoplay blocked by browser:", err);
  });
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  loadVideoFile(file);
});

["dragenter", "dragover"].forEach((eventName) => {
  player.addEventListener(eventName, (event) => {
    event.preventDefault();
    player.classList.add("drag-over");
    dropHint.style.display = "flex";
  });
});

["dragleave", "dragend"].forEach((eventName) => {
  player.addEventListener(eventName, () => {
    player.classList.remove("drag-over");
    dropHint.style.display = "";
  });
});

player.addEventListener("drop", (event) => {
  event.preventDefault();
  player.classList.remove("drag-over");
  dropHint.style.display = "";
  const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  loadVideoFile(file);
});

window.addEventListener("beforeunload", savePlaybackPosition);

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement ? document.activeElement.tagName : "";
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
    return;
  }

  switch (event.key.toLowerCase()) {
    case " ":
    case "k":
      event.preventDefault();
      playBtn.click();
      break;
    case "arrowleft":
      event.preventDefault();
      backBtn.click();
      break;
    case "arrowright":
      event.preventDefault();
      forwardBtn.click();
      break;
    case "arrowup":
      event.preventDefault();
      video.volume = Math.min(1, Number((video.volume + 0.05).toFixed(2)));
      video.muted = false;
      break;
    case "arrowdown":
      event.preventDefault();
      video.volume = Math.max(0, Number((video.volume - 0.05).toFixed(2)));
      if (video.volume === 0) {
        video.muted = true;
      }
      break;
    case "m":
      event.preventDefault();
      muteIcon.click();
      break;
    case "f":
      event.preventDefault();
      fullscreenBtn.click();
      break;
    default:
      break;
  }
});

video.addEventListener("play", updatePlayButtonText);
video.addEventListener("pause", updatePlayButtonText);
video.addEventListener("ended", updatePlayButtonText);
video.addEventListener("loadedmetadata", () => {
  restorePlaybackPosition();
  updateTimeDisplay();
});
video.addEventListener("play", () => {
  showControls();
  scheduleHideControls();
});
video.addEventListener("pause", () => {
  clearTimeout(hideControlsTimer);
  showControls();
});

player.addEventListener("mousemove", () => {
  showControls();
  scheduleHideControls();
});

controls.addEventListener("mouseenter", showControls);
controls.addEventListener("mouseleave", scheduleHideControls);

const savedVolume = Number(localStorage.getItem(VOLUME_KEY));
if (Number.isFinite(savedVolume)) {
  video.volume = Math.min(1, Math.max(0, savedVolume));
  if (video.volume > 0) {
    lastVolume = video.volume;
  }
}

const savedMuted = localStorage.getItem(MUTED_KEY);
if (savedMuted === "true") {
  video.muted = true;
}

if (video.volume === 0) {
  video.muted = true;
}

const savedSpeed = localStorage.getItem(SPEED_KEY);
if (savedSpeed) {
  speed.value = savedSpeed;
  video.playbackRate = Number(savedSpeed);
}

updatePlayButtonText();
updateVolumeIcon();
updateTimeDisplay();
