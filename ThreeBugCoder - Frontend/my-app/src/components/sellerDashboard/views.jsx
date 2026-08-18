/* eslint-disable no-unused-vars */

import React, { useEffect, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  UserCog,
  UserRound,
  X,
} from "lucide-react";

import {
  navItems,
  metricCards,
  FALLBACK_CATEGORIES,
  SELLER_BLOB_PATH,
  EMPTY_PRODUCT_FORM,
  EMPTY_STORE_FORM,
  ORDER_FILTERS,
  ORDER_STATUS_OPTIONS
} from "./constants.jsx";

import {
  buildInitialStoreForm,
  buildSellerStorePayload,
  buildInitialProductForm,
  buildInitialImagePreviews,
  buildSellerProductPayload,
  normalizeSellerStore,
  extractSellerStoreRecord,
  normalizeStoreTags,
  normalizeSellerSummary,
  normalizeSalesTrend,
  normalizeSellerOrders,
  normalizeSellerProducts,
  buildCategoryNameMap,
  buildCategoryOptions,
  filterSellerProducts,
  filterSellerOrders,
  normalizeOrderItems,
  normalizeOrderStatus,
  toApiOrderStatus,
  normalizeOrderTimeline,
  sumOrderItems,
  formatOrderItemSummary,
  formatAddress,
  formatFullDateTime,
  extractCollection,
  getProductId,
  buildSellerUser,
  pickNumber,
  pickText,
  toNumber,
  formatRupiah,
  formatCompactNumber,
  formatOrderDate,
  formatOrderTime,
  parseDate,
  formatOrderCode,
  getInitials,
  getStatusLabel,
  getStatusClass,
  getFallbackDay,
  formatTrendLabel,
  getFallbackProductImage
} from "./helpers.js";

import {
  extractSellerNotifications,
  looksLikeSellerNotification,
  normalizeSellerNotifications,
  normalizeSellerNotification,
  extractSellerNotificationProduct,
  extractSellerNotificationStoreName,
  groupSellerNotifications,
  mergeSellerNotifications,
  getSellerNotificationId,
  isSellerNotificationRead,
  countSellerUnreadNotifications,
  extractSellerUnreadCount,
  normalizeSellerNotificationType,
  getSellerNotificationAccent,
  getSellerNotificationIcon,
  getSellerNotificationFallbackTitle,
  getSellerNotificationFallbackMessage,
  formatSellerRelativeTime,
  formatSellerDateOnly,
  formatBadgeCount,
  ReceiptIcon
} from "./notifications.jsx";

const SELLER_TREND_PERIODS = [
  { value: "week", label: "Mingguan", days: 7 },
  { value: "month", label: "Bulanan", days: 30 },
  { value: "all", label: "Semua", days: null },
];

function SellerDashboardHome({ summary, orders = [], isLoading, isOrdersLoading = false, error, onRefresh }) {
  const [trendPeriod, setTrendPeriod] = useState("week");
  const trendPoints = useMemo(
    () => buildSellerDailySalesTrend(orders.length ? orders : summary.recentOrders, summary.salesTrend, trendPeriod),
    [orders, summary.recentOrders, summary.salesTrend, trendPeriod]
  );

  return (
    <>
      <header className="seller-hero">
        <div>
          <h1>Selamat Datang, {summary.firstName}</h1>
          <p>Lihat ringkasan aktivitas studio Anda hari ini.</p>
          <span className="seller-title-wave" aria-hidden="true" />
        </div>
        <button type="button" className="seller-refresh" onClick={onRefresh} disabled={isLoading}>
          <RefreshCcw size={17} strokeWidth={2.3} />
          <span>{isLoading ? "Memuat" : "Refresh"}</span>
        </button>
      </header>

      {error && (
        <section className="seller-alert" role="alert">
          <strong>Dashboard seller belum bisa dimuat.</strong>
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>
            Coba lagi
          </button>
        </section>
      )}

      <section className="seller-dashboard-grid">
        <div className="seller-metrics">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.key} className={`seller-metric seller-metric--${card.accent}`}>
                <div className="seller-metric__head">
                  <span>{card.label}</span>
                  <span className="seller-metric__icon">
                    <Icon size={22} strokeWidth={2.2} />
                  </span>
                </div>
                <strong>{isLoading ? "" : card.formatter(summary[card.key])}</strong>
                <small>{isLoading ? "" : summary[card.detailKey]}</small>
                {isLoading && <span className="seller-skeleton seller-skeleton--metric" />}
              </article>
            );
          })}
        </div>

        <article className="seller-chart-card">
          <div className="seller-chart-head">
            <div className="seller-chart-head__copy">
              <h2>Tren Penjualan</h2>
              <p className="seller-chart-subtitle">Total penjualan per hari</p>
            </div>
            <label className="seller-period-control">
              <select
                className="seller-period"
                value={trendPeriod}
                onChange={(event) => setTrendPeriod(event.target.value)}
                aria-label="Filter periode tren penjualan"
              >
                {SELLER_TREND_PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} strokeWidth={2.4} />
            </label>
          </div>
          <SellerSalesChart points={trendPoints} isLoading={isLoading || isOrdersLoading} />
        </article>
      </section>

      <section className="seller-orders-card">
        <div className="seller-card-head seller-card-head--orders">
          <h2>
            <Tag size={23} strokeWidth={2.2} />
            <span>Pesanan Terbaru</span>
          </h2>
        </div>
        <SellerOrdersTable orders={summary.recentOrders} isLoading={isLoading} />
      </section>
    </>
  );
}

function SellerOrdersPage({
  orders,
  allOrders,
  selectedOrder,
  isLoading,
  error,
  statusError,
  query,
  filter,
  isUpdatingStatus,
  onQueryChange,
  onFilterChange,
  onRefresh,
  onSelectOrder,
  onBackToList,
  onStatusChange,
}) {
  if (selectedOrder) {
    return (
      <SellerOrderDetailPage
        order={selectedOrder}
        error={statusError}
        isUpdatingStatus={isUpdatingStatus}
        onBack={onBackToList}
        onStatusChange={onStatusChange}
      />
    );
  }

  return (
    <section className="seller-orders-page">
      <header className="seller-orders-hero">
        <div>
          <h1>
            <ShoppingCart size={38} strokeWidth={2.2} />
            <span>Orders</span>
          </h1>
          <p>Manage your incoming magic and send it out to the world.</p>
        </div>
        <button type="button" className="seller-refresh seller-orders-refresh" onClick={onRefresh} disabled={isLoading}>
          <RefreshCcw size={17} strokeWidth={2.3} className={isLoading ? "is-spinning" : ""} />
          <span>{isLoading ? "Memuat" : "Refresh"}</span>
        </button>
      </header>

      <div className="seller-orders-toolbar">
        <label className="seller-order-search">
          <Search size={22} strokeWidth={2.1} />
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search orders, customers..."
            aria-label="Cari pesanan seller"
          />
        </label>
        <div className="seller-order-filters" aria-label="Filter pesanan">
          {ORDER_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`seller-order-filter ${filter === item.value ? "is-active" : ""}`}
              onClick={() => onFilterChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <section className="seller-alert seller-alert--products" role="alert">
          <strong>Pesanan belum bisa dimuat.</strong>
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>
            Coba lagi
          </button>
        </section>
      )}

      {statusError && (
        <section className="seller-order-status-alert" role="alert">
          {statusError}
        </section>
      )}

      {isLoading ? (
        <div className="seller-order-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="seller-order-card seller-order-card--loading" />
          ))}
        </div>
      ) : orders.length ? (
        <div className="seller-order-list">
          {orders.map((order) => (
            <SellerOrderCard
              key={order.id}
              order={order}
              isUpdatingStatus={isUpdatingStatus}
              onOpen={() => onSelectOrder(order)}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="seller-empty-products seller-empty-products--orders">
          <ClipboardList size={30} strokeWidth={2.1} />
          <span>{allOrders.length ? "Pesanan tidak ditemukan untuk filter ini." : "Belum ada pesanan masuk."}</span>
        </div>
      )}
    </section>
  );
}

function SellerOrderCard({ order, isUpdatingStatus, onOpen, onStatusChange }) {
  return (
    <article className="seller-order-card">
      <button type="button" className="seller-order-card__open" onClick={onOpen}>
        <span className="seller-order-card__main">
          <span className="seller-order-card__code">
            {order.code}
            <span className={`seller-order-badge seller-order-badge--${order.statusClass}`}>{order.statusLabel}</span>
          </span>
          <span className="seller-order-card__time">{order.dateLabel}</span>
          <span className="seller-order-card__customer">
            <span className={`seller-avatar seller-avatar--${order.accent}`}>{order.initials}</span>
            <strong>{order.customer}</strong>
          </span>
        </span>
        <span className="seller-order-card__items">
          {order.items.slice(0, 2).map((item) => (
            <span key={item.id}>
              <ClipboardCheck size={14} strokeWidth={2.1} />
              {item.name}
            </span>
          ))}
          {order.items.length > 2 && <small>+{order.items.length - 2} more item</small>}
        </span>
      </button>
      <div className="seller-order-card__actions">
        <strong>{formatRupiah(order.total)}</strong>
        <SellerOrderStatusSelect
          order={order}
          disabled={isUpdatingStatus}
          onStatusChange={onStatusChange}
        />
      </div>
    </article>
  );
}

function SellerOrderDetailPage({ order, error, isUpdatingStatus, onBack, onStatusChange }) {
  return (
    <section className="seller-order-detail-page">
      <header className="seller-order-detail-hero">
        <h1>{order.code}</h1>
      </header>

      <div className="seller-order-detail-inner">
        <button type="button" className="seller-back-button seller-order-back" onClick={onBack}>
          <ArrowLeft size={15} strokeWidth={2.5} />
          <span>Back</span>
        </button>

        {error && (
          <section className="seller-order-status-alert" role="alert">
            {error}
          </section>
        )}

        <section className="seller-order-detail-summary">
          <div>
            <h2>
              <span>Order Details</span>
              <span className={`seller-order-badge seller-order-badge--${order.statusClass}`}>{order.statusLabel}</span>
            </h2>
            <p>
              <CalendarDays size={18} strokeWidth={2.1} />
              <span>
                Pesanan dibuat
                {order.orderedAt ? `: ${order.orderedAt}` : order.dateLabel ? `: ${order.dateLabel}` : ""}
              </span>
            </p>
          </div>
          <SellerOrderStatusSelect
            order={order}
            variant="primary"
            disabled={isUpdatingStatus}
            onStatusChange={onStatusChange}
          />
        </section>

        <div className="seller-order-detail-grid">
          <div className="seller-order-detail-main">
            <section className="seller-order-items-panel">
              <h2>
                <ClipboardList size={24} strokeWidth={2.1} />
                <span>Items Ordered</span>
              </h2>
              <div className="seller-order-items">
                {order.items.map((item) => (
                  <article key={item.id} className="seller-order-item">
                    <span className="seller-order-item__media">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <Pencil size={24} strokeWidth={2.2} />
                      )}
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>Qty: {item.quantity}</small>
                    </span>
                    <strong>{formatRupiah(item.total || item.price)}</strong>
                  </article>
                ))}
              </div>
            </section>

            <section className="seller-payment-panel">
              <h3>
                <ClipboardCheck size={20} strokeWidth={2.1} />
                <span>Pembayaran</span>
              </h3>
              <dl>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatRupiah(order.subtotal)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{formatRupiah(order.shippingCost)}</dd>
                </div>
                <div>
                  <dt>Tax</dt>
                  <dd>{formatRupiah(order.tax)}</dd>
                </div>
                <div className="seller-payment-panel__total">
                  <dt>Total</dt>
                  <dd>{formatRupiah(order.total)}</dd>
                </div>
              </dl>
            </section>
          </div>

          <aside className="seller-order-side">
            <section className="seller-customer-panel">
              <h3>
                <UserRound size={20} strokeWidth={2.1} />
                <span>Customer Info</span>
              </h3>
              <strong>{order.customer}</strong>
              {order.customerEmail && (
                <span>
                  <Mail size={16} strokeWidth={2.1} />
                  {order.customerEmail}
                </span>
              )}
              {order.customerPhone && (
                <span>
                  <Phone size={16} strokeWidth={2.1} />
                  {order.customerPhone}
                </span>
              )}
              <h4>
                <MapPin size={18} strokeWidth={2.1} />
                <span>Shipping Address</span>
              </h4>
              {order.shippingRecipient && <strong className="seller-customer-panel__recipient">{order.shippingRecipient}</strong>}
              <p>{order.shippingAddress || "Alamat pengiriman belum tersedia."}</p>
            </section>

            <section className="seller-timeline-panel">
              <h3>
                <Clock3 size={20} strokeWidth={2.1} />
                <span>Order Timeline</span>
              </h3>
              <ol>
                {order.timeline.map((event, index) => (
                  <li key={`${event.label}-${index}`} className={index === 0 ? "is-current" : ""}>
                    <strong>{event.label}</strong>
                    <span>{event.time}</span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

function SellerOrderStatusSelect({ order, variant = "default", disabled, onStatusChange }) {
  return (
    <label className={`seller-order-status-select seller-order-status-select--${variant}`}>
      <span className="sr-only">Change status {order.code}</span>
      <select
        value={order.status}
        disabled={disabled}
        onChange={(event) => onStatusChange(order.id, event.target.value)}
      >
        {ORDER_STATUS_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} strokeWidth={2.4} />
    </label>
  );
}

function SellerProductsPage({
  products,
  allProducts,
  categories,
  isLoading,
  error,
  query,
  filter,
  onQueryChange,
  onFilterChange,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <section className="seller-products-page">
      <header className="seller-products-hero">
        <div>
          <h1>Produk Saya</h1>
          <p>Kelola hasil kerajinanmu dengan mudah. Perbarui stok, ubah deskripsi, atau tambahkan produk baru ke tokomu.</p>
          <span className="seller-products-wave" aria-hidden="true" />
        </div>
        <button type="button" className="seller-refresh seller-products-refresh" onClick={onRefresh} disabled={isLoading}>
          <RefreshCcw size={17} strokeWidth={2.3} className={isLoading ? "is-spinning" : ""} />
          <span>{isLoading ? "Memuat" : "Refresh"}</span>
        </button>
      </header>

      <div className="seller-products-toolbar">
        <label className="seller-product-search">
          <Search size={21} strokeWidth={2.1} />
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Cari berdasarkan nama, kategori, atau kata kunci..."
            aria-label="Cari produk seller"
          />
        </label>
        <span className="seller-filter-label">Filter:</span>
        <div className="seller-filter-pills" aria-label="Filter produk">
          {["Semua Produk", ...categories.slice(0, 5).map((category) => category.name)].map((category) => (
            <button
              key={category}
              type="button"
              className={`seller-filter-pill ${filter === category ? "is-active" : ""}`}
              onClick={() => onFilterChange(category)}
            >
              {category}
            </button>
          ))}
          <button type="button" className="seller-filter-pill seller-filter-pill--stock" onClick={() => onFilterChange("Stok Menipis")}>
            Stok Menipis
          </button>
        </div>
      </div>

      {error && (
        <section className="seller-alert seller-alert--products" role="alert">
          <strong>Produk belum bisa dimuat.</strong>
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>
            Coba lagi
          </button>
        </section>
      )}

      {isLoading ? (
        <div className="seller-product-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="seller-product-card seller-product-card--loading" />
          ))}
        </div>
      ) : products.length ? (
        <div className="seller-product-grid">
          {products.map((product) => (
            <SellerProductCard key={product.id} product={product} onEdit={() => onEdit(product)} onDelete={() => onDelete(product)} />
          ))}
        </div>
      ) : (
        <div className="seller-empty-products">
          <ShoppingBag size={30} strokeWidth={2.1} />
          <span>{allProducts.length ? "Produk tidak ditemukan untuk filter ini." : "Belum ada produk di tokomu."}</span>
          <button type="button" onClick={onAdd}>Tambah Product</button>
        </div>
      )}
    </section>
  );
}

function SellerProductCard({ product, onEdit, onDelete }) {
  const clipId = `seller-product-blob-${String(product.id).replace(/[^a-z0-9_-]/gi, "")}`;
  const lowStock = product.stock > 0 && product.stock <= 2;
  const inactive = !product.isActive || product.stock <= 0;

  return (
    <article className="seller-product-card">
      <div className="seller-product-card__media">
        <svg width="0" height="0" aria-hidden="true" focusable="false">
          <clipPath id={clipId} clipPathUnits="objectBoundingBox" transform="scale(0.01,0.01)">
            <path d={SELLER_BLOB_PATH} />
          </clipPath>
        </svg>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          style={{ clipPath: `url(#${clipId})` }}
          onError={(event) => {
            event.currentTarget.src = getFallbackProductImage(0);
          }}
        />
        <span className={`seller-product-badge ${inactive ? "is-muted" : ""}`}>
          <span />
          {inactive ? "Draft" : "Aktif"}
        </span>
      </div>

      <div className="seller-product-card__body">
        <div className="seller-product-card__meta">
          <span>{product.category}</span>
          <strong>{formatRupiah(product.price)}</strong>
        </div>
        <h2>{product.name}</h2>
        <span className="seller-product-card__dash" />
        <div className="seller-product-card__foot">
          <span className={lowStock ? "is-low" : inactive ? "is-empty" : ""}>
            <ClipboardCheck size={14} strokeWidth={2.1} />
            {inactive ? "0 in stock" : lowStock ? `${product.stock} left!` : `${product.stock} in stock`}
          </span>
          <div>
            <button type="button" aria-label={`Edit ${product.name}`} onClick={onEdit}>
              <Pencil size={17} strokeWidth={2.4} />
            </button>
            <button type="button" aria-label={`Hapus ${product.name}`} onClick={onDelete}>
              <Trash2 size={17} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function SellerProductFormPage({ categories, error, isSaving, onCancel, onSubmit }) {
  return (
    <section className="seller-product-form-page">
      <header className="seller-form-hero">
        <button type="button" className="seller-back-button" onClick={onCancel} disabled={isSaving}>
          <ArrowLeft size={15} strokeWidth={2.5} />
          <span>Kembali</span>
        </button>
        <div>
          <h1>Tambah Produk Baru</h1>
          <p>Bagikan produk terbarumu kepada dunia. Isi detail di bawah ini untuk menambahkannya ke tokomu.</p>
        </div>
      </header>

      <SellerProductForm
        categories={categories}
        error={error}
        isSaving={isSaving}
        submitText="Save Product"
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
      <footer className="seller-form-footer">Â© 2024 CraftyHands Studio. Crafted with love.</footer>
    </section>
  );
}

function SellerProductEditModal({ open, product, categories, error, isSaving, onClose, onSubmit }) {
  if (!open || !product) return null;

  return createPortal(
    <div
      className="seller-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section className="seller-edit-modal" role="dialog" aria-modal="true" aria-labelledby="seller-edit-title">
        <button type="button" className="seller-modal-close" onClick={onClose} aria-label="Tutup popup edit" disabled={isSaving}>
          <X size={21} strokeWidth={2.3} />
        </button>
        <div className="seller-edit-modal__head">
          <span>
            <Pencil size={22} strokeWidth={2.3} />
          </span>
          <div>
            <h2 id="seller-edit-title">Edit Produk</h2>
            <p>Perbarui detail produk langsung dari katalog tokomu.</p>
          </div>
        </div>

        <SellerProductForm
          variant="modal"
          product={product}
          categories={categories}
          error={error}
          isSaving={isSaving}
          submitText="Simpan Perubahan"
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </section>
    </div>,
    document.body
  );
}

function SellerProductForm({ variant = "page", product, categories, error, isSaving, submitText, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => buildInitialProductForm(product));
  const [previews, setPreviews] = useState(() => buildInitialImagePreviews(product));
  const fileInputRef = useRef(null);
  const previewsRef = useRef(previews);
  const isModal = variant === "modal";

  useEffect(() => {
    setForm(buildInitialProductForm(product));
    setPreviews(buildInitialImagePreviews(product));
  }, [product]);

  const updateField = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImages = (files) => {
    const nextFiles = Array.from(files || [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 4);
    if (!nextFiles.length) return;

    previews.filter((preview) => preview.local).forEach((preview) => URL.revokeObjectURL(preview.url));
    setForm((current) => ({ ...current, images: nextFiles, image: "" }));
    setPreviews(nextFiles.map((file) => ({ url: URL.createObjectURL(file), local: true })));
  };

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(
    () => () => {
      previewsRef.current.filter((preview) => preview.local).forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    []
  );

  const removePreview = (index) => {
    const preview = previews[index];
    if (preview?.local) URL.revokeObjectURL(preview.url);
    setPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className={`seller-product-form seller-product-form--${variant}`} onSubmit={handleSubmit}>
      {error && <div className="seller-form-error" role="alert">{error}</div>}

      <section className="seller-form-card seller-form-basic">
        {!isModal && <span className="seller-tape" aria-hidden="true" />}
        <h2>
          <ClipboardCheck size={24} strokeWidth={2.1} />
          <span>Informasi Dasar</span>
        </h2>
        <label className="seller-field">
          <span>Nama Produk *</span>
          <input
            type="text"
            value={form.name}
            onChange={updateField("name")}
            placeholder="e.g., Hand-Painted Ceramic Mug"
            required
          />
        </label>
        <label className="seller-field">
          <span>Deskripsi Produk *</span>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            placeholder="Ceritakan bahan, proses pembuatan, fungsi, dan detail unik produk ini."
            rows={4}
            required
          />
        </label>
        <label className="seller-field">
          <span>Kategori *</span>
          <span className="seller-select-wrap">
            <select value={form.category} onChange={updateField("category")} required>
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} strokeWidth={2.4} />
          </span>
        </label>
        <label className="seller-field">
          <span>Warna *</span>
          <input
            type="text"
            value={form.color}
            onChange={updateField("color")}
            placeholder="e.g., Natural White"
            required
          />
        </label>
        <label className="seller-field">
          <span>Material *</span>
          <input
            type="text"
            value={form.material}
            onChange={updateField("material")}
            placeholder="e.g., Keramik"
            required
          />
        </label>
        <label className="seller-field">
          <span>Ukuran / Fits *</span>
          <input
            type="text"
            value={form.fits}
            onChange={updateField("fits")}
            placeholder="e.g., 250ml / One Size"
            required
          />
        </label>
      </section>

      <section className="seller-upload-panel">
        <button
          type="button"
          className="seller-upload-trigger"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleImages(event.dataTransfer.files);
          }}
        >
          <span>
            <ImagePlus size={30} strokeWidth={2.3} />
          </span>
          <strong>Upload Foto</strong>
          <small>Drag and drop your beautifully lit photos here, or click to browse. Show off those details!</small>
          <em>JPEG, PNG up to 5MB</em>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          multiple
          hidden
          onChange={(event) => handleImages(event.target.files)}
        />
        <div className="seller-upload-previews">
          {Array.from({ length: 4 }).map((_, index) => {
            const preview = previews[index];
            return (
              <div key={index} className={`seller-upload-slot ${preview ? "has-image" : ""}`}>
                {preview && (
                  <>
                    <img src={preview.url} alt={`Preview produk ${index + 1}`} />
                    <button type="button" onClick={() => removePreview(index)} aria-label="Hapus foto">
                      <X size={14} strokeWidth={2.6} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="seller-form-pair">
        <section className="seller-form-card seller-form-card--price">
          <h2>
            <Banknote size={22} strokeWidth={2.1} />
            <span>Harga</span>
          </h2>
          <label className="seller-field seller-field--money">
            <span>Harga (Rp)</span>
            <span>
              <b>Rp</b>
              <input type="number" min="0" step="1" value={form.price} onChange={updateField("price")} placeholder="0" />
            </span>
          </label>
        </section>

        <section className="seller-form-card seller-form-card--inventory">
          <h2>
            <ClipboardCheck size={22} strokeWidth={2.1} />
            <span>Stock</span>
          </h2>
          <label className="seller-field">
            <span>Stock Quantity</span>
            <input type="number" min="0" step="1" value={form.stock} onChange={updateField("stock")} placeholder="1" />
          </label>
        </section>
      </div>

      <section className="seller-status-card">
        <div>
          <h2>Sembunyikan</h2>
          <p>Kendalikan di mana dan bagaimana produk ini muncul di toko Anda.</p>
        </div>
        <div className="seller-switches">
          <label>
            <span>Aktif</span>
            <input type="checkbox" checked={form.isActive} onChange={updateField("isActive")} />
            <i />
          </label>
        </div>
      </section>

      <div className="seller-form-actions">
        <button type="button" className="seller-discard-button" onClick={onCancel} disabled={isSaving}>
          Batalkan
        </button>
        <button type="submit" className="seller-save-button" disabled={isSaving}>
          {isSaving ? (
            <>
              <span className="seller-spinner" aria-hidden="true" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Check size={17} strokeWidth={2.5} />
              <span>{submitText}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function buildSellerDailySalesTrend(orders, fallbackPoints, periodValue) {
  const period = SELLER_TREND_PERIODS.find((item) => item.value === periodValue) || SELLER_TREND_PERIODS[0];
  const orderRows = Array.isArray(orders) ? orders : [];

  if (orderRows.length) {
    return period.days ? buildFixedDailySalesTrend(orderRows, period.days, period.value) : buildAllDailySalesTrend(orderRows);
  }

  const fallbackRows = Array.isArray(fallbackPoints) ? fallbackPoints : [];
  if (!fallbackRows.length) return [];
  const limit = period.days || fallbackRows.length;
  return fallbackRows.slice(-limit).map((point, index) => ({
    label: point.label || getFallbackDay(index),
    value: toNumber(point.value),
  }));
}

function buildFixedDailySalesTrend(orders, dayCount, periodValue) {
  const endDate = startOfLocalDay(new Date());
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (dayCount - 1));

  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      key: getLocalDateKey(date),
      label: formatDailyTrendLabel(date, periodValue),
      value: 0,
    };
  });
  const byDate = new Map(days.map((day) => [day.key, day]));

  orders.forEach((order) => {
    const date = parseDate(order.createdAt || order.date || order.orderDate);
    if (!date) return;
    const orderDate = startOfLocalDay(date);
    if (orderDate < startDate || orderDate > endDate) return;

    const bucket = byDate.get(getLocalDateKey(orderDate));
    if (bucket) bucket.value += toNumber(order.total);
  });

  return days;
}

function buildAllDailySalesTrend(orders) {
  const byDate = new Map();

  orders.forEach((order) => {
    const date = parseDate(order.createdAt || order.date || order.orderDate);
    if (!date) return;

    const key = getLocalDateKey(date);
    const current = byDate.get(key) || {
      date: startOfLocalDay(date),
      label: formatDailyTrendLabel(date, "all"),
      value: 0,
    };
    current.value += toNumber(order.total);
    byDate.set(key, current);
  });

  return Array.from(byDate.values())
    .sort((a, b) => a.date - b.date)
    .map(({ label, value }) => ({ label, value }));
}

function startOfLocalDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getLocalDateKey(value) {
  const date = startOfLocalDay(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDailyTrendLabel(value, periodValue) {
  const options = periodValue === "week" ? { weekday: "short" } : { day: "numeric", month: "short" };
  return new Intl.DateTimeFormat("id-ID", options).format(value);
}

function formatChartRupiah(value) {
  const amount = toNumber(value);
  if (Math.abs(amount) >= 1000) return `Rp${formatCompactNumber(Math.round(amount / 1000))}rb`;
  return formatRupiah(amount);
}

function SellerSalesChart({ points, isLoading }) {
  const chartPoints = Array.isArray(points)
    ? points.filter((point) => point && Number.isFinite(toNumber(point.value)))
    : [];

  if (isLoading) {
    return <div className="seller-chart seller-chart--loading" aria-label="Memuat tren penjualan" />;
  }

  if (!chartPoints.length) {
    return (
      <div className="seller-chart seller-chart--empty" role="img" aria-label="Tidak ada data tren penjualan">
        <span className="seller-chart__empty-note">Tidak ada data</span>
        <div className="seller-chart__days">
          {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      </div>
    );
  }

  const width = 620;
  const height = 280;
  const padding = 42;
  const values = chartPoints.map((point) => toNumber(point.value));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const stepX = chartPoints.length > 1 ? (width - padding * 2) / (chartPoints.length - 1) : 0;
  const coords = chartPoints.map((point, index) => ({
    ...point,
    value: values[index],
    x: chartPoints.length > 1 ? padding + stepX * index : width / 2,
    y: height - padding - ((values[index] - min) / range) * (height - padding * 2),
  }));
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="seller-chart" aria-label="Grafik tren penjualan">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" className="seller-chart__plot">
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} className="seller-chart__grid" />;
        })}
        <path d={path} className="seller-chart__line" />
        {coords.map((point) => (
          <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="8" className="seller-chart__dot" />
        ))}
      </svg>
      <div className="seller-chart__summary" aria-label="Ringkasan total penjualan per hari">
        {chartPoints.map((point) => (
          <div className="seller-chart__summary-item" key={`${point.label}-${point.value}`}>
            <span>{point.label}</span>
            <strong>{formatRupiah(point.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function SellerNotificationsDropdown({
  error,
  isLoading,
  groups,
  storeName,
  onMarkAllRead,
  onNotificationClick,
  onRefresh,
}) {
  const totalCount = groups.reduce((total, group) => total + group.items.length, 0);
  const hasUnread = groups.some((group) => group.items.some((notification) => !notification.isRead));

  return (
    <section className="seller-notification-popover" role="dialog" aria-labelledby="seller-notification-title">
      <div className="seller-notification-popover__head">
        <div className="seller-notification-popover__heading">
          <h2 id="seller-notification-title">Notifikasi</h2>
          {storeName && <span className="seller-notification-popover__store">{storeName}</span>}
        </div>
        <button type="button" onClick={onMarkAllRead} disabled={!hasUnread || isLoading}>
          Tandai semua dibaca
        </button>
      </div>

      {error && (
        <div className="seller-notification-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      <div className="seller-notification-list">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div className="seller-notification-item seller-notification-item--loading" key={index}>
              <span className="seller-skeleton seller-notification-item__icon" />
              <div>
                <span className="seller-skeleton seller-notification-item__title" />
                <span className="seller-skeleton seller-notification-item__message" />
                <span className="seller-skeleton seller-notification-item__time" />
              </div>
            </div>
          ))
        ) : totalCount ? (
          groups.map((group) => (
            <div className="seller-notification-group" key={group.productName}>
              {group.productName !== "Notifikasi lainnya" && (
                <div className="seller-notification-group__head">
                  {group.productImage ? (
                    <img src={group.productImage} alt={group.productName} />
                  ) : (
                    <span className="seller-notification-group__icon">
                      <ShoppingBag size={17} strokeWidth={2.2} />
                    </span>
                  )}
                  <span>
                    <strong>{group.productName}</strong>
                    <small>
                      {group.items.length} notifikasi
                      {group.storeName || storeName ? ` Â· ${group.storeName || storeName}` : ""}
                    </small>
                  </span>
                </div>
              )}
              {group.items.map((notification) => {
                const Icon = getSellerNotificationIcon(notification.type);
                return (
                  <button
                    type="button"
                    className={`seller-notification-item ${notification.isRead ? "" : "is-unread"}`}
                    key={notification.id}
                    onClick={() => onNotificationClick(notification)}
                  >
                    <span className={`seller-notification-item__icon seller-notification-item__icon--${notification.accent}`}>
                      {notification.product?.image ? (
                        <img src={notification.product.image} alt={notification.product.name} />
                      ) : (
                        <Icon size={23} strokeWidth={2.2} />
                      )}
                    </span>
                    <span className="seller-notification-item__body">
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <time>{notification.displayTime}</time>
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          <div className="seller-notification-empty">
            <Bell size={24} strokeWidth={2.2} />
            <span>Belum ada notifikasi.</span>
          </div>
        )}
      </div>

      <button type="button" className="seller-notification-popover__foot" onClick={onRefresh} disabled={isLoading}>
        Lihat semua notifikasi
      </button>
    </section>
  );
}

function SellerOrdersTable({ orders, isLoading }) {
  if (isLoading) {
    return (
      <div className="seller-table seller-table--loading">
        {Array.from({ length: 3 }).map((_, index) => (
          <span key={index} className="seller-skeleton seller-skeleton--row" />
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="seller-empty-orders">
        <ClipboardList size={28} strokeWidth={2.1} />
        <span>Belum ada pesanan terbaru.</span>
      </div>
    );
  }

  return (
    <div className="seller-table">
      <div className="seller-table__head">
        <span>ID Pesanan</span>
        <span>Pelanggan</span>
        <span>Barang</span>
        <span>Total</span>
        <span>Status</span>
      </div>
      {orders.map((order) => (
        <div key={order.id} className="seller-table__row">
          <strong>{order.code}</strong>
          <span className="seller-customer">
            <span className={`seller-avatar seller-avatar--${order.accent}`}>{order.initials}</span>
            <span>{order.customer}</span>
          </span>
          <span>{order.item}</span>
          <strong>{formatRupiah(order.total)}</strong>
          <span className={`seller-status seller-status--${order.statusClass}`}>{order.statusLabel}</span>
        </div>
      ))}
    </div>
  );
}

function SellerPlaceholder({ view, onBack }) {
  const titleByView = {
    orders: "Pesanan",
    reports: "Laporan",
  };

  return (
    <section className="seller-placeholder">
      <ShoppingBag size={34} strokeWidth={2.1} />
      <h1>{titleByView[view] || "Seller Center"}</h1>
      <p>Area ini siap disambungkan ke endpoint seller berikutnya.</p>
      <button type="button" onClick={onBack}>
        Kembali ke Dashboard
      </button>
    </section>
  );
}

function SellerStoreProfilePage({ store, isLoading, isSaving, error, status, onRefresh, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => buildInitialStoreForm(store));
  const [tagInput, setTagInput] = useState("");
  const [logoPreview, setLogoPreview] = useState(() => ({ url: store.logo, local: false }));
  const [bannerPreview, setBannerPreview] = useState(() => ({ url: store.banner, local: false }));
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const logoPreviewRef = useRef(logoPreview);
  const bannerPreviewRef = useRef(bannerPreview);

  useEffect(() => {
    setForm(buildInitialStoreForm(store));
    setLogoPreview((current) => {
      if (current.local) URL.revokeObjectURL(current.url);
      return { url: store.logo, local: false };
    });
    setBannerPreview((current) => {
      if (current.local) URL.revokeObjectURL(current.url);
      return { url: store.banner, local: false };
    });
  }, [store]);

  useEffect(() => {
    logoPreviewRef.current = logoPreview;
  }, [logoPreview]);

  useEffect(() => {
    bannerPreviewRef.current = bannerPreview;
  }, [bannerPreview]);

  useEffect(
    () => () => {
      if (logoPreviewRef.current.local) URL.revokeObjectURL(logoPreviewRef.current.url);
      if (bannerPreviewRef.current.local) URL.revokeObjectURL(bannerPreviewRef.current.url);
    },
    []
  );

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleImage = (field, file, setPreview) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPreview((current) => {
      if (current.local) URL.revokeObjectURL(current.url);
      return { url: URL.createObjectURL(file), local: true };
    });
    setForm((current) => ({ ...current, [field]: file }));
  };

  const addTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag) return;
    setForm((current) => {
      if (current.tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) return current;
      return { ...current, tags: [...current.tags, nextTag] };
    });
    setTagInput("");
  };

  const removeTag = (tag) => {
    setForm((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <section className="seller-store-profile-page">
      <header className="seller-store-profile-hero">
        <div>
          <h1>Pengaturan Profil Toko</h1>
        </div>
        <div className="seller-store-profile-actions">
          <button type="button" className="seller-store-cancel" onClick={onCancel} disabled={isSaving}>
            Batal
          </button>
          <button type="submit" form="seller-store-profile-form" className="seller-store-save" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </header>

      {error && (
        <section className="seller-alert seller-alert--store" role="alert">
          <strong>Profil toko belum bisa diproses.</strong>
          <span>{error}</span>
          <button type="button" onClick={onRefresh} disabled={isLoading || isSaving}>
            Coba lagi
          </button>
        </section>
      )}

      {status && (
        <div className="seller-store-success" role="status">
          <Check size={17} strokeWidth={2.4} />
          <span>{status}</span>
        </div>
      )}

      <form id="seller-store-profile-form" className="seller-store-profile-grid" onSubmit={handleSubmit}>
        <section className="seller-store-card seller-store-card--identity">
          <h2>Identitas Toko</h2>
          <button
            type="button"
            className="seller-store-avatar-picker"
            onClick={() => logoInputRef.current?.click()}
            disabled={isSaving}
            aria-label="Ubah foto profil toko"
          >
            {logoPreview.url ? <img src={logoPreview.url} alt="" /> : <Store size={34} strokeWidth={2.2} />}
          </button>
          <button type="button" className="seller-store-photo-text" onClick={() => logoInputRef.current?.click()} disabled={isSaving}>
            Ubah Foto Profil
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            hidden
            onChange={(event) => handleImage("logoFile", event.target.files?.[0], setLogoPreview)}
          />

          <label className="seller-field">
            <span>Nama Toko</span>
            <input type="text" value={form.storeName} onChange={updateField("storeName")} required disabled={isSaving} />
          </label>
          <label className="seller-field">
            <span>Tagline</span>
            <input type="text" value={form.tagline} onChange={updateField("tagline")} disabled={isSaving} />
          </label>
          <label className="seller-field seller-store-location-field">
            <span>Lokasi</span>
            <span>
              <MapPin size={18} strokeWidth={2.1} />
              <input type="text" value={form.location} onChange={updateField("location")} disabled={isSaving} />
            </span>
          </label>
        </section>

        <div className="seller-store-profile-main">
          <section className="seller-store-card seller-store-card--banner">
            <h2>Banner Toko</h2>
            <button
              type="button"
              className="seller-store-banner-picker"
              onClick={() => bannerInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleImage("bannerFile", event.dataTransfer.files?.[0], setBannerPreview);
              }}
              disabled={isSaving}
              aria-label="Ubah banner toko"
            >
              {bannerPreview.url ? (
                <img src={bannerPreview.url} alt="" />
              ) : (
                <span>
                  <ImagePlus size={28} strokeWidth={2.2} />
                  Pilih banner toko
                </span>
              )}
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              hidden
              onChange={(event) => handleImage("bannerFile", event.target.files?.[0], setBannerPreview)}
            />
          </section>

          <section className="seller-store-card seller-store-card--description">
            <h2>Deskripsi</h2>
            <label className="sr-only" htmlFor="seller-store-description">
              Deskripsi toko
            </label>
            <textarea
              id="seller-store-description"
              value={form.description}
              onChange={updateField("description")}
              disabled={isSaving}
              rows={5}
            />
          </section>

          <div className="seller-store-profile-bottom">
            <section className="seller-store-card seller-store-card--policy">
              <h2>Kebijakan Toko</h2>
              <label className="seller-field">
                <span>Pengiriman</span>
                <input type="text" value={form.shippingPolicy} onChange={updateField("shippingPolicy")} disabled={isSaving} />
              </label>
              <label className="seller-field">
                <span>Retur</span>
                <textarea value={form.returnPolicy} onChange={updateField("returnPolicy")} disabled={isSaving} rows={3} />
              </label>
              <label className="seller-field">
                <span>Komisi / Custom</span>
                <input type="text" value={form.customPolicy} onChange={updateField("customPolicy")} disabled={isSaving} />
              </label>
            </section>

            <section className="seller-store-card seller-store-card--tags">
              <h2>Kategori &amp; Tag</h2>
              <div className="seller-store-tags">
                {form.tags.map((tag, index) => (
                  <button
                    key={`${tag}-${index}`}
                    type="button"
                    className={`seller-store-tag seller-store-tag--${index % 3}`}
                    onClick={() => removeTag(tag)}
                    disabled={isSaving}
                    aria-label={`Hapus tag ${tag}`}
                  >
                    {tag} <X size={13} strokeWidth={2.8} />
                  </button>
                ))}
              </div>
              <div className="seller-store-tag-input">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Tambah tag baru..."
                  disabled={isSaving}
                />
                <button type="button" onClick={addTag} disabled={isSaving || !tagInput.trim()} aria-label="Tambah tag">
                  <Plus size={24} strokeWidth={2.4} />
                </button>
              </div>
              <p>Gunakan tag spesifik agar pembeli mudah menemukan produk Anda.</p>
            </section>
          </div>
        </div>
      </form>
    </section>
  );
}

export {
  SellerDashboardHome,
  SellerOrdersPage,
  SellerOrderCard,
  SellerOrderDetailPage,
  SellerOrderStatusSelect,
  SellerProductsPage,
  SellerProductCard,
  SellerProductFormPage,
  SellerProductEditModal,
  SellerProductForm,
  SellerSalesChart,
  SellerNotificationsDropdown,
  SellerOrdersTable,
  SellerPlaceholder,
  SellerStoreProfilePage,
  ReceiptIcon
};
