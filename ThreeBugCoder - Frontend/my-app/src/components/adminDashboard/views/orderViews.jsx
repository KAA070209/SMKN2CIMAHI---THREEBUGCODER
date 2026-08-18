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

function OrderManagementPage({
  activeMenuId,
  actionMenuRef,
  error,
  isLoading,
  isSidebarOpen,
  onAction,
  onMenuToggle,
  onQueryChange,
  onRefresh,
  onStatusChange,
  onToggleSidebar,
  orders,
  query,
  rawCount,
  status,
}) {
  return (
    <section className="admin-content admin-content--orders">
      <div className="admin-order-page-head">
        <div className="admin-order-title-row">
          <button
            type="button"
            className="admin-mobile-menu admin-mobile-menu--orders"
            aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
            onClick={onToggleSidebar}
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <h1>Manajemen Pesanan</h1>
            <p>Kelola dan lacak status pesanan pelanggan.</p>
          </div>
        </div>

        <div className="admin-order-controls">
          <label className="admin-order-search">
            <Search size={22} strokeWidth={2.4} />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Cari ID Pesanan atau Nama..."
              aria-label="Cari ID pesanan atau nama pelanggan"
            />
          </label>

          <div className="admin-order-status-filter">
            <select value={status} onChange={(event) => onStatusChange(event.target.value)} aria-label="Filter status pesanan">
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      <div className="admin-order-table-card">
        <div className="admin-order-table" role="table" aria-label="Daftar pesanan">
          <div className="admin-order-table__head" role="row">
            <span role="columnheader">Order ID</span>
            <span role="columnheader">Pelanggan</span>
            <span role="columnheader">Tanggal</span>
            <span role="columnheader">Total</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Aksi</span>
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div className="admin-order-row admin-order-row--loading" key={index} role="row">
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
              </div>
            ))
          ) : orders.length ? (
            orders.map((order) => (
              <OrderTableRow
                key={order.id}
                activeMenuId={activeMenuId}
                actionMenuRef={actionMenuRef}
                onAction={onAction}
                onMenuToggle={onMenuToggle}
                order={order}
              />
            ))
          ) : (
            <div className="admin-order-table__empty">
              <ClipboardList size={28} />
              <span>Belum ada pesanan yang cocok.</span>
            </div>
          )}
        </div>

        <div className="admin-order-table__foot">
          <strong>Menampilkan {orders.length ? `1-${orders.length}` : "0"} dari {rawCount} pesanan</strong>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled>
              <ChevronLeftIcon />
            </button>
            <button type="button" aria-label="Halaman berikutnya" disabled={orders.length >= rawCount}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderTableRow({ activeMenuId, actionMenuRef, onAction, onMenuToggle, order }) {
  const isMenuOpen = activeMenuId === order.id;

  return (
    <div className="admin-order-row" role="row">
      <button type="button" className="admin-order-row__code" role="cell" onClick={() => onAction(order, "detail")}>
        {order.code}
      </button>

      <div className="admin-order-row__customer" role="cell">
        <span className="admin-order-row__avatar">{order.initial}</span>
        <strong>{order.customer}</strong>
      </div>

      <time className="admin-order-row__date" role="cell">{order.displayDate}</time>
      <strong className="admin-order-row__total" role="cell">{formatRupiah(order.total)}</strong>
      <span className={`admin-order-chip ${getStatusClass(order.status)}`} role="cell">
        <span />
        {order.statusLabel}
      </span>

      <div className="admin-order-row__actions" role="cell" ref={isMenuOpen ? actionMenuRef : null}>
        <button
          type="button"
          aria-label={`Aksi pesanan ${order.code}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => onMenuToggle(order.id)}
        >
          <MoreVertical size={22} strokeWidth={2.8} />
        </button>

        {isMenuOpen && <OrderActionMenu order={order} onAction={onAction} />}
      </div>
    </div>
  );
}

function OrderActionMenu({ onAction, order }) {
  return (
    <div className="admin-order-action-menu" role="menu">
      <span className="admin-order-action-menu__grab" aria-hidden="true" />
      <div className="admin-order-action-menu__head">
        <h2>Aksi Pesanan</h2>
        <p>{order.code}</p>
      </div>

      <button type="button" role="menuitem" onClick={() => onAction(order, "detail")}>
        <Eye size={15} strokeWidth={2} />
        <span>Lihat Detail</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(order, "status")}>
        <PenLine size={15} strokeWidth={2} />
        <span>Update Status</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(order, "print")}>
        <Printer size={15} strokeWidth={2} />
        <span>Cetak Resi</span>
      </button>
      <button type="button" role="menuitem" className="is-danger" onClick={() => onAction(order, "cancel")}>
        <CircleX size={15} strokeWidth={2} />
        <span>Batalkan Pesanan</span>
      </button>
    </div>
  );
}

function OrderDetailPage({
  detail,
  error,
  isLoading,
  isSidebarOpen,
  isStatusEditorOpen,
  isSavingStatus,
  onBack,
  onCloseStatusEditor,
  onEditStatus,
  onSaveStatus,
  onPrint,
  onRefresh,
  onToggleSidebar,
}) {
  const customer = detail?.customer || {};
  const payment = detail?.payment || {};

  return (
    <section className="admin-order-detail-page">
      <div className="admin-order-detail-head">
        <div className="admin-order-title-row">
          <button
            type="button"
            className="admin-mobile-menu admin-mobile-menu--orders"
            aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
            onClick={onToggleSidebar}
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <div className="admin-order-detail-crumb">
              <button type="button" onClick={onBack}>Pesanan</button>
              <ChevronRight size={14} />
              <strong>{detail?.code || "Detail"}</strong>
            </div>
            <h1>Detail Pesanan <span>{detail?.code || ""}</span></h1>
          </div>
        </div>

        <div className="admin-order-detail-actions">
          <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onEditStatus} disabled={isLoading || !detail}>
            Edit Status
          </button>
          <button type="button" className="admin-form-button admin-form-button--primary" onClick={onPrint} disabled={isLoading || !detail}>
            <Printer size={17} />
            Cetak Resi
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      {isLoading ? (
        <div className="admin-order-detail-grid">
          <div className="admin-detail-card admin-detail-card--loading" />
          <div className="admin-detail-card admin-detail-card--loading" />
          <div className="admin-detail-card admin-detail-card--loading" />
        </div>
      ) : detail ? (
        <>
          <div className="admin-order-detail-grid">
            <div className="admin-order-detail-main">
              <section className="admin-detail-card admin-detail-products">
                <h2>DAFTAR PRODUK</h2>
                <div className="admin-detail-products__head">
                  <span>PRODUK</span>
                  <span>HARGA</span>
                  <span>JUMLAH</span>
                  <span>SUBTOTAL</span>
                </div>
                {detail.items.length ? (
                  detail.items.map((item) => (
                    <div className="admin-detail-product" key={item.id}>
                      <span className="admin-detail-product__icon">
                        {item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <PackageCheck size={22} />}
                      </span>
                      <div>
                        <strong>{item.name}</strong>
                        <small>SKU: {item.sku || "-"}</small>
                      </div>
                      <span>{formatRupiah(item.price)}</span>
                      <span>{item.quantity}</span>
                      <strong>{formatRupiah(item.subtotal)}</strong>
                    </div>
                  ))
                ) : (
                  <div className="admin-detail-empty">Belum ada produk pada pesanan ini.</div>
                )}
              </section>

              <section className="admin-detail-card admin-detail-payment">
                <h2>RINCIAN PEMBAYARAN</h2>
                <div>
                  <span>Subtotal Produk</span>
                  <strong>{formatRupiah(payment.subtotal)}</strong>
                </div>
                <div>
                  <span>Biaya Pengiriman</span>
                  <strong>{formatRupiah(payment.shipping)}</strong>
                </div>
                <div>
                  <span>Diskon</span>
                  <strong className="is-discount">- {formatRupiah(payment.discount)}</strong>
                </div>
                <div className="admin-detail-payment__total">
                  <span>Total Keseluruhan</span>
                  <strong>{formatRupiah(payment.total)}</strong>
                </div>
              </section>
            </div>

            <aside className="admin-order-detail-side">
              <section className="admin-detail-card admin-detail-customer">
                <h2>INFORMASI PELANGGAN</h2>
                <div className="admin-detail-customer__identity">
                  <span>{getInitial(customer.name)}</span>
                  <div>
                    <strong>{customer.name || "Pelanggan"}</strong>
                    <small>{customer.type || "Pelanggan Baru"}</small>
                  </div>
                </div>

                <InfoLine icon={Mail} label="Email" value={customer.email || "-"} />
                <InfoLine icon={Phone} label="Telepon" value={customer.phone || "-"} />
                <InfoLine icon={MapPin} label="Alamat Pengiriman" value={customer.address || "-"} />
              </section>

              <section className="admin-detail-card admin-detail-status">
                <div className="admin-detail-status__head">
                  <h2>STATUS PESANAN</h2>
                  <span className={`admin-order-chip ${getStatusClass(detail.status)}`}><span />{detail.statusLabel}</span>
                </div>
                <div className="admin-status-timeline">
                  {detail.timeline.map((item, index) => (
                    <div key={`${item.label}-${index}`} className={index === 0 ? "is-current" : ""}>
                      <span />
                      <div>
                        <strong>{item.label}</strong>
                        <time>{item.time}</time>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>

          {isStatusEditorOpen && (
            <StatusEditorDialog
              currentStatus={detail.statusLabel}
              isSaving={isSavingStatus}
              onClose={onCloseStatusEditor}
              onSave={onSaveStatus}
            />
          )}
        </>
      ) : (
        <div className="admin-order-table__empty">
          <ClipboardList size={28} />
          <span>Pilih pesanan untuk melihat detail.</span>
        </div>
      )}
    </section>
  );
}

function StatusEditorDialog({ currentStatus, isSaving, onSave, onClose }) {
  const [value, setValue] = useState(currentStatus || "Diproses");

  const handleSubmit = () => {
    if (isSaving || value === currentStatus) return;
    onSave(value);
  };

  return (
    <div className="admin-modal-scrim" role="presentation">
      <section className="admin-status-editor" role="dialog" aria-modal="true" aria-labelledby="admin-status-editor-title">
        <button type="button" className="admin-status-editor__close" aria-label="Tutup" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 id="admin-status-editor-title">Update Status</h2>
        <label className="admin-field admin-field--full">
          <span>Status Pesanan</span>
          <div className="admin-select-wrap">
            <select value={value} onChange={(event) => setValue(event.target.value)}>
              {ORDER_STATUS_OPTIONS.filter((option) => option !== "Semua Status").map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown size={18} />
          </div>
        </label>
        <div className="admin-status-editor__actions">
          <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button type="button" className="admin-form-button admin-form-button--primary" onClick={handleSubmit} disabled={isSaving || value === currentStatus}>
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </section>
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="admin-info-line">
      <Icon size={18} strokeWidth={2.1} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export {
  OrderManagementPage,
  OrderTableRow,
  OrderActionMenu,
  OrderDetailPage,
  StatusEditorDialog,
  InfoLine
};