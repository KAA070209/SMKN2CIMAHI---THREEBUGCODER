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

function CartPage({
  scrolled,
  cartCount,
  wishCount,
  showToast,
  navigateTo,
  onBack,
  onSearch,
  toast,
  items,
  onUpdateQuantity,
  onRemove,
  onRetryCart,
  onClearCart,
  isLoading,
  error,
  busyId,
  isClearing,
  isCheckingOut,
  onCheckout,
  selectedIds,
  onSelectItem,
  onSelectAll,
  authUser,
  onLogout,
}) {
  const selectedItems = items.filter((item) =>
    selectedIds === null ? true : selectedIds.includes(item.cartItemId)
  );
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const subtotal = selectedItems.reduce((total, item) => total + item.priceValue * item.quantity, 0);
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);

  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = !allSelected && selectedItems.length > 0;
    }
  }, [allSelected, selectedItems.length]);

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

      <main style={styles.cartMain} className="bk-cart-main">
        <div style={styles.cartInner} className="bk-cart-inner">
          <button type="button" style={styles.cartBack} className="bk-cart-back" onClick={onBack}>
            <ChevronLeft size={25} strokeWidth={3} />
            Kembali
          </button>

          <div style={styles.cartTitleRow} className="bk-cart-title-row">
  
            {items.length > 0 && (
              <button
                type="button"
                style={styles.cartClearButton}
                className="bk-cart-clear"
                onClick={onClearCart}
                disabled={isClearing}
              >
                {isClearing ? "Menghapus..." : "Clear All"}
              </button>
            )}
          </div>

          {error ? (
            <section style={styles.cartEmpty}>
              <ShoppingBasket size={42} strokeWidth={1.8} />
              <h2 style={styles.cartEmptyTitle}>Gagal memuat keranjang</h2>
              <p style={styles.cartEmptyText}>{error}</p>
              <PillButton variant="solid" onClick={onRetryCart} style={styles.cartEmptyButton}>
                Retry
              </PillButton>
            </section>
          ) : isLoading && items.length === 0 ? (
            <section style={styles.cartEmpty}>
              <ShoppingBasket size={42} strokeWidth={1.8} />
              <h2 style={styles.cartEmptyTitle}>Memuat keranjang...</h2>
              <p style={styles.cartEmptyText}>Sebentar ya, kami sedang mengambil isi keranjang dari server.</p>
            </section>
          ) : items.length > 0 ? (
            <div style={styles.cartLayout} className="bk-cart-layout">
              <section style={styles.cartItemsList} aria-label="Daftar produk di keranjang">
                <div style={styles.cartSelectAllRow} className="bk-cart-select-all">
                  <label style={styles.cartSelectAllRowLabel}>
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      style={styles.cartCheckbox}
                      className="bk-cart-checkbox"
                      checked={allSelected}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      aria-label="Pilih semua item di keranjang"
                    />
                    <button
                      type="button"
                      style={styles.cartSelectAllText}
                      className="bk-cart-select-all-toggle"
                      onClick={() => onSelectAll(!allSelected)}
                    >
                      {allSelected ? "Batalkan pilihan semua" : "Pilih semua"}
                    </button>
                  </label>
                </div>
                {items.map((item, index) => (
                  <Reveal key={item.cartItemId ?? item.id} delay={(index % 3) * 0.04} y={22}>
                    <CartItem
                      item={item}
                      disabled={busyId === getCartItemRequestId(item)}
                      checked={selectedIds === null || selectedIds.includes(item.cartItemId)}
                      onToggle={(checked) => onSelectItem(item.cartItemId, checked)}
                      onAdd={() => onUpdateQuantity(item, item.quantity + 1)}
                      onDecrease={() => onUpdateQuantity(item, item.quantity - 1)}
                      onRemove={() => onRemove(item)}
                    />
                  </Reveal>
                ))}
              </section>

              <CartSummary
                subtotal={subtotal}
                itemCount={selectedCount}
                onCheckout={onCheckout}
                isCheckingOut={isCheckingOut}
                disabled={selectedCount === 0}
              />
            </div>
          ) : (
            <section style={styles.cartEmpty}>
              <ShoppingBasket size={42} strokeWidth={1.8} />
              <h2 style={styles.cartEmptyTitle}>Keranjang kamu masih kosong</h2>
              <p style={styles.cartEmptyText}>Klik tombol Tambah di produk pilihanmu, lalu item akan otomatis masuk ke basket ini.</p>
              <PillButton variant="solid" onClick={() => navigateTo("home")} style={styles.cartEmptyButton}>
                Jelajahi Produk
              </PillButton>
            </section>
          )}
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

function pickFirstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function extractSnapPaymentToken(paymentData) {
  return pickFirstString(
    paymentData?.snap_token,
    paymentData?.snapToken,
    paymentData?.transaction_token,
    paymentData?.transactionToken,
    paymentData?.snap?.token,
    paymentData?.payment?.snap_token,
    paymentData?.payment?.snapToken,
    paymentData?.data?.snap_token,
    paymentData?.data?.snapToken,
    paymentData?.data?.transaction_token,
    paymentData?.data?.transactionToken,
    paymentData?.data?.snap?.token,
    paymentData?.data?.payment?.snap_token,
    paymentData?.data?.payment?.snapToken,
    paymentData?.result?.snap_token,
    paymentData?.result?.snapToken,
    paymentData?.result?.transaction_token,
    paymentData?.result?.transactionToken,
    paymentData?.payload?.snap_token,
    paymentData?.payload?.snapToken,
    paymentData?.data?.data?.snap_token,
    paymentData?.data?.data?.snapToken,
    paymentData?.token,
    paymentData?.data?.token,
    paymentData?.result?.token,
    paymentData?.payload?.token,
    paymentData?.data?.data?.token
  );
}

function extractSnapPaymentUrl(paymentData) {
  return pickFirstString(
    paymentData?.redirect_url,
    paymentData?.payment_url,
    paymentData?.snap_url,
    paymentData?.invoice_url,
    paymentData?.url,
    paymentData?.snap?.redirect_url,
    paymentData?.snap?.payment_url,
    paymentData?.snap?.url,
    paymentData?.data?.redirect_url,
    paymentData?.data?.payment_url,
    paymentData?.data?.snap_url,
    paymentData?.data?.invoice_url,
    paymentData?.data?.url,
    paymentData?.data?.snap?.redirect_url,
    paymentData?.data?.snap?.payment_url,
    paymentData?.data?.snap?.url,
    paymentData?.result?.redirect_url,
    paymentData?.result?.payment_url,
    paymentData?.result?.snap_url,
    paymentData?.result?.invoice_url,
    paymentData?.result?.url,
    paymentData?.payload?.redirect_url,
    paymentData?.payload?.payment_url,
    paymentData?.payload?.snap_url,
    paymentData?.payload?.invoice_url,
    paymentData?.payload?.url,
    paymentData?.data?.data?.redirect_url,
    paymentData?.data?.data?.payment_url,
    paymentData?.data?.data?.snap_url,
    paymentData?.data?.data?.invoice_url,
    paymentData?.data?.data?.url
  );
}

function getConfiguredMidtransEnvironment(snapUrl = "") {
  return getMidtransSnapEnvironment({
    environment: import.meta.env.VITE_MIDTRANS_ENV || import.meta.env.VITE_MIDTRANS_IS_PRODUCTION,
    clientKey: import.meta.env.VITE_MIDTRANS_CLIENT_KEY,
    snapUrl,
  });
}

function getConfiguredMidtransClientKey(environment) {
  if (environment === "sandbox") {
    return pickFirstString(
      import.meta.env.VITE_MIDTRANS_SANDBOX_CLIENT_KEY,
      import.meta.env.VITE_MIDTRANS_CLIENT_KEY_SANDBOX,
      import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    );
  }

  return pickFirstString(
    import.meta.env.VITE_MIDTRANS_PRODUCTION_CLIENT_KEY,
    import.meta.env.VITE_MIDTRANS_CLIENT_KEY_PRODUCTION,
    import.meta.env.VITE_MIDTRANS_CLIENT_KEY
  );
}

function PaymentPage({ scrolled, cartCount, wishCount, showToast, navigateTo, onSearch, toast, items, checkoutItemIds, authUser, onLogout, orderId, onOrderCreated, onPaid }) {
  const [selectedShippingId, setSelectedShippingId] = useState(SHIPPING_OPTIONS[0].id);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentModalUrl, setPaymentModalUrl] = useState("");
  const [snapToken, setSnapToken] = useState("");
  const [pendingPaymentUrl, setPendingPaymentUrl] = useState("");
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [isVouchersLoading, setIsVouchersLoading] = useState(false);
  const [vouchersLoadError, setVouchersLoadError] = useState("");
  const selectedShipping = SHIPPING_OPTIONS.find((option) => option.id === selectedShippingId) ?? SHIPPING_OPTIONS[0];
  const selectedAddress = addresses.find((address) => String(address.id) === String(selectedAddressId)) || addresses[0] || null;
  const subtotal = items.reduce((total, item) => total + item.priceValue * item.quantity, 0);
  const voucherDiscount = appliedVoucher
    ? appliedVoucher.discountType === "nominal"
      ? Math.min(appliedVoucher.amount || 0, subtotal)
      : Math.min(Math.round(subtotal * (appliedVoucher.percent || 0)), appliedVoucher.maxDiscount || Infinity)
    : 0;
  const total = subtotal + selectedShipping.price - voucherDiscount;
  const midtransEnvironment = getConfiguredMidtransEnvironment(pendingPaymentUrl);
  const midtransClientKey = getConfiguredMidtransClientKey(midtransEnvironment);

  const loadAvailableVouchers = useCallback(async (signal) => {
    setIsVouchersLoading(true);
    setVouchersLoadError("");
    try {
      const data = await fetchVouchers({ signal });
      if (signal?.aborted) return;
      setAvailableVouchers(normalizeAvailableVouchers(data));
    } catch (err) {
      if (err?.name === "AbortError") return;
      setAvailableVouchers([]);
      setVouchersLoadError(err instanceof Error ? err.message : "Gagal memuat voucher.");
    } finally {
      if (!signal?.aborted) setIsVouchersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) return undefined;

    const controller = new AbortController();
    setIsAddressLoading(true);
    setAddressError("");

    fetchMyAddresses({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const rows = normalizeAddresses(data);
        setAddresses(rows);
        const primary = rows.find((address) => address.isDefault) || rows[0];
        setSelectedAddressId(primary ? String(primary.id) : "");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setAddresses([]);
        setSelectedAddressId("");
        setAddressError(err instanceof Error ? err.message : "Gagal memuat alamat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsAddressLoading(false);
      });

    return () => controller.abort();
  }, []);

  const submitPayment = async (e) => {
    e.preventDefault();

    if (!isLoggedIn()) {
      showToast("Silakan login terlebih dahulu untuk membayar");
      navigateTo("login");
      return;
    }

    if (!selectedAddress) {
      showToast("Pilih atau tambahkan alamat pengiriman dulu");
      navigateTo("addresses");
      return;
    }

    setIsPaying(true);
    try {
      let checkoutOrderId = orderId;
      if (!checkoutOrderId) {
        const checkoutData = await createCheckout({
          cart_item_ids: checkoutItemIds,
          shipping_address: buildCheckoutShippingAddress(selectedAddress),
          payment_method: "TRANSFER",
          shipping_cost: selectedShipping.price,
          ...(appliedVoucher
            ? { voucher_code: appliedVoucher.code, discount_amount: voucherDiscount }
            : {}),
        });
        checkoutOrderId = extractOrderId(checkoutData);
        if (!checkoutOrderId) {
          throw new Error("Pesanan berhasil dibuat, tetapi ID pesanan tidak ditemukan.");
        }
        if (typeof onOrderCreated === "function") onOrderCreated(checkoutOrderId);
      }

      const paymentData = await createPayment(checkoutOrderId, undefined, {
        signal: AbortSignal.timeout(60000),
      });

      const snapTokenValue = extractSnapPaymentToken(paymentData);
      const paymentUrl = extractSnapPaymentUrl(paymentData);

      try {
        localStorage.removeItem("bkOrderId");
      } catch { }
      if (typeof onPaid === "function") onPaid();

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

      showToast("Pembayaran diproses, mengarahkan ke Midtrans...");
      navigateTo("home");
    } catch (error) {
      if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        showToast("Koneksi ke layanan pembayaran habis waktu. Silakan coba lagi.");
      } else if (error instanceof TypeError) {
        showToast("Gagal terhubung ke layanan pembayaran. Periksa koneksi atau CORS lalu coba lagi.");
      } else {
        showToast(error instanceof Error ? error.message : "Gagal memproses pembayaran");
      }
    } finally {
      setIsPaying(false);
    }
  };

  const applyVoucher = (code) => {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) {
      setVoucherError("Masukkan kode voucher dulu ya.");
      return;
    }

    const voucher = availableVouchers.find((item) => item.code === normalized);
    if (!voucher) {
      setVoucherError("Kode voucher tidak ditemukan atau sudah tidak berlaku.");
      return;
    }

    if (voucher.minPurchase > 0 && subtotal < voucher.minPurchase) {
      setVoucherError(`Minimal belanja ${formatRupiah(voucher.minPurchase)} untuk memakai voucher ini.`);
      return;
    }

    setVoucherError("");
    setVoucherCode(normalized);
    setAppliedVoucher(voucher);
    setVoucherOpen(false);
    showToast(`Voucher ${normalized} berhasil diterapkan`);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherError("");
    showToast("Voucher dihapus");
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
      />

      <div id="top" style={{ height: "var(--header-h)" }} aria-hidden="true" />

      <main style={styles.paymentMain} className="bk-payment-main">
        <div style={styles.paymentInner} className="bk-payment-inner">
          <button type="button" style={styles.paymentBack} className="bk-payment-back" onClick={() => navigateTo("cart")}>
            <ChevronLeft size={25} strokeWidth={3} />
            Kembali ke Keranjang
          </button>

          <div style={styles.paymentTitleBlock} className="bk-payment-title-block">
            <h1 style={styles.paymentTitle}>Pembayaran</h1>
            <p style={styles.paymentLead}>Lengkapi alamat dan pilih pengiriman, lalu bayar dengan aman melalui Midtrans.</p>
          </div>

          {items.length > 0 ? (
            <form style={styles.paymentLayout} className="bk-payment-layout" onSubmit={submitPayment}>
              <div style={styles.paymentFormStack} className="bk-payment-form-stack">
                <PaymentPanel title="Alamat Pengiriman" icon={MapPin}>
                  <AddressDropdown
                    addresses={addresses}
                    selectedAddressId={selectedAddressId}
                    selectedAddress={selectedAddress}
                    isLoading={isAddressLoading}
                    error={addressError}
                    onChange={setSelectedAddressId}
                    onManage={() => navigateTo("addresses")}
                  />
                </PaymentPanel>

                <PaymentPanel title="Metode Pengiriman" icon={Truck}>
                  <div style={styles.paymentShippingList}>
                    {SHIPPING_OPTIONS.map((option) => (
                      <SelectableOption
                        key={option.id}
                        active={selectedShippingId === option.id}
                        title={option.title}
                        detail={option.detail}
                        price={formatRupiah(option.price)}
                        onClick={() => setSelectedShippingId(option.id)}
                      />
                    ))}
                  </div>
                </PaymentPanel>

                <PaymentPanel title="Voucher Diskon" icon={Tag}>
                  <VoucherField
                    appliedVoucher={appliedVoucher}
                    appliedDiscount={voucherDiscount}
                    onClick={() => {
                      setVoucherError("");
                      setVoucherCode(appliedVoucher ? appliedVoucher.code : "");
                      setVoucherOpen(true);
                      loadAvailableVouchers();
                    }}
                    onRemove={removeVoucher}
                  />
                  {!appliedVoucher && (
                    <p style={styles.paymentVoucherHint} className="bk-payment-voucher-hint">
                      Punya kode promo? Klik kolom di atas lalu masukkan kode vouchermu.
                    </p>
                  )}
                </PaymentPanel>
              </div>

              <PaymentSummary
                items={items}
                subtotal={subtotal}
                shipping={selectedShipping}
                voucher={appliedVoucher}
                discount={voucherDiscount}
                total={total}
                isPaying={isPaying}
              />
            </form>
          ) : (
            <section style={styles.cartEmpty}>
              <ShoppingBasket size={42} strokeWidth={1.8} />
              <h2 style={styles.cartEmptyTitle}>Belum ada pesanan untuk dibayar</h2>
              <p style={styles.cartEmptyText}>Tambahkan karya ke keranjang dulu, lalu halaman pembayaran akan menampilkan ringkasan pesananmu.</p>
              <PillButton variant="solid" onClick={() => navigateTo("home")} style={styles.cartEmptyButton}>
                Jelajahi Produk
              </PillButton>
            </section>
          )}
        </div>
      </main>

      <SiteFooter showToast={showToast} navigateTo={navigateTo} />

      <VoucherDialog
        open={voucherOpen}
        initialCode={voucherCode}
        error={voucherError}
        vouchers={availableVouchers}
        isLoading={isVouchersLoading}
        loadError={vouchersLoadError}
        onRefresh={loadAvailableVouchers}
        onClose={() => setVoucherOpen(false)}
        onApply={applyVoucher}
        onPick={(code) => {
          setVoucherCode(code);
          setVoucherError("");
          applyVoucher(code);
        }}
      />

      <div style={styles.toastHost} aria-live="polite">
        {toast && (
          <div style={styles.toast} className="bk-toast bk-toast-in">
            {toast}
          </div>
        )}
      </div>

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
            showToast("Pembayaran berhasil!");
            navigateTo("orders");
          }}
          onPending={() => {
            setSnapToken("");
            setPendingPaymentUrl("");
            showToast("Menunggu pembayaran, cek status pesananmu.");
            navigateTo("orders");
          }}
          onError={() => {
            setSnapToken("");
            setPendingPaymentUrl("");
            showToast("Pembayaran gagal, silakan coba lagi.");
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
    </div>
  );
}

function MidtransPaymentUrlModal({ url, onClose }) {
  if (!url) return null;

  return createPortal(
    <div
      style={styles.paymentIframeOverlay}
      className="bk-payment-iframe-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        style={styles.paymentIframeModal}
        className="bk-payment-iframe-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Pembayaran Midtrans"
      >
        <button
          type="button"
          style={styles.paymentIframeClose}
          className="bk-payment-iframe-close"
          onClick={onClose}
          aria-label="Tutup pembayaran"
        >
          <X size={18} strokeWidth={2.4} />
        </button>
        <span style={styles.paymentIframeBadge}>
          <ShieldCheck size={15} strokeWidth={2.3} />
          Pembayaran aman via Midtrans
        </span>
        <iframe
          src={url}
          title="Pembayaran Midtrans"
          style={styles.paymentIframe}
          className="bk-payment-iframe"
        />
      </section>
    </div>,
document.body
  );
}

function ReviewFormModal({ state, onClose, showToast, navigateToProduct, onSubmitSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [done, setDone] = useState(false);
  const [doneItem, setDoneItem] = useState(null);
  const fileInputRef = useRef(null);

  const order = state.order;
  const reviewableItems = (order?.items || []).filter(
    (item) => item.orderItemId && !isOrderItemReviewed(item.orderItemId)
  );
  const selectedItem =
    reviewableItems.find((item) => String(item.orderItemId) === String(selectedItemId)) ||
    reviewableItems[0] ||
    state.item ||
    null;

  useEffect(() => {
    if (state.open) {
      setRating(0);
      setHover(0);
      setComment("");
      setSelectedItemId("");
      setDone(false);
      setDoneItem(null);
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setPhoto(null);
      setDone(false);
      setDoneItem(null);
      setIsSaving(false);
    }
  }, [state.open, order]);

  useEffect(
    () => () => {
      if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview]
  );

  if (!state.open) return null;

  const handlePickPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitReview = async (item, payload) => {
    setIsSaving(true);
    try {
      await createReview(payload);
      markOrderItemReviewed(item.orderItemId);
      setDoneItem(item);
      setDone(true);
      setIsSaving(false);
      showToast?.("Ulasan berhasil dikirim. Terima kasih!");
      onSubmitSuccess?.(item);
    } catch (err) {
      setIsSaving(false);
      showToast?.(err instanceof Error ? err.message : "Gagal mengirim ulasan. Silakan coba lagi.");
    }
  };

  const handleSubmit = () => {
    const item = selectedItem;
    if (!item?.orderItemId) {
      showToast?.("Item pesanan belum memiliki ID ulasan dari server.");
      return;
    }
    if (rating < 1) {
      showToast?.("Pilih rating bintang terlebih dahulu.");
      return;
    }
    if (!comment.trim()) {
      showToast?.("Tulis ulasanmu terlebih dahulu.");
      return;
    }

    const payload = {
      order_item_id: String(item.orderItemId),
      rating,
      comment: comment.trim(),
    };

    if (photo) {
      const reader = new FileReader();
      reader.onload = () => submitReview(item, { ...payload, image: reader.result });
      reader.onerror = () => submitReview(item, payload);
      reader.readAsDataURL(photo);
      return;
    }

    submitReview(item, payload);
  };

  return createPortal(
    <div style={styles.reviewModalOverlay} className="bk-review-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        style={styles.reviewModal}
        className="bk-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" style={styles.reviewModalClose} aria-label="Tutup form ulasan" onClick={onClose}>
          <X size={20} strokeWidth={2.2} />
        </button>

        {done ? (
          <div style={styles.reviewModalSuccess}>
            <span style={styles.reviewModalSuccessIcon}>
              <CircleCheck size={36} strokeWidth={2.2} />
            </span>
            <h2 id="review-form-title" style={styles.reviewModalSuccessTitle}>Ulasan Terkirim!</h2>
            <p style={styles.reviewModalSuccessText}>
              Terima kasih, ulasanmu sudah terkirim dan akan tampil di halaman detail produk pengrajin.
            </p>
            <div style={styles.reviewModalSuccessActions}>
              <button
                type="button"
                style={styles.ordersPrimaryButton}
                className="bk-orders-action"
                onClick={() => {
                  if (doneItem?.productId) {
                    onClose();
                    navigateToProduct?.({ productId: doneItem.productId });
                  } else {
                    onClose();
                  }
                }}
              >
                Lihat Ulasan di Produk
              </button>
              <button type="button" style={styles.ordersSecondaryButton} className="bk-orders-action" onClick={onClose}>
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.reviewModalHead}>
              <h2 id="review-form-title" style={styles.reviewModalTitle}>Beri Ulasan</h2>
              <p style={styles.reviewModalLead}>
                Bagikan pengalamanmu untuk membantu pengrajin lain.
              </p>
            </div>

            {reviewableItems.length > 1 && (
              <div style={styles.reviewModalField}>
                <span style={styles.reviewModalFieldLabel}>Produk yang diulas</span>
                <div style={styles.reviewModalPickerList}>
                  {reviewableItems.map((item) => {
                    const active = selectedItem && String(selectedItem.orderItemId) === String(item.orderItemId);
                    return (
                      <button
                        key={item.orderItemId}
                        type="button"
                        onClick={() => setSelectedItemId(String(item.orderItemId))}
                        style={{
                          ...styles.reviewModalPickerItem,
                          ...(active ? styles.reviewModalPickerItemActive : {}),
                        }}
                      >
                        {item.image ? (
                          <img src={item.image} alt="" style={styles.reviewModalPickerImg} />
                        ) : (
                          <span style={styles.reviewModalPickerFallback}>
                            <ShoppingBasket size={17} strokeWidth={2} />
                          </span>
                        )}
                        <span style={styles.reviewModalPickerName}>{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedItem && (
              <div style={styles.reviewModalProduct}>
                {selectedItem.image ? (
                  <img src={selectedItem.image} alt="" style={styles.reviewModalProductImg} />
                ) : (
                  <span style={styles.reviewModalProductFallback}>
                    <ShoppingBasket size={20} strokeWidth={2} />
                  </span>
                )}
                <div style={styles.reviewModalProductCopy}>
                  <strong style={styles.reviewModalProductName}>{selectedItem.title}</strong>
                  <span style={styles.reviewModalProductStore}>
                    {selectedItem.storeName || order?.storeName || "Toko BumiKriya"}
                  </span>
                </div>
              </div>
            )}

            <div style={styles.reviewModalField}>
              <span style={styles.reviewModalFieldLabel}>Rating</span>
              <div style={styles.reviewRatingRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} bintang`}
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
                  >
                    <Star
                      size={34}
                      strokeWidth={1.8}
                      fill={value <= (hover || rating) ? "#f5a623" : "none"}
                      color={value <= (hover || rating) ? "#f5a623" : "#c2afa6"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.reviewModalField}>
              <span style={styles.reviewModalFieldLabel}>Ulasan Kamu</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Ceritakan pengalamanmu dengan produk ini..."
                maxLength={500}
                rows={4}
                style={styles.reviewModalTextarea}
              />
              <span style={styles.reviewModalCounter}>{comment.length}/500</span>
            </div>

            <div style={styles.reviewModalField}>
              <span style={styles.reviewModalFieldLabel}>Foto (Opsional)</span>
              {photoPreview ? (
                <div style={styles.reviewModalPhotoPreview}>
                  <img src={photoPreview} alt="Pratinjau foto ulasan" style={styles.reviewModalPhotoImg} />
                  <button type="button" style={styles.reviewModalPhotoRemove} onClick={removePhoto} aria-label="Hapus foto">
                    <X size={15} strokeWidth={2.4} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  style={styles.reviewModalPhotoButton}
                  className="bk-orders-action"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={17} strokeWidth={2.2} />
                  Tambah Foto
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePickPhoto}
              />
            </div>

            <div style={styles.reviewModalFooter}>
              <button type="button" style={styles.ordersSecondaryButton} className="bk-orders-action" onClick={onClose}>
                Batal
              </button>
              <button
                type="button"
                style={styles.ordersPrimaryButton}
                className="bk-orders-action"
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? "Mengirim..." : "Kirim Ulasan"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>,
    document.body
  );
}

function MidtransSnapModal({ token, clientKey, environment, snapUrl, onClose, onSuccess, onPending, onError }) {
  const [scriptError, setScriptError] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const handlersRef = useRef({ onClose, onSuccess, onPending, onError });
  handlersRef.current = { onClose, onSuccess, onPending, onError };

  useEffect(() => {
    let cancelled = false;
    setScriptError(false);
    setEmbedFailed(false);

    const container = document.getElementById("bk-snap-container");
    if (container) {
      container.innerHTML = "";
    }

    loadMidtransSnap(clientKey, { environment, snapUrl, forceReload: true })
      .then((snap) => {
        if (cancelled) return;
        if (!snap || typeof snap.embed !== "function") {
          console.error("[Midtrans] window.snap tersedia tapi snap.embed bukan fungsi.");
          setScriptError(true);
          return;
        }
        try {
          snap.embed(token, {
            embedId: "bk-snap-container",
            onSuccess: (result) => handlersRef.current.onSuccess?.(result),
            onPending: (result) => handlersRef.current.onPending?.(result),
            onError: (result) => handlersRef.current.onError?.(result),
            onClose: () => handlersRef.current.onClose?.(),
          });
        } catch (err) {
          console.error("[Midtrans] snap.embed gagal:", err);
          setScriptError(true);
        }
      })
      .catch((err) => {
        console.error("[Midtrans] gagal memuat Snap:", err);
        if (!cancelled) setScriptError(true);
      });

    const watchdog = window.setTimeout(() => {
      if (cancelled) return;
      const el = document.getElementById("bk-snap-container");
      const iframe = el && el.querySelector("iframe");
      if (!iframe) setEmbedFailed(true);
    }, 12000);

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      resetMidtransSnap();
    };
  }, [token, clientKey, environment, snapUrl]);

  const openSnapUrl = () => {
    if (snapUrl) window.open(snapUrl, "_blank", "noopener,noreferrer");
  };

  const showFallback = scriptError || embedFailed;

  return createPortal(
    <div
      style={styles.paymentIframeOverlay}
      className="bk-payment-iframe-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        style={styles.paymentIframeModal}
        className="bk-payment-iframe-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Pembayaran Midtrans"
      >
        <button
          type="button"
          style={styles.paymentIframeClose}
          className="bk-payment-iframe-close"
          onClick={onClose}
          aria-label="Tutup pembayaran"
        >
          <X size={18} strokeWidth={2.4} />
        </button>
        <span style={styles.paymentIframeBadge}>
          <ShieldCheck size={15} strokeWidth={2.3} />
          Pembayaran aman via Midtrans
        </span>
        {showFallback && (
          <div style={styles.paymentIframeEmpty}>
            <p style={styles.paymentIframeEmptyTitle}>Halaman pembayaran tidak dapat dimuat</p>
            <p style={styles.paymentIframeEmptyText}>
              Token transaksi tidak ditemukan atau kredensial Midtrans tidak cocok. Silakan coba lagi atau selesaikan pembayaran langsung di situs Midtrans.
            </p>
          </div>
        )}
        <div
          id="bk-snap-container"
          style={{ ...styles.paymentIframe, flexDirection: "column" }}
          className="bk-payment-iframe"
        />
        {snapUrl && (
          <button
            type="button"
            onClick={openSnapUrl}
            style={styles.paymentIframeFallbackButton}
            className="bk-payment-iframe-fallback"
          >
            {showFallback ? "Buka pembayaran di tab baru" : "Halaman tidak muncul? Buka di tab baru"}
          </button>
        )}
      </section>
    </div>,
    document.body
  );
}

function PaymentPanel({ title, icon: Icon, children }) {
  return (
    <section style={styles.paymentPanel} className="bk-payment-panel">
      <h2 style={styles.paymentPanelTitle}>
        <Icon size={20} strokeWidth={2.25} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function VoucherField({ appliedVoucher, appliedDiscount, onClick, onRemove }) {
  return (
    <div
      role="button"
      tabIndex={0}
      style={{ ...styles.paymentVoucherArea, ...(appliedVoucher ? styles.paymentVoucherAreaApplied : {}) }}
      className="bk-voucher-field"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      aria-haspopup="dialog"
      aria-expanded="false"
    >
      <span style={styles.paymentVoucherIcon}>
        <Tag size={17} strokeWidth={2.4} />
      </span>

      {appliedVoucher ? (
        <>
          <span style={styles.paymentVoucherAppliedRow}>
            <strong style={styles.paymentVoucherAppliedCode}>{appliedVoucher.code}</strong>
            <span style={styles.paymentVoucherAppliedDiscount}>-{formatRupiah(appliedDiscount)}</span>
          </span>
          <button
            type="button"
            style={styles.paymentVoucherRemove}
            className="bk-voucher-remove"
            aria-label={`Hapus voucher ${appliedVoucher.code}`}
            onClick={(event) => {
              event.stopPropagation();
              onRemove?.();
            }}
          >
            <X size={15} strokeWidth={2.6} />
          </button>
        </>
      ) : (
        <>
          <span style={styles.paymentVoucherPlaceholder}>Masukkan kode voucher diskon</span>
          <ChevronRight size={18} strokeWidth={2.4} style={styles.paymentVoucherArrow} />
        </>
      )}
    </div>
  );
}

function VoucherDialog({ open, initialCode, error, vouchers, isLoading, loadError, onRefresh, onClose, onApply, onPick }) {
  const [value, setValue] = useState(initialCode || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue(initialCode || "");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, initialCode]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    onApply(value);
  };

  return createPortal(
    <div
      style={styles.voucherOverlay}
      className="bk-voucher-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        style={styles.voucherModal}
        className="bk-voucher-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bk-voucher-title"
        aria-describedby="bk-voucher-subtitle"
      >
        <button type="button" style={styles.voucherClose} className="bk-voucher-close" onClick={onClose} aria-label="Tutup popup voucher">
          <X size={20} strokeWidth={2.3} />
        </button>

        <span style={styles.voucherIcon} aria-hidden="true">
          <Tag size={25} strokeWidth={2.3} />
        </span>
        <h2 id="bk-voucher-title" style={styles.voucherTitle}>
          Punya Kode Voucher?
        </h2>
        <p id="bk-voucher-subtitle" style={styles.voucherSubtitle}>
          Masukkan kode promomu di bawah, lalu tekan Terapkan untuk mendapatkan potongan harga.
        </p>

        <form onSubmit={submit}>
          <div style={styles.voucherInputWrap}>
            <Tag size={17} strokeWidth={2.2} color="#b72d64" style={{ flexShrink: 0 }} aria-hidden="true" />
            <input
              ref={inputRef}
              style={styles.voucherInput}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="cth: BUMIKRIYA15"
              aria-label="Kode voucher"
              autoComplete="off"
            />
          </div>

          {error && (
            <p style={styles.voucherMessageError} role="status">
              {error}
            </p>
          )}

          <button type="submit" style={styles.voucherApply} className="bk-voucher-apply" disabled={!value.trim()}>
            Terapkan Voucher
          </button>
        </form>

        <div style={styles.voucherList}>
          <span style={styles.voucherListTitle}>Kode yang tersedia</span>

          {isLoading && (
            <p style={styles.voucherNote} role="status">
              Memuat kode voucher...
            </p>
          )}

          {!isLoading && loadError && (
            <>
              <p style={styles.voucherMessageError} role="status">
                {loadError}
              </p>
              <button type="button" style={styles.voucherApply} onClick={onRefresh}>
                Coba Lagi
              </button>
            </>
          )}

          {!isLoading && !loadError && vouchers.length === 0 && (
            <p style={styles.voucherNote}>Belum ada kode voucher yang tersedia.</p>
          )}

          {!isLoading &&
            !loadError &&
            vouchers.map((voucher) => (
              <button
                key={voucher.code}
                type="button"
                style={styles.voucherChip}
                className="bk-voucher-chip"
                onClick={() => onPick?.(voucher.code)}
              >
                <span style={styles.paymentVoucherIcon}>
                  <Tag size={15} strokeWidth={2.5} />
                </span>
                <span style={styles.voucherChipCopy}>
                  <strong>{voucher.code}</strong>
                  <span style={styles.voucherChipLabel}>{voucher.label}</span>
                </span>
                <span style={styles.voucherChipUse}>Pakai</span>
              </button>
            ))}
        </div>

        <p style={styles.voucherNote}>Kode berlaku satu kali pakai dan dapat berubah sewaktu-waktu.</p>
      </section>
    </div>,
    document.body
  );
}

function AddressDropdown({ addresses, selectedAddressId, selectedAddress, isLoading, error, onChange, onManage }) {
  if (isLoading) {
    return <div style={styles.paymentAddressState} className="bk-payment-address-state">Memuat alamat tersimpan...</div>;
  }

  if (error) {
    return (
      <div style={styles.paymentAddressEmpty} className="bk-payment-address-empty">
        <p>{error}</p>
        <button type="button" style={styles.addressLinkButton} onClick={onManage}>
          Kelola Alamat
        </button>
      </div>
    );
  }

  if (!addresses.length) {
    return (
      <div style={styles.paymentAddressEmpty} className="bk-payment-address-empty">
        <MapPin size={24} strokeWidth={2} />
        <p>Belum ada alamat tersimpan.</p>
        <button type="button" style={styles.addressAddButton} className="bk-address-add" onClick={onManage}>
          <Plus size={17} strokeWidth={2.4} />
          Tambah Alamat
        </button>
      </div>
    );
  }

  return (
    <div style={styles.paymentAddressBlock}>
      <label style={styles.paymentField} className="bk-payment-field">
        <span style={styles.paymentLabel}>Pilih Alamat</span>
<span style={styles.paymentAddressSelectWrap} className="bk-payment-address-select-wrap">
          <select
            style={styles.paymentAddressSelect}
            value={selectedAddressId}
            onChange={(event) => onChange?.(event.target.value)}
          >
            {addresses.map((address) => (
              <option key={address.id} value={String(address.id)}>
                {getAddressOptionLabel(address)}
              </option>
            ))}
          </select>
          <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" />
        </span>
      </label>

{selectedAddress && (
        <div style={styles.paymentAddressPreview} className="bk-payment-address-preview">
          <div style={styles.addressCardHead}>
            <strong style={styles.paymentAddressName}>{selectedAddress.name}</strong>
            {selectedAddress.label && <span style={styles.addressBadge}>{selectedAddress.label}</span>}
            {selectedAddress.isDefault && <span style={styles.addressPrimaryBadge}>Alamat Utama</span>}
          </div>
          <p style={styles.addressPhone}>{selectedAddress.phone || "-"}</p>
          <p style={styles.addressText}>{formatAddressText(selectedAddress) || "-"}</p>
        </div>
      )}

      <button type="button" style={styles.paymentManageAddressButton} onClick={onManage}>
        Kelola Alamat
      </button>
    </div>
  );
}

function SelectableOption({ active, title, detail, price, onClick }) {
  return (
    <button
      type="button"
      style={{ ...styles.paymentSelectRow, ...(active ? styles.paymentSelectRowActive : {}) }}
      className="bk-payment-select"
      onClick={onClick}
    >
      <span style={{ ...styles.paymentRadio, ...(active ? styles.paymentRadioActive : {}) }} aria-hidden="true" />
      <span style={styles.paymentSelectCopy} className="bk-payment-select-copy">
        <strong style={styles.paymentSelectTitle} className="bk-payment-select-title">{title}</strong>
        <span style={styles.paymentSelectDetail} className="bk-payment-select-detail">{detail}</span>
      </span>
      <span style={styles.paymentSelectPrice} className="bk-payment-select-price">{price}</span>
    </button>
  );
}

function PaymentSummary({ items, subtotal, shipping, voucher, discount, total, isPaying }) {
  return (
    <aside style={styles.paymentSummary} className="bk-payment-summary" aria-label="Ringkasan pesanan">
      <h2 style={styles.paymentSummaryTitle}>Ringkasan Pesanan</h2>

      <div style={styles.paymentSummaryItems}>
        {items.map((item) => (
          <div key={item.id} style={styles.paymentSummaryItem} className="bk-payment-summary-item">
            <img
              src={item.img}
              alt={item.title}
              style={styles.paymentSummaryImage}
              className="bk-payment-summary-item-img"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div style={styles.paymentSummaryItemCopy} className="bk-payment-summary-item-copy">
              <strong style={styles.paymentSummaryItemTitle} className="bk-payment-summary-item-title">{item.title}</strong>
              <span style={styles.paymentSummaryItemMeta} className="bk-payment-summary-item-meta">{item.quantity} x {formatRupiah(item.priceValue)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.paymentSummaryDivider} className="bk-payment-summary-divider" />

      <div style={styles.paymentSummaryRows}>
        <div style={styles.paymentSummaryRow} className="bk-payment-summary-row">
          <span>Subtotal</span>
          <strong>{formatRupiah(subtotal)}</strong>
        </div>
        <div style={styles.paymentSummaryRow} className="bk-payment-summary-row">
          <span>Biaya Pengiriman</span>
          <strong>{formatRupiah(shipping.price)}</strong>
        </div>
        {voucher && (
          <div style={styles.paymentSummaryRow} className="bk-payment-summary-row">
            <span>Voucher ({voucher.code})</span>
            <strong style={styles.paymentDiscountText}>-{formatRupiah(discount)}</strong>
          </div>
        )}
      </div>

      <div style={styles.paymentSummaryDivider} className="bk-payment-summary-divider" />

      <div style={styles.paymentTotalRow} className="bk-payment-total-row">
        <span>Total</span>
        <strong>{formatRupiah(total)}</strong>
      </div>

      <button type="submit" style={styles.paymentPayButton} className="bk-payment-pay-btn" disabled={isPaying}>
        {isPaying ? "Memproses Pembayaran..." : <>Bayar Sekarang <ShieldCheck size={18} strokeWidth={2.35} /></>}
      </button>

      <p style={styles.paymentSecureText} className="bk-payment-secure">Transaksi aman diproses melalui Midtrans.</p>
    </aside>
  );
}

function CartItem({ item, onAdd, onDecrease, onRemove, disabled, checked, onToggle }) {
  const categoryLabel = String(item.badge || "").trim();

  return (
    <article
      style={{ ...styles.cartItemCard, ...(disabled ? styles.cartItemCardBusy : {}) }}
      className="bk-cart-item"
      aria-busy={disabled ? "true" : "false"}
    >
      <div style={styles.cartItemCheckboxWrap} className="bk-cart-item-check">
        <input
          type="checkbox"
          style={styles.cartCheckbox}
          className="bk-cart-checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={disabled}
          aria-label={`Pilih ${item.title}`}
        />
      </div>

      <img
        src={item.img}
        alt={item.title}
        style={styles.cartItemImage}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />

      <div style={styles.cartItemInfo} className="bk-cart-item-info">
        <h2 style={styles.cartItemTitle} className="bk-cart-item-title">{item.title}</h2>
        {categoryLabel && (
          <div style={styles.cartTagRow} className="bk-cart-tags">
            <span style={{ ...styles.cartTag, ...styles.cartTagBlue }}>{categoryLabel}</span>
          </div>
        )}
        <div style={styles.cartQtyControl} className="bk-cart-qty-control" aria-label={`Jumlah ${item.title}`}>
          <button type="button" style={styles.cartQtyButton} className="bk-cart-qty" aria-label={`Kurangi ${item.title}`} onClick={onDecrease} disabled={disabled}>
            <Minus size={17} strokeWidth={2.8} />
          </button>
          <span style={styles.cartQtyValue}>{item.quantity}</span>
          <button type="button" style={styles.cartQtyButton} className="bk-cart-qty" aria-label={`Tambah ${item.title}`} onClick={onAdd} disabled={disabled}>
            <Plus size={17} strokeWidth={2.8} />
          </button>
        </div>
      </div>

      <button type="button" style={styles.cartRemoveButton} className="bk-cart-remove" aria-label={`Hapus ${item.title}`} onClick={onRemove} disabled={disabled}>
        <X size={22} strokeWidth={2} />
      </button>

      <div style={styles.cartItemPrice} className="bk-cart-item-price">{formatRupiah(item.priceValue * item.quantity)}</div>
    </article>
  );
}

function CartSummary({ subtotal, itemCount, onCheckout, isCheckingOut, disabled }) {
  return (
    <aside style={styles.cartSummary} className="bk-cart-summary" aria-label="Ringkasan keranjang">
      <h2 style={styles.cartSummaryTitle}>
        Summary <ReceiptText size={18} strokeWidth={2.3} />
      </h2>

      <div style={styles.cartSummaryRows}>
        <div style={styles.cartSummaryRow}>
          <span>Subtotal</span>
          <strong>{formatRupiah(subtotal)}</strong>
        </div>
        <div style={styles.cartSummaryDivider} />
        <div style={styles.cartSummaryRow}>
          <span>Shipping</span>
          <strong style={styles.cartShippingText}>Calculated at checkout</strong>
        </div>
        <div style={styles.cartSummaryDivider} />
        <div style={{ ...styles.cartSummaryRow, ...styles.cartTotalRow }}>
          <span>Total</span>
          <strong>{formatRupiah(subtotal)}</strong>
        </div>
      </div>

      <button type="button" style={styles.cartCheckoutButton} className="bk-cart-checkout" onClick={onCheckout} disabled={isCheckingOut || disabled}>
        {isCheckingOut ? "Memproses..." : <>Lanjut ke Pembayaran <ArrowRight size={19} strokeWidth={2.4} /></>}
      </button>

      {disabled && <p style={styles.cartSelectHint}>Pilih minimal satu item untuk checkout</p>}

      <p style={styles.cartSecureText}>Secure checkout powered by Midtrans</p>
      <span style={styles.cartSummaryCount}>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
    </aside>
  );
}

export {
  CartPage,
  pickFirstString,
  extractSnapPaymentToken,
  extractSnapPaymentUrl,
  getConfiguredMidtransEnvironment,
  getConfiguredMidtransClientKey,
  PaymentPage,
  MidtransPaymentUrlModal,
  ReviewFormModal,
  MidtransSnapModal,
  PaymentPanel,
  VoucherField,
  VoucherDialog,
  AddressDropdown,
  SelectableOption,
  PaymentSummary,
  CartItem,
  CartSummary
};