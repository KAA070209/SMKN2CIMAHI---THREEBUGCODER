const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://backendbumikriya-production.up.railway.app"
).replace(/\/$/, "");
const NOTIFICATIONS_WS_URL = import.meta.env.VITE_NOTIFICATIONS_WS_URL || "";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getNotificationsWsUrl() {
  if (NOTIFICATIONS_WS_URL) return NOTIFICATIONS_WS_URL;

  const apiUrl = new URL(API_BASE_URL);
  apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  apiUrl.pathname = "/ws/notifications";
  apiUrl.search = "";
  apiUrl.hash = "";
  return apiUrl.toString();
}

export function resolveApiUrl(path) {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path)) return path;
  if (path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
}

function localizeMessage(message) {
  if (typeof message === "string" && /^(could not validate credentials|not authenticated|invalid authentication credentials|invalid token)$/i.test(message.trim())) {
    return "Sesi berakhir, silahkan login kembali";
  }
  return message;
}

function getApiMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data.message === "string" && data.message) return localizeMessage(data.message);
  if (typeof data.detail === "string" && data.detail) return localizeMessage(data.detail);
  if (typeof data.error === "string" && data.error) return localizeMessage(data.error);

  if (Array.isArray(data.detail) && data.detail.length) {
    const first = data.detail[0];
    if (typeof first === "string") return localizeMessage(first);
    if (typeof first?.msg === "string") return localizeMessage(first.msg);
  }

  const firstError = data.errors && Object.values(data.errors).flat()[0];
  if (typeof firstError === "string") return localizeMessage(firstError);

  return fallback;
}

export class AdminApiError extends Error {
  constructor(message, { status, data, text, path, method } = {}) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.data = data;
    this.text = text;
    this.path = path;
    this.method = method;
  }
}

function getAuthToken() {
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

export async function fetchAdminDashboard({ signal } = {}) {
  const token = getAuthToken();
  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl("/api/v1/admin/dashboard"), {
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
    throw new Error(getApiMessage(data, "Gagal memuat dashboard admin."));
  }

  return data;
}

async function requestAdmin(path, { method = "GET", body, signal } = {}) {
  const token = getAuthToken();
  const headers = {
    Accept: "application/json",
  };
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body === undefined || isFormData ? body : JSON.stringify(body),
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
    const message = getApiMessage(data, text || "Terjadi kesalahan pada API admin.");
    throw new AdminApiError(message, {
      status: response.status,
      data,
      text,
      path,
      method,
    });
  }

  return data;
}

export async function fetchProducts({ signal } = {}) {
  return requestAdmin("/api/v1/products/", { signal });
}

export async function createProduct(payload, { signal } = {}) {
  return requestAdmin("/api/v1/products/", {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function readProduct(productId, { signal } = {}) {
  return requestAdmin(`/api/v1/products/${productId}`, { signal });
}

export async function updateProduct(productId, payload, { signal } = {}) {
  return requestAdmin(`/api/v1/products/${productId}`, {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function deleteProduct(productId, { signal } = {}) {
  return requestAdmin(`/api/v1/products/${productId}`, {
    method: "DELETE",
    signal,
  });
}

export async function fetchCategories({ signal } = {}) {
  return requestAdmin("/api/v1/categories/", { signal });
}

export async function createCategory(payload, { signal } = {}) {
  return requestAdmin("/api/v1/categories/", {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function readCategory(categoryId, { signal } = {}) {
  return requestAdmin(`/api/v1/categories/${encodeURIComponent(categoryId)}`, { signal });
}

export async function updateCategory(categoryId, payload, { signal } = {}) {
  return requestAdmin(`/api/v1/categories/${encodeURIComponent(categoryId)}`, {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function deleteCategory(categoryId, { signal } = {}) {
  return requestAdmin(`/api/v1/categories/${encodeURIComponent(categoryId)}`, {
    method: "DELETE",
    signal,
  });
}

export async function fetchVouchers({ signal } = {}) {
  return requestAdmin("/api/v1/admin/vouchers", { signal });
}

export async function createVoucher(payload, { signal } = {}) {
  return requestAdmin("/api/v1/vouchers/", {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function readVoucher(voucherId, { signal } = {}) {
  return requestAdmin(`/api/v1/vouchers/${encodeURIComponent(voucherId)}`, { signal });
}

export async function updateVoucher(voucherId, payload, { signal } = {}) {
  return requestAdmin(`/api/v1/vouchers/${encodeURIComponent(voucherId)}`, {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function deleteVoucher(voucherId, { signal } = {}) {
  return requestAdmin(`/api/v1/vouchers/${encodeURIComponent(voucherId)}`, {
    method: "DELETE",
    signal,
  });
}

export async function fetchOrders({ signal } = {}) {
  return requestAdmin("/api/v1/orders/", { signal });
}

export async function fetchCustomers({ page = 1, limit = 10, signal } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  return requestAdmin(`/api/v1/admin/customers?${params.toString()}`, { signal });
}

export async function fetchCustomerDetail(customerId, { signal } = {}) {
  return requestAdmin(`/api/v1/admin/customers/${customerId}`, { signal });
}

export async function updateCustomerData(customerId, payload, { signal } = {}) {
  return requestAdmin(`/api/v1/admin/customers/${customerId}`, {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function fetchCustomerOrders(customerId, { signal } = {}) {
  return requestAdmin(`/api/v1/admin/customers/${customerId}/orders`, { signal });
}

export async function fetchAccountsSummary({ signal } = {}) {
  return requestAdmin(`/api/v1/admin/accounts/summary`, { signal });
}

export async function fetchAccounts({ page = 1, limit = 10, signal } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  return requestAdmin(`/api/v1/admin/accounts?${params.toString()}`, { signal });
}

export async function createAccount(payload, { signal } = {}) {
  return requestAdmin(`/api/v1/admin/accounts`, {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function readAccount(accountId, { signal } = {}) {
  return requestAdmin(`/api/v1/admin/accounts/${accountId}`, { signal });
}

export async function updateAccount(accountId, payload, { signal } = {}) {
  return requestAdmin(`/api/v1/admin/accounts/${accountId}`, {
    method: "PATCH",
    body: payload,
    signal,
  });
}

export async function updateAccountStatus(accountId, payload, { signal } = {}) {
  return requestAdmin(`/api/v1/admin/accounts/${accountId}/status`, {
    method: "PATCH",
    body: payload,
    signal,
  });
}

export async function fetchAdminOrderDetail(orderId, { signal } = {}) {
  return requestAdmin(`/api/v1/admin/orders/${orderId}`, { signal });
}

export async function fetchOrderDetail(orderId, { signal } = {}) {
  return requestAdmin(`/api/v1/orders/${orderId}/detail`, { signal });
}

export async function updateOrderStatus(orderId, payload, { signal } = {}) {
  return requestAdmin(`/api/v1/orders/${orderId}`, {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function fetchNotifications({ signal } = {}) {
  return requestAdmin("/api/v1/notifications", { signal });
}

export async function fetchUnreadNotificationCount({ signal } = {}) {
  return requestAdmin("/api/v1/notifications/unread-count", { signal });
}

export async function markNotificationRead(notificationId, { signal } = {}) {
  return requestAdmin(`/api/v1/notifications/${notificationId}/read`, {
    method: "POST",
    signal,
  });
}

export async function markAllNotificationsRead({ signal } = {}) {
  return requestAdmin("/api/v1/notifications/read-all", {
    method: "POST",
    signal,
  });
}

export function createNotificationsSocket() {
  const token = getAuthToken();
  const url = new URL(getNotificationsWsUrl());

  if (token) {
    url.searchParams.set("token", token);
  }

  return new WebSocket(url.toString());
}
