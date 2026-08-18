/* eslint-disable no-unused-vars */

import React from "react";

import { fetchCustomers, resolveApiUrl } from "../../../lib/adminApi.js";
import { pickNumber, toNumber, formatRupiah, formatOrderTime } from "./dashboardHelpers.jsx";

import { getCustomerId } from "./accountCustomerHelpers.jsx";

function extractOrders(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.orders)) return raw.data.orders;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.orders)) return raw.orders;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

function normalizeOrderRecords(source) {
  return extractOrders(source).map((order, index) => normalizeOrderRecord(order, index));
}

function normalizeOrderRecord(order, index = 0) {
  const id = getOrderId(order) || `order-${index}`;
  const status = normalizeStatus(order.status || order.order_status || order.state || order.fulfillment_status || "diproses");
  const customer = getCustomerName(order);
  const total = pickNumber(order, order.payment || order.summary || {}, [
    "total",
    "total_amount",
    "grand_total",
    "grandTotal",
    "total_price",
    "amount",
    "subtotal",
  ]);
  const createdAt = order.created_at || order.createdAt || order.order_date || order.orderDate || order.date || order.updated_at;

  return {
    id,
    code: formatOrderCode(order.code || order.order_code || order.order_number || order.orderNumber || order.invoice_number || id),
    customer,
    initial: getInitial(customer),
    createdAt,
    displayDate: formatOrderTime(createdAt, order.display_date || order.displayDate || order.time),
    total,
    status,
    statusLabel: getOrderStatusLabel(status),
    raw: order,
  };
}

function normalizeOrderDetail(raw, fallbackOrder) {
  const payload = raw?.data?.order || raw?.data?.detail || raw?.data || raw?.order || raw?.detail || raw;
  if (!payload && !fallbackOrder) return null;

  const base = fallbackOrder?.raw || fallbackOrder || {};
  const merged = { ...base, ...(payload || {}) };
  const normalized = normalizeOrderRecord(merged);
  const items = normalizeOrderItems(
    merged.items ||
      merged.order_items ||
      merged.orderItems ||
      merged.products ||
      merged.details ||
      merged.detail_items ||
      []
  );
  const paymentSource = merged.payment || merged.summary || merged.payment_summary || {};
  const subtotal = pickNumber(merged, paymentSource, ["subtotal", "sub_total", "items_total", "product_total", "subtotal_produk"]);
  const shipping = pickNumber(merged, paymentSource, ["shipping_cost", "shippingCost", "delivery_fee", "deliveryFee", "ongkir", "biaya_pengiriman", "shipping", "shipping_fee"]);
  const discount = pickNumber(merged, paymentSource, ["discount", "discount_amount", "diskon"]);
  const total =
    pickNumber(merged, paymentSource, ["total", "total_amount", "grand_total", "grandTotal", "total_price", "amount"]) ||
    subtotal + shipping - discount;
  const customer = normalizeOrderCustomer(merged);

  return {
    ...normalized,
    items,
    customer,
    payment: {
      subtotal: subtotal || items.reduce((sum, item) => sum + item.subtotal, 0),
      shipping,
      discount,
      total,
    },
    timeline: normalizeOrderTimeline(merged, normalized),
  };
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const product = item.product || item.product_detail || {};
    const price = item.price ?? item.unit_price ?? item.product_price ?? product.price ?? 0;
    const quantity = item.quantity ?? item.qty ?? item.jumlah ?? 1;
    const subtotal = item.subtotal ?? item.total ?? item.line_total ?? toNumber(price) * toNumber(quantity);
    const image =
      resolveApiUrl(item.image) ||
      resolveApiUrl(product.image) ||
      resolveApiUrl(product.image_url) ||
      resolveApiUrl(product.thumbnail);

    return {
      id: item.id || item.uuid || item.order_item_id || product.id || `${index}`,
      name: item.name || item.product_name || item.title || product.name || product.title || "Produk",
      sku: item.sku || product.sku || product.code || "",
      price: toNumber(price),
      quantity: toNumber(quantity) || 1,
      subtotal: toNumber(subtotal),
      image,
    };
  });
}

function normalizeOrderCustomer(order) {
  const customer = order.customer || order.user || order.buyer || {};
  const shipping = order.shipping_address || order.shippingAddress || order.address || order.delivery_address || {};
  const name = getCustomerName(order);
  const addressText =
    typeof shipping === "string"
      ? shipping
      : [
          shipping.address,
          shipping.street,
          shipping.city,
          shipping.province || shipping.state,
          shipping.postal_code || shipping.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

  return {
    name,
    type: customer.type || customer.customer_type || "Pelanggan Baru",
    email: customer.email || order.customer_email || order.email || "",
    phone: customer.phone || customer.phone_number || order.customer_phone || order.phone || shipping.phone || "",
    address: addressText || order.shipping_address_text || order.address_text || "",
  };
}

function normalizeOrderTimeline(order, normalized) {
  const source = order.timeline || order.status_history || order.statusHistory || order.history || [];
  if (Array.isArray(source) && source.length) {
    return source.map((item) => ({
      label: item.label || item.title || getOrderStatusLabel(normalizeStatus(item.status || item.state || item.name)),
      time: formatOrderTime(item.created_at || item.createdAt || item.date || item.time, item.displayTime),
    }));
  }

  return [
    { label: statusToSentence(normalized.status), time: normalized.displayDate },
    { label: "Pembayaran Diterima", time: formatOrderTime(order.paid_at || order.paidAt || order.payment_date) },
    { label: "Pesanan Dibuat", time: formatOrderTime(order.created_at || order.createdAt || normalized.createdAt) },
  ].filter((item) => item.time && item.time !== "-");
}

function filterOrders(orders, query, status) {
  const needle = query.trim().toLowerCase();
  const statusNeedle = status === "Semua Status" ? "" : status.toLowerCase();

  return orders.filter((order) => {
    const matchesQuery = !needle || [order.code, order.customer, order.id].join(" ").toLowerCase().includes(needle);
    const matchesStatus = !statusNeedle || order.statusLabel.toLowerCase() === statusNeedle;
    return matchesQuery && matchesStatus;
  });
}

function getOrderId(order) {
  return order?.id || order?.uuid || order?.order_id || order?.orderId || order?._id;
}

function getCustomerName(order) {
  return (
    order.customer?.name ||
    order.user?.name ||
    order.buyer?.name ||
    order.customer_name ||
    order.customerName ||
    order.user_name ||
    order.userName ||
    order.buyer_name ||
    order.buyerName ||
    order.receiver_name ||
    order.receiverName ||
    order.recipient_name ||
    order.recipientName ||
    order.name ||
    extractRecipientFromShippingAddress(order) ||
    "Pelanggan"
  );
}

function extractRecipientFromShippingAddress(order) {
  const shipping = order.shipping_address || order.shippingAddress || order.address || order.destination_address;

  if (shipping && typeof shipping === "object") {
    return (
      shipping.recipient_name ||
      shipping.recipientName ||
      shipping.receiver_name ||
      shipping.receiverName ||
      shipping.buyer_name ||
      shipping.buyerName ||
      shipping.name ||
      ""
    );
  }

  if (typeof shipping === "string" && shipping.trim()) {
    const firstLine = shipping.split("\n")[0].trim();
    if (firstLine && firstLine.includes(" - ")) {
      const name = firstLine.split(" - ")[0].trim();
      if (name) return name;
    }
  }

  return "";
}

function buildCustomerNameMap(customers) {
  const map = new Map();
  for (const customer of customers) {
    const customerId = getCustomerId(customer);
    const name =
      customer.name ||
      customer.full_name ||
      customer.fullName ||
      customer.customer_name ||
      customer.customerName ||
      customer.profile?.name ||
      customer.user?.name ||
      customer.account?.name ||
      "";
    if (customerId && name) {
      map.set(String(customerId).trim().toLowerCase(), String(name));
    }
  }
  return map;
}

function attachOrderCustomerNames(orders, customerNameMap) {
  return orders.map((order) => {
    const userId =
      order.user_id ||
      order.userId ||
      order.customer_id ||
      order.customerId ||
      getCustomerId(order.customer || order.user || {});
    const matchedName = userId ? customerNameMap.get(String(userId).trim().toLowerCase()) : "";
    if (matchedName) {
      return { ...order, customer_name: matchedName };
    }

    const existingName = getCustomerName(order);
    if (existingName && existingName !== "Pelanggan") return order;

    return order;
  });
}

function getInitial(name) {
  return String(name || "P").trim().charAt(0).toUpperCase() || "P";
}

function formatOrderCode(value) {
  const text = String(value || "").trim();
  if (!text) return "#ORD-000";
  return text.startsWith("#") ? text : `#${text}`;
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase().replace(/\s+/g, "_");
  if (["sent", "shipped", "shipping", "delivered", "dikirim", "pengiriman"].includes(value)) return "dikirim";
  if (["done", "completed", "complete", "selesai", "success", "berhasil"].includes(value)) return "selesai";
  if (["cancelled", "canceled", "dibatalkan", "batal", "failed"].includes(value)) return "dibatalkan";
  return "diproses";
}

function getOrderStatusLabel(status) {
  if (status === "dikirim") return "Dikirim";
  if (status === "selesai") return "Selesai";
  if (status === "dibatalkan") return "Dibatalkan";
  return "Diproses";
}

function toBackendOrderStatus(status) {
  const value = normalizeStatus(status);
  if (value === "dikirim") return "DIKIRIM";
  if (value === "selesai") return "SELESAI";
  if (value === "dibatalkan") return "DIBATALKAN";
  return "DIPROSES";
}

function statusToSentence(status) {
  if (status === "dikirim") return "Sedang Dikirim";
  if (status === "selesai") return "Pesanan Selesai";
  if (status === "dibatalkan") return "Pesanan Dibatalkan";
  return "Sedang Diproses";
}

export {
  extractOrders,
  normalizeOrderRecords,
  normalizeOrderRecord,
  normalizeOrderDetail,
  normalizeOrderItems,
  normalizeOrderCustomer,
  normalizeOrderTimeline,
  filterOrders,
  getOrderId,
  getCustomerName,
  extractRecipientFromShippingAddress,
  buildCustomerNameMap,
  attachOrderCustomerNames,
  getInitial,
  formatOrderCode,
  normalizeStatus,
  getOrderStatusLabel,
  toBackendOrderStatus,
  statusToSentence
};
