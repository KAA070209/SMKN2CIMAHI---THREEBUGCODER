const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://backendbumikriya-production.up.railway.app"
).replace(/\/$/, "");
const NOTIFICATIONS_WS_URL = import.meta.env.VITE_NOTIFICATIONS_WS_URL || "";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
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

export function createNotificationsSocket() {
  const token = getAuthToken();
  const url = new URL(getNotificationsWsUrl());

  if (token) {
    url.searchParams.set("token", token);
  }

  return new WebSocket(url.toString());
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

function getAuthToken() {
  try {
    const token = localStorage.getItem("authToken") || "";
    const trimmed = token.trim().replace(/^"|"$/g, "");
    if (/^bearer\s+/i.test(trimmed)) {
      return trimmed.replace(/^bearer\s+/i, "");
    }
    return trimmed;
  } catch {
    return "";
  }
}

async function requestUser(path, { method = "GET", body, signal, withAuth = true } = {}) {
  const headers = { Accept: "application/json" };
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (withAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
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
    throw new Error(getApiMessage(data, "Terjadi kesalahan pada layanan."));
  }

  return data;
}

export async function fetchProducts({ signal } = {}) {
  return requestUser("/api/v1/products/", { signal, withAuth: false });
}

export async function fetchProductDetail(productId, { signal } = {}) {
  return requestUser(`/api/v1/products/${encodeURIComponent(productId)}`, {
    signal,
    withAuth: false,
  });
}

export async function fetchStoreDetail(storeId, { signal } = {}) {
  return requestUser(`/api/v1/stores/${encodeURIComponent(storeId)}`, {
    signal,
    withAuth: false,
  });
}

export async function fetchStoreProducts(storeId, { signal } = {}) {
  return requestUser(`/api/v1/stores/${encodeURIComponent(storeId)}/products?limit=100`, {
    signal,
    withAuth: false,
  });
}

export async function fetchStoreReviews(storeId, { signal } = {}) {
  return requestUser(`/api/v1/stores/${encodeURIComponent(storeId)}/reviews`, {
    signal,
    withAuth: false,
  });
}

export async function fetchProductReviews(productId, { signal } = {}) {
  return requestUser(`/api/v1/products/${encodeURIComponent(productId)}/reviews`, {
    signal,
    withAuth: false,
  });
}

export async function fetchProductRating(productId, { signal } = {}) {
  return requestUser(`/api/v1/products/${encodeURIComponent(productId)}/rating`, {
    signal,
    withAuth: false,
  });
}

export async function createReview(payload, { signal } = {}) {
  return requestUser("/api/v1/reviews", {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function followStore(storeId, { signal } = {}) {
  return requestUser(`/api/v1/stores/${encodeURIComponent(storeId)}/follow`, {
    method: "POST",
    signal,
  });
}

export async function unfollowStore(storeId, { signal } = {}) {
  return requestUser(`/api/v1/stores/${encodeURIComponent(storeId)}/follow`, {
    method: "DELETE",
    signal,
  });
}

export async function fetchProductCategories({ signal } = {}) {
  return requestUser("/api/v1/categories/", { signal, withAuth: false });
}

export async function fetchSearchEverything(query, { signal } = {}) {
  const params = new URLSearchParams({ q: String(query || "").trim() });
  return requestUser(`/search/all?${params.toString()}`, {
    signal,
    withAuth: false,
  });
}

export async function fetchRecipeDetail(recipeId, { signal } = {}) {
  return requestUser(`/recipes/${encodeURIComponent(recipeId)}`, {
    signal,
    withAuth: false,
  });
}

export async function fetchUserDashboard({ signal } = {}) {
  const [productsResponse, categoriesResponse] = await Promise.all([
    fetchProducts({ signal }).catch(() => null),
    fetchProductCategories({ signal }).catch(() => null),
  ]);

  const products = extractCollection(productsResponse, [
    "products",
    "items",
    "list",
    "data",
    "value",
    "values",
    "rows",
    "results",
  ]);
  const categories = extractCollection(categoriesResponse, [
    "categories",
    "category",
    "items",
    "list",
    "data",
    "value",
    "values",
    "rows",
    "results",
  ]);

  return { products, categories };
}

function extractCollection(response, keys) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.payload,
    response?.data?.data,
    response?.result?.data,
    response?.payload?.data,
    response?.value,
    response?.data?.value,
    response?.result?.value,
    response?.payload?.value,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (!candidate || typeof candidate !== "object") continue;

    for (const key of keys) {
      if (Array.isArray(candidate[key])) return candidate[key];
    }
  }

  return [];
}

export async function fetchProfile({ signal } = {}) {
  return requestUser("/api/v1/profile", { signal });
}

export async function fetchCurrentUserProfile({ signal } = {}) {
  return requestUser("/api/v1/user/me", { signal });
}

export async function updateCurrentUserProfile(payload, { signal } = {}) {
  return requestUser("/api/v1/user/me", {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function fetchMyAddresses({ signal } = {}) {
  return requestUser("/api/v1/user/me/addresses", { signal });
}

export async function createMyAddress(payload, { signal } = {}) {
  return requestUser("/api/v1/user/me/addresses", {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function updateMyAddress(addressId, payload, { signal } = {}) {
  return requestUser(`/api/v1/user/me/addresses/${encodeURIComponent(addressId)}`, {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function deleteMyAddress(addressId, { signal } = {}) {
  return requestUser(`/api/v1/user/me/addresses/${encodeURIComponent(addressId)}`, {
    method: "DELETE",
    signal,
  });
}

export async function fetchVouchers({ signal } = {}) {
  return requestUser("/api/v1/vouchers/", { signal, withAuth: false });
}

export async function fetchOrders({ signal } = {}) {
  return requestUser("/api/v1/orders", { signal });
}

export async function fetchMyOrders({ signal } = {}) {
  return requestUser("/api/v1/orders/me", { signal });
}

export async function fetchMyOrder(orderId, { signal } = {}) {
  return requestUser(`/api/v1/orders/me/${encodeURIComponent(orderId)}`, { signal });
}

export async function fetchWishlists({ signal } = {}) {
  return requestUser("/api/v1/wishlists/", { signal });
}

export async function addToWishlist(payload, { signal } = {}) {
  return requestUser("/api/v1/wishlists/", {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function removeFromWishlist(itemId, { signal } = {}) {
  return requestUser(`/api/v1/wishlists/${itemId}`, {
    method: "DELETE",
    signal,
  });
}

export async function fetchCart({ signal } = {}) {
  return requestUser("/api/v1/cart", { signal });
}

export async function addCartItem(payload, { signal } = {}) {
  return requestUser("/api/v1/cart/items", {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function updateCartItem(itemId, payload, { signal } = {}) {
  return requestUser(`/api/v1/cart/items/${itemId}`, {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function removeCartItem(itemId, { signal } = {}) {
  return requestUser(`/api/v1/cart/items/${itemId}`, {
    method: "DELETE",
    signal,
  });
}

export async function clearCart({ signal } = {}) {
  return requestUser("/api/v1/cart", {
    method: "DELETE",
    signal,
  });
}

export async function createCheckout(payload, { signal } = {}) {
  return requestUser("/api/v1/checkout/", {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function createPayment(orderId, payload, { signal } = {}) {
  const path = `/payments/${encodeURIComponent(orderId)}`;
  return requestUser(path, {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function sendPaymentWebhook(payload, { signal } = {}) {
  return requestUser("/payments/webhook", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function extractOrderId(data) {
  if (!data || typeof data !== "object") return null;

  const candidates = [
    data.order_id,
    data.orderId,
    data.order,
    data.id,
    data.uuid,
    data.code,
    data.payment_id,
    data.paymentId,
    data.data?.order_id,
    data.data?.orderId,
    data.data?.order,
    data.data?.id,
    data.data?.uuid,
    data.data?.code,
    data.result?.order_id,
    data.result?.orderId,
    data.result?.id,
    data.data?.data?.order_id,
    data.data?.data?.id,
  ];

  for (const candidate of candidates) {
    if (candidate === 0 || candidate) {
      const stringId = String(candidate).trim();
      if (stringId) return stringId;
    }
  }

  return null;
}

export async function fetchSellerDashboardSummary({ signal } = {}) {
  return requestUser("/api/v1/seller/dashboard/summary", { signal });
}

export async function fetchSellerStore({ signal } = {}) {
  return requestUser("/api/v1/seller/store", { signal });
}

export async function updateSellerStore(payload, { signal } = {}) {
  return requestUser("/api/v1/seller/store", {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function fetchSellerProducts({ signal } = {}) {
  return requestUser("/api/v1/seller/products", { signal });
}

export async function fetchSellerOrders({ signal } = {}) {
  return requestUser("/api/v1/seller/orders", { signal });
}

export async function updateSellerOrderStatus(orderId, payload, { signal } = {}) {
  return requestUser(`/api/v1/seller/orders/${orderId}/status`, {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function createSellerProduct(payload, { signal } = {}) {
  return requestUser("/api/v1/seller/products", {
    method: "POST",
    body: payload,
    signal,
  });
}

export async function updateSellerProduct(productId, payload, { signal } = {}) {
  return requestUser(`/api/v1/seller/products/${productId}`, {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function deleteSellerProduct(productId, { signal } = {}) {
  return requestUser(`/api/v1/seller/products/${productId}`, {
    method: "DELETE",
    signal,
  });
}

export async function updateSellerProductStock(productId, payload, { signal } = {}) {
  return requestUser(`/api/v1/seller/products/${productId}/stock`, {
    method: "PUT",
    body: payload,
    signal,
  });
}

export async function fetchSellerNotifications({ signal } = {}) {
  return requestUser("/api/v1/notifications", { signal });
}

export async function fetchSellerUnreadNotificationCount({ signal } = {}) {
  return requestUser("/api/v1/notifications/unread-count", { signal });
}

export async function markSellerNotificationRead(notificationId, { signal } = {}) {
  return requestUser(`/api/v1/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "POST",
    signal,
  });
}

export async function markSellerNotificationsReadAll({ signal } = {}) {
  return requestUser("/api/v1/notifications/read-all", {
    method: "POST",
    signal,
  });
}

export async function registerSeller(payload) {
  const headers = { Accept: "application/json" };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl("/api/v1/seller/register"), {
    method: "POST",
    headers,
    body: isFormData ? payload : JSON.stringify(payload),
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(getApiMessage(data, "Gagal mendaftarkan toko."));
  }

  return data;
}
