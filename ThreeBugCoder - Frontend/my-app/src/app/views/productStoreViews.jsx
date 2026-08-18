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
  fetchProductRating,
  fetchProductReviews,
  fetchRecipeDetail,
  fetchSearchEverything,
  fetchSellerStore,
  fetchStoreDetail,
  fetchStoreProducts,
  fetchStoreReviews,
  fetchUserDashboard,
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
  normalizeSearchRecipe,
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

function mergeSearchProducts(relatedProducts, searchProducts) {
  const merged = [];
  const seen = new Set();
  const push = (product) => {
    if (!product || !product.title) return;
    const id = String(product.productId ?? product.id);
    if (!id || seen.has(id)) return;
    seen.add(id);
    merged.push(product);
  };
  (Array.isArray(relatedProducts) ? relatedProducts : []).forEach(push);
  (Array.isArray(searchProducts) ? searchProducts : []).forEach(push);
  return merged;
}

function normalizeRecipeDetailForSearch(raw, fallbackRecipe) {
  const source =
    raw?.data?.data ||
    raw?.data ||
    raw?.result?.data ||
    raw?.result ||
    raw?.payload?.data ||
    raw?.payload ||
    raw ||
    {};
  const detailRecipe = normalizeSearchRecipe(source, 0);
  const materials = detailRecipe.materials.length
    ? detailRecipe.materials
    : fallbackRecipe.materials;

  return {
    ...fallbackRecipe,
    title: detailRecipe.title || fallbackRecipe.title,
    description: detailRecipe.description || fallbackRecipe.description,
    img: detailRecipe.img || fallbackRecipe.img,
    materials,
    relatedProducts: mergeSearchProducts(detailRecipe.relatedProducts, fallbackRecipe.relatedProducts),
  };
}

function SearchRecipeFeature({ recipe, products }) {
  const materials = Array.isArray(recipe.materials) ? recipe.materials : [];
  const matchedProducts = Array.isArray(products) ? products : [];

  return (
    <div style={styles.searchFeatureGrid} className="bk-search-feature bk-search-feature-grid">
      <div style={styles.searchImageFrame} className="bk-search-image-frame">
        <img
          src={recipe.img}
          alt={recipe.title}
          style={styles.searchFeatureImage}
          className="bk-search-feature-image"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = PRODUCT_DETAIL_PLACEHOLDER;
          }}
        />
      </div>

      <div style={styles.searchProjectCard} className="bk-search-project-card">
        <h2 style={styles.searchProjectTitle} className="bk-search-project-title">
          {recipe.title}
        </h2>
        {recipe.description && (
          <p style={styles.searchProjectText} className="bk-search-project-text">
            {recipe.description}
          </p>
        )}
        {materials.length > 0 && (
          <>
            <h3 style={styles.searchMaterialsTitle} className="bk-search-materials-title">
              Bahan Yang Diperlukan:
            </h3>
            <ul style={styles.searchMaterialsList} className="bk-search-materials-list">
              {materials.map((material, index) => (
                <li
                  key={`${material.name || ""}-${index}`}
                  style={styles.searchMaterialItem}
                  className="bk-search-material-item"
                >
                  <Star
                    size={13}
                    strokeWidth={2.4}
                    fill="#2f1e1a"
                    color="#2f1e1a"
                    style={styles.searchMaterialIcon}
                    aria-hidden="true"
                  />
                  <span>
                    {material.note
                      ? `${material.name} - ${material.note}`
                      : material.name}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        {matchedProducts.length > 0 && (
          <p style={styles.searchProjectText} className="bk-search-project-matched">
            {matchedProducts.length} produk tersedia untuk resep ini di bawah.
          </p>
        )}
      </div>
    </div>
  );
}

function SearchResultsPage({
  query,
  scrolled,
  cartCount,
  wishCount,
  showToast,
  navigateTo,
  navigateToProduct,
  navigateToStore,
  onSearch,
  toast,
  onAdd,
  addedId,
  authUser,
  onLogout,
}) {
  const [results, setResults] = useState({ products: [], stores: [], recipes: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const displayQuery = query || "Search";

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ products: [], stores: [], recipes: [] });
      setError("");
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    fetchSearchEverything(trimmed, { signal: controller.signal })
      .then(async (data) => {
        const normalizedResults = normalizeSearchResults(data);
        const firstRecipe = normalizedResults.recipes[0];
        const recipeId = firstRecipe?.id ? String(firstRecipe.id) : "";

        if (recipeId && !recipeId.startsWith("search-recipe-")) {
          try {
            const recipeDetail = await fetchRecipeDetail(recipeId, { signal: controller.signal });
            normalizedResults.recipes[0] = normalizeRecipeDetailForSearch(recipeDetail, firstRecipe);
          } catch {
            // Search results are still useful even when the detail endpoint is unavailable.
          }
        }

        if (!controller.signal.aborted) setResults(normalizedResults);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setResults({ products: [], stores: [], recipes: [] });
          setError(err instanceof Error ? err.message : "Gagal memuat hasil pencarian.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [query]);

  const hasStores = results.stores.length > 0;
  const featuredRecipe = results.recipes[0] || null;
  const displayedProducts = useMemo(
    () => mergeSearchProducts(featuredRecipe?.relatedProducts || [], results.products),
    [featuredRecipe, results.products]
  );
  const hasProducts = displayedProducts.length > 0;
  const hasRecipes = results.recipes.length > 0;
  const hasMoreRecipes = results.recipes.length > (featuredRecipe ? 1 : 0);
  const hasResults = hasStores || hasProducts || hasRecipes;

  return (
    <div style={styles.page}>
      <GlobalStyle />

      <SiteHeader
        scrolled={scrolled}
        cartCount={cartCount}
        wishCount={wishCount}
        navigateTo={navigateTo}
        onSearch={onSearch}
        authUser={authUser}
        onLogout={onLogout}
        showToast={showToast}
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={styles.searchMain}>
        <section style={styles.searchHero} className="bk-search-hero">
          <div style={styles.searchResultBlob} aria-hidden="true" />

          <div style={styles.searchTitleRow} className="bk-search-title-row">
            <h1 style={styles.searchTitle} className="bk-search-title">
              Hasil: <span style={styles.searchQueryBox} className="bk-search-query-box">{displayQuery}</span>
            </h1>
          </div>

          {isLoading && <div style={styles.searchStateBox}>Mencari hasil terbaik...</div>}
          {!isLoading && error && <div style={styles.searchStateBox}>{error}</div>}
          {!isLoading && !error && !hasResults && (
            <div style={styles.searchStateBox}>
              data tidak ditemukan
            </div>
          )}

          {!isLoading && !error && hasStores && (
            <div style={styles.searchStoreGrid} className="bk-search-store-grid">
              {results.stores.map((store, index) => (
                <SearchStoreCard
                  key={store.id}
                  store={store}
                  onOpen={() => navigateToStore(store)}
                />
              ))}
            </div>
          )}

          {!isLoading && !error && featuredRecipe && (
            <SearchRecipeFeature recipe={featuredRecipe} products={displayedProducts} />
          )}

          <SearchResultWave />
        </section>

        {!isLoading && !error && hasProducts && (
        <section style={styles.relatedSection}>
          <div style={styles.searchSectionInner} className="bk-search-section-inner">
            <div style={styles.relatedTitleRow}>
              <RelatedIcon />
              <h2 style={styles.relatedTitle}>
                {hasStores ? "Produk dari hasil pencarian" : "Barang yang cocok"}
              </h2>
            </div>

            <div style={styles.searchProductGrid} className="bk-search-product-grid">
              {displayedProducts.map((product, index) => (
                <Reveal key={product.id} delay={(index % 3) * 0.06} y={28}>
                  <ProductDetailMoreCard
                    product={product}
                    accent={PRODUCT_DETAIL_ACCENTS[index % PRODUCT_DETAIL_ACCENTS.length]}
                    onOpen={() => navigateToProduct(product)}
                    onAdd={() => onAdd(product)}
                    justAdded={addedId === product.id}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        )}

        {!isLoading && !error && hasMoreRecipes && (
          <section style={styles.searchRecipesSection}>
            <div style={styles.searchSectionInner} className="bk-search-section-inner">
              <div style={styles.relatedTitleRow}>
                <Sparkles size={29} strokeWidth={2.4} color="#d7ad00" />
                <h2 style={styles.relatedTitle}>Inspirasi recipe</h2>
              </div>
              <div style={styles.searchRecipeGrid} className="bk-search-recipe-grid">
                {results.recipes.slice(featuredRecipe ? 1 : 0).map((recipe, index) => (
                  <Reveal key={recipe.id} delay={(index % 3) * 0.06} y={24}>
                    <article style={styles.searchRecipeCard} className="bk-search-recipe-card">
                      <img src={recipe.img} alt={recipe.title} style={styles.searchRecipeImage} loading="lazy" />
                      <div style={styles.searchRecipeCopy}>
                        <h3 style={styles.searchRecipeTitle}>{recipe.title}</h3>
                        {recipe.description && <p style={styles.searchRecipeText}>{recipe.description}</p>}
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}
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

function StoreDetailPage({
  storeId,
  scrolled,
  cartCount,
  wishCount,
  showToast,
  navigateTo,
  navigateToProduct,
  onSearch,
  toast,
  onAdd,
  addedId,
  authUser,
  onLogout,
}) {
  const [rawStore, setRawStore] = useState(null);
  const [rawProducts, setRawProducts] = useState(null);
  const [rawReviews, setRawReviews] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowed, setIsFollowed] = useState(false);
  const [isFollowBusy, setIsFollowBusy] = useState(false);

  useEffect(() => {
    if (!storeId) {
      setIsLoading(false);
      setError("Toko tidak ditemukan.");
      return undefined;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError("");
    setRawStore(null);
    setRawProducts(null);
    setRawReviews(null);

    Promise.allSettled([
      fetchStoreDetail(storeId, { signal: controller.signal }),
      fetchStoreProducts(storeId, { signal: controller.signal }),
      fetchStoreReviews(storeId, { signal: controller.signal }),
    ])
      .then(([storeResult, productsResult, reviewsResult]) => {
        if (controller.signal.aborted) return;

        if (storeResult.status === "rejected") throw storeResult.reason;
        setRawStore(storeResult.value);
        setRawProducts(productsResult.status === "fulfilled" ? productsResult.value : null);
        setRawReviews(reviewsResult.status === "fulfilled" ? reviewsResult.value : null);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Gagal memuat profil toko.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [storeId]);

  const store = normalizeStoreDetail(rawStore, rawProducts, rawReviews, storeId);

  useEffect(() => {
    setIsFollowed(store.isFollowed);
  }, [store.isFollowed, store.id]);

  const handleFollow = async () => {
    if (!storeId || isFollowBusy) return;
    if (!isLoggedIn()) {
      showToast("Silakan login terlebih dahulu untuk follow toko");
      navigateTo("login");
      return;
    }

    const nextFollowed = !isFollowed;
    setIsFollowBusy(true);
    setIsFollowed(nextFollowed);

    try {
      if (nextFollowed) {
        await followStore(storeId);
        showToast(`Kamu mengikuti ${store.name}`);
      } else {
        await unfollowStore(storeId);
        showToast(`Berhenti mengikuti ${store.name}`);
      }
    } catch (err) {
      setIsFollowed(!nextFollowed);
      showToast(err instanceof Error ? err.message : "Gagal memperbarui follow toko.");
    } finally {
      setIsFollowBusy(false);
    }
  };

  const stats = buildStoreStats(store);
  const ruleItems = buildStoreRuleItems(store);

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
        compactActions
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={storeDetailStyles.main}>
        <section style={storeDetailStyles.inner} className="bk-store-detail-inner">
          <button
            type="button"
            style={storeDetailStyles.backButton}
            className="bk-store-detail-back"
            onClick={() => navigateTo("home")}
          >
            &lt; Kembali
          </button>

          {!storeId ? (
            <div style={storeDetailStyles.stateBox}>Toko tidak ditemukan.</div>
          ) : (
            <>
              <section style={storeDetailStyles.hero} className="bk-store-detail-hero">
                <img
                  src={store.banner}
                  alt=""
                  style={storeDetailStyles.heroImage}
                  loading="eager"
                  onError={(event) => {
                    event.currentTarget.src = STORE_BANNER_PLACEHOLDER;
                  }}
                />
                <div style={storeDetailStyles.heroBlob} aria-hidden="true" />
                <div style={storeDetailStyles.avatar} className="bk-store-detail-avatar">
                  {store.logo ? (
                    <img
                      src={store.logo}
                      alt=""
                      style={storeDetailStyles.avatarImage}
                      onError={(event) => {
                        event.currentTarget.src = STORE_AVATAR_PLACEHOLDER;
                      }}
                    />
                  ) : (
                    <span style={storeDetailStyles.avatarFallback}>
                      <Store size={44} strokeWidth={2.1} />
                    </span>
                  )}
                </div>
                <div style={storeDetailStyles.identity} className="bk-store-detail-identity">
                  <h1 style={storeDetailStyles.name}>{store.name}</h1>
                  <div style={storeDetailStyles.metaRow}>
                    <span style={storeDetailStyles.badge}>
                      <ShieldCheck size={15} strokeWidth={2.4} />
                      {store.badge}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={17} fill="#846411" color="#846411" strokeWidth={0} />
                      {store.location}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    ...storeDetailStyles.follow,
                    opacity: isFollowBusy ? 0.72 : 1,
                  }}
                  className="bk-store-follow"
                  onClick={handleFollow}
                  disabled={isFollowBusy}
                >
                  <Plus size={20} strokeWidth={2.5} />
                  {isFollowed ? "Following" : "Follow Shop"}
                </button>
              </section>

              {isLoading && !rawStore && (
                <p style={{ margin: "0 0 24px", color: "#8a5268", fontWeight: 850 }}>Memuat profil toko...</p>
              )}
              {error && <p style={{ margin: "0 0 24px", color: "#a82a59", fontWeight: 850 }}>{error}</p>}

              <section style={storeDetailStyles.statsGrid} className="bk-store-stats" aria-label="Statistik toko">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <article
                      key={stat.label}
                      style={{
                        ...storeDetailStyles.statCard,
                        boxShadow: `5px 5px 0 ${["#f2ca4c", "#ad2d68", "#2d64a1", "#2f1e1a"][index]}`,
                      }}
                    >
                      <Icon size={31} strokeWidth={2.4} color={stat.color} fill={stat.fill || "none"} />
                      <strong style={storeDetailStyles.statValue}>{stat.value}</strong>
                      <span style={storeDetailStyles.statLabel}>{stat.label}</span>
                    </article>
                  );
                })}
              </section>

              <section style={storeDetailStyles.storyGrid} className="bk-store-story-grid">
                <article style={storeDetailStyles.storyCard} className="bk-store-story-card">
                  <h2 style={storeDetailStyles.storyTitle}>Our Story</h2>
                  {splitStoreStory(store.description).map((paragraph, index) => (
                    <p key={`${paragraph}-${index}`} style={storeDetailStyles.storyText}>
                      {paragraph}
                    </p>
                  ))}
                  <div style={storeDetailStyles.tagRow}>
                    {store.tags.map((tag, index) => (
                      <span
                        key={tag}
                        style={{
                          ...storeDetailStyles.tag,
                          background: ["#cfe1fb", "#ffd2e3", "#ffe885"][index % 3],
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>

                <aside style={storeDetailStyles.rulesCard} className="bk-store-rules-card">
                  <span style={storeDetailStyles.rulesPin} aria-hidden="true">
                    <ReceiptText size={21} strokeWidth={2.4} />
                  </span>
                  <h2 style={storeDetailStyles.rulesTitle}>Shop Rules</h2>
                  <div style={storeDetailStyles.rulesDivider} />
                  {ruleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} style={storeDetailStyles.ruleItem}>
                        <span style={storeDetailStyles.ruleIcon}>
                          <Icon size={22} strokeWidth={2.2} color={item.color} />
                        </span>
                        <span>
                          <strong style={storeDetailStyles.ruleTitle}>{item.title}</strong>
                          <p style={storeDetailStyles.ruleText}>{item.text}</p>
                        </span>
                      </div>
                    );
                  })}
                </aside>
              </section>

              <section style={storeDetailStyles.productsSection}>
                <h2 style={storeDetailStyles.productsTitle}>Produk dari Toko Ini</h2>
                {store.products.length ? (
                  <div style={storeDetailStyles.productsGrid} className="bk-store-products-grid">
                    {store.products.map((product, index) => (
                      <ProductDetailMoreCard
                        key={`${product.id}-${index}`}
                        product={product}
                        accent={PRODUCT_DETAIL_ACCENTS[index % PRODUCT_DETAIL_ACCENTS.length]}
                        onOpen={() => navigateToProduct(product)}
                        onAdd={() => onAdd(product)}
                        justAdded={addedId === product.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={storeDetailStyles.stateBox}>
                    Produk toko ini belum tersedia dari API.
                  </div>
                )}
              </section>
            </>
          )}
        </section>
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

function normalizeStoreDetail(rawStore, rawProducts, rawReviews, storeId = "") {
  const source = extractStoreRecord(rawStore);
  const stats = source.stats || source.statistic || source.statistics || source.summary || {};
  const profile = source.profile && typeof source.profile === "object" ? source.profile : {};
  const about = source.about && typeof source.about === "object" ? source.about : {};
  const shopRules =
    source.shop_rules && typeof source.shop_rules === "object"
      ? source.shop_rules
      : source.shopRules && typeof source.shopRules === "object"
        ? source.shopRules
        : {};
  const policies = source.policies || source.policy || source.kebijakan || shopRules || {};
  const sellerInfo =
    source.seller && typeof source.seller === "object" && !Array.isArray(source.seller) ? source.seller : {};
  const products = normalizeStoreProducts(rawProducts, storeId);
  const reviews = normalizeStoreReviews(rawReviews);
  const reviewAverage = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;
  const activeSince =
    getStoreYear(
      source.active_since ||
        source.activeSince ||
        stats.active_since ||
        stats.activeSince ||
        source.created_at ||
        source.createdAt
    ) || "";
  const tags = normalizeStoreTags(
    source.tags || source.categories || source.category_tags || source.labels || about.tags
  );
  const location = source.location || buildStoreLocation(source) || profile.location?.display_name || "";
  const logo = resolveApiUrl(
    source.logo ||
      source.logo_url ||
      source.logoUrl ||
      source.avatar ||
      source.photo ||
      profile.avatar_url ||
      profile.avatarUrl ||
      sellerInfo.logo ||
      sellerInfo.avatar_url ||
      sellerInfo.photo
  );
  const banner =
    resolveApiUrl(
      source.banner ||
        source.banner_url ||
        source.bannerUrl ||
        source.cover ||
        source.cover_url ||
        source.hero_image ||
        profile.banner_url ||
        profile.bannerUrl ||
        profile.cover_url
    ) || STORE_BANNER_PLACEHOLDER;
  const ruleDescription = (rule) => {
    if (!rule || typeof rule !== "object") return "";
    return rule.description || rule.text || rule.content || rule.title || "";
  };

  return {
    id: source.id || source.uuid || source.store_id || source.storeId || storeId || sellerInfo.id,
    name:
      source.store_name ||
      source.storeName ||
      source.name ||
      source.shop_name ||
      source.shopName ||
      sellerInfo.store_name ||
      sellerInfo.name ||
      "CraftyHands Studio",
    badge: source.role_label || source.roleLabel || source.badge || source.level || sellerInfo.badge || "Master Crafter",
    location: location || "Indonesia",
    description:
      source.description ||
      source.deskripsi ||
      source.bio ||
      about.description ||
      about.desc ||
      "Deskripsi toko belum tersedia. Begitu seller melengkapi profilnya, bagian Our Story akan menampilkan cerita dan karakter toko dari API.",
    logo: logo || STORE_AVATAR_PLACEHOLDER,
    banner,
    rating:
      pickNumberFromSources([source, stats], ["rating", "average_rating", "averageRating"]) ||
      reviewAverage ||
      0,
    sales: pickNumberFromSources([source, stats], ["sales", "total_sales", "totalSales", "orders", "sold", "total_sold"]),
    activeSince: activeSince || source.active_since || source.activeSince || stats.active_since || "-",
    productsCount:
      pickNumberFromSources([source, stats], ["products", "product_count", "productCount", "total_products", "totalProducts"]) ||
      products.length,
    shippingPolicy:
      ruleDescription(shopRules.shipping) ||
      source.shipping_policy ||
      source.shippingPolicy ||
      policies.shipping ||
      policies.shipping_policy ||
      "Pesanan dikirim mengikuti jadwal dan metode pengiriman yang tersedia saat checkout.",
    returnPolicy:
      ruleDescription(shopRules.returns) ||
      source.return_policy ||
      source.returnPolicy ||
      policies.return ||
      policies.returns ||
      policies.return_policy ||
      "Retur mengikuti ketentuan toko dan status pesanan.",
    customPolicy:
      ruleDescription(shopRules.commissions) ||
      source.custom_policy ||
      source.customPolicy ||
      source.commission_policy ||
      source.commissionPolicy ||
      policies.custom ||
      policies.commission ||
      "Pesanan custom dapat didiskusikan langsung dengan seller bila tersedia.",
    tags: tags.length ? tags.slice(0, 5) : ["Handmade", "Kriya Lokal", "Small Batch"],
    products,
    reviews,
    isFollowed: Boolean(
      source.is_followed ?? source.isFollowed ?? source.following ?? source.followed ?? source.is_following
    ),
  };
}

function extractStoreRecord(raw) {
  if (!raw || typeof raw !== "object") return {};
  const candidates = [
    raw,
    raw.store,
    raw.seller,
    raw.shop,
    raw.data?.store,
    raw.data?.seller,
    raw.data?.shop,
    raw.data?.data?.store,
    raw.data?.data?.seller,
    raw.result?.store,
    raw.result?.seller,
    raw.result?.data,
    raw.payload?.store,
    raw.payload?.seller,
    raw.payload?.data,
    raw.data?.data,
    raw.data,
    raw.result,
    raw.payload,
  ];

  let best = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const score = scoreStoreRecord(candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best || {};
}

function scoreStoreRecord(record) {
  let score = 0;
  if (record.store_name || record.storeName || record.shop_name || record.shopName) score += 3;
  if (record.statistics || record.stats || record.statistic) score += 3;
  if (record.about || record.story) score += 2;
  if (record.shop_rules || record.shopRules || record.policies || record.policy) score += 2;
  if (
    record.is_following !== undefined ||
    record.is_followed !== undefined ||
    record.following !== undefined ||
    record.followed !== undefined
  ) {
    score += 2;
  }
  if (record.profile && typeof record.profile === "object") score += 2;
  if (record.description || record.deskripsi || record.bio) score += 1;
  if (record.logo || record.logo_url || record.logoUrl || record.banner || record.banner_url) score += 1;
  if (record.address || record.alamat || record.city || record.kota) score += 1;
  if (record.seller && typeof record.seller === "object") score += 1;
  if (record.avatar_url && !record.store_name && !record.statistics && !record.about) score -= 1;
  return score;
}

function normalizeStoreProducts(raw, storeId = "") {
  return extractStoreCollection(raw, ["products", "items", "list", "data", "results"])
    .map((item, index) => ({
      id: item.id ?? item.uuid ?? item.product_id ?? item.productId ?? item._id ?? `store-product-${index + 1}`,
      productId: item.product_id ?? item.productId ?? item.id ?? item.uuid ?? item._id,
      storeId: pickStoreId(item) || storeId,
      title: item.title || item.name || item.product_name || item.nama_produk || "Produk",
      price: formatStorefrontPrice(item.price ?? item.harga ?? item.selling_price ?? item.sale_price ?? item.price_value),
      badge: item.badge || item.category?.name || item.category || item.category_name || item.kategori || "Kriya",
      img: resolveProductImage(item) || PRODUCT_DETAIL_PLACEHOLDER,
      bg: item.bg || PRODUCT_BG_COLORS[index % PRODUCT_BG_COLORS.length],
    }))
    .filter((item) => item.title);
}

function normalizeStoreReviews(raw) {
  return extractStoreCollection(raw, ["reviews", "items", "list", "data", "results"])
    .map((review, index) => ({
      id: review.id || review.uuid || `store-review-${index}`,
      rating: Number(review.rating || review.stars || review.score) || 0,
    }))
    .filter((review) => review.rating > 0);
}

function extractStoreCollection(raw, keys) {
  const candidates = [
    raw,
    raw?.data,
    raw?.result,
    raw?.payload,
    raw?.data?.data,
    raw?.result?.data,
    raw?.payload?.data,
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

function buildStoreLocation(store = {}) {
  const profileLocation =
    typeof store.profile?.location === "object" ? store.profile.location : {};
  const parts = [
    store.address,
    store.alamat,
    store.city,
    store.kota,
    store.state,
    store.province,
    store.provinsi,
    store.country,
    store.location,
    profileLocation.display_name,
    profileLocation.displayName,
    profileLocation.city,
    profileLocation.state,
    profileLocation.country,
  ];
  return [...new Set(parts.map((part) => String(part || "").trim()).filter(Boolean))].join(", ");
}

function normalizeStoreTags(value) {
  const tags = Array.isArray(value) ? value : String(value || "").split(",");
  return Array.from(
    new Set(
      tags
        .map((tag) => (tag && typeof tag === "object" ? tag.name || tag.label || tag.title : tag))
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
    )
  );
}

function getStoreYear(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value) return "";
  const yearMatch = String(value).match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return Number(yearMatch[0]);
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.getFullYear() : "";
}

function splitStoreStory(text) {
  const paragraphs = String(text || "")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
  return paragraphs.length ? paragraphs.slice(0, 4) : ["Deskripsi toko belum tersedia dari API."];
}

function buildStoreStats(store) {
  return [
    {
      label: "Rating",
      value: store.rating ? Number(store.rating).toFixed(1).replace(/\.0$/, ".0") : "-",
      icon: Star,
      color: "#806306",
      fill: "#806306",
    },
    {
      label: "Sales",
      value: formatCompactStoreNumber(store.sales),
      icon: ShoppingBasket,
      color: "#ad2d68",
    },
    {
      label: "Active Since",
      value: store.activeSince || "-",
      icon: ReceiptText,
      color: "#2d64a1",
    },
    {
      label: "Products",
      value: formatCompactStoreNumber(store.productsCount),
      icon: Store,
      color: "#2f1e1a",
    },
  ];
}

function buildStoreRuleItems(store) {
  return [
    { title: "Shipping", text: store.shippingPolicy, icon: Truck, color: "#806306" },
    { title: "Returns", text: store.returnPolicy, icon: ReceiptText, color: "#ad2d68" },
    { title: "Commissions", text: store.customPolicy, icon: ShieldCheck, color: "#2d64a1" },
  ];
}

function formatCompactStoreNumber(value) {
  const number = Number(value) || 0;
  if (number >= 1000) {
    const compact = new Intl.NumberFormat("id-ID", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(number);
    return compact.replace(/\s/g, "");
  }
  return new Intl.NumberFormat("id-ID").format(number);
}

function ProductDetailPage({
  productId,
  products,
  scrolled,
  cartCount,
  wishCount,
  showToast,
  navigateTo,
  navigateToProduct,
  navigateToStore,
  onSearch,
  toast,
  onAdd,
  onLike,
  liked,
  addedId,
  authUser,
  onLogout,
}) {
const fallback = products.find((product) => String(product.productId ?? product.id) === String(productId)) || {};
  const [rawProduct, setRawProduct] = useState(null);
  const [storeMoreRaw, setStoreMoreRaw] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openSections, setOpenSections] = useState({});
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      setError("Produk tidak ditemukan.");
      return undefined;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError("");
    setRawProduct(null);
    setSelectedImageIndex(0);
    setQuantity(1);

    fetchProductDetail(productId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setRawProduct(data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Gagal memuat detail produk.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [productId]);

  const product = normalizeProductDetail(rawProduct, fallback, productId);
  const sellerStoreId = product.seller?.storeId || product.storeId || "";

  useEffect(() => {
    if (!sellerStoreId) {
      setStoreMoreRaw(null);
      return undefined;
    }
    const controller = new AbortController();
    setStoreMoreRaw(null);
    fetchStoreProducts(sellerStoreId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setStoreMoreRaw(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setStoreMoreRaw(null);
      });
    return () => controller.abort();
  }, [sellerStoreId]);

  useEffect(() => {
    if (!productId) {
      setReviews([]);
      setRatingSummary(null);
      return undefined;
    }

    const controller = new AbortController();
    setReviewsLoading(true);
    setReviewsError("");
    setReviews([]);
    setRatingSummary(null);
    setSelectedReview(null);
    setShowAllReviews(false);

    Promise.allSettled([
      fetchProductReviews(productId, { signal: controller.signal }),
      fetchProductRating(productId, { signal: controller.signal }),
    ]).then(([reviewsResult, ratingResult]) => {
      if (controller.signal.aborted) return;
      if (reviewsResult.status === "fulfilled") {
        setReviews(normalizeProductReviews(reviewsResult.value));
      } else {
        setReviewsError(reviewsResult.reason instanceof Error ? reviewsResult.reason.message : "Gagal memuat ulasan.");
      }
      if (ratingResult.status === "fulfilled") {
        setRatingSummary(normalizeRatingSummary(ratingResult.value));
      }
      setReviewsLoading(false);
    });

    return () => controller.abort();
  }, [productId]);

  const images = product.images.length ? product.images : [product.img];
  const selectedImage = images[Math.min(selectedImageIndex, images.length - 1)] || product.img;
  const productLiked = !!liked[product.id] || !!liked[product.productId];
  const moreProducts = buildMoreFromStudioProducts(rawProduct, products, product, storeMoreRaw, sellerStoreId);
  const accordionItems = buildProductAccordionItems(product);
  const canOpenSeller = !!product.seller.storeId;
  const bestReviews = useMemo(() => getBestProductReviews(reviews), [reviews]);
  const previewReviews = bestReviews.slice(0, 5);

  const changeQuantity = (delta) => {
    setQuantity((current) => Math.max(1, Math.min(99, current + delta)));
  };

  const handleAdd = () => {
    onAdd(product, quantity);
  };

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
        compactActions
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={productDetailStyles.main}>
        <section style={productDetailStyles.inner} className="bk-product-detail-inner">
          <button
            type="button"
            style={productDetailStyles.backButton}
            className="bk-product-detail-back"
            onClick={() => navigateTo("home")}
          >
            &lt; Kembali
          </button>

          {!productId ? (
            <div style={productDetailStyles.stateBox}>Produk tidak ditemukan.</div>
          ) : (
            <div style={productDetailStyles.heroGrid} className="bk-product-detail-grid">
              <div style={productDetailStyles.galleryCol}>
                <div style={productDetailStyles.imageFrame} className="bk-product-detail-image-frame">
                  <img
                    src={selectedImage}
                    alt={product.title}
                    style={productDetailStyles.mainImage}
                    loading="eager"
                    onError={(event) => {
                      event.currentTarget.src = PRODUCT_DETAIL_PLACEHOLDER;
                    }}
                  />
                </div>

                <div style={productDetailStyles.thumbRow} className="bk-product-detail-thumbs">
                  {images.slice(0, 4).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      style={{
                        ...productDetailStyles.thumb,
                        ...(index === selectedImageIndex ? productDetailStyles.thumbActive : {}),
                      }}
                      className="bk-product-detail-thumb"
                      onClick={() => setSelectedImageIndex(index)}
                      aria-label={`Lihat gambar produk ${index + 1}`}
                    >
                      <img
                        src={image}
                        alt=""
                        style={productDetailStyles.thumbImage}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = PRODUCT_DETAIL_PLACEHOLDER;
                        }}
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  style={productDetailStyles.sellerCard}
                  className="bk-product-detail-seller"
                  onClick={() => {
                    if (canOpenSeller) {
                      navigateToStore(product.seller);
                      return;
                    }
                    showToast("Toko penjual belum memiliki ID dari server");
                  }}
                  aria-label={`Buka toko ${product.seller.name}`}
                >
                  <span style={productDetailStyles.sellerAvatar}>
                    {product.seller.avatar ? (
                      <img src={product.seller.avatar} alt="" style={productDetailStyles.sellerAvatarImg} />
                    ) : (
                      <Store size={28} strokeWidth={2.2} />
                    )}
                  </span>
                  <div style={productDetailStyles.sellerNameBox}>{product.seller.name}</div>
                  <div style={productDetailStyles.sellerMeta}>
                    <span style={productDetailStyles.sellerBadge}>
                      <ShieldCheck size={14} strokeWidth={2.3} />
                      {product.seller.role}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={17} fill="#846411" color="#846411" strokeWidth={0} />
                      {product.seller.fullLocation || product.seller.location}
                    </span>
                  </div>
                </button>
              </div>

              <article style={productDetailStyles.detailsCol} className="bk-product-detail-copy">
                {isLoading && !rawProduct && fallback.title && (
                  <p style={{ margin: "0 0 14px", color: "#8a5268", fontWeight: 800 }}>Memuat detail produk...</p>
                )}
                {error && (
                  <p style={{ margin: "0 0 14px", color: "#a82a59", fontWeight: 800 }}>{error}</p>
                )}

                <h1 style={productDetailStyles.title}>{product.title}</h1>
                <div style={productDetailStyles.price}>{product.price}</div>
                <p style={productDetailStyles.description}>{product.description}</p>

                <div style={productDetailStyles.chips}>
                  {product.tags.map((tag, index) => (
                    <span
                      key={tag}
                      style={{
                        ...productDetailStyles.chip,
                        border: `2px solid ${index === 0 ? "#0080a6" : "#d83e7b"}`,
                        color: index === 0 ? "#0075a0" : "#d83e7b",
                        transform: index % 2 ? "rotate(2deg)" : "rotate(-2deg)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div style={productDetailStyles.actionRow} className="bk-product-detail-actions">
                  <div style={productDetailStyles.qtyControl} aria-label="Jumlah produk">
                    <button type="button" style={productDetailStyles.qtyButton} onClick={() => changeQuantity(-1)} aria-label="Kurangi jumlah">
                      <Minus size={19} strokeWidth={2.5} />
                    </button>
                    <span style={productDetailStyles.qtyValue}>{quantity}</span>
                    <button type="button" style={productDetailStyles.qtyButton} onClick={() => changeQuantity(1)} aria-label="Tambah jumlah">
                      <Plus size={19} strokeWidth={2.5} />
                    </button>
                  </div>
                  <button
                    type="button"
                    style={productDetailStyles.addButton}
                    className="bk-product-detail-add"
                    onClick={handleAdd}
                  >
                    <ShoppingBasket size={22} strokeWidth={2.2} />
                    {addedId === product.id ? "Added to Cart" : "Add to Cart"}
                  </button>
                </div>

                <div style={productDetailStyles.accordion}>
                  {accordionItems.map((item) => {
                    const open = !!openSections[item.title];
                    return (
                      <section key={item.title} style={productDetailStyles.accordionItem}>
                        <button
                          type="button"
                          style={productDetailStyles.accordionButton}
                          onClick={() => setOpenSections((current) => ({ ...current, [item.title]: !open }))}
                          aria-expanded={open}
                        >
                          <span>{item.title}</span>
                          <ChevronDown
                            size={21}
                            strokeWidth={2.4}
                            style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}
                          />
                        </button>
                        {open && <div style={productDetailStyles.accordionBody}>{item.content}</div>}
                      </section>
                    );
                  })}
                </div>

                <button
                  type="button"
                  style={{
                    marginTop: 20,
                    border: "none",
                    background: "transparent",
                    color: "#b72d64",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 800,
                  }}
                  onClick={() => onLike(product)}
                >
                  <Heart size={18} fill={productLiked ? "#b72d64" : "none"} color="#b72d64" />
                  {productLiked ? "Ada di wishlist" : "Tambah ke wishlist"}
                </button>
              </article>
            </div>
          )}

<ProductDetailWave />
        </section>

        <section style={productDetailStyles.reviewsSection} className="bk-product-detail-reviews">
          <div style={productDetailStyles.reviewsHeader}>
            <div>
              <h2 style={productDetailStyles.reviewsEyebrow}>Ulasan Pengrajin</h2>
              <p style={productDetailStyles.reviewsLead}>
                Ulasan dari pelanggan yang sudah membeli karya ini.
              </p>
            </div>
            {!reviewsLoading && ratingSummary && ratingSummary.count > 0 && (
              <div style={productDetailStyles.reviewsSummary}>
                <span style={productDetailStyles.reviewsAverage}>
                  {Number(ratingSummary.average).toFixed(1).replace(".", ",")}
                </span>
                <span style={productDetailStyles.reviewsStarsSummary}>
                  <StarRating value={Math.round(ratingSummary.average)} size={17} />
                </span>
                <span style={productDetailStyles.reviewsCount}>
                  · {ratingSummary.count} ulasan
                </span>
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <div style={productDetailStyles.reviewsState}>Memuat ulasan...</div>
          ) : reviewsError ? (
            <div style={productDetailStyles.reviewsState}>{reviewsError}</div>
          ) : reviews.length ? (
            <>
              <div style={productDetailStyles.reviewsList} className="bk-product-detail-reviews-list">
                {previewReviews.map((review) => (
                  <ProductReviewCard
                    key={review.id}
                    review={review}
                    onOpen={() => setSelectedReview(review)}
                  />
                ))}
              </div>
              {bestReviews.length > 5 && (
                <div style={productDetailStyles.reviewsActionRow}>
                  <button
                    type="button"
                    style={productDetailStyles.reviewsAllButton}
                    className="bk-reviews-all-button"
                    onClick={() => setShowAllReviews(true)}
                  >
                    Lihat Semua Ulasan
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={productDetailStyles.reviewsState}>
              Belum ada ulasan untuk produk ini. Jadilah yang pertama membagikan pengalamanmu.
            </div>
          )}

          <ReviewSectionDivider placement="bottom" />
        </section>

{moreProducts.length > 0 && (
        <section style={productDetailStyles.moreSection} className="bk-product-detail-more">
          <h2 style={productDetailStyles.moreTitle}>More from the Studio</h2>
          <div style={productDetailStyles.moreGrid} className="bk-product-detail-more-grid">
            {moreProducts.map((item, index) => (
              <ProductDetailMoreCard
                key={`${item.id}-${index}`}
                product={item}
                accent={PRODUCT_DETAIL_ACCENTS[index % PRODUCT_DETAIL_ACCENTS.length]}
                onOpen={() => navigateToProduct(item)}
                onAdd={() => onAdd(item)}
                justAdded={addedId === item.id}
              />
            ))}
          </div>
        </section>
      )}
      </main>

      <SiteFooter showToast={showToast} navigateTo={navigateTo} />

      {selectedReview && (
        <ProductReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}

      {showAllReviews && (
        <ProductReviewsListModal
          reviews={bestReviews}
          onClose={() => setShowAllReviews(false)}
          onOpenReview={setSelectedReview}
        />
      )}

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

function ReviewSectionDivider({ placement = "top" }) {
  return (
    <svg
      viewBox="0 0 1200 86"
      preserveAspectRatio="none"
      style={{
        ...productDetailStyles.reviewsWave,
        ...(placement === "bottom" ? productDetailStyles.reviewsWaveBottom : {}),
      }}
      aria-hidden="true"
    >
      <path d="M0 32 C112 70 224 70 336 32 S560 -6 672 32 S896 70 1008 32 S1120 -6 1200 28" />
    </svg>
  );
}

function ProductReviewCard({ review, onOpen }) {
  const dateLabel = review.createdAt ? formatReviewDate(review.createdAt) : "";
  const [photoVisible, setPhotoVisible] = useState(Boolean(review.photo));

  useEffect(() => {
    setPhotoVisible(Boolean(review.photo));
  }, [review.photo]);

  return (
    <button
      type="button"
      style={productDetailStyles.reviewItem}
      className="bk-review-item"
      onClick={onOpen}
      aria-label={`Buka detail ulasan dari ${review.user.name}`}
    >
      <span style={productDetailStyles.reviewItemAvatarBox}>
        {review.user.avatar ? (
          <img src={review.user.avatar} alt={review.user.name} style={productDetailStyles.reviewItemAvatar} />
        ) : (
          <span style={productDetailStyles.reviewItemAvatarFallback}>
            {getProfileInitials(review.user.name)}
          </span>
        )}
      </span>
      <span style={productDetailStyles.reviewItemBody}>
        <span style={productDetailStyles.reviewItemTop}>
          <span style={productDetailStyles.reviewItemName}>{review.user.name}</span>
          <span style={productDetailStyles.reviewItemStars}>
            <StarRating value={review.rating} size={13} />
          </span>
        </span>
        <span style={productDetailStyles.reviewItemComment}>{review.comment}</span>
        {dateLabel && <span style={productDetailStyles.reviewItemDate}>{dateLabel}</span>}
      </span>
      {photoVisible && review.photo && (
        <span style={productDetailStyles.reviewItemPhotoBox} data-review-photo>
          <img
            src={review.photo}
            alt={`Foto ulasan dari ${review.user.name}`}
            style={productDetailStyles.reviewItemPhoto}
            loading="lazy"
            onError={() => {
              setPhotoVisible(false);
            }}
          />
        </span>
      )}
    </button>
  );
}

function ProductReviewsListModal({ reviews, onClose, onOpenReview }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      style={productDetailStyles.reviewsAllOverlay}
      className="bk-review-detail-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        style={productDetailStyles.reviewsAllModal}
        className="bk-review-detail-modal bk-reviews-all-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="all-reviews-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div style={productDetailStyles.reviewsAllHead}>
          <div>
            <h2 id="all-reviews-title" style={productDetailStyles.reviewsAllTitle}>
              Semua Ulasan
            </h2>
            <p style={productDetailStyles.reviewsAllLead}>
              {reviews.length} ulasan pelanggan, diurutkan dari rating terbaik.
            </p>
          </div>
          <button type="button" style={productDetailStyles.reviewsAllClose} aria-label="Tutup semua ulasan" onClick={onClose}>
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        <div style={productDetailStyles.reviewsAllList} className="bk-reviews-all-list">
          {reviews.map((review) => (
            <ProductReviewCard
              key={review.id}
              review={review}
              onOpen={() => onOpenReview(review)}
            />
          ))}
        </div>
      </section>
    </div>,
    document.body
  );
}

function ProductReviewDetailModal({ review, onClose }) {
  const dateLabel = review.createdAt ? formatReviewDate(review.createdAt) : "";
  const [photoVisible, setPhotoVisible] = useState(Boolean(review.photo));

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    setPhotoVisible(Boolean(review.photo));
  }, [review.photo]);

  return createPortal(
    <div
      style={productDetailStyles.reviewDetailOverlay}
      className="bk-review-detail-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        style={{
          ...productDetailStyles.reviewDetailModal,
          ...(photoVisible ? {} : productDetailStyles.reviewDetailModalNoPhoto),
        }}
        className={`bk-review-detail-modal${photoVisible ? "" : " bk-review-detail-modal-no-photo"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" style={productDetailStyles.reviewDetailClose} aria-label="Tutup detail ulasan" onClick={onClose}>
          <X size={22} strokeWidth={2.2} />
        </button>

        {photoVisible && review.photo && (
          <div style={productDetailStyles.reviewDetailPhotoFrame} className="bk-review-detail-photo-frame" data-review-photo>
            <img
              src={review.photo}
              alt={`Foto ulasan dari ${review.user.name}`}
              style={productDetailStyles.reviewDetailPhoto}
              onError={() => {
                setPhotoVisible(false);
              }}
            />
          </div>
        )}

        <div style={productDetailStyles.reviewDetailContent}>
          <div style={productDetailStyles.reviewDetailHead}>
            <span style={productDetailStyles.reviewDetailAvatar}>
              {review.user.avatar ? (
                <img src={review.user.avatar} alt={review.user.name} style={productDetailStyles.reviewDetailAvatarImg} />
              ) : (
                getProfileInitials(review.user.name)
              )}
            </span>
            <div style={productDetailStyles.reviewDetailNameBox}>
              <h2 id="review-detail-title" style={productDetailStyles.reviewDetailName}>{review.user.name}</h2>
              {dateLabel && <span style={productDetailStyles.reviewDetailDate}>{dateLabel}</span>}
            </div>
          </div>

          <div style={productDetailStyles.reviewDetailStars}>
            <StarRating value={review.rating} size={18} />
          </div>

          <blockquote style={productDetailStyles.reviewDetailQuote}>
            &ldquo;{review.comment}&rdquo;
          </blockquote>

          <button type="button" style={productDetailStyles.reviewDetailHelpful} className="bk-review-detail-helpful">
            <ThumbsUp size={15} strokeWidth={2.2} />
            Membantu
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

function ProductDetailMoreCard({ product, accent, onOpen, onAdd, justAdded }) {
  return (
    <article style={productDetailStyles.moreCard} className="bk-product-detail-more-card">
      <button
        type="button"
        style={{
          ...productDetailStyles.moreImageButton,
          borderColor: accent,
          boxShadow: `10px 12px 0 ${softenAccent(accent)}`,
        }}
        className="bk-product-detail-more-image"
        onClick={onOpen}
      >
        <img
          src={product.img || PRODUCT_DETAIL_PLACEHOLDER}
          alt={product.title}
          style={productDetailStyles.moreImage}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = PRODUCT_DETAIL_PLACEHOLDER;
          }}
        />
      </button>
      <h3 style={productDetailStyles.moreTitleText}>{product.title}</h3>
      <p style={productDetailStyles.morePrice}>{product.price}</p>
      <button type="button" style={productDetailStyles.moreAdd} className="bk-product-detail-more-add" onClick={onAdd}>
        <Plus size={15} strokeWidth={2.5} />
        {justAdded ? "Ditambahkan" : "Tambah"}
      </button>
    </article>
  );
}

function ProductDetailWave() {
  return (
    <svg viewBox="0 0 1200 92" preserveAspectRatio="none" style={productDetailStyles.wave} aria-hidden="true">
      <path d="M0 38 C90 74 180 74 270 38 S450 2 540 38 S720 74 810 38 S990 2 1080 38 S1170 74 1200 52" />
    </svg>
  );
}

function buildMoreFromStudioProducts(rawDetail, products, currentProduct, storeRaw = null, currentStoreId = "") {
  const currentId = String(currentProduct.productId ?? currentProduct.id);
  const normalizedStoreRaw = normalizeStoreProducts(storeRaw, currentStoreId);
  const fromStore = normalizedStoreRaw.filter(
    (product) => String(product.productId ?? product.id) !== currentId
  );

  const fromApiRelated = extractRelatedProducts(rawDetail)
    .filter((product) => String(product.id) !== currentId)
    .map((item, index) => ({
      id: item.id,
      productId: item.id,
      title: item.name || item.title || "Produk",
      price: formatStorefrontPrice(item.price ?? item.harga ?? item.selling_price),
      badge: item.category || item.badge || "Kriya",
      img: resolveApiUrl(item.image_url || item.image || item.img) || PRODUCT_DETAIL_PLACEHOLDER,
      bg: PRODUCT_BG_COLORS[index % PRODUCT_BG_COLORS.length],
    }));

  const sameStore = currentStoreId
    ? products.filter(
        (product) =>
          String(product.storeId || "") === currentStoreId &&
          String(product.productId ?? product.id) !== currentId
      )
    : [];

  const merged = [];
  const seen = new Set();
  const push = (product) => {
    if (!product) return;
    const id = String(product.productId ?? product.id);
    if (!id || seen.has(id)) return;
    seen.add(id);
    merged.push(product);
  };

  fromStore.forEach(push);
  fromApiRelated.forEach(push);
  sameStore.forEach(push);

  return merged;
}

function extractRelatedProducts(rawDetail) {
  if (!rawDetail || typeof rawDetail !== "object") return [];
  const candidates = [
    rawDetail.related_products,
    rawDetail.relatedProducts,
    rawDetail.data?.related_products,
    rawDetail.data?.relatedProducts,
    rawDetail.result?.related_products,
    rawDetail.payload?.related_products,
    rawDetail.product?.related_products,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter((item) => item && typeof item === "object");
  }
  return [];
}

function buildProductAccordionItems(product) {
  const raw = product.raw || {};
  const specs =
    product.specifications?.length > 0 ? product.specifications : collectSpecificationRows(raw);
  const careInstructions =
    product.careInstructions?.length > 0 ? product.careInstructions : collectCareInstructions(raw);
  const shippingInfo =
    product.shippingInfo?.length > 0 ? product.shippingInfo : collectShippingInfo(raw);

  const renderSpecRows = (rows) =>
    rows.length ? (
      <dl style={productDetailStyles.specList}>
        {rows.map((row) => (
          <div key={row.label} style={productDetailStyles.specRow}>
            <dt style={productDetailStyles.specName}>{row.label}</dt>
            <dd style={productDetailStyles.specValue}>{row.value}</dd>
          </div>
        ))}
      </dl>
    ) : null;

  return [
    {
      title: "Specifications",
      content:
        renderSpecRows(specs) ||
        "Detail spesifikasi akan mengikuti informasi terbaru dari seller.",
    },
    {
      title: "Care Instructions",
      content: careInstructions.length ? (
        <ul style={productDetailStyles.careList}>
          {careInstructions.map((instruction, index) => (
            <li key={`${instruction}-${index}`} style={productDetailStyles.careItem}>
              {instruction}
            </li>
          ))}
        </ul>
      ) : (
        "Rawat dengan lembut, hindari bahan kimia keras, dan simpan di tempat kering agar karya tetap awet."
      ),
    },
    {
      title: "Shipping Info",
      content:
        renderSpecRows(shippingInfo) ||
        "Dikemas aman oleh seller dan dikirim mengikuti alamat serta pilihan pengiriman saat checkout.",
    },
  ];
}

function SearchResultWave() {
  return (
    <svg viewBox="0 0 1200 80" preserveAspectRatio="none" style={styles.searchWave} aria-hidden="true">
      <path d="M0 34 C60 62 120 62 180 34 S300 6 360 34 S480 62 540 34 S660 6 720 34 S840 62 900 34 S1020 6 1080 34 S1140 62 1200 34" />
    </svg>
  );
}

function RelatedIcon() {
  return (
    <svg viewBox="0 0 36 36" width="32" height="32" style={styles.relatedIcon} aria-hidden="true">
      <path d="M14 3 L21 15 H7 Z" />
      <rect x="4" y="20" width="9" height="9" rx="1.5" />
      <circle cx="25" cy="24.5" r="5" />
    </svg>
  );
}

function SearchStoreCard({ store, onOpen }) {
  const ratingLabel = store.rating > 0 ? store.rating.toFixed(1).replace(".", ",") : "Baru";
  return (
    <button type="button" style={styles.searchStoreCard} className="bk-search-store-card" onClick={onOpen}>
      <span style={styles.searchStoreAvatar}>
        <img
          src={store.logo || STORE_AVATAR_PLACEHOLDER}
          alt=""
          style={styles.searchStoreAvatarImg}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = STORE_AVATAR_PLACEHOLDER;
          }}
        />
      </span>
      <span style={styles.searchStoreCopy}>
        <strong style={styles.searchStoreName}>{store.name}</strong>
        <span style={styles.searchStoreMeta}>
          <ShieldCheck size={15} strokeWidth={2.2} />
          Toko kriya
          <Star size={15} strokeWidth={2.1} fill="#f5a623" color="#f5a623" />
          {ratingLabel}
        </span>
      </span>
      <span style={styles.searchStoreOpen}>
        Lihat toko <ArrowRight size={16} strokeWidth={2.4} />
      </span>
    </button>
  );
}

export {
  SearchResultsPage,
  StoreDetailPage,
  normalizeStoreDetail,
  extractStoreRecord,
  scoreStoreRecord,
  normalizeStoreProducts,
  normalizeStoreReviews,
  extractStoreCollection,
  buildStoreLocation,
  normalizeStoreTags,
  getStoreYear,
  splitStoreStory,
  buildStoreStats,
  buildStoreRuleItems,
  formatCompactStoreNumber,
  ProductDetailPage,
  ReviewSectionDivider,
  ProductReviewCard,
  ProductReviewsListModal,
  ProductReviewDetailModal,
  ProductDetailMoreCard,
  ProductDetailWave,
  buildMoreFromStudioProducts,
  extractRelatedProducts,
  buildProductAccordionItems,
  SearchResultWave,
  RelatedIcon,
  SearchStoreCard
};
