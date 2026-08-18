/* eslint-disable no-unused-vars */

import { AlertTriangle, Bell, ShoppingBag, UserCog } from "lucide-react";

import { resolveApiUrl } from "../../lib/adminApi.js";
import { toNumber } from "./helpers/dashboardHelpers.jsx";

import { getInitials, formatDateOnly } from "./helpers/accountCustomerHelpers.jsx";

function extractNotifications(raw) {
  if (Array.isArray(raw)) return raw;

  const candidates = [
    raw?.data?.notifications,
    raw?.data?.items,
    raw?.data?.results,
    raw?.notifications,
    raw?.items,
    raw?.results,
    raw?.notification,
    raw?.data?.notification,
    raw?.data,
    raw,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (looksLikeNotification(candidate)) return [candidate];
  }

  return [];
}

function looksLikeNotification(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      (getNotificationId(value) ||
        value.title ||
        value.message ||
        value.body ||
        value.notification_type ||
        value.created_at ||
        value.createdAt)
  );
}

function normalizeNotifications(source) {
  return extractNotifications(source)
    .map((notification, index) => normalizeNotification(notification, index))
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime() || 0;
      const bTime = new Date(b.createdAt || 0).getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 8);
}

function normalizeNotification(notification, index = 0) {
  const type = normalizeNotificationType(notification);
  const createdAt =
    notification.created_at ||
    notification.createdAt ||
    notification.timestamp ||
    notification.time ||
    notification.date ||
    notification.updated_at;
  const message =
    notification.message ||
    notification.body ||
    notification.description ||
    notification.content ||
    notification.text ||
    getNotificationFallbackMessage(type);

  return {
    apiId: getNotificationId(notification),
    id: getNotificationId(notification) || `notification-${createdAt || index}`,
    type,
    accent: getNotificationAccent(type),
    title: notification.title || notification.subject || notification.heading || getNotificationFallbackTitle(type, notification),
    message,
    createdAt,
    displayTime: formatRelativeTime(createdAt),
    isRead: isNotificationRead(notification),
    raw: notification,
  };
}

function mergeNotifications(incoming, current) {
  const seen = new Set();

  return [...extractNotifications(incoming), ...extractNotifications(current)].filter((notification, index) => {
    const id = getNotificationId(notification) || `${notification.title || notification.message || "notification"}-${index}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function getNotificationId(notification) {
  return notification?.id || notification?.uuid || notification?.notification_id || notification?.notificationId || notification?._id;
}

function isNotificationRead(notification) {
  if (!notification || typeof notification !== "object") return false;
  if (notification.is_read !== undefined) return Boolean(notification.is_read);
  if (notification.isRead !== undefined) return Boolean(notification.isRead);
  if (notification.read !== undefined) return Boolean(notification.read);
  if (notification.read_at || notification.readAt) return true;
  return String(notification.status || "").toLowerCase() === "read";
}

function countUnreadNotifications(raw) {
  return extractNotifications(raw).filter((notification) => !isNotificationRead(notification)).length;
}

function extractUnreadCount(raw) {
  if (typeof raw === "number") return raw;

  const candidates = [
    raw?.unread_count,
    raw?.unreadCount,
    raw?.count,
    raw?.total,
    raw?.data?.unread_count,
    raw?.data?.unreadCount,
    raw?.data?.count,
    raw?.data?.total,
    raw?.meta?.unread_count,
    raw?.meta?.unreadCount,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== "") return toNumber(candidate);
  }

  return null;
}

function normalizeNotificationType(notification) {
  const value = String(
    notification.type ||
      notification.notification_type ||
      notification.category ||
      notification.event ||
      notification.kind ||
      notification.title ||
      notification.message ||
      ""
  ).toLowerCase();

  if (value.includes("stock") || value.includes("stok") || value.includes("inventory")) return "stock";
  if (value.includes("customer") || value.includes("pelanggan") || value.includes("register")) return "customer";
  if (value.includes("order") || value.includes("pesanan") || value.includes("checkout")) return "order";
  return "general";
}

function getNotificationAccent(type) {
  if (type === "stock") return "danger";
  if (type === "customer") return "neutral";
  if (type === "order") return "pink";
  return "soft";
}

function getNotificationIcon(type) {
  if (type === "stock") return AlertTriangle;
  if (type === "customer") return UserCog;
  if (type === "order") return ShoppingBag;
  return Bell;
}

function getNotificationFallbackTitle(type, notification) {
  const orderCode = notification.order_code || notification.orderCode || notification.order_number || notification.orderNumber;
  const productName = notification.product_name || notification.productName || notification.product?.name;
  const customerName = notification.customer_name || notification.customerName || notification.user?.name || notification.customer?.name;

  if (type === "order") return orderCode ? `New Order ${formatOrderCode(orderCode)}` : "New Order";
  if (type === "stock") return productName ? `Stock Low: ${productName}` : "Stock Low";
  if (type === "customer") return customerName ? `Pelanggan Baru: ${customerName}` : "New Customer Registered";
  return "Notifikasi Baru";
}

function getNotificationFallbackMessage(type) {
  if (type === "order") return "Pesanan baru telah diterima dan menunggu proses.";
  if (type === "stock") return "Stok produk perlu diperiksa kembali.";
  if (type === "customer") return "Pelanggan baru telah mendaftar.";
  return "Ada pembaruan baru untuk admin.";
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return "Baru saja";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return "Baru saja";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari yang lalu`;

  return formatDateOnly(dateValue);
}

function formatBadgeCount(value) {
  return value > 99 ? "99+" : String(value);
}

function getStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem("authUser") || "{}");
    return buildAdminUser(user);
  } catch {
    return buildAdminUser({});
  }
}

function buildAdminUser(user) {
  const profile = user?.profile || user?.user || user?.account || {};
  const name =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    profile?.name ||
    profile?.full_name ||
    profile?.username ||
    "Admin";
  const avatar = resolveApiUrl(
    user?.photoprofil ||
      user?.photo_profil ||
      user?.photoProfil ||
      user?.avatar ||
      user?.avatar_url ||
      user?.photo ||
      profile?.photoprofil ||
      profile?.photo_profil ||
      profile?.photoProfil ||
      profile?.avatar ||
      profile?.avatar_url ||
      profile?.photo
  );
  return {
    id: user?.id || user?.uuid || user?.user_id || user?.userId || user?.account_id || user?.accountId || profile?.id || profile?.user_id || profile?.userId || "",
    name,
    firstName: String(name).split(" ")[0] || "Admin",
    email: user?.email || user?.mail || profile?.email || profile?.mail || "",
    avatar,
    initials: getInitials(name),
  };
}

export {
  extractNotifications,
  looksLikeNotification,
  normalizeNotifications,
  normalizeNotification,
  mergeNotifications,
  getNotificationId,
  isNotificationRead,
  countUnreadNotifications,
  extractUnreadCount,
  normalizeNotificationType,
  getNotificationAccent,
  getNotificationIcon,
  getNotificationFallbackTitle,
  getNotificationFallbackMessage,
  formatRelativeTime,
  formatBadgeCount,
  getStoredUser,
  buildAdminUser
};
