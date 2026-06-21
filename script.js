const tracks = [
  { title: "Путь", file: "01-put.mp3" },
  { title: "Кофе с собой", file: "02-kofe-s-soboy.mp3" },
  { title: "Друг", file: "03-drug.mp3" },
  { title: "Небо тёмное", file: "04-nebo-temnoe.mp3" },
  { title: "Догола", file: "05-dogola.mp3" },
  { title: "Грустная музыка", file: "06-grustnaya-muzyka.mp3" },
  { title: "Декабрь", file: "07-dekabr.mp3" },
  { title: "17", file: "08-17.mp3" },
  { title: "Красиво", file: "09-krasivo.mp3" },
  { title: "Рассвет", file: "10-rassvet.mp3" }
];

const audio = document.getElementById("audio");
const playlistEl = document.getElementById("playlist");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const nowPlayingEl = document.getElementById("nowPlaying");
const progressBar = document.getElementById("progressBar");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

let currentTrack = 0;
let isPlaying = false;

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function renderPlaylist() {
  playlistEl.innerHTML = "";

  tracks.forEach((track, index) => {
    const li = document.createElement("li");
    li.className = "track";
    li.dataset.index = index;

    li.innerHTML = `
      <span class="track-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="track-title">${track.title}</span>
      <span class="track-status">Play</span>
    `;

    li.addEventListener("click", () => {
      if (currentTrack === index) {
        togglePlay();
      } else {
        loadTrack(index);
        playAudio();
      }
    });

    playlistEl.appendChild(li);
  });

  updateActiveTrack();
}

function updateActiveTrack() {
  const items = [...playlistEl.querySelectorAll(".track")];
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentTrack);
    const status = item.querySelector(".track-status");
    if (!status) return;

    if (index === currentTrack) {
      status.textContent = isPlaying ? "Playing" : "Ready";
    } else {
      status.textContent = "Play";
    }
  });
}

function loadTrack(index) {
  currentTrack = index;
  const track = tracks[currentTrack];
  audio.src = track.file;
  nowPlayingEl.textContent = track.title;
  progress.style.width = "0%";
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";
  updateActiveTrack();
  updateMediaSession();
}

function playAudio() {
  audio.play()
    .then(() => {
      isPlaying = true;
      playBtn.textContent = "Pause";
      updateActiveTrack();
      updateMediaSessionPlayback();
    })
    .catch((err) => {
      console.error("Playback error:", err);
    });
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  playBtn.textContent = "Play";
  updateActiveTrack();
  updateMediaSessionPlayback();
}

function togglePlay() {
  if (!audio.src) {
    loadTrack(currentTrack);
    playAudio();
    return;
  }

  if (isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function nextTrack(autoPlay = true) {
  currentTrack = (currentTrack + 1) % tracks.length;
  loadTrack(currentTrack);
  if (autoPlay) playAudio();
}

function prevTrack() {
  currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
  loadTrack(currentTrack);
  playAudio();
}

function updateProgress() {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = `${percent}%`;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  durationEl.textContent = formatTime(audio.duration);

  if ("mediaSession" in navigator && navigator.mediaSession.setPositionState) {
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: audio.currentTime
      });
    } catch (e) {}
  }
}

function seek(e) {
  if (!audio.duration) return;
  const rect = progressBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
  audio.currentTime = ratio * audio.duration;
}

function updateMediaSession() {
  if (!("mediaSession" in navigator)) return;

  const track = tracks[currentTrack];

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: "Lo.Krain",
    album: "Io",
    artwork: [
      { src: "cover.jpg", sizes: "512x512", type: "image/jpeg" },
      { src: "apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { src: "favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ]
  });

  navigator.mediaSession.setActionHandler("play", () => playAudio());
  navigator.mediaSession.setActionHandler("pause", () => pauseAudio());
  navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
  navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack(true));
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime != null) {
      audio.currentTime = details.seekTime;
    }
  });
}

function updateMediaSessionPlayback() {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
}

playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", prevTrack);
nextBtn.addEventListener("click", () => nextTrack(true));
progressBar.addEventListener("click", seek);

audio.addEventListener("timeupdate", updateProgress);

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("ended", () => {
  nextTrack(true);
});

audio.addEventListener("pause", () => {
  if (!audio.ended) {
    isPlaying = false;
    playBtn.textContent = "Play";
    updateActiveTrack();
    updateMediaSessionPlayback();
  }
});

audio.addEventListener("play", () => {
  isPlaying = true;
  playBtn.textContent = "Pause";
  updateActiveTrack();
  updateMediaSessionPlayback();
});

renderPlaylist();
loadTrack(0);
