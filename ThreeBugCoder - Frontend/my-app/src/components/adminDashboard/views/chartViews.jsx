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

function TopSellersChart({ sellers, isLoading }) {
  const max = Math.max(...sellers.map((seller) => seller.earnings), 0);

  return (
    <div className="admin-top-sellers">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <div className="admin-top-seller admin-top-seller--loading" key={index}>
            <span className="admin-skeleton admin-top-seller__rank" />
            <div className="admin-top-seller__bar">
              <span className="admin-skeleton" />
              <span className="admin-skeleton admin-top-seller__track" />
            </div>
          </div>
        ))
      ) : sellers.length ? (
        sellers.map((seller, index) => (
          <div className="admin-top-seller" key={`${seller.name}-${index}`}>
            <span className={`admin-top-seller__rank ${index < 3 ? `is-top-${index}` : ""}`}>
              {seller.avatar ? <img src={seller.avatar} alt={seller.name} loading="lazy" /> : index + 1}
            </span>
            <div className="admin-top-seller__bar">
              <div className="admin-top-seller__identity">
                <strong>{seller.name}</strong>
                <span>{formatShortRupiah(seller.earnings)}</span>
              </div>
              <div className="admin-top-seller__track">
                <span
                  className="admin-top-seller__fill"
                  style={{ width: max ? `${Math.max((seller.earnings / max) * 100, 4)}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="admin-empty-top-sellers">
          <TrendingUp size={24} strokeWidth={2.2} />
          <span>Belum ada data top seller.</span>
        </div>
      )}
    </div>
  );
}

function OrderItem({ order }) {
  return (
    <div className="admin-order">
      <span className="admin-order__icon">
        <ClipboardList size={18} strokeWidth={2.2} />
      </span>
      <div className="admin-order__copy">
        <strong>{order.code}</strong>
        <span>{order.customer}</span>
      </div>
      <div className="admin-order__meta">
        <span className={`admin-order__status ${getStatusClass(order.status)}`}>{order.statusLabel}</span>
        <time>{order.displayTime}</time>
      </div>
    </div>
  );
}

export {
  TopSellersChart,
  OrderItem
};
