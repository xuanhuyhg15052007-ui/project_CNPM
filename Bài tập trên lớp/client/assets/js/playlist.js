// ============================================
// playlist.js — Tạo & Hiển thị Playlist
// ============================================

const PlaylistManager = (() => {
  let myPlaylists = [];

  // ---- Init ----
  function init() {
    if (!Auth.requireAuth()) return;
    loadSidebarPlaylists();
    bindCreateModal();
    console.log("[Playlist] Đã khởi tạo");
  }

  // ---- Load danh sách vào sidebar ----
  async function loadSidebarPlaylists() {
    const listEl = document.querySelector(".sidebar-playlist-list");
    if (!listEl) return;

    // Skeleton loading
    listEl.innerHTML = Array(4)
      .fill(0)
      .map(
        () => `
      <div class="sidebar-playlist-item">
        <div class="sidebar-playlist-thumb skeleton"></div>
        <div style="flex:1">
          <div class="skeleton skeleton-line" style="margin-bottom:6px"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      </div>`,
      )
      .join("");

    try {
      const data = await window.API.playlists.getMyPlaylists();
      myPlaylists = data.playlists || data || [];
      renderSidebarPlaylists(myPlaylists, listEl);
    } catch (err) {
      listEl.innerHTML = `
        <div style="padding:16px 12px;font-size:13px;color:var(--color-text-muted);">
          Không thể tải playlist.<br>
          <span style="cursor:pointer;text-decoration:underline" onclick="PlaylistManager.reload()">Thử lại</span>
        </div>`;
    }
  }

  function renderSidebarPlaylists(playlists, container) {
    if (!container) return;

    if (playlists.length === 0) {
      container.innerHTML = `
        <div style="padding:12px;font-size:13px;color:var(--color-text-muted);">
          Chưa có playlist nào.
        </div>`;
      return;
    }

    container.innerHTML = playlists
      .map(
        (pl) => `
      <div class="sidebar-playlist-item" data-id="${pl._id}" onclick="PlaylistManager.openPlaylist('${pl._id}')">
        <div class="sidebar-playlist-thumb">
          ${
            pl.coverUrl
              ? `<img src="${pl.coverUrl}" alt="${pl.name}" style="width:100%;height:100%;object-fit:cover">`
              : playlistDefaultThumb()
          }
        </div>
        <div class="sidebar-playlist-info">
          <div class="sidebar-playlist-name">${escHtml(pl.name)}</div>
          <div class="sidebar-playlist-meta">Playlist • ${pl.songs?.length || 0} bài</div>
        </div>
      </div>`,
      )
      .join("");
  }

  // ---- Open playlist ----
  async function openPlaylist(id) {
    // Highlight trong sidebar
    document.querySelectorAll(".sidebar-playlist-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === id);
    });

    const contentArea = document.querySelector(".content-area");
    if (!contentArea) return;

    // Loading state
    contentArea.innerHTML = `<div style="padding:32px;color:var(--color-text-muted);">Đang tải...</div>`;

    try {
      const data = await window.API.playlists.getById(id);
      renderPlaylistView(data, contentArea);
    } catch {
      contentArea.innerHTML = `<div style="padding:32px;color:var(--color-text-muted);">Không thể tải playlist này.</div>`;
    }
  }

  function renderPlaylistView(playlist, container) {
    const songs = playlist.songs || [];

    container.innerHTML = `
      <!-- Hero header -->
      <div style="display:flex;align-items:flex-end;gap:24px;padding:24px;
                  background:linear-gradient(180deg, rgba(29,185,84,0.3) 0%, transparent 100%);
                  border-radius:12px 12px 0 0;margin-bottom:0">
        <div style="width:200px;height:200px;border-radius:8px;background:var(--color-bg-card);
                    flex-shrink:0;overflow:hidden;box-shadow:var(--shadow-lg);
                    display:flex;align-items:center;justify-content:center;color:var(--color-text-muted)">
          ${
            playlist.coverUrl
              ? `<img src="${playlist.coverUrl}" style="width:100%;height:100%;object-fit:cover">`
              : playlistDefaultThumb(64)
          }
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">
            Playlist
          </div>
          <h1 style="font-size:clamp(24px,5vw,56px);font-weight:800;letter-spacing:-1px;margin-bottom:8px">
            ${escHtml(playlist.name)}
          </h1>
          ${
            playlist.description
              ? `<p style="font-size:14px;color:var(--color-text-secondary);margin-bottom:12px">${escHtml(playlist.description)}</p>`
              : ""
          }
          <div style="font-size:13px;color:var(--color-text-muted)">
            ${songs.length} bài hát
          </div>
        </div>
      </div>

      <!-- Action bar -->
      <div style="display:flex;align-items:center;gap:16px;padding:24px;padding-top:20px">
        <button onclick="PlaylistManager.playAll('${playlist._id}')"
                style="width:56px;height:56px;border-radius:50%;background:var(--color-accent);
                       border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;
                       transition:transform 0.15s,background 0.15s;color:#000"
                onmouseover="this.style.transform='scale(1.07)';this.style.background='var(--color-accent-hover)'"
                onmouseout="this.style.transform='scale(1)';this.style.background='var(--color-accent)'">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><polygon points="5,3 19,12 5,21"/></svg>
        </button>
        <button onclick="PlaylistManager.showEditModal('${playlist._id}')"
                style="width:36px;height:36px;border-radius:50%;background:transparent;border:none;
                       cursor:pointer;color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;
                       transition:color 0.15s"
                onmouseover="this.style.color='var(--color-text-primary)'"
                onmouseout="this.style.color='var(--color-text-muted)'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
      </div>

      <!-- Song list -->
      <div style="padding:0 24px 40px">
        ${
          songs.length === 0
            ? `<div style="font-size:15px;color:var(--color-text-muted);padding:40px 0;text-align:center">
               Playlist này chưa có bài hát nào.<br>
               <span style="font-size:13px">Tìm và thêm bài hát yêu thích của bạn!</span>
             </div>`
            : renderSongList(songs, playlist._id)
        }
      </div>`;
  }

  function renderSongList(songs, playlistId) {
    return `
      <div class="song-list">
        <div class="song-list-header">
          <span>#</span>
          <span>Tên bài hát</span>
          <span>Album</span>
          <span>Thời gian</span>
          <span></span>
        </div>
        ${songs
          .map(
            (song, i) => `
          <div class="song-row" id="song-row-${song._id}"
               ondblclick="PlaylistManager.playSongAt(${i}, '${playlistId}')">
            <div class="song-row-index">
              <span>${i + 1}</span>
              <svg class="song-row-play-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <rect x="5" y="3" width="3" height="18"/><rect x="16" y="3" width="3" height="18"/>
              </svg>
            </div>
            <div class="song-row-info">
              <div class="song-row-thumb">
                ${
                  song.coverUrl
                    ? `<img src="${song.coverUrl}" alt="${song.title}" style="width:100%;height:100%;object-fit:cover">`
                    : `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z"/></svg>`
                }
              </div>
              <div>
                <div class="song-row-title">${escHtml(song.title)}</div>
                <div class="song-row-artist">${escHtml(song.artist || "")}</div>
              </div>
            </div>
            <div class="song-row-album truncate">${escHtml(song.album || "—")}</div>
            <div class="song-row-duration">${formatDuration(song.duration)}</div>
            <div class="song-row-actions">
              <button class="btn-icon-sm" title="Xóa khỏi playlist"
                onclick="PlaylistManager.removeSong('${playlistId}','${song._id}',event)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </div>`,
          )
          .join("")}
      </div>`;
  }

  // ---- Play All ----
  function playAll(playlistId) {
    const pl = myPlaylists.find((p) => p._id === playlistId);
    if (!pl?.songs?.length) return;
    window.Player?.loadSong(pl.songs[0], pl.songs, 0);
  }

  function playSongAt(index, playlistId) {
    const pl = myPlaylists.find((p) => p._id === playlistId);
    if (!pl?.songs?.length) return;
    window.Player?.loadSong(pl.songs[index], pl.songs, index);
  }

  // ---- Remove song ----
  async function removeSong(playlistId, songId, event) {
    event?.stopPropagation();
    if (!confirm("Xóa bài hát này khỏi playlist?")) return;

    try {
      await window.API.playlists.removeSong(playlistId, songId);
      const row = document.getElementById(`song-row-${songId}`);
      row?.remove();
      // Cập nhật local state
      const pl = myPlaylists.find((p) => p._id === playlistId);
      if (pl) pl.songs = pl.songs.filter((s) => s._id !== songId);
      Auth.showToast("Đã xóa bài hát khỏi playlist", "success");
    } catch {
      Auth.showToast("Không thể xóa bài hát", "error");
    }
  }

  // ---- Create Modal ----
  function bindCreateModal() {
    const overlay = document.getElementById("playlist-modal");
    const form = document.getElementById("create-playlist-form");
    const btnOpen = document.querySelectorAll(
      '[data-action="create-playlist"]',
    );
    const btnClose = overlay?.querySelector(".modal-close");
    const nameInput = document.getElementById("playlist-name");
    const descInput = document.getElementById("playlist-desc");
    const submitBtn = document.getElementById("playlist-submit");

    btnOpen.forEach((btn) =>
      btn.addEventListener("click", () => openModal(overlay)),
    );
    btnClose?.addEventListener("click", () => closeModal(overlay));
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay);
    });

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = nameInput?.value.trim();
      const desc = descInput?.value.trim();

      if (!name) {
        nameInput?.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Đang tạo...";

      try {
        const newPl = await window.API.playlists.create({
          name,
          description: desc,
        });
        myPlaylists.push(newPl);
        renderSidebarPlaylists(
          myPlaylists,
          document.querySelector(".sidebar-playlist-list"),
        );
        closeModal(overlay);
        nameInput.value = "";
        if (descInput) descInput.value = "";
        Auth.showToast(`Đã tạo playlist "${name}"`, "success");
      } catch {
        Auth.showToast("Không thể tạo playlist", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Tạo";
      }
    });
  }

  function openModal(overlay) {
    overlay?.classList.add("open");
  }
  function closeModal(overlay) {
    overlay?.classList.remove("open");
  }

  // ---- Helpers ----
  function formatDuration(secs) {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function escHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function playlistDefaultThumb(size = 28) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="${size}" height="${size}">
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z"/>
    </svg>`;
  }

  return {
    init,
    reload: loadSidebarPlaylists,
    openPlaylist,
    playAll,
    playSongAt,
    removeSong,
    get playlists() {
      return myPlaylists;
    },
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".sidebar-playlist-list")) {
    PlaylistManager.init();
  }
});

window.PlaylistManager = PlaylistManager;
