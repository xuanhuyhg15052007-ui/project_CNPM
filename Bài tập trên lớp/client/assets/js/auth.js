// ============================================
// auth.js
// ============================================

const DEMO_MODE = true;

// --- User mặc định ---
const DEFAULT_DEMO_USER = {
  name: "Nguyễn Văn A",
  email: "demo@spotify.com",
  avatar: "https://i.pravatar.cc/150?img=33",
};

const DEMO_TOKEN = "fake-jwt-token-for-demo-purposes";

// ============================================
// CORE AUTH
// ============================================
function requireAuth() {
  const token = localStorage.getItem("sp_token");
  if (!token) {
    if (
      !window.location.pathname.includes("login.html") &&
      !window.location.pathname.includes("register.html")
    ) {
      window.location.href = "login.html";
      return false;
    }
    return false;
  }
  return true;
}

function requireAdmin() {
  const token = localStorage.getItem("sp_token");
  if (!token) {
    window.location.href = "login.html";
    return false;
  }
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

function redirectIfLoggedIn() {
  const token = localStorage.getItem("sp_token");
  const user = getCurrentUser();
  // Chỉ chuyển hướng nếu đã đăng nhập user thường, không chặn đăng nhập admin
  if (token && user?.role !== "admin") {
    window.location.href = "index.html";
  }
}

function saveSession(token, user) {
  localStorage.setItem("sp_token", token);
  localStorage.setItem("sp_user", JSON.stringify(user));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("sp_user"));
  } catch {
    return null;
  }
}

async function logout() {
  try {
    if (!DEMO_MODE) await window.API?.auth.logout();
  } finally {
    localStorage.removeItem("sp_token");
    localStorage.removeItem("sp_user");
    window.location.href = "login.html";
  }
}

// ============================================
// TRANG ĐĂNG NHẬP USER
// ============================================
function initLoginPage() {
  redirectIfLoggedIn();

  const form = document.getElementById("login-form");
  const emailEl = document.getElementById("login-email");
  const passEl = document.getElementById("login-password");
  const submitBtn = document.getElementById("login-submit");
  const togglePw = document.getElementById("toggle-password");

  if (!form) return;

  if (DEMO_MODE) {
    if (emailEl) emailEl.value = DEFAULT_DEMO_USER.email;
    if (passEl) passEl.value = "123456";
  }

  togglePw?.addEventListener("click", () => {
    passEl.type = passEl.type === "text" ? "password" : "text";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const email = emailEl.value.trim();
    const password = passEl.value;

    // Tài khoản admin đặc biệt — bỏ qua validate email thường
    if (window.AdminLogin?.tryAdminLoginFromForm(email, password, showToast)) {
      setLoading(submitBtn, true);
      return;
    }

    let valid = true;
    if (!isValidEmail(email)) {
      showFieldError("email-error", "Email không hợp lệ");
      setFieldError(emailEl);
      valid = false;
    }
    if (password.length < 6) {
      showFieldError("password-error", "Mật khẩu phải ít nhất 6 ký tự");
      setFieldError(passEl);
      valid = false;
    }
    if (!valid) return;

    setLoading(submitBtn, true);
    try {
      if (DEMO_MODE) {
        const isDefault = email === DEFAULT_DEMO_USER.email;
        const mockName = isDefault
          ? DEFAULT_DEMO_USER.name
          : email.split("@")[0];
        saveSession(DEMO_TOKEN, {
          name: isDefault
            ? mockName
            : mockName.charAt(0).toUpperCase() + mockName.slice(1),
          email: email,
          avatar: DEFAULT_DEMO_USER.avatar,
          role: "user", // ✅ thêm role user rõ ràng
        });
      } else {
        const data = await window.API.auth.login(email, password);
        saveSession(data.token, data.user);
      }
      showToast("Đăng nhập thành công!", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    } catch {
      showToast("Lỗi đăng nhập", "error");
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ============================================
// TRANG ĐĂNG KÝ
// ============================================
function initRegisterPage() {
  redirectIfLoggedIn();

  const form = document.getElementById("register-form");
  const nameEl = document.getElementById("register-name");
  const emailEl = document.getElementById("register-email");
  const passEl = document.getElementById("register-password");
  const confirmEl = document.getElementById("register-confirm");
  const submitBtn = document.getElementById("register-submit");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const name = nameEl?.value.trim();
    const email = emailEl.value.trim();
    const password = passEl.value;
    const confirm = confirmEl?.value;

    let valid = true;
    if (!name || name.length < 2) {
      showFieldError("name-error", "Tên phải ít nhất 2 ký tự");
      setFieldError(nameEl);
      valid = false;
    }
    if (!isValidEmail(email)) {
      showFieldError("email-error", "Email không hợp lệ");
      setFieldError(emailEl);
      valid = false;
    }
    if (password.length < 6) {
      showFieldError("password-error", "Mật khẩu phải ít nhất 6 ký tự");
      setFieldError(passEl);
      valid = false;
    }
    if (confirm !== password) {
      showFieldError("confirm-error", "Mật khẩu xác nhận không khớp");
      setFieldError(confirmEl);
      valid = false;
    }
    if (!valid) return;

    setLoading(submitBtn, true);
    try {
      if (DEMO_MODE) {
        saveSession(DEMO_TOKEN, {
          name,
          email,
          avatar: "https://i.pravatar.cc/150?img=59",
          role: "user",
        });
      } else {
        const data = await window.API.auth.register(name, email, password);
        saveSession(data.token, data.user);
      }
      showToast("Tạo tài khoản thành công! Chào mừng bạn 🎉", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } catch {
      showToast("Email đã được sử dụng", "error");
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// ============================================
// TRANG ĐĂNG NHẬP ADMIN
// ============================================
function initAdminLoginPage() {
  const form = document.getElementById("admin-login-form");
  const emailEl = document.getElementById("admin-email");
  const secretEl = document.getElementById("admin-secret");
  const submitBtn = document.getElementById("admin-submit");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const inputUsername = emailEl.value.trim();
    const inputPassword = secretEl.value;

    if (
      !window.AdminLogin?.tryAdminLoginFromForm(
        inputUsername,
        inputPassword,
        showToast,
      )
    ) {
      showToast("Tên hoặc mật khẩu không đúng!", "error");
    }
  });
}

// ============================================
// HELPERS
// ============================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}
function setFieldError(el) {
  el?.closest(".form-group")?.classList.add("has-error");
}
function clearErrors() {
  document.querySelectorAll(".form-error").forEach((el) => {
    el.style.display = "none";
  });
  document.querySelectorAll(".form-group.has-error").forEach((el) => {
    el.classList.remove("has-error");
  });
}
function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.classList.toggle("loading", isLoading);
}
function showToast(message, type = "success") {
  let toast = document.querySelector(".auth-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "auth-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `auth-toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// ============================================
// KHỞI CHẠY
// ============================================
const currentPage = document.body.dataset.page;
if (
  currentPage !== "login" &&
  currentPage !== "register" &&
  currentPage !== "admin-login"
) {
  requireAuth();
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "login") initLoginPage();
  if (page === "register") initRegisterPage();
  if (page === "admin-login") initAdminLoginPage();
  if (page === "admin") requireAdmin();
});

window.Auth = { requireAuth, requireAdmin, getCurrentUser, logout, showToast };
