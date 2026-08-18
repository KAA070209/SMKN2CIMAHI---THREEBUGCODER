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

import { ChevronLeftIcon } from "./commonDialogViews.jsx";

const VOUCHER_TYPE_OPTIONS = ["Persentase"];

function VoucherManagementPage({
  vouchers,
  error,
  isLoading,
  onAdd,
  onRefresh,
  rawCount,
  stats,
  activeMenuId,
  actionMenuRef,
  onAction,
  onMenuToggle,
}) {
  return (
    <section className="admin-content admin-content--vouchers">
      <div className="admin-voucher-heading">
        <div>
          <h1>Manajemen Voucher</h1>
          <p>Buat dan kelola kode voucher diskon untuk promosi toko Anda.</p>
        </div>
        <button type="button" className="admin-voucher-add" onClick={onAdd}>
          <TicketPercent size={20} strokeWidth={2.4} />
          <span>Tambah Voucher</span>
        </button>
      </div>

      <div className="admin-voucher-overview">
        <section className="admin-voucher-total-card">
          <span className="admin-voucher-total-card__icon">
            <TicketPercent size={22} strokeWidth={2.4} />
          </span>
          <small>Total Voucher</small>
          <strong>{isLoading ? "..." : formatCompactNumber(stats.total)}</strong>
          <span className="admin-voucher-total-card__note">
            <TicketPercent size={14} strokeWidth={2.4} />
            {stats.activeText}
          </span>
        </section>

        <section className="admin-voucher-usage-card">
          <div className="admin-voucher-usage-card__title">
            <TicketPercent size={18} strokeWidth={2.4} />
            <span>Pemakaian Voucher</span>
          </div>
          <div className="admin-voucher-usage-card__counts">
            <div>
              <strong>{formatCompactNumber(stats.usedCount)}</strong>
              <span>Terpakai</span>
            </div>
            <div>
              <strong>{formatCompactNumber(stats.active)}</strong>
              <span>Aktif</span>
            </div>
            <div>
              <strong>{formatCompactNumber(stats.expired)}</strong>
              <span>Kadaluarsa</span>
            </div>
          </div>
        </section>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      <div className="admin-voucher-table-card">
        <div className="admin-voucher-table" role="table" aria-label="Daftar voucher">
          <div className="admin-voucher-table__head" role="row">
            <span role="columnheader">Kode</span>
            <span role="columnheader">Deskripsi</span>
            <span role="columnheader">Diskon</span>
            <span role="columnheader">Berlaku</span>
            <span role="columnheader">Pemakaian</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Aksi</span>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div className="admin-voucher-row admin-voucher-row--loading" key={index} role="row">
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
              </div>
            ))
          ) : vouchers.length ? (
            vouchers.map((voucher) => (
              <VoucherTableRow
                key={voucher.id}
                activeMenuId={activeMenuId}
                actionMenuRef={actionMenuRef}
                onAction={onAction}
                onMenuToggle={onMenuToggle}
                voucher={voucher}
              />
            ))
          ) : (
            <div className="admin-order-table__empty">
              <TicketPercent size={28} />
              <span>Belum ada voucher yang cocok.</span>
            </div>
          )}
        </div>

        <div className="admin-voucher-table__foot">
          <strong>Menampilkan {vouchers.length ? `1-${vouchers.length}` : "0"} dari {rawCount} voucher</strong>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled>
              <ChevronLeftIcon />
            </button>
            <button type="button" aria-label="Halaman berikutnya" disabled={vouchers.length >= rawCount}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function VoucherTableRow({ activeMenuId, actionMenuRef, onAction, onMenuToggle, voucher }) {
  const isMenuOpen = activeMenuId === voucher.id;

  return (
    <div className="admin-voucher-row" role="row">
      <strong role="cell" className="admin-voucher-row__code">{voucher.code}</strong>
      <span role="cell" className="admin-voucher-row__desc">{voucher.name || voucher.description || "-"}</span>
      <strong role="cell" className="admin-voucher-row__discount">{voucher.discountLabel}</strong>
      <span role="cell" className="admin-voucher-row__dates">
        <span>{voucher.displayStartsAt}</span>
        <span>{voucher.displayEndsAt}</span>
      </span>
      <span role="cell" className="admin-voucher-row__usage">
        <strong>{formatCompactNumber(voucher.usedCount)}</strong>
        <small>{voucher.usageLimit ? `/ ${formatCompactNumber(voucher.usageLimit)}` : " / ∞"}</small>
      </span>
      <span role="cell" className={`admin-voucher-status-pill ${voucher.isExpired ? "is-inactive" : voucher.isActive ? "" : "is-inactive"}`}>
        <span />
        {voucher.statusLabel}
      </span>
      <div className="admin-voucher-row__actions" role="cell" ref={isMenuOpen ? actionMenuRef : null}>
        <button
          type="button"
          aria-label={`Aksi voucher ${voucher.code}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => onMenuToggle(voucher.id)}
        >
          <MoreVertical size={21} strokeWidth={2.8} />
        </button>
        {isMenuOpen && <VoucherActionMenu voucher={voucher} onAction={onAction} />}
      </div>
    </div>
  );
}

function VoucherActionMenu({ voucher, onAction }) {
  return (
    <div className="admin-voucher-action-menu" role="menu">
      <button type="button" role="menuitem" onClick={() => onAction(voucher, "detail")}>
        <Eye size={15} strokeWidth={2} />
        <span>Lihat Detail</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(voucher, "edit")}>
        <Pencil size={15} strokeWidth={2} />
        <span>Edit Voucher</span>
      </button>
      <button type="button" role="menuitem" className="is-danger" onClick={() => onAction(voucher, "delete")}>
        <Trash2 size={15} strokeWidth={2} />
        <span>Hapus Voucher</span>
      </button>
    </div>
  );
}

function VoucherModal({ voucher, error, isLoading, isSaving, mode, onClose, onSubmit }) {
  const isCreate = mode === "create";
  const [form, setForm] = useState(() => getVoucherFormState(voucher, isCreate));

  useEffect(() => {
    setForm(getVoucherFormState(voucher, isCreate));
  }, [voucher, isCreate]);

  const setField = (field) => (event) => {
    const target = event.target;
    let value;
    if (target.type === "checkbox") {
      value = target.checked;
    } else if (target.type === "number") {
      if (target.value === "" && target.validity && target.validity.badInput) return;
      value = target.value;
    } else {
      value = target.value;
    }
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="admin-category-modal-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <form className="admin-category-modal admin-voucher-modal" onSubmit={handleSubmit}>
        <div className="admin-voucher-modal__head">
          <div>
            <span className="admin-voucher-modal__icon"><TicketPercent size={22} strokeWidth={2.4} /></span>
            <div>
              <h2>{isCreate ? "Tambah Voucher Baru" : "Edit Voucher"}</h2>
              <p>{isCreate ? "Buat kode promo untuk pelanggan" : "Perbarui detail voucher promo"}</p>
            </div>
          </div>
          <button type="button" aria-label="Tutup popup" onClick={onClose} disabled={isSaving}>
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        {isLoading && (
          <div className="admin-account-modal__loading">
            <span className="admin-skeleton" />
            <span className="admin-skeleton" />
          </div>
        )}

        <div className="admin-voucher-modal__grid">
          <label className="admin-category-field">
            <span>Kode Voucher</span>
            <input
              type="text"
              value={form.code}
              onChange={setField("code")}
              placeholder="Contoh: HEMAT50"
              required
            />
          </label>

          <label className="admin-category-field">
            <span>Nama / Deskripsi</span>
            <input
              type="text"
              value={form.name}
              onChange={setField("name")}
              placeholder="Contoh: Diskon Belanja Pertama"
            />
          </label>

          <label className="admin-category-field">
            <span>Tipe Diskon</span>
            <div className="admin-select-wrap">
              <select value={form.discountType} onChange={setField("discountType")} aria-label="Tipe diskon voucher">
                {VOUCHER_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={18} />
            </div>
          </label>
          <label className="admin-category-field">
            <span>{form.discountType === "Nominal" ? "Nominal (Rp)" : "Persentase (%)"}</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.discountValue}
              onChange={setField("discountValue")}
              placeholder="0"
              required
            />
          </label>

          <label className="admin-category-field">
            <span>Min. Belanja (Rp)</span>
            <input
              type="number"
              min="0"
              value={form.minPurchase}
              onChange={setField("minPurchase")}
              placeholder="0"
            />
          </label>
          <label className="admin-category-field">
            <span>Maks. Diskon (Rp)</span>
            <input
              type="number"
              min="0"
              value={form.maxDiscount}
              onChange={setField("maxDiscount")}
              placeholder="0"
            />
          </label>

          <label className="admin-category-field">
            <span>Mulai Berlaku</span>
            <input type="date" value={form.startsAt} onChange={setField("startsAt")} />
          </label>
          <label className="admin-category-field">
            <span>Berakhir</span>
            <input type="date" value={form.endsAt} onChange={setField("endsAt")} />
          </label>

          <label className="admin-category-field">
            <span>Kuota Pemakaian</span>
            <input
              type="number"
              min="0"
              value={form.usageLimit}
              onChange={setField("usageLimit")}
              placeholder="0 = tanpa batas"
            />
          </label>

          <div className="admin-category-toggle-row">
            <div>
              <strong>Status Aktif</strong>
              <span>Tampilkan voucher ini ke pelanggan</span>
            </div>
            <label className="admin-switch">
              <input type="checkbox" checked={form.isActive} onChange={setField("isActive")} />
              <span />
            </label>
          </div>
        </div>

        {error && <div className="admin-category-modal__error" role="alert">{error}</div>}

        <div className="admin-category-modal__actions">
          <button type="button" className="admin-category-button admin-category-button--ghost" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button type="submit" className="admin-category-button admin-category-button--primary" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : isCreate ? "Simpan Voucher" : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function VoucherDeleteDialog({ voucher, error, isDeleting, onCancel, onConfirm }) {
  return (
    <div className="admin-category-delete-scrim" role="presentation">
      <section className="admin-category-delete" role="dialog" aria-modal="true" aria-labelledby="voucher-delete-title">
        <div className="admin-category-delete__head">
          <span>
            <AlertTriangle size={34} strokeWidth={2.6} />
          </span>
        </div>
        <div className="admin-category-delete__body">
          <h2 id="voucher-delete-title">Hapus Voucher?</h2>
          <p>Apakah Anda yakin ingin menghapus voucher '{voucher.code}'? Tindakan ini tidak dapat dibatalkan.</p>
          {error && <div className="admin-category-modal__error" role="alert">{error}</div>}
          <div className="admin-category-delete__actions">
            <button type="button" className="admin-category-button admin-category-button--ghost" onClick={onCancel} disabled={isDeleting}>
              Batal
            </button>
            <button type="button" className="admin-category-button admin-category-button--danger" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export {
  VOUCHER_TYPE_OPTIONS,
  VoucherManagementPage,
  VoucherTableRow,
  VoucherActionMenu,
  VoucherModal,
  VoucherDeleteDialog
};