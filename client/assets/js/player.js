// ============================================
// player.js — Xử lý Player: phát nhạc, tua, âm lượng
// ============================================

const Player = (() => {
  // ---- State ----
  let state = {
    queue: [], // Danh sách chờ
    currentIndex: -1, // Vị trí bài hiện tại
    isPlaying: false,
    isShuffle: false,
    repeatMode: "none", // 'none' | 'all' | 'one'
    volume: 0.7,
    isMuted: false,
    prevVolume: 0.7,
    likedSongs: new Set(),
  };

  // ---- DOM refs ----
  let audio = null;
  let progressDrag = false;

  // ---- Elements ----
  const el = {};

  function bindElements() {
    el.playerBar = document.querySelector(".player-bar");
    el.thumb = document.querySelector(".player-thumb");
    el.trackName = document.querySelector(".player-track-name");
    el.trackArtist = document.querySelector(".player-track-artist");
    el.btnLike = document.querySelector(".btn-like");

    el.btnPrev = document.getElementById("btn-prev");
    el.btnPlay = document.getElementById("btn-play");
    el.btnNext = document.getElementById("btn-next");
    el.btnShuffle = document.getElementById("btn-shuffle");
    el.btnRepeat = document.getElementById("btn-repeat");

    el.progressTrack = document.querySelector(".progress-bar-track");
    el.progressFill = document.querySelector(".progress-bar-fill");
    el.progressHandle = document.querySelector(".progress-bar-handle");
    el.currentTime = document.getElementById("current-time");
    el.totalTime = document.getElementById("total-time");

    el.volumeSlider = document.querySelector(".volume-slider");
    el.btnMute = document.getElementById("btn-mute");
    el.visualizer = document.querySelector(".player-visualizer");
  }

  // ---- Init ----
  function init() {
    audio = new Audio();
    audio.volume = state.volume;
    audio.preload = "metadata";

    bindElements();
    bindEvents();
    updateVolumeUI();

    // Load liked songs từ cache
    try {
      const liked = JSON.parse(localStorage.getItem("sp_liked") || "[]");
      state.likedSongs = new Set(liked);
    } catch {}

    console.log("[Player] Đã khởi tạo");
  }

  // ---- Load & Play ----

  /**
   * Tải và phát một bài hát
   * @param {object} song  - { _id, title, artist, album, audioUrl, coverUrl, duration }
   * @param {Array}  queue - danh sách bài phát sau (optional)
   * @param {number} index - vị trí trong queue
   */
  function loadSong(song, queue = null, index = 0) {
    if (!song) return;

    if (queue) {
      state.queue = queue;
      state.currentIndex = index;
    } else {
      state.queue = [song];
      state.currentIndex = 0;
    }

    // Cập nhật audio source
    audio.src = song.audioUrl;
    audio.load();

    // Cập nhật UI
    updateNowPlayingUI(song);

    // Phát
    playSong();
  }

  function playSong() {
    audio
      .play()
      .then(() => {
        state.isPlaying = true;
        updatePlayButton();
        el.playerBar?.classList.remove("paused");
      })
      .catch((err) => {
        console.warn("[Player] Không thể phát:", err.message);
      });
  }

  function pauseSong() {
    audio.pause();
    state.isPlaying = false;
    updatePlayButton();
    el.playerBar?.classList.add("paused");
  }

  function togglePlay() {
    if (!audio.src) return;
    state.isPlaying ? pauseSong() : playSong();
  }

  // ---- Navigation ----
  function playNext() {
    if (state.queue.length === 0) return;

    if (state.repeatMode === "one") {
      audio.currentTime = 0;
      playSong();
      return;
    }

    let nextIndex;
    if (state.isShuffle) {
      nextIndex = getRandomIndex(state.queue.length, state.currentIndex);
    } else {
      nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.queue.length) {
        if (state.repeatMode === "all") {
          nextIndex = 0;
        } else {
          pauseSong();
          return;
        }
      }
    }

    state.currentIndex = nextIndex;
    const song = state.queue[nextIndex];
    audio.src = song.audioUrl;
    audio.load();
    updateNowPlayingUI(song);
    playSong();
  }

  function playPrev() {
    // Nếu đã phát hơn 3s → tua về đầu
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    let prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = state.repeatMode === "all" ? state.queue.length - 1 : 0;
    }

    state.currentIndex = prevIndex;
    const song = state.queue[prevIndex];
    audio.src = song.audioUrl;
    audio.load();
    updateNowPlayingUI(song);
    playSong();
  }

  function getRandomIndex(length, excludeIndex) {
    if (length <= 1) return 0;
    let rand;
    do {
      rand = Math.floor(Math.random() * length);
    } while (rand === excludeIndex);
    return rand;
  }

  // ---- Shuffle & Repeat ----
  function toggleShuffle() {
    state.isShuffle = !state.isShuffle;
    el.btnShuffle?.classList.toggle("active", state.isShuffle);
  }

  function cycleRepeat() {
    const modes = ["none", "all", "one"];
    const i = modes.indexOf(state.repeatMode);
    state.repeatMode = modes[(i + 1) % modes.length];
    updateRepeatButton();
  }

  function updateRepeatButton() {
    if (!el.btnRepeat) return;
    el.btnRepeat.classList.toggle("active", state.repeatMode !== "none");
    const svg = el.btnRepeat.querySelector("svg");
    if (svg && state.repeatMode === "one") {
      // Thêm số "1" khi repeat one
      svg.style.position = "relative";
    }
  }

  // ---- Volume ----
  function setVolume(vol) {
    state.volume = Math.max(0, Math.min(1, vol));
    audio.volume = state.isMuted ? 0 : state.volume;
    updateVolumeUI();
  }

  function toggleMute() {
    state.isMuted = !state.isMuted;
    audio.volume = state.isMuted ? 0 : state.volume;
    updateVolumeUI();
  }

  function updateVolumeUI() {
    if (!el.volumeSlider) return;
    const vol = state.isMuted ? 0 : state.volume;
    el.volumeSlider.value = vol;

    // Gradient fill trên slider
    const pct = vol * 100;
    el.volumeSlider.style.background = `linear-gradient(to right, var(--color-text-primary) ${pct}%, var(--color-border-light) ${pct}%)`;

    // Cập nhật icon mute
    const muteIcon = el.btnMute?.querySelector("svg use, svg path");
    if (el.btnMute) {
      el.btnMute.classList.toggle("active", state.isMuted);
    }
  }

  // ---- Progress ----
  function updateProgress() {
    if (progressDrag || !audio.duration) return;

    const pct = (audio.currentTime / audio.duration) * 100;
    if (el.progressFill) el.progressFill.style.width = pct + "%";
    if (el.progressHandle) el.progressHandle.style.left = pct + "%";
    if (el.currentTime)
      el.currentTime.textContent = formatTime(audio.currentTime);
  }

  function seekTo(e) {
    if (!el.progressTrack || !audio.duration) return;
    const rect = el.progressTrack.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
    updateProgress();
  }

  // ---- Like ----
  function toggleLike() {
    const song = getCurrentSong();
    if (!song) return;

    const id = song._id;
    if (state.likedSongs.has(id)) {
      state.likedSongs.delete(id);
    } else {
      state.likedSongs.add(id);
    }

    // Lưu cache
    localStorage.setItem("sp_liked", JSON.stringify([...state.likedSongs]));
    updateLikeButton();

    // Gọi API
    window.API?.users.toggleLikeSong(id).catch(() => {});
  }

  function updateLikeButton() {
    const song = getCurrentSong();
    if (!el.btnLike || !song) return;
    const liked = state.likedSongs.has(song._id);
    el.btnLike.classList.toggle("liked", liked);
    el.btnLike.title = liked ? "Bỏ thích" : "Thêm vào bài hát đã thích";
  }

  // ---- UI Updates ----
  function updateNowPlayingUI(song) {
    if (!song) return;

    if (el.thumb) {
      if (song.coverUrl) {
        el.thumb.innerHTML = `<img src="${song.coverUrl}" alt="${song.title}" style="width:100%;height:100%;object-fit:cover">`;
      } else {
        el.thumb.innerHTML = musicNoteIcon();
      }
    }

    if (el.trackName) el.trackName.textContent = song.title || "Không có tên";
    if (el.trackArtist)
      el.trackArtist.textContent = song.artist || "Nghệ sĩ chưa xác định";
    if (el.totalTime) el.totalTime.textContent = formatTime(song.duration || 0);

    // Cập nhật tiêu đề trang
    document.title = `${song.title} • ${song.artist} — Spotify Clone`;

    updateLikeButton();

    // Dispatch sự kiện để các module khác biết đang phát bài gì
    document.dispatchEvent(
      new CustomEvent("player:songChanged", { detail: song }),
    );
  }

  function updatePlayButton() {
    if (!el.btnPlay) return;
    el.btnPlay.innerHTML = state.isPlaying
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
           <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
         </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
           <polygon points="5,3 19,12 5,21"/>
         </svg>`;
  }

  // ---- Audio Events ----
  function bindEvents() {
    // Audio events
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", playNext);
    audio.addEventListener("loadedmetadata", () => {
      if (el.totalTime) el.totalTime.textContent = formatTime(audio.duration);
    });
    audio.addEventListener("error", () => {
      console.warn("[Player] Lỗi tải file audio");
    });

    // Control buttons
    el.btnPlay?.addEventListener("click", togglePlay);
    el.btnPrev?.addEventListener("click", playPrev);
    el.btnNext?.addEventListener("click", playNext);
    el.btnShuffle?.addEventListener("click", toggleShuffle);
    el.btnRepeat?.addEventListener("click", cycleRepeat);
    el.btnLike?.addEventListener("click", toggleLike);
    el.btnMute?.addEventListener("click", toggleMute);

    // Progress bar — drag
    el.progressTrack?.addEventListener("mousedown", (e) => {
      progressDrag = true;
      seekTo(e);
    });

    document.addEventListener("mousemove", (e) => {
      if (progressDrag) seekTo(e);
    });

    document.addEventListener("mouseup", () => {
      progressDrag = false;
    });

    el.progressTrack?.addEventListener("click", seekTo);

    // Volume
    el.volumeSlider?.addEventListener("input", (e) => {
      state.isMuted = false;
      setVolume(parseFloat(e.target.value));
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeyboard);
  }

  function handleKeyboard(e) {
    // Bỏ qua khi đang gõ vào input
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        if (e.ctrlKey) {
          e.preventDefault();
          playNext();
        } else if (audio.src) {
          audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
        }
        break;
      case "ArrowLeft":
        if (e.ctrlKey) {
          e.preventDefault();
          playPrev();
        } else if (audio.src) {
          audio.currentTime = Math.max(audio.currentTime - 10, 0);
        }
        break;
      case "KeyM":
        toggleMute();
        break;
      case "ArrowUp":
        if (e.ctrlKey) {
          e.preventDefault();
          setVolume(state.volume + 0.1);
        }
        break;
      case "ArrowDown":
        if (e.ctrlKey) {
          e.preventDefault();
          setVolume(state.volume - 0.1);
        }
        break;
    }
  }

  // ---- Helpers ----
  function formatTime(secs) {
    if (!isFinite(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function musicNoteIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z"/>
    </svg>`;
  }

  function getCurrentSong() {
    return state.queue[state.currentIndex] || null;
  }

  // Public API
  return {
    init,
    loadSong,
    play: playSong,
    pause: pauseSong,
    toggle: togglePlay,
    next: playNext,
    prev: playPrev,
    get currentSong() {
      return getCurrentSong();
    },
    get isPlaying() {
      return state.isPlaying;
    },
    get state() {
      return state;
    },
  };
})();

// Khởi tạo khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".player-bar")) {
    Player.init();
  }
});

window.Player = Player;
