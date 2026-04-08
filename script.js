const video = document.getElementById("video");
const player = document.querySelector(".player");
const controls = document.querySelector(".controls");
const playBtn = document.getElementById("playBtn");
const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");
const progress = document.getElementById("progress");
const seekTooltip = document.getElementById("seekTooltip");
const timeDisplay = document.getElementById("timeDisplay");
const volume = document.getElementById("volume");
const muteIcon = document.getElementById("muteIcon");
const muteState = document.getElementById("muteState");
const speed = document.getElementById("speed");
const quality = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");
const subtitleToggleBtn = document.getElementById("subtitleToggleBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const settingsMain = document.getElementById("settingsMain");
const subtitleSubmenu = document.getElementById("subtitleSubmenu");
const speedSubmenu = document.getElementById("speedSubmenu");
const qualitySubmenu = document.getElementById("qualitySubmenu");
const subtitleMenuBtn = document.getElementById("subtitleMenuBtn");
const speedMenuBtn = document.getElementById("speedMenuBtn");
const qualityMenuBtn = document.getElementById("qualityMenuBtn");
const subtitleBackBtn = document.getElementById("subtitleBackBtn");
const speedBackBtn = document.getElementById("speedBackBtn");
const qualityBackBtn = document.getElementById("qualityBackBtn");
const subtitleLangWrap = document.getElementById("subtitleLangWrap");
const subtitleOffText = document.getElementById("subtitleOffText");
const subtitleSelect = document.getElementById("subtitleSelect");
const subtitleOptions = document.getElementById("subtitleOptions");
const subtitleValue = document.getElementById("subtitleValue");
const speedValue = document.getElementById("speedValue");
const speedOptions = document.getElementById("speedOptions");
const qualityOptions = document.getElementById("qualityOptions");
const pipBtn = document.getElementById("pipBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const theaterBtn = document.getElementById("theaterBtn");
const downloadBtn = document.getElementById("downloadBtn");
const loopToggle = document.getElementById("loopToggle");
const autoplayToggle = document.getElementById("autoplayToggle");
const statusText = document.getElementById("statusText");
const fileInput = document.getElementById("fileInput");
const dropHint = document.getElementById("dropHint");

const VOLUME_KEY = "playerVolume";
const MUTED_KEY = "playerMuted";
const SPEED_KEY = "playerSpeed";
const LOOP_KEY = "playerLoop";
const AUTOPLAY_KEY = "playerAutoplay";
const THEATER_KEY = "playerTheater";
const SUBTITLE_ENABLED_KEY = "playerSubtitlesEnabled";
const SUBTITLE_LANG_KEY = "playerSubtitleLanguage";
let hideControlsTimer;
let clickTimer;
let lastVolume = 1;
let currentFileName = "video.mp4";

function normalizeUrl(src) {
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return src;
  }
}

const rawQualitySources = Array.from(video.querySelectorAll("source"))
  .map((source, index) => ({
    src: source.getAttribute("src") || "",
    label: source.dataset.quality || `Option ${index + 1}`,
    type: source.getAttribute("type") || "video/mp4"
  }))
  .filter((item) => item.src);

const qualitySources = rawQualitySources.length
  ? rawQualitySources
  : [{ src: video.getAttribute("src") || "", label: "Auto", type: "video/mp4" }];

const KNOWN_VIDEO_EXTENSIONS = [
  "mp4",
  "m4v",
  "webm",
  "ogv",
  "ogg",
  "mov",
  "mkv",
  "avi",
  "wmv",
  "flv",
  "3gp",
  "mpeg",
  "mpg",
  "ts",
  "m2ts"
];

function getFileExtension(name) {
  const parts = String(name || "").toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function isLikelyVideoFile(file) {
  if (!file) {
    return false;
  }

  if (typeof file.type === "string" && file.type.startsWith("video/")) {
    return true;
  }

  const extension = getFileExtension(file.name);
  return KNOWN_VIDEO_EXTENSIONS.includes(extension);
}

function getCodecRecommendation(extension) {
  if (extension === "webm") {
    return "Try MP4 (H.264 + AAC) for best compatibility.";
  }

  if (["mkv", "avi", "wmv", "flv", "ts", "m2ts"].includes(extension)) {
    return "Convert to MP4 with H.264 video and AAC audio.";
  }

  if (["mov", "mpeg", "mpg", "3gp"].includes(extension)) {
    return "Re-encode to MP4 (H.264 + AAC) if playback fails.";
  }

  return "Try converting to MP4 (H.264 + AAC).";
}

function updateStatus(message) {
  statusText.textContent = message;
}

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

function updateSettingsSummaries() {
  const speedNumber = Number(speed.value);
  speedValue.textContent = speedNumber === 1 ? "Normal" : `${speedNumber}x`;

  const qualityLabel = quality.options[quality.selectedIndex]
    ? quality.options[quality.selectedIndex].text
    : "Auto";
  qualityValue.textContent = `Auto (${qualityLabel})`;

  const subtitleLabel = subtitleSelect.options[subtitleSelect.selectedIndex]
    ? subtitleSelect.options[subtitleSelect.selectedIndex].text
    : "Off";
  subtitleValue.textContent = subtitleLangWrap.classList.contains("hidden") ? "Off" : subtitleLabel;
}

function syncOptionList(container, selectedValue) {
  const rows = container.querySelectorAll(".optionItem");
  rows.forEach((row) => {
    row.classList.toggle("is-selected", row.dataset.value === selectedValue);
  });
}

function buildOptionList(container, selectElement, onSelect) {
  container.innerHTML = "";

  Array.from(selectElement.options).forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "optionItem";
    button.dataset.value = option.value;
    button.innerHTML = `<span>${option.text}</span><span class="checkMark">&#10003;</span>`;
    button.addEventListener("click", () => {
      selectElement.value = option.value;
      syncOptionList(container, option.value);
      onSelect();
    });
    container.appendChild(button);
  });

  syncOptionList(container, selectElement.value);
}

function updateSeekTooltip(clientX) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    seekTooltip.classList.add("hidden");
    return;
  }

  const rect = progress.getBoundingClientRect();
  if (!rect.width) {
    return;
  }

  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const previewTime = ratio * video.duration;
  seekTooltip.textContent = formatTime(previewTime);
  seekTooltip.style.left = `${ratio * rect.width}px`;
  seekTooltip.classList.remove("hidden");
}

function updateDownloadLink(src, fileName) {
  if (!src) {
    downloadBtn.removeAttribute("href");
    downloadBtn.removeAttribute("download");
    return;
  }

  downloadBtn.href = src;
  downloadBtn.setAttribute("download", fileName || "video.mp4");
}

function populateQualityOptions() {
  quality.innerHTML = "";

  if (!qualitySources.length) {
    const fallbackSrc = video.getAttribute("src") || video.currentSrc;
    if (!fallbackSrc) {
      quality.disabled = true;
      quality.innerHTML = '<option value="">N/A</option>';
      return;
    }

    const onlyOption = document.createElement("option");
    onlyOption.value = fallbackSrc;
    onlyOption.textContent = "Default";
    quality.appendChild(onlyOption);
    quality.disabled = true;
    return;
  }

  qualitySources.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = item.label;
    quality.appendChild(option);
  });

  quality.value = "0";
  quality.disabled = false;
  buildOptionList(qualityOptions, quality, () => {
    quality.dispatchEvent(new Event("change"));
  });
}

function activateSubtitleTrack(value) {
  const tracks = Array.from(video.textTracks);
  tracks.forEach((track) => {
    track.mode = "disabled";
  });

  const targetIndex = Number(value);
  if (!Number.isFinite(targetIndex) || !tracks[targetIndex]) {
    return;
  }

  tracks[targetIndex].mode = "showing";
}

function populateSubtitleOptions() {
  const trackElements = Array.from(video.querySelectorAll("track"));
  subtitleSelect.innerHTML = "";

  trackElements.forEach((trackElement, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = trackElement.label || trackElement.srclang || `Track ${index + 1}`;
    subtitleSelect.appendChild(option);
  });

  if (trackElements.length === 0) {
    const fallbackOption = document.createElement("option");
    fallbackOption.value = "";
    fallbackOption.textContent = "No subtitles";
    subtitleSelect.appendChild(fallbackOption);
    subtitleSelect.disabled = true;
    subtitleToggleBtn.disabled = true;
  } else {
    subtitleSelect.disabled = false;
    subtitleToggleBtn.disabled = false;
  }

  buildOptionList(subtitleOptions, subtitleSelect, () => {
    subtitleSelect.dispatchEvent(new Event("change"));
  });
}

function setSubtitlesEnabled(enabled) {
  if (enabled) {
    subtitleLangWrap.classList.remove("hidden");
    subtitleOffText.classList.add("hidden");
    subtitleToggleBtn.textContent = "CC";
    subtitleToggleBtn.classList.add("is-active");
    activateSubtitleTrack(subtitleSelect.value);
    localStorage.setItem(SUBTITLE_ENABLED_KEY, "true");
    updateStatus(`Subtitles: ${subtitleSelect.options[subtitleSelect.selectedIndex].text}`);
    updateSettingsSummaries();
    return;
  }

  subtitleLangWrap.classList.add("hidden");
  subtitleOffText.classList.remove("hidden");
  subtitleToggleBtn.textContent = "CC";
  subtitleToggleBtn.classList.remove("is-active");
  Array.from(video.textTracks).forEach((track) => {
    track.mode = "disabled";
  });
  localStorage.setItem(SUBTITLE_ENABLED_KEY, "false");
  updateStatus("Subtitles off");
  updateSettingsSummaries();
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

  if (!settingsPanel.classList.contains("hidden")) {
    return;
  }

  hideControlsTimer = setTimeout(() => {
    player.classList.add("hide-controls");
  }, 2000);
}

function setSettingsPanelOpen(open) {
  settingsPanel.classList.toggle("hidden", !open);
  settingsBtn.classList.toggle("is-active", open);
  if (open) {
    showSettingsView("main", "back");
    showControls();
    return;
  }
  scheduleHideControls();
}

function showSettingsView(view, direction = "forward") {
  const panes = {
    main: settingsMain,
    subtitle: subtitleSubmenu,
    speed: speedSubmenu,
    quality: qualitySubmenu
  };

  Object.values(panes).forEach((pane) => {
    pane.classList.add("hidden");
    pane.classList.remove("slide-in-forward", "slide-in-back");
  });

  const targetPane = panes[view] || settingsMain;
  targetPane.classList.remove("hidden");
  targetPane.classList.add(direction === "back" ? "slide-in-back" : "slide-in-forward");
}

function updatePlayButtonText() {
  const isPlaying = !video.paused;
  playBtn.classList.toggle("is-playing", isPlaying);
  playBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
}

function updateVolumeIcon() {
  const isMuted = video.muted;
  muteIcon.classList.toggle("is-muted", isMuted);
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

progress.addEventListener("mousemove", (event) => {
  updateSeekTooltip(event.clientX);
});

progress.addEventListener("mouseenter", (event) => {
  updateSeekTooltip(event.clientX);
});

progress.addEventListener("mouseleave", () => {
  seekTooltip.classList.add("hidden");
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
  syncOptionList(speedOptions, speed.value);
  updateSettingsSummaries();
});

quality.addEventListener("change", () => {
  const selected = qualitySources[Number(quality.value)];
  if (!selected) {
    return;
  }

  const nextSrc = selected.src;
  if (!nextSrc) {
    return;
  }

  updateDownloadLink(nextSrc, `video-${selected.label}.mp4`);
  syncOptionList(qualityOptions, quality.value);
  updateSettingsSummaries();

  const currentTime = video.currentTime;
  const wasPaused = video.paused;
  const activeRate = video.playbackRate;
  const currentSrc = normalizeUrl(video.currentSrc || video.getAttribute("src") || "");
  const targetSrc = normalizeUrl(nextSrc);

  if (currentSrc === targetSrc) {
    updateStatus(`Quality set to ${selected.label}`);
    return;
  }

  video.src = nextSrc;
  video.load();

  video.addEventListener(
    "loadedmetadata",
    () => {
      const safeTime = Number.isFinite(video.duration)
        ? Math.min(currentTime, Math.max(video.duration - 0.25, 0))
        : 0;
      video.currentTime = safeTime;
      video.playbackRate = activeRate;
      if (!wasPaused) {
        video.play().catch((err) => {
          console.error("Play after quality switch failed:", err);
        });
      }
      updateStatus(`Quality changed to ${selected.label}`);
    },
    { once: true }
  );
});

subtitleSelect.addEventListener("change", () => {
  localStorage.setItem(SUBTITLE_LANG_KEY, subtitleSelect.value);
  syncOptionList(subtitleOptions, subtitleSelect.value);
  updateSettingsSummaries();
  if (subtitleLangWrap.classList.contains("hidden")) {
    return;
  }
  activateSubtitleTrack(subtitleSelect.value);
  updateStatus(`Subtitles: ${subtitleSelect.options[subtitleSelect.selectedIndex].text}`);
});

subtitleToggleBtn.addEventListener("click", () => {
  const enabled = subtitleLangWrap.classList.contains("hidden");
  setSubtitlesEnabled(enabled);
});

settingsBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  const willOpen = settingsPanel.classList.contains("hidden");
  setSettingsPanelOpen(willOpen);
});

subtitleMenuBtn.addEventListener("click", () => {
  showSettingsView("subtitle", "forward");
});

speedMenuBtn.addEventListener("click", () => {
  showSettingsView("speed", "forward");
});

qualityMenuBtn.addEventListener("click", () => {
  showSettingsView("quality", "forward");
});

subtitleBackBtn.addEventListener("click", () => {
  showSettingsView("main", "back");
});

speedBackBtn.addEventListener("click", () => {
  showSettingsView("main", "back");
});

qualityBackBtn.addEventListener("click", () => {
  showSettingsView("main", "back");
});

settingsPanel.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", () => {
  if (!settingsPanel.classList.contains("hidden")) {
    setSettingsPanelOpen(false);
  }
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
    } else {
      await video.requestPictureInPicture();
    }
  } catch (err) {
    console.error("PiP failed:", err);
  }
});

video.addEventListener("enterpictureinpicture", () => {
  pipBtn.classList.add("is-active");
});

video.addEventListener("leavepictureinpicture", () => {
  pipBtn.classList.remove("is-active");
});

fullscreenBtn.addEventListener("click", async () => {
  setSettingsPanelOpen(false);
  try {
    if (!document.fullscreenElement) {
      await video.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (err) {
    console.error("Fullscreen failed:", err);
  }
});

document.addEventListener("fullscreenchange", () => {
  fullscreenBtn.classList.toggle("is-fullscreen", Boolean(document.fullscreenElement));
});

function loadVideoFile(file) {
  if (!isLikelyVideoFile(file)) {
    updateStatus("Please choose a supported video file");
    return;
  }

  const fileUrl = URL.createObjectURL(file);
  currentFileName = file.name || "video.mp4";
  const extension = getFileExtension(currentFileName);

  const handleLoaded = () => {
    video.removeEventListener("loadeddata", handleLoaded);
    video.removeEventListener("error", handleError);
    updateStatus("Video loaded");
  };

  const handleError = () => {
    video.removeEventListener("loadeddata", handleLoaded);
    video.removeEventListener("error", handleError);
    const recommendation = getCodecRecommendation(extension);
    updateStatus(`This file opened but cannot be decoded in this browser. ${recommendation}`);
  };

  video.addEventListener("loadeddata", handleLoaded, { once: true });
  video.addEventListener("error", handleError, { once: true });

  video.src = fileUrl;
  video.load();
  quality.innerHTML = '<option value="0">Source file</option>';
  quality.disabled = true;
  buildOptionList(qualityOptions, quality, () => {
    quality.dispatchEvent(new Event("change"));
  });
  updateDownloadLink(fileUrl, currentFileName);
  setSubtitlesEnabled(false);
  updateSettingsSummaries();
  updateStatus("Local video loaded");
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
    case "t":
      event.preventDefault();
      theaterBtn.click();
      break;
    case "c":
      event.preventDefault();
      subtitleToggleBtn.click();
      break;
    case "escape":
      setSettingsPanelOpen(false);
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

loopToggle.addEventListener("change", () => {
  video.loop = loopToggle.checked;
  localStorage.setItem(LOOP_KEY, String(loopToggle.checked));
  updateStatus(loopToggle.checked ? "Loop enabled" : "Loop disabled");
});

autoplayToggle.addEventListener("change", () => {
  video.autoplay = autoplayToggle.checked;
  localStorage.setItem(AUTOPLAY_KEY, String(autoplayToggle.checked));
  updateStatus(autoplayToggle.checked ? "Autoplay enabled" : "Autoplay disabled");
});

theaterBtn.addEventListener("click", () => {
  player.classList.toggle("theater-mode");
  const isTheater = player.classList.contains("theater-mode");
  theaterBtn.classList.toggle("is-active", isTheater);
  localStorage.setItem(THEATER_KEY, String(isTheater));
  updateStatus(isTheater ? "Theater mode on" : "Theater mode off");
});

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

const savedLoop = localStorage.getItem(LOOP_KEY) === "true";
loopToggle.checked = savedLoop;
video.loop = savedLoop;

const savedAutoplay = localStorage.getItem(AUTOPLAY_KEY) === "true";
autoplayToggle.checked = savedAutoplay;
video.autoplay = savedAutoplay;

const savedTheater = localStorage.getItem(THEATER_KEY) === "true";
if (savedTheater) {
  player.classList.add("theater-mode");
  theaterBtn.classList.add("is-active");
}

populateQualityOptions();
populateSubtitleOptions();
buildOptionList(speedOptions, speed, () => {
  speed.dispatchEvent(new Event("change"));
});
updateSettingsSummaries();

const savedSubtitleLanguage = localStorage.getItem(SUBTITLE_LANG_KEY);
if (savedSubtitleLanguage && subtitleSelect.querySelector(`option[value="${savedSubtitleLanguage}"]`)) {
  subtitleSelect.value = savedSubtitleLanguage;
}

const subtitlesEnabled = localStorage.getItem(SUBTITLE_ENABLED_KEY) === "true";
setSubtitlesEnabled(subtitlesEnabled);

if (qualitySources.length) {
  const defaultQualityLabel = qualitySources[0].label || "default";
  updateDownloadLink(qualitySources[0].src, `video-${defaultQualityLabel}.mp4`);
} else {
  const fallbackSrc = video.getAttribute("src") || video.currentSrc;
  updateDownloadLink(fallbackSrc, currentFileName);
}

updatePlayButtonText();
updateVolumeIcon();
updateTimeDisplay();
updateStatus("Ready");
