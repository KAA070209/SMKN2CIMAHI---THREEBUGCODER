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
import {
  ReviewFormModal,
  MidtransSnapModal,
  MidtransPaymentUrlModal,
  extractSnapPaymentToken,
  extractSnapPaymentUrl,
  getConfiguredMidtransEnvironment,
  getConfiguredMidtransClientKey
} from "./paymentViews.jsx";

function ProfilePage({ scrolled, cartCount, wishCount, showToast, navigateTo, onSearch, toast, authUser, onLogout, onProfileUpdated }) {
  const fallbackUserRef = useRef(authUser);
  const onProfileUpdatedRef = useRef(onProfileUpdated);
  const [profile, setProfile] = useState(() => normalizeProfile(authUser, authUser));
  const [form, setForm] = useState(() => ({
    name: normalizeProfile(authUser, authUser).name,
    email: normalizeProfile(authUser, authUser).email,
    phone: normalizeProfile(authUser, authUser).phone,
  }));
const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    onProfileUpdatedRef.current = onProfileUpdated;
  }, [onProfileUpdated]);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigateTo("login");
      return undefined;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    Promise.allSettled([
      fetchCurrentUserProfile({ signal: controller.signal }),
      fetchMyOrders({ signal: controller.signal }),
    ])
      .then(([profileResult, ordersResult]) => {
        if (controller.signal.aborted) return;

        if (profileResult.status === "rejected") {
          throw profileResult.reason;
        }

        const orderRows = ordersResult.status === "fulfilled" ? extractProfileOrderRows(ordersResult.value) : null;
        const rawProfile = unwrapUserProfile(profileResult.value);
        const mergedProfile = {
          ...rawProfile,
          orders: orderRows && orderRows.length ? orderRows : rawProfile.orders,
        };
        const nextProfile = normalizeProfile(mergedProfile, fallbackUserRef.current);
        setProfile(nextProfile);
        setForm({
          name: nextProfile.name,
          email: nextProfile.email,
          phone: nextProfile.phone,
        });
        localStorage.setItem("authUser", JSON.stringify(nextProfile.raw));
        onProfileUpdatedRef.current?.(nextProfile.raw);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Gagal memuat profil.";
        setError(message);
        showToast?.(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [navigateTo, showToast]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
};

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedName = form.name ? form.name.trim() : "";
    const trimmedPhone = form.phone ? form.phone.trim() : "";
    const currentPhone = profile.phone || "";
    const nameCooldown = getNameChangeCooldown(getLastNameChangeAt(profile));

    if (!trimmedName) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    const payload = {};

    if (trimmedName !== (profile.name || "")) {
      if (nameCooldown.locked) {
        setError(`Nama sudah diubah, kamu bisa mengubah nama lagi dalam ${formatDurationRemaining(nameCooldown.remainingMs)}.`);
        return;
      }
      payload.name = trimmedName;
    }

    if (trimmedPhone !== currentPhone) {
      Object.assign(payload, buildProfilePhoneUpdatePayload(trimmedPhone));
    }

    if (!Object.keys(payload).length) {
      setIsEditing(false);
      showToast?.("Tidak ada perubahan untuk disimpan");
      return;
    }

    setIsSaving(true);
    try {
      const data = await updateCurrentUserProfile(payload);
      const updatedRawProfile = {
        ...unwrapUserProfile(data),
        ...profile.raw,
        ...payload,
        phone: trimmedPhone,
      };
      const nextProfile = normalizeProfile(updatedRawProfile, updatedRawProfile);
      if (payload.name) {
        recordNameChange(nextProfile);
      }
      setProfile(nextProfile);
      setForm({
        name: nextProfile.name,
        email: nextProfile.email,
        phone: nextProfile.phone,
      });
      localStorage.setItem("authUser", JSON.stringify(nextProfile.raw));
      onProfileUpdatedRef.current?.(nextProfile.raw);
      setIsEditing(false);
      showToast?.("Profil berhasil diperbarui");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memperbarui profil.";
      setError(message);
      showToast?.(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoFile = (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      showToast?.("File harus berupa gambar.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto profil maksimal 5 MB.");
      showToast?.("Ukuran foto profil maksimal 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => uploadPhoto(reader.result);
    reader.onerror = () => {
      const message = "Gagal membaca file gambar.";
      setError(message);
      showToast?.(message);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (dataUrl) => {
    const previousAvatar = profile.avatar;
    setProfile((current) => ({ ...current, avatar: dataUrl }));
    setIsUploadingPhoto(true);
    setError("");

    try {
      const data = await updateCurrentUserProfile({ photoprofil: dataUrl });
      const nextProfile = normalizeProfile(data, { ...profile.raw, photoprofil: dataUrl });
      setProfile(nextProfile);
      localStorage.setItem("authUser", JSON.stringify(nextProfile.raw));
      onProfileUpdatedRef.current?.(nextProfile.raw);
      showToast?.("Foto profil berhasil diperbarui");
    } catch (err) {
      setProfile((current) => (current.avatar === dataUrl ? { ...current, avatar: previousAvatar } : current));
      const message = err instanceof Error ? err.message : "Gagal mengubah foto profil.";
      setError(message);
      showToast?.(message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const firstName = (profile.name || "Pengguna").split(" ")[0] || "Pengguna";
  const membership = profile.membership;
  const latestOrders = profile.orders.slice(0, 2);
  const nameCooldown = getNameChangeCooldown(getLastNameChangeAt(profile));

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
        authUser={profile.raw}
        onLogout={onLogout}
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={styles.profileMain} className="bk-profile-main">
        <div style={styles.profileShell} className="bk-profile-shell">
          <aside className="seller-sidebar" aria-label="Navigasi akun">
            <button type="button" className="seller-brand" onClick={() => navigateTo("home")}>
              <span className="seller-brand__logo"><ProfileAvatar profile={profile} size={46} /></span>
              <span>
                <strong>{firstName}</strong>
                <small>{membership.level}</small>
              </span>
            </button>

            <nav className="seller-nav">
              <button type="button" className="seller-nav__item is-active"><UserRound size={20} strokeWidth={2.2} /><span>Profile</span></button>
              <button type="button" className="seller-nav__item" onClick={() => navigateTo("orders")}><ReceiptText size={20} strokeWidth={2.2} /><span>Orders</span></button>
              <button type="button" className="seller-nav__item" onClick={() => navigateTo("wishlist")}><Heart size={20} strokeWidth={2.2} /><span>Wishlist</span></button>
              <button type="button" className="seller-nav__item" onClick={() => navigateTo("addresses")}><MapPin size={20} strokeWidth={2.2} /><span>Alamat</span></button>
            </nav>

            <div className="seller-sidebar__bottom">
              <button type="button" className="seller-add-product" onClick={() => navigateTo("home")}>Kembali ke Beranda</button>
            </div>
          </aside>

          <section style={styles.profileContent} className="bk-profile-content">
            <div style={styles.profileHeaderBlock}>
              <h1 style={styles.profileTitle}>Halo, {firstName}!</h1>
              <p style={styles.profileLead}>Selamat datang kembali di ruang kreasimu.</p>
            </div>

            <section style={styles.profileMemberCard} className="bk-profile-card">
              <h2 style={styles.profileSectionTitle}>Status Keanggotaan</h2>
              <div style={styles.profileMemberGrid} className="bk-profile-member-grid">
                <div style={styles.profileLevelRow}>
                  <span style={styles.profileLevelIcon}><Star size={23} fill="#a82a59" color="#a82a59" strokeWidth={0} /></span>
                  <div>
                    <span style={styles.profileLevelLabel}>LEVEL SAAT INI</span>
                    <strong style={styles.profileLevelName}>{membership.level}</strong>
                  </div>
                </div>
                <div style={styles.profileProgressWrap}>
                  <div style={styles.profileProgressHead}>
                    <span>{membership.nextLevel ? `Progres ke ${membership.nextLevel}` : "Progres Keanggotaan"}</span>
                    <strong>{membership.progress}%</strong>
                  </div>
                  <div style={styles.profileProgressTrack}>
                    <span style={{ ...styles.profileProgressFill, width: `${membership.progress}%` }} />
                  </div>
                  <p style={styles.profileProgressHint}>{membership.progressText}</p>
                </div>
              </div>
              {membership.reward && (
                <div style={styles.profileRewardBanner} className="bk-profile-reward-banner">
                  <span style={styles.profileRewardBadge}><HandHeart size={20} strokeWidth={2.2} /></span>
                  <div style={styles.profileRewardBody}>
                    <strong style={styles.profileRewardTitle}>
                      {membership.reward.title}
                    </strong>
                    {membership.reward.description && (
                      <span style={styles.profileRewardDesc}>{membership.reward.description}</span>
                    )}
                    <div style={styles.profileRewardMeta}>
                      {membership.reward.discountLabel && (
                        <em style={styles.profileRewardDiscount}>{membership.reward.discountLabel}</em>
                      )}
                      {membership.reward.minPurchaseLabel && (
                        <span>{membership.reward.minPurchaseLabel}</span>
                      )}
                      {membership.reward.displayEndsAt && membership.reward.displayEndsAt !== "Tanpa batas" && (
                        <span>Berlaku s.d. {membership.reward.displayEndsAt}</span>
                      )}
                    </div>
                    <code style={styles.profileRewardCode}>{membership.reward.code}</code>
                  </div>
                </div>
              )}
              <div style={styles.profileDivider} />
              <div style={styles.profileBenefitGrid} className="bk-profile-benefit-grid">
                {membership.benefits.map((benefit) => (
                  <span key={benefit} style={styles.profileBenefitItem}>
                    <CircleCheck size={17} strokeWidth={2.2} />
                    {benefit}
                  </span>
                ))}
              </div>
            </section>

            <form style={styles.profileInfoCard} className="bk-profile-card" onSubmit={handleSubmit}>
              <div style={styles.profileInfoHead}>
                <h2 style={styles.profileSectionTitle}>Informasi Akun</h2>
                <div style={styles.profileInfoActions}>
                  <button
                    type="button"
                    style={styles.profileIconAction}
                    aria-label={isEditing ? "Batalkan edit profil" : "Edit profil"}
                    onClick={() => {
                      if (isEditing) {
                        setForm({ name: profile.name, email: profile.email, phone: profile.phone });
                      }
                      setIsEditing((current) => !current);
                    }}
                  >
<PencilLine size={20} strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    style={styles.profileCameraAction}
                    aria-label="Ubah foto profil"
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={20} strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoFile}
              />

              {isUploadingPhoto && (
                <div style={styles.profileLoadingBox}>Mengunggah foto profil...</div>
              )}

              {isLoading ? (
                <div style={styles.profileLoadingBox}>Memuat data profil...</div>
              ) : (
<>
                  <div style={styles.profileFormGrid} className="bk-profile-form-grid">
                    <ProfileField
                      label="NAMA LENGKAP"
                      value={form.name}
                      onChange={updateField("name")}
                      disabled={!isEditing || isSaving || nameCooldown.locked}
                      hint={
                        nameCooldown.locked
                          ? `Nama terakhir diubah pada ${formatChangedAtLabel(nameCooldown.changedAt)}. Kamu bisa mengubah nama lagi dalam ${formatDurationRemaining(nameCooldown.remainingMs)}.`
                          : undefined
                      }
                    />
                    <ProfileField
                      label="EMAIL"
                      type="email"
                      value={form.email}
                      disabled
                      hint="Email tidak dapat diubah"
                    />
                    <ProfileField
                      label="NOMOR TELEPON"
                      value={isEditing ? form.phone : form.phone || "-"}
                      onChange={updateField("phone")}
                      disabled={!isEditing || isSaving}
                      inputMode="tel"
                      wide
                    />
                  </div>

                  {error && <p style={styles.profileErrorText}>{error}</p>}

                  {isEditing && (
                    <div style={styles.profileSaveRow}>
                      <button type="submit" style={styles.profileSaveButton} className="bk-profile-save" disabled={isSaving}>
                        {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </form>

            <section style={styles.profileOrdersSection}>
              <div style={styles.profileOrdersHead}>
                <h2 style={styles.profileOrdersTitle}>Pesanan Terbaru</h2>
                <button type="button" style={styles.profileSeeAll} onClick={() => navigateTo("orders")}>
                  Lihat Semua <ArrowRight size={15} strokeWidth={2.3} />
                </button>
              </div>
              <div style={styles.profileOrderList}>
                {isLoading ? (
                  <div style={styles.profileLoadingBox}>Memuat pesanan terbaru...</div>
                ) : latestOrders.length ? (
                  latestOrders.map((order) => (
                    <article key={order.id} style={styles.profileOrderCard} className="bk-profile-order-card">
                      {order.image ? (
                        <img
                          src={order.image}
                          alt={order.title}
                          style={styles.profileOrderImage}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span style={styles.profileOrderImageFallback}><ShoppingBasket size={24} strokeWidth={2.1} /></span>
                      )}
                      <div style={styles.profileOrderCopy}>
                        <strong style={styles.profileOrderTitle}>{order.title}</strong>
                        <span style={styles.profileOrderMeta}>Order #{order.orderNumber}</span>
                        <span style={styles.profileOrderPrice}>{formatRupiah(order.priceValue)}</span>
                      </div>
                      <div style={styles.profileOrderAction}>
                        <span style={styles.profileOrderStatus}>{order.status}</span>
                        <button type="button" style={order.action === "Beli Lagi" ? styles.profileReorderButton : styles.profileTrackButton}>
                          {order.action}
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <section style={styles.profileEmptyOrders}>
                    <ShoppingBasket size={28} strokeWidth={2} />
                    <span>Belum ada pesanan terbaru</span>
                  </section>
                )}
              </div>
            </section>
          </section>
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

function ProfileAvatar({ profile, size = 64 }) {
  return (
    <span style={{ ...styles.profileAvatar, width: size, height: size }}>
      {profile.avatar ? (
        <img
          src={profile.avatar}
          alt={profile.name}
          style={styles.profileAvatarImage}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span style={styles.profileAvatarFallback}>{getProfileInitials(profile.name)}</span>
      )}
      <span style={styles.profileAvatarCamera}><Camera size={12} strokeWidth={2.2} /></span>
    </span>
  );
}

function ProfileField({ label, value, onChange, type = "text", disabled, wide = false, hint, inputMode }) {
  return (
    <label style={{ ...styles.profileField, ...(wide ? styles.profileFieldWide : {}) }} className="bk-profile-field">
      <span style={styles.profileFieldLabel}>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        inputMode={inputMode}
        style={styles.profileFieldInput}
      />
      {hint && <span style={styles.profileFieldHint}>{hint}</span>}
    </label>
  );
}

const ORDER_TABS = [
  { id: "all", label: "Semua" },
  { id: "unpaid", label: "Belum Bayar" },
  { id: "packed", label: "Dikemas" },
  { id: "shipped", label: "Dikirim" },
  { id: "completed", label: "Selesai" },
  { id: "canceled", label: "Dibatalkan" },
];

function OrdersPage({ scrolled, cartCount, wishCount, showToast, navigateTo, navigateToProduct, onSearch, toast, authUser, onLogout, onPayOrder }) {
  const [profile, setProfile] = useState(() => normalizeProfile(authUser, authUser));
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingOrderId, setPayingOrderId] = useState("");
  const [paymentModalUrl, setPaymentModalUrl] = useState("");
  const [snapToken, setSnapToken] = useState("");
  const [pendingPaymentUrl, setPendingPaymentUrl] = useState("");
const [detailState, setDetailState] = useState({
    open: false,
    isLoading: false,
    order: null,
    error: "",
  });
  const [reviewState, setReviewState] = useState({
    open: false,
    order: null,
    item: null,
  });

  const loadOrders = useCallback(async (signal, { quiet = false } = {}) => {
    if (!quiet) setIsLoading(true);
    setError("");

    try {
      const [profileResult, ordersResult] = await Promise.allSettled([
        fetchCurrentUserProfile({ signal }),
        fetchMyOrders({ signal }),
      ]);

      if (signal?.aborted) return;

      if (profileResult.status === "fulfilled") {
        setProfile(normalizeProfile(profileResult.value, authUser));
      }

      if (ordersResult.status === "rejected") {
        throw ordersResult.reason;
      }

      setOrders(normalizeBuyerOrders(ordersResult.value));
      setPage(1);
    } catch (err) {
      if (signal?.aborted) return;
      const message = err instanceof Error ? err.message : "Gagal memuat pesanan.";
      if (!quiet) {
        setError(message);
        setOrders([]);
        showToast?.(message);
      }
    } finally {
      if (!signal?.aborted && !quiet) setIsLoading(false);
    }
  }, [authUser, showToast]);

useEffect(() => {
    if (!isLoggedIn()) {
      navigateTo("login");
      return undefined;
    }

    const controller = new AbortController();
    loadOrders(controller.signal);

    const handleFocus = () => {
      if (!controller.signal.aborted) loadOrders(undefined, { quiet: true });
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      controller.abort();
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadOrders, navigateTo]);

  const firstName = (profile.name || "Pengguna").split(" ")[0] || "Pengguna";
  const membership = profile.membership;
  const filteredOrders = activeTab === "all" ? orders : orders.filter((order) => order.category === activeTab);
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const midtransEnvironment = getConfiguredMidtransEnvironment(pendingPaymentUrl);
  const midtransClientKey = getConfiguredMidtransClientKey(midtransEnvironment);

  const handleDetail = async (order) => {
    const orderId = getBuyerOrderRequestId(order);
    if (!orderId) {
      showToast?.("ID pesanan belum tersedia dari server.");
      return;
    }

    setDetailState({ open: true, isLoading: true, order, error: "" });

    try {
      const data = await fetchMyOrder(orderId);
      setDetailState({
        open: true,
        isLoading: false,
        order: normalizeBuyerOrder(unwrapBuyerOrderDetail(data), 0, order),
        error: "",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat detail pesanan.";
      setDetailState({ open: true, isLoading: false, order, error: message });
      showToast?.(message);
    }
  };

  const handlePayOrder = async (order) => {
    const orderId = getBuyerOrderRequestId(order);
    if (!orderId) {
      showToast?.("ID pesanan belum tersedia dari server.");
      return;
    }

    setPayingOrderId(String(orderId));
    setDetailState((current) => current.open ? { ...current, open: false } : current);

    try {
      const paymentData = await createPayment(orderId, undefined, {
        signal: AbortSignal.timeout(60000),
      });
      const snapTokenValue = extractSnapPaymentToken(paymentData);
      const paymentUrl = extractSnapPaymentUrl(paymentData);
      const paymentEnvironment = getConfiguredMidtransEnvironment(paymentUrl);
      const clientKey = getConfiguredMidtransClientKey(paymentEnvironment);

      if (snapTokenValue && clientKey) {
        setSnapToken(snapTokenValue);
        setPendingPaymentUrl(paymentUrl || "");
        return;
      }

      if (paymentUrl) {
        setPaymentModalUrl(paymentUrl);
        return;
      }

      if (typeof onPayOrder === "function") {
        onPayOrder(orderId);
        return;
      }

      showToast?.("Link pembayaran Midtrans belum tersedia. Silakan coba lagi.");
    } catch (err) {
      if (err?.name === "TimeoutError" || err?.name === "AbortError") {
        showToast?.("Koneksi ke layanan pembayaran habis waktu. Silakan coba lagi.");
      } else if (err instanceof TypeError) {
        showToast?.("Gagal terhubung ke layanan pembayaran. Periksa koneksi atau CORS lalu coba lagi.");
      } else {
        showToast?.(err instanceof Error ? err.message : "Gagal membuka pembayaran.");
      }
    } finally {
      setPayingOrderId("");
    }
  };

const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  const handleReview = (order) => {
    const item =
      (order.items || []).find((entry) => entry.orderItemId && !isOrderItemReviewed(entry.orderItemId)) || null;
    if (!item) {
      showToast?.("Semua produk pada pesanan ini sudah diberi ulasan.");
      return;
    }
    setReviewState({ open: true, order, item });
  };

  const closeReview = () => {
    setReviewState({ open: false, order: null, item: null });
  };

const refreshOrdersAfterPayment = () => {
    loadOrders(undefined, { quiet: true });
    window.setTimeout(() => loadOrders(undefined, { quiet: true }), 3500);
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
        authUser={profile.raw}
        onLogout={onLogout}
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={styles.profileMain} className="bk-profile-main">
        <div style={styles.profileShell} className="bk-profile-shell">
          <aside className="seller-sidebar" aria-label="Navigasi akun">
            <button type="button" className="seller-brand" onClick={() => navigateTo("home")}>
              <span className="seller-brand__logo"><ProfileAvatar profile={profile} size={46} /></span>
              <span>
                <strong>{firstName}</strong>
                <small>{membership.level}</small>
              </span>
            </button>

            <nav className="seller-nav">
              <button type="button" className="seller-nav__item" onClick={() => navigateTo("profile")}><UserRound size={20} strokeWidth={2.2} /><span>Profile</span></button>
              <button type="button" className="seller-nav__item is-active"><ReceiptText size={20} strokeWidth={2.2} /><span>Orders</span></button>
              <button type="button" className="seller-nav__item" onClick={() => navigateTo("wishlist")}><Heart size={20} strokeWidth={2.2} /><span>Wishlist</span></button>
              <button type="button" className="seller-nav__item" onClick={() => navigateTo("addresses")}><MapPin size={20} strokeWidth={2.2} /><span>Alamat</span></button>
            </nav>

            <div className="seller-sidebar__bottom">
              <button type="button" className="seller-add-product" onClick={() => navigateTo("home")}>Kembali ke Beranda</button>
            </div>
          </aside>

          <section style={styles.profileContent} className="bk-profile-content">
<div style={styles.profileHeaderBlock}>
              <h1 style={styles.profileTitle}>Pesanan Saya</h1>
            </div>

            <div style={styles.ordersTabs} className="bk-orders-tabs" role="tablist" aria-label="Filter pesanan">
              {ORDER_TABS.map((tab) => {
                const count = tab.id === "all" ? orders.length : orders.filter((order) => order.category === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    style={{ ...styles.ordersTab, ...(activeTab === tab.id ? styles.ordersTabActive : {}) }}
                    className="bk-orders-tab"
                    onClick={() => handleTabClick(tab.id)}
                  >
                    {tab.label}
                    {count > 0 && <span style={styles.ordersTabCount}>{count}</span>}
                  </button>
                );
              })}
            </div>

            {error ? (
              <section style={styles.ordersStateBox}>
                <ReceiptText size={34} strokeWidth={1.9} />
                <h2 style={styles.ordersStateTitle}>Pesanan belum bisa dimuat</h2>
                <p style={styles.ordersStateText}>{error}</p>
                <button type="button" style={styles.ordersPrimaryButton} className="bk-orders-action" onClick={() => loadOrders()}>
                  Coba Lagi
                </button>
              </section>
            ) : isLoading ? (
              <section style={styles.ordersStateBox}>
                <ReceiptText size={34} strokeWidth={1.9} />
                <h2 style={styles.ordersStateTitle}>Memuat pesanan...</h2>
                <p style={styles.ordersStateText}>Sebentar ya, kami sedang mengambil riwayat pesananmu.</p>
              </section>
            ) : visibleOrders.length ? (
              <>
                <div style={styles.ordersList} className="bk-orders-list">
                  {visibleOrders.map((order) => (
<BuyerOrderCard
                      key={order.id}
                      order={order}
                      onDetail={() => handleDetail(order)}
                      onPay={() => handlePayOrder(order)}
                      isPaying={payingOrderId === String(getBuyerOrderRequestId(order))}
                      onReview={handleReview}
                      onReorder={() => showToast?.("Fitur beli lagi akan mengikuti endpoint checkout produk.")}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={styles.ordersPagination} aria-label="Navigasi halaman pesanan">
                    <button
                      type="button"
                      style={styles.ordersPageButton}
                      className="bk-orders-page"
                      aria-label="Halaman sebelumnya"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                    >
                      <ChevronLeft size={18} strokeWidth={2.4} />
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        style={{ ...styles.ordersPageNumber, ...(pageNumber === currentPage ? styles.ordersPageNumberActive : {}) }}
                        className="bk-orders-page"
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      style={styles.ordersPageButton}
                      className="bk-orders-page"
                      aria-label="Halaman berikutnya"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    >
                      <ChevronRight size={18} strokeWidth={2.4} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <section style={styles.ordersStateBox}>
                <ShoppingBasket size={36} strokeWidth={1.9} />
                <h2 style={styles.ordersStateTitle}>
                  {orders.length ? "Tidak ada pesanan untuk filter ini" : "Belum ada pesanan"}
                </h2>
                <p style={styles.ordersStateText}>Pesanan yang kamu buat sebagai buyer akan tampil di halaman ini.</p>
                <button type="button" style={styles.ordersPrimaryButton} className="bk-orders-action" onClick={() => navigateTo("home")}>
                  Jelajahi Produk
                </button>
              </section>
            )}
          </section>
        </div>
      </main>

      <SiteFooter showToast={showToast} navigateTo={navigateTo} />

<OrderDetailModal
        state={detailState}
        onClose={() => setDetailState({ open: false, isLoading: false, order: null, error: "" })}
        onPay={handlePayOrder}
        payingOrderId={payingOrderId}
      />

      <ReviewFormModal
        state={reviewState}
        onClose={closeReview}
        showToast={showToast}
        navigateToProduct={navigateToProduct}
        onSubmitSuccess={() => loadOrders(undefined, { quiet: true })}
      />

      {snapToken && (
        <MidtransSnapModal
          token={snapToken}
          clientKey={midtransClientKey}
          environment={midtransEnvironment}
          snapUrl={pendingPaymentUrl}
          onClose={() => {
            setSnapToken("");
            setPendingPaymentUrl("");
          }}
          onSuccess={() => {
            setSnapToken("");
            setPendingPaymentUrl("");
            showToast?.("Pembayaran berhasil!");
            refreshOrdersAfterPayment();
          }}
          onPending={() => {
            setSnapToken("");
            setPendingPaymentUrl("");
            showToast?.("Menunggu pembayaran, cek status pesananmu.");
            refreshOrdersAfterPayment();
          }}
          onError={() => {
            setSnapToken("");
            setPendingPaymentUrl("");
            showToast?.("Pembayaran gagal, silakan coba lagi.");
          }}
        />
      )}

      {paymentModalUrl && (
        <MidtransPaymentUrlModal
          url={paymentModalUrl}
          onClose={() => {
            setPaymentModalUrl("");
          }}
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

function BuyerOrderCard({ order, onDetail, onPay, onReorder, onReview, isPaying = false }) {
  const primaryItem = order.items[0] || {};
  const statusStyle = getBuyerOrderStatusStyle(order.category);
  const showPay = order.category === "unpaid";
  const showReorder = order.category === "completed";
  const hasReviewableItem = (order.items || []).some(
    (item) => item.orderItemId && !isOrderItemReviewed(item.orderItemId)
  );

  return (
    <article
      style={{ ...styles.orderCard, ...(order.category === "unpaid" ? styles.orderCardUnpaid : {}) }}
      className="bk-order-card"
    >
      <header style={styles.orderCardHeader} className="bk-order-card-header">
        <div style={styles.orderMetaRow}>
          <strong style={styles.orderNumber}>#{order.orderNumber}</strong>
          <span style={styles.orderDot} aria-hidden="true" />
          <span style={styles.orderDate}>{formatBuyerOrderDate(order.createdAt)}</span>
        </div>
<span style={{ ...styles.orderStatusBadge, ...statusStyle }} className="bk-order-status-badge">
          {order.statusLabel}
        </span>
      </header>

      <div style={styles.orderCardDivider} />

      <div style={styles.orderMainRow} className="bk-order-main-row">
        <div style={styles.orderProductBlock} className="bk-order-product-block">
          {primaryItem.image ? (
            <img
              src={primaryItem.image}
              alt={primaryItem.title}
              style={styles.orderProductImage}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span style={styles.orderProductFallback}><ShoppingBasket size={24} strokeWidth={2.1} /></span>
          )}
          <div style={styles.orderProductCopy}>
            <h2 style={styles.orderProductTitle} className="bk-order-product-title">{primaryItem.title || "Produk"}</h2>
            <span style={styles.orderProductMeta}>
              Qty: {primaryItem.quantity || 1} x {formatRupiah(primaryItem.unitPrice || 0)}
              {order.items.length > 1 ? ` +${order.items.length - 1} produk lain` : ""}
            </span>
            <span style={styles.orderStoreLine}>
              <Store size={14} strokeWidth={2.1} />
              {primaryItem.storeName || order.storeName || "Toko BumiKriya"}
            </span>
          </div>
        </div>

<div style={styles.orderTotalBlock} className="bk-order-total-block">
          <span style={styles.orderTotalLabel}>Total Pesanan</span>
          <strong style={{ ...styles.orderTotalValue, ...(order.category === "unpaid" ? styles.orderTotalValueDanger : {}) }}>
            {formatRupiah(order.totalValue)}
          </strong>
        </div>
      </div>

      <div style={styles.orderCardDivider} />

<footer style={styles.orderActions} className="bk-order-actions">
        <button type="button" style={styles.ordersSecondaryButton} className="bk-orders-action" onClick={onDetail}>
          Lihat Detail
        </button>
        {showPay ? (
          <button type="button" style={styles.ordersPrimaryButton} className="bk-orders-action" onClick={onPay} disabled={isPaying}>
            {isPaying ? "Mengarahkan..." : "Bayar Sekarang"}
          </button>
        ) : showReorder ? (
          <button type="button" style={styles.ordersOutlineButton} className="bk-orders-action" onClick={onReorder}>
            Beli Lagi
          </button>
) : order.category === "shipped" ? (
          <button type="button" style={styles.ordersPrimaryButton} className="bk-orders-action" onClick={onDetail}>
            Lacak Pesanan
          </button>
        ) : null}
        {order.category === "completed" && hasReviewableItem && (
          <button
            type="button"
            style={styles.ordersOutlineButton}
            className="bk-orders-action"
            onClick={() => onReview?.(order)}
          >
            <Star size={15} strokeWidth={2.2} />
            Beri Ulasan
          </button>
        )}
      </footer>
    </article>
  );
}

function OrderDetailModal({ state, onClose, onPay, payingOrderId = "" }) {
  if (!state.open) return null;

  const order = state.order;

  return createPortal(
    <div style={styles.orderModalOverlay} className="bk-order-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        style={styles.orderModal}
        className="bk-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" style={styles.orderModalClose} aria-label="Tutup detail pesanan" onClick={onClose}>
          <X size={20} strokeWidth={2.2} />
        </button>

        <div style={styles.orderModalHead}>
          <h2 id="order-detail-title" style={styles.orderModalTitle}>Detail Pesanan</h2>
          {order && <span style={styles.orderModalNumber}>#{order.orderNumber}</span>}
        </div>

        {state.isLoading ? (
          <div style={styles.profileLoadingBox}>Memuat detail pesanan...</div>
        ) : state.error ? (
          <div style={styles.ordersDetailError}>{state.error}</div>
        ) : order ? (
          <>
            <div style={styles.orderDetailGrid} className="bk-order-detail-grid">
              <div style={styles.orderDetailItem}>
                <span>Status</span>
                <strong>{order.statusLabel}</strong>
              </div>
              <div style={styles.orderDetailItem}>
                <span>Tanggal</span>
                <strong>{formatBuyerOrderDate(order.createdAt)}</strong>
              </div>
              <div style={styles.orderDetailItem}>
                <span>Total</span>
                <strong>{formatRupiah(order.totalValue)}</strong>
              </div>
              <div style={styles.orderDetailItem}>
                <span>Pembayaran</span>
                <strong>{order.paymentMethod || "-"}</strong>
              </div>
              {order.paidAt && (
                <div style={styles.orderDetailItem}>
                  <span>Dibayar</span>
                  <strong>{formatBuyerOrderDate(order.paidAt)}</strong>
                </div>
              )}
            </div>

            <div style={styles.orderDetailItems}>
              {order.items.map((item) => (
                <div key={item.id} style={styles.orderDetailProduct}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      style={styles.orderDetailImage}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span style={styles.orderDetailImageFallback}><ShoppingBasket size={20} strokeWidth={2} /></span>
                  )}
                  <div style={styles.orderDetailCopy}>
                    <strong>{item.title}</strong>
                    <span>{item.quantity} x {formatRupiah(item.unitPrice)}</span>
                    <small>{item.storeName || order.storeName || "Toko BumiKriya"}</small>
                  </div>
                  <strong style={styles.orderDetailSubtotal}>{formatRupiah(item.subtotal)}</strong>
                </div>
              ))}
            </div>

            {order.shippingAddress && (
              <div style={styles.orderShippingBox}>
                <strong>Alamat Pengiriman</strong>
                <p>{order.shippingAddress}</p>
              </div>
            )}

            {order.category === "unpaid" && (
              <button
                type="button"
                style={styles.ordersPrimaryButton}
                className="bk-orders-action"
                onClick={() => onPay?.(order)}
                disabled={payingOrderId === String(getBuyerOrderRequestId(order))}
              >
                {payingOrderId === String(getBuyerOrderRequestId(order)) ? "Mengarahkan..." : "Bayar Sekarang"}
              </button>
            )}
          </>
        ) : null}
      </section>
    </div>,
    document.body
  );
}

function AddressPage({ scrolled, cartCount, wishCount, showToast, navigateTo, onSearch, toast, authUser, onLogout }) {
  const [profile, setProfile] = useState(() => normalizeProfile(authUser, authUser));
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState("");
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyAddressId, setBusyAddressId] = useState("");

  const loadAddresses = useCallback(async (signal) => {
    setIsLoading(true);
    setError("");

    try {
      const [profileResult, addressesResult] = await Promise.allSettled([
        fetchCurrentUserProfile({ signal }),
        fetchMyAddresses({ signal }),
      ]);

      if (signal?.aborted) return;

      if (profileResult.status === "fulfilled") {
        setProfile(normalizeProfile(profileResult.value, authUser));
      }

      if (addressesResult.status === "rejected") {
        throw addressesResult.reason;
      }

      setAddresses(normalizeAddresses(addressesResult.value));
    } catch (err) {
      if (signal?.aborted) return;
      const message = err instanceof Error ? err.message : "Gagal memuat alamat.";
      setError(message);
      showToast?.(message);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [authUser, showToast]);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigateTo("login");
      return undefined;
    }

    const controller = new AbortController();
    loadAddresses(controller.signal);
    return () => controller.abort();
  }, [loadAddresses, navigateTo]);

  const openCreateModal = () => {
    setEditingAddress(null);
    setModalMode("create");
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setModalMode("edit");
  };

  const closeModal = () => {
    if (isSaving) return;
    setModalMode("");
    setEditingAddress(null);
  };

  const handleSaveAddress = async (form) => {
    const payload = buildAddressPayload(form);
    setIsSaving(true);
    setError("");

    try {
      if (modalMode === "edit" && editingAddress?.id) {
        await updateMyAddress(editingAddress.id, payload);
        showToast?.("Alamat berhasil diperbarui");
      } else {
        await createMyAddress(payload);
        showToast?.("Alamat baru berhasil disimpan");
      }
      setModalMode("");
      setEditingAddress(null);
      await loadAddresses();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan alamat.";
      setError(message);
      showToast?.(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteTarget?.id) return;

    setBusyAddressId(String(deleteTarget.id));
    try {
      await deleteMyAddress(deleteTarget.id);
      setDeleteTarget(null);
      setAddresses((current) => current.filter((address) => String(address.id) !== String(deleteTarget.id)));
      showToast?.("Alamat berhasil dihapus");
      await loadAddresses();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Gagal menghapus alamat.");
    } finally {
      setBusyAddressId("");
    }
  };

  const handleSetDefault = async (address) => {
    if (!address?.id || address.isDefault) return;

    setBusyAddressId(String(address.id));
    try {
      await updateMyAddress(address.id, { is_default: true });
      setAddresses((current) =>
        current.map((item) => ({ ...item, isDefault: String(item.id) === String(address.id) }))
      );
      showToast?.("Alamat utama diperbarui");
      await loadAddresses();
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : "Gagal menjadikan alamat utama.");
    } finally {
      setBusyAddressId("");
    }
  };

  const firstName = (profile.name || "Pengguna").split(" ")[0] || "Pengguna";
  const membership = profile.membership;

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
        authUser={profile.raw}
        onLogout={onLogout}
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={styles.profileMain} className="bk-profile-main">
        <div style={styles.profileShell} className="bk-profile-shell">
          <aside className="seller-sidebar" aria-label="Navigasi akun">
            <button type="button" className="seller-brand" onClick={() => navigateTo("home")}>
              <span className="seller-brand__logo"><ProfileAvatar profile={profile} size={46} /></span>
              <span>
                <strong>{firstName}</strong>
                <small>{membership.level}</small>
              </span>
            </button>

            <nav className="seller-nav">
              <button type="button" className="seller-nav__item" onClick={() => navigateTo("profile")}><UserRound size={20} strokeWidth={2.2} /><span>Profile</span></button>
              <button type="button" className="seller-nav__item" onClick={() => navigateTo("orders")}><ReceiptText size={20} strokeWidth={2.2} /><span>Orders</span></button>
              <button type="button" className="seller-nav__item" onClick={() => navigateTo("wishlist")}><Heart size={20} strokeWidth={2.2} /><span>Wishlist</span></button>
              <button type="button" className="seller-nav__item is-active"><MapPin size={20} strokeWidth={2.2} /><span>Alamat</span></button>
            </nav>

            <div className="seller-sidebar__bottom">
              <button type="button" className="seller-add-product" onClick={() => navigateTo("home")}>Kembali ke Beranda</button>
            </div>
          </aside>

          <section style={styles.profileContent} className="bk-profile-content">
            <div style={styles.addressHeaderRow} className="bk-address-header">
              <div>
                <h1 style={styles.profileTitle}>Daftar Alamat</h1>
                <p style={styles.profileLead}>Kelola alamat pengiriman untuk memudahkan proses checkout Anda.</p>
              </div>
              <button type="button" style={styles.addressAddButton} className="bk-address-add" onClick={openCreateModal}>
                <Plus size={18} strokeWidth={2.4} />
                Tambah Alamat Baru
              </button>
            </div>

            {isLoading ? (
              <div style={styles.profileLoadingBox}>Memuat daftar alamat...</div>
            ) : error ? (
              <section style={styles.addressEmptyState}>
                <MapPin size={30} strokeWidth={2} />
                <p>{error}</p>
                <button type="button" style={styles.profileSaveButton} className="bk-profile-save" onClick={() => loadAddresses()}>
                  Muat Ulang
                </button>
              </section>
            ) : addresses.length ? (
              <div style={styles.addressGrid} className="bk-address-grid">
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    style={{ ...styles.addressCard, ...(address.isDefault ? styles.addressCardDefault : {}) }}
                    className="bk-address-card"
                  >
                    <div style={styles.addressCardHead}>
                      <h2 style={styles.addressCardTitle}>{address.name}</h2>
                      {address.label && <span style={styles.addressBadge}>{address.label}</span>}
                      {address.isDefault && <span style={styles.addressPrimaryBadge}>Alamat Utama</span>}
                    </div>
                    <p style={styles.addressPhone}>{address.phone || "-"}</p>
                    <p style={styles.addressText}>{formatAddressText(address) || "-"}</p>
                    <div style={styles.addressDivider} />
                    <div style={styles.addressActions}>
                      <button type="button" style={styles.addressLinkButton} onClick={() => openEditModal(address)}>
                        Ubah
                      </button>
                      <button type="button" style={styles.addressDangerButton} onClick={() => setDeleteTarget(address)} disabled={busyAddressId === String(address.id)}>
                        Hapus
                      </button>
                      {!address.isDefault && (
                        <button
                          type="button"
                          style={styles.addressDefaultButton}
                          onClick={() => handleSetDefault(address)}
                          disabled={busyAddressId === String(address.id)}
                        >
                          Jadikan Utama
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <section style={styles.addressEmptyState}>
                <MapPin size={34} strokeWidth={2} />
                <h2>Belum ada alamat tersimpan</h2>
                <p>Tambahkan alamat pengiriman agar checkout berikutnya tinggal pilih dari dropdown.</p>
                <button type="button" style={styles.addressAddButton} className="bk-address-add" onClick={openCreateModal}>
                  <Plus size={18} strokeWidth={2.4} />
                  Tambah Alamat Baru
                </button>
              </section>
            )}
          </section>
        </div>
      </main>

      <SiteFooter showToast={showToast} navigateTo={navigateTo} />

      {modalMode && (
        <AddressModal
          mode={modalMode}
          address={editingAddress}
          isSaving={isSaving}
          onClose={closeModal}
          onSubmit={handleSaveAddress}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus alamat ini?"
        message="Alamat yang dihapus tidak bisa dipilih lagi saat checkout."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteAddress}
        onCancel={() => setDeleteTarget(null)}
      />

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

function AddressModal({ mode, address, isSaving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => getAddressFormDefaults(address));
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(getAddressFormDefaults(address));
    setError("");
  }, [address]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && !isSaving) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isSaving, onClose]);

  const updateField = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleMapPick = ({ lat, lng, address: placeAddress, city, province, postalCode }) => {
    setForm((current) => ({
      ...current,
      lat: Number.isFinite(lat) ? lat : current.lat,
      lng: Number.isFinite(lng) ? lng : current.lng,
      address: placeAddress ? placeAddress : current.address,
      city: city ? city : current.city,
      province: province ? province : current.province,
      postalCode: postalCode ? postalCode : current.postalCode,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Nomor telepon wajib diisi.");
      return;
    }
    if (!form.address.trim()) {
      setError("Alamat lengkap wajib diisi.");
      return;
    }
    if (!form.city.trim()) {
      setError("Kota wajib diisi.");
      return;
    }
    if (!form.province.trim()) {
      setError("Provinsi wajib diisi.");
      return;
    }

    onSubmit?.(form);
  };

  return createPortal(
    <div
      style={styles.addressModalOverlay}
      className="bk-auth-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose?.();
      }}
    >
      <form
        style={styles.addressModal}
        className="bk-auth-modal bk-address-modal"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
      >
        <button type="button" style={styles.authModalClose} className="bk-auth-modal-close" onClick={onClose} disabled={isSaving} aria-label="Tutup popup">
          <X size={22} strokeWidth={2.1} />
        </button>

        <h2 id="address-modal-title" style={styles.addressModalTitle}>
          {mode === "edit" ? "Ubah Alamat" : "Tambah Alamat Baru"}
        </h2>

        <div style={styles.addressModalGrid} className="bk-address-modal-grid">
          <AddressFormField label="Nama Lengkap" value={form.name} onChange={updateField("name")} placeholder="Contoh: Azka" wide />
          <AddressFormField label="Nomor Telepon" value={form.phone} onChange={updateField("phone")} placeholder="0812-xxxx-xxxx" inputMode="tel" wide />
          <AddressFormField label="Alamat Lengkap" value={form.address} onChange={updateField("address")} placeholder="Nama jalan, nomor rumah, RT/RW..." textarea wide />
          <AddressFormField label="Kota" value={form.city} onChange={updateField("city")} placeholder="Bandung" />
          <AddressFormField label="Provinsi" value={form.province} onChange={updateField("province")} placeholder="Jawa Barat" />
          <AddressFormField label="Kode Pos" value={form.postalCode} onChange={updateField("postalCode")} placeholder="40123" inputMode="numeric" />
          <div style={styles.addressMapSection}>
            <span style={styles.paymentLabel}>Pilih Titik di Peta</span>
            <LocationPickerMap
              coords={Number.isFinite(form.lat) && Number.isFinite(form.lng) ? { lat: form.lat, lng: form.lng } : null}
              onPick={handleMapPick}
              disabled={isSaving}
            />
          </div>
          <AddressFormField label="Label Alamat" value={form.label} onChange={updateField("label")} placeholder="Rumah, Kantor, Apartemen..." wide />
        </div>

        <label style={styles.addressCheckboxRow}>
          <input
            type="checkbox"
            className="bk-terms-checkbox"
            checked={form.isDefault}
            onChange={updateField("isDefault")}
          />
          <span>Jadikan Alamat Utama</span>
        </label>

        {error && <p style={styles.profileErrorText}>{error}</p>}

        <div style={styles.addressModalActions}>
          <button type="button" style={styles.addressModalCancel} onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button type="submit" style={styles.addressModalSubmit} className="bk-auth-modal-primary" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Alamat"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function AddressFormField({ label, value, onChange, placeholder, inputMode, textarea = false, wide = false }) {
  return (
    <label style={{ ...styles.addressFormField, ...(wide ? styles.addressFormFieldWide : {}) }}>
      <span style={styles.paymentLabel}>{label}</span>
      {textarea ? (
        <textarea
          style={{ ...styles.paymentInput, ...styles.paymentTextarea, borderRadius: 8 }}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          style={{ ...styles.paymentInput, borderRadius: 8 }}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          inputMode={inputMode}
        />
      )}
    </label>
  );
}

export {
  ProfilePage,
  ProfileAvatar,
  ProfileField,
  ORDER_TABS,
  OrdersPage,
  BuyerOrderCard,
  OrderDetailModal,
  AddressPage,
  AddressModal,
  AddressFormField
};
