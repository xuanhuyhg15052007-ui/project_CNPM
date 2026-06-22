// ============================================
// api.js — BẢN HOÀN THIỆN TOÀN DIỆN (TẠO, XÓA PLAYLIST & THÊM/XÓA NHẠC CHUẨN)
// ============================================

const API_BASE = "http://localhost:5000/api/v1";

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("sp_token");
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const config = {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) handleUnauthorized();
      throw new APIError(data.message || "Yêu cầu thất bại", res.status, data);
    }
    return data;
  } catch (err) {
    if (err instanceof APIError) throw err;
    throw new APIError("Lỗi mạng — không thể kết nối tới server", 0, null);
  }
}

class APIError extends Error {
  constructor(message, statusCode, data) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

function handleUnauthorized() {
  localStorage.removeItem("sp_token");
  localStorage.removeItem("sp_user");
  if (!window.location.pathname.includes("login")) {
    window.location.href = "login.html";
  }
}

// ============================================
// AUTH APIs
// ============================================
const AuthAPI = {
  login: (email, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name, email, password) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  getMe: () => apiFetch("/auth/me"),
  logout: () => apiFetch("/auth/logout", { method: "POST" }).catch(() => {}),
};

// ============================================
// KHO DỮ LIỆU MOCK ĐỒNG BỘ (ĐẢM BẢO LUÔN CÓ ẢNH)
// ============================================
const _SHARED_SONGS = [
  {
    _id: "s1",
    id: "s1",
    title: "Making My Way",
    artist: "Sơn Tùng M-TP",
    coverUrl: "https://picsum.photos/200?random=11",
    audioUrl: "",
    duration: 210,
  },
  {
    _id: "s2",
    id: "s2",
    title: "Lối Nhỏ",
    artist: "Đen Vâu ft. Phương Anh Đào",
    coverUrl: "https://picsum.photos/200?random=12",
    audioUrl: "",
    duration: 240,
  },
  {
    _id: "s3",
    id: "s3",
    title: "Nếu Lúc Đó",
    artist: "tlinh x 2pillz",
    coverUrl: "https://picsum.photos/200?random=13",
    audioUrl: "",
    duration: 260,
  },
  {
    _id: "s4",
    id: "s4",
    title: "Waiting For You",
    artist: "MONO",
    coverUrl: "https://picsum.photos/200?random=14",
    audioUrl: "",
    duration: 195,
  },
  {
    _id: "s5",
    id: "s5",
    title: "Nấu Ăn Cho Em",
    artist: "Đen Vâu",
    coverUrl: "https://picsum.photos/200?random=15",
    audioUrl: "",
    duration: 220,
  },
];

// ============================================
// PLAYLIST APIs (HỖ TRỢ ĐẦY ĐỦ LOGIC ĐỘNG CHO GIAO DIỆN)
// ============================================
const PlaylistAPI = {
  _getPlaylistsFromStorage: () => {
    if (!localStorage.getItem("sp_mock_playlists")) {
      const defaultPlaylists = [
        {
          _id: "pl1",
          id: "pl1",
          name: "Nhạc Lofi Chill Cuối Tuần",
          songs: _SHARED_SONGS,
          coverUrl: "https://picsum.photos/200?random=21",
          description:
            "Thư giãn đầu óc với những giai điệu lofi nhẹ nhàng mộc mạc.",
        },
        {
          _id: "pl2",
          id: "pl2",
          name: "Coding Focus Mode (Instrumental)",
          songs: _SHARED_SONGS.slice(0, 3),
          coverUrl: "https://picsum.photos/200?random=22",
          description: "Tập trung tối đa hiệu suất làm việc và lập trình.",
        },
        {
          _id: "pl3",
          id: "pl3",
          name: "Giai Điệu Ký Ức V-Pop",
          songs: _SHARED_SONGS.slice(2, 5),
          coverUrl: "https://picsum.photos/200?random=23",
          description: "Sống lại những năm tháng thanh xuân cùng âm nhạc Việt.",
        },
      ];
      localStorage.setItem(
        "sp_mock_playlists",
        JSON.stringify(defaultPlaylists),
      );
    }
    return JSON.parse(localStorage.getItem("sp_mock_playlists"));
  },

  getMyPlaylists: async () => {
    const list = PlaylistAPI._getPlaylistsFromStorage();
    const res = [...list];
    res.data = list;
    res.playlists = list;
    return res;
  },

  getById: async (id) => {
    const playlists = PlaylistAPI._getPlaylistsFromStorage();
    const found = playlists.find((p) => p._id === id || p.id === id);
    if (found) return found;

    const defaultPlaylist = { ...playlists[0] };
    defaultPlaylist.data = playlists[0];
    return defaultPlaylist;
  },

  create: async (data = {}) => {
    const playlists = PlaylistAPI._getPlaylistsFromStorage();
    const userPlaylistCount = playlists.filter((p) =>
      p.name.startsWith("Playlist của tôi"),
    ).length;

    const newPlaylist = {
      _id: "pl_custom_" + Date.now(),
      id: "pl_custom_" + Date.now(),
      name: data.name || `Playlist của tôi #${userPlaylistCount + 1}`,
      description:
        data.description ||
        "Playlist do bạn tự tạo bằng chế độ Demo phát triển.",
      coverUrl: `https://picsum.photos/200?random=${Math.floor(Math.random() * 50) + 40}`,
      songs: [..._SHARED_SONGS.slice(0, 2)], // [MẸO NHỎ] Tự động thêm sẵn 2 bài hát gợi ý ban đầu để playlist không bị trống trơn
    };

    playlists.push(newPlaylist);
    localStorage.setItem("sp_mock_playlists", JSON.stringify(playlists));

    if (typeof window.renderSidebarPlaylists === "function") {
      window.renderSidebarPlaylists();
    } else if (typeof window.loadPlaylists === "function") {
      window.loadPlaylists();
    } else {
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }

    return { success: true, data: newPlaylist };
  },

  delete: async (id) => {
    let playlists = PlaylistAPI._getPlaylistsFromStorage();
    playlists = playlists.filter((p) => p._id !== id && p.id !== id);
    localStorage.setItem("sp_mock_playlists", JSON.stringify(playlists));

    if (typeof window.renderSidebarPlaylists === "function") {
      window.renderSidebarPlaylists();
    } else if (typeof window.loadPlaylists === "function") {
      window.loadPlaylists();
    } else {
      setTimeout(() => {
        window.location.href = "index.html";
      }, 300);
    }

    return { success: true, message: "Xóa danh sách phát thành công" };
  },

  update: async (id, data) => ({ success: true }),

  /**
   * ĐÃ SỬA: Logic thêm bài hát động vào bộ nhớ máy
   */
  addSong: async (playlistId, songId) => {
    const playlists = PlaylistAPI._getPlaylistsFromStorage();
    const playlist = playlists.find(
      (p) => p._id === playlistId || p.id === playlistId,
    );

    if (playlist) {
      const targetSong = _SHARED_SONGS.find(
        (s) => s._id === songId || s.id === songId,
      );
      // Nếu bài hát tồn tại trong kho và chưa có sẵn trong playlist thì mới thêm vào
      if (
        targetSong &&
        !playlist.songs.some((s) => s._id === songId || s.id === songId)
      ) {
        playlist.songs.push(targetSong);
        localStorage.setItem("sp_mock_playlists", JSON.stringify(playlists));
      }
    }

    // Tự động làm mới trang sau khi thêm để hiển thị ngay bài hát mới
    setTimeout(() => {
      window.location.reload();
    }, 300);
    return { success: true };
  },

  /**
   * ĐÃ SỬA: Logic xóa bài hát khỏi danh sách phát
   */
  removeSong: async (playlistId, songId) => {
    const playlists = PlaylistAPI._getPlaylistsFromStorage();
    const playlist = playlists.find(
      (p) => p._id === playlistId || p.id === playlistId,
    );

    if (playlist) {
      playlist.songs = playlist.songs.filter(
        (s) => s._id !== songId && s.id !== songId,
      );
      localStorage.setItem("sp_mock_playlists", JSON.stringify(playlists));
    }

    // Tự động làm mới trang sau khi xóa để bài hát biến mất lập tức
    setTimeout(() => {
      window.location.reload();
    }, 300);
    return { success: true };
  },
};

// ============================================
// SONG APIs
// ============================================
const SongAPI = {
  getAll: async (params = {}) => {
    const res = [..._SHARED_SONGS];
    res.data = _SHARED_SONGS;
    res.songs = _SHARED_SONGS;
    return res;
  },
  getById: async (id) => {
    return (
      _SHARED_SONGS.find((s) => s._id === id || s.id === id) || _SHARED_SONGS[0]
    );
  },
  search: async (query) => {
    const res = [..._SHARED_SONGS];
    res.data = _SHARED_SONGS;
    return res;
  },
  getTrending: async () => {
    const res = [..._SHARED_SONGS];
    res.data = _SHARED_SONGS;
    res.songs = _SHARED_SONGS;
    return res;
  },
  getByGenre: async (genre) => {
    const res = [..._SHARED_SONGS];
    res.data = _SHARED_SONGS;
    return res;
  },
};

// ============================================
// USER APIs
// ============================================
const UserAPI = {
  updateProfile: (data) =>
    apiFetch("/users/profile", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (currentPassword, newPassword) =>
    apiFetch("/users/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  getLikedSongs: async () => {
    const res = [..._SHARED_SONGS.slice(0, 2)];
    res.data = _SHARED_SONGS.slice(0, 2);
    return res;
  },
  toggleLikeSong: (songId) =>
    apiFetch(`/users/liked-songs/${songId}`, { method: "POST" }),
};

window.API = {
  auth: AuthAPI,
  songs: SongAPI,
  playlists: PlaylistAPI,
  users: UserAPI,
  fetch: apiFetch,
  APIError,
};
