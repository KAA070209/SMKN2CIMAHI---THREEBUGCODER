const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://backendbumikriya-production.up.railway.app"
).replace(/\/$/, "");

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getAuthToken(data) {
  if (!data || typeof data !== "object") return null;

  const candidates = [
    data.token,
    data.accessToken,
    data.access_token,
    data.jwt,
    data.authorization?.token,
    data.authorization?.accessToken,
    data.authorization?.access_token,
    data.authorisation?.token,
    data.authorisation?.accessToken,
    data.authorisation?.access_token,
    data.result?.token,
    data.result?.access_token,
    data.data?.token,
    data.data?.accessToken,
    data.data?.access_token,
    data.data?.jwt,
    data.data?.authorization?.token,
    data.data?.authorization?.access_token,
    data.data?.authorisation?.token,
    data.data?.authorisation?.access_token,
    data.data?.result?.token,
    data.data?.data?.token,
    data.data?.data?.access_token,
    data.data?.user?.token,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return null;
}

function getAuthUser(data) {
  if (!data || typeof data !== "object") return null;

  const candidates = [
    data.user,
    data.data?.user,
    data.data?.data?.user,
    data.result?.user,
    data.payload?.user,
    data.authorization?.user,
    data.authorisation?.user,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") return candidate;
  }

  if (data.id !== undefined || data.name !== undefined) return data;
  if (data.data && (data.data.id !== undefined || data.data.name !== undefined)) return data.data;

  return null;
}

function localizeMessage(message) {
  if (typeof message === "string" && /^(could not validate credentials|not authenticated|invalid authentication credentials|invalid token)$/i.test(message.trim())) {
    return "Sesi berakhir, silahkan login kembali";
  }
  return message;
}

function getApiMessage(data, fallback) {
  if (!data) return fallback;

  if (typeof data.message === "string" && data.message) {
    return localizeMessage(data.message);
  }

  if (typeof data.detail === "string" && data.detail) {
    return localizeMessage(data.detail);
  }

  if (typeof data.error === "string" && data.error) {
    return localizeMessage(data.error);
  }

  if (Array.isArray(data.detail) && data.detail.length) {
    const first = data.detail[0];
    if (typeof first === "string") return localizeMessage(first);
    if (typeof first?.msg === "string") return localizeMessage(first.msg);
  }

  const firstError = data.errors && Object.values(data.errors).flat()[0];

  if (typeof firstError === "string") {
    return localizeMessage(firstError);
  }

  return fallback;
}

function getStoredAuthToken() {
  return normalizeToken(localStorage.getItem("authToken") || "");
}

function normalizeToken(token) {
  if (typeof token !== "string") return "";
  const trimmed = token.trim().replace(/^"|"$/g, "");
  if (/^bearer\s+/i.test(trimmed)) {
    return trimmed.replace(/^bearer\s+/i, "");
  }
  return trimmed;
}

async function requestAuth(path, payload, options = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (payload !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.withAuth) {
    const token = options.authToken || getStoredAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers,
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      getApiMessage(
        data,
        "Terjadi kesalahan. Silakan coba lagi."
      )
    );
  }

  return data;
}

export async function fetchMe({ signal } = {}) {
  const headers = { Accept: "application/json" };

  const token = getStoredAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl("/api/v1/auth/me"), {
    method: "GET",
    headers,
    signal,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      window.alert("Sesi berakhir, harap login ulang");
      clearAuthSession();
    }
    throw new Error(getApiMessage(data, "Gagal memuat profil."));
  }

  return data;
}

export async function login(payload) {
  const data = await requestAuth(
    "/api/v1/auth/login",
    payload
  );

  saveAuthSession(data);

  if (!getSessionUser(data)) {
    try {
      const me = await fetchMe();
      const user = getSessionUser(me);
      if (user) {
        localStorage.setItem("authUser", JSON.stringify(user));
        data.user = user;
      }
    } catch {
      /* token sudah tersimpan; profil akan dimuat ulang lewat /me nanti */
    }
  }

  return data;
}

export async function register(payload, options = {}) {
  const data = await requestAuth(
    "/api/v1/auth/register",
    payload
  );

  if (options.saveSession) {
    saveAuthSession(data);
  }

  return data;
}

export function forgotPassword(payload) {
  return requestAuth(
    "/api/v1/auth/forgot-password",
    payload
  );
}

export function verifyResetCode(payload) {
  return requestAuth(
    "/api/v1/auth/verify-reset-code",
    payload
  );
}

export function resetPassword(payload) {
  return requestAuth(
    "/api/v1/auth/reset-password",
    payload
  );
}

export function googleLogin() {
  const callbackUrl = buildUrl("/api/v1/auth/google/callback");
  const loginUrl = buildUrl(
    `/api/v1/auth/google/login?redirect_uri=${encodeURIComponent(callbackUrl)}`
  );
  return fetch(loginUrl, { method: "GET", redirect: "manual" })
    .then((response) => {
      if (response.type === "opaqueredirect") {
        window.location.assign(loginUrl);
        return;
      }
      return response.text().then((text) => {
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }
        const target =
          data?.url ||
          data?.redirect_url ||
          data?.auth_url ||
          data?.authorization_url ||
          data?.data?.url ||
          data?.data?.redirect_url ||
          loginUrl;
        window.location.assign(target);
      });
    })
    .catch(() => {
      window.location.assign(loginUrl);
    });
}

export function handleGoogleCallback() {
  const params = new URLSearchParams(window.location.search);

  const token =
    params.get("token") ||
    params.get("access_token") ||
    params.get("jwt") ||
    params.get("authorization");

  if (!token) return null;

  let user = null;
  const rawUser =
    params.get("user") ||
    params.get("data");

  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      user = parsed.user || parsed.data || parsed;
    } catch {
      user = null;
    }
  }

  saveAuthSession({ token, user });

  const url = new URL(window.location.href);
  [...params.keys()].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

  return { token, user };
}

export async function logout() {
  const token = getStoredAuthToken();
  clearAuthSession();

  if (!token) return null;

  try {
    return await requestAuth(
      "/api/v1/auth/logout",
      undefined,
      { withAuth: true, authToken: token }
    );
  } catch {
    return null;
  }
}

export function getSessionUser(data) {
  return getAuthUser(data) || null;
}

export function getStoredAuthUser() {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(data) {
  const token = getAuthToken(data);
  const user = getAuthUser(data);

  if (token) {
    localStorage.setItem("authToken", token);
  }

  if (user) {
    localStorage.setItem(
      "authUser",
      JSON.stringify(user)
    );
  }
}

export function clearAuthSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
}
