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

function AccountModal({ account, error, isLoading, isSaving, mode, onClose, onSubmit }) {
  const isCreate = mode === "create";
  const isRoleMode = mode === "role";
  const title = isCreate ? "Tambah Akun Baru" : isRoleMode ? "Ubah Peran Akun" : "Edit Data Akun";
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(() => ({
    name: account?.name || "",
    email: account?.email || "",
    password: "",
    role: account?.role || "admin",
    status: account?.status || "active",
    avatar: account?.avatar || "",
    avatarFile: null,
    avatarPreview: "",
  }));

  const setField = (field) => (event) => {
    const value = event?.target?.type === "file" ? (event.target.files[0] || null) : event.target.value;
    if (field === "avatarFile") {
      const file = value;
      const preview = file ? URL.createObjectURL(file) : "";
      setForm((current) => ({ ...current, avatarFile: file, avatarPreview: preview }));
      return;
    }
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: account?.name || "",
      email: account?.email || "",
      role: account?.role || "admin",
      status: account?.status || "active",
      avatar: account?.avatar || "",
    }));
  }, [account]);

  useEffect(() => {
    return () => {
      if (form.avatarPreview) URL.revokeObjectURL(form.avatarPreview);
    };
  }, [form.avatarPreview]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="admin-category-modal-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <form className="admin-category-modal admin-account-modal" onSubmit={handleSubmit}>
        <div className="admin-account-modal__hero" aria-hidden="true" />
        <div className="admin-account-modal__head">
          <div>
            <h2>{title}</h2>
            <p>{isCreate ? "Berikan akses ke tim BumiKriya" : "Perbarui data, peran, dan status akun."}</p>
          </div>
          <button type="button" aria-label="Tutup popup" onClick={onClose} disabled={isSaving}>
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="admin-account-avatar">
          <span className="admin-account-avatar__preview">
            {form.avatarPreview || form.avatar ? <img src={form.avatarPreview || form.avatar} alt="Preview" /> : <Camera size={36} />}
          </span>
          <label className="admin-account-upload">
            <input type="file" accept="image/*" onChange={setField("avatarFile")} />
            Unggah Foto
          </label>
          <small>JPG atau PNG, maks. 2MB</small>
        </div>

        {isLoading && (
          <div className="admin-account-modal__loading">
            <span className="admin-skeleton" />
            <span className="admin-skeleton" />
          </div>
        )}

        <label className="admin-category-field">
          <span>Nama Lengkap</span>
          <input type="text" value={form.name} onChange={setField("name")} placeholder="Masukkan nama lengkap" required />
        </label>

        <label className="admin-category-field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={setField("email")} placeholder="nama@contoh.com" required />
        </label>

        <label className="admin-category-field">
          <span>Kata Sandi</span>
          <div className="admin-account-password">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={setField("password")}
              placeholder={isCreate ? "Minimal 8 karakter" : "Kosongkan jika tidak diubah"}
              minLength={form.password || isCreate ? 8 : undefined}
              required={isCreate}
            />
            <button type="button" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setShowPassword((visible) => !visible)}>
              <Eye size={18} strokeWidth={2.3} />
            </button>
          </div>
        </label>

        <label className="admin-category-field admin-account-modal-row">
          <div>
            <span>Peran Admin</span>
            <select value={form.role} onChange={setField("role")} aria-label="Peran Admin">
              <option value="admin">Admin</option>
              <option value="seller">Seller</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <span>Status</span>
            <select value={form.status} onChange={setField("status")} aria-label="Status Akun">
              <option value="active">Aktif</option>
              <option value="inactive">Non-aktif</option>
            </select>
          </div>
        </label>

        {error && <div className="admin-category-modal__error" role="alert">{error}</div>}

        <div className="admin-category-modal__actions">
          <button type="button" className="admin-category-button admin-category-button--ghost" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button type="submit" className="admin-category-button admin-category-button--primary" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : isCreate ? "Simpan Akun" : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CategoryDeleteDialog({ category, error, isDeleting, onCancel, onConfirm }) {
  return (
    <div className="admin-category-delete-scrim" role="presentation">
      <section className="admin-category-delete" role="dialog" aria-modal="true" aria-labelledby="category-delete-title">
        <div className="admin-category-delete__head">
          <span>
            <AlertTriangle size={34} strokeWidth={2.6} />
          </span>
        </div>
        <div className="admin-category-delete__body">
          <h2 id="category-delete-title">Hapus Kategori?</h2>
          <p>Apakah Anda yakin ingin menghapus kategori '{category.name}'? Tindakan ini tidak dapat dibatalkan.</p>
          {category.productCount > 0 && (
            <p className="admin-category-delete__warning">
              Kategori ini dipakai oleh <strong>{category.productCount} Produk</strong>. Produk yang memakainya akan kehilangan kategori tersebut.
            </p>
          )}
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
  AccountModal,
  CategoryDeleteDialog
};