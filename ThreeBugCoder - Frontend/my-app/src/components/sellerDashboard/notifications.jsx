/* eslint-disable no-unused-vars */
import { AlertTriangle, Bell, ShoppingBag, Tag, UserCog } from "lucide-react";
import { resolveApiUrl } from "../../lib/userApi.js";
import { pickNumber, toNumber } from "./helpers.js";

function formatOrderCode(value) {
  const text = String(value || "").trim();
  if (!text) return "#ORDER";
  return text.startsWith("#") ? text : `#${text}`;
}

function extractSellerNotifications(raw) {
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
    if (looksLikeSellerNotification(candidate)) return [candidate];
  }

  return [];
}

function looksLikeSellerNotification(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      (getSellerNotificationId(value) ||
        value.title ||
        value.message ||
        value.body ||
        value.notification_type ||
        value.created_at ||
        value.createdAt)
  );
}

function normalizeSellerNotifications(source) {
  return extractSellerNotifications(source)
    .map((notification, index) => normalizeSellerNotification(notification, index))
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime() || 0;
      const bTime = new Date(b.createdAt || 0).getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 8);
}

function normalizeSellerNotification(notification, index = 0) {
  const type = normalizeSellerNotificationType(notification);
  const createdAt =
    notification.created_at ||
    notification.createdAt ||
    notification.timestamp ||
    notification.time ||
    notification.date ||
    notification.updated_at;
  const product = extractSellerNotificationProduct(notification);
  const storeName = extractSellerNotificationStoreName(notification);
  const message =
    notification.message ||
    notification.body ||
    notification.description ||
    notification.content ||
    notification.text ||
    getSellerNotificationFallbackMessage(type, notification, product);

  return {
    apiId: getSellerNotificationId(notification),
    id: getSellerNotificationId(notification) || `notification-${createdAt || index}`,
    type,
    accent: getSellerNotificationAccent(type),
    title:
      notification.title ||
      notification.subject ||
      notification.heading ||
      getSellerNotificationFallbackTitle(type, notification, product),
    message,
    createdAt,
    displayTime: formatSellerRelativeTime(createdAt),
    isRead: isSellerNotificationRead(notification),
    product,
    storeName,
    raw: notification,
  };
}

function extractSellerNotificationProduct(notification) {
  if (!notification || typeof notification !== "object") return null;

  const data =
    (notification.data && typeof notification.data === "object" && !Array.isArray(notification.data) ? notification.data : {}) ||
    (notification.payload && typeof notification.payload === "object" && !Array.isArray(notification.payload) ? notification.payload : {});
  const itemSource =
    (Array.isArray(notification.items) && notification.items[0]) ||
    (Array.isArray(notification.order_items) && notification.order_items[0]) ||
    (Array.isArray(notification.products) && notification.products[0]) ||
    (Array.isArray(data.items) && data.items[0]) ||
    (Array.isArray(data.order_items) && data.order_items[0]) ||
    (Array.isArray(data.products) && data.products[0]) ||
    {};
  const productSource =
    notification.product ||
    notification.product_detail ||
    notification.product_info ||
    data.product ||
    data.product_detail ||
    data.product_info ||
    itemSource ||
    {};
  const nestedProduct = productSource.product || productSource.product_detail || {};

  const name =
    productSource.product_name ||
    productSource.name ||
    productSource.title ||
    nestedProduct.name ||
    nestedProduct.title ||
    notification.product_name ||
    notification.productName ||
    data.product_name ||
    data.productName ||
    (data.order && (data.order.product_name || data.order.productName)) ||
    "";
  const image = resolveApiUrl(
    productSource.image ||
      productSource.image_url ||
      productSource.imageUrl ||
      nestedProduct.image ||
      nestedProduct.image_url ||
      nestedProduct.imageUrl ||
      itemSource.image ||
      itemSource.image_url ||
      notification.product_image ||
      notification.productImage ||
      data.product_image ||
      ""
  );
  const quantity =
    toNumber(pickNumber(productSource, {}, ["quantity", "qty", "amount"]) || pickNumber(itemSource, {}, ["quantity", "qty"])) ||
    (typeof notification.quantity === "number" ? notification.quantity : 0) ||
    0;

  if (!name) return null;

  return {
    id:
      productSource.id ||
      productSource.uuid ||
      productSource.product_id ||
      notification.product_id ||
      notification.productId ||
      data.product_id ||
      "",
    name: String(name).trim(),
    image,
    quantity: Math.max(1, quantity),
  };
}

function extractSellerNotificationStoreName(notification) {
  if (!notification || typeof notification !== "object") return "";
  const data =
    notification.data && typeof notification.data === "object" && !Array.isArray(notification.data) ? notification.data : {};
  return (
    notification.store_name ||
    notification.storeName ||
    notification.shop_name ||
    notification.shopName ||
    (notification.store && notification.store.name) ||
    data.store_name ||
    data.storeName ||
    (data.store && typeof data.store === "object" && data.store.name) ||
    ""
  );
}

function groupSellerNotifications(notifications) {
  const groups = [];
  const indexByKey = new Map();
  const ungrouped = { productName: "Notifikasi lainnya", productImage: "", storeName: "", items: [] };

  (notifications || []).forEach((notification) => {
    const name = notification.product?.name ? String(notification.product.name).toLowerCase() : "";
    if (!name) {
      ungrouped.items.push(notification);
      return;
    }
    if (!indexByKey.has(name)) {
      indexByKey.set(name, groups.length);
      groups.push({
        productName: String(notification.product.name),
        productImage: notification.product.image || "",
        storeName: notification.storeName || "",
        items: [],
      });
    }
    groups[indexByKey.get(name)].items.push(notification);
  });

  if (ungrouped.items.length) {
    ungrouped.storeName = ungrouped.items.find((notification) => notification.storeName)?.storeName || "";
    groups.push(ungrouped);
  }

  return groups;
}

function mergeSellerNotifications(incoming, current) {
  const seen = new Set();

  return [...extractSellerNotifications(incoming), ...extractSellerNotifications(current)].filter((notification, index) => {
    const id = getSellerNotificationId(notification) || `${notification.title || notification.message || "notification"}-${index}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function getSellerNotificationId(notification) {
  return notification?.id || notification?.uuid || notification?.notification_id || notification?.notificationId || notification?._id;
}

function isSellerNotificationRead(notification) {
  if (!notification || typeof notification !== "object") return false;
  if (notification.is_read !== undefined) return Boolean(notification.is_read);
  if (notification.isRead !== undefined) return Boolean(notification.isRead);
  if (notification.read !== undefined) return Boolean(notification.read);
  if (notification.read_at || notification.readAt) return true;
  return String(notification.status || "").toLowerCase() === "read";
}

function countSellerUnreadNotifications(raw) {
  return extractSellerNotifications(raw).filter((notification) => !isSellerNotificationRead(notification)).length;
}

function extractSellerUnreadCount(raw) {
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

function normalizeSellerNotificationType(notification) {
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

function getSellerNotificationAccent(type) {
  if (type === "stock") return "danger";
  if (type === "customer") return "neutral";
  if (type === "order") return "pink";
  return "soft";
}

function getSellerNotificationIcon(type) {
  if (type === "stock") return AlertTriangle;
  if (type === "customer") return UserCog;
  if (type === "order") return ShoppingBag;
  return Bell;
}

function getSellerNotificationFallbackTitle(type, notification, product) {
  const orderCode = notification.order_code || notification.orderCode || notification.order_number || notification.orderNumber;
  const productName = product?.name || notification.product_name || notification.productName || notification.product?.name;
  const customerName = notification.customer_name || notification.customerName || notification.user?.name || notification.customer?.name;

  if (type === "order") {
    if (productName) return product?.quantity > 0 ? `"${productName}" terjual (x${product.quantity})` : `"${productName}" terjual`;
    return orderCode ? `Pesanan Baru ${formatOrderCode(orderCode)}` : "Pesanan Baru";
  }
  if (type === "stock") return productName ? `Stok Menipis: ${productName}` : "Stok Menipis";
  if (type === "customer") return customerName ? `Pelanggan Baru: ${customerName}` : "Pelanggan Baru Terdaftar";
  return "Notifikasi Baru";
}

function getSellerNotificationFallbackMessage(type, notification, product) {
  const productName = product?.name || notification.product_name || notification.productName || notification.product?.name;
  if (type === "order") return productName ? `Produk "${productName}" telah terjual dari tokomu dan menunggu proses.` : "Pesanan baru telah diterima dan menunggu proses.";
  if (type === "stock") return productName ? `Stok produk "${productName}" perlu diperiksa kembali.` : "Stok produk perlu diperiksa kembali.";
  if (type === "customer") return "Pelanggan baru telah mendaftar.";
  return "Ada pembaruan baru untuk studionu.";
}

function formatSellerRelativeTime(dateValue) {
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

  return formatSellerDateOnly(dateValue);
}

function formatSellerDateOnly(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatBadgeCount(value) {
  return value > 99 ? "99+" : String(value);
}

function ReceiptIcon(props) {
  return <Tag {...props} />;
}

export {
  extractSellerNotifications,
  looksLikeSellerNotification,
  normalizeSellerNotifications,
  normalizeSellerNotification,
  extractSellerNotificationProduct,
  extractSellerNotificationStoreName,
  groupSellerNotifications,
  mergeSellerNotifications,
  getSellerNotificationId,
  isSellerNotificationRead,
  countSellerUnreadNotifications,
  extractSellerUnreadCount,
  normalizeSellerNotificationType,
  getSellerNotificationAccent,
  getSellerNotificationIcon,
  getSellerNotificationFallbackTitle,
  getSellerNotificationFallbackMessage,
  formatSellerRelativeTime,
  formatSellerDateOnly,
  formatBadgeCount,
  ReceiptIcon
};
