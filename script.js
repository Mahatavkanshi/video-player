const video = document.getElementById("video");
const playBtn = document.getElementById("playBtn");
const progress = document.getElementById("progress");

playBtn.addEventListener("click", () => {
  if (video.paused) {
    video.play();
    playBtn.textContent = "Pause";
  } else {
    video.pause();
    playBtn.textContent = "Play";
  }

  // Update progress bar while video plays
video.addEventListener("timeupdate", () => {
  const value = (video.currentTime / video.duration) * 100;
  progress.value = value;
});

// Seek video when user drags bar
progress.addEventListener("input", () => {
  const time = (progress.value / 100) * video.duration;
  video.currentTime = time;
});
});