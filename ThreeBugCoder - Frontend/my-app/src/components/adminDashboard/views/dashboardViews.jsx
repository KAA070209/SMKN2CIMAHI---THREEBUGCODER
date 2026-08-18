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

import { TopSellersChart, OrderItem } from "./chartViews.jsx";

function DashboardHome({ dashboard, error, isLoading, onRefresh, onViewOrders, adminUser }) {
  return (
    <section className="admin-content">
      <div className="admin-heading">
            <div>
              <h1>Selamat Datang, {adminUser.firstName}</h1>
              <p>Berikut ringkasan toko Anda hari ini.</p>
            </div>

            <button type="button" className="admin-refresh" onClick={onRefresh} disabled={isLoading}>
              <RefreshCcw size={17} className={isLoading ? "is-spinning" : ""} />
              <span>{isLoading ? "Memuat" : "Refresh"}</span>
            </button>
          </div>

          {error && (
            <div className="admin-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={onRefresh}>
                Coba lagi
              </button>
            </div>
          )}

          <section className="admin-metrics" aria-label="Ringkasan toko">
            {metricCards.map((card) => {
              const Icon = card.icon;
              const changeText = dashboard[card.changeKey];
              return (
                <article key={card.key} className="admin-card admin-metric">
                  <div className={`admin-metric__icon admin-metric__icon--${card.accent}`}>
                    <Icon size={23} strokeWidth={2.35} />
                  </div>
                  <div className="admin-metric__label">{card.label}</div>
                  <strong className={isLoading ? "admin-skeleton admin-skeleton--value" : ""}>
                    {isLoading ? "" : card.formatter(dashboard[card.key])}
                  </strong>
                  <div className="admin-metric__change">
                    {changeText ? (
                      <>
                        <TrendingUp size={14} strokeWidth={2.8} />
                        <span>{changeText}</span>
                      </>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="admin-dashboard-grid">
            <article className="admin-card admin-top-sellers-card">
              <div className="admin-card__head">
                <h2>Top Seller Penghasilan Terbanyak</h2>
              </div>
              <TopSellersChart sellers={dashboard.topSellers} isLoading={isLoading} />
            </article>

            <article className="admin-card admin-orders-card">
              <div className="admin-orders__head">
                <h2>Pesanan Terbaru</h2>
                <button type="button" onClick={onViewOrders}>Lihat Semua</button>
              </div>

              <div className="admin-orders">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div className="admin-order admin-order--loading" key={index}>
                      <span className="admin-order__icon" />
                      <div className="admin-skeleton admin-skeleton--order" />
                      <div className="admin-skeleton admin-skeleton--pill" />
                    </div>
                  ))
                ) : dashboard.recentOrders.length ? (
                  dashboard.recentOrders.map((order) => <OrderItem key={order.id} order={order} />)
                ) : (
                  <div className="admin-empty-orders">
                    <BriefcaseBusiness size={24} />
                    <span>Belum ada pesanan terbaru.</span>
                  </div>
                )}
              </div>
            </article>
          </section>
        </section>
  );
}

export {
  DashboardHome
};