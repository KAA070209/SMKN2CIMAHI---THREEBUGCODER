import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
Banknote,
  BarChart3,
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
  createNotificationsSocket,
  createSellerProduct,
  deleteSellerProduct,
  fetchProductCategories,
  fetchSellerDashboardSummary,
  fetchSellerNotifications,
  fetchSellerOrders,
  fetchSellerProducts,
  fetchSellerStore,
  fetchSellerUnreadNotificationCount,
  markSellerNotificationRead,
  markSellerNotificationsReadAll,
  resolveApiUrl,
  updateSellerStore,
  updateSellerOrderStatus,
  updateSellerProduct,
} from "../lib/userApi.js";
import { getStoredAuthUser } from "../lib/authApi.js";
import "./SellerDashboard.css";
import { ConfirmDialog } from "./ConfirmDialog.jsx";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  { label: "Produk Saya", icon: ShoppingBag, view: "products" },
  { label: "Pesanan", icon: ClipboardList, view: "orders" },
];

const metricCards = [
  {
    key: "totalSales",
    label: "TOTAL PENJUALAN",
    icon: ReceiptIcon,
    accent: "pink",
    formatter: formatRupiah,
    detailKey: "salesChange",
  },
  {
    key: "newOrders",
    label: "PESANAN BARU",
    icon: ShoppingCart,
    accent: "blue",
    formatter: formatCompactNumber,
    detailKey: "ordersDetail",
  },
  {
    key: "activeProducts",
    label: "PRODUK AKTIF",
    icon: PackageCheck,
    accent: "gold",
    formatter: formatCompactNumber,
    detailKey: "productsDetail",
  },
];

const FALLBACK_CATEGORIES = ["Keramik", "Tekstil", "Planters", "Batik", "Anyaman", "Dekorasi", "Aksesoris"];
const SELLER_BLOB_PATH =
  "M50,5 C65,4 83,13 89,27 C95,41 92,52 95,65 C98,82 84,95 66,93 C52,92 47,99 32,94 C17,89 5,77 7,59 C9,43 1,34 10,21 C19,8 35,9 50,5 Z";

const EMPTY_PRODUCT_FORM = {
  name: "",
  description: "",
  category: "",
  price: "",
  stock: "1",
  color: "",
  material: "",
  fits: "",
  image: "",
  images: [],
  isActive: true,
};

const EMPTY_STORE_FORM = {
  storeName: "",
  tagline: "",
  location: "",
  description: "",
  shippingPolicy: "",
  returnPolicy: "",
  customPolicy: "",
  logo: "",
  banner: "",
  logoFile: null,
  bannerFile: null,
  tags: [],
};

const ORDER_FILTERS = [
  { label: "All", value: "all" },
  { label: "Diproses", value: "processing" },
  { label: "Dikirim", value: "shipped" },
  { label: "Selesai", value: "selesai" },
  { label: "Dibatalkan", value: "cancelled" },
];

const ORDER_STATUS_OPTIONS = ORDER_FILTERS.filter((item) => item.value !== "all");

export function SellerDashboard({ onLogout, onGoHome }) {
  const [summaryRaw, setSummaryRaw] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [rawStore, setRawStore] = useState(null);
  const [isStoreLoading, setIsStoreLoading] = useState(true);
  const [storeError, setStoreError] = useState("");
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [storeSaveStatus, setStoreSaveStatus] = useState("");
  const [rawProducts, setRawProducts] = useState([]);
  const [rawCategories, setRawCategories] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua Produk");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [rawOrders, setRawOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);
  const [orderStatusError, setOrderStatusError] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [rawNotifications, setRawNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const notificationRef = useRef(null);

  const sellerUser = useMemo(() => buildSellerUser(getStoredAuthUser()), []);
  const summary = useMemo(() => normalizeSellerSummary(summaryRaw, sellerUser), [summaryRaw, sellerUser]);
  const storeProfile = useMemo(() => normalizeSellerStore(rawStore, sellerUser, summary), [rawStore, sellerUser, summary]);
  const categoryNameById = useMemo(() => buildCategoryNameMap(rawCategories), [rawCategories]);
  const products = useMemo(() => normalizeSellerProducts(rawProducts, categoryNameById), [rawProducts, categoryNameById]);
  const categories = useMemo(() => buildCategoryOptions(rawCategories, products), [rawCategories, products]);
  const orders = useMemo(() => normalizeSellerOrders(rawOrders, { limit: 1000 }), [rawOrders]);
  const notifications = useMemo(() => normalizeSellerNotifications(rawNotifications), [rawNotifications]);
  const notificationGroups = useMemo(() => groupSellerNotifications(notifications), [notifications]);
  const visibleProducts = useMemo(
    () => filterSellerProducts(products, productQuery, categoryFilter),
    [products, productQuery, categoryFilter]
  );
  const visibleOrders = useMemo(
    () => filterSellerOrders(orders, orderQuery, orderFilter),
    [orders, orderQuery, orderFilter]
  );
  const selectedOrder = useMemo(
    () => orders.find((order) => String(order.id) === String(selectedOrderId)) || null,
    [orders, selectedOrderId]
  );

  const loadSummary = useCallback(async (signal) => {
    setIsLoading(true);
    setError("");

    try {
      const data = await fetchSellerDashboardSummary({ signal });
      setSummaryRaw(data);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard seller.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async (signal) => {
    setIsProductsLoading(true);
    setProductsError("");

    try {
      const data = await fetchSellerProducts({ signal });
      setRawProducts(data);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setProductsError(err instanceof Error ? err.message : "Gagal memuat produk seller.");
      setRawProducts([]);
    } finally {
      if (!signal?.aborted) setIsProductsLoading(false);
    }
  }, []);

  const loadStore = useCallback(async (signal) => {
    setIsStoreLoading(true);
    setStoreError("");

    try {
      const data = await fetchSellerStore({ signal });
      setRawStore(data);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setStoreError(err instanceof Error ? err.message : "Gagal memuat profil toko.");
    } finally {
      if (!signal?.aborted) setIsStoreLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async (signal) => {
    try {
      const data = await fetchProductCategories({ signal });
      setRawCategories(data);
    } catch {
      setRawCategories([]);
    }
  }, []);

  const loadOrders = useCallback(async (signal) => {
    setIsOrdersLoading(true);
    setOrdersError("");

    try {
      const data = await fetchSellerOrders({ signal });
      setRawOrders(data);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setOrdersError(err instanceof Error ? err.message : "Gagal memuat pesanan seller.");
      setRawOrders([]);
    } finally {
      if (!signal?.aborted) setIsOrdersLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async (signal) => {
    setIsNotificationsLoading(true);
    setNotificationsError("");

    try {
      const [notificationsResult, unreadResult] = await Promise.allSettled([
        fetchSellerNotifications({ signal }),
        fetchSellerUnreadNotificationCount({ signal }),
      ]);

      if (notificationsResult.status === "fulfilled") {
        setRawNotifications(extractSellerNotifications(notificationsResult.value));
      } else if (notificationsResult.reason?.name !== "AbortError") {
        setNotificationsError(
          notificationsResult.reason instanceof Error
            ? notificationsResult.reason.message
            : "Gagal memuat notifikasi."
        );
      }

      if (unreadResult.status === "fulfilled") {
        setUnreadNotifications(extractSellerUnreadCount(unreadResult.value) ?? countSellerUnreadNotifications(notificationsResult.value));
      } else if (unreadResult.reason?.name !== "AbortError") {
        setUnreadNotifications((count) => count || countSellerUnreadNotifications(notificationsResult.value));
      }
    } finally {
      if (!signal?.aborted) setIsNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadSummary(controller.signal);
    loadStore(controller.signal);
    loadProducts(controller.signal);
    loadCategories(controller.signal);
    loadOrders(controller.signal);
    loadNotifications(controller.signal);
    return () => controller.abort();
  }, [loadCategories, loadNotifications, loadOrders, loadProducts, loadStore, loadSummary]);

  useEffect(() => {
    if (typeof WebSocket === "undefined") return undefined;

    let socket = null;
    let reconnectTimer = 0;
    let didClose = false;

    const connect = () => {
      try {
        socket = createNotificationsSocket();
      } catch {
        return;
      }

      socket.onmessage = (event) => {
        let payload = event.data;
        try {
          payload = JSON.parse(event.data);
        } catch {
          payload = { message: event.data };
        }

        const incoming = extractSellerNotifications(payload);
        const nextUnread = extractSellerUnreadCount(payload);

        if (incoming.length) {
          setRawNotifications((items) => mergeSellerNotifications(incoming, items));
          setUnreadNotifications((count) => nextUnread ?? count + incoming.filter((item) => !isSellerNotificationRead(item)).length);
          return;
        }

        if (nextUnread !== null) {
          setUnreadNotifications(nextUnread);
          return;
        }

        loadNotifications();
      };

      socket.onclose = () => {
        if (didClose) return;
        reconnectTimer = window.setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      didClose = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;

    const closeNotifications = (event) => {
      if (event.key === "Escape" || event.keyCode === 27) {
        setIsNotificationsOpen(false);
        return;
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeNotifications);
    document.addEventListener("keydown", closeNotifications);
    return () => {
      document.removeEventListener("mousedown", closeNotifications);
      document.removeEventListener("keydown", closeNotifications);
    };
  }, [isNotificationsOpen]);

  const handleNav = (view) => {
    setActiveView(view);
    setIsMobileNavOpen(false);
    setProductFormError("");
    setProductsError("");
    setOrdersError("");
    setOrderStatusError("");
    setStoreError("");
    setStoreSaveStatus("");
    setEditingProduct(null);
    if (view !== "orders") {
      setSelectedOrderId(null);
    }
    if (view !== "dashboard") {
      setError("");
    }
  };

  const handleOpenCreateProduct = () => {
    setProductFormError("");
    setEditingProduct(null);
    setIsMobileNavOpen(false);
    setActiveView("createProduct");
  };

  const handleCreateProduct = async (formValues) => {
    setIsSavingProduct(true);
    setProductFormError("");

    try {
      await createSellerProduct(buildSellerProductPayload(formValues));
      setActiveView("products");
      await loadProducts();
    } catch (err) {
      setProductFormError(err instanceof Error ? err.message : "Gagal menambahkan produk.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleUpdateProduct = async (formValues) => {
    if (!editingProduct) return;
    setIsSavingProduct(true);
    setProductFormError("");

    try {
      await updateSellerProduct(editingProduct.id, buildSellerProductPayload(formValues));
      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      setProductFormError(err instanceof Error ? err.message : "Gagal memperbarui produk.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsDeletingProduct(true);
    setProductsError("");

    try {
      await deleteSellerProduct(deletingProduct.id);
      setDeletingProduct(null);
      await loadProducts();
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : "Gagal menghapus produk.");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    setIsUpdatingOrderStatus(true);
    setOrderStatusError("");

    try {
      await updateSellerOrderStatus(orderId, { status: toApiOrderStatus(status) });
      await loadOrders();
      await loadSummary();
    } catch (err) {
      setOrderStatusError(err instanceof Error ? err.message : "Gagal memperbarui status pesanan.");
    } finally {
      setIsUpdatingOrderStatus(false);
    }
  };

  const handleToggleNotifications = useCallback(() => {
    setIsNotificationsOpen((open) => {
      const nextOpen = !open;
      if (nextOpen && !rawNotifications.length) {
        loadNotifications();
      }
      return nextOpen;
    });
  }, [loadNotifications, rawNotifications.length]);

  const handleMarkNotificationRead = useCallback(async (notification) => {
    if (!notification?.apiId || notification.isRead) return;

    setRawNotifications((items) =>
      items.map((item) =>
        getSellerNotificationId(item) === notification.apiId ? { ...item, is_read: true, isRead: true, read_at: new Date().toISOString() } : item
      )
    );
    setUnreadNotifications((count) => Math.max(0, count - 1));

    try {
      await markSellerNotificationRead(notification.apiId);
    } catch (err) {
      setNotificationsError(err instanceof Error ? err.message : "Gagal menandai notifikasi dibaca.");
      loadNotifications();
    }
  }, [loadNotifications]);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (!notifications.length) return;

    setRawNotifications((items) => items.map((item) => ({ ...item, is_read: true, isRead: true, read_at: item.read_at || new Date().toISOString() })));
    setUnreadNotifications(0);

    try {
      await markSellerNotificationsReadAll();
    } catch (err) {
      setNotificationsError(err instanceof Error ? err.message : "Gagal menandai semua notifikasi dibaca.");
      loadNotifications();
    }
  }, [loadNotifications, notifications.length]);

  const handleUpdateStore = async (formValues) => {
    setIsSavingStore(true);
    setStoreError("");
    setStoreSaveStatus("");

    try {
      await updateSellerStore(buildSellerStorePayload(formValues));
      setStoreSaveStatus("Perubahan profil toko berhasil disimpan.");
      await Promise.all([loadStore(), loadSummary()]);
    } catch (err) {
      setStoreError(err instanceof Error ? err.message : "Gagal menyimpan profil toko.");
    } finally {
      setIsSavingStore(false);
    }
  };

  return (
    <main className={`seller-shell ${isMobileNavOpen ? "seller-shell--nav-open" : ""}`}>
      <aside className="seller-sidebar" aria-label="Navigasi seller">
        <div className="seller-sidebar__top">
          <button type="button" className="seller-brand" onClick={onGoHome}>
            <span className="seller-brand__logo">
              {storeProfile.logo ? <img src={storeProfile.logo} alt="" /> : <Store size={21} strokeWidth={2.4} />}
            </span>
            <span>
              <strong>{storeProfile.storeName}</strong>
              <small>{storeProfile.tagline || summary.roleLabel}</small>
            </span>
          </button>
          <button
            type="button"
            className="seller-mobile-nav-toggle"
            aria-label={isMobileNavOpen ? "Tutup navigasi seller" : "Buka navigasi seller"}
            aria-expanded={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen((open) => !open)}
          >
            {isMobileNavOpen ? <X size={21} strokeWidth={2.4} /> : <Menu size={21} strokeWidth={2.4} />}
          </button>
        </div>

        <div className="seller-sidebar__menu">
          <button
            type="button"
            className={`seller-profile-button ${activeView === "profile" ? "is-active" : ""}`}
            onClick={() => handleNav("profile")}
          >
            Profil Saya
          </button>

          <nav className="seller-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeView === item.view || (item.view === "products" && (activeView === "createProduct" || editingProduct));
              return (
                <button
                  key={item.view}
                  type="button"
                  className={`seller-nav__item ${isActive ? "is-active" : ""}`}
                  onClick={() => handleNav(item.view)}
                >
                  <Icon size={20} strokeWidth={2.2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="seller-sidebar__bottom">
            <button type="button" className="seller-add-product" onClick={handleOpenCreateProduct}>
              <Plus size={17} strokeWidth={2.5} />
              <span>Tambah Product</span>
            </button>
            <button type="button" className="seller-nav__item" onClick={() => setIsMobileNavOpen(false)}>
              <UserRound size={20} strokeWidth={2.1} />
              <span>Support</span>
            </button>
            <button type="button" className="seller-logout" onClick={() => setLogoutConfirmOpen(true)}>
              <LogOut size={18} strokeWidth={2.2} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      <section className={`seller-main ${activeView === "createProduct" ? "seller-main--form" : ""}`}>
        {activeView === "dashboard" ? (
          <SellerDashboardHome
            summary={summary}
            isLoading={isLoading}
            error={error}
            onRefresh={() => loadSummary()}
          />
        ) : activeView === "products" ? (
          <SellerProductsPage
            products={visibleProducts}
            allProducts={products}
            categories={categories}
            isLoading={isProductsLoading}
            error={productsError}
            query={productQuery}
            filter={categoryFilter}
            onQueryChange={setProductQuery}
            onFilterChange={setCategoryFilter}
            onRefresh={() => loadProducts()}
            onAdd={handleOpenCreateProduct}
            onEdit={(product) => {
              setProductFormError("");
              setEditingProduct(product);
            }}
            onDelete={setDeletingProduct}
          />
        ) : activeView === "orders" ? (
          <SellerOrdersPage
            orders={visibleOrders}
            allOrders={orders}
            selectedOrder={selectedOrder}
            isLoading={isOrdersLoading}
            error={ordersError}
            statusError={orderStatusError}
            query={orderQuery}
            filter={orderFilter}
            isUpdatingStatus={isUpdatingOrderStatus}
            onQueryChange={setOrderQuery}
            onFilterChange={setOrderFilter}
            onRefresh={() => loadOrders()}
            onSelectOrder={(order) => {
              setOrderStatusError("");
              setSelectedOrderId(order.id);
            }}
            onBackToList={() => {
              setOrderStatusError("");
              setSelectedOrderId(null);
            }}
            onStatusChange={handleUpdateOrderStatus}
          />
        ) : activeView === "profile" ? (
          <SellerStoreProfilePage
            store={storeProfile}
            isLoading={isStoreLoading}
            isSaving={isSavingStore}
            error={storeError}
            status={storeSaveStatus}
            onRefresh={() => loadStore()}
            onCancel={() => {
              setStoreError("");
              setStoreSaveStatus("");
              setActiveView("dashboard");
            }}
            onSubmit={handleUpdateStore}
          />
        ) : activeView === "createProduct" ? (
          <SellerProductFormPage
            categories={categories}
            error={productFormError}
            isSaving={isSavingProduct}
            onCancel={() => {
              setProductFormError("");
              setActiveView("products");
            }}
            onSubmit={handleCreateProduct}
          />
        ) : (
          <SellerPlaceholder view={activeView} onBack={() => setActiveView("dashboard")} />
        )}
      </section>

      <div className="seller-notifications" ref={notificationRef}>
        <button
          type="button"
          className="seller-notification-button"
          aria-label="Notifikasi"
          aria-haspopup="dialog"
          aria-expanded={isNotificationsOpen}
          onClick={handleToggleNotifications}
        >
          <Bell size={21} strokeWidth={2.3} />
          {unreadNotifications > 0 && (
            <span className="seller-notification-badge">{formatBadgeCount(unreadNotifications)}</span>
          )}
        </button>
        {isNotificationsOpen && (
          <SellerNotificationsDropdown
            error={notificationsError}
            isLoading={isNotificationsLoading}
            groups={notificationGroups}
            storeName={storeProfile.storeName}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onNotificationClick={handleMarkNotificationRead}
            onRefresh={() => loadNotifications()}
          />
        )}
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          onLogout?.();
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />

      <SellerProductEditModal
        open={Boolean(editingProduct)}
        product={editingProduct}
        categories={categories}
        error={productFormError}
        isSaving={isSavingProduct}
        onClose={() => {
          if (isSavingProduct) return;
          setEditingProduct(null);
          setProductFormError("");
        }}
        onSubmit={handleUpdateProduct}
      />

      <ConfirmDialog
        open={Boolean(deletingProduct)}
        title="Hapus produk ini?"
        message={`Produk "${deletingProduct?.name || "ini"}" akan dihapus dari tokomu. Tindakan ini tidak bisa dibatalkan.`}
        confirmText={isDeletingProduct ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => {
          if (!isDeletingProduct) setDeletingProduct(null);
        }}
      />
    </main>
  );
}

function SellerDashboardHome({ summary, isLoading, error, onRefresh }) {
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
          <div className="seller-card-head">
            <h2>Tren Penjualan</h2>
            <button type="button" className="seller-period">
              <span>Mingguan</span>
              <ChevronDown size={15} strokeWidth={2.4} />
            </button>
          </div>
          <SellerSalesChart points={summary.salesTrend} isLoading={isLoading} />
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
                <span>Payment Summary</span>
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
            <span>Price</span>
          </h2>
          <label className="seller-field seller-field--money">
            <span>Price (Rp)</span>
            <span>
              <b>Rp</b>
              <input type="number" min="0" step="1" value={form.price} onChange={updateField("price")} placeholder="0" />
            </span>
          </label>
        </section>

        <section className="seller-form-card seller-form-card--inventory">
          <h2>
            <ClipboardCheck size={22} strokeWidth={2.1} />
            <span>Inventory</span>
          </h2>
          <label className="seller-field">
            <span>Stock Quantity</span>
            <input type="number" min="0" step="1" value={form.stock} onChange={updateField("stock")} placeholder="1" />
          </label>
        </section>
      </div>

      <section className="seller-status-card">
        <div>
          <h2>Visibility & Status</h2>
          <p>Control where and how this product appears in your shop.</p>
        </div>
        <div className="seller-switches">
          <label>
            <span>Active Listing</span>
            <input type="checkbox" checked={form.isActive} onChange={updateField("isActive")} />
            <i />
          </label>
        </div>
      </section>

      <div className="seller-form-actions">
        <button type="button" className="seller-discard-button" onClick={onCancel} disabled={isSaving}>
          Discard Draft
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

function SellerSalesChart({ points, isLoading }) {
  if (isLoading) {
    return <div className="seller-chart seller-chart--loading" aria-label="Memuat tren penjualan" />;
  }

  if (!points.length) {
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
  const height = 300;
  const padding = 38;
  const max = Math.max(...points.map((point) => point.value), 1);
  const min = Math.min(...points.map((point) => point.value), 0);
  const range = Math.max(max - min, 1);
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => ({
    ...point,
    x: points.length > 1 ? padding + stepX * index : width / 2,
    y: height - padding - ((point.value - min) / range) * (height - padding * 2),
  }));
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="seller-chart" aria-label="Grafik tren penjualan">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} className="seller-chart__grid" />;
        })}
        <path d={path} className="seller-chart__line" />
        {coords.map((point) => (
          <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="8" className="seller-chart__dot" />
        ))}
        {coords.map((point) => (
          <text key={`${point.label}-label`} x={point.x} y={height - 8} textAnchor="middle" className="seller-chart__label">
            {point.label}
          </text>
        ))}
      </svg>
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

function buildInitialStoreForm(store) {
  if (!store) return { ...EMPTY_STORE_FORM };
  return {
    storeName: store.storeName || "",
    tagline: store.tagline || "",
    location: store.location || "",
    description: store.description || "",
    shippingPolicy: store.shippingPolicy || "",
    returnPolicy: store.returnPolicy || "",
    customPolicy: store.customPolicy || "",
    logo: store.logo || "",
    banner: store.banner || "",
    logoFile: null,
    bannerFile: null,
    tags: store.tags?.length ? [...store.tags] : [],
  };
}

function buildSellerStorePayload(form) {
  const payload = {
    store_name: form.storeName.trim(),
    tagline: form.tagline.trim(),
    address: form.location.trim(),
    description: form.description.trim(),
    shipping_policy: form.shippingPolicy.trim(),
    return_policy: form.returnPolicy.trim(),
    custom_policy: form.customPolicy.trim(),
    tags: JSON.stringify(form.tags || []),
  };

  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) data.append(key, value);
  });

  if (form.logoFile) {
    data.append("logo", form.logoFile);
  } else if (form.logo) {
    data.append("logo_url", form.logo);
  }

  if (form.bannerFile) {
    data.append("banner", form.bannerFile);
  } else if (form.banner) {
    data.append("banner_url", form.banner);
  }

  return data;
}

function buildInitialProductForm(product) {
  if (!product) return { ...EMPTY_PRODUCT_FORM };
  return {
    name: product.name || "",
    description: product.description || product.deskripsi || product.product_description || "",
    category: product.categoryId || "",
    price: product.price || "",
    stock: product.stock ?? "0",
    color: product.color || "",
    material: product.material || "",
    fits: product.fits || "",
    image: typeof product.image === "string" ? product.image : "",
    images: [],
    isActive: product.isActive ?? true,
  };
}

function buildInitialImagePreviews(product) {
  if (!product?.image || typeof product.image !== "string") return [];
  return [{ url: product.image, local: false }];
}

function buildSellerProductPayload(form) {
  const payload = {
    name: form.name.trim(),
    description: form.description.trim(),
    price: toNumber(form.price),
    stock: toNumber(form.stock),
    color: form.color.trim(),
    material: form.material.trim(),
    fits: form.fits.trim(),
    category_id: form.category,
    is_active: form.isActive,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "" || payload[key] === undefined || payload[key] === null) delete payload[key];
  });

  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => data.append(key, value));
  if (form.images && form.images.length) {
    form.images.forEach((image, index) => {
      data.append(index === 0 ? "image" : "images", image);
    });
  } else if (form.image) {
    data.append("image", form.image.trim());
  }
  return data;
}

function normalizeSellerStore(raw, user, summary = {}) {
  const store = extractSellerStoreRecord(raw);
  const policies = store.policies || store.policy || store.kebijakan || {};
  const fallbackDescription =
    "Kami memulai CraftyHands Studio dengan satu tujuan: membawa kembali sentuhan manusiawi ke dalam barang-barang sehari-hari.";

  return {
    storeName:
      store.store_name ||
      store.storeName ||
      store.name ||
      store.shop_name ||
      store.shopName ||
      summary.storeName ||
      user.storeName ||
      "CraftyHands Studio",
    tagline:
      store.tagline ||
      store.role_label ||
      store.roleLabel ||
      store.subtitle ||
      summary.roleLabel ||
      user.roleLabel ||
      "Master Crafter",
    location:
      store.location ||
      store.address ||
      store.alamat ||
      store.city ||
      store.kota ||
      "Portland, OR",
    description: store.description || store.deskripsi || store.bio || fallbackDescription,
    logo: resolveApiUrl(
      store.logo ||
        store.logo_url ||
        store.logoUrl ||
        store.avatar ||
        store.photo ||
        store.photo_url ||
        store.photoUrl ||
        summary.logo ||
        user.avatar
    ),
    banner:
      resolveApiUrl(
        store.banner ||
          store.banner_url ||
          store.bannerUrl ||
          store.cover ||
          store.cover_url ||
          store.coverUrl ||
          store.hero_image ||
          store.heroImage
      ) || "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?q=80&w=1400&auto=format&fit=crop",
    shippingPolicy:
      store.shipping_policy ||
      store.shippingPolicy ||
      policies.shipping ||
      policies.shipping_policy ||
      "3-5 Hari Kerja (Reguler)",
    returnPolicy:
      store.return_policy ||
      store.returnPolicy ||
      policies.return ||
      policies.return_policy ||
      "Diterima dalam 14 hari, kondisi utuh.",
    customPolicy:
      store.custom_policy ||
      store.customPolicy ||
      store.commission_policy ||
      store.commissionPolicy ||
      policies.custom ||
      policies.custom_policy ||
      "Sedang ditutup bulan ini.",
    tags: normalizeStoreTags(store.tags || store.categories || store.category_tags || store.categoryTags || store.labels),
  };
}

function extractSellerStoreRecord(raw) {
  const candidates = [
    raw?.data?.store,
    raw?.data?.shop,
    raw?.data?.seller,
    raw?.data?.profile,
    raw?.store,
    raw?.shop,
    raw?.seller,
    raw?.profile,
    raw?.data?.data?.store,
    raw?.data?.data,
    raw?.data,
    raw?.result?.store,
    raw?.result?.data,
    raw?.result,
    raw?.payload?.store,
    raw?.payload?.data,
    raw?.payload,
    raw,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) return candidate;
  }
  return {};
}

function normalizeStoreTags(source) {
  let parsed = source;
  if (typeof parsed === "string") {
    try {
      const value = JSON.parse(parsed);
      if (Array.isArray(value)) parsed = value;
    } catch {
      parsed = parsed ? [parsed] : [];
    }
  }
  const rows = Array.isArray(parsed) ? parsed : extractCollection(parsed, ["tags", "categories", "items", "list", "data"]);
  const tags = rows
    .map((tag) => {
      if (typeof tag === "string") return tag;
      return tag?.name || tag?.title || tag?.label || tag?.tag || "";
    })
    .map((tag) => String(tag).trim())
    .filter(Boolean);

  const unique = [];
  tags.forEach((tag) => {
    if (!unique.some((item) => item.toLowerCase() === tag.toLowerCase())) unique.push(tag);
  });

  return unique.length ? unique : ["Ceramics", "Small Batch", "Handmade"];
}

function normalizeSellerSummary(raw, user) {
  const payload = raw?.data?.summary || raw?.data?.dashboard || raw?.data || raw?.summary || raw?.dashboard || raw || {};
  const stats = payload.stats || payload.metrics || payload.summary || {};
  const seller = payload.seller || payload.store || payload.shop || payload.profile || {};
  const storeName =
    seller.store_name ||
    seller.storeName ||
    seller.name ||
    payload.store_name ||
    payload.storeName ||
    user.storeName ||
    "CraftyHands Studio";
  const firstName = (user.name || seller.owner_name || seller.ownerName || storeName || "Maker").split(" ")[0] || "Maker";
  const pendingOrders = pickNumber(payload, stats, ["pendingOrders", "pending_orders", "ordersPending", "orders_pending"]);
  const activeProducts = pickNumber(payload, stats, [
    "activeProducts",
    "active_products",
    "productActive",
    "productsActive",
    "products_active",
    "totalProducts",
    "total_products",
    "produk_aktif",
  ]);
  const totalCategories = pickNumber(payload, stats, ["totalCategories", "total_categories", "categoriesCount", "categories_count"]);

  return {
    storeName,
    firstName,
    roleLabel: seller.role_label || seller.roleLabel || user.roleLabel || "Master Crafter",
    logo: resolveApiUrl(seller.logo || seller.logo_url || seller.logoUrl || payload.logo || user.avatar),
    totalSales: pickNumber(payload, stats, [
      "totalSales",
      "total_sales",
      "salesTotal",
      "sales_total",
      "revenue",
      "totalRevenue",
      "total_revenue",
      "total_penjualan",
    ]),
    newOrders: pickNumber(payload, stats, [
      "newOrders",
      "new_orders",
      "ordersToday",
      "orders_today",
      "pendingOrders",
      "pending_orders",
      "pesanan_baru",
    ]),
    activeProducts,
    salesChange: pickText(payload, stats, ["salesChange", "sales_change", "salesGrowth", "sales_growth", "revenueChange"]) || "Data terbaru",
    ordersDetail: pendingOrders ? `${formatCompactNumber(pendingOrders)} pesanan menunggu diproses` : "Tidak ada pesanan tertunda",
    productsDetail: totalCategories ? `${formatCompactNumber(totalCategories)} kategori aktif` : "Produk siap dijual",
    salesTrend: normalizeSalesTrend(
      payload.salesTrend ||
        payload.sales_trend ||
        payload.trend ||
        payload.chart ||
        stats.salesTrend ||
        stats.sales_trend ||
        []
    ),
    recentOrders: normalizeSellerOrders(
      payload.recentOrders ||
        payload.recent_orders ||
        payload.latestOrders ||
        payload.latest_orders ||
        payload.orders ||
        []
    ),
  };
}

function normalizeSalesTrend(source) {
  if (!Array.isArray(source)) return [];

  return source
    .slice(0, 8)
    .map((item, index) => {
      if (typeof item === "number" || typeof item === "string") {
        return { label: getFallbackDay(index), value: toNumber(item) };
      }

      const label =
        item.label ||
        item.day ||
        item.weekday ||
        item.date ||
        item.month ||
        getFallbackDay(index);
      const value = pickNumber(item, item.stats || item.summary || {}, [
        "value",
        "total",
        "sales",
        "revenue",
        "amount",
        "totalSales",
        "total_sales",
        "total_revenue",
      ]);

      return { label: formatTrendLabel(label, index), value };
    })
    .filter((point) => point.value > 0 || point.label);
}

function normalizeSellerOrders(source, options = {}) {
  const limit = options.limit ?? 5;
  const rows = extractCollection(source, ["orders", "order", "items", "list", "data", "results"]);
  if (!rows.length) return [];

  return rows.slice(0, limit).map((order, index) => {
    const customerSource = order.customer || order.user || order.buyer || order.customer_info || order.customerInfo || {};
    const summary = order.payment || order.summary || order.invoice || {};
    const customer =
      customerSource.name ||
      customerSource.full_name ||
      customerSource.fullName ||
      order.customer_name ||
      order.customerName ||
      order.buyer_name ||
      order.buyerName ||
      "Pelanggan";
    const status = normalizeOrderStatus(order.status || order.order_status || order.state || order.fulfillment_status || "new");
    const items = normalizeOrderItems(order, index);
    const subtotal = pickNumber(order, summary, ["subtotal", "sub_total", "items_total", "itemsTotal"]) || sumOrderItems(items);
    const shippingCost = pickNumber(order, summary, ["shipping_cost", "shippingCost", "delivery_fee", "deliveryFee", "biaya_pengiriman", "shipping", "shipping_fee"]);
    const tax = pickNumber(order, summary, ["tax", "tax_amount", "taxAmount"]);
    const total =
      pickNumber(order, summary, ["total", "grand_total", "grandTotal", "amount", "total_amount", "totalAmount"]) ||
      subtotal + shippingCost + tax;
    const createdAt = order.created_at || order.createdAt || order.order_date || order.orderDate || order.date || order.updated_at;

    return {
      id: order.id || order.uuid || order.order_id || order.orderId || order._id || index,
      code: formatOrderCode(order.code || order.order_code || order.orderNumber || order.order_number || order.invoice_number || order.id || index + 1),
      customer,
      customerEmail: customerSource.email || order.customer_email || order.customerEmail || "",
      customerPhone:
        customerSource.phone ||
        customerSource.phone_number ||
        order.customer_phone ||
        order.customerPhone ||
        order.phone ||
        order.receiver_phone ||
        (order.shipping_address && order.shipping_address.phone) ||
        "",
      shippingAddress:
        formatAddress(
          order.shipping_address ||
            order.shippingAddress ||
            order.address ||
            order.delivery_address ||
            customerSource.shipping_address ||
            customerSource.shippingAddress ||
            customerSource.address ||
            order.shipping_details ||
            ""
        ) ||
        order.shipping_address_text ||
        order.shippingAddressText ||
        order.address_text ||
        customerSource.shipping_address_text ||
        customerSource.address_text ||
        "",
      shippingRecipient:
        order.receiver_name ||
        order.recipient_name ||
        (order.shipping_address && order.shipping_address.recipient_name) ||
        (customerSource.shipping_address && customerSource.shipping_address.recipient_name) ||
        (customerSource.shippingAddress && customerSource.shippingAddress.recipient_name) ||
        "",
      initials: getInitials(customer),
      item: formatOrderItemSummary(items),
      items,
      subtotal,
      shippingCost,
      tax,
      total,
      dateLabel: formatOrderDate(createdAt),
      orderedAt: formatFullDateTime(createdAt),
      status,
      statusLabel: getStatusLabel(status),
      statusClass: getStatusClass(status),
      timeline: normalizeOrderTimeline(order, createdAt, status),
      accent: ["gold", "pink", "red", "blue"][index % 4],
    };
  });
}

function normalizeSellerProducts(source, categoryNameById) {
  return extractCollection(source, ["products", "items", "list", "data", "results"]).map((product, index) => {
    const stock = pickNumber(product, product.inventory || product.stock_detail || {}, [
      "stock",
      "stok",
      "quantity",
      "qty",
      "inventory",
      "stock_quantity",
      "stockQuantity",
    ]);
    const isActive =
      product.is_active ??
      product.isActive ??
      product.active ??
      (product.status ? String(product.status).toLowerCase() === "active" : stock > 0);
    const categoryId = product.category_id || product.category?.id || product.categoryId || "";
    const resolvedCategoryName =
      (categoryNameById && categoryNameById[categoryId]) ||
      product.category?.name ||
      product.category_name ||
      product.kategori ||
      product.type ||
      "Keramik";

    return {
      id: getProductId(product) || `seller-product-${index}`,
      name: product.name || product.title || product.product_name || product.nama_produk || "Produk Tanpa Nama",
      category: resolvedCategoryName,
      categoryId,
      price: pickNumber(product, product.pricing || {}, ["price", "harga", "selling_price", "sale_price", "amount"]),
      oldPrice: pickNumber(product, product.pricing || {}, ["old_price", "oldPrice", "original_price", "originalPrice", "compare_at_price"]),
      stock,
      description: product.description || product.deskripsi || product.product_description || "",
      image: resolveApiUrl(product.image) || getFallbackProductImage(index),
      color: product.color || "",
      material: product.material || "",
      fits: product.fits || "",
      isActive: Boolean(isActive),
    };
  });
}

function buildCategoryNameMap(rawCategories) {
  const map = {};
  extractCollection(rawCategories, ["categories", "category", "items", "list", "data"]).forEach((category) => {
    const id = category.id || category.slug;
    const name = category.name || category.title || category.category_name || category.nama_kategori;
    if (id && name) map[String(id)] = String(name);
  });
  return map;
}

function buildCategoryOptions(rawCategories, products) {
  const fromApi = extractCollection(rawCategories, ["categories", "category", "items", "list", "data"])
    .map((category) => ({
      id: category.id || category.slug || category,
      name: category.name || category.title || category.category_name || category.nama_kategori || category,
    }))
    .filter((category) => category.id && category.name)
    .map((category) => ({ id: String(category.id), name: String(category.name) }));
  const fromProducts = products
    .filter((product) => product.categoryId && product.category)
    .map((product) => ({ id: String(product.categoryId), name: String(product.category) }));
  const fallback = FALLBACK_CATEGORIES.map((name, index) => ({ id: `fallback-${index}`, name }));
  const merged = [...fromApi, ...fromProducts, ...fallback];
  const seen = new Set();
  return merged.filter((category) => {
    if (seen.has(category.id)) return false;
    seen.add(category.id);
    return true;
  });
}

function filterSellerProducts(products, query, categoryFilter) {
  const needle = query.trim().toLowerCase();
  return products.filter((product) => {
    const matchesQuery =
      !needle ||
      [product.name, product.category, product.color, product.material, product.id]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    const matchesCategory =
      categoryFilter === "Semua Produk" ||
      (categoryFilter === "Stok Menipis" ? product.stock <= 2 : product.category.toLowerCase() === categoryFilter.toLowerCase());
    return matchesQuery && matchesCategory;
  });
}

function filterSellerOrders(orders, query, statusFilter) {
  const needle = query.trim().toLowerCase();
  return orders.filter((order) => {
    const matchesQuery =
      !needle ||
      [order.code, order.customer, order.customerEmail, order.customerPhone, order.item, order.shippingAddress]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
}

function normalizeOrderItems(order, orderIndex) {
  const rawItems = extractCollection(
    order.items || order.order_items || order.orderItems || order.products || order.details,
    ["items", "order_items", "orderItems", "products", "data", "list"]
  );
  const items = rawItems.length
    ? rawItems
    : [
        {
          id: order.product_id || order.productId || order.item_id || order.itemId || `order-item-${orderIndex}`,
          name: order.product?.name || order.item_name || order.itemName || order.product_name || order.productName,
          product: order.product,
          quantity: order.quantity || order.qty,
          price: order.price,
          total: order.total,
          image: order.image,
        },
      ];

  return items.map((item, index) => {
    const product = item.product || item.product_detail || item.productDetail || {};
    const quantity = Math.max(1, toNumber(item.quantity || item.qty || item.pivot?.quantity || 1));
    const price = pickNumber(item, product.pricing || product, ["price", "unit_price", "unitPrice", "harga", "amount"]);
    const total = pickNumber(item, item.summary || {}, ["total", "line_total", "lineTotal", "subtotal"]) || price * quantity;

    return {
      id: item.id || item.uuid || item.order_item_id || item.orderItemId || product.id || `${orderIndex}-${index}`,
      name: product.name || product.title || item.name || item.title || item.product_name || item.productName || "Produk",
      quantity,
      price,
      total,
      image: resolveApiUrl(product.image || product.image_url || product.imageUrl || item.image || item.image_url || item.imageUrl),
    };
  });
}

function normalizeOrderStatus(status) {
  const value = String(status || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (["diproses", "process", "processed", "processing", "in_process", "packed", "dikemas", "ready_to_ship", "pending", "waiting", "menunggu", "baru", "new", "new_order"].includes(value)) return "processing";
  if (["dikirim", "sent", "ship", "shipped", "delivered", "terkirim"].includes(value)) return "shipped";
  if (["selesai", "done", "completed", "complete", "finished"].includes(value)) return "selesai";
  if (["dibatalkan", "dibatal", "cancelled", "canceled", "batal"].includes(value)) return "cancelled";
  return ORDER_STATUS_OPTIONS.some((item) => item.value === value) ? value : "processing";
}

function toApiOrderStatus(status) {
  const value = String(status || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (["diproses", "process", "processed", "processing", "in_process", "packed", "dikemas", "ready_to_ship", "new", "baru", "menunggu"].includes(value)) return "DIPROSES";
  if (["dikirim", "sent", "ship", "shipped", "delivered", "terkirim"].includes(value)) return "DIKIRIM";
  if (["selesai", "done", "completed", "complete", "finished"].includes(value)) return "SELESAI";
  if (["dibatalkan", "dibatal", "cancelled", "canceled", "batal"].includes(value)) return "DIBATALKAN";
  return "DIPROSES";
}

function normalizeOrderTimeline(order, createdAt, status) {
  const rawTimeline = extractCollection(order.timeline || order.history || order.status_history || order.statusHistory, [
    "timeline",
    "history",
    "items",
    "data",
  ]);

  if (rawTimeline.length) {
    return rawTimeline.map((event) => ({
      label: event.label || event.title || getStatusLabel(normalizeOrderStatus(event.status || event.state)) || "Order Updated",
      time: formatOrderTime(event.time || event.created_at || event.createdAt || event.date),
    }));
  }

  const baseTime = formatOrderTime(createdAt);
  const events = [{ label: "Order Placed", time: baseTime }];
  if (status !== "cancelled") {
    events.unshift({ label: "Payment Confirmed", time: formatOrderTime(order.paid_at || order.paidAt || createdAt) });
  }
  if (["processing", "shipped", "selesai"].includes(status)) {
    events.unshift({ label: "Processing Started", time: formatOrderTime(order.processed_at || order.processedAt || createdAt) });
  }
  if (["shipped", "selesai"].includes(status)) {
    events.unshift({ label: "Packed", time: formatOrderTime(order.packed_at || order.packedAt || createdAt) });
    events.unshift({ label: "Shipped", time: formatOrderTime(order.shipped_at || order.shippedAt || createdAt) });
  }
  if (status === "selesai") {
    events.unshift({ label: "Delivered", time: formatOrderTime(order.delivered_at || order.deliveredAt || createdAt) });
  }
  return events;
}

function sumOrderItems(items) {
  return items.reduce((total, item) => total + (item.total || item.price * item.quantity || 0), 0);
}

function formatOrderItemSummary(items) {
  if (!items.length) return "Produk";
  const first = items[0];
  return first.quantity > 1 ? `${first.name} x${first.quantity}` : first.name;
}

function formatAddress(address) {
  if (!address) return "";
  if (typeof address === "string") return address;
  const detail =
    address.address ||
    address.street ||
    address.line1 ||
    address.detail ||
    address.full_address ||
    address.address_text;
  const area =
    address.district || address.kecamatan || address.subdistrict || address.kelurahan;
  return [
    detail,
    area,
    address.city || address.kota || address.city_name,
    address.province || address.state || address.region,
    address.postal_code || address.postalCode || address.zip,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatFullDateTime(value) {
  const date = parseDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractCollection(response, keys) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.payload,
    response?.data?.data,
    response?.result?.data,
    response?.payload?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (!candidate || typeof candidate !== "object") continue;
    for (const key of keys) {
      if (Array.isArray(candidate[key])) return candidate[key];
    }
  }

  return [];
}

function getProductId(product) {
  return product?.id || product?.uuid || product?.product_id || product?.productId || product?._id;
}

function buildSellerUser(user) {
  const profile = user?.profile || user?.seller || user?.store || user?.account || user?.data || {};
  const current = profile.profile || profile.user || profile.seller || profile.store || profile;
  const name =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    profile?.name ||
    current?.name ||
    "Maker";
  return {
    name,
    storeName:
      user?.store_name ||
      user?.storeName ||
      profile?.store_name ||
      profile?.storeName ||
      current?.store_name ||
      current?.storeName ||
      "",
    roleLabel: user?.role_label || user?.roleLabel || profile?.role_label || profile?.roleLabel || "",
    avatar:
      user?.avatar ||
      user?.avatar_url ||
      user?.photo ||
      user?.photoprofil ||
      user?.photo_profil ||
      profile?.avatar ||
      current?.avatar ||
      profile?.logo,
  };
}

function pickNumber(primary, secondary, keys) {
  for (const key of keys) {
    const value = primary?.[key] ?? secondary?.[key];
    if (value === undefined || value === null || value === "" || typeof value === "object") continue;
    return toNumber(value);
  }
  return 0;
}

function pickText(primary, secondary, keys) {
  for (const key of keys) {
    const value = primary?.[key] ?? secondary?.[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function toNumber(value) {
  if (typeof value === "number") return value;
  return Number(String(value ?? "").replace(/[^\d.-]/g, "")) || 0;
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

function formatOrderDate(value) {
  const date = parseDate(value);
  if (!date) return "Tanggal belum tersedia";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  if (sameDay) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function formatOrderTime(value) {
  const date = parseDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatOrderCode(value) {
  const raw = String(value || "").trim();
  if (!raw) return "#ORD-001";
  return raw.startsWith("#") ? raw : `#${raw}`;
}

function getInitials(name) {
  return String(name || "P")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function getStatusLabel(status) {
  if (["new", "pending", "waiting", "menunggu", "baru"].includes(status)) return "Baru";
  if (["processing", "process", "diproses", "packed", "dikemas"].includes(status)) return "Diproses";
  if (["sent", "shipped", "delivered", "dikirim"].includes(status)) return "Dikirim";
  if (["done", "completed", "complete", "selesai"].includes(status)) return "Selesai";
  if (["cancelled", "canceled", "dibatalkan", "batal"].includes(status)) return "Dibatalkan";
  return "Diproses";
}

function getStatusClass(status) {
  if (["new", "pending", "waiting", "menunggu", "processing", "process", "diproses", "packed", "dikemas"].includes(status)) return "processing";
  if (["sent", "shipped", "delivered", "dikirim"].includes(status)) return "sent";
  if (["done", "completed", "complete", "selesai"].includes(status)) return "done";
  if (["cancelled", "canceled", "dibatalkan", "batal"].includes(status)) return "cancelled";
  return "processing";
}

function getFallbackDay(index) {
  return ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"][index] || `Hari ${index + 1}`;
}

function formatTrendLabel(value, index) {
  if (!value) return getFallbackDay(index);
  const date = new Date(value);
  if (!Number.isNaN(date.getTime()) && /\d{4}-\d{1,2}-\d{1,2}/.test(String(value))) {
    return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date);
  }
  return String(value);
}

function getFallbackProductImage(index) {
  const images = [
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=720&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595408076683-de1c39d55e0e?q=80&w=720&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=720&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=720&auto=format&fit=crop",
  ];

  return images[index % images.length];
}

function extractSellerNotifications(raw) {
  if (Array.isArray(raw)) return raw;

  const candidates = [
    raw?.data?.notifications,
    raw?.data?.items,
    raw?.data?.results,
    raw?.notifications,
    raw?.items,
    raw?.results,
    raw?.notification,
    raw?.data?.notification,
    raw?.data,
    raw,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (looksLikeSellerNotification(candidate)) return [candidate];
  }

  return [];
}

function looksLikeSellerNotification(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      (getSellerNotificationId(value) ||
        value.title ||
        value.message ||
        value.body ||
        value.notification_type ||
        value.created_at ||
        value.createdAt)
  );
}

function normalizeSellerNotifications(source) {
  return extractSellerNotifications(source)
    .map((notification, index) => normalizeSellerNotification(notification, index))
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime() || 0;
      const bTime = new Date(b.createdAt || 0).getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 8);
}

function normalizeSellerNotification(notification, index = 0) {
  const type = normalizeSellerNotificationType(notification);
  const createdAt =
    notification.created_at ||
    notification.createdAt ||
    notification.timestamp ||
    notification.time ||
    notification.date ||
    notification.updated_at;
  const product = extractSellerNotificationProduct(notification);
  const storeName = extractSellerNotificationStoreName(notification);
  const message =
    notification.message ||
    notification.body ||
    notification.description ||
    notification.content ||
    notification.text ||
    getSellerNotificationFallbackMessage(type, notification, product);

  return {
    apiId: getSellerNotificationId(notification),
    id: getSellerNotificationId(notification) || `notification-${createdAt || index}`,
    type,
    accent: getSellerNotificationAccent(type),
    title:
      notification.title ||
      notification.subject ||
      notification.heading ||
      getSellerNotificationFallbackTitle(type, notification, product),
    message,
    createdAt,
    displayTime: formatSellerRelativeTime(createdAt),
    isRead: isSellerNotificationRead(notification),
    product,
    storeName,
    raw: notification,
  };
}

function extractSellerNotificationProduct(notification) {
  if (!notification || typeof notification !== "object") return null;

  const data =
    (notification.data && typeof notification.data === "object" && !Array.isArray(notification.data) ? notification.data : {}) ||
    (notification.payload && typeof notification.payload === "object" && !Array.isArray(notification.payload) ? notification.payload : {});
  const itemSource =
    (Array.isArray(notification.items) && notification.items[0]) ||
    (Array.isArray(notification.order_items) && notification.order_items[0]) ||
    (Array.isArray(notification.products) && notification.products[0]) ||
    (Array.isArray(data.items) && data.items[0]) ||
    (Array.isArray(data.order_items) && data.order_items[0]) ||
    (Array.isArray(data.products) && data.products[0]) ||
    {};
  const productSource =
    notification.product ||
    notification.product_detail ||
    notification.product_info ||
    data.product ||
    data.product_detail ||
    data.product_info ||
    itemSource ||
    {};
  const nestedProduct = productSource.product || productSource.product_detail || {};

  const name =
    productSource.product_name ||
    productSource.name ||
    productSource.title ||
    nestedProduct.name ||
    nestedProduct.title ||
    notification.product_name ||
    notification.productName ||
    data.product_name ||
    data.productName ||
    (data.order && (data.order.product_name || data.order.productName)) ||
    "";
  const image = resolveApiUrl(
    productSource.image ||
      productSource.image_url ||
      productSource.imageUrl ||
      nestedProduct.image ||
      nestedProduct.image_url ||
      nestedProduct.imageUrl ||
      itemSource.image ||
      itemSource.image_url ||
      notification.product_image ||
      notification.productImage ||
      data.product_image ||
      ""
  );
  const quantity =
    toNumber(pickNumber(productSource, {}, ["quantity", "qty", "amount"]) || pickNumber(itemSource, {}, ["quantity", "qty"])) ||
    (typeof notification.quantity === "number" ? notification.quantity : 0) ||
    0;

  if (!name) return null;

  return {
    id:
      productSource.id ||
      productSource.uuid ||
      productSource.product_id ||
      notification.product_id ||
      notification.productId ||
      data.product_id ||
      "",
    name: String(name).trim(),
    image,
    quantity: Math.max(1, quantity),
  };
}

function extractSellerNotificationStoreName(notification) {
  if (!notification || typeof notification !== "object") return "";
  const data =
    notification.data && typeof notification.data === "object" && !Array.isArray(notification.data) ? notification.data : {};
  return (
    notification.store_name ||
    notification.storeName ||
    notification.shop_name ||
    notification.shopName ||
    (notification.store && notification.store.name) ||
    data.store_name ||
    data.storeName ||
    (data.store && typeof data.store === "object" && data.store.name) ||
    ""
  );
}

function groupSellerNotifications(notifications) {
  const groups = [];
  const indexByKey = new Map();
  const ungrouped = { productName: "Notifikasi lainnya", productImage: "", storeName: "", items: [] };

  (notifications || []).forEach((notification) => {
    const name = notification.product?.name ? String(notification.product.name).toLowerCase() : "";
    if (!name) {
      ungrouped.items.push(notification);
      return;
    }
    if (!indexByKey.has(name)) {
      indexByKey.set(name, groups.length);
      groups.push({
        productName: String(notification.product.name),
        productImage: notification.product.image || "",
        storeName: notification.storeName || "",
        items: [],
      });
    }
    groups[indexByKey.get(name)].items.push(notification);
  });

  if (ungrouped.items.length) {
    ungrouped.storeName = ungrouped.items.find((notification) => notification.storeName)?.storeName || "";
    groups.push(ungrouped);
  }

  return groups;
}

function mergeSellerNotifications(incoming, current) {
  const seen = new Set();

  return [...extractSellerNotifications(incoming), ...extractSellerNotifications(current)].filter((notification, index) => {
    const id = getSellerNotificationId(notification) || `${notification.title || notification.message || "notification"}-${index}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function getSellerNotificationId(notification) {
  return notification?.id || notification?.uuid || notification?.notification_id || notification?.notificationId || notification?._id;
}

function isSellerNotificationRead(notification) {
  if (!notification || typeof notification !== "object") return false;
  if (notification.is_read !== undefined) return Boolean(notification.is_read);
  if (notification.isRead !== undefined) return Boolean(notification.isRead);
  if (notification.read !== undefined) return Boolean(notification.read);
  if (notification.read_at || notification.readAt) return true;
  return String(notification.status || "").toLowerCase() === "read";
}

function countSellerUnreadNotifications(raw) {
  return extractSellerNotifications(raw).filter((notification) => !isSellerNotificationRead(notification)).length;
}

function extractSellerUnreadCount(raw) {
  if (typeof raw === "number") return raw;

  const candidates = [
    raw?.unread_count,
    raw?.unreadCount,
    raw?.count,
    raw?.total,
    raw?.data?.unread_count,
    raw?.data?.unreadCount,
    raw?.data?.count,
    raw?.data?.total,
    raw?.meta?.unread_count,
    raw?.meta?.unreadCount,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== "") return toNumber(candidate);
  }

  return null;
}

function normalizeSellerNotificationType(notification) {
  const value = String(
    notification.type ||
      notification.notification_type ||
      notification.category ||
      notification.event ||
      notification.kind ||
      notification.title ||
      notification.message ||
      ""
  ).toLowerCase();

  if (value.includes("stock") || value.includes("stok") || value.includes("inventory")) return "stock";
  if (value.includes("customer") || value.includes("pelanggan") || value.includes("register")) return "customer";
  if (value.includes("order") || value.includes("pesanan") || value.includes("checkout")) return "order";
  return "general";
}

function getSellerNotificationAccent(type) {
  if (type === "stock") return "danger";
  if (type === "customer") return "neutral";
  if (type === "order") return "pink";
  return "soft";
}

function getSellerNotificationIcon(type) {
  if (type === "stock") return AlertTriangle;
  if (type === "customer") return UserCog;
  if (type === "order") return ShoppingBag;
  return Bell;
}

function getSellerNotificationFallbackTitle(type, notification, product) {
  const orderCode = notification.order_code || notification.orderCode || notification.order_number || notification.orderNumber;
  const productName = product?.name || notification.product_name || notification.productName || notification.product?.name;
  const customerName = notification.customer_name || notification.customerName || notification.user?.name || notification.customer?.name;

  if (type === "order") {
    if (productName) return product?.quantity > 0 ? `"${productName}" terjual (x${product.quantity})` : `"${productName}" terjual`;
    return orderCode ? `Pesanan Baru ${formatOrderCode(orderCode)}` : "Pesanan Baru";
  }
  if (type === "stock") return productName ? `Stok Menipis: ${productName}` : "Stok Menipis";
  if (type === "customer") return customerName ? `Pelanggan Baru: ${customerName}` : "Pelanggan Baru Terdaftar";
  return "Notifikasi Baru";
}

function getSellerNotificationFallbackMessage(type, notification, product) {
  const productName = product?.name || notification.product_name || notification.productName || notification.product?.name;
  if (type === "order") return productName ? `Produk "${productName}" telah terjual dari tokomu dan menunggu proses.` : "Pesanan baru telah diterima dan menunggu proses.";
  if (type === "stock") return productName ? `Stok produk "${productName}" perlu diperiksa kembali.` : "Stok produk perlu diperiksa kembali.";
  if (type === "customer") return "Pelanggan baru telah mendaftar.";
  return "Ada pembaruan baru untuk studionu.";
}

function formatSellerRelativeTime(dateValue) {
  if (!dateValue) return "Baru saja";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return "Baru saja";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari yang lalu`;

  return formatSellerDateOnly(dateValue);
}

function formatSellerDateOnly(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatBadgeCount(value) {
  return value > 99 ? "99+" : String(value);
}

function ReceiptIcon(props) {
  return <Tag {...props} />;
}
