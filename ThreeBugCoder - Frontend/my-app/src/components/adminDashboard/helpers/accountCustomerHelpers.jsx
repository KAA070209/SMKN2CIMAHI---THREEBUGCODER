/* eslint-disable no-unused-vars */

import React from "react";

import { fetchCustomers, resolveApiUrl } from "../../../lib/adminApi.js";
import { pickNumber, toNumber, formatRupiah, formatCompactNumber } from "./dashboardHelpers.jsx";

import { extractOrders, normalizeOrderRecord } from "./orderHelpers.jsx";

function extractCustomers(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.customers)) return raw.data.customers;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.customers)) return raw.customers;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

async function fetchAllCustomers({ signal } = {}) {
  const pageSize = 100;
  const rows = [];

  const first = await fetchCustomers({ page: 1, limit: pageSize, signal });
  rows.push(...extractCustomers(first));

  const rawPagination = first?.data?.pagination || first?.pagination || {};
  const totalPages = Number(rawPagination.total_pages) || 1;

  for (let page = 2; page <= totalPages; page += 1) {
    try {
      const next = await fetchCustomers({ page, limit: pageSize, signal });
      rows.push(...extractCustomers(next));
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      break;
    }
  }

  return rows;
}

function extractAccountsSummary(raw) {
  if (!raw) return null;
  const payload = raw?.data?.summary || raw?.data || raw?.summary || raw;
  return payload;
}

function renderRoleCounts(summary) {
  if (!summary) return null;
  const roles =
    summary.roles ||
    summary.distribution ||
    summary.role_distribution ||
    summary.roleDistribution ||
    summary.role_counts ||
    summary.roles_count ||
    summary.roleCounts;
  if (roles && typeof roles === "object") {
    return Object.entries(roles).map(([role, count]) => (
      <span key={role} className="admin-accounts-role"><strong>{role}</strong>: {String(count)}</span>
    ));
  }

  // Try common fields
  const adminCount = pickNumber(summary, null, ["admin", "admins", "total_admins"]);
  const sellerCount = pickNumber(summary, null, ["seller", "sellers"]);
  const userCount = pickNumber(summary, null, ["user", "users"]);
  if (adminCount || sellerCount || userCount) {
    return (
      <>
        <span className="admin-accounts-role"><strong>Admin</strong>: {adminCount || 0}</span>
        <span className="admin-accounts-role"><strong>Seller</strong>: {sellerCount || 0}</span>
        <span className="admin-accounts-role"><strong>User</strong>: {userCount || 0}</span>
      </>
    );
  }

  return <span>Tidak ada data distribusi peran</span>;
}

function extractAccounts(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.accounts)) return raw.data.accounts;
  if (Array.isArray(raw?.data?.users)) return raw.data.users;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.accounts)) return raw.accounts;
  if (Array.isArray(raw?.users)) return raw.users;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

function mergeAccountUsers(accountRecords, customerRecords) {
  const accounts = extractAccounts(accountRecords);
  const customers = extractCustomers(customerRecords);

  const seenEmails = new Set();
  const seenIds = new Set();

  accounts.forEach((account) => {
    const email = String(account.email || account.mail || "").trim().toLowerCase();
    const id = String(getAccountId(account) ?? "").trim().toLowerCase();
    if (email) seenEmails.add(email);
    if (id) seenIds.add(id);
  });

  customers.forEach((customer) => {
    const email = String(customer.email || customer.mail || customer.customer_email || "").trim().toLowerCase();
    const id = String(getAccountId(customer) ?? "").trim().toLowerCase();

    if ((email && seenEmails.has(email)) || (id && seenIds.has(id))) return;

    if (email) seenEmails.add(email);
    if (id) seenIds.add(id);

    accounts.push({
      ...customer,
      role: customer.role || customer.user_role || customer.account_role || customer.type || "user",
      status: customer.status || customer.account_status || customer.state || "active",
    });
  });

  return accounts;
}

function normalizeAccounts(source) {
  return extractAccounts(source).map((account, index) => normalizeAccount(account, index));
}

function normalizeAccountDetail(raw, fallbackAccount) {
  const payload = raw?.data?.account || raw?.data?.user || raw?.data?.detail || raw?.data || raw?.account || raw?.user || raw?.detail || raw;
  const base = fallbackAccount?.raw || fallbackAccount || {};
  return normalizeAccount({ ...base, ...(payload || {}) });
}

function normalizeAccount(account = {}, index = 0) {
  const profile = account.profile || account.user || account.account || {};
  const name =
    account.name ||
    account.full_name ||
    account.fullName ||
    account.username ||
    profile.name ||
    profile.full_name ||
    profile.username ||
    "Admin";
  const role = normalizeAccountRole(account.role || account.user_role || account.account_role || account.type || profile.role || profile.type);
  const status = normalizeAccountStatus(
    account.status ||
      account.account_status ||
      account.state ||
      profile.status ||
      (account.is_active ?? account.isActive ?? account.active ?? profile.is_active ?? profile.isActive)
  );
  const createdAt =
    account.created_at ||
    account.createdAt ||
    account.joined_at ||
    account.joinedAt ||
    profile.created_at ||
    profile.createdAt;

  return {
    id: getAccountId(account) || getAccountId(profile) || `account-${index}`,
    name,
    initials: getInitials(name),
    email: account.email || account.mail || profile.email || profile.mail || "",
    role,
    roleLabel: getAccountRoleLabel(role),
    status,
    statusLabel: getAccountStatusLabel(status),
    isActive: status === "active",
    createdAt,
    displayCreatedAt: formatDateOnly(createdAt),
    avatar: resolveApiUrl(
      account.photoprofil ||
        account.photo_profil ||
        account.photoProfil ||
        account.avatar ||
        account.avatar_url ||
        account.photo ||
        profile.photoprofil ||
        profile.photo_profil ||
        profile.photoProfil ||
        profile.avatar ||
        profile.avatar_url ||
        profile.photo
    ),
    raw: account,
  };
}

function filterAccounts(accounts, query, roleFilter = "Semua Peran", statusFilter = "Semua Status") {
  let result = accounts;

  if (roleFilter && roleFilter !== "Semua Peran") {
    result = result.filter((account) => account.roleLabel === roleFilter);
  }

  if (statusFilter && statusFilter !== "Semua Status") {
    result = result.filter((account) => account.statusLabel === statusFilter);
  }

  const needle = query.trim().toLowerCase();
  if (!needle) return result;

  return result.filter((account) =>
    [account.name, account.email, account.roleLabel, account.statusLabel, account.id]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
}

function summarizeAccounts(accounts, summary) {
  const roleCounts = getSummaryRoleCounts(summary);
  const total = pickNumber(summary, null, ["total", "count", "total_accounts", "total_admins", "accounts_count"]) || accounts.length;
  const statusDistribution =
    summary?.status_distribution ||
    summary?.statusDistribution ||
    summary?.status_counts ||
    summary?.statusCounts || {};
  const activeTotal =
    pickNumber(summary, statusDistribution, ["active", "active_accounts", "activeAdmins", "active_admins", "aktif"]) ||
    accounts.filter((account) => account.isActive).length;

  return {
    total,
    activeTotal,
    admin: roleCounts.admin ?? accounts.filter((account) => account.role === "admin").length,
    seller: roleCounts.seller ?? accounts.filter((account) => account.role === "seller").length,
    user: roleCounts.user ?? accounts.filter((account) => account.role === "user").length,
    verifiedText: activeTotal === total && total > 0 ? "Semua terverifikasi" : `${formatCompactNumber(activeTotal)} akun aktif`,
  };
}

function getSummaryRoleCounts(summary) {
  const roles =
    summary?.roles ||
    summary?.distribution ||
    summary?.role_distribution ||
    summary?.roleDistribution ||
    summary?.role_counts ||
    summary?.roles_count ||
    summary?.roles_counts ||
    summary?.roleCounts ||
    {};
  const counts = {};

  if (roles && typeof roles === "object") {
    Object.entries(roles).forEach(([role, count]) => {
      counts[normalizeAccountRole(role)] = toNumber(count);
    });
  }

  counts.admin ??= pickNumber(summary, null, ["admin", "admins", "total_admins"]);
  counts.seller ??= pickNumber(summary, null, ["seller", "sellers", "total_sellers"]);
  counts.user ??= pickNumber(summary, null, ["user", "users", "customer", "customers", "total_users", "total_customers"]);

  return counts;
}

function getAccountId(account) {
  return account?.id || account?.uuid || account?.account_id || account?.accountId || account?.user_id || account?.userId || account?._id;
}

function normalizeAccountRole(value) {
  const role = String(value || "user").trim().toLowerCase();
  if (["administrator", "super_admin", "superadmin", "owner"].includes(role)) return "admin";
  if (["merchant", "vendor", "penjual"].includes(role)) return "seller";
  if (["customer", "pelanggan", "member"].includes(role)) return "user";
  if (["admin", "seller", "user"].includes(role)) return role;
  return "user";
}

function getAccountRoleLabel(role) {
  if (role === "admin") return "Admin";
  if (role === "seller") return "Seller";
  return "User";
}

function normalizeAccountStatus(value) {
  if (typeof value === "boolean") return value ? "active" : "inactive";
  const status = String(value ?? "active").trim().toLowerCase().replace(/\s+/g, "_");
  if (["inactive", "nonaktif", "non_aktif", "disabled", "blocked", "suspended", "false", "0"].includes(status)) return "inactive";
  return "active";
}

function getAccountStatusLabel(status) {
  return status === "inactive" ? "Non-aktif" : "Aktif";
}

function normalizeCustomers(source) {
  return extractCustomers(source).map((customer, index) => normalizeCustomer(customer, index));
}

function normalizeCustomerDetail(raw, fallbackCustomer) {
  const payload = raw?.data?.customer || raw?.data?.detail || raw?.data || raw?.customer || raw?.detail || raw;
  const base = fallbackCustomer?.raw || fallbackCustomer || {};
  return normalizeCustomer({ ...base, ...(payload || {}) });
}

function normalizeCustomer(customer = {}, index = 0) {
  const profile = customer.profile || customer.user || customer.account || {};
  const stats = customer.stats || customer.summary || customer.customer_stats || {};
  const address = customer.address || customer.shipping_address || customer.shippingAddress || profile.address || {};
  const name =
    customer.name ||
    customer.full_name ||
    customer.fullName ||
    customer.customer_name ||
    profile.name ||
    profile.full_name ||
    "Pelanggan";
  const totalOrders = pickNumber(customer, stats, [
    "totalOrders",
    "total_orders",
    "ordersCount",
    "orders_count",
    "order_count",
    "jumlah_pesanan",
  ]);
  const totalSpent = pickNumber(customer, stats, [
    "totalSpent",
    "total_spent",
    "totalShopping",
    "total_shopping",
    "totalBelanja",
    "total_belanja",
    "lifetime_value",
    "revenue",
  ]);
  const joinedAt =
    customer.joined_at ||
    customer.joinedAt ||
    customer.created_at ||
    customer.createdAt ||
    profile.created_at ||
    profile.createdAt;

  return {
    id: getCustomerId(customer) || getCustomerId(profile) || `customer-${index}`,
    name,
    initials: getInitials(name),
    email: customer.email || customer.mail || customer.customer_email || profile.email || "",
    phone: customer.phone || customer.phone_number || customer.customer_phone || profile.phone || profile.phone_number || "",
    address: formatAddress(address) || customer.address_text || customer.shipping_address_text || profile.address_text || "",
    memberType: normalizeCustomerMemberType(
      customer.member_type ||
        customer.memberType ||
        customer.type ||
        customer.tier ||
        customer.membership ||
        profile.member_type ||
        profile.memberType
    ),
    joinedAt,
    displayJoinedAt: formatDateOnly(joinedAt),
    totalOrders,
    totalSpent,
    averageOrderValue:
      pickNumber(customer, stats, ["averageOrderValue", "average_order_value", "avg_order_value"]) ||
      (totalOrders ? Math.round(totalSpent / totalOrders) : 0),
    avatar: resolveApiUrl(customer.photoprofil || customer.photo_profil || customer.photoProfil || customer.avatar || customer.avatar_url || customer.photo || profile.photoprofil || profile.photo_profil || profile.photoProfil || profile.avatar || profile.avatar_url || profile.photo),
    raw: customer,
  };
}

function normalizeCustomerMemberType(value) {
  if (value === undefined || value === null || value === "") return "Bronze Member";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "Bronze Member";
    const key = trimmed.toLowerCase().replace(/[^a-z]/g, "");
    const legacyMap = {
      regular: "Bronze Member",
      regularmember: "Bronze Member",
      basic: "Bronze Member",
      basicmember: "Bronze Member",
      bronze: "Bronze Member",
      bronzemember: "Bronze Member",
      silver: "Silver Member",
      silvermember: "Silver Member",
      gold: "Gold Member",
      goldmember: "Gold Member",
      platinum: "Platinum Member",
      platinummember: "Platinum Member",
    };
    return legacyMap[key] || trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (typeof value === "object") {
    const nested =
      value.name ||
      value.label ||
      value.title ||
      value.type ||
      value.tier ||
      value.membership ||
      value.member_type ||
      value.memberType ||
      value.level ||
      value.code;

    if (nested && nested !== value) {
      return normalizeCustomerMemberType(nested);
    }
  }

  return "Bronze Member";
}

function normalizeCustomerOrders(source) {
  return extractOrders(source).map((order, index) => {
    const createdAt = order.created_at || order.createdAt || order.order_date || order.orderDate || order.date || order.updated_at;
    return {
      ...normalizeOrderRecord(order, index),
      displayDateOnly: formatDateOnly(createdAt),
    };
  });
}

function filterCustomers(customers, query, memberFilter = "Semua Member") {
  let result = customers;

  if (memberFilter && memberFilter !== "Semua Member") {
    result = result.filter((customer) => customer.memberType === memberFilter);
  }

  const needle = query.trim().toLowerCase();
  if (!needle) return result;

  return result.filter((customer) =>
    [customer.name, customer.email, customer.phone, customer.memberType, customer.id]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
}

function summarizeCustomers(customers) {
  const topCustomer = [...customers].sort((a, b) => (b.totalSpent || b.totalOrders) - (a.totalSpent || a.totalOrders))[0] || null;

  return {
    activeCustomers: customers.length,
    monthlyChange: "+12% bulan ini",
    topCustomer,
  };
}

function getCustomerId(customer) {
  return customer?.id || customer?.uuid || customer?.customer_id || customer?.customerId || customer?.user_id || customer?.userId || customer?._id;
}

function getCustomerFormState(customer) {
  return {
    name: customer?.name || "",
    memberType: customer?.memberType || "Bronze Member",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    avatar: customer?.avatar || "",
    avatarFile: null,
    avatarPreview: "",
  };
}

function buildCustomerPayload(form) {
  if (form.avatarFile) {
    const payload = new FormData();
    const fields = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      member_type: form.memberType,
      address: form.address.trim(),
    };

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== "") payload.append(key, value);
    });

    payload.append("avatar", form.avatarFile);
    payload.append("photoprofil", form.avatarFile);
    payload.append("photo", form.avatarFile);
    return payload;
  }

  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    member_type: form.memberType,
    address: form.address.trim(),
  };

  if (form.avatar === "") {
    payload.avatar = "";
    payload.photoprofil = "";
    payload.photo = "";
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "" && !["avatar", "photoprofil", "photo"].includes(key)) {
      delete payload[key];
    }
  });

  return payload;
}

function buildAccountPayload(form, { isCreate = false, includeStatus = true } = {}) {
  const fields = {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password || undefined,
    role: form.role || undefined,
  };

  if (includeStatus) fields.status = form.status || undefined;
  if (!isCreate && !form.password) delete fields.password;

  if (form.avatarFile) {
    const payload = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== "") payload.append(key, value);
    });

    payload.append("avatar", form.avatarFile);
    payload.append("photoprofil", form.avatarFile);
    payload.append("photo", form.avatarFile);
    return payload;
  }

  const payload = { ...fields };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === "") delete payload[key];
  });

  return payload;
}

function buildAccountStatusPayload(status) {
  return { status };
}

function formatAddress(address) {
  if (!address) return "";
  if (typeof address === "string") return address;
  return [
    address.address,
    address.street,
    address.city,
    address.province || address.state,
    address.postal_code || address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function getInitials(name) {
  const words = String(name || "P")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (words[0]?.[0] || "P").toUpperCase() + (words[1]?.[0] || "").toUpperCase();
}

function formatDateOnly(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatShortRupiah(value) {
  if (!value) return formatRupiah(0);
  if (value >= 1000000) {
    const compact = value / 1000000;
    return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: compact % 1 ? 1 : 0 }).format(compact)}M`;
  }
  if (value >= 1000) {
    const compact = value / 1000;
    return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: compact % 1 ? 1 : 0 }).format(compact)}K`;
  }
  return formatRupiah(value);
}

export {
  extractCustomers,
  fetchAllCustomers,
  extractAccountsSummary,
  renderRoleCounts,
  extractAccounts,
  mergeAccountUsers,
  normalizeAccounts,
  normalizeAccountDetail,
  normalizeAccount,
  filterAccounts,
  summarizeAccounts,
  getSummaryRoleCounts,
  getAccountId,
  normalizeAccountRole,
  getAccountRoleLabel,
  normalizeAccountStatus,
  getAccountStatusLabel,
  normalizeCustomers,
  normalizeCustomerDetail,
  normalizeCustomer,
  normalizeCustomerMemberType,
  normalizeCustomerOrders,
  filterCustomers,
  summarizeCustomers,
  getCustomerId,
  getCustomerFormState,
  buildCustomerPayload,
  buildAccountPayload,
  buildAccountStatusPayload,
  formatAddress,
  getInitials,
  formatDateOnly,
  formatShortRupiah
};
