/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ShoppingBasket,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Tag,
  ArrowRight,
  Minus,
  ReceiptText,
  Star,
  X,
  Plus,
  Search,
  Store,
  Truck,
  MapPin,
  ShieldCheck,
  UserRound,
  ImagePlus,
  Camera,
  CircleCheck,
  PencilLine,
  LogOut,
  Menu,
  ThumbsUp,
  HandHeart,
  Sparkles,
  Mail,
  Clock,
  MessageCircle,
  Send,
  HelpCircle,
  BookOpen,
  CalendarDays,
  User,
} from "lucide-react";
import { styles, FONT_DISPLAY } from "../../../styles.js";
import { GlobalStyle } from "../../../components/GlobalStyle.jsx";
import { ConfirmDialog } from "../../../components/ConfirmDialog.jsx";
import LocationPickerMap from "../../../components/LocationPickerMap.jsx";
import {
  createMyAddress,
  createCheckout,
  createPayment,
  createReview,
  deleteMyAddress,
  extractOrderId,
  fetchCurrentUserProfile,
  fetchMyAddresses,
  fetchMyOrder,
  fetchMyOrders,
  fetchProductCategories,
  fetchProductDetail,
  fetchProductRating,
  fetchProductReviews,
  fetchSearchEverything,
  fetchSellerStore,
  fetchStoreDetail,
  fetchStoreProducts,
  fetchStoreReviews,
  fetchUserDashboard,
  fetchVouchers,
  followStore,
  registerSeller,
  resolveApiUrl,
  unfollowStore,
  updateCurrentUserProfile,
  updateMyAddress,
} from "../../../lib/userApi.js";
import { getMidtransSnapEnvironment, loadMidtransSnap, resetMidtransSnap } from "../../../lib/midtrans.js";
import {
  getStoredAuthUser,
  getSessionUser,
} from "../../../lib/authApi.js";
import {
  WISHLIST_ACCENTS,
  TRENDING_SEARCHES,
  parseRupiah,
  formatRupiah,
  FOOTER_COLS,
  PRODUCT_FOOTER_CATEGORIES,
  SHIPPING_OPTIONS,
  pickVoucherNumber,
  formatVoucherDate,
  formatDiscountPercent,
  sortAvailableVouchers,
  normalizeAvailableVouchers,
  Reveal,
} from "../../appHelpers.jsx";
import { resolveProductImage } from "./commerceNormalizers.jsx";
import { pickFirstString } from "../paymentViews.jsx";

function softenAccent(color) {
  if (color === "#f0cc43") return "rgba(240, 204, 67, 0.42)";
  if (color === "#30a6d6") return "rgba(48, 166, 214, 0.26)";
  return "rgba(248, 117, 176, 0.25)";
}

const USER_NAME_KEYS = [
  "name",
  "full_name",
  "fullName",
  "fullname",
  "display_name",
  "displayName",
  "username",
  "nama",
  "nama_lengkap",
  "customer_name",
  "user_name",
  "first_name",
  "firstName",
  "real_name",
  "nickname",
];

const USER_EMAIL_KEYS = ["email", "mail", "email_address", "alamat_email"];
const USER_PHONE_KEYS = ["phone", "phone_number", "phoneNumber", "nomor_telepon", "telephone", "telp", "mobile"];
const USER_AVATAR_KEYS = ["avatar", "avatar_url", "avatarUrl", "photo", "photo_url", "image", "profile_picture", "photoprofil"];

function deepPick(user, keys, depth = 0, seen = new WeakSet()) {
  if (!user || typeof user !== "object" || depth > 8 || seen.has(user)) return "";
  seen.add(user);

  for (const key of keys) {
    const value = user[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  for (const value of Object.values(user)) {
    if (value && typeof value === "object") {
      const found = deepPick(value, keys, depth + 1, seen);
      if (found) return found;
    }
  }

  return "";
}

function pickDisplayName(user) {
  return deepPick(user, USER_NAME_KEYS);
}

function pickEmail(user) {
  return deepPick(user, USER_EMAIL_KEYS);
}

function pickPhone(user) {
  return deepPick(user, USER_PHONE_KEYS);
}

function buildProfilePhoneUpdatePayload(phone) {
  return USER_PHONE_KEYS.reduce((payload, key) => {
    payload[key] = phone;
    return payload;
  }, {});
}

function pickAvatar(user) {
  return resolveApiUrl(deepPick(user, USER_AVATAR_KEYS));
}

const NAME_CHANGE_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const NAME_CHANGE_STORAGE_PREFIX = "bk:name_changed_at:";

function getNameChangeStorageKey(profile) {
  const id = profile?.raw?.id || profile?.id || profile?.email || "guest";
  return `${NAME_CHANGE_STORAGE_PREFIX}${id}`;
}

function getLastNameChangeAt(profile) {
  try {
    const saved = Number(localStorage.getItem(getNameChangeStorageKey(profile)) || 0);
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
}

function recordNameChange(profile) {
  try {
    localStorage.setItem(getNameChangeStorageKey(profile), String(Date.now()));
  } catch {
    /* abaikan error penyimpanan */
  }
}

function getNameChangeCooldown(lastChangedAt) {
  if (!lastChangedAt) {
    return { locked: false, changedAt: 0, eligibleAt: 0, remainingMs: 0 };
  }
  const eligibleAt = lastChangedAt + NAME_CHANGE_COOLDOWN_MS;
  const remainingMs = Math.max(0, eligibleAt - Date.now());
  return { locked: remainingMs > 0, changedAt: lastChangedAt, eligibleAt, remainingMs };
}

function formatDurationRemaining(ms) {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_MINUTE = 60 * 1000;
  const days = Math.floor(ms / ONE_DAY);
  const hours = Math.floor((ms % ONE_DAY) / ONE_HOUR);
  const minutes = Math.floor((ms % ONE_HOUR) / ONE_MINUTE);
  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

function formatChangedAtLabel(dateMs) {
  if (!dateMs) return "";
  try {
    return new Date(dateMs).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function unwrapUserProfile(data) {
  if (!data || typeof data !== "object") return {};

  const candidates = [
    data.user,
    data.profile,
    data.data?.user,
    data.data?.profile,
    data.data?.data?.user,
    data.data?.data?.profile,
    data.result?.user,
    data.result?.profile,
    data.payload?.user,
    data.payload?.profile,
    data.data,
    data.result,
    data.payload,
    data,
  ];

  return candidates.find((candidate) => candidate && typeof candidate === "object") || {};
}

function normalizeProfile(raw, fallbackUser = {}) {
  const profile = unwrapUserProfile(raw);
  const merged = { ...(fallbackUser || {}), ...(profile || {}) };
  return {
    raw: merged,
    name: pickDisplayName(merged) || pickEmail(merged).split("@")[0] || "Pengguna",
    email: pickEmail(merged),
    phone: pickPhone(merged),
    avatar: pickAvatar(merged),
    membership: normalizeMembership(merged.membership || merged),
    orders: normalizeProfileOrders(merged.orders || merged.recent_orders || merged.latest_orders || []),
  };
}

function getProfileInitials(name) {
  const words = String(name || "P")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (words[0]?.[0] || "P").toUpperCase() + (words[1]?.[0] || "").toUpperCase();
}

function normalizeMembership(source = {}) {
  const level =
    source.current_level ||
    source.currentLevel ||
    source.member_type ||
    source.memberType ||
source.membership ||
    source.level ||
    "Bronze Member";
  const nextLevel = source.next_level || source.nextLevel || "";
  const rawProgress = clampPercent(
    source.progress_percentage ??
      source.progressPercentage ??
      source.progress ??
      source.percentage ??
      0
  );
  const remainingAmount =
    Number(source.remaining_amount ?? source.remainingAmount ?? source.amount_to_next_level ?? source.amountToNextLevel ?? 0) || 0;

  /* Level otomatis naik ketika progres sudah mencapai 100% dan masih ada
     level berikutnya. Backend seharusnya juga memperbarui level & reward,
     tapi frontend tetap menampilkan status yang benar. */
  const levelUpReached = nextLevel && rawProgress >= 100;
  const effectiveLevel = levelUpReached ? nextLevel : level;

  const benefits = Array.isArray(source.benefits) && source.benefits.length
    ? source.benefits.filter(Boolean).map(String)
    : getDefaultMemberBenefits(effectiveLevel, source.discount_percentage ?? source.discountPercentage);

  return {
    level: formatMemberLevel(effectiveLevel),
    nextLevel: nextLevel ? formatMemberLevel(nextLevel) : "",
    progress: rawProgress,
    progressText:
      source.progress_text ||
      source.progressText ||
      (levelUpReached && nextLevel
        ? `Selamat! Kamu sekarang menjadi ${formatMemberLevel(nextLevel)}`
        : nextLevel
          ? `Belanja ${formatRupiah(remainingAmount)} lagi untuk menjadi ${formatMemberLevel(nextLevel)}`
          : "Level tertinggi telah tercapai"),
    reward: normalizeMembershipReward(source),
    benefits,
  };
}

function normalizeMembershipReward(source = {}) {
  const candidate =
    source.reward_voucher ??
    source.rewardVoucher ??
    source.pending_reward ??
    source.pendingReward ??
    source.levelup_reward ??
    source.levelUpReward ??
    null;
  if (!candidate || typeof candidate !== "object") return null;

  const code =
    candidate.code ||
    candidate.voucher_code ||
    candidate.voucherCode ||
    candidate.promo_code ||
    candidate.name ||
    candidate.title ||
    "";
  if (!code) return null;

  const discountValue = pickVoucherNumber(candidate, [
    "discount_value", "discountValue", "amount", "discount_amount", "discountAmount", "nominal", "value",
  ]);
  const percent = pickVoucherNumber(candidate, [
    "discount_percent", "discountPercentage", "percentage", "percent", "percentage_value",
  ]);
  const minPurchase = pickVoucherNumber(candidate, [
    "min_purchase", "minPurchase", "minimum_purchase", "minimumPurchase", "min_order", "minOrder", "minimum_amount",
  ]);

  return {
    code: String(code).trim().toUpperCase(),
    title: candidate.title || candidate.name || `Voucher Hadiah Keanggotaan`,
    description: candidate.description || candidate.deskripsi || candidate.label || "",
    discountLabel: percent
      ? `Diskon ${formatDiscountPercent(percent)}%`
      : discountValue
        ? `Diskon ${formatRupiah(discountValue)}`
        : "",
    minPurchaseLabel: minPurchase ? `Min. belanja ${formatRupiah(minPurchase)}` : "",
    expiresAt: candidate.expires_at || candidate.expiresAt || candidate.valid_until || candidate.validUntil || candidate.end_date || candidate.endDate || "",
    displayEndsAt: formatVoucherDate(candidate.expires_at || candidate.expiresAt || candidate.valid_until || candidate.validUntil || candidate.end_date || candidate.endDate),
  };
}

function normalizeProfileOrders(rawOrders) {
  const orders = Array.isArray(rawOrders) ? rawOrders : [];
  return orders
    .map((order, index) => {
      const product = order.product || order.items?.[0]?.product || order.items?.[0] || {};
      const createdAt = order.created_at || order.createdAt || null;
      const statusSource = order.status;
      const status =
        typeof statusSource === "object"
          ? statusSource.label || statusSource.code
          : statusSource || order.status_code || order.statusCode || "Diproses";
      const statusCode =
        order.status_code ||
        order.statusCode ||
        (typeof statusSource === "object" ? statusSource.code : statusSource) ||
        "";

      return {
        id: order.id ?? order.order_id ?? order.orderId ?? order.order_number ?? order.orderNumber ?? `order-${index + 1}`,
        orderNumber: order.order_number || order.orderNumber || order.order_id || order.orderId || order.id || `ORD-${index + 1}`,
        title: product.name || product.product_name || order.product_name || order.productName || order.title || "Produk",
        priceValue: Number(order.price ?? order.total_amount ?? order.totalAmount ?? order.total ?? order.amount ?? product.price ?? 0) || 0,
        status: formatOrderStatus(status),
        statusCode: String(statusCode || "").toLowerCase(),
        action: order.action || getProfileOrderAction(statusCode || status),
        image: resolveProductImage(product) || resolveProductImage(order),
        createdAt,
      };
    })
    .sort((a, b) => {
      const timeA = a.createdAt ? Date.parse(a.createdAt) : 0;
      const timeB = b.createdAt ? Date.parse(b.createdAt) : 0;
      return timeB - timeA;
    });
}

function extractProfileOrderRows(response) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.payload,
    response?.orders,
    response?.items,
    response?.data?.orders,
    response?.data?.items,
    response?.data?.data,
    response?.result?.orders,
    response?.result?.items,
    response?.payload?.orders,
    response?.payload?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function extractBuyerOrderRows(response) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.payload,
    response?.orders,
    response?.items,
    response?.data?.orders,
    response?.data?.items,
    response?.data?.data,
    response?.result?.orders,
    response?.result?.items,
    response?.payload?.orders,
    response?.payload?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function unwrapBuyerOrderDetail(response) {
  if (!response || typeof response !== "object") return {};

  const candidates = [
    response.order,
    response.data?.order,
    response.result?.order,
    response.payload?.order,
    response.data?.data?.order,
    response.data,
    response.result,
    response.payload,
    response,
  ];

  return candidates.find((candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate)) || {};
}

function normalizeBuyerOrders(response) {
  return extractBuyerOrderRows(response)
    .map((order, index) => normalizeBuyerOrder(order, index))
    .sort((a, b) => {
      const timeA = a.createdAt ? Date.parse(a.createdAt) : 0;
      const timeB = b.createdAt ? Date.parse(b.createdAt) : 0;
      return timeB - timeA;
    });
}

function normalizeBuyerOrder(order, index = 0, fallback = {}) {
  const source = order && typeof order === "object" ? order : {};
  const merged = { ...(fallback.raw || fallback || {}), ...source };
  const id =
    merged.id ??
    merged.uuid ??
    merged.order_id ??
    merged.orderId ??
    merged.order_number ??
    merged.orderNumber ??
    fallback.id ??
    `order-${index + 1}`;
  const statusSource =
    merged.status_code ??
    merged.statusCode ??
    merged.order_status ??
    merged.orderStatus ??
    merged.status ??
    merged.payment_status ??
    merged.paymentStatus ??
    merged.payment?.transaction_status ??
    merged.payment?.status ??
    merged.payment?.status_code ??
    fallback.statusCode ??
    "";
  const paymentTransactionStatus =
    merged.payment?.transaction_status ??
    merged.payment?.status ??
    merged.payment?.status_code ??
    "";
  const paidAt = getBuyerOrderPaidAt(merged, fallback);
  const category = getBuyerOrderCategory(statusSource, paymentTransactionStatus, paidAt);
  const items = extractBuyerOrderItems(merged, fallback).map((item, itemIndex) =>
    normalizeBuyerOrderItem(item, itemIndex, merged)
  );
  const totalValue = pickMoney(
    merged.total_amount,
    merged.totalAmount,
    merged.grand_total,
    merged.grandTotal,
    merged.total_price,
    merged.totalPrice,
    merged.total,
    merged.amount,
    merged.payment?.amount,
    fallback.totalValue
  ) || items.reduce((total, item) => total + item.subtotal, 0);
  const orderNumber =
    merged.order_number ||
    merged.orderNumber ||
    merged.invoice_number ||
    merged.invoiceNumber ||
    merged.code ||
    merged.no_order ||
    merged.noOrder ||
    id;

  return {
    id,
    raw: merged,
    orderNumber: String(orderNumber || id).replace(/^#+/, ""),
    statusCode: String(statusSource || ""),
    statusLabel: formatBuyerOrderStatus(statusSource, paymentTransactionStatus, paidAt),
    category,
    createdAt: merged.created_at || merged.createdAt || merged.order_date || merged.orderDate || merged.date || fallback.createdAt || null,
    paidAt,
    totalValue,
    items: items.length ? items : [normalizeBuyerOrderItem({}, 0, merged)],
    storeName: pickStoreName(merged) || fallback.storeName || "",
    paymentMethod:
      merged.payment_method ||
      merged.paymentMethod ||
      merged.payment?.method ||
      merged.payment?.payment_method ||
      fallback.paymentMethod ||
      "",
    shippingAddress:
      formatOrderAddress(merged.shipping_address || merged.shippingAddress || merged.address || merged.destination_address) ||
      fallback.shippingAddress ||
      "",
  };
}

function extractBuyerOrderItems(order, fallback = {}) {
  const candidates = [
    order.items,
    order.order_items,
    order.orderItems,
    order.products,
    order.details,
    order.data?.items,
    order.data?.order_items,
  ];

  const rows = candidates.find(Array.isArray);
  if (rows?.length) return rows;
  if (Array.isArray(fallback.items) && fallback.items.length) return fallback.items.map((item) => item.raw || item);
  if (order.product || order.product_id || order.product_name || order.productName) return [order];
  return [];
}

function getBuyerOrderPaidAt(order = {}, fallback = {}) {
  return pickFirstString(
    order.paid_at,
    order.paidAt,
    order.paid_date,
    order.paidDate,
    order.payment_paid_at,
    order.paymentPaidAt,
    order.payment?.paid_at,
    order.payment?.paidAt,
    order.payment?.settlement_time,
    order.payment?.settlementTime,
    order.payment?.transaction_time,
    order.payment?.transactionTime,
    order.transaction?.paid_at,
    order.transaction?.paidAt,
    order.transaction?.settlement_time,
    order.transaction?.settlementTime,
    order.transaction?.transaction_time,
    order.transaction?.transactionTime,
    fallback.paidAt,
    fallback.raw?.paid_at,
    fallback.raw?.paidAt,
    fallback.raw?.payment?.paid_at,
    fallback.raw?.payment?.paidAt
  );
}

function normalizeBuyerOrderItem(item, index = 0, order = {}) {
  const source = item && typeof item === "object" ? item : {};
  const product = source.product || source.product_detail || source.productDetail || source.item || {};
  const merged = { ...product, ...source };
  const quantity = Number(merged.quantity ?? merged.qty ?? merged.jumlah ?? order.quantity ?? 1) || 1;
  const unitPrice = pickMoney(
    merged.unit_price,
    merged.unitPrice,
    merged.price,
    merged.product_price,
    merged.productPrice,
    product.price,
    order.price
  );
  const subtotal = pickMoney(merged.subtotal, merged.total, merged.total_price, merged.totalPrice) || unitPrice * quantity;
  const orderItemId = pickFirstString(
    merged.order_item_id,
    merged.orderItemId,
    merged.item_id,
    merged.itemId,
    source.id,
    source.uuid,
    merged.id
  );
  const productId = pickFirstString(
    merged.product_id,
    merged.productId,
    product.id,
    product.product_id,
    product.productId,
    source.product_id,
    source.productId
  );

  return {
    id: merged.id ?? merged.product_id ?? merged.productId ?? product.id ?? `item-${index + 1}`,
    orderItemId,
    productId,
    raw: source,
    title:
      merged.name ||
      merged.product_name ||
      merged.productName ||
      merged.title ||
      product.name ||
      order.product_name ||
      "Produk",
    quantity,
    unitPrice,
    subtotal,
    image: resolveProductImage(merged) || resolveProductImage(product) || resolveProductImage(order),
    storeName: pickStoreName(merged) || pickStoreName(order),
  };
}

function getBuyerOrderRequestId(order) {
  const source = order?.raw || order || {};
  return (
    source.id ??
    source.uuid ??
    source.order_id ??
    source.orderId ??
    order?.id ??
    ""
  );
}

function pickStoreName(source = {}) {
  const store = source.store || source.shop || source.seller || source.maker || {};
  return (
    source.store_name ||
    source.storeName ||
    source.shop_name ||
    source.shopName ||
    source.seller_name ||
    source.sellerName ||
    source.maker_name ||
    source.makerName ||
    store.name ||
    store.store_name ||
    store.storeName ||
    store.shop_name ||
    ""
  );
}

function pickMoney(...values) {
  for (const value of values) {
    const parsed = parseMoneyValue(value);
    if (parsed > 0) return parsed;
  }
  return 0;
}

function parseMoneyValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === undefined || value === null || value === "") return 0;

  const raw = String(value).trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  if (!cleaned) return 0;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (/\.\d{3}(\D|$)/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, "")) || 0;
  }
  return Number(cleaned.replace(",", ".")) || 0;
}

function getBuyerOrderCategory(status, paymentTransactionStatus, paidAt = "") {
  const normalized = String(status || "")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .trim();

  // Status yang diubah admin/seller (dikirim/selesai/dibatalkan) adalah
  // sumber utama: meskipun pesanan sudah dibayar, tampilkan status itu.
  if (normalized && /cancel|batal|void|dibatalkan/.test(normalized)) return "canceled";
  if (normalized && /selesai|complete|completed|done|success|finished/.test(normalized)) return "completed";
  if (normalized && /dikirim|kirim|ship|sent|delivered|on delivery|dalam pengiriman/.test(normalized)) return "shipped";

  if (paidAt) return "packed";

  // Prioritaskan status pembayaran Midtrans: hanya settlement/capture/authorize
  // (atau paid/lunas/terbayar) yang dianggap sudah dibayar & boleh dikemas.
  const pay = String(paymentTransactionStatus || "")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .trim();

  if (/settlement|capture|authorize|\bpaid\b|lunas|terbayar/.test(pay)) return "packed";
  if (
    pay &&
    /pending|challenge|expire|deny|failure|gagal|unpaid|belum bayar|belum lunas|waiting payment|menunggu pembayaran|payment pending/.test(
      pay
    )
  )
    return "unpaid";

  if (!normalized) return "unpaid";

  // Sudah dibayar (konfirmasi eksplisit) -> dikemas.
  if (/\bpaid\b|settlement|capture|authorize|lunas|terbayar|diproses|processing|proses|dikemas|packed/.test(normalized)) return "packed";

  // Belum ada konfirmasi pembayaran dari Midtrans -> belum dibayar (jangan dikemas).
  return "unpaid";
}

function formatBuyerOrderStatus(status, paymentTransactionStatus, paidAt = "") {
  const category = getBuyerOrderCategory(status, paymentTransactionStatus, paidAt);
  if (category === "unpaid") return "Belum Bayar";
  if (category === "packed") return "Dikemas";
  if (category === "shipped") return "Dikirim";
  if (category === "completed") return "Selesai";
  if (category === "canceled") return "Dibatalkan";
  return formatOrderStatus(status);
}

function getBuyerOrderStatusStyle(category) {
  if (category === "unpaid") return styles.orderStatusUnpaid;
  if (category === "shipped") return styles.orderStatusShipped;
  if (category === "completed") return styles.orderStatusCompleted;
  if (category === "canceled") return styles.orderStatusCanceled;
  return styles.orderStatusPacked;
}

function formatBuyerOrderDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatOrderAddress(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return "";
  return [
    value.recipient_name || value.recipientName || value.name,
    value.phone || value.phone_number || value.phoneNumber,
    value.address_line || value.addressLine || value.street || value.full_address || value.fullAddress || value.address,
    value.city || value.kota,
    value.province || value.provinsi,
    value.postal_code || value.postalCode || value.kode_pos,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function extractAddressRows(response) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.payload,
    response?.addresses,
    response?.items,
    response?.data?.addresses,
    response?.data?.items,
    response?.data?.data,
    response?.result?.addresses,
    response?.result?.items,
    response?.payload?.addresses,
    response?.payload?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function normalizeAddresses(response) {
  return extractAddressRows(response)
    .map((address, index) => normalizeAddress(address, index))
    .filter((address) => address.id)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

function normalizeAddress(address, index = 0) {
  const source = address?.address && typeof address.address === "object"
    ? { ...address.address, ...address }
    : address || {};
  const id =
    source.id ||
    source.uuid ||
    source.address_id ||
    source.addressId ||
    source._id ||
    `address-${index + 1}`;
  const name =
    source.receiver_name ||
    source.receiverName ||
    source.recipient_name ||
    source.recipientName ||
    source.full_name ||
    source.fullName ||
    source.name ||
    source.nama ||
    "Penerima";
  const label =
    source.label ||
    source.address_label ||
    source.addressLabel ||
    source.type ||
    source.tag ||
    "";
  const city = source.city || source.kota || source.regency || source.district || "";
  const province = source.province || source.state || source.region || source.provinsi || "";
  const postalCode = source.postal_code || source.postalCode || source.zip || source.kode_pos || "";
  const street =
    source.street ||
    source.address_line ||
    source.addressLine ||
    source.detail ||
    source.full_address ||
    source.fullAddress ||
    (typeof source.address === "string" ? source.address : "") ||
    "";

  const lat = Number(source.lat ?? source.latitude ?? source.latlong?.lat);
  const lng = Number(source.lng ?? source.longitude ?? source.latlong?.lng);

  return {
    id,
    name: String(name || "").trim(),
    phone: String(source.phone || source.phone_number || source.phoneNumber || source.telephone || source.telp || "").trim(),
    email: String(source.email || source.mail || "").trim(),
    label: String(label || "").trim(),
    address: String(street || "").trim(),
    city: String(city || "").trim(),
    province: String(province || "").trim(),
    postalCode: String(postalCode || "").trim(),
    notes: String(source.notes || source.note || source.courier_note || source.courierNote || "").trim(),
    isDefault: Boolean(source.is_default ?? source.isDefault ?? source.default ?? source.primary),
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    raw: source,
  };
}

function formatAddressText(address) {
  if (!address) return "";
  return [address.address, address.city, address.province, address.postalCode]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function getAddressOptionLabel(address) {
  const label = address.label ? `${address.label} - ` : "";
  const city = address.city || address.province || "Alamat";
  return `${label}${address.name} (${city})`;
}

function getAddressFormDefaults(address) {
  const lat = Number(address?.lat ?? address?.latitude ?? address?.raw?.lat ?? address?.raw?.latitude);
  const lng = Number(address?.lng ?? address?.longitude ?? address?.raw?.lng ?? address?.raw?.longitude);
  return {
    name: address?.name || "",
    phone: address?.phone || "",
    address: address?.address || "",
    city: address?.city || "",
    province: address?.province || "",
    postalCode: address?.postalCode || "",
    label: address?.label || "",
    notes: address?.notes || "",
    isDefault: Boolean(address?.isDefault),
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  };
}

function buildAddressPayload(form) {
  const payload = {
    recipient_name: form.name.trim(),
    phone: form.phone.trim(),
    address_line: form.address.trim(),
    kota: form.city.trim(),
    provinsi: form.province.trim(),
    kode_pos: form.postalCode.trim(),
    label: form.label.trim(),
    is_default: Boolean(form.isDefault),
  };

  if (Number.isFinite(form.lat)) payload.latitude = form.lat;
  if (Number.isFinite(form.lng)) payload.longitude = form.lng;

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") delete payload[key];
  });

  return payload;
}

function buildCheckoutShippingAddress(address) {
  if (!address) return "";

  const recipient = [address.name, address.phone].filter(Boolean).join(" - ");
  const location = formatAddressText(address);
  return [recipient, location, address.notes]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n");
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, Math.round(number)));
}

function formatMemberLevel(value) {
  const text = String(value || "Bronze Member")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return /member$/i.test(text) ? text : `${text} Member`;
}

function getDefaultMemberBenefits(level, discountPercentage) {
  const discount = Number(discountPercentage);
  const benefits = [];
  if (discount > 0) benefits.push(`Diskon ${discount}% untuk semua produk`);
  benefits.push("Akses ke promo member");
  benefits.push("Riwayat pesanan tersimpan");
  if (/gold|platinum|diamond/i.test(String(level))) benefits.push("Akses awal ke koleksi baru");
  return benefits;
}

function formatOrderStatus(value) {
  const raw = String(value || "Diproses").trim();
  const normalized = raw.replace(/[_-]+/g, " ").toLowerCase();
  if (normalized === "dikirim" || normalized === "shipped") return "Dikirim";
  if (normalized === "selesai" || normalized === "completed") return "Selesai";
  if (normalized === "dibatalkan" || normalized === "cancelled" || normalized === "canceled") return "Dibatalkan";
  if (normalized === "diproses" || normalized === "processing") return "Diproses";
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProfileOrderAction(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("selesai") || normalized.includes("completed")) return "Beli Lagi";
  if (normalized.includes("dikirim") || normalized.includes("shipped")) return "Lacak";
  return "Detail";
}

function extractProductReviewRows(response) {
  if (!response || typeof response !== "object") return [];
  const candidates = [
    response.reviews,
    response.items,
    response.list,
    response.data?.reviews,
    response.result?.reviews,
    response.payload?.reviews,
    response,
    response.data,
    response.result,
    response.payload,
    response.data?.data,
  ];
  return candidates.find(Array.isArray) || [];
}

function normalizeProductReviews(response) {
  return extractProductReviewRows(response).map((review, index) => {
    const user = review?.user && typeof review.user === "object" ? review.user : {};
    return {
      id: review?.id || review?.uuid || `review-${index}`,
      productId: review?.product_id || review?.productId || "",
      rating: Number(review?.rating ?? review?.stars ?? review?.score) || 0,
      comment: review?.comment || review?.review || review?.text || review?.ulasan || "",
      createdAt: review?.created_at || review?.createdAt || review?.date || review?.timestamp || null,
      photo: pickReviewPhoto(review),
      user: {
        id: user?.id || "",
        name: user?.name || review?.user_name || review?.userName || review?.name || "Pelanggan BumiKriya",
        avatar:
          resolveApiUrl(
            user?.photoprofil ||
              user?.photo_profile ||
              user?.photoProfil ||
              user?.avatar ||
              user?.profile_picture ||
              user?.profilePicture ||
              review?.avatar
          ) || "",
      },
      raw: review,
    };
  });
}

function getBestProductReviews(reviews) {
  return [...reviews].sort((a, b) => {
    const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (ratingDiff) return ratingDiff;

    const timeA = a.createdAt ? Date.parse(a.createdAt) || 0 : 0;
    const timeB = b.createdAt ? Date.parse(b.createdAt) || 0 : 0;
    if (timeA !== timeB) return timeB - timeA;

    return String(a.id).localeCompare(String(b.id));
  });
}

function pickReviewPhoto(review = {}) {
  const candidates = [
    review.image,
    review.image_url,
    review.imageUrl,
    review.photo,
    review.photo_url,
    review.photoUrl,
    review.foto,
    review.foto_url,
    review.review_image,
    review.reviewImage,
    review.review_photo,
    review.reviewPhoto,
    review.attachment,
    review.attachment_url,
    review.attachmentUrl,
    review.media,
    Array.isArray(review.images) ? review.images[0] : null,
    Array.isArray(review.photos) ? review.photos[0] : null,
    Array.isArray(review.attachments) ? review.attachments[0] : null,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") {
      const resolved = resolveApiUrl(candidate);
      if (resolved) return resolved;
      continue;
    }
    if (typeof candidate === "object") {
      const resolved = resolveApiUrl(
        candidate.url ||
          candidate.path ||
          candidate.image ||
          candidate.image_url ||
          candidate.photo ||
          candidate.photo_url ||
          candidate.file ||
          candidate.file_url
      );
      if (resolved) return resolved;
    }
  }
  return "";
}

function normalizeRatingSummary(response) {
  if (!response || typeof response !== "object") return { average: 0, count: 0 };
  return {
    average: Number(response.average_rating ?? response.averageRating ?? response.average ?? response.avg ?? 0) || 0,
    count: Number(response.review_count ?? response.reviewCount ?? response.total ?? response.count ?? 0) || 0,
  };
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isOrderItemReviewed(orderItemId) {
  if (!orderItemId) return false;
  try {
    const parsed = JSON.parse(localStorage.getItem("bkReviewedOrderItems") || "[]");
    return Array.isArray(parsed) && parsed.includes(String(orderItemId));
  } catch {
    return false;
  }
}

function markOrderItemReviewed(orderItemId) {
  if (!orderItemId) return;
  try {
    const parsed = JSON.parse(localStorage.getItem("bkReviewedOrderItems") || "[]");
    const list = Array.isArray(parsed) ? parsed : [];
    const key = String(orderItemId);
    if (!list.includes(key)) list.push(key);
    localStorage.setItem("bkReviewedOrderItems", JSON.stringify(list));
  } catch {}
}

export {
  softenAccent,
  USER_NAME_KEYS,
  USER_EMAIL_KEYS,
  USER_PHONE_KEYS,
  USER_AVATAR_KEYS,
  deepPick,
  pickDisplayName,
  pickEmail,
  pickPhone,
  buildProfilePhoneUpdatePayload,
  pickAvatar,
  NAME_CHANGE_COOLDOWN_MS,
  NAME_CHANGE_STORAGE_PREFIX,
  getNameChangeStorageKey,
  getLastNameChangeAt,
  recordNameChange,
  getNameChangeCooldown,
  formatDurationRemaining,
  formatChangedAtLabel,
  unwrapUserProfile,
  normalizeProfile,
  getProfileInitials,
  normalizeMembership,
  normalizeMembershipReward,
  normalizeProfileOrders,
  extractProfileOrderRows,
  extractBuyerOrderRows,
  unwrapBuyerOrderDetail,
  normalizeBuyerOrders,
  normalizeBuyerOrder,
  extractBuyerOrderItems,
  getBuyerOrderPaidAt,
  normalizeBuyerOrderItem,
  getBuyerOrderRequestId,
  pickStoreName,
  pickMoney,
  parseMoneyValue,
  getBuyerOrderCategory,
  formatBuyerOrderStatus,
  getBuyerOrderStatusStyle,
  formatBuyerOrderDate,
  formatOrderAddress,
  extractAddressRows,
  normalizeAddresses,
  normalizeAddress,
  formatAddressText,
  getAddressOptionLabel,
  getAddressFormDefaults,
  buildAddressPayload,
  buildCheckoutShippingAddress,
  clampPercent,
  formatMemberLevel,
  getDefaultMemberBenefits,
  formatOrderStatus,
  getProfileOrderAction,
  extractProductReviewRows,
  normalizeProductReviews,
  getBestProductReviews,
  pickReviewPhoto,
  normalizeRatingSummary,
  formatReviewDate,
  isOrderItemReviewed,
  markOrderItemReviewed
};