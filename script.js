const tracks = [
  { title: "Путь", artist: "Lo.Krain", src: "01-put.mp3" },
  { title: "Кофе с собой", artist: "Lo.Krain", src: "02-kofe-s-soboy.mp3" },
  { title: "Друг", artist: "Lo.Krain", src: "03-drug.mp3" },
  { title: "Небо тёмное", artist: "Lo.Krain", src: "04-nebo-temnoe.mp3" },
  { title: "Догола", artist: "Lo.Krain", src: "05-dogola.mp3" },
  { title: "Грустная музыка", artist: "Lo.Krain", src: "06-grustnaya-muzyka.mp3" },
  { title: "Декабрь", artist: "Lo.Krain", src: "07-dekabr.mp3" },
  { title: "17", artist: "Lo.Krain", src: "08-17.mp3" },
  { title: "Красиво", artist: "Lo.Krain", src: "09-krasivo.mp3" },
  { title: "Рассвет", artist: "Lo.Krain", src: "10-rassvet.mp3" }
];

const STORAGE_KEY = "lo-krain-io-player-state-v1";

const audio = document.getElementById("audio");
const trackTitle = document.getElementById("trackTitle");
const trackArtist = document.getElementById("trackArtist");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const volumeSlider = document.getElementById("volumeSlider");
const progress = document.getElementById("progress");
const progressWrap = document.getElementById("progressWrap");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const playlistEl = document.getElementById("playlist");
const playlistCount = document.getElementById("playlistCount");

let currentTrack = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = "all"; // all | one | off

playlistCount.textContent = `${tracks.length} tracks`;

function formatTime(time) {
  if (!isFinite(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function saveState() {
  const state = {
    currentTrack,
    currentTime: audio.currentTime || 0,
    volume: audio.volume,
    shuffle: isShuffle,
    repeatMode
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const state = JSON.parse(raw);

    if (typeof state.currentTrack === "number" && state.currentTrack >= 0 && state.currentTrack < tracks.length) {
      currentTrack = state.currentTrack;
    }

    if (typeof state.volume === "number") {
      audio.volume = state.volume;
      volumeSlider.value = state.volume;
    } else {
      audio.volume = 1;
      volumeSlider.value = 1;
    }

    if (typeof state.shuffle === "boolean") {
      isShuffle = state.shuffle;
    }

    if (typeof state.repeatMode === "string") {
      repeatMode = state.repeatMode;
    }

    updateShuffleButton();
    updateRepeatButton();

    return state.currentTime || 0;
  } catch (e) {
    console.error("Не удалось загрузить состояние плеера", e);
  }
}

function renderPlaylist() {
  playlistEl.innerHTML = "";

  tracks.forEach((track, index) => {
    const item = document.createElement("div");
    item.className = "track-item";
    if (index === currentTrack) item.classList.add("active");

    item.innerHTML = `
      <div class="track-num">${String(index + 1).padStart(2, "0")}</div>
      <div class="track-main">
        <div class="track-item-title">${track.title}</div>
        <div class="track-item-artist">${track.artist}</div>
      </div>
      <div class="track-status">${index === currentTrack && isPlaying ? "⏸" : "♪"}</div>
    `;

    item.addEventListener("click", () => {
      currentTrack = index;
      loadTrack(currentTrack, true);
    });

    playlistEl.appendChild(item);
  });
}

function updateActiveTrack() {
  const items = document.querySelectorAll(".track-item");

  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentTrack);
    const status = item.querySelector(".track-status");

    if (!status) return;

    if (index === currentTrack) {
      status.textContent = isPlaying ? "⏸" : "▶";
    } else {
      status.textContent = "♪";
    }
  });
}

function loadTrack(index, autoplay = false, restoreTime = 0) {
  const track = tracks[index];
  audio.src = track.src;
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  progress.style.width = "0%";
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";
  updateActiveTrack();
  saveState();

  audio.addEventListener(
    "loadedmetadata",
    function handleLoaded() {
      durationEl.textContent = formatTime(audio.duration);

      if (restoreTime > 0 && restoreTime < audio.duration) {
        audio.currentTime = restoreTime;
      }

      if (autoplay) {
        playTrack();
      }

      audio.removeEventListener("loadedmetadata", handleLoaded);
    },
    { once: true }
  );
}

function playTrack() {
  audio.play()
    .then(() => {
      isPlaying = true;
      playBtn.textContent = "⏸";
      updateActiveTrack();
      saveState();
    })
    .catch((err) => {
      console.error("Ошибка воспроизведения:", err);
      alert("Трек не удалось воспроизвести. Проверь, что mp3-файлы действительно загружены в репозиторий и доступны по тем именам, которые указаны в script.js.");
    });
}

function pauseTrack() {
  audio.pause();
  isPlaying = false;
  playBtn.textContent = "▶";
  updateActiveTrack();
  saveState();
}

function togglePlay() {
  if (!audio.src) return;
  if (isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

function getNextTrackIndex() {
  if (isShuffle) {
    if (tracks.length <= 1) return currentTrack;
    let next;
    do {
      next = Math.floor(Math.random() * tracks.length);
    } while (next === currentTrack);
    return next;
  }

  let next = currentTrack + 1;
  if (next >= tracks.length) next = 0;
  return next;
}

function nextTrack() {
  currentTrack = getNextTrackIndex();
  loadTrack(currentTrack, true);
}

function prevTrack() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  if (isShuffle) {
    currentTrack = getNextTrackIndex();
  } else {
    currentTrack--;
    if (currentTrack < 0) currentTrack = tracks.length - 1;
  }

  loadTrack(currentTrack, true);
}

function updateProgress() {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = `${percent}%`;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  durationEl.textContent = formatTime(audio.duration);
  saveState();
}

function setProgress(e) {
  const width = progressWrap.clientWidth;
  const clickX = e.offsetX;
  const duration = audio.duration;
  if (!duration) return;
  audio.currentTime = (clickX / width) * duration;
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  updateShuffleButton();
  saveState();
}

function updateShuffleButton() {
  shuffleBtn.textContent = `Shuffle: ${isShuffle ? "On" : "Off"}`;
  shuffleBtn.classList.toggle("active", isShuffle);
}

function cycleRepeatMode() {
  if (repeatMode === "all") {
    repeatMode = "one";
  } else if (repeatMode === "one") {
    repeatMode = "off";
  } else {
    repeatMode = "all";
  }

  updateRepeatButton();
  saveState();
}

function updateRepeatButton() {
  const label = repeatMode === "all" ? "All" : repeatMode === "one" ? "One" : "Off";
  repeatBtn.textContent = `Repeat: ${label}`;
  repeatBtn.classList.toggle("active", repeatMode !== "off");
}

playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);
shuffleBtn.addEventListener("click", toggleShuffle);
repeatBtn.addEventListener("click", cycleRepeatMode);

volumeSlider.addEventListener("input", (e) => {
  audio.volume = Number(e.target.value);
  saveState();
});

progressWrap.addEventListener("click", setProgress);

audio.addEventListener("timeupdate", updateProgress);

audio.addEventListener("pause", () => {
  isPlaying = false;
  playBtn.textContent = "▶";
  updateActiveTrack();
  saveState();
});

audio.addEventListener("play", () => {
  isPlaying = true;
  playBtn.textContent = "⏸";
  updateActiveTrack();
  saveState();
});

audio.addEventListener("ended", () => {
  if (repeatMode === "one") {
    audio.currentTime = 0;
    playTrack();
    return;
  }

  if (repeatMode === "off" && !isShuffle && currentTrack === tracks.length - 1) {
    pauseTrack();
    audio.currentTime = 0;
    return;
  }

  nextTrack();
});

const restoredTime = loadState() || 0;
loadTrack(currentTrack, false, restoredTime);
renderPlaylist();
updateShuffleButton();
updateRepeatButton();
