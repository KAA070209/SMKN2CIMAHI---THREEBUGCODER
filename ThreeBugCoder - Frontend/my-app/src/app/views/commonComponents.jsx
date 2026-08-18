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

function SiteHeader({ scrolled, cartCount, wishCount, navigateTo, onLogoClick, onSearch, authUser, onLogout, showToast, compactActions = false }) {
  const displayName = pickDisplayName(authUser).split(" ")[0];
  const email = pickEmail(authUser);
  const fallbackName = email ? email.split("@")[0] : "";
  const chipName = displayName || fallbackName || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef(null);
  const [sellerFormOpen, setSellerFormOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen && !mobileNavOpen) return undefined;

    const closeMenus = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileNavOpen(false);
        return;
      }

      if (event.type === "mousedown") {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setMenuOpen(false);
        }
        if (mobileNavRef.current && !mobileNavRef.current.contains(event.target)) {
          setMobileNavOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", closeMenus);
    document.addEventListener("keydown", closeMenus);
    return () => {
      document.removeEventListener("mousedown", closeMenus);
      document.removeEventListener("keydown", closeMenus);
    };
  }, [menuOpen, mobileNavOpen]);

  const closeMobileNav = () => setMobileNavOpen(false);

  const handleMenuNav = (view) => {
    setMenuOpen(false);
    navigateTo(view);
  };

  const handleStartSelling = () => {
    if (!isLoggedIn()) {
      alert("Harap login terlebih dahulu");
      navigateTo("login");
      return;
    }
    setSellerFormOpen(true);
  };

  const handleSellerRegistered = (storeName) => {
    const cached = getStoredAuthUser();
    if (cached) {
      const updated = {
        ...cached,
        role: "seller",
        user_role: "seller",
        userType: "seller",
        storeName,
        store_name: storeName,
      };
      localStorage.setItem("authUser", JSON.stringify(updated));
    }
    showToast?.(`Selamat! Toko "${storeName}" berhasil didaftarkan.`);
  };

  const handleSellerCenter = async () => {
    if (!isLoggedIn()) {
      showToast?.("Silakan login terlebih dahulu untuk masuk Seller Center");
      navigateTo("login");
      return;
    }

    const cached = getStoredAuthUser();

    if (isSellerUser(cached)) {
      navigateTo("sellerDashboard");
      return;
    }

    try {
      const store = await fetchSellerStore();
      const storeName =
        store?.store_name ||
        store?.storeName ||
        store?.name ||
        store?.data?.store_name ||
        store?.data?.name ||
        "";
      const updated = {
        ...(cached || {}),
        role: "seller",
        user_role: "seller",
        userType: "seller",
        is_seller: true,
        isSeller: true,
        store_name: storeName,
        storeName,
      };
      localStorage.setItem("authUser", JSON.stringify(updated));
      navigateTo("sellerDashboard");
    } catch {
      showToast?.("Daftar sebagai seller terlebih dahulu untuk masuk Seller Center");
      setSellerFormOpen(true);
    }
  };

  return (
    <>
      <header
        className="bk-site-header"
        style={{
          ...styles.header,
          boxShadow: scrolled ? "0 10px 30px -12px rgba(89,13,38,0.35)" : "0 0 0 rgba(0,0,0,0)",
          paddingTop: scrolled ? 14 : 22,
          paddingBottom: scrolled ? 14 : 22,
        }}
      >
        <div style={styles.headerInner} className="bk-header-inner">
          <a
            href={onLogoClick ? "#top" : "/"}
            onClick={(e) => {
              if (onLogoClick) {
                onLogoClick(e);
                return;
              }
              e.preventDefault();
              navigateTo("home");
            }}
            style={styles.logo}
            className="bk-logo"
          >
            BumiKriya
          </a>

          <button
            type="button"
            aria-label={mobileNavOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileNavOpen}
            className="bk-nav-toggle"
            style={styles.navToggle}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={22} strokeWidth={2.2} /> : <Menu size={22} strokeWidth={2.2} />}
          </button>

          <nav style={styles.headerRight} className="bk-header-right">
            {onSearch && scrolled && <HeaderSearch onSearch={onSearch} />}
            {!compactActions && (
              <>
                <button
                  type="button"
                  className="bk-seller-btn"
                  style={styles.sellerBtn}
                  onClick={handleSellerCenter}
                >
                  <Store size={17} strokeWidth={2.1} color="#590d26" />
                  <span>Seller Center</span>
                </button>
                <button
                  type="button"
                  className="bk-seller-btn"
                  style={styles.sellerBtn}
                  onClick={handleStartSelling}
                >
                  <Store size={17} strokeWidth={2.1} color="#590d26" />
                  <span>Mulai Berjualan</span>
                </button>
              </>
            )}
            {compactActions && (
              <button
                type="button"
                aria-label="Keranjang"
                className="bk-icon-btn"
                style={styles.iconBtn}
                onClick={() => navigateTo("cart")}
              >
                <ShoppingBasket size={20} strokeWidth={2} color="#590d26" />
                {cartCount > 0 && <span style={styles.iconBadge} className="bk-badge-pop">{cartCount}</span>}
              </button>
            )}
            <button
              type="button"
              aria-label="Wishlist"
              className="bk-icon-btn"
              style={styles.iconBtn}
              onClick={() => navigateTo("wishlist")}
            >
              <Heart size={20} strokeWidth={2} color="#590d26" fill={wishCount > 0 ? "#590d26" : "none"} />
              {wishCount > 0 && <span style={styles.iconBadge} className="bk-badge-pop">{wishCount}</span>}
            </button>
            {!compactActions && (
              <button
                type="button"
                aria-label="Keranjang"
                className="bk-icon-btn"
                style={styles.iconBtn}
                onClick={() => navigateTo("cart")}
              >
                <ShoppingBasket size={20} strokeWidth={2} color="#590d26" />
                {cartCount > 0 && <span style={styles.iconBadge} className="bk-badge-pop">{cartCount}</span>}
              </button>
            )}
            {authUser ? (
              <div style={styles.userMenuWrap} ref={menuRef}>
                <button
                  type="button"
                  className="bk-signin"
                  style={styles.userChip}
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span>{chipName} {"\uD83D\uDC4B"}</span>
                  <ChevronDown size={15} strokeWidth={2.5} color="#590d26" />
                </button>

                {menuOpen && (
                  <div style={styles.userMenu} className="bk-dropdown-in" role="menu">
                    <div style={styles.userMenuHead}>
                      <strong style={styles.userMenuName}>{chipName} {"\uD83D\uDC4B"}</strong>
                      {email && <span style={styles.userMenuEmail}>{email}</span>}
                    </div>
                    <button type="button" className="bk-user-menu-item" role="menuitem" style={styles.userMenuItem} onClick={() => handleMenuNav("profile")}>
                      <UserRound size={15} strokeWidth={2.1} />
                      <span>Profil Saya</span>
                    </button>
                    <button type="button" className="bk-user-menu-item" role="menuitem" style={styles.userMenuItem} onClick={() => handleMenuNav("orders")}>
                      <ReceiptText size={15} strokeWidth={2.1} />
                      <span>Pesanan Saya</span>
                    </button>
                    <button type="button" className="bk-user-menu-item" role="menuitem" style={styles.userMenuItem} onClick={() => handleMenuNav("wishlist")}>
                      <Heart size={15} strokeWidth={2.1} />
                      <span>Wishlist</span>
                    </button>
                    <button type="button" className="bk-user-menu-item" role="menuitem" style={styles.userMenuItem} onClick={() => handleMenuNav("addresses")}>
                      <MapPin size={15} strokeWidth={2.1} />
                      <span>Alamat</span>
                    </button>
                    <button
                      type="button"
                      className="bk-user-menu-item"
                      role="menuitem"
                      style={{ ...styles.userMenuItem, ...styles.userMenuDanger }}
                      onClick={() => {
                        setMenuOpen(false);
                        setLogoutConfirmOpen(true);
                      }}
                    >
                      <LogOut size={15} strokeWidth={2.1} />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="bk-signin" style={styles.signInBtn} onClick={() => navigateTo("login")}>
                Sign In
              </button>
            )}
          </nav>

          {mobileNavOpen && (
            <nav className="bk-mobile-nav bk-dropdown-in" ref={mobileNavRef} aria-label="Menu navigasi">
              {!authUser ? (
                <button
                  type="button"
                  className="bk-mobile-nav-item bk-mobile-nav-cta"
                  onClick={() => {
                    closeMobileNav();
                    navigateTo("login");
                  }}
                >
                  <UserRound size={17} strokeWidth={2.1} />
                  <span>Masuk / Daftar</span>
                </button>
              ) : (
                <div className="bk-mobile-nav-head">
                  <strong>{chipName} {"\uD83D\uDC4B"}</strong>
                  {email && <span>{email}</span>}
                </div>
              )}
              {authUser && (
                <button
                  type="button"
                  className="bk-mobile-nav-item"
                  onClick={() => {
                    closeMobileNav();
                    navigateTo("profile");
                  }}
                >
                  <UserRound size={17} strokeWidth={2.1} />
                  <span>Profil Saya</span>
                </button>
              )}
              {authUser && (
                <button
                  type="button"
                  className="bk-mobile-nav-item"
                  onClick={() => {
                    closeMobileNav();
                    navigateTo("orders");
                  }}
                >
                  <ReceiptText size={17} strokeWidth={2.1} />
                  <span>Pesanan Saya</span>
                </button>
              )}
              {authUser && (
                <button
                  type="button"
                  className="bk-mobile-nav-item"
                  onClick={() => {
                    closeMobileNav();
                    navigateTo("addresses");
                  }}
                >
                  <MapPin size={17} strokeWidth={2.1} />
                  <span>Alamat</span>
                </button>
              )}
              <button
                type="button"
                className="bk-mobile-nav-item"
                onClick={() => {
                  closeMobileNav();
                  handleSellerCenter();
                }}
              >
                <Store size={17} strokeWidth={2.1} />
                <span>Seller Center</span>
              </button>
              <button
                type="button"
                className="bk-mobile-nav-item"
                onClick={() => {
                  closeMobileNav();
                  handleStartSelling();
                }}
              >
                <Truck size={17} strokeWidth={2.1} />
                <span>Mulai Berjualan</span>
              </button>
              <button
                type="button"
                className="bk-mobile-nav-item"
                onClick={() => {
                  closeMobileNav();
                  navigateTo("cart");
                }}
              >
                <ShoppingBasket size={17} strokeWidth={2.1} />
                <span>Keranjang</span>
                {cartCount > 0 && <b className="bk-mobile-nav-count">{Math.min(cartCount, 99)}</b>}
              </button>
              <button
                type="button"
                className="bk-mobile-nav-item"
                onClick={() => {
                  closeMobileNav();
                  navigateTo("wishlist");
                }}
              >
                <Heart size={17} strokeWidth={2.1} />
                <span>Wishlist</span>
                {wishCount > 0 && <b className="bk-mobile-nav-count">{Math.min(wishCount, 99)}</b>}
              </button>
              {authUser && (
                <button
                  type="button"
                  className="bk-mobile-nav-item bk-mobile-nav-danger"
                  onClick={() => {
                    closeMobileNav();
                    setLogoutConfirmOpen(true);
                  }}
                >
                  <LogOut size={17} strokeWidth={2.1} />
                  <span>Keluar</span>
                </button>
              )}
            </nav>
          )}
        </div>
      </header>
      {sellerFormOpen && (
        <SellerRegisterForm
          onClose={() => setSellerFormOpen(false)}
          onSuccess={handleSellerRegistered}
        />
      )}
      <ConfirmDialog
        open={logoutConfirmOpen}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          onLogout?.();
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
}

function SellerRegisterForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({ storeName: "", description: "", address: "" });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const logoInputRef = useRef(null);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogo(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!form.storeName.trim()) {
      setStatus({ type: "error", message: "Nama toko wajib diisi." });
      return;
    }
    if (!form.address.trim()) {
      setStatus({ type: "error", message: "Alamat toko wajib diisi." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("store_name", form.storeName.trim());
      payload.append("description", form.description.trim());
      payload.append("address", form.address.trim());
      if (logo) payload.append("logo", logo);

      await registerSeller(payload);
      onSuccess?.(form.storeName.trim());
      onClose();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal mendaftarkan toko.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      style={styles.authModalOverlay}
      className="bk-auth-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose?.();
      }}
    >
      <section
        style={styles.authModal}
        className="bk-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-form-title"
      >
        <button
          type="button"
          style={styles.authModalClose}
          className="bk-auth-modal-close"
          onClick={() => !isSubmitting && onClose?.()}
          aria-label="Tutup popup"
        >
          <X size={22} strokeWidth={2.1} />
        </button>

        <form style={styles.authModalForm} onSubmit={handleSubmit}>
          <span style={styles.authModalIconBubble}>
            <img src="/logo.png" alt="BumiKriya" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", display: "block" }} />
          </span>
          <h2 id="seller-form-title" style={styles.authModalTitle}>Mulai Berjualan</h2>
          <p style={styles.authModalLead}>
            Lengkapi informasi toko kamu untuk mengupgrade akun menjadi Seller.
          </p>

          <label style={styles.sellerField}>
            <span style={styles.sellerLabel}>NAMA TOKO</span>
            <span style={styles.sellerInputWrap}>
              <input
                type="text"
                style={styles.sellerInput}
                className="bk-auth-input"
                placeholder="Contoh: Kriya Nusantara"
                value={form.storeName}
                onChange={updateField("storeName")}
                required
              />
            </span>
          </label>

          <label style={styles.sellerField}>
            <span style={styles.sellerLabel}>DESKRIPSI TOKO</span>
            <textarea
              style={styles.sellerTextarea}
              placeholder="Ceritakan tentang toko dan produk yang kamu jual"
              value={form.description}
              onChange={updateField("description")}
            />
          </label>

          <label style={styles.sellerField}>
            <span style={styles.sellerLabel}>LOGO TOKO</span>
            <span style={styles.sellerLogoPicker}>
              <button
                type="button"
                style={styles.sellerLogoBox}
                className="bk-seller-logo-box"
                aria-label="Pilih logo toko"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Pratinjau logo toko" style={styles.sellerLogoImg} />
                ) : (
                  <ImagePlus size={24} strokeWidth={2} />
                )}
              </button>
              <span style={styles.sellerLogoHint}>
                <span>Tambahkan logo toko</span>
                <button type="button" style={styles.sellerLogoBtn} className="bk-auth-link" onClick={() => logoInputRef.current?.click()}>
                  Pilih file (JPG / PNG)
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleLogoChange}
                />
              </span>
            </span>
          </label>

          <label style={styles.sellerField}>
            <span style={styles.sellerLabel}>ALAMAT</span>
            <span style={styles.sellerInputWrap}>
              <MapPin size={19} strokeWidth={1.9} style={{ flexShrink: 0 }} />
              <input
                type="text"
                style={styles.sellerInput}
                className="bk-auth-input"
                placeholder="Alamat toko kamu"
                value={form.address}
                onChange={updateField("address")}
                required
              />
            </span>
          </label>

          {status.message && (
            <p style={status.type === "error" ? styles.authErrorText : styles.authSuccessText}>
              {status.message}
            </p>
          )}

          <button type="submit" style={styles.authModalPrimaryButton} className="bk-auth-modal-primary" disabled={isSubmitting}>
            <Store size={17} strokeWidth={2.2} />
            {isSubmitting ? "Mendaftarkan..." : "Daftarkan Toko"}
          </button>
        </form>
      </section>
    </div>,
    document.body
  );
}

function TrendingSearchDropdown({ onPick, compact = false }) {
  return (
    <div
      style={{
        ...styles.trendingDropdown,
        ...(compact ? styles.trendingDropdownCompact : {}),
      }}
      className="bk-trending-dropdown bk-dropdown-in"
    >
      <span style={styles.trendingTitle}>Pencarian sedang tren</span>
      <div style={styles.trendingList}>
        {TRENDING_SEARCHES.map((item) => (
          <button
            key={item}
            type="button"
            style={styles.trendingItem}
            className="bk-trending-item"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(item)}
          >
            <Search size={14} strokeWidth={2.2} />
            <span>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HeaderSearch({ onSearch }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const submitSearch = (value) => {
    setOpen(false);
    onSearch(value.trim());
  };

  return (
    <form
      style={styles.headerSearchForm}
      className="bk-header-search"
      onSubmit={(e) => {
        e.preventDefault();
        submitSearch(q);
      }}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search..."
        style={styles.headerSearchInput}
        aria-label="Cari produk"
      />
      <button type="submit" style={styles.headerSearchButton} aria-label="Cari">
        <Search size={18} strokeWidth={2.3} />
      </button>
      {open && (
        <TrendingSearchDropdown
          compact
          onPick={(item) => {
            setQ(item);
            submitSearch(item);
          }}
        />
      )}
    </form>
  );
}

function FooterCol({ col, showToast, navigateTo }) {
  const [open, setOpen] = useState(false);
  const handleLink = (e, link) => {
    e.preventDefault();
    if (link === "Tentang Kami") {
      navigateTo("about");
      return;
    }
    if (link === "FAQ") {
      navigateTo("faq");
      return;
    }
    if (link === "Kontak") {
      navigateTo("contact");
      return;
    }
    if (link === "Blog") {
      navigateTo("blog");
      return;
    }
    if (PRODUCT_FOOTER_CATEGORIES.includes(link)) {
      const slug = String(link).trim().toLowerCase().replace(/\s+/g, "-");
      navigateTo({ view: "categoryProducts", categoryId: slug, categoryName: link });
      return;
    }
    showToast(link);
  };
  return (
    <div style={styles.footerCol} className="bk-footer-col">
      <button
        type="button"
        style={styles.footerColTitle}
        className="bk-footer-col-title"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {col.title}
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className="bk-footer-col-caret"
          style={open ? styles.footerColCaretOpen : styles.footerColCaret}
        />
      </button>
      <div style={styles.footerCol} className={`bk-footer-col-links${open ? " is-open" : ""}`}>
        {col.links.map((l) => (
          <a key={l} href="#" className="bk-footer-link" style={styles.footerLink} onClick={(e) => handleLink(e, l)}>
            {l}
          </a>
        ))}
      </div>
    </div>
  );
}

function SiteFooter({ showToast, navigateTo }) {
  return (
    <footer style={styles.footer} className="bk-site-footer">
      <div style={styles.footerInner} className="bk-footer-inner">
        <div style={styles.footerTop} className="bk-footer-top">
          <div style={styles.footerBrandCol}>
            <button type="button" style={styles.footerLogoButton} className="bk-footer-link" onClick={() => navigateTo("home")}>
              BumiKriya
            </button>
            <p style={styles.footerBlurb}>
              Menghubungkan pengrajin Indonesia dengan pecinta karya tangan. Dari batik hingga keramik, setiap karya adalah cerita.
            </p>
            <div style={styles.socialRow}>
              <SocialIcon onClick={() => showToast("Membuka Instagram")}>
                <InstagramIcon size={17} color="#3a231d" strokeWidth={2} />
              </SocialIcon>
              <SocialIcon onClick={() => showToast("Membuka Facebook")}>
                <FacebookIcon size={17} color="#3a231d" strokeWidth={2} />
              </SocialIcon>
              <SocialIcon onClick={() => showToast("Membuka Twitter")}>
                <TwitterIcon size={17} color="#3a231d" strokeWidth={2} />
              </SocialIcon>
            </div>
          </div>

          <div style={styles.footerLinksWrap} className="bk-footer-links">
            {FOOTER_COLS.map((col) => (
              <FooterCol key={col.title} col={col} showToast={showToast} navigateTo={navigateTo} />
            ))}
          </div>
        </div>

        <div style={styles.footerDivider} />

        <div style={styles.footerBottom} className="bk-footer-bottom">
          <span style={styles.footerCopy}>{"\u00a9"} 2026 BumiKriya. Semua hak cipta dilindungi.</span>
          <div style={styles.footerBottomLinks}>
            <a href="/kebijakan-privasi" className="bk-footer-link" style={styles.footerBottomLink} onClick={(e) => { e.preventDefault(); navigateTo("privacy"); }}>
              Kebijakan Privasi
            </a>
            <a href="/syarat-ketentuan" className="bk-footer-link" style={styles.footerBottomLink} onClick={(e) => { e.preventDefault(); navigateTo("terms"); }}>
              Syarat &amp; Ketentuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LegalWave() {
  return (
    <svg viewBox="0 0 640 32" preserveAspectRatio="none" style={styles.legalWave} aria-hidden="true">
      <path d="M0 16 C45 28 85 4 130 16 S215 28 260 16 S345 4 390 16 S475 28 520 16 S600 4 640 16" />
    </svg>
  );
}

function WishlistWave() {
  return (
    <svg viewBox="0 0 1200 84" preserveAspectRatio="none" style={styles.wishlistWave} aria-hidden="true">
      <path d="M0 32 C110 66 220 66 330 32 S550 -2 660 32 S880 66 990 32 S1110 -2 1200 32" />
    </svg>
  );
}

function SearchBar({ onSearch }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const submitSearch = (value) => {
    setOpen(false);
    onSearch(value.trim());
  };

  return (
    <form
      style={styles.searchRow}
      onSubmit={(e) => {
        e.preventDefault();
        submitSearch(q);
      }}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div style={styles.searchInputWrap}>
        <Search size={17} color="#a89083" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Crafts / Materials"
          style={styles.searchInput}
          aria-label="Cari crafts atau materials"
        />
      </div>
      <button type="submit" style={styles.cariBtn} className="bk-cari-btn">
        Cari
      </button>
      {open && (
        <TrendingSearchDropdown
          onPick={(item) => {
            setQ(item);
            submitSearch(item);
          }}
        />
      )}
    </form>
  );
}

function EmptyStorefrontState({ message }) {
  return (
    <div style={styles.storefrontEmpty}>
      <ShoppingBasket size={24} strokeWidth={2.1} />
      <span>{message}</span>
    </div>
  );
}

function SectionHeader({ title, sub, action, headerStyle, titleStyle, subStyle, actionStyle }) {
  return (
    <Reveal className="bk-section-header" style={{ ...styles.sectionHeaderRow, ...headerStyle }}>
      <div>
        <h2 style={{ ...styles.sectionTitle, ...titleStyle }}>{title}</h2>
        <p style={{ ...styles.sectionSub, ...subStyle }}>{sub}</p>
      </div>
      {action && <div style={{ ...styles.sectionAction, ...actionStyle }}>{action}</div>}
    </Reveal>
  );
}

function PillButton({ children, variant = "outline", onClick, style: styleOverride }) {
  const base = { ...styles.pillBase };
  let variantStyle = {};
  if (variant === "outline") variantStyle = styles.pillOutline;
  if (variant === "solid") variantStyle = styles.pillSolid;
  if (variant === "light") variantStyle = styles.pillLight;
  return (
    <button type="button" className="bk-pill" onClick={onClick} style={{ ...base, ...variantStyle, ...styleOverride }}>
      {children}
    </button>
  );
}

function CategoryCard({ cat, onClick }) {
  return (
    <button type="button" onClick={onClick} className="bk-cat-card" style={styles.categoryCard} aria-label={`Kategori ${cat.name}`}>
      {cat.img && (
        <img
          src={cat.img}
          alt={cat.name}
          style={styles.categoryImg}
          loading="lazy"
          className="bk-cat-img"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      <div style={styles.categoryOverlay} />
      <span style={styles.categoryBadgeTop}>{cat.name}</span>
      {cat.description ? <span style={styles.categoryDescription}>{cat.description}</span> : null}
      <span style={styles.categoryLabelBottom}>{cat.name}</span>
    </button>
  );
}

const BLOB_PATH =
  "M50,6 C68,3 90,14 93,34 C96,52 90,62 92,74 C94,88 78,97 60,94 C48,92 44,98 30,96 C12,93 4,78 6,60 C8,46 2,36 8,22 C15,6 34,9 50,6 Z";

function ProductCard({ product, liked, onLike, onAdd, onOpen, justAdded }) {
  const clipId = `bk-blob-${product.id}`;
  return (
    <div
      style={{ ...styles.productCard, cursor: onOpen ? "pointer" : "default" }}
      className="bk-product-card"
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (!onOpen || event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div style={{ ...styles.productImgWrap, background: product.bg }} className="bk-product-img-wrap">
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <clipPath id={clipId} clipPathUnits="objectBoundingBox" transform="scale(0.01,0.01)">
            <path d={BLOB_PATH} />
          </clipPath>
        </svg>
        {product.img && (
          <img
          src={product.img}
          alt={product.title}
            style={{ ...styles.productImg, clipPath: `url(#${clipId})` }}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onLike?.();
          }}
          aria-label={liked ? "Hapus dari favorit" : "Tambah ke favorit"}
          className="bk-heart-btn"
          style={{ ...styles.heartBtn, transform: liked ? "scale(1.08)" : "scale(1)" }}
        >
          <Heart size={22} strokeWidth={2.2} color="#a82a59" fill={liked ? "#a82a59" : "none"} />
        </button>
        <span style={styles.productBadge}>{product.badge}</span>
      </div>
      <div style={styles.productInfo}>
        <div style={styles.productTitle}>{product.title}</div>
        <div style={styles.productPrice}>{product.price}</div>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAdd?.();
        }}
        className="bk-tambah-btn"
        style={styles.tambahBtn}
      >
        {justAdded ? "Ditambahkan \u2713" : "Tambah"}
      </button>
    </div>
  );
}

function SortDropdown({ open, label, onToggle, onSelect }) {
  const options = ["Terbaru", "Termurah", "Termahal", "Terlaris"];
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (open && ref.current && !ref.current.contains(e.target)) onToggle();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <PillButton variant="outline" onClick={onToggle}>
        Urutkan: {label} <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s ease" }} />
      </PillButton>
      {open && (
        <div style={styles.dropdownMenu} className="bk-dropdown-in">
          {options.map((opt) => (
            <button key={opt} type="button" className="bk-dropdown-item" style={styles.dropdownItem} onClick={() => onSelect(opt)}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCarousel({ reviews }) {
  if (!reviews.length) return null;
  const reviewGroups = reviews.length > 1 ? [reviews, reviews] : [reviews];

  return (
    <div style={styles.reviewViewport} className="bk-review-viewport" aria-label="Ulasan pelanggan">
      <div
        style={styles.reviewTrack}
        className={reviews.length > 1 ? "bk-review-track" : ""}
      >
        {reviewGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            style={styles.reviewGroup}
            aria-hidden={groupIndex > 0}
          >
            {group.map((review) => (
              <div key={`${groupIndex}-${review.name}`} style={styles.reviewSlide}>
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div style={styles.reviewCard} className="bk-review-card">
      <div style={styles.starsRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={16} color="#f472a8" fill="#f472a8" strokeWidth={0} />
        ))}
      </div>
      <p style={styles.reviewText}>&ldquo;{review.text}&rdquo;</p>
      <div style={styles.reviewer}>
        <img src={review.avatar} alt={review.name} style={styles.reviewAvatar} loading="lazy" />
        <div>
          <div style={styles.reviewerName}>{review.name}</div>
          <div style={styles.reviewerCity}>{review.city}</div>
        </div>
      </div>
    </div>
  );
}

function StarRating({ value = 0, size = 18 }) {
  const score = Number(value) || 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }} aria-label={`Rating ${score} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          strokeWidth={1.8}
          fill={star <= Math.round(score) ? "#f5a623" : "none"}
          color={star <= Math.round(score) ? "#f5a623" : "#bfaca4"}
        />
      ))}
    </span>
  );
}

function SocialIcon({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="bk-social-btn" style={styles.socialBtn} aria-label="social link">
      {children}
    </button>
  );
}

function InstagramIcon({ size = 17, color = "#3a231d", strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.5" fill={color} stroke="none" />
    </svg>
  );
}

function FacebookIcon({ size = 17, color = "#3a231d", strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TwitterIcon({ size = 17, color = "#3a231d", strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5 0-.17 0-.35-.01-.52A7.72 7.72 0 0 0 24 4.59 8.27 8.27 0 0 1 23 3z" />
    </svg>
  );
}

function ScallopEdge() {
  // Scalloped bottom edge of the hero, matching the reference's rounded-wave transition
  const scallops = 18;
  const unit = 100;
  return (
    <svg viewBox={`0 0 ${scallops * unit} 72`} preserveAspectRatio="none" style={styles.scallopSvg} aria-hidden="true">
      <rect x="0" y="0" width={scallops * unit} height="72" fill="#fdeee2" />
      {Array.from({ length: scallops }).map((_, i) => (
        <circle key={i} cx={i * unit + unit / 2} cy="0" r="48" fill="#f875b0" />
      ))}
    </svg>
  );
}

function FloatingCraftDots() {
  // Subtle ambient motion in the hero background - small soft dots drifting,
  // evoking scattered beads/thread without competing with the headline.
  const dots = [
    { top: "18%", left: "6%", size: 10, delay: "0s", dur: "7s" },
    { top: "62%", left: "10%", size: 7, delay: "1.2s", dur: "9s" },
    { top: "30%", left: "92%", size: 9, delay: "0.4s", dur: "8s" },
    { top: "70%", left: "88%", size: 12, delay: "2s", dur: "10s" },
    { top: "10%", left: "80%", size: 6, delay: "0.8s", dur: "6.5s" },
    { top: "85%", left: "50%", size: 8, delay: "1.6s", dur: "8.5s" },
  ];
  return (
    <div style={styles.floatWrap} aria-hidden="true">
      {dots.map((d, i) => (
        <span
          key={i}
          className="bk-float-dot"
          style={{
            position: "absolute",
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.5)",
            animationDelay: d.delay,
            animationDuration: d.dur,
          }}
        />
      ))}
    </div>
  );
}

export {
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
};
