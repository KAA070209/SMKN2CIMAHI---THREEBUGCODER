/* eslint-disable no-unused-vars */

import React from "react";

import { fetchCustomers, resolveApiUrl } from "../../../lib/adminApi.js";

function normalizeDashboard(raw) {
  const payload = raw?.data?.dashboard || raw?.data || raw?.dashboard || raw || {};
  const stats = payload.stats || payload.summary || payload.metrics || {};

  return {
    totalSales: pickNumber(payload, stats, [
      "totalSales",
      "total_sales",
      "salesTotal",
      "sales_total",
      "revenue",
      "totalRevenue",
      "total_revenue",
      "total_penjualan",
    ]),
    totalSellers: pickNumber(payload, stats, [
      "totalSellers",
      "total_sellers",
      "sellersCount",
      "sellers_count",
      "sellerCount",
      "seller_count",
      "totalSeller",
      "total_seller",
      "jumlah_seller",
      "jumlah_sellers",
    ]),
    newOrders: pickNumber(payload, stats, [
      "newOrders",
      "new_orders",
      "ordersToday",
      "orders_today",
      "pendingOrders",
      "pending_orders",
      "pesanan_baru",
    ]),
    activeProducts: pickNumber(payload, stats, [
      "activeProducts",
      "active_products",
      "productActive",
      "productsActive",
      "products_active",
      "totalProducts",
      "total_products",
      "produk_aktif",
    ]),
    salesChange: pickText(payload, stats, ["salesChange", "sales_change", "salesGrowth", "sales_growth", "revenueChange"]) || "",
    sellersChange: pickText(payload, stats, ["sellersChange", "sellers_change", "sellerGrowth", "seller_growth", "totalSellersChange", "total_sellers_change"]) || "",
    ordersChange: pickText(payload, stats, ["ordersChange", "orders_change", "newOrdersChange", "orderGrowth", "order_growth"]) || "",
    productsChange: pickText(payload, stats, ["productsChange", "products_change", "activeProductsChange", "lastProductUpdate"]) || "",
    topSellers: normalizeTopSellers(
      payload.topSellers ||
        payload.top_sellers ||
        payload.topSellerByRevenue ||
        payload.top_sellers_by_revenue ||
        payload.topSellersByEarnings ||
        payload.top_sellers_by_earnings ||
        payload.leaderboard ||
        []
    ),
    recentOrders: normalizeOrders(
      payload.recentOrders ||
        payload.recent_orders ||
        payload.latestOrders ||
        payload.latest_orders ||
        payload.orders ||
        []
    ),
  };
}

function normalizeTopSellers(source) {
  if (!Array.isArray(source)) return [];

  return source
    .map((item, index) => {
      const seller = item.seller || item.user || item.account || {};
      const stats = item.stats || item.summary || {};
      const avatar =
        item.photoprofil ||
        item.photo_profil ||
        item.photoProfil ||
        item.avatar ||
        item.avatar_url ||
        seller.photoprofil ||
        seller.photo_profil ||
        seller.photoProfil ||
        seller.avatar ||
        seller.avatar_url;

      return {
        name:
          item.seller_name ||
          item.sellerName ||
          item.store_name ||
          item.storeName ||
          item.store ||
          item.nama_toko ||
          item.username ||
          seller.name ||
          seller.username ||
          seller.store_name ||
          String(item.name || `Seller ${index + 1}`),
        earnings: pickNumber(item, stats, [
          "earnings",
          "total_earnings",
          "totalEarnings",
          "revenue",
          "total_revenue",
          "totalRevenue",
          "income",
          "penghasilan",
          "sales",
          "total_sales",
          "totalSales",
          "amount",
        ]),
        avatar: resolveApiUrl(avatar),
      };
    })
    .filter((seller) => seller.name && seller.earnings > 0)
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);
}

function normalizeOrders(source) {
  if (!Array.isArray(source)) return [];

  return source.slice(0, 3).map((order, index) => {
    const createdAt = order.created_at || order.createdAt || order.date || order.orderDate || order.updated_at;
    const status = String(order.status || order.order_status || order.state || "diproses").toLowerCase();

    return {
      id: order.id || order.uuid || order.order_id || order.orderNumber || index,
      code: order.code || order.order_code || order.orderNumber || order.order_number || order.order_id || `ORD-${String(order.id || index + 1).padStart(3, "0")}`,
      customer:
        order.customer?.name ||
        order.user?.name ||
        order.customer_name ||
        order.customerName ||
        order.name ||
        "Pelanggan",
      status,
      statusLabel: getStatusLabel(status),
      displayTime: formatOrderTime(createdAt, order.time || order.displayTime),
    };
  });
}

function pickNumber(primary, secondary, keys) {
  for (const key of keys) {
    const value = primary?.[key] ?? secondary?.[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "object") continue;
    return toNumber(value);
  }
  return 0;
}

function pickText(primary, secondary, keys) {
  for (const key of keys) {
    const value = primary?.[key] ?? secondary?.[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function pickDateText(primary, secondary, keys) {
  for (const key of keys) {
    const value = primary?.[key] ?? secondary?.[key];
    if (value === undefined || value === null || value === "") continue;
    return String(value);
  }
  return "";
}

function toNumber(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
  return Number(normalized) || 0;
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

function formatOrderTime(dateValue, fallback) {
  if (fallback) return String(fallback);
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status) {
  if (["sent", "shipped", "delivered", "dikirim"].includes(status)) return "DIKIRIM";
  if (["done", "completed", "complete", "selesai"].includes(status)) return "SELESAI";
  if (["cancelled", "canceled", "dibatalkan"].includes(status)) return "BATAL";
  return "DIPROSES";
}

function getStatusClass(status) {
  if (["sent", "shipped", "delivered", "dikirim"].includes(status)) return "is-sent";
  if (["done", "completed", "complete", "selesai"].includes(status)) return "is-done";
  if (["cancelled", "canceled", "dibatalkan"].includes(status)) return "is-cancelled";
  return "is-processing";
}

export {
  normalizeDashboard,
  normalizeTopSellers,
  normalizeOrders,
  pickNumber,
  pickText,
  pickDateText,
  toNumber,
  formatRupiah,
  formatCompactNumber,
  formatOrderTime,
  getStatusLabel,
  getStatusClass
};