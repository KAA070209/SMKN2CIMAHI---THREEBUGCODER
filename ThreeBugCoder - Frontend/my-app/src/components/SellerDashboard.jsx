import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  LogOut,
  Menu,
  Plus,
  Store,
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
  updateSellerStore,
  updateSellerOrderStatus,
  updateSellerProduct,
} from "../lib/userApi.js";
import { getStoredAuthUser } from "../lib/authApi.js";
import "./SellerDashboard.css";
import { ConfirmDialog } from "./ConfirmDialog.jsx";
import { navItems } from "./sellerDashboard/constants.jsx";
import {
  SellerDashboardHome,
  SellerOrdersPage,
  SellerProductsPage,
  SellerProductFormPage,
  SellerProductEditModal,
  SellerNotificationsDropdown,
  SellerPlaceholder,
  SellerStoreProfilePage,
} from "./sellerDashboard/views.jsx";
import {
  buildSellerStorePayload,
  buildSellerProductPayload,
  normalizeSellerStore,
  normalizeSellerSummary,
  normalizeSellerOrders,
  normalizeSellerProducts,
  buildCategoryNameMap,
  buildCategoryOptions,
  filterSellerProducts,
  filterSellerOrders,
  toApiOrderStatus,
  buildSellerUser,
} from "./sellerDashboard/helpers.js";
import {
  extractSellerNotifications,
  normalizeSellerNotifications,
  groupSellerNotifications,
  mergeSellerNotifications,
  getSellerNotificationId,
  isSellerNotificationRead,
  countSellerUnreadNotifications,
  extractSellerUnreadCount,
  formatBadgeCount,
} from "./sellerDashboard/notifications.jsx";

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
            orders={orders}
            isLoading={isLoading}
            isOrdersLoading={isOrdersLoading}
            error={error}
            onRefresh={() => {
              loadSummary();
              loadOrders();
            }}
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
