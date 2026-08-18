/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ShoppingBasket,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Tag,
  ArrowRight,
  Minus,
  ReceiptText,
  Star,
  X,
  Plus,
  Search,
  Store,
  Truck,
  MapPin,
  ShieldCheck,
  UserRound,
  ImagePlus,
  Camera,
  CircleCheck,
  PencilLine,
  LogOut,
  Menu,
  ThumbsUp,
  HandHeart,
  Sparkles,
  Mail,
  Clock,
  MessageCircle,
  Send,
  HelpCircle,
  BookOpen,
  CalendarDays,
  User,
} from "lucide-react";
import { styles, FONT_DISPLAY } from "../../styles.js";
import { GlobalStyle } from "../../components/GlobalStyle.jsx";
import { ConfirmDialog } from "../../components/ConfirmDialog.jsx";
import LocationPickerMap from "../../components/LocationPickerMap.jsx";
import {
  createMyAddress,
  createCheckout,
  createPayment,
  createReview,
  deleteMyAddress,
  extractOrderId,
  fetchCurrentUserProfile,
  fetchMyAddresses,
  fetchMyOrder,
  fetchMyOrders,
  fetchProductCategories,
  fetchProductDetail,
  fetchProducts,
  fetchProductRating,
  fetchProductReviews,
  fetchSearchEverything,
  fetchSellerStore,
  fetchStoreDetail,
  fetchStoreProducts,
  fetchStoreReviews,
  fetchVouchers,
  followStore,
  registerSeller,
  resolveApiUrl,
  unfollowStore,
  updateCurrentUserProfile,
  updateMyAddress,
} from "../../lib/userApi.js";
import { getMidtransSnapEnvironment, loadMidtransSnap, resetMidtransSnap } from "../../lib/midtrans.js";
import {
  getStoredAuthUser,
  getSessionUser,
} from "../../lib/authApi.js";
import {
  WISHLIST_ACCENTS,
  TRENDING_SEARCHES,
  parseRupiah,
  formatRupiah,
  FOOTER_COLS,
  PRODUCT_FOOTER_CATEGORIES,
  SHIPPING_OPTIONS,
  pickVoucherNumber,
  formatVoucherDate,
  formatDiscountPercent,
  sortAvailableVouchers,
  normalizeAvailableVouchers,
  Reveal,
} from "../appHelpers.jsx";

import {
  isLoggedIn,
  isAdminSession,
  isSellerUser,
  PRODUCT_BG_COLORS,
  PRODUCT_DETAIL_PLACEHOLDER,
  STORE_BANNER_PLACEHOLDER,
  STORE_AVATAR_PLACEHOLDER,
  PRODUCT_DETAIL_ACCENTS,
  productDetailStyles,
  storeDetailStyles,
  normalizeCart,
  extractCartItems,
  normalizeCartItem,
  pickCartCategoryLabel,
  normalizeCartQuantity,
  getCartItemRequestId,
  normalizeWishlist,
  extractWishlistItems,
  normalizeWishlistItem,
  normalizeStorefront,
  normalizeProductDetail,
  collectSpecificationRows,
  specRowValue,
  collectCareInstructions,
  collectShippingInfo,
  pickProductDescription,
  extractProductDetailRecord,
  collectProductImages,
  collectProductTags,
  buildFullLocation,
  normalizeProductSeller,
  pickStoreId,
  pickNumberFromSources,
  resolveProductImage,
  formatStorefrontPrice,
  getViewFromPath,
  getProductIdFromPath,
  getStoreIdFromPath,
  getSearchQueryFromUrl,
  getCategoryIdFromPath,
  getCategoryNameFromUrl,
  normalizeSearchResults,
  softenAccent,
  USER_NAME_KEYS,
  USER_EMAIL_KEYS,
  USER_PHONE_KEYS,
  USER_AVATAR_KEYS,
  deepPick,
  pickDisplayName,
  pickEmail,
  pickPhone,
  buildProfilePhoneUpdatePayload,
  pickAvatar,
  NAME_CHANGE_COOLDOWN_MS,
  NAME_CHANGE_STORAGE_PREFIX,
  getNameChangeStorageKey,
  getLastNameChangeAt,
  recordNameChange,
  getNameChangeCooldown,
  formatDurationRemaining,
  formatChangedAtLabel,
  unwrapUserProfile,
  normalizeProfile,
  getProfileInitials,
  normalizeMembership,
  normalizeMembershipReward,
  normalizeProfileOrders,
  extractProfileOrderRows,
  extractBuyerOrderRows,
  unwrapBuyerOrderDetail,
  normalizeBuyerOrders,
  normalizeBuyerOrder,
  extractBuyerOrderItems,
  getBuyerOrderPaidAt,
  normalizeBuyerOrderItem,
  getBuyerOrderRequestId,
  pickStoreName,
  pickMoney,
  parseMoneyValue,
  getBuyerOrderCategory,
  formatBuyerOrderStatus,
  getBuyerOrderStatusStyle,
  formatBuyerOrderDate,
  formatOrderAddress,
  extractAddressRows,
  normalizeAddresses,
  normalizeAddress,
  formatAddressText,
  getAddressOptionLabel,
  getAddressFormDefaults,
  buildAddressPayload,
  buildCheckoutShippingAddress,
  clampPercent,
  formatMemberLevel,
  getDefaultMemberBenefits,
  formatOrderStatus,
  getProfileOrderAction,
  extractProductReviewRows,
  normalizeProductReviews,
  getBestProductReviews,
  pickReviewPhoto,
  normalizeRatingSummary,
  formatReviewDate,
  isOrderItemReviewed,
  markOrderItemReviewed
} from "./viewCore.jsx";
import {
  SiteHeader,
  SellerRegisterForm,
  TrendingSearchDropdown,
  HeaderSearch,
  FooterCol,
  SiteFooter,
  LegalWave,
  WishlistWave,
  SearchBar,
  EmptyStorefrontState,
  SectionHeader,
  PillButton,
  CategoryCard,
  BLOB_PATH,
  ProductCard,
  SortDropdown,
  ReviewCarousel,
  ReviewCard,
  StarRating,
  SocialIcon,
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  ScallopEdge,
  FloatingCraftDots
} from "./commonComponents.jsx";

function CategoryProductsPage({ categoryId, categoryName, scrolled, cartCount, wishCount, showToast, navigateTo, navigateToProduct, onBack, onSearch, toast, authUser, onLogout, onAdd, onLike, liked, addedId }) {
  const [products, setProducts] = useState([]);
  const [resolvedCategoryName, setResolvedCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");
    Promise.allSettled([
      fetchProducts({ signal: controller.signal }),
      fetchProductCategories({ signal: controller.signal }),
    ])
      .then(([productsResult, categoriesResult]) => {
        if (controller.signal.aborted) return;

        const productsRaw = productsResult.status === "fulfilled" ? productsResult.value : [];
        const categoriesRaw = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
        const categories = normalizeCategories(categoriesRaw);
        const resolved = resolveCategoryMatch(categories, categoryId, categoryName);

        setResolvedCategoryName(resolved.name || categoryName || "");
        setProducts(normalizeCategoryProducts(productsRaw, categoryId, categoryName, categories));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResolvedCategoryName(categoryName || "");
        setError(err instanceof Error ? err.message : "Gagal memuat produk.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [categoryId, categoryName]);

  const title = resolvedCategoryName || categoryName || "Kategori";

  return (
    <div style={styles.page}>
      <GlobalStyle />

      <SiteHeader
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={onSearch}
        authUser={authUser}
        onLogout={onLogout}
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={styles.categoriesMain} className="bk-categories-main">
        <div style={styles.categoriesInner}>
          <button type="button" style={styles.wishlistBack} className="bk-wishlist-back" onClick={onBack}>
            <ChevronLeft size={25} strokeWidth={3} />
            Kembali
          </button>

          <h1 style={styles.categoriesTitle}>{title}</h1>
          <p style={styles.categoriesSub}>Produk yang sesuai dengan kategori {title}.</p>

          {error ? (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Gagal memuat produk</h2>
              <p style={styles.wishlistEmptyText}>{error}</p>
              <PillButton variant="solid" onClick={() => navigateTo("home")} style={styles.cartEmptyButton}>
                Kembali ke Beranda
              </PillButton>
            </section>
          ) : isLoading && products.length === 0 ? (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Memuat produk...</h2>
              <p style={styles.wishlistEmptyText}>Sebentar ya, kami sedang mengambil produk dari server.</p>
            </section>
          ) : products.length > 0 ? (
            <div style={styles.productGrid} className="bk-product-grid">
              {products.map((p, i) => (
                <Reveal key={p.id} delay={(i % 5) * 0.06} y={30}>
                  <ProductCard
                    product={p}
                    liked={!!liked[p.id]}
                    onLike={() => onLike(p)}
                    onAdd={() => onAdd(p)}
                    onOpen={() => navigateToProduct(p)}
                    justAdded={addedId === p.id}
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Belum ada produk</h2>
              <p style={styles.wishlistEmptyText}>Belum ada produk pada kategori {title}.</p>
              <PillButton variant="solid" onClick={() => navigateTo("home")} style={styles.cartEmptyButton}>
                Kembali ke Beranda
              </PillButton>
            </section>
          )}

          <WishlistWave />
        </div>
      </main>

      <SiteFooter showToast={showToast} navigateTo={navigateTo} />

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

function AllCategoriesPage({ scrolled, cartCount, wishCount, showToast, navigateTo, onBack, onSearch, toast, authUser, onLogout, onNavigateCategory }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");
    fetchProductCategories({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setCategories(normalizeCategories(data));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Gagal memuat kategori.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <div style={styles.page}>
      <GlobalStyle />

      <SiteHeader
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={onSearch}
        authUser={authUser}
        onLogout={onLogout}
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={styles.categoriesMain} className="bk-categories-main">
        <div style={styles.categoriesInner}>
          <button type="button" style={styles.wishlistBack} className="bk-wishlist-back" onClick={onBack}>
            <ChevronLeft size={25} strokeWidth={3} />
            Kembali
          </button>

          <h1 style={styles.categoriesTitle}>Semua Kategori</h1>
          <p style={styles.categoriesSub}>Temukan semua kategori karya yang tersedia di BumiKriya.</p>

          {error ? (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Gagal memuat kategori</h2>
              <p style={styles.wishlistEmptyText}>{error}</p>
              <PillButton variant="solid" onClick={() => navigateTo("home")} style={styles.cartEmptyButton}>
                Kembali ke Beranda
              </PillButton>
            </section>
          ) : isLoading && categories.length === 0 ? (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Memuat kategori...</h2>
              <p style={styles.wishlistEmptyText}>Sebentar ya, kami sedang mengambil kategori dari server.</p>
            </section>
          ) : categories.length > 0 ? (
            <div style={styles.categoriesGrid} className="bk-categories-grid">
              {categories.map((cat, index) => (
                <Reveal key={cat.id || cat.name || `cat-${index}`} delay={(index % 4) * 0.06} y={28}>
                  <AllCategoryCard cat={cat} onClick={() => onNavigateCategory?.(cat)} />
                </Reveal>
              ))}
            </div>
          ) : (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Belum ada kategori</h2>
              <p style={styles.wishlistEmptyText}>Belum ada kategori yang tersedia dari server.</p>
              <PillButton variant="solid" onClick={() => navigateTo("home")} style={styles.cartEmptyButton}>
                Kembali ke Beranda
              </PillButton>
            </section>
          )}

          <WishlistWave />
        </div>
      </main>

      <SiteFooter showToast={showToast} navigateTo={navigateTo} />

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

const VOUCHER_CARD_STYLES = {
  main: {
    position: "relative",
    minWidth: 0,
    background: "#fff",
    border: "2.5px solid #17110f",
    borderRadius: 20,
    padding: "26px 26px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    boxShadow: "0 24px 42px -30px rgba(47,30,26,0.58)",
    overflow: "hidden",
  },
  ribbon: {
    position: "absolute",
    top: 0,
    right: 0,
    background: "#b72d64",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
    padding: "8px 14px",
    borderBottomLeftRadius: 14,
  },
  value: {
    fontFamily: FONT_DISPLAY,
    fontSize: 44,
    lineHeight: 1,
    color: "#17110f",
    letterSpacing: 0,
  },
  name: {
    color: "#2f1e1a",
    fontSize: 19,
    fontWeight: 900,
    lineHeight: 1.25,
    maxWidth: "100%",
    overflowWrap: "anywhere",
    minHeight: 48,
  },
  codeBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px dashed #17110f",
    background: "#fff7ef",
  },
  codeBoxLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  codeLabel: {
    color: "#6f5850",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  code: {
    color: "#2f1e1a",
    fontSize: 17,
    fontWeight: 900,
    letterSpacing: 0,
    overflowWrap: "anywhere",
  },
  copyButton: {
    flexShrink: 0,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(180deg, #bd2f68 0%, #a82a59 100%)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    padding: "0 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  metaLabel: {
    color: "#6f5850",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  metaValue: {
    color: "#2f1e1a",
    fontSize: 14,
    fontWeight: 700,
  },
};

function VoucherCard({ voucher, onCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(voucher.code).catch(() => {});
    onCopy?.(voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article style={VOUCHER_CARD_STYLES.main} className="bk-voucher-card">
      <span
        style={{
          ...VOUCHER_CARD_STYLES.ribbon,
          background: voucher.isActiveNow ? "#b72d64" : "#8a7a71",
        }}
      >
        {voucher.isActiveNow ? "Aktif" : "Tidak Aktif"}
      </span>

      <div style={VOUCHER_CARD_STYLES.metaRow}>
        <span style={VOUCHER_CARD_STYLES.metaItem}>
          <span style={VOUCHER_CARD_STYLES.metaLabel}>Jenis Diskon</span>
          <span style={VOUCHER_CARD_STYLES.metaValue}>
            {voucher.discountType === "nominal" ? "Nominal" : "Persen"}
          </span>
        </span>
      </div>

      <strong style={VOUCHER_CARD_STYLES.value}>{voucher.discountLabel}</strong>
      <p style={VOUCHER_CARD_STYLES.name}>{voucher.name}</p>

      <div style={VOUCHER_CARD_STYLES.codeBox}>
        <span style={VOUCHER_CARD_STYLES.codeBoxLeft}>
          <span style={VOUCHER_CARD_STYLES.codeLabel}>Kode Voucher</span>
          <strong style={VOUCHER_CARD_STYLES.code}>{voucher.code}</strong>
        </span>
        <button
          type="button"
          style={VOUCHER_CARD_STYLES.copyButton}
          className="bk-voucher-copy"
          onClick={handleCopy}
          aria-label={`Salin kode voucher ${voucher.code}`}
        >
          <Tag size={14} strokeWidth={2.4} />
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>

      <div style={VOUCHER_CARD_STYLES.metaRow}>
        <span style={VOUCHER_CARD_STYLES.metaItem}>
          <span style={VOUCHER_CARD_STYLES.metaLabel}>Min. Belanja</span>
          <span style={VOUCHER_CARD_STYLES.metaValue}>
            {voucher.minPurchase ? formatRupiah(voucher.minPurchase) : "Tanpa minimum"}
          </span>
        </span>
        <span style={VOUCHER_CARD_STYLES.metaItem}>
          <span style={VOUCHER_CARD_STYLES.metaLabel}>Masa Berlaku</span>
          <span style={VOUCHER_CARD_STYLES.metaValue}>{voucher.displayEndsAt}</span>
        </span>
      </div>
    </article>
  );
}

function VouchersPage({ scrolled, cartCount, wishCount, showToast, navigateTo, onBack, onSearch, toast, authUser, onLogout }) {
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");
    fetchVouchers({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setVouchers(sortAvailableVouchers(normalizeAvailableVouchers(data)));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Gagal memuat voucher.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <div style={styles.page}>
      <GlobalStyle />

      <SiteHeader
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={onSearch}
        authUser={authUser}
        onLogout={onLogout}
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={styles.categoriesMain} className="bk-categories-main">
        <div style={styles.categoriesInner}>
          <button type="button" style={styles.wishlistBack} className="bk-wishlist-back" onClick={onBack}>
            <ChevronLeft size={25} strokeWidth={3} />
            Kembali
          </button>

          <h1 style={styles.categoriesTitle}>Semua Voucher</h1>
          <p style={styles.categoriesSub}>
            Temukan semua voucher diskon yang tersedia di BumiKriya. Salin kodenya lalu gunakan saat checkout.
          </p>

          {error ? (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Gagal memuat voucher</h2>
              <p style={styles.wishlistEmptyText}>{error}</p>
              <PillButton variant="solid" onClick={() => navigateTo("home")} style={styles.cartEmptyButton}>
                Kembali ke Beranda
              </PillButton>
            </section>
          ) : isLoading && vouchers.length === 0 ? (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Memuat voucher...</h2>
              <p style={styles.wishlistEmptyText}>Sebentar ya, kami sedang mengambil voucher dari server.</p>
            </section>
          ) : vouchers.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 24,
              }}
              className="bk-vouchers-grid"
            >
              {vouchers.map((voucher, index) => (
                <Reveal key={voucher.code} delay={(index % 3) * 0.06} y={28}>
                  <VoucherCard
                    voucher={voucher}
                    onCopy={(code) => showToast(`Kode ${code} disalin!`)}
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Belum ada voucher</h2>
              <p style={styles.wishlistEmptyText}>Belum ada voucher yang tersedia dari server.</p>
              <PillButton variant="solid" onClick={() => navigateTo("home")} style={styles.cartEmptyButton}>
                Kembali ke Beranda
              </PillButton>
            </section>
          )}

          <WishlistWave />
        </div>
      </main>

      <SiteFooter showToast={showToast} navigateTo={navigateTo} />

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

function AllCategoryCard({ cat, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <article
      role="button"
      tabIndex={0}
      style={{ ...styles.categoriesCard, cursor: "pointer" }}
      className="bk-category-card"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Kategori ${cat.name}`}
    >
      {cat.img && !imgFailed && (
        <img
          src={cat.img}
          alt={cat.name}
          style={styles.categoryImg}
          loading="lazy"
          className="bk-cat-img"
          onError={() => setImgFailed(true)}
        />
      )}
      <div style={styles.categoryOverlay} />
      <div style={styles.categoriesCardText}>
        <span style={styles.categoriesCardName}>{cat.name}</span>
        {cat.description ? <span style={styles.categoriesCardDesc}>{cat.description}</span> : null}
      </div>
    </article>
  );
}

function unwrapCatalogCollection(raw, keys) {
  const candidates = [
    raw,
    raw?.data,
    raw?.result,
    raw?.payload,
    raw?.value,
    raw?.values,
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

function normalizeCategories(raw) {
  const source = unwrapCatalogCollection(raw, [
    "categories",
    "category",
    "kategori",
    "items",
    "list",
    "data",
    "value",
    "values",
    "rows",
    "results",
  ]);

  return source
    .map((item) => ({
      id: item.id ?? item.uuid ?? item.category_id ?? item.categoryId ?? item._id ?? null,
      name: item.name || item.title || item.category_name || item.categoryName || item.nama_kategori || item.kategori || "Kategori",
      description:
        item.description ||
        item.desc ||
        item.about ||
        item.category_description ||
        item.categoryDescription ||
        item.deskripsi ||
        "",
      img:
        resolveApiUrl(item.img) ||
        resolveApiUrl(item.image) ||
        resolveApiUrl(item.image_url) ||
        resolveApiUrl(item.imageUrl) ||
        resolveApiUrl(item.photo) ||
        resolveApiUrl(item.thumbnail) ||
        "",
      isActive: item.is_active !== false,
    }))
    .filter((item) => item.name && item.isActive);
}

function getProductCategoryFields(item) {
  const cat = typeof item?.category === "object" && item.category ? item.category : {};
  return {
    id:
      item?.category_id ??
      item?.categoryId ??
      item?.product_category_id ??
      item?.productCategoryId ??
      cat.id ??
      cat.uuid ??
      cat.category_id ??
      cat.categoryId ??
      cat._id ??
      "",
    names: [
      item?.category_name,
      item?.categoryName,
      item?.nama_kategori,
      item?.kategori,
      item?.category_label,
      item?.badge,
      typeof item?.category === "string" ? item.category : "",
      cat.name,
      cat.title,
      cat.category_name,
      cat.categoryName,
      cat.nama_kategori,
    ].filter((value) => typeof value === "string" && value.trim() !== ""),
  };
}

function pickCategoryFields(item) {
  return getProductCategoryFields(item);
}

function slugifyCategory(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function isGenericCategoryLabel(value) {
  const label = String(value || "").trim().toLowerCase();
  return !label || label === "kriya" || label === "kategori" || label === "produk";
}

function productMatchesCategory(item, categoryId, categoryName) {
  const fields = getProductCategoryFields(item);
  const id = String(categoryId || "").trim().toLowerCase();
  if (id) {
    const rawId = String(fields.id ?? "").trim().toLowerCase();
    if (rawId === id) return true;
  }
  const needle = String(categoryName || "").trim().toLowerCase();
  if (needle) {
    const needleSlug = slugifyCategory(needle);
    return fields.names.some((name) => {
      const normalizedName = String(name).trim().toLowerCase();
      return normalizedName === needle || slugifyCategory(normalizedName) === needleSlug;
    });
  }
  return false;
}

function resolveCategoryMatch(categories, categoryId, categoryName) {
  const list = Array.isArray(categories) ? categories : [];
  const idNeedle = String(categoryId || "").trim().toLowerCase();
  const nameNeedle = String(categoryName || "").trim().toLowerCase();
  const slugNeedle = slugifyCategory(categoryName) || idNeedle;

  const matched = list.find((cat) => {
    const catId = String(cat.id ?? cat.uuid ?? cat.category_id ?? cat.categoryId ?? "").trim().toLowerCase();
    const catName = String(cat.name || cat.title || cat.category_name || cat.nama_kategori || cat.kategori || "").trim();
    return (
      (catId && catId === idNeedle) ||
      (catName && catName.toLowerCase() === nameNeedle) ||
      (catName && catName.toLowerCase() === idNeedle) ||
      (catName && slugifyCategory(catName) === slugNeedle) ||
      (catName && slugifyCategory(catName) === idNeedle)
    );
  });

  return {
    id: matched ? String(matched.id ?? matched.uuid ?? matched.category_id ?? matched.categoryId ?? "") : "",
    name: matched ? String(matched.name || matched.title || matched.category_name || matched.nama_kategori || matched.kategori || "") : "",
  };
}

function normalizeCategoryProducts(rawProducts, categoryId, categoryName, categories) {
  const source = unwrapCatalogCollection(rawProducts, [
    "products",
    "items",
    "list",
    "data",
    "value",
    "values",
    "rows",
    "results",
  ]);

  const resolved = resolveCategoryMatch(categories, categoryId, categoryName);
  const resolvedId = resolved.id || String(categoryId || "").trim();
  const resolvedName = resolved.name || categoryName || "";

  return source
    .filter((item) => productMatchesCategory(item, resolvedId, resolvedName))
    .map((item, index) => {
      const categoryFields = getProductCategoryFields(item);
      const badgeText = typeof item.badge === "string" ? item.badge.trim() : "";
      const directCategoryName = categoryFields.names.find((name) => !isGenericCategoryLabel(name));
      const categoryLabel =
        directCategoryName ||
        (!isGenericCategoryLabel(resolvedName) ? resolvedName : "") ||
        (!isGenericCategoryLabel(badgeText) ? badgeText : "") ||
        resolvedName ||
        badgeText ||
        "Kategori";

      return {
        id: item.id ?? item.uuid ?? item.product_id ?? item.productId ?? item._id ?? `product-${index + 1}`,
        storeId: pickStoreId(item),
        categoryId: categoryFields.id || resolvedId,
        title: item.title || item.name || item.product_name || item.nama_produk || "Produk",
        price: formatStorefrontPrice(
          item.price ?? item.harga ?? item.selling_price ?? item.sale_price ?? item.price_value
        ),
        badge: categoryLabel,
        img: resolveProductImage(item),
        bg: item.bg || PRODUCT_BG_COLORS[index % PRODUCT_BG_COLORS.length],
      };
    })
    .filter((item) => item.title);
}

function WishlistPage({ scrolled, cartCount, wishCount, showToast, navigateTo, onBack, onSearch, toast, products, onRemove, onAdd, addedId, authUser, onLogout, isLoading, error, onRetry }) {
  return (
    <div style={styles.page}>
      <GlobalStyle />

      <SiteHeader
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        showToast={showToast}
        navigateTo={navigateTo}
        onSearch={onSearch}
        authUser={authUser}
        onLogout={onLogout}
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={styles.wishlistMain} className="bk-wishlist-main">
        <div style={styles.wishlistInner}>
          <button type="button" style={styles.wishlistBack} className="bk-wishlist-back" onClick={onBack}>
            <ChevronLeft size={25} strokeWidth={3} />
            Kembali
          </button>

          <h1 style={styles.wishlistTitle}>Your Wishlist</h1>

          {error ? (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Gagal memuat wishlist</h2>
              <p style={styles.wishlistEmptyText}>{error}</p>
              <PillButton variant="solid" onClick={onRetry} style={styles.cartEmptyButton}>
                Retry
              </PillButton>
            </section>
          ) : isLoading && products.length === 0 ? (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Memuat wishlist...</h2>
              <p style={styles.wishlistEmptyText}>Sebentar ya, kami sedang mengambil wishlist dari server.</p>
            </section>
          ) : products.length > 0 ? (
            <div style={styles.wishlistGrid} className="bk-wishlist-grid">
              {products.map((product, index) => (
                <Reveal key={product.id} delay={(index % 4) * 0.04} y={24}>
                  <WishlistCard
                    product={product}
                    onRemove={() => onRemove(product)}
                    onAdd={() => onAdd(product)}
                    justAdded={addedId === product.id}
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <section style={styles.wishlistEmpty}>
              <h2 style={styles.wishlistEmptyTitle}>Wishlist kamu masih kosong</h2>
              <p style={styles.wishlistEmptyText}>Simpan karya favorit dari halaman produk, lalu koleksinya akan muncul di sini.</p>
              <PillButton variant="solid" onClick={() => navigateTo("home")}>
                Jelajahi Produk
              </PillButton>
            </section>
          )}

          <WishlistWave />
        </div>
      </main>

      <SiteFooter showToast={showToast} navigateTo={navigateTo} />

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

function WishlistCard({ product, onRemove, onAdd, justAdded }) {
  return (
    <article style={styles.wishlistCard} className="bk-wishlist-card">
      <div
        style={{
          ...styles.wishlistImageWrap,
          borderColor: product.accent,
          boxShadow: `10px 12px 0 ${softenAccent(product.accent)}`,
        }}
      >
        <img
          src={product.img}
          alt={product.title}
          style={styles.wishlistImage}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <button
          type="button"
          style={styles.wishlistRemove}
          className="bk-wishlist-remove"
          aria-label={`Hapus ${product.title} dari wishlist`}
          onClick={onRemove}
        >
          <X size={18} strokeWidth={2.1} />
        </button>
        {product.label && <span style={styles.wishlistNewBadge}>{product.label}</span>}
      </div>

      <h2 style={styles.wishlistProductTitle}>{product.title}</h2>
      <p style={styles.wishlistPrice}>{product.price}</p>
      <button type="button" style={styles.wishlistAddButton} className="bk-wishlist-add" onClick={onAdd}>
        <Plus size={15} strokeWidth={2.6} />
        {justAdded ? "Ditambahkan" : "Tambah"}
      </button>
    </article>
  );
}

export {
  CategoryProductsPage,
  AllCategoriesPage,
  VOUCHER_CARD_STYLES,
  VoucherCard,
  VouchersPage,
  AllCategoryCard,
  normalizeCategories,
  slugifyCategory,
  productMatchesCategory,
  resolveCategoryMatch,
  normalizeCategoryProducts,
  WishlistPage,
  WishlistCard
};
