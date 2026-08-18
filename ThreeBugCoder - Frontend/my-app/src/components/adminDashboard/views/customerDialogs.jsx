/* eslint-disable no-unused-vars */

import React, { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Camera,
  ChevronDown,
  ChevronRight,
  CircleX,
  ClipboardList,
  Eye,
  ImagePlus,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  Mail,
  MoreVertical,
  PackageCheck,
  PenLine,
  Pencil,
  Phone,
  Plus,
  Printer,
  RefreshCcw,
  Search,
  Settings,
  Shapes,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  TrendingUp,
  TicketPercent,
  UserCog,
  UsersRound,
  X,
  MapPin,
} from "lucide-react";

import {
  metricCards,
  ORDER_STATUS_OPTIONS,
  CUSTOMER_MEMBER_OPTIONS,
  ACCOUNT_ROLE_FILTER_OPTIONS,
  ACCOUNT_STATUS_FILTER_OPTIONS,
  CUSTOMER_MEMBER_FILTER_OPTIONS,
  CATEGORY_CARD_ICONS,
  navItems
} from "../constants.jsx";

import {
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
  formatShortRupiah,
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
  statusToSentence,
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
  getStatusClass,
  extractCategories,
  CATEGORY_PRODUCT_COUNT_KEYS,
  extractProducts,
  pickCategoryFields,
  countProductsByCategory,
  normalizeCategories,
  filterCategories,
  getCategoryId,
  getCategoryApiId,
  formatCategoryDeleteError,
  buildCategoryPayload,
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
} from "../helpers.jsx";

import {
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
} from "../notifications.js";

import { AccountAvatar, CustomerAvatar } from "./accountViews.jsx";
import { DialogHeader, ChevronLeftIcon } from "./commonDialogViews.jsx";
import { InfoLine } from "./orderViews.jsx";

function CustomerProfileDialog({ customer, error, isLoading, orders, onClose, onEdit }) {
  const recentOrders = orders.slice(0, 2);
  const memberTypeLabel = String(customer?.memberType || "Bronze Member").toUpperCase();

  return (
    <div className="admin-modal-scrim" role="presentation">
      <section className="admin-customer-dialog admin-customer-dialog--profile" role="dialog" aria-modal="true" aria-labelledby="admin-customer-profile-title">
        <DialogHeader id="admin-customer-profile-title" title="Detail Profil" onClose={onClose} />

        {error && (
          <div className="admin-category-modal__error" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="admin-customer-dialog__loading" aria-label="Memuat detail pelanggan" />
        ) : (
          <>
            <div className="admin-customer-profile-hero">
              <CustomerAvatar customer={customer} />
              <div>
                <h3>{customer.name}</h3>
                <div>
                  <span>{memberTypeLabel}</span>
                  <small>Member Sejak: {customer.displayJoinedAt}</small>
                </div>
              </div>
            </div>

            <div className="admin-customer-profile-grid">
              <section className="admin-customer-profile-card">
                <h4>INFORMASI KONTAK</h4>
                <InfoLine icon={Mail} label="Email" value={customer.email || "-"} />
                <InfoLine icon={Phone} label="Telepon" value={customer.phone || "-"} />
                <InfoLine icon={MapPin} label="Alamat" value={customer.address || "-"} />
              </section>

              <section className="admin-customer-summary-card">
                <h4>RINGKASAN BELANJA</h4>
                <span>Total Belanja</span>
                <strong>{formatRupiah(customer.totalSpent)}</strong>
                <div>
                  <p>
                    <span>Total Pesanan</span>
                    <strong>{customer.totalOrders} Pesanan</strong>
                  </p>
                  <p>
                    <span>Rata-rata Nilai</span>
                    <strong>{formatRupiah(customer.averageOrderValue)}</strong>
                  </p>
                </div>
              </section>
            </div>

            <section className="admin-customer-recent">
              <h4>PESANAN TERAKHIR</h4>
              <div>
                {recentOrders.length ? (
                  recentOrders.map((order) => (
                    <article key={order.id}>
                      <div>
                        <strong>{order.code}</strong>
                        <time>{order.displayDateOnly}</time>
                      </div>
                      <span className={`admin-order-chip ${getStatusClass(order.status)}`}>{order.statusLabel}</span>
                    </article>
                  ))
                ) : (
                  <p>Belum ada riwayat pesanan.</p>
                )}
              </div>
            </section>
          </>
        )}

        <div className="admin-customer-dialog__actions">
          <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onEdit} disabled={isLoading}>
            Edit Profil
          </button>
          <button type="button" className="admin-form-button admin-form-button--primary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </section>
    </div>
  );
}

function CustomerEditDialog({ customer, error, isLoading, isSaving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => getCustomerFormState(customer));

  useEffect(() => {
    setForm(getCustomerFormState(customer));
  }, [customer]);

  useEffect(() => {
    return () => {
      if (form.avatarPreview) URL.revokeObjectURL(form.avatarPreview);
    };
  }, [form.avatarPreview]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updatePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setForm((current) => {
      if (current.avatarPreview) URL.revokeObjectURL(current.avatarPreview);

      return {
        ...current,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file),
      };
    });
  };

  const photoSrc = form.avatarPreview || form.avatar;
  const photoAlt = form.name || customer?.name || "Pelanggan";

  return (
    <div className="admin-modal-scrim" role="presentation">
      <section className="admin-customer-dialog admin-customer-dialog--edit" role="dialog" aria-modal="true" aria-labelledby="admin-customer-edit-title">
        <DialogHeader id="admin-customer-edit-title" title="Edit Data Pelanggan" onClose={onClose} />

        {error && (
          <div className="admin-category-modal__error" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="admin-customer-dialog__loading" aria-label="Memuat data pelanggan" />
        ) : (
          <form
            className="admin-customer-edit-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(form);
            }}
          >
            <div className="admin-customer-photo-field">
              <div className="admin-customer-photo-field__preview-container">
                <span className="admin-customer-photo-field__preview">
                  {photoSrc ? <img src={photoSrc} alt={photoAlt} /> : getInitials(photoAlt)}
                </span>
                <label className="admin-customer-photo-field__overlay" title="Ubah Foto Profil">
                  <Camera size={18} />
                  <input type="file" accept="image/*" onChange={updatePhoto} />
                </label>
              </div>
              <div className="admin-customer-photo-field__info">
                <div className="admin-customer-photo-field__actions-row">
                  <label className="admin-customer-photo-field__upload-btn">
                    <ImagePlus size={15} strokeWidth={2.3} />
                    <span>Upload Foto Baru</span>
                    <input type="file" accept="image/*" onChange={updatePhoto} />
                  </label>
                  {photoSrc && (
                    <button
                      type="button"
                      className="admin-customer-photo-field__remove-btn"
                      onClick={() => {
                        setForm((current) => {
                          if (current.avatarPreview) URL.revokeObjectURL(current.avatarPreview);
                          return {
                            ...current,
                            avatar: "",
                            avatarFile: null,
                            avatarPreview: "",
                          };
                        });
                      }}
                    >
                      <Trash2 size={15} strokeWidth={2.3} />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
                <small className="admin-customer-photo-field__help">
                  {form.avatarFile?.name || "JPG, PNG, atau WebP untuk foto profil pelanggan."}
                </small>
              </div>
            </div>

            <div className="admin-form-row">
              <label className="admin-field">
                <span>Nama Lengkap</span>
                <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
              </label>
              <label className="admin-field">
                <span>Tipe Member</span>
                <div className="admin-select-wrap">
                  <select value={form.memberType} onChange={(event) => updateField("memberType", event.target.value)}>
                    {CUSTOMER_MEMBER_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} />
                </div>
              </label>
            </div>

            <div className="admin-form-row">
              <label className="admin-field">
                <span>Alamat Email</span>
                <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Nomor Telepon</span>
                <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
              </label>
            </div>

            <label className="admin-field admin-field--full">
              <span>Alamat Pengiriman</span>
              <textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </label>

            <div className="admin-customer-dialog__actions">
              <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onClose} disabled={isSaving}>
                Batal
              </button>
              <button type="submit" className="admin-form-button admin-form-button--primary" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function CustomerOrdersDialog({ customer, error, isLoading, orders, onClose }) {
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const [page, setPage] = useState(1);
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleOrders = orders.slice(pageStart, pageStart + pageSize);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const displayName = customer?.name || "Pelanggan";

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="admin-modal-scrim" role="presentation">
      <section className="admin-customer-dialog admin-customer-dialog--orders" role="dialog" aria-modal="true" aria-labelledby="admin-customer-orders-title">
        <DialogHeader id="admin-customer-orders-title" title={`Riwayat Pesanan: ${displayName}`} onClose={onClose} />

        {error && (
          <div className="admin-category-modal__error" role="alert">
            {error}
          </div>
        )}

        <div className="admin-customer-order-stats">
          <div>
            <span>Total Pesanan</span>
            <strong>{orders.length}</strong>
          </div>
          <div>
            <span>Total Belanja</span>
            <strong>{formatRupiah(totalSpent)}</strong>
          </div>
        </div>

        <div className="admin-customer-order-table" role="table" aria-label={`Riwayat pesanan ${displayName}`}>
          <div className="admin-customer-order-table__head" role="row">
            <span role="columnheader">Order ID</span>
            <span role="columnheader">Tanggal</span>
            <span role="columnheader">Total</span>
            <span role="columnheader">Status</span>
          </div>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div className="admin-customer-order-row admin-customer-order-row--loading" role="row" key={index}>
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
              </div>
            ))
          ) : orders.length ? (
            visibleOrders.map((order) => (
              <div className="admin-customer-order-row" role="row" key={order.id}>
                <strong role="cell">{order.code}</strong>
                <time role="cell">{order.displayDateOnly}</time>
                <span role="cell">{formatRupiah(order.total)}</span>
                <span className={`admin-order-chip ${getStatusClass(order.status)}`} role="cell">{order.statusLabel}</span>
              </div>
            ))
          ) : (
            <div className="admin-order-table__empty">
              <ClipboardList size={28} />
              <span>Belum ada riwayat pesanan.</span>
            </div>
          )}
          <div className="admin-customer-order-table__foot">
            <span>
              Menampilkan {orders.length ? `${pageStart + 1}-${pageStart + visibleOrders.length}` : "0"} dari {orders.length} pesanan
            </span>
            <div>
              <button type="button" aria-label="Halaman sebelumnya" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeftIcon />
              </button>
              <button type="button" aria-label="Halaman berikutnya" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="admin-customer-dialog__actions">
          <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
      </section>
    </div>
  );
}

export {
  CustomerProfileDialog,
  CustomerEditDialog,
  CustomerOrdersDialog
};