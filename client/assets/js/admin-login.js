// ============================================
// admin-login.js — Đăng nhập Admin bằng tài khoản đặc biệt
// ============================================

const ADMIN_CONFIG = {
  username: "spotify",
  password: "123",
  dashboardPath: "../Admin-spotify/html/admin.html",
  loginPath: "../../client/login.html",
};

const ADMIN_USER = {
  name: "Quản Trị Viên",
  username: ADMIN_CONFIG.username,
  email: "admin@spotify.com",
  avatar: "https://i.pravatar.cc/150?img=12",
  role: "admin",
};

const ADMIN_TOKEN = "admin-demo-token";

function normalizeUsername(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[/\\]+$/, "");
}

function normalizePassword(value) {
  return value.trim();
}

function isAdminCredentials(username, password) {
  return (
    normalizeUsername(username) === ADMIN_CONFIG.username &&
    normalizePassword(password) === ADMIN_CONFIG.password
  );
}

function saveAdminSession() {
  localStorage.setItem("sp_token", ADMIN_TOKEN);
  localStorage.setItem("sp_user", JSON.stringify(ADMIN_USER));
}

function getAdminUser() {
  try {
    const user = JSON.parse(localStorage.getItem("sp_user"));
    return user?.role === "admin" ? user : null;
  } catch {
    return null;
  }
}

function loginAsAdmin(showToast) {
  saveAdminSession();
  if (typeof showToast === "function") {
    showToast("Chào mừng Admin!", "success");
  }
  setTimeout(() => {
    window.location.href = ADMIN_CONFIG.dashboardPath;
  }, 500);
  return true;
}

function guardAdminPage() {
  const token = localStorage.getItem("sp_token");
  const user = getAdminUser();

  if (!token || !user) {
    window.location.href = ADMIN_CONFIG.loginPath;
    return false;
  }
  return true;
}

function tryAdminLoginFromForm(username, password, showToast) {
  if (!window.AdminLogin) {
    console.error("admin-login.js chưa được load!");
    return false;
  }
  if (!isAdminCredentials(username, password)) {
    return false;
  }
  loginAsAdmin(showToast);
  return true;
}

window.AdminLogin = {
  ADMIN_CONFIG,
  ADMIN_USER,
  isAdminCredentials,
  loginAsAdmin,
  guardAdminPage,
  tryAdminLoginFromForm,
  getAdminUser,
};
