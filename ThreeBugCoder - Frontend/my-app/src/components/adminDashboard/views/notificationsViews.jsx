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

function NotificationsDropdown({
  error,
  isLoading,
  notifications,
  onMarkAllRead,
  onNotificationClick,
  onRefresh,
}) {
  const hasUnread = notifications.some((notification) => !notification.isRead);

  return (
    <section className="admin-notification-popover" role="dialog" aria-labelledby="admin-notification-title">
      <div className="admin-notification-popover__head">
        <h2 id="admin-notification-title">Notifikasi</h2>
        <button type="button" onClick={onMarkAllRead} disabled={!hasUnread || isLoading}>
          Tandai semua dibaca
        </button>
      </div>

      {error && (
        <div className="admin-notification-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      <div className="admin-notification-list">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div className="admin-notification-item admin-notification-item--loading" key={index}>
              <span className="admin-skeleton admin-notification-item__icon" />
              <div>
                <span className="admin-skeleton admin-notification-item__title" />
                <span className="admin-skeleton admin-notification-item__message" />
                <span className="admin-skeleton admin-notification-item__time" />
              </div>
            </div>
          ))
        ) : notifications.length ? (
          notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <button
                type="button"
                className={`admin-notification-item ${notification.isRead ? "" : "is-unread"}`}
                key={notification.id}
                onClick={() => onNotificationClick(notification)}
              >
                <span className={`admin-notification-item__icon admin-notification-item__icon--${notification.accent}`}>
                  <Icon size={23} strokeWidth={2.2} />
                </span>
                <span className="admin-notification-item__body">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <time>{notification.displayTime}</time>
                </span>
              </button>
            );
          })
        ) : (
          <div className="admin-notification-empty">
            <Bell size={24} strokeWidth={2.2} />
            <span>Belum ada notifikasi.</span>
          </div>
        )}
      </div>

      <button type="button" className="admin-notification-popover__foot" onClick={onRefresh} disabled={isLoading}>
        Lihat semua notifikasi
      </button>
    </section>
  );
}

export {
  NotificationsDropdown
};