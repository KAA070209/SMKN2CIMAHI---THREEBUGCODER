/* eslint-disable no-unused-vars */

import React from "react";

import { fetchCustomers, resolveApiUrl } from "../../../lib/adminApi.js";

import { formatDateOnly } from "./accountCustomerHelpers.jsx";
import { pickNumber, pickDateText, toNumber, formatRupiah, formatCompactNumber } from "./dashboardHelpers.jsx";

function extractVouchers(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.vouchers)) return raw.data.vouchers;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.data?.results)) return raw.data.results;
  if (Array.isArray(raw?.vouchers)) return raw.vouchers;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

function normalizeVouchers(source) {
  return extractVouchers(source).map((voucher, index) => normalizeVoucher(voucher, index));
}

function normalizeVoucherDetail(raw, fallbackVoucher) {
  const payload = raw?.data?.voucher || raw?.data?.detail || raw?.data || raw?.voucher || raw?.detail || raw;
  const base = fallbackVoucher?.raw || fallbackVoucher || {};
  return normalizeVoucher({ ...base, ...(payload || {}) });
}

function normalizeVoucher(voucher = {}, index = 0) {
  const id = getVoucherId(voucher) || `voucher-${index}`;
  const discountType = normalizeVoucherType(
    voucher.discount_type ||
      voucher.discountType ||
      voucher.type ||
      voucher.kind ||
      voucher.rule?.type
  );
  const discountValue = pickNumber(voucher, voucher.rule || voucher.details || {}, [
    "discount_value",
    "discountValue",
    "value",
    "percent",
    "percentage",
    "discount_percent",
    "discountPercentage",
    "amount",
    "discount_amount",
    "discountAmount",
    "nominal",
  ]);
  const minPurchase = pickNumber(voucher, voucher.rule || voucher.details || {}, [
    "min_purchase",
    "minPurchase",
    "minimum_purchase",
    "minimumPurchase",
    "min_order",
    "minOrder",
    "min_order_amount",
    "minimum",
    "min_spend",
  ]);
  const maxDiscount = pickNumber(voucher, voucher.rule || voucher.details || {}, [
    "max_discount",
    "maxDiscount",
    "maximum_discount",
    "discount_limit",
    "discountLimit",
    "cap",
    "max_cap",
  ]);
  const usageLimit = pickNumber(voucher, voucher.rule || voucher.details || {}, [
    "usage_limit",
    "usageLimit",
    "usage_quota",
    "usageQuota",
    "max_uses",
    "maxUses",
    "quota",
    "total_quota",
    "max_usage",
  ]);
  const usedCount = pickNumber(voucher, voucher.stats || voucher.usage || voucher.details || {}, [
    "used_count",
    "usedCount",
    "usage_count",
    "usageCount",
    "redeem_count",
    "redeemCount",
    "uses",
    "usage",
    "used",
  ]);
  const startsAt = pickDateText(voucher, voucher.rule || voucher.details || {}, [
    "starts_at",
    "startsAt",
    "valid_from",
    "validFrom",
    "start_date",
    "startDate",
    "start",
    "active_from",
    "activeFrom",
  ]);
  const endsAt = pickDateText(voucher, voucher.rule || voucher.details || {}, [
    "ends_at",
    "endsAt",
    "valid_until",
    "validUntil",
    "valid_to",
    "validTo",
    "end_date",
    "endDate",
    "expiry",
    "expires_at",
    "expiresAt",
    "expired_at",
    "expiration_date",
    "active_to",
    "activeTo",
  ]);
  const createdAt = voucher.created_at || voucher.createdAt;
  const isExpired = isVoucherExpired(endsAt);
  const isActive = normalizeVoucherActive(voucher, isExpired);

  return {
    id,
    code: voucher.code || voucher.voucher_code || voucher.voucherCode || voucher.promo_code || `VOUCHER-${index + 1}`,
    name:
      voucher.name ||
      voucher.title ||
      voucher.label ||
      voucher.description ||
      voucher.deskripsi ||
      "",
    description: voucher.description || voucher.deskripsi || voucher.name || voucher.title || "",
    discountType,
    discountTypeLabel: discountType === "nominal" ? "Nominal" : "Persentase",
    discountValue,
    discountLabel: discountType === "nominal" ? formatRupiah(discountValue) : `${formatDiscountPercent(discountValue)}`,
    minPurchase,
    maxDiscount,
    usageLimit,
    usedCount,
    startsAt,
    endsAt,
    displayStartsAt: formatDateOnly(startsAt),
    displayEndsAt: formatDateOnly(endsAt),
    createdAt,
    isExpired,
    isActive,
    isActiveNow: isActive,
    statusLabel: isExpired ? "Kadaluarsa" : isActive ? "Aktif" : "Nonaktif",
    raw: voucher,
  };
}

function normalizeVoucherType(value) {
  const type = String(value || "").toLowerCase();
  if (
    ["nominal", "amount", "fixed", "cash", "rupiah", "idr", "rupiah_amount"].includes(type)
  ) {
    return "nominal";
  }
  return "percent";
}

function normalizeVoucherActive(voucher, isExpired) {
  if (isExpired) return false;
  if (voucher.is_active !== undefined && voucher.is_active !== null) return Boolean(voucher.is_active);
  if (voucher.isActive !== undefined && voucher.isActive !== null) return Boolean(voucher.isActive);
  if (voucher.status !== undefined && voucher.status !== null) {
    const status = String(voucher.status).toLowerCase();
    if (["inactive", "nonaktif", "disabled", "expired", "non-active"].includes(status)) return false;
    return true;
  }
  if (voucher.active !== undefined && voucher.active !== null) return Boolean(voucher.active);
  return true;
}

function isVoucherExpired(endsAt) {
  if (!endsAt) return false;
  const date = new Date(endsAt);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

function filterVouchers(vouchers, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return vouchers;

  return vouchers.filter((voucher) =>
    [voucher.code, voucher.name, voucher.description, voucher.discountTypeLabel, voucher.statusLabel, voucher.id]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
}

function summarizeVouchers(vouchers) {
  const active = vouchers.filter((voucher) => voucher.isActiveNow && !voucher.isExpired).length;
  const expired = vouchers.filter((voucher) => voucher.isExpired).length;
  const usedCount = vouchers.reduce((sum, voucher) => sum + (voucher.usedCount || 0), 0);

  return {
    total: vouchers.length,
    active,
    expired,
    usedCount,
    activeText: active === vouchers.length && vouchers.length > 0 ? "Semua aktif" : `${formatCompactNumber(active)} voucher aktif`,
  };
}

function getVoucherId(voucher) {
  return voucher?.id || voucher?.uuid || voucher?.voucher_id || voucher?.voucherId || voucher?._id;
}

function getVoucherApiId(voucher) {
  const rawId = getVoucherId(voucher?.raw);
  if (rawId) return rawId;
  if (voucher?.apiId) return voucher.apiId;
  if (voucher?.id && !/^voucher-\d+$/i.test(String(voucher.id))) return voucher.id;
  return "";
}

function getVoucherFormState(voucher, isCreate) {
  const source = isCreate ? {} : (voucher || {});
  return {
    code: source.code || "",
    name: source.name || "",
    discountType: source.discountTypeLabel === "Nominal" ? "Nominal" : "Persentase",
    discountValue: source.discountValue ?? "",
    minPurchase: source.minPurchase ?? "",
    maxDiscount: source.maxDiscount ?? "",
    startsAt: toDateInputValue(source.startsAt),
    endsAt: toDateInputValue(source.endsAt),
    usageLimit: source.usageLimit ?? "",
    isActive: isCreate ? true : (source.isActive ?? true),
  };
}

function toDateInputValue(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function buildVoucherPayload(form, { isCreate: _isCreate = false } = {}) {
  const payload = {
    code: String(form.code || "").trim().toUpperCase(),
    name: String(form.name || "").trim(),
    description: String(form.name || "").trim(),
    discount_percent: toNumber(form.discountValue),
  };

  if (form.minPurchase !== "" && form.minPurchase !== null && form.minPurchase !== undefined) {
    payload.min_purchase = toNumber(form.minPurchase);
  }
  if (form.maxDiscount !== "" && form.maxDiscount !== null && form.maxDiscount !== undefined) {
    payload.max_discount = toNumber(form.maxDiscount);
  }
  if (form.startsAt) payload.valid_from = toDateTimeValue(form.startsAt);
  if (form.endsAt) payload.valid_until = toDateTimeValue(form.endsAt);
  if (form.usageLimit !== "" && form.usageLimit !== null && form.usageLimit !== undefined) {
    payload.quota = Math.trunc(toNumber(form.usageLimit));
  }
  payload.is_active = Boolean(form.isActive);

  return payload;
}

function toDateTimeValue(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toISOString();
}

function formatDiscountPercent(value) {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: value % 1 ? 1 : 0 }).format(value || 0)}%`;
}

export {
  extractVouchers,
  normalizeVouchers,
  normalizeVoucherDetail,
  normalizeVoucher,
  normalizeVoucherType,
  normalizeVoucherActive,
  isVoucherExpired,
  filterVouchers,
  summarizeVouchers,
  getVoucherId,
  getVoucherApiId,
  getVoucherFormState,
  toDateInputValue,
  buildVoucherPayload,
  toDateTimeValue,
  formatDiscountPercent
};
