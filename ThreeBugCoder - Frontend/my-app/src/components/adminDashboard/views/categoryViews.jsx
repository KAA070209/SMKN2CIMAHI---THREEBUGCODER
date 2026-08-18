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

function CategoryManagementPage({ categories, isLoading, error, rawCount, onAdd, onDelete, onEdit, onRefresh }) {
  return (
    <section className="admin-content admin-content--categories">
      <div className="admin-category-heading">
        <div>
          <h1>Manajemen Kategori</h1>
          <p>Kelola daftar kategori produk kerajinan Anda.</p>
        </div>
        <button type="button" className="admin-category-add" onClick={onAdd}>
          <Plus size={18} strokeWidth={2.7} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      {isLoading ? (
        <div className="admin-category-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="admin-category-card admin-category-card--loading" />
          ))}
        </div>
      ) : (
        <div className="admin-category-grid">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              icon={CATEGORY_CARD_ICONS[index % CATEGORY_CARD_ICONS.length]}
              onDelete={() => onDelete(category)}
              onEdit={() => onEdit(category)}
            />
          ))}

          <button type="button" className="admin-category-new-card" onClick={onAdd}>
            <span><Plus size={28} strokeWidth={2.6} /></span>
            <strong>Kategori Baru</strong>
            <small>{rawCount ? "Tambahkan kategori untuk produk baru" : "Tambahkan kategori pertama"}</small>
          </button>
        </div>
      )}
    </section>
  );
}

function CategoryCard({ category, icon: Icon, onDelete, onEdit }) {
  return (
    <article className={`admin-category-card ${category.image ? "has-image" : ""} ${category.isActive ? "" : "is-inactive"}`}>
      {category.image ? (
        <div className="admin-category-card__media">
          <img src={category.image} alt={category.name} loading="lazy" />
          <div className="admin-category-card__tools">
            <button type="button" aria-label={`Edit ${category.name}`} onClick={onEdit}>
              <Pencil size={15} strokeWidth={2.4} />
            </button>
            <button type="button" aria-label={`Hapus ${category.name}`} onClick={onDelete}>
              <Trash2 size={15} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      ) : (
        <div className="admin-category-card__top">
          <span className="admin-category-card__icon">
            <Icon size={22} strokeWidth={2.4} />
          </span>
          <div className="admin-category-card__tools">
            <button type="button" aria-label={`Edit ${category.name}`} onClick={onEdit}>
              <Pencil size={15} strokeWidth={2.4} />
            </button>
            <button type="button" aria-label={`Hapus ${category.name}`} onClick={onDelete}>
              <Trash2 size={15} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      )}

      <h2>{category.name}</h2>
      <p>{category.description || "Belum ada deskripsi untuk kategori ini."}</p>

      <div className="admin-category-card__foot">
        <span className="admin-category-card__count">
          <BriefcaseBusiness size={14} strokeWidth={2.3} />
          {category.productCount} Produk
        </span>
        <span className={`admin-category-status ${category.isActive ? "" : "is-inactive"}`}>
          {category.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>
    </article>
  );
}

function CategoryModal({ category, error, isSaving, onClose, onSubmit }) {
  const isEditing = Boolean(category);
  const [form, setForm] = useState(() => ({
    name: category?.name || "",
    description: category?.description || "",
    isActive: category?.isActive ?? true,
    image: null,
    imagePreview: category?.image || "",
  }));

  const setField = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImage = (event) => {
    const file = event.target.files[0] || null;
    setForm((current) => {
      if (current.imagePreview && current.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(current.imagePreview);
      }
      return {
        ...current,
        image: file,
        imagePreview: file ? URL.createObjectURL(file) : (category?.image || ""),
      };
    });
  };

  const clearImage = () => {
    setForm((current) => {
      if (current.imagePreview && current.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(current.imagePreview);
      }
      return { ...current, image: null, imagePreview: category?.image || "" };
    });
  };

  useEffect(() => {
    return () => {
      if (form.imagePreview && form.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(form.imagePreview);
      }
    };
  }, [form.imagePreview]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="admin-category-modal-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <form className="admin-category-modal" onSubmit={handleSubmit}>
        <h2>{isEditing ? "Edit Kategori" : "Tambah Kategori Baru"}</h2>

        <label className="admin-category-field">
          <span>Nama Kategori</span>
          <input
            type="text"
            value={form.name}
            onChange={setField("name")}
            placeholder="Contoh: Kerajinan Perak"
            required
          />
        </label>

        <div className="admin-category-image">
          <span className="admin-category-image__label">Gambar Kategori</span>
          <span className="admin-category-image__preview">
            {form.imagePreview ? <img src={form.imagePreview} alt="Preview kategori" /> : <ImagePlus size={30} />}
          </span>
          <div className="admin-category-image__actions">
            <label className="admin-category-upload">
              <input type="file" accept="image/*" onChange={handleImage} />
              {form.imagePreview ? "Ganti Gambar" : "Unggah Gambar"}
            </label>
            {form.imagePreview && (
              <button type="button" className="admin-category-upload admin-category-upload--ghost" onClick={clearImage}>
                Hapus
              </button>
            )}
          </div>
          <small>JPG, PNG, atau WebP, maks. 2MB</small>
        </div>

        <label className="admin-category-field">
          <span>Deskripsi</span>
          <textarea
            value={form.description}
            onChange={setField("description")}
            placeholder="Jelaskan detail kategori ini..."
            required
          />
        </label>

        <div className="admin-category-toggle-row">
          <div>
            <strong>Status Aktif</strong>
            <span>Tampilkan kategori ini ke pelanggan</span>
          </div>
          <label className="admin-switch">
            <input type="checkbox" checked={form.isActive} onChange={setField("isActive")} />
            <span />
          </label>
        </div>

        {error && <div className="admin-category-modal__error" role="alert">{error}</div>}

        <div className="admin-category-modal__actions">
          <button type="button" className="admin-category-button admin-category-button--ghost" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button type="submit" className="admin-category-button admin-category-button--primary" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : isEditing ? "Update" : "Simpan Kategori"}
          </button>
        </div>
      </form>
    </div>
  );
}

export {
  CategoryManagementPage,
  CategoryCard,
  CategoryModal
};