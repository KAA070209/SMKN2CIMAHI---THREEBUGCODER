/* eslint-disable no-unused-vars */

import React, { useEffect, useMemo, useRef, useState } from "react";

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

function AccountManagementPage({
  accounts,
  activeMenuId,
  actionMenuRef,
  error,
  isLoading,
  isSummaryLoading,
  onAction,
  onAdd,
  onMenuToggle,
  onRefresh,
  rawCount,
  stats,
  summaryError,
  roleFilter,
  statusFilter,
  isFilterOpen,
  onRoleFilterChange,
  onStatusFilterChange,
  onToggleFilter,
}) {
  const isFilterActive = roleFilter !== "Semua Peran" || statusFilter !== "Semua Status";
  const filterRef = useRef(null);

  useEffect(() => {
    if (!isFilterOpen) return undefined;

    const closeFilter = (event) => {
      if (event.key === "Escape") {
        onToggleFilter();
        return;
      }

      if (filterRef.current && !filterRef.current.contains(event.target)) {
        onToggleFilter();
      }
    };

    document.addEventListener("mousedown", closeFilter);
    document.addEventListener("keydown", closeFilter);
    return () => {
      document.removeEventListener("mousedown", closeFilter);
      document.removeEventListener("keydown", closeFilter);
    };
  }, [isFilterOpen, onToggleFilter]);

  return (
    <section className="admin-content admin-content--accounts">
      <div className="admin-account-heading">
        <div>
          <h1>Kelola Akun</h1>
          <p>Kelola akses dan peran administrator Studio Anda. Pastikan setiap anggota tim memiliki tingkat izin yang tepat.</p>
        </div>
        <button type="button" className="admin-account-add" onClick={onAdd}>
          <UserCog size={20} strokeWidth={2.6} />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      <div className="admin-account-overview">
        <section className="admin-account-total-card">
          <span className="admin-account-total-card__icon">
            <UsersRound size={22} strokeWidth={2.4} />
          </span>
          <small>Total Administrator</small>
          <strong>{isSummaryLoading ? "..." : `${formatCompactNumber(stats.total)} Akun`}</strong>
          <span className="admin-account-total-card__note">
            <UserCog size={14} strokeWidth={2.4} />
            {stats.verifiedText}
          </span>
        </section>

        <section className="admin-account-role-card">
          <div className="admin-account-role-card__title">
            <UserCog size={18} strokeWidth={2.4} />
            <span>Distribusi Peran Aktif</span>
          </div>
          <div className="admin-account-role-card__counts">
            <div>
              <strong>{formatCompactNumber(stats.admin)}</strong>
              <span>Admin</span>
            </div>
            <div>
              <strong>{formatCompactNumber(stats.seller)}</strong>
              <span>Seller</span>
            </div>
            <div>
              <strong>{formatCompactNumber(stats.user)}</strong>
              <span>User/Customer</span>
            </div>
          </div>
        </section>
      </div>

      {(error || summaryError) && (
        <div className="admin-error" role="alert">
          <span>{error || summaryError}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      <div className="admin-account-table-card">
        <div className="admin-account-table__title">
          <h2>Daftar Akun</h2>
          <div className="admin-filter-wrap" ref={filterRef}>
            <button
              type="button"
              className={isFilterActive ? "is-active" : ""}
              aria-haspopup="dialog"
              aria-expanded={isFilterOpen}
              onClick={onToggleFilter}
            >
              <List size={16} strokeWidth={2.4} />
              <span>Filter</span>
              {isFilterActive && <span className="admin-filter-dot" />}
            </button>
            {isFilterOpen && (
              <div className="admin-filter-popover" role="dialog" aria-label="Filter daftar akun">
                <label className="admin-filter-field">
                  <span>Peran</span>
                  <select value={roleFilter} onChange={(event) => onRoleFilterChange(event.target.value)} aria-label="Filter peran">
                    {ACCOUNT_ROLE_FILTER_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-filter-field">
                  <span>Status</span>
                  <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} aria-label="Filter status">
                    {ACCOUNT_STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="admin-account-table" role="table" aria-label="Daftar akun">
          <div className="admin-account-table__head" role="row">
            <span role="columnheader">Profil</span>
            <span role="columnheader">Email</span>
            <span role="columnheader">Peran</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Aksi</span>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div className="admin-account-row admin-account-row--loading" key={index} role="row">
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
              </div>
            ))
          ) : accounts.length ? (
            accounts.map((account) => (
              <AccountTableRow
                key={account.id}
                account={account}
                activeMenuId={activeMenuId}
                actionMenuRef={actionMenuRef}
                onAction={onAction}
                onMenuToggle={onMenuToggle}
              />
            ))
          ) : (
            <div className="admin-order-table__empty">
              <UsersRound size={28} />
              <span>Belum ada akun yang cocok.</span>
            </div>
          )}
        </div>

        <div className="admin-account-table__foot">
          <strong>Menampilkan {accounts.length ? `1-${accounts.length}` : "0"} dari {rawCount} akun</strong>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled>
              <ChevronLeftIcon />
            </button>
            <button type="button" aria-label="Halaman berikutnya" disabled={accounts.length >= rawCount}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountTableRow({ account, activeMenuId, actionMenuRef, onAction, onMenuToggle }) {
  const isMenuOpen = activeMenuId === account.id;

  return (
    <div className="admin-account-row" role="row">
      <div className="admin-account-row__profile" role="cell">
        <AccountAvatar account={account} />
        <strong>{account.name}</strong>
      </div>
      <span role="cell" className="admin-account-row__email">{account.email || "-"}</span>
      <span role="cell" className={`admin-account-role-pill admin-account-role-pill--${account.role}`}>
        {account.roleLabel}
      </span>
      <span role="cell" className={`admin-account-status-pill ${account.isActive ? "is-active" : "is-inactive"}`}>
        <span />
        {account.statusLabel}
      </span>
      <div className="admin-account-row__actions" role="cell" ref={isMenuOpen ? actionMenuRef : null}>
        <button
          type="button"
          aria-label={`Aksi akun ${account.name}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => onMenuToggle(account.id)}
        >
          <MoreVertical size={21} strokeWidth={2.8} />
        </button>
        {isMenuOpen && <AccountActionMenu account={account} onAction={onAction} />}
      </div>
    </div>
  );
}

function AccountActionMenu({ account, onAction }) {
  return (
    <div className="admin-account-action-menu" role="menu">
      <button type="button" role="menuitem" onClick={() => onAction(account, "edit")}>
        <Pencil size={16} strokeWidth={2.2} />
        <span>Edit Akun</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(account, "role")}>
        <UserCog size={16} strokeWidth={2.2} />
        <span>Ubah Peran</span>
      </button>
      <button type="button" role="menuitem" className="is-danger" onClick={() => onAction(account, "status")}>
        <CircleX size={16} strokeWidth={2.2} />
        <span>{account.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
      </button>
    </div>
  );
}

function AccountAvatar({ account }) {
  return (
    <span className="admin-account-avatar-mini">
      {account.avatar ? <img src={account.avatar} alt={account.name} loading="lazy" /> : account.initials}
    </span>
  );
}

  function CustomerManagementPage({
    activeMenuId,
    actionMenuRef,
    customers,
    error,
    isLoading,
    onAction,
    onAdd,
    onMenuToggle,
    onRefresh,
    rawCount,
    stats,
    isAccounts,
    accountsSummary,
    memberFilter,
    isFilterOpen,
    onMemberFilterChange,
    onToggleFilter,
  }) {
  const topCustomer = stats.topCustomer;
  const isFilterActive = memberFilter !== "Semua Member";
  const filterRef = useRef(null);

  useEffect(() => {
    if (!isFilterOpen) return undefined;

    const closeFilter = (event) => {
      if (event.key === "Escape") {
        onToggleFilter();
        return;
      }

      if (filterRef.current && !filterRef.current.contains(event.target)) {
        onToggleFilter();
      }
    };

    document.addEventListener("mousedown", closeFilter);
    document.addEventListener("keydown", closeFilter);
    return () => {
      document.removeEventListener("mousedown", closeFilter);
      document.removeEventListener("keydown", closeFilter);
    };
  }, [isFilterOpen, onToggleFilter]);

  return (
    <section className="admin-content admin-content--customers">
      <div className="admin-customer-layout">
        <div className="admin-customer-main">
          <div className="admin-customer-heading">
            <div>
              <h1>{isAccounts ? "Kelola Akun" : "Pelanggan"}</h1>
              <p>{isAccounts ? "Kelola akses dan peran administrator Studio Anda. Pastikan setiap anggota tim memiliki tingkat izin yang tepat." : "Kelola daftar pelanggan terdaftar dan riwayat pesanan mereka."}</p>
            </div>
            <div className="admin-customer-tools">
              {onAdd && (
                <button type="button" onClick={onAdd} className="admin-customer-add">
                  <Plus size={18} strokeWidth={2.3} />
                  <span>Tambah Akun</span>
                </button>
              )}
              <div className="admin-filter-wrap" ref={filterRef}>
                <button
                  type="button"
                  className={isFilterActive ? "is-active" : ""}
                  aria-haspopup="dialog"
                  aria-expanded={isFilterOpen}
                  onClick={onToggleFilter}
                  disabled={isLoading}
                >
                  <List size={18} strokeWidth={2.3} />
                  <span>Filter</span>
                  {isFilterActive && <span className="admin-filter-dot" />}
                </button>
                {isFilterOpen && (
                  <div className="admin-filter-popover" role="dialog" aria-label="Filter pelanggan">
                    <label className="admin-filter-field">
                      <span>Member</span>
                      <select value={memberFilter} onChange={(event) => onMemberFilterChange(event.target.value)} aria-label="Filter member">
                        {CUSTOMER_MEMBER_FILTER_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
              <button type="button" onClick={onRefresh} disabled={isLoading}>
                <RefreshCcw size={17} className={isLoading ? "is-spinning" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {isAccounts && accountsSummary && (
            <div className="admin-accounts-summary">
              <div className="admin-accounts-summary__cards">
                <div className="admin-accounts-card">
                  <span>Total Akun</span>
                  <strong>{pickNumber(accountsSummary, null, ["total", "count", "total_accounts", "total_admins"]) || customers.length}</strong>
                </div>
                <div className="admin-accounts-card">
                  <span>Distribusi Peran (contoh)</span>
                  <div className="admin-accounts-card__roles">
                    {renderRoleCounts(accountsSummary) }
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="admin-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={onRefresh}>Coba lagi</button>
            </div>
          )}

          <div className="admin-customer-table-card">
            <div className="admin-customer-table" role="table" aria-label="Daftar pelanggan">
              <div className="admin-customer-table__head" role="row">
                <span role="columnheader">Nama &amp; Kontak</span>
                <span role="columnheader">Tanggal Bergabung</span>
                <span role="columnheader">Total Pesanan</span>
                <span role="columnheader">Aksi</span>
              </div>

              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div className="admin-customer-row admin-customer-row--loading" key={index} role="row">
                    <span className="admin-skeleton" />
                    <span className="admin-skeleton" />
                    <span className="admin-skeleton" />
                    <span className="admin-skeleton" />
                  </div>
                ))
              ) : customers.length ? (
                customers.map((customer) => (
                  <CustomerTableRow
                    key={customer.id}
                    activeMenuId={activeMenuId}
                    actionMenuRef={actionMenuRef}
                    customer={customer}
                    onAction={onAction}
                    onMenuToggle={onMenuToggle}
                  />
                ))
              ) : (
                <div className="admin-order-table__empty">
                  <UsersRound size={28} />
                  <span>Belum ada pelanggan yang cocok.</span>
                </div>
              )}
            </div>

            <div className="admin-customer-table__foot">
              <strong>Menampilkan {customers.length ? `1-${customers.length}` : "0"} dari {rawCount} pelanggan</strong>
              <div>
                <button type="button" aria-label="Halaman sebelumnya" disabled>
                  <ChevronLeftIcon />
                </button>
                <button type="button" aria-label="Halaman berikutnya" disabled={customers.length >= rawCount}>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="admin-customer-side">
          <section className="admin-customer-stat">
            <span>Total Pelanggan Aktif</span>
            <strong>{formatCompactNumber(stats.activeCustomers)}</strong>
            <small><TrendingUp size={14} strokeWidth={2.8} /> {stats.monthlyChange}</small>
          </section>

          <section className="admin-customer-top">
            <h2>Pelanggan Teratas</h2>
            {topCustomer ? (
              <>
                <div className="admin-customer-top__identity">
                  <CustomerAvatar customer={topCustomer} />
                  <div>
                    <strong>{topCustomer.name}</strong>
                    <span>{topCustomer.memberType}</span>
                  </div>
                </div>
                <div className="admin-customer-top__stats">
                  <div>
                    <span>Total Belanja</span>
                    <strong>{formatShortRupiah(topCustomer.totalSpent)}</strong>
                  </div>
                  <div>
                    <span>Pesanan</span>
                    <strong>{topCustomer.totalOrders}x</strong>
                  </div>
                </div>
              </>
            ) : (
              <p>Belum ada data pelanggan.</p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

function CustomerTableRow({ activeMenuId, actionMenuRef, customer, onAction, onMenuToggle }) {
  const isMenuOpen = activeMenuId === customer.id;

  return (
    <div className="admin-customer-row" role="row">
      <div className="admin-customer-row__identity" role="cell">
        <CustomerAvatar customer={customer} />
        <div>
          <strong>{customer.name}</strong>
          <span>{customer.email || "-"}</span>
        </div>
      </div>
      <time role="cell">{customer.displayJoinedAt}</time>
      <strong role="cell" className="admin-customer-row__orders">{customer.totalOrders}</strong>
      <div className="admin-customer-row__actions" role="cell" ref={isMenuOpen ? actionMenuRef : null}>
        <button
          type="button"
          aria-label={`Aksi pelanggan ${customer.name}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => onMenuToggle(customer.id)}
        >
          <MoreVertical size={22} strokeWidth={2.8} />
        </button>
        {isMenuOpen && <CustomerActionMenu customer={customer} onAction={onAction} />}
      </div>
    </div>
  );
}

function CustomerActionMenu({ customer, onAction }) {
  return (
    <div className="admin-customer-action-menu" role="menu">
      <button type="button" role="menuitem" onClick={() => onAction(customer, "profile")}>
        <UsersRound size={15} strokeWidth={2} />
        <span>Lihat Profil</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(customer, "edit")}>
        <Pencil size={15} strokeWidth={2} />
        <span>Edit Data</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(customer, "orders")}>
        <RefreshCcw size={15} strokeWidth={2} />
        <span>Riwayat Pesanan</span>
      </button>
    </div>
  );
}

function CustomerAvatar({ customer }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [customer?.avatar]);

  if (!customer?.avatar || imageFailed) {
    return (
      <span className="admin-customer-avatar">
        {customer?.initials || getInitials(customer?.name)}
      </span>
    );
  }

  return (
    <span className="admin-customer-avatar">
      <img src={customer.avatar} alt={customer.name} loading="lazy" onError={() => setImageFailed(true)} />
    </span>
  );
}

export {
  AccountManagementPage,
  AccountTableRow,
  AccountActionMenu,
  AccountAvatar,
  CustomerManagementPage,
  CustomerTableRow,
  CustomerActionMenu,
  CustomerAvatar
};