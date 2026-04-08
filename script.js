const video = document.getElementById("video");
const playBtn = document.getElementById("playBtn");
const progress = document.getElementById("progress");
const volume = document.getElementById("volume");
const muteBtn = document.getElementById("muteBtn");

function updatePlayButtonText() {
  playBtn.textContent = video.paused ? "Play" : "Pause";
}

playBtn.addEventListener("click", () => {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
});

// Keep button label in sync with actual playback state.
video.addEventListener("play", updatePlayButtonText);
video.addEventListener("pause", updatePlayButtonText);
video.addEventListener("ended", updatePlayButtonText);

// Update progress bar while video plays.
video.addEventListener("timeupdate", () => {
  if (!video.duration) {
    progress.value = 0;
    return;
  }

  const value = (video.currentTime / video.duration) * 100;
  progress.value = value;
});

// Seek video when user drags bar.
progress.addEventListener("input", () => {
  if (!video.duration) {
    return;
  }

  const time = (progress.value / 100) * video.duration;
  video.currentTime = time;
});

// Set correct initial label.
updatePlayButtonText();

// Update volume when user drags bar.
volume.addEventListener("input", () => {
  video.volume = Number(volume.value);
});

muteBtn.addEventListener("click", () => {
  video.muted = !video.muted;
  muteBtn.textContent = video.muted ? "Unmute" : "Mute";
});

video.addEventListener("volumechange", () => {
  muteBtn.textContent = video.muted ? "Unmute" : "Mute";
});