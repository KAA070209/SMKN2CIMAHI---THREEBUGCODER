import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ChevronRight, ReceiptText, Tag } from "lucide-react";
import { styles } from "./styles.js";
import { GlobalStyle } from "./components/GlobalStyle.jsx";
import { Typewriter } from "./components/Typewriter.jsx";
import { AuthPage } from "./components/AuthPage.jsx";
import { AdminDashboard } from "./components/AdminDashboard.jsx";
import { SellerDashboard } from "./components/SellerDashboard.jsx";
import {
  addCartItem,
  addToWishlist,
  clearCart,
  fetchCart,
  fetchProductCategories,
  fetchProducts,
  fetchVouchers,
  fetchWishlists,
  removeCartItem as deleteCartItem,
  removeFromWishlist,
  resolveApiUrl,
  updateCartItem,
} from "./lib/userApi.js";
import {
  fetchMe,
  handleGoogleCallback,
  getStoredAuthUser,
  getSessionUser,
  logout,
} from "./lib/authApi.js";
import {
  toWishlistItem,
  formatRupiah,
  pickRandomProducts,
  sortStorefrontProducts,
  REVIEWS,
  LEGAL_PAGES,
  formatDiscountPercent,
  pickFeaturedVoucher,
  Reveal,
  buildMidtransPaymentPayload,
  isPaidMidtransStatus,
} from "./app/appHelpers.jsx";
import {
  isLoggedIn,
  isAdminSession,
  normalizeCart,
  getCartItemRequestId,
  normalizeWishlist,
  getViewFromPath,
  getProductIdFromPath,
  getStoreIdFromPath,
  getSearchQueryFromUrl,
  getCategoryIdFromPath,
  getCategoryNameFromUrl,
  SearchResultsPage,
  StoreDetailPage,
  ProductDetailPage,
  LegalPage,
  AboutPage,
  FaqPage,
  ContactPage,
  BlogPage,
  ProfilePage,
  OrdersPage,
  AddressPage,
  CategoryProductsPage,
  AllCategoriesPage,
  VouchersPage,
  WishlistPage,
  CartPage,
  PaymentPage,
  pickDisplayName,
  SiteHeader,
  SiteFooter,
  SearchBar,
  EmptyStorefrontState,
  SectionHeader,
  PillButton,
  CategoryCard,
  ProductCard,
  SortDropdown,
  ReviewCarousel,
  ScallopEdge,
  FloatingCraftDots,
} from "./app/appViews.jsx";

const LANDING_PRODUCT_BG = ["#f7c4d7", "#f4d35e", "#9bd8d0", "#f6b78f", "#b6d7ff"];

function unwrapLandingCollection(raw, keys) {
  const candidates = [
    raw,
    raw?.data,
    raw?.result,
    raw?.payload,
    raw?.value,
    raw?.data?.data,
    raw?.data?.value,
    raw?.result?.data,
    raw?.result?.value,
    raw?.payload?.data,
    raw?.payload?.value,
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

function normalizeLandingCategories(raw) {
  return unwrapLandingCollection(raw, ["categories", "category", "kategori", "items", "list", "data", "value", "rows", "results"])
    .map((item, index) => ({
      id: item.id ?? item.uuid ?? item.category_id ?? item.categoryId ?? item._id ?? `category-${index + 1}`,
      name: item.name || item.title || item.category_name || item.categoryName || item.nama_kategori || item.kategori || "Kategori",
      description: item.description || item.desc || item.about || item.category_description || item.categoryDescription || item.deskripsi || "",
      img: resolveApiUrl(item.img || item.image || item.image_url || item.imageUrl || item.photo || item.thumbnail),
      isActive: item.is_active !== false && item.isActive !== false,
    }))
    .filter((item) => item.name && item.isActive);
}

function isGenericCategoryLabel(value) {
  const label = String(value || "").trim().toLowerCase();
  return !label || label === "kriya" || label === "kategori" || label === "produk";
}

function normalizeLandingProducts(raw, categories = []) {
  const categoryNameById = new Map(
    categories.map((category) => [String(category.id || ""), category.name]).filter(([id]) => id)
  );

  return unwrapLandingCollection(raw, ["products", "items", "list", "data", "value", "rows", "results"])
    .map((item, index) => {
      const category = item.category && typeof item.category === "object" ? item.category : {};
      const categoryId =
        item.category_id ??
        item.categoryId ??
        item.product_category_id ??
        item.productCategoryId ??
        category.id ??
        category.uuid ??
        "";
      const priceValue = Number(item.price ?? item.harga ?? item.selling_price ?? item.sale_price ?? item.price_value ?? 0) || 0;
      const badgeText = typeof item.badge === "string" ? item.badge.trim() : "";
      const directCategoryName = [
        item.category_name,
        item.categoryName,
        item.nama_kategori,
        item.kategori,
        item.category_label,
        typeof item.category === "string" ? item.category : "",
        category.name,
        category.title,
        category.category_name,
        category.categoryName,
        category.nama_kategori,
      ].find((name) => typeof name === "string" && name.trim() && !isGenericCategoryLabel(name));
      const mappedCategoryName = categoryNameById.get(String(categoryId)) || "";
      const categoryLabel =
        directCategoryName ||
        (!isGenericCategoryLabel(mappedCategoryName) ? mappedCategoryName : "") ||
        (!isGenericCategoryLabel(badgeText) ? badgeText : "") ||
        mappedCategoryName ||
        badgeText ||
        "Kategori";

      return {
        id: item.id ?? item.uuid ?? item.product_id ?? item.productId ?? item._id ?? `product-${index + 1}`,
        storeId: item.store_id ?? item.storeId ?? item.seller_id ?? item.sellerId ?? item.store?.id ?? item.seller?.id ?? "",
        categoryId,
        title: item.title || item.name || item.product_name || item.nama_produk || "Produk",
        description: item.description || item.desc || item.deskripsi || item.product_description || item.productDescription || "",
        price: formatRupiah(priceValue),
        priceValue,
        created: item.created_at ?? item.createdAt ?? item.date ?? item.published_at ?? "",
        sold: Number(item.sold ?? item.total_sold ?? item.totalSold ?? item.sales ?? item.terjual ?? 0) || 0,
        isActive: item.is_active !== false && item.isActive !== false,
        badge: categoryLabel,
        img: resolveApiUrl(item.img || item.image || item.image_url || item.imageUrl || item.photo || item.thumbnail),
        bg: item.bg || LANDING_PRODUCT_BG[index % LANDING_PRODUCT_BG.length],
      };
    })
    .filter((item) => item.title && item.isActive);
}

export default function BumiKriyaLanding() {
  const [pageView, setPageView] = useState(getViewFromPath);
  const [searchQuery, setSearchQuery] = useState(() => getSearchQueryFromUrl());
  const [scrolled, setScrolled] = useState(false);
  const [liked, setLiked] = useState({});
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [cartBusyId, setCartBusyId] = useState(null);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const [selectedCartItemIds, setSelectedCartItemIds] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState(() => {
    try {
      return localStorage.getItem("bkOrderId") || null;
    } catch {
      return null;
    }
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortLabel, setSortLabel] = useState("Terbaru");
  const [serverProducts, setServerProducts] = useState([]);
  const [serverCategories, setServerCategories] = useState([]);
  const [isStorefrontLoading, setIsStorefrontLoading] = useState(true);
  const [featuredVoucher, setFeaturedVoucher] = useState(null);
  const [isFeaturedVoucherLoading, setIsFeaturedVoucherLoading] = useState(true);
  const [featuredVoucherError, setFeaturedVoucherError] = useState("");
  const [authUser, setAuthUser] = useState(() => getStoredAuthUser());
  const toastTimer = useRef(null);
  const googleCallbackRef = useRef(false);

  /* handle the redirect back from Google OAuth (token in the URL) */
  useEffect(() => {
    const authParams = new URLSearchParams(window.location.search);
    const oauthError = authParams.get("error");

    const session = handleGoogleCallback();
    if (session) {
      googleCallbackRef.current = true;
      const nextUser = getSessionUser(session) || getStoredAuthUser();
      setAuthUser(nextUser);
      navigateTo(isAdminSession(session) ? "adminDashboard" : "home");
      showToast("Login dengan Google berhasil");
    } else if (oauthError) {
      authParams.delete("error");
      const url = new URL(window.location.href);
      url.search = authParams.toString();
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      showToast(
        oauthError === "no_email"
          ? "Akun Google ini tidak memiliki email. Silakan gunakan akun lain."
          : "Login dengan Google gagal. Silakan coba lagi."
      );
    }
   
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    const transactionStatus = params.get("transaction_status");
    if (!orderId || !transactionStatus) return undefined;

    const pendingStatuses = new Set(["pending", "201", "202"]);
    const failedStatuses = new Set(["deny", "cancel", "expire", "failure", "void", "401", "407", "412"]);
    let cancelled = false;

    const cleanPaymentParams = () => {
      ["order_id", "transaction_status", "status_code", "status_message", "fraud_status", "payment_type", "gross_amount", "transaction_time", "signature_key"].forEach((key) => params.delete(key));
      const url = new URL(window.location.href);
      url.search = params.toString();
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    };

    const finishPaymentRedirect = async () => {
      const payload = buildMidtransPaymentPayload(params);
      const statusCode = payload.status_code || payload.statusCode;
      const isSuccess = isPaidMidtransStatus(transactionStatus) || isPaidMidtransStatus(statusCode);

      if (cancelled) return;
      cleanPaymentParams();

      if (isSuccess) {
        showToast("Pembayaran berhasil!");
      } else if (pendingStatuses.has(transactionStatus)) {
        showToast("Pembayaran sedang diproses, cek status pesananmu.");
      } else if (failedStatuses.has(transactionStatus)) {
        showToast("Pembayaran gagal atau dibatalkan, silakan coba lagi.");
      }
      navigateTo("orders");
    };

    finishPaymentRedirect();
    return () => {
      cancelled = true;
    };
    
  }, []);


  useEffect(() => {
    if (!isLoggedIn()) return undefined;

    const cached = getStoredAuthUser();
    if (cached && pickDisplayName(cached)) return undefined;

    const controller = new AbortController();
    fetchMe({ signal: controller.signal })
      .then((me) => {
        const user = getSessionUser(me);
        if (user) {
          localStorage.setItem("authUser", JSON.stringify(user));
          setAuthUser(user);
        }
      })
      .catch(() => { });
    return () => controller.abort();
  }, []);

  
  useEffect(() => {
    const controller = new AbortController();
    setIsStorefrontLoading(true);
    Promise.allSettled([
      fetchProducts({ signal: controller.signal }),
      fetchProductCategories({ signal: controller.signal }),
    ])
      .then(([productsResult, categoriesResult]) => {
        if (controller.signal.aborted) return;

        const productsRaw = productsResult.status === "fulfilled" ? productsResult.value : [];
        const categoriesRaw = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
        const categories = normalizeLandingCategories(categoriesRaw);
        const products = normalizeLandingProducts(productsRaw, categories);

        setServerProducts(products);
        setServerCategories(categories);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setServerProducts([]);
          setServerCategories([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsStorefrontLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsFeaturedVoucherLoading(true);
    setFeaturedVoucherError("");
    fetchVouchers({ signal: controller.signal })
      .then((data) => {
        setFeaturedVoucher(pickFeaturedVoucher(data));
      })
      .catch((error) => {
        setFeaturedVoucher(null);
        setFeaturedVoucherError(error instanceof Error ? error.message : "Gagal memuat voucher.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsFeaturedVoucherLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageView]);

  useEffect(() => {
    const onPopState = () => {
      setPageView(getViewFromPath());
      setSearchQuery(getSearchQueryFromUrl());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (pageView === "search") setSearchQuery(getSearchQueryFromUrl());
  }, [pageView]);

  const randomProducts = useMemo(
    () => pickRandomProducts(serverProducts, 25),
    [serverProducts]
  );

  const sortedProducts = useMemo(() => {
    if (sortLabel === "Terbaru") {
      const newest = sortStorefrontProducts(serverProducts, "Terbaru");
      return newest.slice(0, 25);
    }
    return sortStorefrontProducts(randomProducts, sortLabel);
  }, [serverProducts, randomProducts, sortLabel]);

  const navigateTo = useCallback((nextView) => {
    if (nextView && typeof nextView === "object") {
      const { view, categoryId, categoryName } = nextView;
      if (view === "categoryProducts") {
        const slug = String(categoryId || "").trim();
        const name = String(categoryName || "").trim();
        if (!slug) return;
        const nextPath = `/kategori/${encodeURIComponent(slug)}${name ? `?name=${encodeURIComponent(name)}` : ""}`;
        if (window.location.pathname !== `/kategori/${encodeURIComponent(slug)}`) {
          window.history.pushState({ view, categoryId: slug }, "", nextPath);
        }
        setPageView(view);
        return;
      }
    }

    const pathByView = {
      home: "/",
      login: "/login",
      register: "/register",
      profile: "/profil",
      addresses: "/alamat",
      orders: "/pesanan-saya",
      wishlist: "/wishlist",
      cart: "/keranjang",
      payment: "/pembayaran",
      adminDashboard: "/admin/dashboard",
      sellerDashboard: "/seller/dashboard",
      search: `/search?q=${encodeURIComponent(searchQuery)}`,
      productDetail: `/products/${encodeURIComponent(getProductIdFromPath() || "")}`,
      storeDetail: `/stores/${encodeURIComponent(getStoreIdFromPath() || "")}`,
privacy: "/kebijakan-privasi",
      terms: "/syarat-ketentuan",
      about: "/tentang-kami",
      faq: "/faq",
      contact: "/kontak",
      categories: "/kategori",
      vouchers: "/semua-voucher",
    

    };
    const nextPath = pathByView[nextView] ?? "/";

    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: nextView }, "", nextPath);
    }
    setPageView(nextView);
  }, [searchQuery]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo("home");
    }
  }, [navigateTo]);

  const navigateToProduct = useCallback((product) => {
    const productId = product?.productId ?? product?.id;
    if (productId === undefined || productId === null || productId === "") {
      showToast("Produk ini belum memiliki ID dari server");
      return;
    }

    const nextPath = `/products/${encodeURIComponent(productId)}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: "productDetail", productId }, "", nextPath);
    }
    setPageView("productDetail");
  }, [showToast]);

const navigateToStore = useCallback((store) => {
    const storeId = store?.storeId ?? store?.id;
    if (storeId === undefined || storeId === null || storeId === "") {
      showToast("Toko ini belum memiliki ID dari server");
      return;
    }

    const nextPath = `/stores/${encodeURIComponent(storeId)}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: "storeDetail", storeId }, "", nextPath);
    }
    setPageView("storeDetail");
  }, [showToast]);

  const navigateToCategory = useCallback((category) => {
    const categoryId = category?.id;
    if (categoryId === undefined || categoryId === null || categoryId === "") {
      showToast("Kategori ini belum memiliki ID dari server");
      return;
    }

    const name = String(category?.name || "").trim();
    const nextPath = `/kategori/${encodeURIComponent(String(categoryId))}${name ? `?name=${encodeURIComponent(name)}` : ""}`;
    if (window.location.pathname !== `/kategori/${encodeURIComponent(String(categoryId))}`) {
      window.history.pushState({ view: "categoryProducts", categoryId }, "", nextPath);
    }
    setPageView("categoryProducts");
  }, [showToast]);


  const loadCart = useCallback(async ({ signal, quiet = false } = {}) => {
    if (!isLoggedIn()) {
      setCartItems([]);
      setCartError("");
      setSelectedCartItemIds(null);
      return;
    }

    if (!quiet) setIsCartLoading(true);
    setCartError("");

    try {
      const data = await fetchCart({ signal });
      if (signal?.aborted) return;
      const loadedItems = normalizeCart(data);
      setCartItems(loadedItems);
      setSelectedCartItemIds((prev) => {
        if (prev === null) return null;
        const nextIds = loadedItems.map((item) => item.cartItemId);
        const prevSet = new Set(prev);
        const result = nextIds.filter((id) => prevSet.has(id));
        nextIds.forEach((id) => {
          if (!prevSet.has(id)) result.push(id);
        });
        return result;
      });
    } catch (error) {
      if (signal?.aborted) return;
      const message = error instanceof Error ? error.message : "Gagal memuat keranjang.";
      setCartError(message);
      if (!quiet) showToast(message);
    } finally {
      if (!signal?.aborted) setIsCartLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isLoggedIn()) {
      setCartItems([]);
      setCartError("");
      setSelectedCartItemIds(null);
      return undefined;
    }

    const controller = new AbortController();
    loadCart({ signal: controller.signal, quiet: true });
    return () => controller.abort();
  }, [authUser, loadCart]);

  const loadWishlist = useCallback(async ({ signal, quiet = false } = {}) => {
    if (!isLoggedIn()) {
      setWishlistItems([]);
      setLiked({});
      setWishlistError("");
      return;
    }

    if (!quiet) setIsWishlistLoading(true);
    setWishlistError("");

    try {
      const data = await fetchWishlists({ signal });
      if (signal?.aborted) return;
      const items = normalizeWishlist(data);
      setWishlistItems(items);
      setLiked(
        items.reduce((acc, item) => {
          acc[item.id] = true;
          return acc;
        }, {})
      );
    } catch (error) {
      if (signal?.aborted) return;
      const message = error instanceof Error ? error.message : "Gagal memuat wishlist.";
      setWishlistError(message);
      if (!quiet) showToast(message);
    } finally {
      if (!signal?.aborted) setIsWishlistLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isLoggedIn()) {
      setWishlistItems([]);
      setLiked({});
      setWishlistError("");
      return undefined;
    }

    const controller = new AbortController();
    loadWishlist({ signal: controller.signal, quiet: true });
    return () => controller.abort();
  }, [authUser, loadWishlist]);

  const handleSearch = useCallback((rawQuery) => {
    const nextQuery = rawQuery.trim();
    if (!nextQuery) {
      showToast("Ketik dulu yang mau kamu cari ya");
      return;
    }

    const nextPath = `/search?q=${encodeURIComponent(nextQuery)}`;
    if (window.location.pathname + window.location.search !== nextPath) {
      window.history.pushState({ view: "search", q: nextQuery }, "", nextPath);
    }
    setSearchQuery(nextQuery);
    setPageView("search");
  }, [showToast]);

  const handleAuthSuccess = useCallback((data, mode) => {
    const nextUser = getSessionUser(data) || getStoredAuthUser();
    setAuthUser(nextUser);
    navigateTo(mode === "login" && isAdminSession(data) ? "adminDashboard" : "home");
    showToast(mode === "register" ? "Akun berhasil dibuat" : "Login berhasil");
  }, [navigateTo, showToast]);

  const handleAdminLogout = useCallback(() => {
    logout().catch(() => {});
    setAuthUser(null);
    setCartItems([]);
    setCartError("");
    setSelectedCartItemIds(null);
    window.history.replaceState({ view: "login" }, "", "/login");
    setPageView("login");
    showToast("Logout berhasil");
  }, [showToast]);

  const handleUserLogout = useCallback(() => {
    logout().catch(() => {});
    setAuthUser(null);
    setCartItems([]);
    setCartError("");
    setSelectedCartItemIds(null);
    navigateTo("home");
    showToast("Logout berhasil");
  }, [navigateTo, showToast]);

  useEffect(() => {
    if ((pageView === "adminDashboard" || pageView === "sellerDashboard" || pageView === "profile" || pageView === "addresses" || pageView === "orders") && !isLoggedIn()) {
      window.history.replaceState({ view: "login" }, "", "/login");
      setPageView("login");
      showToast("Sesi berakhir. Silakan masuk kembali.");
      return;
    }
    if ((pageView === "login" || pageView === "register") && isLoggedIn() && !googleCallbackRef.current) {
      setAuthUser(getStoredAuthUser());
      window.history.replaceState({ view: "home" }, "", "/");
      setPageView("home");
      showToast("Kamu sudah login");
    }
  }, [pageView, showToast]);

  const wishCount = wishlistItems.length;
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const selectedCartItems = cartItems.filter((item) =>
    selectedCartItemIds === null ? true : selectedCartItemIds.includes(item.cartItemId)
  );
  const checkoutCartItemIds = selectedCartItems
    .map((item) => Number(item.cartItemId))
    .filter((id) => Number.isFinite(id) && id > 0);

  const toggleLike = async (product) => {
    const shouldLike = !liked[product.id];

    setLiked((prev) => {
      if (shouldLike) return { ...prev, [product.id]: true };
      const next = { ...prev };
      delete next[product.id];
      return next;
    });

    setWishlistItems((items) => {
      if (shouldLike) {
        if (items.some((item) => item.id === product.id)) return items;
        return [...items, toWishlistItem(product)];
      }

      return items.filter((item) => item.id !== product.id);
    });

    if (!isLoggedIn()) {
      showToast(shouldLike ? `${product.title} ditambahkan ke wishlist` : `${product.title} dihapus dari wishlist`);
      return;
    }

    const productId = product.productId ?? product.id;
    if (productId === undefined || productId === null || productId === "") {
      showToast("Produk ini belum memiliki ID dari server");
      await loadWishlist({ quiet: true });
      return;
    }

    try {
      if (shouldLike) {
        await addToWishlist({ product_id: productId });
      } else {
        const existing = wishlistItems.find(
          (item) => String(item.productId ?? item.id) === String(productId)
        );
        if (existing?.wishlistItemId) {
          await removeFromWishlist(existing.wishlistItemId);
        }
      }
      await loadWishlist({ quiet: true });
      showToast(shouldLike ? `${product.title} ditambahkan ke wishlist` : `${product.title} dihapus dari wishlist`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memperbarui wishlist");
      await loadWishlist({ quiet: true });
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (!isLoggedIn()) {
      showToast("Silakan login terlebih dahulu untuk menambahkan produk");
      navigateTo("login");
      return;
    }

    const productId = product.productId ?? product.id;
    if (productId === undefined || productId === null || productId === "") {
      showToast("Produk ini belum memiliki ID dari server");
      return;
    }

    const existingItem = cartItems.find(
      (item) => String(item.productId ?? item.id) === String(productId)
    );
    const requestId = existingItem ? getCartItemRequestId(existingItem) : productId;
    const quantityToAdd = Math.max(1, Math.round(Number(quantity) || 1));

    setCartBusyId(requestId);
    try {
      if (existingItem && requestId !== undefined && requestId !== null && requestId !== "") {
        await updateCartItem(requestId, { quantity: existingItem.quantity + quantityToAdd });
      } else {
        await addCartItem({ product_id: productId, quantity: quantityToAdd });
      }
      await loadCart({ quiet: true });
      setAddedId(product.id);
      showToast(`${product.title} ditambahkan ke keranjang`);
      setTimeout(() => setAddedId((cur) => (cur === product.id ? null : cur)), 900);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menambahkan produk ke keranjang");
    } finally {
      setCartBusyId(null);
    }
  };

  const updateCartQuantity = async (item, nextQuantity) => {
    const itemId = getCartItemRequestId(item);
    if (itemId === undefined || itemId === null || itemId === "") {
      showToast("Item keranjang ini belum memiliki ID dari server");
      return;
    }

    if (nextQuantity <= 0) {
      await removeCartItem(item);
      return;
    }

    setCartBusyId(itemId);
    try {
      await updateCartItem(itemId, { quantity: nextQuantity });
      await loadCart({ quiet: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memperbarui jumlah item");
    } finally {
      setCartBusyId(null);
    }
  };

  const removeCartItem = async (product) => {
    const itemId = getCartItemRequestId(product);
    if (itemId === undefined || itemId === null || itemId === "") {
      showToast("Item keranjang ini belum memiliki ID dari server");
      return;
    }

    setCartBusyId(itemId);
    try {
      await deleteCartItem(itemId);
      await loadCart({ quiet: true });
      showToast(`${product.title} dihapus dari keranjang`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menghapus item dari keranjang");
    } finally {
      setCartBusyId(null);
    }
  };

  const clearAllCartItems = async () => {
    if (!cartItems.length || isClearingCart) return;

    setIsClearingCart(true);
    try {
      await clearCart();
      setCartItems([]);
      setCartError("");
      setSelectedCartItemIds(null);
      showToast("Keranjang berhasil dikosongkan");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal mengosongkan keranjang");
      await loadCart({ quiet: true });
    } finally {
      setIsClearingCart(false);
    }
  };

  const handleCheckout = useCallback(async () => {
    if (!isLoggedIn()) {
      showToast("Silakan login terlebih dahulu untuk checkout");
      navigateTo("login");
      return;
    }

    if (!selectedCartItems.length) {
      showToast("Pilih minimal satu item untuk checkout");
      return;
    }

    setIsCheckingOut(true);
    try {
      try {
        localStorage.removeItem("bkOrderId");
      } catch { }
      setPendingOrderId(null);
      showToast("Lanjut ke pembayaran");
      navigateTo("payment");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal membuka pembayaran");
    } finally {
      setIsCheckingOut(false);
    }
  }, [selectedCartItems, navigateTo, showToast]);

  const removeWishlistItem = async (product) => {
    const itemId = product.wishlistItemId ?? product.id;

    setWishlistItems((items) =>
      items.filter((item) => item.id !== product.id && item.wishlistItemId !== itemId)
    );
    setLiked((prev) => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });

    if (isLoggedIn()) {
      try {
        await removeFromWishlist(itemId);
        await loadWishlist({ quiet: true });
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Gagal menghapus item dari wishlist");
        await loadWishlist({ quiet: true });
      }
    }

    showToast(`${product.title} dihapus dari wishlist`);
  };

  const scrollToId = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

const productDetailId = getProductIdFromPath();
  const storeDetailId = getStoreIdFromPath();
  const categoryId = getCategoryIdFromPath();
  const categoryName = getCategoryNameFromUrl();
  const featuredVoucherCode = featuredVoucher?.code || "";
  const featuredVoucherName = isFeaturedVoucherLoading
    ? "Memuat voucher..."
    : featuredVoucher?.name || "Belum ada voucher aktif";
  const featuredVoucherDiscount = isFeaturedVoucherLoading
    ? "..."
    : featuredVoucher?.discountLabel || "-";
  const featuredVoucherExpiry = isFeaturedVoucherLoading
    ? "Memuat"
    : featuredVoucher?.displayEndsAt || "Belum tersedia";
  const featuredVoucherMinPurchase = featuredVoucher?.minPurchase
    ? formatRupiah(featuredVoucher.minPurchase)
    : "Tanpa minimum";
  const featuredVoucherStatusText = featuredVoucherError
    ? "Voucher belum bisa dimuat. Silakan coba lagi nanti."
    : featuredVoucher
      ? "Satu voucher aktif pilihan dengan masa berlaku paling panjang."
      : "Kami belum menemukan voucher aktif saat ini.";

  if (pageView === "login" || pageView === "register") {
    return (
      <AuthPage
        view={pageView}
        onSwitch={navigateTo}
        onBackHome={() => navigateTo("home")}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  if (pageView === "adminDashboard") {
    return <AdminDashboard onLogout={handleAdminLogout} onGoHome={() => navigateTo("home")} />;
  }

  if (pageView === "sellerDashboard") {
    return <SellerDashboard onLogout={handleUserLogout} onGoHome={() => navigateTo("home")} />;
  }

  if (pageView === "privacy" || pageView === "terms") {
    return (
      <LegalPage
        page={LEGAL_PAGES[pageView]}
        view={pageView}
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        navigateToProduct={navigateToProduct}
        navigateToStore={navigateToStore}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
      />
    );
  }

  if (pageView === "about") {
    return (
      <AboutPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
      />
    );
  }

  if (pageView === "faq") {
    return (
      <FaqPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
      />
    );
  }

  if (pageView === "contact") {
    return (
      <ContactPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
      />
    );
  }

  if (pageView === "blog") {
    return (
      <BlogPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
      />
    );
  }

  if (pageView === "search") {
    return (
      <SearchResultsPage
        query={searchQuery}
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        navigateToProduct={navigateToProduct}
        navigateToStore={navigateToStore}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
        onAdd={addToCart}
        addedId={addedId}
      />
    );
  }

  if (pageView === "productDetail") {
    return (
      <ProductDetailPage
        productId={productDetailId}
        products={serverProducts}
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        navigateToProduct={navigateToProduct}
        navigateToStore={navigateToStore}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
        onAdd={addToCart}
        onLike={toggleLike}
        liked={liked}
        addedId={addedId}
      />
    );
  }

  if (pageView === "storeDetail") {
    return (
      <StoreDetailPage
        storeId={storeDetailId}
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        navigateToProduct={navigateToProduct}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
        onAdd={addToCart}
        addedId={addedId}
      />
    );
  }

  if (pageView === "wishlist") {
    return (
      <WishlistPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onBack={goBack}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
        products={wishlistItems}
        onRemove={removeWishlistItem}
        onAdd={addToCart}
        addedId={addedId}
        isLoading={isWishlistLoading}
        error={wishlistError}
        onRetry={() => loadWishlist({})}
      />
    );
  }

  if (pageView === "cart") {
    return (
      <CartPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onBack={goBack}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
        items={cartItems}
        onAdd={addToCart}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeCartItem}
        onRetryCart={() => loadCart()}
        onClearCart={clearAllCartItems}
        selectedIds={selectedCartItemIds}
        onSelectItem={(id, checked) => {
          setSelectedCartItemIds((prev) => {
            const base = prev === null ? cartItems.map((item) => item.cartItemId) : prev;
            if (checked) {
              if (!base.includes(id)) return [...base, id];
              return base;
            }
            return base.filter((selectedId) => selectedId !== id);
          });
        }}
        onSelectAll={(checked) => {
          setSelectedCartItemIds(checked ? null : []);
        }}
        isLoading={isCartLoading}
        error={cartError}
        busyId={cartBusyId}
        isClearing={isClearingCart}
        onCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
      />
    );
  }

  if (pageView === "profile") {
    return (
      <ProfilePage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        onProfileUpdated={(user) => setAuthUser(user)}
        toast={toast}
      />
    );
  }

  if (pageView === "orders") {
    return (
<OrdersPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        navigateToProduct={navigateToProduct}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
        onPayOrder={(orderId) => {
          if (orderId) {
            setPendingOrderId(String(orderId));
            try {
              localStorage.setItem("bkOrderId", String(orderId));
            } catch { }
          }
          navigateTo("payment");
        }}
      />
    );
  }

  if (pageView === "addresses") {
    return (
      <AddressPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
      />
    );
  }

  if (pageView === "payment") {
    return (
      <PaymentPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
        items={selectedCartItems}
        checkoutItemIds={checkoutCartItemIds}
        orderId={pendingOrderId}
        onOrderCreated={(orderId) => {
          setPendingOrderId(orderId);
          try {
            localStorage.setItem("bkOrderId", orderId);
          } catch { }
        }}
onPaid={() => setPendingOrderId(null)}
      />
    );
  }

  if (pageView === "categories") {
    return (
      <AllCategoriesPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onBack={goBack}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
        onNavigateCategory={navigateToCategory}
      />
    );
  }

  if (pageView === "vouchers") {
    return (
      <VouchersPage
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onBack={goBack}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
      />
    );
  }

  if (pageView === "categoryProducts") {
    return (
      <CategoryProductsPage
        categoryId={categoryId}
        categoryName={categoryName}
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        navigateToProduct={navigateToProduct}
        onBack={goBack}
        onSearch={handleSearch}
        authUser={authUser}
        onLogout={handleUserLogout}
        toast={toast}
        onAdd={addToCart}
        onLike={toggleLike}
        liked={liked}
        addedId={addedId}
      />
    );
  }

  return (
    <div style={styles.page}>
      <GlobalStyle />

      {/* ---------------- Header (fixed, does not scroll away) ---------------- */}
      <SiteHeader
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onLogoClick={scrollToId("top")}
        authUser={authUser}
        onLogout={handleUserLogout}
      />

      {/* Spacer so content starts below the fixed header */}
      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      {/* ---------------------------- Hero ---------------------------- */}
      <section style={styles.hero} className="bk-hero">
        <FloatingCraftDots />
        <div style={styles.heroInner} className="bk-hero-inner">
          <Reveal delay={0.02}>
            <Typewriter
              text={"Selamat datang!\nMau bikin karya apa hari ini?"}
              style={{ ...styles.heroHeading, minHeight: "2.35em" }}
              startDelay={300}
            />
          </Reveal>
          <Reveal delay={0.12}>
            <p style={styles.heroSub}>Temukan bahan yang kamu cari dengan tepat produk yang mau kamu bikin.</p>
          </Reveal>
          <Reveal delay={0.22} y={16}>
            <SearchBar onSearch={handleSearch} />
          </Reveal>
        </div>
        <ScallopEdge />
      </section>

      {/* ------------------------- Categories ------------------------- */}
      <section style={styles.section} id="kategori">
        <div style={styles.sectionInner} className="bk-section-inner">
          <SectionHeader
            title="Kategori yang lagi populer"
            sub="Pilih kategori favoritmu untuk menemukan karya yang sesuai."
            action={
              <PillButton variant="outline" onClick={() => navigateTo("categories")}>
                Lihat Semua <ChevronRight size={16} />
              </PillButton>
            }
          />

          {isStorefrontLoading ? (
            <EmptyStorefrontState message="Memuat kategori..." />
          ) : serverCategories.length ? (
            <div style={styles.categoryGrid} className="bk-category-grid">
              {serverCategories.slice(0, 4).map((cat, i) => (
                <Reveal key={cat.id || cat.name} delay={i * 0.08} y={34}>
                  <CategoryCard cat={cat} onClick={() => navigateToCategory(cat)} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyStorefrontState message="Tidak ada kategori" />
          )}
        </div>
      </section>

      {/* -------------------------- Products --------------------------- */}
      <section style={{ ...styles.section, ...styles.productSection }} className="bk-product-section" id="produk">
        <div
          style={{ ...styles.sectionInner, ...styles.productSectionInner }}
          className="bk-section-inner bk-product-section-inner"
        >
          <SectionHeader
            title="Produk Terbaru"
            sub="Pilih karya yang paling sesuai dengan gaya dan kebutuhanmu."
            headerStyle={styles.productHeaderRow}
            titleStyle={styles.productSectionTitle}
            subStyle={styles.productSectionSub}
            actionStyle={styles.productSectionAction}
            action={
              <SortDropdown
                open={sortOpen}
                label={sortLabel}
                onToggle={() => setSortOpen((o) => !o)}
                onSelect={(l) => {
                  setSortLabel(l);
                  setSortOpen(false);
                }}
              />
            }
          />

          {isStorefrontLoading ? (
            <EmptyStorefrontState message="Memuat produk..." />
          ) : sortedProducts.length ? (
            <div style={styles.productGrid} className="bk-product-grid">
              {sortedProducts.map((p, i) => (
                <Reveal key={p.id} delay={(i % 5) * 0.06} y={30}>
                  <ProductCard
                    product={p}
                    liked={!!liked[p.id]}
                    onLike={() => toggleLike(p)}
                    onAdd={() => addToCart(p)}
                    onOpen={() => navigateToProduct(p)}
                    justAdded={addedId === p.id}
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyStorefrontState message="Tidak ada produk" />
          )}
        </div>
      </section>

      {/* ------------------------- Discount banner ------------------------- */}
      <section style={styles.discountSection} id="diskon">
        <div style={styles.discountInner} className="bk-discount-inner">
          <Reveal y={24} style={{ minWidth: 0 }}>
            <h2 style={styles.discountTitle}>Diskon Spesial</h2>
            <p style={styles.discountSub}>
              {featuredVoucherStatusText}
            </p>
            <div style={styles.discountBtnRow}>
              {featuredVoucher && (
                <PillButton
                  variant="light"
                  onClick={() => {
                    navigator.clipboard?.writeText(featuredVoucher.code).catch(() => { });
                    showToast(`Kode ${featuredVoucher.code} disalin!`);
                  }}
                >
                  <Tag size={16} /> Salin Kode
                </PillButton>
              )}
              <PillButton variant="outline" onClick={() => navigateTo("vouchers")}>
                <ReceiptText size={16} /> Lihat Semua Voucher
              </PillButton>
            </div>
          </Reveal>

          <Reveal delay={0.1} y={24} style={{ width: "100%" }}>
            <div
              style={styles.discountTicket}
              className="bk-discount-ticket bk-tilt"
              aria-label={featuredVoucher ? `Voucher diskon ${featuredVoucher.code}` : "Voucher diskon"}
            >
              <span style={styles.ticketSerrationLeft} aria-hidden="true" />
              <span style={styles.ticketSerrationRight} aria-hidden="true" />
              <div style={styles.ticketMain} className="bk-ticket-main">
                <div style={styles.ticketBody}>
                  <div style={styles.ticketMetaRow}>
                    <span style={styles.ticketChip}>Voucher Terbaru</span>
                    <span style={styles.ticketRoute}>
                      <ReceiptText size={14} strokeWidth={2.2} />
                      Promo BumiKriya
                    </span>
                  </div>
                  <span style={styles.ticketKicker}>Nama Voucher</span>
                  <strong style={styles.ticketValue} className="bk-ticket-value">{featuredVoucherDiscount}</strong>
                  <span style={styles.ticketLabel} className="bk-ticket-label">{featuredVoucherName}</span>
                  <div style={styles.ticketCodeWrap}>
                    <span style={styles.ticketCodeLabel}>Kode Voucher</span>
                    <strong style={styles.ticketCode} className="bk-ticket-code">{featuredVoucherCode || "BELUM ADA"}</strong>
                  </div>
                  <div style={styles.ticketDecorRow} className="bk-ticket-decor-row">
                    <span>
                      <span style={styles.ticketCodeLabel}>Masa Berlaku</span>
                      <strong>{featuredVoucherExpiry}</strong>
                    </span>
                    <span>
                      <span style={styles.ticketCodeLabel}>Min. Belanja</span>
                      <strong>{featuredVoucherMinPurchase}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.ticketStub} className="bk-ticket-stub" aria-hidden="true">
                <div style={styles.ticketStubTop}>KODE</div>
                <div style={styles.ticketBarcode} className="bk-ticket-barcode">
                  {Array.from({ length: 14 }).map((_, index) => (
                    <span
                      key={index}
                      className="bk-ticket-barcode-bar"
                      style={{
                        ...styles.ticketBarcodeBar,
                        width: index % 3 === 0 ? 5 : 3,
                        height: `${42 + (index % 4) * 10}px`,
                      }}
                    />
                  ))}
                </div>
                <div style={styles.ticketStubCode}>
                  {featuredVoucher?.discountType === "nominal" ? "Rp" : formatDiscountPercent(featuredVoucher?.discountValue || 0)}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------- Reviews --------------------------- */}
      <section style={styles.section} id="ulasan">
        <div style={styles.sectionInner} className="bk-section-inner">
          <SectionHeader title="Apa Kata Mereka" sub="Ulasan dari pelanggan yang telah menikmati karya pengrajin Indonesia." />
          <Reveal y={20}>
            <ReviewCarousel reviews={REVIEWS} />
          </Reveal>
        </div>
      </section>

      {/* ---------------------------- Footer ---------------------------- */}
      <SiteFooter showToast={showToast} navigateTo={navigateTo} />

      {/* ------------------------------ Toast ------------------------------ */}
      <div style={styles.toastHost} aria-live="polite">
        {toast && (
          <div style={styles.toast} className="bk-toast bk-toast-in">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
