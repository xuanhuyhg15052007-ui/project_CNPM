// ============================================
// search.js — Thanh tìm kiếm bài hát
// ============================================

const Search = (() => {
  let debounceTimer = null;
  let currentQuery = "";
  let isOpen = false;

  function init() {
    const input = document.querySelector(".search-input");
    const dropdown = document.querySelector(".search-results-dropdown");
    if (!input) return;

    input.addEventListener("input", (e) =>
      handleInput(e.target.value, dropdown),
    );
    input.addEventListener("focus", () => {
      if (currentQuery && dropdown?.children.length > 0) openDropdown(dropdown);
    });

    // Đóng khi click ra ngoài
    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown?.contains(e.target)) {
        closeDropdown(dropdown);
      }
    });

    // Phím tắt: Ctrl+K hoặc / để focus search
    document.addEventListener("keydown", (e) => {
      if (
        (e.ctrlKey && e.key === "k") ||
        (e.key === "/" && !["INPUT", "TEXTAREA"].includes(e.target.tagName))
      ) {
        e.preventDefault();
        input.focus();
        input.select();
      }
      if (e.key === "Escape" && isOpen) {
        closeDropdown(dropdown);
        input.blur();
      }
    });

    console.log("[Search] Đã khởi tạo");
  }

  function handleInput(value, dropdown) {
    currentQuery = value.trim();

    if (debounceTimer) clearTimeout(debounceTimer);

    if (!currentQuery) {
      closeDropdown(dropdown);
      return;
    }

    // Hiển thị skeleton ngay
    if (dropdown) {
      showSkeletonResults(dropdown);
      openDropdown(dropdown);
    }

    // Debounce 350ms
    debounceTimer = setTimeout(async () => {
      await performSearch(currentQuery, dropdown);
    }, 350);
  }

  async function performSearch(query, dropdown) {
    if (!dropdown) return;

    try {
      const data = await window.API.songs.search(query);
      const results = data.songs || data || [];
      renderResults(results, query, dropdown);
    } catch {
      dropdown.innerHTML = `
        <div style="padding:16px;text-align:center;font-size:13px;color:var(--color-text-muted)">
          Lỗi kết nối. Thử lại sau.
        </div>`;
    }
  }

  function renderResults(results, query, dropdown) {
    if (!dropdown) return;

    if (results.length === 0) {
      dropdown.innerHTML = `
        <div style="padding:16px 20px">
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px">
            Không tìm thấy kết quả cho
          </div>
          <div style="font-size:15px;font-weight:700">"${escHtml(query)}"</div>
        </div>`;
      return;
    }

    const topResults = results.slice(0, 8);

    dropdown.innerHTML = `
      <div style="padding:8px 16px 4px;font-size:11px;font-weight:700;
                  text-transform:uppercase;letter-spacing:1px;color:var(--color-text-muted)">
        Bài hát
      </div>
      ${topResults
        .map(
          (song) => `
        <div class="search-result-item"
             onclick="Search.selectSong('${song._id}')"
             data-song-id="${song._id}">
          <div class="search-result-thumb">
            ${
              song.coverUrl
                ? `<img src="${song.coverUrl}" alt="${song.title}" style="width:100%;height:100%;object-fit:cover">`
                : musicNoteIcon()
            }
          </div>
          <div class="search-result-info">
            <div class="search-result-name">${highlightMatch(escHtml(song.title), query)}</div>
            <div class="search-result-sub">${escHtml(song.artist || "")} ${song.album ? "• " + escHtml(song.album) : ""}</div>
          </div>
          <button class="btn-icon-sm" title="Thêm vào playlist"
                  onclick="Search.addToPlaylist('${song._id}', event)"
                  style="flex-shrink:0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>`,
        )
        .join("")}
      ${
        results.length > 8
          ? `<div style="padding:8px 16px;font-size:13px;color:var(--color-text-muted);
                       cursor:pointer;border-top:1px solid var(--color-border)"
               onclick="Search.showAll('${escHtml(query)}')">
             Xem tất cả ${results.length} kết quả
           </div>`
          : ""
      }`;
  }

  function showSkeletonResults(dropdown) {
    dropdown.innerHTML = Array(4)
      .fill(0)
      .map(
        () => `
      <div class="search-result-item">
        <div class="search-result-thumb skeleton"></div>
        <div class="search-result-info">
          <div class="skeleton skeleton-line" style="margin-bottom:6px"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      </div>`,
      )
      .join("");
  }

  // ---- Actions ----
  async function selectSong(songId) {
    const dropdown = document.querySelector(".search-results-dropdown");
    closeDropdown(dropdown);

    // Tìm trong kết quả hiện tại rồi phát
    try {
      const data = await window.API.songs.getById(songId);
      const song = data.song || data;
      window.Player?.loadSong(song);
    } catch {
      Auth.showToast("Không thể tải bài hát", "error");
    }
  }

  function addToPlaylist(songId, event) {
    event.stopPropagation();

    const playlists = window.PlaylistManager?.playlists || [];
    if (playlists.length === 0) {
      Auth.showToast("Bạn chưa có playlist nào", "error");
      return;
    }

    // Tạo dropdown mini chọn playlist
    showPlaylistPicker(songId, event.currentTarget);
  }

  function showPlaylistPicker(songId, anchorEl) {
    // Xóa picker cũ
    document.querySelector(".playlist-picker")?.remove();

    const playlists = window.PlaylistManager?.playlists || [];
    const rect = anchorEl.getBoundingClientRect();

    const picker = document.createElement("div");
    picker.className = "playlist-picker";
    picker.style.cssText = `
      position:fixed;
      top:${rect.bottom + 4}px;
      left:${rect.left - 160}px;
      background:var(--color-bg-card);
      border:1px solid var(--color-border);
      border-radius:var(--radius-lg);
      padding:8px 0;
      min-width:200px;
      box-shadow:var(--shadow-lg);
      z-index:600;
    `;

    picker.innerHTML = `
      <div style="padding:6px 16px;font-size:11px;font-weight:700;text-transform:uppercase;
                  letter-spacing:1px;color:var(--color-text-muted)">Thêm vào playlist</div>
      ${playlists
        .map(
          (pl) => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;
                    cursor:pointer;font-size:13px;transition:background 0.15s"
             onmouseover="this.style.background='var(--color-bg-card-hover)'"
             onmouseout="this.style.background=''"
             onclick="Search.confirmAddToPlaylist('${pl._id}','${songId}')">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z"/>
          </svg>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(pl.name)}</span>
        </div>`,
        )
        .join("")}`;

    document.body.appendChild(picker);

    // Đóng khi click ra ngoài
    setTimeout(() => {
      document.addEventListener("click", function handler(e) {
        if (!picker.contains(e.target) && e.target !== anchorEl) {
          picker.remove();
          document.removeEventListener("click", handler);
        }
      });
    }, 0);
  }

  async function confirmAddToPlaylist(playlistId, songId) {
    document.querySelector(".playlist-picker")?.remove();
    try {
      await window.API.playlists.addSong(playlistId, songId);
      Auth.showToast("Đã thêm vào playlist", "success");
    } catch {
      Auth.showToast("Không thể thêm vào playlist", "error");
    }
  }

  function showAll(query) {
    // Mở trang tìm kiếm đầy đủ (nếu có)
    const dropdown = document.querySelector(".search-results-dropdown");
    closeDropdown(dropdown);
    console.log("[Search] Hiển thị tất cả kết quả cho:", query);
    // TODO: navigate to search results page
  }

  // ---- Dropdown helpers ----
  function openDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.classList.add("open");
    isOpen = true;
  }

  function closeDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.classList.remove("open");
    isOpen = false;
  }

  // ---- Text helpers ----
  function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${escRegex(query)})`, "gi");
    return text.replace(
      regex,
      '<mark style="background:var(--color-accent-subtle);color:var(--color-accent);border-radius:2px">$1</mark>',
    );
  }

  function escHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function musicNoteIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z"/>
    </svg>`;
  }

  return {
    init,
    selectSong,
    addToPlaylist,
    confirmAddToPlaylist,
    showAll,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".search-input")) {
    Search.init();
  }
});

window.Search = Search;
