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
  Leaf,
  Mail,
  Phone,
  Clock,
  MessageCircle,
  Send,
  HelpCircle,
  BookOpen,
  CalendarDays,
  User,
} from "lucide-react";
import { styles, FONT_DISPLAY } from "./styles.js";
import { GlobalStyle } from "./components/GlobalStyle.jsx";
import { Typewriter } from "./components/Typewriter.jsx";
import { AuthPage } from "./components/AuthPage.jsx";
import { AdminDashboard } from "./components/AdminDashboard.jsx";
import { SellerDashboard } from "./components/SellerDashboard.jsx";
import { ConfirmDialog } from "./components/ConfirmDialog.jsx";
import LocationPickerMap from "./components/LocationPickerMap.jsx";
import {
  addCartItem,
  addToWishlist,
  clearCart,
createMyAddress,
  createCheckout,
  createPayment,
  createReview,
  deleteMyAddress,
  extractOrderId,
  fetchCart,
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
  fetchWishlists,
  followStore,
  registerSeller,
  removeCartItem as deleteCartItem,
  removeFromWishlist,
  resolveApiUrl,
  unfollowStore,
  updateCurrentUserProfile,
  updateMyAddress,
  updateCartItem,
} from "./lib/userApi.js";
import { getMidtransSnapEnvironment, loadMidtransSnap, resetMidtransSnap } from "./lib/midtrans.js";
import {
  fetchMe,
  handleGoogleCallback,
  getStoredAuthUser,
  getSessionUser,
  logout,
} from "./lib/authApi.js";

const WISHLIST_ACCENTS = ["#c53b73", "#f0cc43", "#30a6d6"];
const TRENDING_SEARCHES = ["Benang", "Keramik", "Batik", "Anyaman", "Gelang", "Vase"];

function toWishlistItem(product) {
  const numericId = Number(product.id);
  const accentIndex = Number.isFinite(numericId)
    ? Math.abs(numericId - 1) % WISHLIST_ACCENTS.length
    : Math.abs(String(product.id || product.title || "").length) % WISHLIST_ACCENTS.length;
  return {
    ...product,
    accent: WISHLIST_ACCENTS[accentIndex],
  };
}

function parseRupiah(price) {
  return Number(String(price).replace(/[^\d]/g, "")) || 0;
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function pickRandomProducts(products, count) {
  const list = Array.isArray(products) ? [...products] : [];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, count);
}

function sortStorefrontProducts(products, sortLabel) {
  const list = Array.isArray(products) ? [...products] : [];
  switch (sortLabel) {
    case "Termurah":
      return list.sort((a, b) => (a.priceValue || parseRupiah(a.price)) - (b.priceValue || parseRupiah(b.price)));
    case "Termahal":
      return list.sort((b, a) => (a.priceValue || parseRupiah(a.price)) - (b.priceValue || parseRupiah(b.price)));
    case "Terlaris":
      return list.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    case "Terbaru":
    default: {
      return list.sort((a, b) => {
        const timeA = a.created ? Date.parse(a.created) || 0 : 0;
        const timeB = b.created ? Date.parse(b.created) || 0 : 0;
        if (timeA || timeB) return timeB - timeA;
        return 0;
      });
    }
  }
}

const REVIEWS = [
  {
    name: "Ayu P.",
    city: "Jakarta",
    text: "Kualitas batiknya sangat bagus. Warna tetap cerah setelah dicuci dan motifnya rapi.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
  },
  {
    name: "Rafi A.",
    city: "Bandung",
    text: "Pengiriman cepat dan kemasan sangat rapi. Saya suka dengan detail anyamannya.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
  },
  {
    name: "Nina S.",
    city: "Surabaya",
    text: "Keramiknya sangat unik dan tahan lama. Saya jadi penggemar BumiKriya sekarang.",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?q=80&w=200&auto=format&fit=crop",
  },
];

const FOOTER_COLS = [
  { title: "Produk", links: ["Bambu & Anyaman", "Benang & Wol", "Kain & Tekstil", "Tali & Serat"] },
  { title: "Bantuan", links: ["Pengiriman", "Pembayaran", "FAQ"] },
  { title: "Tentang", links: ["Tentang Kami", "Kontak"] },
];

const PRODUCT_FOOTER_CATEGORIES = FOOTER_COLS.find((col) => col.title === "Produk")?.links || [];

const LEGAL_PAGES = {
  privacy: {
    title: "Kebijakan Privasi",
    updated: "24 Oktober 2024",
    introDecor: false,
    sections: [
      {
        title: "Pendahuluan",
        paragraphs: [
          "Selamat datang di BumiKriya. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda bagikan kepada kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat Anda mengakses layanan BumiKriya.",
          "Dengan menggunakan situs web BumiKriya, Anda menyetujui praktik pengelolaan data yang dijelaskan dalam kebijakan ini.",
        ],
      },
      {
        title: "Informasi yang Kami Kumpulkan",
        paragraphs: [
          "Untuk memberikan pengalaman belanja karya kriya yang aman dan nyaman, kami dapat mengumpulkan beberapa jenis informasi berikut:",
        ],
        bullets: [
          "Data pribadi: nama lengkap, alamat email, nomor telepon, dan alamat pengiriman saat Anda membuat akun atau melakukan pembelian.",
          "Data transaksi: rincian pesanan, produk kerajinan yang dibeli, status pembayaran, dan riwayat pengiriman. BumiKriya tidak menyimpan rincian kartu kredit secara langsung.",
          "Data penggunaan: informasi tentang cara Anda berinteraksi dengan situs kami untuk membantu meningkatkan kualitas layanan dan pengalaman pengguna.",
        ],
      },
      {
        title: "Penggunaan Informasi",
        paragraphs: ["Informasi yang kami kumpulkan digunakan untuk tujuan berikut:"],
        bullets: [
          "Memproses dan mengelola pesanan Anda, dari pengrajin hingga sampai ke tangan Anda.",
          "Meningkatkan kualitas layanan dan mempersonalisasi pengalaman Anda di platform BumiKriya.",
          "Berkomunikasi dengan Anda mengenai pesanan, layanan pelanggan, pembaruan akun, dan informasi penting lainnya.",
          "Mengirimkan penawaran khusus atau pembaruan koleksi kriya terbaru jika Anda telah menyetujui komunikasi promosi.",
        ],
      },
      {
        title: "Keamanan Data",
        paragraphs: [
          "Kami menerapkan langkah keamanan teknis dan organisasi yang wajar untuk melindungi data pribadi Anda dari akses, penggunaan, pengungkapan, perubahan, atau penghapusan yang tidak sah. Data Anda disimpan di sistem yang aman dan diproses hanya untuk kebutuhan layanan BumiKriya.",
        ],
      },
      {
        title: "Hak Pengguna",
        paragraphs: ["Anda memiliki hak tertentu terkait data pribadi Anda, antara lain:"],
        bullets: [
          "Mengakses informasi pribadi yang kami simpan tentang Anda.",
          "Meminta koreksi jika data yang kami miliki tidak akurat atau tidak lengkap.",
          "Meminta penghapusan data pribadi sesuai ketentuan hukum yang berlaku.",
        ],
      },
    ],
  },
  terms: {
    title: "Syarat dan Ketentuan",
    updated: "24 Oktober 2024",
    introDecor: true,
    sections: [
      {
        title: "Pendahuluan",
        paragraphs: [
          "Selamat datang di BumiKriya. Syarat dan Ketentuan ini mengatur penggunaan Anda atas situs web kami, platform e-commerce, dan layanan yang berkaitan dengan kurasi serta penjualan produk kerajinan kontemporer.",
          "Harap membaca ketentuan ini dengan saksama sebelum menggunakan layanan kami. Dengan mengakses atau menggunakan BumiKriya, Anda setuju untuk terikat oleh ketentuan berikut.",
        ],
      },
      {
        title: "Penggunaan Layanan",
        paragraphs: [
          "Anda setuju untuk menggunakan layanan BumiKriya hanya untuk tujuan yang sah dan dengan cara yang tidak melanggar hak, membatasi, atau menghambat kenyamanan pengguna lain maupun pihak ketiga.",
          "Perilaku yang dilarang meliputi pengiriman konten cabul atau menyinggung, tindakan yang mengganggu alur normal dialog di dalam platform, serta aktivitas lain yang dapat merugikan BumiKriya, pengrajin, atau pelanggan.",
        ],
      },
      {
        title: "Akun Pengguna",
        paragraphs: [
          "Untuk melakukan pembelian atau mengakses fitur tertentu, Anda mungkin perlu membuat akun pengguna. Anda bertanggung jawab untuk menjaga kerahasiaan kata sandi dan membatasi akses ke perangkat Anda.",
          "BumiKriya berhak menolak layanan, menghentikan akun, atau membatalkan pesanan atas kebijakan kami sendiri jika ditemukan pelanggaran, penyalahgunaan, atau indikasi aktivitas yang tidak sesuai dengan ketentuan ini.",
        ],
      },
      {
        title: "Hak Kekayaan Intelektual",
        paragraphs: [
          "Seluruh konten pada layanan BumiKriya, termasuk teks, grafik, logo, ikon tombol, gambar, klip audio, unduhan digital, dan kompilasi data, adalah milik BumiKriya atau pemasok kontennya dan dilindungi oleh peraturan hak cipta serta kekayaan intelektual yang berlaku.",
          "Anda tidak diperkenankan mengekstrak, menyalin, menjual kembali, atau menggunakan bagian dari konten layanan kami secara sistematis tanpa persetujuan tertulis dari BumiKriya.",
        ],
      },
      {
        title: "Batasan Tanggung Jawab",
        paragraphs: [
          "Layanan, informasi, konten, bahan, produk, dan layanan lain yang tersedia melalui BumiKriya disediakan apa adanya, kecuali dinyatakan lain secara tertulis.",
          "Karena produk dibuat secara artisanal, variasi kecil dalam warna, ukuran, tekstur, atau bentuk dapat terjadi. BumiKriya tidak bertanggung jawab atas variasi alami tersebut maupun kerugian tidak langsung yang timbul dari penggunaan layanan.",
        ],
      },
      {
        title: "Perubahan Ketentuan",
        paragraphs: [
          "BumiKriya dapat memperbarui situs, kebijakan, dan Syarat dan Ketentuan ini kapan saja. Jika ada bagian yang dianggap tidak sah atau tidak dapat dilaksanakan, bagian tersebut akan dipisahkan tanpa memengaruhi keberlakuan bagian lainnya.",
          "Penggunaan layanan setelah perubahan berlaku merupakan penerimaan Anda terhadap pembaruan ketentuan tersebut.",
        ],
      },
    ],
  },
};

const SHIPPING_OPTIONS = [
  { id: "regular", title: "Reguler", detail: "Estimasi 2-4 hari kerja", price: 25000 },
  { id: "express", title: "Kilat", detail: "Estimasi 1-2 hari kerja", price: 45000 },
  { id: "same-day", title: "Same Day", detail: "Tiba hari ini untuk area tertentu", price: 65000 },
  { id: "cargo", title: "Kargo Hemat", detail: "Untuk pesanan besar dan rapuh", price: 35000 },
];

/* -------------------- Voucher (dari API) -------------------- */
function pickVoucherNumber(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (value === undefined || value === null || value === "") continue;
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return 0;
}

function pickVoucherText(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (value === undefined || value === null || value === "") continue;
    return String(value);
  }
  return "";
}

function parseVoucherDate(value, endOfDay = false) {
  if (!value) return null;
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? value : null;
  }
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  const text = String(value).trim();
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0
    );
  }

  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatVoucherDate(value) {
  const date = parseVoucherDate(value, true);
  if (!date) return "Tanpa batas";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDiscountPercent(value) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: value % 1 ? 1 : 0,
  }).format(value || 0);
}

function isVoucherActive(source, startsAt, endsAt) {
  const now = Date.now();
  const startDate = parseVoucherDate(startsAt);
  const endDate = parseVoucherDate(endsAt, true);
  if (startDate && startDate.getTime() > now) return false;
  if (endDate && endDate.getTime() < now) return false;

  const explicitActive = source.is_active ?? source.isActive ?? source.active;
  if (explicitActive !== undefined && explicitActive !== null) return Boolean(explicitActive);

  const status = String(source.status || source.state || "").toLowerCase();
  if (!status) return true;
  if (["inactive", "disabled", "expired", "archived", "deleted", "draft"].includes(status)) return false;
  return true;
}


const ASSUMED_VOUCHER_BASKET = 250000;

function normalizeDiscountType(value) {
  return String(value || "").toLowerCase().trim().replace(/[\s_-]/g, "");
}

function pickDiscountType(merged) {
  const raw = normalizeDiscountType(
    merged.discount_type ||
    merged.discountType ||
    merged.type ||
    merged.kind ||
    merged.discount_kind
  );
  if (["nominal", "amount", "fixed", "fixedamount", "cash", "rupiah", "idr", "rupiahamount", "nilai", "uang"].includes(raw)) {
    return "nominal";
  }
  if (["percent", "percentage", "persen", "presentase", "persentase", "%"].includes(raw)) {
    return "percent";
  }
  return raw === "" ? "unknown" : "percent";
}

function resolveVoucherDiscount(merged) {
  const percentKeys = [
    "discount_percent", "discountPercentage", "percentage", "percent",
    "percentage_value", "percent_value", "discount_rate",
  ];
  const nominalKeys = [
    "discount_value", "discountValue", "amount", "discount_amount",
    "discountAmount", "nominal", "rupiah", "cash", "fixed_amount",
    "fixedAmount", "fixed", "value",
  ];

  const declared = pickDiscountType(merged);
  if (declared === "percent") {
    return {
      value: pickVoucherNumber(merged, percentKeys) || pickVoucherNumber(merged, nominalKeys) || 0,
      type: "percent",
    };
  }
  if (declared === "nominal") {
    return {
      value: pickVoucherNumber(merged, nominalKeys) || pickVoucherNumber(merged, percentKeys) || 0,
      type: "nominal",
    };
  }

  const flatKeys = [...percentKeys, ...nominalKeys];
  const value = pickVoucherNumber(merged, flatKeys) || 0;
  const percentOnly = pickVoucherNumber(merged, [
    "discount_percent", "discountPercentage", "percentage_value", "percent_value", "discount_rate",
  ]) || 0;
  const nominalOnly = pickVoucherNumber(merged, [
    "amount", "discount_amount", "discountAmount", "nominal", "rupiah", "cash", "fixed_amount", "fixed",
  ]) || 0;
  if (percentOnly > 0 && nominalOnly === 0) return { value, type: "percent" };
  if (nominalOnly > 0 && percentOnly === 0) return { value, type: "nominal" };
  return { value, type: "percent" };
}

function normalizeAvailableVoucher(source = {}) {
  const rawCode = source.code || source.voucher_code || source.voucherCode || source.promo_code;
  if (!rawCode) return null;

  const rule = source.rule && typeof source.rule === "object" ? source.rule : {};
  const details = source.details && typeof source.details === "object" ? source.details : {};
  const merged = { ...source, ...details, ...rule };

  const { value: discountValue, type: discountKind } = resolveVoucherDiscount(merged);
  const isNominal = discountKind === "nominal";

  const minPurchase = pickVoucherNumber(merged, [
    "min_purchase", "minPurchase", "minimum_purchase", "minimumPurchase", "min_order", "minOrder",
    "min_spend", "minimum_order", "minimumOrder", "minimum_spend", "minimumSpend", "minimum_amount",
  ]);
  const maxDiscount = pickVoucherNumber(merged, [
    "max_discount", "maxDiscount", "maximum_discount", "discount_limit", "discountLimit",
    "cap", "max_cap", "max_discount_amount", "maxDiscountAmount", "maximum_cap", "cap_amount",
  ]);
  const startsAt = pickVoucherText(merged, [
    "starts_at", "startsAt", "valid_from", "validFrom", "start_date", "startDate", "start", "active_from", "activeFrom",
  ]);
  const endsAt = pickVoucherText(merged, [
    "ends_at", "endsAt", "valid_until", "validUntil", "valid_to", "validTo", "end_date", "endDate",
    "expiry", "expires_at", "expiresAt", "expired_at", "expiration_date", "active_to", "activeTo",
  ]);
  const createdAt = pickVoucherText(merged, ["created_at", "createdAt", "created", "published_at", "publishedAt"]);

const discountText = isNominal
    ? `Diskon ${formatRupiah(discountValue)}`
    : `Diskon ${formatDiscountPercent(discountValue)}%`;
  const name = source.name || source.title || source.label || source.description || source.deskripsi || "Voucher BumiKriya";
  const label = source.description || source.deskripsi || source.label || source.name || source.title || discountText;
  const endDate = parseVoucherDate(endsAt, true);
  const createdDate = parseVoucherDate(createdAt);

  const discountRank = isNominal
    ? discountValue
    : Math.round(Math.max(minPurchase || 0, ASSUMED_VOUCHER_BASKET) * (discountValue / 100));

  return {
    code: String(rawCode).trim().toUpperCase(),
    name,
    label,
    discountType: isNominal ? "nominal" : "percent",
    discountValue,
    discountLabel: isNominal ? formatRupiah(discountValue) : `${formatDiscountPercent(discountValue)}%`,
    percent: isNominal ? 0 : discountValue / 100,
    amount: isNominal ? discountValue : 0,
    minPurchase: minPurchase || 0,
    maxDiscount: maxDiscount || 0,
    startsAt,
    endsAt,
    displayEndsAt: formatVoucherDate(endsAt),
    createdAt,
    validUntilTime: endDate ? endDate.getTime() : Infinity,
    createdTime: createdDate ? createdDate.getTime() : 0,
    discountRank,
    isActiveNow: isVoucherActive(merged, startsAt, endsAt),
  };
}

function compareVoucherValue(a, b) {
  if ((a.discountRank || 0) !== (b.discountRank || 0)) return b.discountRank - a.discountRank;
  if ((a.minPurchase || 0) !== (b.minPurchase || 0)) return (a.minPurchase || 0) - (b.minPurchase || 0);
  if (a.validUntilTime !== b.validUntilTime) return b.validUntilTime - a.validUntilTime;
  return b.createdTime - a.createdTime;
}

function sortAvailableVouchers(list) {
  return [...list].sort(compareVoucherValue);
}

function extractVoucherCollection(raw) {
  const candidates = [raw, raw?.data, raw?.result, raw?.payload, raw?.data?.data, raw?.result?.data];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (!candidate || typeof candidate !== "object") continue;
    for (const key of ["vouchers", "results", "items", "list", "data"]) {
      if (Array.isArray(candidate[key])) return candidate[key];
    }
  }

  return [];
}

function normalizeAvailableVouchers(raw) {
  return extractVoucherCollection(raw)
    .map(normalizeAvailableVoucher)
    .filter(Boolean);
}

function pickFeaturedVoucher(raw) {
  return sortAvailableVouchers(
    normalizeAvailableVouchers(raw).filter((voucher) => voucher.isActiveNow)
  )[0] || null;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

function Reveal({ children, as: Tag = "div", delay = 0, y = 28, className = "", style = {}, once = true, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) obs.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced, once]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 0.85s cubic-bezier(.16,1,.3,1) ${delay}s, transform 0.85s cubic-bezier(.16,1,.3,1) ${delay}s`,
        willChange: "opacity, transform",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function buildMidtransPaymentPayload(source) {
  if (!source) return {};

  if (source instanceof URLSearchParams) {
    return Object.fromEntries(source.entries());
  }

  if (typeof source === "object") {
    return { ...source };
  }

  return {};
}

function isPaidMidtransStatus(status) {
  return /settlement|capture|authorize|\bpaid\b|lunas|terbayar|^200$/.test(String(status || "").toLowerCase());
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
    fetchUserDashboard({ signal: controller.signal })
      .then((data) => {
        const { products, categories } = normalizeStorefront(data);
        setServerProducts(products);
        setServerCategories(categories);
      })
      .catch(() => {
        setServerProducts([]);
        setServerCategories([]);
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

function isLoggedIn() {
  try {
    return !!(localStorage.getItem("authToken") || "").trim();
  } catch {
    return false;
  }
}

function isAdminSession(data) {
  const user = getSessionUser(data) || getStoredAuthUser();
  const roleCandidates = [
    user?.role,
    user?.user_role,
    user?.userRole,
    user?.type,
    user?.user_type,
    user?.userType,
    user?.level,
    user?.permissions,
    data?.role,
    data?.user_role,
    data?.userRole,
    data?.type,
    data?.data?.role,
    data?.data?.user_role,
    data?.data?.userRole,
    data?.data?.type,
    data?.data?.user?.role,
    data?.data?.user?.user_role,
    data?.result?.role,
    data?.result?.user?.role,
  ];
  const role = String(
    roleCandidates
      .flat()
      .filter(Boolean)
      .join(" ")
  ).toLowerCase();
  const email = String(
    user?.email ||
    user?.mail ||
    data?.email ||
    data?.login_email ||
    data?.data?.email ||
    data?.data?.user?.email ||
    data?.result?.user?.email ||
    ""
  ).toLowerCase();
  const emailName = email.split("@")[0] || "";

  return (
    /\b(admin|administrator|superadmin|owner)\b/.test(role) ||
    user?.is_admin === true ||
    user?.isAdmin === true ||
    user?.admin === true ||
    data?.is_admin === true ||
    data?.data?.user?.is_admin === true ||
    emailName === "admin" ||
    emailName.startsWith("admin.")
  );
}

function isSellerUser(user) {
  const roleCandidates = [
    user?.role,
    user?.user_role,
    user?.userRole,
    user?.type,
    user?.user_type,
    user?.userType,
    user?.level,
    user?.seller_status,
    user?.is_seller,
    user?.isSeller,
    user?.store_name,
    user?.storeName,
  ];
  const role = String(
    roleCandidates
      .flat()
      .filter(Boolean)
      .join(" ")
  ).toLowerCase();

  return (
    /\b(seller|merchant|vendor|penjual|toko)\b/.test(role) ||
    user?.is_seller === true ||
    user?.isSeller === true
  );
}

const PRODUCT_BG_COLORS = ["#9fd4d9", "#f0c93b", "#bcdff5", "#f2cf4a"];
const PRODUCT_DETAIL_PLACEHOLDER =
  "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1100&auto=format&fit=crop";
const STORE_BANNER_PLACEHOLDER =
  "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=1600&auto=format&fit=crop";
const STORE_AVATAR_PLACEHOLDER =
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=420&auto=format&fit=crop";
const PRODUCT_DETAIL_ACCENTS = ["#c53b73", "#f0cc43", "#30a6d6", "#f875b0"];

const productDetailStyles = {
  main: {
    background: "#fdeee2",
    minHeight: "calc(100vh - var(--header-h))",
    overflow: "hidden",
  },
  inner: {
    maxWidth: 1536,
    margin: "0 auto",
    padding: "76px clamp(28px, 5.5vw, 86px) 0",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "none",
    background: "transparent",
    color: "#b72d64",
    fontSize: 23,
    fontWeight: 800,
    padding: "0 0 118px",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(360px, 0.92fr) minmax(420px, 1fr)",
    gap: "84px",
    alignItems: "start",
  },
  galleryCol: {
    minWidth: 0,
  },
  imageFrame: {
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: 31,
    border: "5px solid #fff9ec",
    background: "#e8d0b8",
    overflow: "hidden",
    boxShadow: "0 14px 20px -14px rgba(47, 30, 26, 0.42)",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  thumbRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 28,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 11,
    border: "2.5px solid #e8bed1",
    background: "#fff8f2",
    overflow: "hidden",
    padding: 0,
  },
  thumbActive: {
    borderColor: "#c53b73",
    boxShadow: "0 6px 14px -11px rgba(197, 59, 115, 0.72)",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
  },
  sellerCard: {
    display: "grid",
    gridTemplateColumns: "76px auto",
    alignItems: "center",
    gap: 18,
    width: "min(390px, 100%)",
    marginTop: 92,
    border: "none",
    background: "transparent",
    padding: 0,
    textAlign: "left",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  sellerAvatar: {
    width: 76,
    height: 76,
    borderRadius: "50%",
    border: "4px solid #2f1e1a",
    background: "#fff8f2",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    color: "#b72d64",
  },
  sellerAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  sellerNameBox: {
    minHeight: 72,
    borderRadius: 8,
    border: "2px solid #2f1e1a",
    background: "rgba(255, 248, 242, 0.52)",
    color: "#211714",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    fontSize: 18,
    fontWeight: 900,
    boxShadow: "0 1px 0 rgba(47, 30, 26, 0.08)",
  },
  sellerMeta: {
    gridColumn: "2",
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: -6,
    color: "#67534d",
    fontSize: 15,
  },
  sellerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    minHeight: 26,
    borderRadius: 999,
    border: "1.5px solid #2f1e1a",
    background: "#ffe885",
    color: "#3a2a07",
    padding: "0 11px",
    fontSize: 13,
    fontWeight: 800,
  },
  detailsCol: {
    minWidth: 0,
    paddingTop: 5,
  },
  title: {
    margin: "0 0 18px",
    color: "#b72d64",
    fontSize: "clamp(38px, 4.2vw, 56px)",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: 0,
  },
  price: {
    color: "#cfaa00",
    fontSize: 30,
    lineHeight: 1.1,
    fontWeight: 900,
    marginBottom: 26,
  },
  description: {
    color: "#2f1e1a",
    fontSize: 18,
    lineHeight: 1.55,
    maxWidth: 705,
    margin: "0 0 26px",
  },
  chips: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 32,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 34,
    borderRadius: 999,
    background: "#fff8e8",
    padding: "0 15px",
    fontSize: 14,
    fontWeight: 800,
    transform: "rotate(-2deg)",
  },
  actionRow: {
    display: "grid",
    gridTemplateColumns: "156px minmax(260px, 1fr)",
    gap: 28,
    alignItems: "center",
    marginBottom: 50,
  },
  qtyControl: {
    height: 48,
    borderRadius: 9,
    border: "2px solid #c53b73",
    background: "#fff8e8",
    color: "#8f214d",
    display: "grid",
    gridTemplateColumns: "42px 1fr 42px",
    alignItems: "center",
    overflow: "hidden",
  },
  qtyButton: {
    height: "100%",
    border: "none",
    background: "transparent",
    color: "#c53b73",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: {
    color: "#2f1e1a",
    textAlign: "center",
    fontSize: 20,
    fontWeight: 700,
  },
  addButton: {
    minHeight: 64,
    borderRadius: 999,
    border: "2px solid rgba(255, 248, 236, 0.54)",
    background: "linear-gradient(180deg, #bd2f68 0%, #ad285c 100%)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    fontSize: 14,
    fontWeight: 900,
    padding: "0 28px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 12px 24px -18px rgba(168,42,89,0.8)",
  },
  accordion: {
    borderTop: "1.5px solid #e8c4c9",
  },
  accordionItem: {
    borderBottom: "1.5px solid #e8c4c9",
  },
  accordionButton: {
    width: "100%",
    minHeight: 84,
    border: "none",
    background: "transparent",
    color: "#231816",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: 0,
    textAlign: "left",
    fontSize: 17,
    fontWeight: 900,
  },
  accordionBody: {
    color: "#6f5850",
    fontSize: 14.5,
    lineHeight: 1.6,
    padding: "0 0 22px",
  },
  specList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    margin: 0,
  },
  specRow: {
    display: "grid",
    gridTemplateColumns: "minmax(120px, 200px) 1fr",
    gap: 12,
    alignItems: "baseline",
  },
  specName: {
    margin: 0,
    fontWeight: 800,
    color: "#231816",
    fontSize: 14,
  },
  specValue: {
    margin: 0,
    color: "#6f5850",
  },
  careList: {
    margin: 0,
    paddingLeft: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  careItem: {
    color: "#6f5850",
  },
  wave: {
    display: "block",
    width: "100%",
    height: 92,
    margin: "72px 0 58px",
    fill: "none",
    stroke: "rgba(183, 45, 100, 0.42)",
    strokeWidth: 6,
    strokeDasharray: "30 18",
  },
  moreSection: {
    padding: "0 clamp(28px, 5.5vw, 86px) 94px",
  },
  moreTitle: {
    color: "#b72d64",
    textAlign: "center",
    fontSize: "clamp(36px, 4.2vw, 54px)",
    lineHeight: 1.1,
    fontWeight: 900,
    letterSpacing: 0,
    margin: "0 0 62px",
  },
  moreGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "54px 42px",
  },
  moreCard: {
    minWidth: 0,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  moreImageButton: {
    width: "100%",
    aspectRatio: "1.08 / 1",
    borderRadius: 26,
    border: "3px solid #c53b73",
    background: "#fff8f2",
    padding: 0,
    overflow: "hidden",
    marginBottom: 29,
    position: "relative",
  },
  moreImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  moreTitleText: {
    color: "#2f1e1a",
    fontSize: 25,
    lineHeight: 1.2,
    fontWeight: 500,
    margin: "0 0 8px",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  morePrice: {
    color: "#6f5850",
    fontSize: 16,
    margin: "0 0 20px",
  },
  moreAdd: {
    minWidth: 132,
    minHeight: 44,
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(180deg, #bd2f68 0%, #a82a59 100%)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 15,
    fontWeight: 650,
    padding: "0 20px",
  },
stateBox: {
    minHeight: 320,
    border: "1.5px dashed rgba(168, 42, 89, 0.24)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.46)",
    color: "#8a5268",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 28,
    fontSize: 15,
    fontWeight: 800,
  },
  reviewsSection: {
    position: "relative",
    maxWidth: 1536,
    margin: "0 auto",
    padding: "18px clamp(28px, 5.5vw, 86px) 78px",
  },
  reviewsWave: {
    display: "block",
    width: "100%",
    height: 72,
    fill: "none",
    stroke: "rgba(183, 45, 100, 0.44)",
    strokeWidth: 6,
    strokeDasharray: "31 19",
    strokeLinecap: "butt",
    pointerEvents: "none",
  },
  reviewsWaveBottom: {
    margin: "58px 0 0",
  },
  reviewsHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 28,
  },
  reviewsEyebrow: {
    margin: 0,
    color: "#201715",
    fontFamily: FONT_DISPLAY,
    fontSize: 32,
    lineHeight: 1.15,
    fontWeight: 800,
  },
  reviewsLead: {
    margin: "6px 0 0",
    color: "#6f5850",
    fontSize: 14,
  },
  reviewsSummary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    borderRadius: 999,
    border: "1.5px solid #e8c5d2",
    background: "#fff8f6",
    padding: "8px 16px",
  },
  reviewsAverage: {
    color: "#201715",
    fontSize: 20,
    fontWeight: 900,
    lineHeight: 1,
  },
  reviewsStarsSummary: {
    display: "inline-flex",
    alignItems: "center",
    color: "#f5a623",
  },
  reviewsCount: {
    color: "#6f5850",
    fontSize: 13,
    fontWeight: 700,
  },
  reviewsList: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    width: "min(720px, 100%)",
    margin: "0 auto",
  },
  reviewsActionRow: {
    display: "flex",
    justifyContent: "center",
    marginTop: 30,
  },
  reviewsAllButton: {
    minHeight: 46,
    borderRadius: 999,
    border: "2px solid #b72d64",
    background: "#fff8f6",
    color: "#b72d64",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "0 20px",
    fontSize: 14,
    fontWeight: 900,
    fontFamily: "inherit",
    boxShadow: "0 10px 18px -16px rgba(168, 42, 89, 0.52)",
    cursor: "pointer",
  },
  reviewItem: {
    position: "relative",
    width: "100%",
    minHeight: 106,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 18,
    alignItems: "center",
    textAlign: "left",
    borderRadius: 22,
    border: "2px solid #ff7fb5",
    background: "#fff8f2",
    color: "#2f1e1a",
    padding: "20px 16px 18px 30px",
    fontFamily: "inherit",
    boxShadow: "0 2px 0 rgba(197, 59, 115, 0.04)",
    cursor: "pointer",
  },
  reviewItemAvatarBox: {
    position: "absolute",
    left: -46,
    top: 0,
    width: 34,
    height: 34,
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #c53b73",
    background: "#ffd7e6",
    color: "#8f214d",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
  },
  reviewItemAvatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  reviewItemAvatarFallback: {
    width: "100%",
    height: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewItemBody: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  reviewItemTop: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    flexWrap: "wrap",
  },
  reviewItemName: {
    margin: 0,
    color: "#231816",
    fontSize: 13.5,
    fontWeight: 800,
  },
  reviewItemDate: {
    color: "#9a8078",
    fontSize: 11.5,
    lineHeight: 1,
  },
  reviewItemStars: {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    color: "#b72d64",
  },
  reviewItemComment: {
    margin: 0,
    color: "#4c3a35",
    fontSize: 13.5,
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  reviewItemPhotoBox: {
    width: 76,
    height: 58,
    borderRadius: 10,
    border: "2px solid #c53b73",
    background: "#f6e8df",
    overflow: "hidden",
    flexShrink: 0,
  },
  reviewItemPhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  reviewsState: {
    borderRadius: 16,
    border: "1.5px dashed #e8c5d2",
    background: "#fff8f6",
    color: "#7b625b",
    padding: "36px 24px",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 1.5,
  },
  reviewsAllOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "rgba(47, 30, 26, 0.42)",
    backdropFilter: "blur(2px)",
  },
  reviewsAllModal: {
    position: "relative",
    width: "min(860px, 100%)",
    maxHeight: "calc(100vh - 40px)",
    background: "#fff8f2",
    borderRadius: 8,
    border: "2px solid #2f1e1a",
    borderBottom: "8px solid #b72d64",
    boxShadow: "10px 8px 0 rgba(183, 45, 100, 0.78), 0 28px 58px -26px rgba(0, 0, 0, 0.48)",
    padding: "28px clamp(20px, 4vw, 38px) 34px",
    overflowY: "auto",
  },
  reviewsAllHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    marginBottom: 26,
  },
  reviewsAllTitle: {
    margin: 0,
    color: "#201715",
    fontFamily: FONT_DISPLAY,
    fontSize: "clamp(26px, 4vw, 36px)",
    lineHeight: 1.1,
    fontWeight: 800,
  },
  reviewsAllLead: {
    margin: "7px 0 0",
    color: "#6f5850",
    fontSize: 14,
    lineHeight: 1.45,
  },
  reviewsAllClose: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "2px solid #2f1e1a",
    background: "#ffe0eb",
    color: "#2f1e1a",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    cursor: "pointer",
  },
  reviewsAllList: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    width: "min(720px, calc(100% - 46px))",
    margin: "0 auto",
  },
  reviewDetailOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 520,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "rgba(47, 30, 26, 0.42)",
    backdropFilter: "blur(2px)",
  },
  reviewDetailModal: {
    position: "relative",
    width: "min(820px, 100%)",
    maxHeight: "calc(100vh - 40px)",
    display: "grid",
    gridTemplateColumns: "minmax(260px, 0.92fr) minmax(320px, 1fr)",
    gap: 26,
    background: "#fff8f2",
    borderRadius: 8,
    border: "2px solid #2f1e1a",
    borderBottom: "8px solid #b72d64",
    boxShadow: "10px 8px 0 rgba(183, 45, 100, 0.78), 0 28px 58px -26px rgba(0, 0, 0, 0.48)",
    padding: "22px 28px 24px",
    overflowY: "auto",
  },
  reviewDetailModalNoPhoto: {
    gridTemplateColumns: "minmax(0, 1fr)",
    width: "min(560px, 100%)",
  },
  reviewDetailClose: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "2px solid #2f1e1a",
    background: "#ffe985",
    color: "#2f1e1a",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    zIndex: 2,
    cursor: "pointer",
  },
  reviewDetailPhotoFrame: {
    minHeight: 330,
    borderRadius: 12,
    border: "2px solid #2f1e1a",
    background: "#f6e8df",
    overflow: "hidden",
    alignSelf: "stretch",
  },
  reviewDetailPhoto: {
    width: "100%",
    height: "100%",
    minHeight: 330,
    objectFit: "cover",
    display: "block",
  },
  reviewDetailContent: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "12px 0 20px",
  },
  reviewDetailHead: {
    display: "grid",
    gridTemplateColumns: "44px minmax(0, 1fr)",
    gap: 12,
    alignItems: "center",
    paddingRight: 48,
    marginBottom: 12,
  },
  reviewDetailAvatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "2px solid #2f1e1a",
    background: "#ffe985",
    color: "#5d4312",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    fontSize: 14,
    fontWeight: 900,
  },
  reviewDetailAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  reviewDetailNameBox: {
    minWidth: 0,
  },
  reviewDetailName: {
    margin: 0,
    color: "#231816",
    fontSize: 23,
    lineHeight: 1.1,
    fontWeight: 900,
  },
  reviewDetailDate: {
    display: "block",
    color: "#6f5850",
    fontSize: 13,
    fontWeight: 700,
    marginTop: 4,
  },
  reviewDetailStars: {
    display: "inline-flex",
    marginBottom: 42,
  },
  reviewDetailQuote: {
    position: "relative",
    margin: "0 0 20px",
    padding: "18px 0 24px 22px",
    color: "#2f1e1a",
    fontSize: 18,
    lineHeight: 1.75,
    borderRight: "4px solid #ffb6d4",
    borderBottom: "4px solid #ffb6d4",
    borderRadius: "0 16px 16px 0",
  },
  reviewDetailHelpful: {
    minHeight: 34,
    borderRadius: 999,
    border: "2px solid #2f1e1a",
    background: "#fff8f2",
    color: "#2f1e1a",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 850,
    padding: "0 18px",
    cursor: "pointer",
  },
};

const storeDetailStyles = {
  main: {
    background: "#fdeee2",
    minHeight: "calc(100vh - var(--header-h))",
    overflow: "hidden",
  },
  inner: {
    maxWidth: 1536,
    margin: "0 auto",
    padding: "74px clamp(28px, 5.5vw, 86px) 112px",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "none",
    background: "transparent",
    color: "#b72d64",
    fontSize: 18,
    fontWeight: 850,
    padding: "0 0 28px",
  },
  hero: {
    position: "relative",
    minHeight: 384,
    borderRadius: 28,
    border: "3px solid #2d64a1",
    borderTop: "none",
    background: "#cfe1fb",
    overflow: "visible",
    boxShadow: "0 4px 0 #2d64a1",
    marginBottom: 118,
  },
  heroImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.22,
    display: "block",
  },
  heroBlob: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 172,
    height: 214,
    borderBottomLeftRadius: 118,
    background: "#ca79bd",
    opacity: 0.88,
  },
  avatar: {
    position: "absolute",
    left: "clamp(40px, 5vw, 78px)",
    bottom: -68,
    width: 142,
    height: 142,
    borderRadius: "50%",
    border: "5px solid #2f1e1a",
    background: "#fff8f2",
    overflow: "hidden",
    zIndex: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#b72d64",
  },
  identity: {
    position: "absolute",
    left: "clamp(214px, 18vw, 292px)",
    bottom: -55,
    minHeight: 92,
    maxWidth: "min(620px, calc(100% - 430px))",
    borderRadius: 10,
    border: "2.5px solid #2f1e1a",
    background: "rgba(255,248,242,0.88)",
    boxShadow: "0 3px 0 rgba(47,30,26,0.18)",
    padding: "20px 26px 16px",
    zIndex: 2,
  },
  name: {
    margin: "0 0 9px",
    color: "#211714",
    fontSize: "clamp(31px, 3.3vw, 52px)",
    lineHeight: 1.02,
    fontWeight: 950,
    letterSpacing: 0,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    color: "#67534d",
    fontSize: 15,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight: 28,
    borderRadius: 999,
    border: "1.5px solid #2f1e1a",
    background: "#ffe885",
    color: "#3a2a07",
    padding: "0 12px",
    fontSize: 13,
    fontWeight: 850,
  },
  follow: {
    position: "absolute",
    right: "clamp(38px, 5vw, 84px)",
    bottom: -36,
    minHeight: 52,
    borderRadius: 8,
    border: "2px solid #2f1e1a",
    background: "#ad2d68",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontSize: 15,
    fontWeight: 900,
    padding: "0 28px",
    boxShadow: "5px 5px 0 #8f214d",
    zIndex: 2,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 28,
    marginBottom: 94,
  },
  statCard: {
    minHeight: 148,
    borderRadius: 12,
    border: "2px solid #2f1e1a",
    background: "rgba(255,248,242,0.74)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "5px 5px 0 #f2ca4c",
  },
  statValue: {
    color: "#211714",
    fontSize: 31,
    lineHeight: 1,
    fontWeight: 950,
  },
  statLabel: {
    color: "#5f4b48",
    fontSize: 12,
    fontWeight: 850,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  storyGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 420px)",
    gap: 58,
    alignItems: "start",
    marginBottom: 88,
  },
  storyCard: {
    position: "relative",
    borderRadius: 118,
    background: "rgba(255,248,242,0.64)",
    padding: "58px clamp(30px, 4vw, 58px)",
    minHeight: 470,
  },
  storyTitle: {
    margin: "0 0 28px",
    color: "#211714",
    fontSize: 31,
    lineHeight: 1.1,
    fontWeight: 900,
  },
  storyText: {
    color: "#5f4b48",
    fontSize: 17,
    lineHeight: 1.75,
    margin: "0 0 24px",
    whiteSpace: "pre-line",
  },
  tagRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 30,
  },
  tag: {
    minHeight: 34,
    borderRadius: 999,
    border: "1.5px solid #2f1e1a",
    display: "inline-flex",
    alignItems: "center",
    padding: "0 16px",
    fontSize: 12,
    fontWeight: 850,
  },
  rulesCard: {
    position: "relative",
    border: "2px solid #2f1e1a",
    background: "#ffe8b7",
    padding: "44px 32px 34px",
    boxShadow: "8px 8px 0 #f4cf58",
    transform: "rotate(1deg)",
  },
  rulesPin: {
    position: "absolute",
    top: -18,
    left: "50%",
    transform: "translateX(-50%)",
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "2px solid #2f1e1a",
    background: "#ad2d68",
    color: "#fff8f2",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  rulesTitle: {
    margin: "0 0 22px",
    color: "#211714",
    fontSize: 28,
    lineHeight: 1.1,
    textAlign: "center",
    fontWeight: 900,
  },
  rulesDivider: {
    borderTop: "2px dashed #2f1e1a",
    margin: "0 0 26px",
  },
  ruleItem: {
    display: "grid",
    gridTemplateColumns: "44px minmax(0, 1fr)",
    gap: 16,
    alignItems: "start",
    marginBottom: 24,
  },
  ruleIcon: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "1.5px solid #2f1e1a",
    background: "#fff8f2",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ruleTitle: {
    display: "block",
    color: "#211714",
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 4,
  },
  ruleText: {
    color: "#5f4b48",
    fontSize: 13,
    lineHeight: 1.45,
    margin: 0,
  },
  productsSection: {
    paddingTop: 6,
  },
  productsTitle: {
    margin: "0 0 32px",
    color: "#b72d64",
    fontSize: "clamp(34px, 4vw, 48px)",
    lineHeight: 1.1,
    textAlign: "center",
    fontWeight: 950,
  },
  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "52px 36px",
  },
  stateBox: {
    minHeight: 260,
    border: "1.5px dashed rgba(168, 42, 89, 0.26)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.44)",
    color: "#8a5268",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 28,
    fontSize: 15,
    fontWeight: 800,
  },
};

function normalizeCart(raw) {
  return extractCartItems(raw)
    .map((item, index) => normalizeCartItem(item, index))
    .filter((item) => item.title && item.quantity > 0);
}

function extractCartItems(raw) {
  const candidates = [
    raw,
    raw?.data,
    raw?.result,
    raw?.payload,
    raw?.cart,
    raw?.data?.cart,
    raw?.result?.cart,
    raw?.payload?.cart,
    raw?.data?.data,
    raw?.data?.data?.cart,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (!candidate || typeof candidate !== "object") continue;

    const items =
      candidate.items ||
      candidate.cart_items ||
      candidate.cartItems ||
      candidate.products ||
      candidate.data?.items ||
      candidate.data?.cart_items ||
      candidate.data?.cartItems;

    if (Array.isArray(items)) return items;
  }

  return [];
}

function normalizeCartItem(item, index) {
  const product =
    item.product ||
    item.product_detail ||
    item.productDetail ||
    item.product_data ||
    item.productData ||
    {};
  const quantity = normalizeCartQuantity(item.quantity ?? item.qty ?? item.jumlah, 1);
  const cartItemId =
    item.item_id ??
    item.itemId ??
    item.cart_item_id ??
    item.cartItemId ??
    item.cart_item?.id ??
    item.id ??
    item.uuid ??
    `cart-item-${index + 1}`;
  const productId =
    item.product_id ??
    item.productId ??
    product.id ??
    product.uuid ??
    product.product_id ??
    product.productId;
  const rawUnitPrice =
    product.price ??
    product.harga ??
    product.selling_price ??
    product.sale_price ??
    product.price_value ??
    item.unit_price ??
    item.unitPrice ??
    item.price_each ??
    item.price ??
    item.harga;
  const rawTotalPrice = item.subtotal ?? item.total_price ?? item.totalPrice ?? item.total;
  const unitPrice = parseRupiah(rawUnitPrice) || Math.round(parseRupiah(rawTotalPrice) / quantity) || 0;
  const categoryLabel = pickCartCategoryLabel(product, item);

  return {
    id: productId ?? cartItemId,
    productId,
    cartItemId,
    title:
      product.title ||
      product.name ||
      product.product_name ||
      product.nama_produk ||
      item.title ||
      item.name ||
      item.product_name ||
      item.nama_produk ||
      "Produk",
    price: formatStorefrontPrice(rawUnitPrice || unitPrice),
    priceValue: unitPrice,
    quantity,
    badge: categoryLabel,
    img: resolveProductImage(product) || resolveProductImage(item),
    bg: product.bg || item.bg || PRODUCT_BG_COLORS[index % PRODUCT_BG_COLORS.length],
  };
}

function pickCartCategoryLabel(product, item) {
  const candidates = [product, item]
    .flatMap((source) => {
      if (!source || typeof source !== "object") return [];

      const nestedCategory = [
        source.category,
        source.kategori,
        source.product_category,
        source.productCategory,
        source.category_detail,
        source.categoryDetail,
      ].find((value) => value && typeof value === "object");

      return [
        source.category_name,
        source.categoryName,
        source.nama_kategori,
        source.kategori_name,
        source.kategoriName,
        source.product_category_name,
        source.productCategoryName,
        source.category_label,
        typeof source.category === "string" ? source.category : "",
        typeof source.kategori === "string" ? source.kategori : "",
        nestedCategory?.name,
        nestedCategory?.title,
        nestedCategory?.category_name,
        nestedCategory?.categoryName,
        nestedCategory?.nama_kategori,
        nestedCategory?.kategori,
      ];
    })
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return candidates.find((value) => !/^(kriya|kategori|produk|handmade)$/i.test(value)) || "";
}

function normalizeCartQuantity(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.max(1, Math.round(number));
}

function getCartItemRequestId(item) {
  return item?.cartItemId ?? item?.itemId ?? item?.cart_item_id ?? item?.cartItemId ?? item?.id;
}

function normalizeWishlist(raw) {
  return extractWishlistItems(raw)
    .map((item, index) => normalizeWishlistItem(item, index))
    .filter((item) => item.title);
}

function extractWishlistItems(raw) {
  const candidates = [
    raw,
    raw?.data,
    raw?.result,
    raw?.payload,
    raw?.wishlist,
    raw?.data?.wishlist,
    raw?.result?.wishlist,
    raw?.payload?.wishlist,
    raw?.data?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (!candidate || typeof candidate !== "object") continue;

    const items =
      candidate.items ||
      candidate.wishlist_items ||
      candidate.wishlistItems ||
      candidate.products ||
      candidate.data?.items ||
      candidate.data?.wishlist_items ||
      candidate.data?.wishlistItems;

    if (Array.isArray(items)) return items;
  }

  return [];
}

function normalizeWishlistItem(item, index) {
  const product =
    item.product ||
    item.product_detail ||
    item.productDetail ||
    item.product_data ||
    item.productData ||
    {};
  const wishlistItemId =
    item.item_id ??
    item.itemId ??
    item.wishlist_item_id ??
    item.wishlistItemId ??
    item.id ??
    item.uuid ??
    `wishlist-item-${index + 1}`;
  const productId =
    item.product_id ??
    item.productId ??
    product.id ??
    product.uuid ??
    product.product_id ??
    product.productId;

  return {
    id: productId ?? wishlistItemId,
    wishlistItemId,
    productId,
    title:
      product.title ||
      product.name ||
      product.product_name ||
      product.nama_produk ||
      item.title ||
      item.name ||
      item.product_name ||
      item.nama_produk ||
      "Produk",
    price: formatStorefrontPrice(
      product.price ??
        product.harga ??
        product.selling_price ??
        product.sale_price ??
        product.price_value ??
        item.price ??
        item.harga
    ),
    img: resolveProductImage(product) || resolveProductImage(item),
    accent: WISHLIST_ACCENTS[index % WISHLIST_ACCENTS.length],
    label:
      product.badge ||
      product.category ||
      product.category_name ||
      product.kategori ||
      item.label ||
      "",
  };
}

function normalizeStorefront(raw) {
  const payload = raw?.data || raw?.result || raw?.payload || raw || {};
  const root = payload.data || payload;

  const productsSource =
    (Array.isArray(root?.products) && root.products) ||
    (Array.isArray(root?.items) && root.items) ||
    (Array.isArray(root?.list) && root.list) ||
    (Array.isArray(payload?.products) && payload.products) ||
    (Array.isArray(payload?.items) && payload.items) ||
    (Array.isArray(raw) && raw) ||
    [];

  const categoriesSource =
    (Array.isArray(root?.categories) && root.categories) ||
    (Array.isArray(root?.category) && root.category) ||
    (Array.isArray(root?.kategori) && root.kategori) ||
    (Array.isArray(payload?.categories) && payload.categories) ||
    [];

  const categories = categoriesSource
    .map((item, index) => ({
      id: item.id ?? item.uuid ?? item.category_id ?? item.categoryId ?? item._id ?? `category-${index + 1}`,
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
        resolveApiUrl(item.photo) ||
        resolveApiUrl(item.thumbnail),
    }))
    .filter((item) => item.name);

  const categoryNameById = categories.reduce((map, category) => {
    if (category.id !== undefined && category.id !== null && category.id !== "") {
      map[String(category.id)] = category.name;
    }
    return map;
  }, {});

  const products = productsSource
    .map((item, index) => {
      const categoryFields = pickCategoryFields(item);
      const badgeText = typeof item.badge === "string" ? item.badge.trim() : "";
      const directCategoryName = categoryFields.names.find((name) => name.trim() && name.trim() !== badgeText);
      const mappedCategoryName = categoryNameById[String(categoryFields.id)] || "";
      const categoryName = directCategoryName || mappedCategoryName || badgeText || "Kriya";

      return {
        id: item.id ?? item.uuid ?? item.product_id ?? item.productId ?? item._id ?? `product-${index + 1}`,
        storeId: pickStoreId(item),
        categoryId: categoryFields.id,
        title: item.title || item.name || item.product_name || item.nama_produk || "Produk",
        description:
          item.description ||
          item.desc ||
          item.deskripsi ||
          item.product_description ||
          item.productDescription ||
          item.detail ||
          "",
        price: formatStorefrontPrice(
          item.price ?? item.harga ?? item.selling_price ?? item.sale_price ?? item.price_value
        ),
        priceValue: parseRupiah(
          item.price ?? item.harga ?? item.selling_price ?? item.sale_price ?? item.price_value ?? 0
        ),
        created: item.created_at ?? item.createdAt ?? item.date ?? item.published_at ?? item.created_date ?? "",
        sold: Number(
          item.sold ??
            item.total_sold ??
            item.totalSold ??
            item.sales ??
            item.terjual ??
            item.stock_sold ??
            item.orders_count ??
            item.popularity ??
            0
        ) || 0,
        badge: categoryName,
        img: resolveProductImage(item),
        bg: item.bg || PRODUCT_BG_COLORS[index % PRODUCT_BG_COLORS.length],
      };
    })
    .filter((item) => item.title);

  return { products, categories };
}

function normalizeProductDetail(raw, fallback = {}, productId = "") {
  const source = extractProductDetailRecord(raw);
  const merged = { ...(fallback || {}), ...(source || {}) };
  const category =
    merged.category ||
    merged.kategori ||
    merged.product_category ||
    merged.productCategory ||
    {};
  const sellerSource = merged.seller || merged.store || merged.shop || merged.maker || merged.user || {};
  const images = collectProductImages(merged, fallback);
  const priceValue = pickMoney(
    merged.price,
    merged.harga,
    merged.selling_price,
    merged.sale_price,
    merged.price_value,
    fallback?.priceValue,
    fallback?.price
  );
  const stock = pickNumberFromSources([merged, merged.inventory || {}, merged.stock_detail || {}], [
    "stock",
    "stok",
    "quantity",
    "qty",
    "inventory",
    "stock_quantity",
    "stockQuantity",
  ]);

  const specifications = collectSpecificationRows(merged);

  return {
    raw: merged,
    id: merged.id ?? merged.uuid ?? merged.product_id ?? merged.productId ?? productId,
    productId: merged.product_id ?? merged.productId ?? merged.id ?? merged.uuid ?? productId,
    title:
      merged.title ||
      merged.name ||
      merged.product_name ||
      merged.productName ||
      merged.nama_produk ||
      fallback?.title ||
      "Produk",
    price: formatStorefrontPrice(priceValue || merged.price || merged.harga || fallback?.price),
    priceValue,
    description: pickProductDescription(source, fallback),
    badge:
      (typeof category === "string" && category) ||
      category.name ||
      category.category_name ||
      category.title ||
      merged.category_name ||
      merged.kategori ||
      fallback?.badge ||
      "Kriya",
    img: images[0] || PRODUCT_DETAIL_PLACEHOLDER,
    images: images.length ? images : [PRODUCT_DETAIL_PLACEHOLDER],
    tags: collectProductTags(merged, category, stock),
    stock,
    specifications,
    material:
      merged.material || merged.bahan || merged.fabric || specRowValue(specifications, "material", "bahan", "fabric") || "",
    color:
      merged.color || merged.warna || specRowValue(specifications, "color", "warna") || "",
    dimensions:
      merged.dimensions ||
      merged.dimension ||
      merged.ukuran ||
      merged.size ||
      specRowValue(specifications, "fits", "dimensions", "ukuran", "size") ||
      "",
    weight:
      merged.weight || merged.berat || specRowValue(specifications, "weight", "berat") || "",
    careInstructions: collectCareInstructions(merged),
    shippingInfo: collectShippingInfo(merged),
    seller: normalizeProductSeller(merged, sellerSource),
    bg: fallback?.bg || merged.bg || PRODUCT_BG_COLORS[0],
  };
}

function collectSpecificationRows(merged = {}) {
  const rows = [];
  const seen = new Set();
  const push = (label, value) => {
    const l = String(label || "").trim();
    const v = String(value ?? "").trim();
    if (!l || !v || seen.has(l)) return;
    seen.add(l);
    rows.push({ label: l, value: v });
  };

  const rawSpecs = merged.specifications ?? merged.specs ?? merged.specification ?? [];
  if (Array.isArray(rawSpecs)) {
    rawSpecs.forEach((item) => {
      if (!item || typeof item !== "object") return;
      push(
        item.name || item.label || item.key || item.title || item.spec_name || item.attribute,
        item.value ?? item.val ?? item.description ?? item.detail ?? item.data
      );
    });
  }

  if (rows.length) {
    push("Kategori", merged.badge || merged.category?.name || merged.category_name || merged.kategori);
    push("Stok", merged.stock || merged.quantity || merged.qty);
  } else {
    push("Kategori", merged.badge || merged.category?.name || merged.category_name || merged.kategori);
    push("Material", merged.material || merged.bahan || merged.fabric);
    push("Warna", merged.color || merged.warna);
    push("Ukuran", merged.dimensions || merged.dimension || merged.ukuran || merged.size || merged.fits);
    push("Berat", merged.weight || merged.berat);
    push("Stok", merged.stock || merged.quantity || merged.qty);
  }

  return rows;
}

function specRowValue(rows, ...labels) {
  const wanted = labels.map((label) => label.toLowerCase().trim());
  const row = rows.find((spec) => wanted.includes(spec.label.toLowerCase().trim()));
  return row ? row.value : "";
}

function collectCareInstructions(merged = {}) {
  const raw = merged.care_instructions ?? merged.careInstructions ?? merged.care ?? [];
  if (typeof raw === "string") {
    return raw
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          return String(
            item.text || item.description || item.content || item.instruction || item.title || ""
          ).trim();
        }
        return "";
      })
      .filter(Boolean);
  }
  if (raw && typeof raw === "object") {
    return Object.values(raw)
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
  }
  return [];
}

function collectShippingInfo(merged = {}) {
  const raw = merged.shipping_info ?? merged.shippingInfo ?? merged.shipping ?? {};
  const rows = [];
  const push = (label, value) => {
    const v = String(value ?? "").trim();
    if (!v) return;
    rows.push({ label, value: v });
  };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    push("Waktu Proses", raw.processing_time || raw.processingTime || raw.processing || raw.time);
    push(
      "Metode Pengiriman",
      raw.shipping_method || raw.shippingMethod || raw.method || raw.courier
    );
    push(
      "Estimasi Tiba",
      raw.estimated_delivery ||
        raw.estimatedDelivery ||
        raw.delivery_time ||
        raw.deliveryTime ||
        raw.eta ||
        raw.estimated
    );
    push("Catatan", raw.notes || raw.note || raw.additional_info || raw.additionalInfo);
  } else if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (typeof item === "string") push("Info", item);
      if (item && typeof item === "object") {
        push(item.name || item.label || item.title, item.value ?? item.text ?? item.description);
      }
    });
  }
  return rows;
}

function pickProductDescription(source = {}, fallback = {}) {
  const candidates = [
    source.description,
    source.desc,
    source.deskripsi,
    source.detail,
    source.product_description,
    source.productDescription,
    fallback?.description,
    fallback?.desc,
    fallback?.deskripsi,
    fallback?.detail,
    fallback?.product_description,
    fallback?.productDescription,
  ];
  for (const candidate of candidates) {
    const text = String(candidate ?? "").trim();
    if (text) return text;
  }
  return "Karya pilihan dari pengrajin BumiKriya dengan sentuhan handmade yang hangat, unik, dan siap menemani ruang atau gaya harianmu.";
}

function extractProductDetailRecord(raw) {
  if (!raw || typeof raw !== "object") return {};
  const candidates = [
    raw.product,
    raw.data?.product,
    raw.data?.data?.product,
    raw.result?.product,
    raw.payload?.product,
    raw.item,
    raw.data?.item,
    raw.data?.data?.item,
    raw.data?.data,
    raw.data,
    raw.result?.data,
    raw.result,
    raw.payload?.data,
    raw.payload,
    raw,
  ];

  return candidates.find((candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate)) || {};
}

function collectProductImages(product = {}, fallback = {}) {
  const values = [
    product.img,
    product.image,
    product.image_url,
    product.imageUrl,
    product.photo,
    product.thumbnail,
    product.cover,
    product.cover_url,
    fallback?.img,
  ];

  const collections = [
    product.images,
    product.gallery,
    product.photos,
    product.media,
    product.product_images,
    product.productImages,
  ];

  collections.forEach((collection) => {
    if (!Array.isArray(collection)) return;
    collection.forEach((item) => {
      if (typeof item === "string") {
        values.push(item);
        return;
      }
      if (item && typeof item === "object") {
        values.push(item.url, item.src, item.path, item.image, item.image_url, item.imageUrl, item.photo);
      }
    });
  });

  return Array.from(new Set(values.map(resolveApiUrl).filter(Boolean)));
}

function collectProductTags(product, category, stock) {
  const rawTags = [
    product.material,
    product.bahan,
    product.color,
    product.warna,
    product.style,
    product.type,
    typeof category === "string" ? category : category?.name || category?.category_name,
  ];
  const arrayTags = product.tags || product.labels || product.attributes || [];
  if (Array.isArray(arrayTags)) {
    arrayTags.forEach((tag) => {
      if (typeof tag === "string") rawTags.push(tag);
      if (tag && typeof tag === "object") rawTags.push(tag.name || tag.label || tag.value);
    });
  }
  if (stock > 0) rawTags.push(`${stock} tersedia`);

const tags = Array.from(new Set(rawTags.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean)));
  return tags.length ? tags.slice(0, 3) : ["Handmade", "Kurasi Lokal"];
}

function buildFullLocation(product = {}, seller = {}) {
  const parts = [
    seller.address_line1 ||
      seller.addressLine1 ||
      seller.street ||
      seller.jalan ||
      product.address_line1 ||
      product.street ||
      "",
    seller.address || seller.alamat || product.address || product.alamat,
    seller.district || seller.kecamatan || seller.village || seller.desa,
    seller.city || seller.kota || product.city || product.kota,
    seller.state || seller.province || seller.provinsi || product.state || product.province || product.provinsi,
    seller.postal_code || seller.postalCode || seller.zip || seller.kode_pos || product.postal_code || product.zip,
    seller.country || product.country || "",
    seller.location || product.location,
  ];
  const unique = [...new Set(parts.map((part) => String(part || "").trim()).filter(Boolean))];
  return unique.join(", ");
}

function normalizeProductSeller(product, seller = {}) {
  const source = seller && typeof seller === "object" ? seller : {};
  const location =
    source.location ||
    source.address ||
    source.alamat ||
    source.city ||
    source.kota ||
    product.location ||
    product.city ||
    product.seller?.location ||
    "";
  const fullLocation = buildFullLocation(product, source) || location;

  return {
    id: pickStoreId(product) || pickStoreId(source),
    storeId: pickStoreId(product) || pickStoreId(source),
    name:
      pickStoreName(product) ||
      pickStoreName(source) ||
      source.name ||
      source.username ||
      "CraftyHands Studio",
    role:
      source.role_label ||
      source.roleLabel ||
      source.badge ||
      source.level ||
      "Master Crafter",
    location: location || "Indonesia",
    fullLocation,
    avatar: resolveApiUrl(
      source.logo ||
        source.logo_url ||
        source.logoUrl ||
        source.avatar ||
        source.avatar_url ||
        source.photo ||
        source.photo_url ||
        product.store_logo ||
        product.seller_avatar
    ),
  };
}

function pickStoreId(source = {}) {
  if (!source || typeof source !== "object") return "";
  const store = source.store || source.shop || source.seller || source.maker || {};
  const candidates = [
    source.store_id,
    source.storeId,
    source.shop_id,
    source.shopId,
    source.user_store_id,
    source.userStoreId,
    source.merchant_id,
    source.merchantId,
    source.seller_store_id,
    source.sellerStoreId,
    source.seller_id,
    source.sellerId,
    store.store_id,
    store.storeId,
    store.shop_id,
    store.shopId,
    store.user_store_id,
    store.userStoreId,
    store.merchant_id,
    store.merchantId,
    store.seller_id,
    store.sellerId,
    store.slug,
    store.id,
    store.uuid,
    source.store_slug,
    source.slug,
    source.uuid,
    source.id,
  ];
  const value = candidates.find((candidate) => candidate !== undefined && candidate !== null && candidate !== "");
  return value === undefined || value === null ? "" : String(value);
}

function pickNumberFromSources(sources, keys) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      const value = Number(source[key]);
      if (Number.isFinite(value)) return value;
    }
  }
  return 0;
}

function resolveProductImage(item) {
  return (
    resolveApiUrl(item.img) ||
    resolveApiUrl(item.image) ||
    resolveApiUrl(item.image_url) ||
    resolveApiUrl(item.imageUrl) ||
    resolveApiUrl(item.photo) ||
    resolveApiUrl(item.thumbnail) ||
    resolveApiUrl(item.thumbnail_url) ||
    resolveApiUrl(item.thumbnailUrl) ||
    resolveApiUrl(item.cover) ||
    resolveApiUrl(item.cover_url) ||
    resolveApiUrl(item.media?.[0]?.url) ||
    resolveApiUrl(item.images?.[0]?.url) ||
    resolveApiUrl(item.images?.[0])
  );
}

function formatStorefrontPrice(value) {
  if (value === undefined || value === null || value === "") return "Rp 0";
  if (typeof value === "number") {
    return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value)}`;
  }
  const normalized = Number(String(value).replace(/[^\d.-]/g, ""));
  if (!normalized) return String(value).startsWith("Rp") ? String(value) : `Rp ${String(value)}`;
  return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(normalized)}`;
}

function getViewFromPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (/^\/products\/[^/]+$/i.test(path) || /^\/produk\/[^/]+$/i.test(path)) return "productDetail";
  if (/^\/stores\/[^/]+$/i.test(path) || /^\/toko\/[^/]+$/i.test(path)) return "storeDetail";
  if (path === "/search") return "search";
  if (path === "/login") return "login";
  if (path === "/register") return "register";
  if (path === "/profil") return "profile";
  if (path === "/alamat") return "addresses";
  if (path === "/pesanan-saya") return "orders";
  if (path === "/wishlist") return "wishlist";
  if (path === "/keranjang") return "cart";
  if (path === "/pembayaran") return "payment";
  if (path === "/admin/dashboard") return "adminDashboard";
  if (path === "/seller/dashboard") return "sellerDashboard";
  if (path === "/kebijakan-privasi") return "privacy";
  if (path === "/syarat-ketentuan") return "terms";
if (path === "/tentang-kami" || path === "/about") return "about";
  if (path === "/faq" || path === "/pertanyaan-umum") return "faq";
  if (path === "/kontak" || path === "/contact") return "contact";

  if (path === "/kategori") return "categories";
  if (path === "/semua-voucher" || path === "/voucher") return "vouchers";
  if (/^\/(?:kategori|category)\/[^/]+$/i.test(path)) return "categoryProducts";
  return "home";
}

function getProductIdFromPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const match = path.match(/^\/(?:products|produk)\/([^/]+)$/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function getStoreIdFromPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const match = path.match(/^\/(?:stores|toko)\/([^/]+)$/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function getSearchQueryFromUrl() {
  return new URLSearchParams(window.location.search).get("q")?.trim() || "";
}

function getCategoryIdFromPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const match = path.match(/^\/(?:kategori|category)\/([^/]+)$/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function getCategoryNameFromUrl() {
  return new URLSearchParams(window.location.search).get("name")?.trim() || "";
}

function normalizeSearchResults(raw) {
  const source = raw?.data || raw?.result || raw?.payload || raw || {};
  const productsSource = Array.isArray(source.products) ? source.products : [];
  const storesSource = Array.isArray(source.stores) ? source.stores : [];
  const recipesSource = Array.isArray(source.recipes) ? source.recipes : [];

  return {
    products: productsSource
      .map((item, index) => ({
        id: item.id ?? item.uuid ?? item.product_id ?? item.productId ?? `search-product-${index + 1}`,
        productId: item.product_id ?? item.productId ?? item.id ?? item.uuid,
        storeId: pickStoreId(item),
        title: item.name || item.title || item.product_name || item.nama_produk || "Produk",
        price: formatStorefrontPrice(item.price ?? item.harga ?? item.selling_price ?? item.sale_price ?? 0),
        priceValue: parseRupiah(item.price ?? item.harga ?? item.selling_price ?? item.sale_price ?? 0),
        badge: Number(item.stock) > 0 ? `${item.stock} stok` : "Produk",
        img: resolveProductImage(item) || PRODUCT_DETAIL_PLACEHOLDER,
        bg: item.bg || PRODUCT_BG_COLORS[index % PRODUCT_BG_COLORS.length],
      }))
      .filter((item) => item.title),
    stores: storesSource
      .map((item, index) => ({
        id: item.id ?? item.uuid ?? item.store_id ?? item.storeId ?? `search-store-${index + 1}`,
        storeId: item.store_id ?? item.storeId ?? item.id ?? item.uuid,
        name: item.store_name || item.storeName || item.name || item.shop_name || "Toko",
        logo: resolveApiUrl(item.logo || item.logo_url || item.logoUrl || item.avatar || item.photo) || STORE_AVATAR_PLACEHOLDER,
        rating: Number(item.average_rating ?? item.rating ?? item.averageRating ?? 0) || 0,
      }))
      .filter((item) => item.name),
    recipes: recipesSource
      .map((item, index) => ({
        id: item.id ?? item.uuid ?? `search-recipe-${index + 1}`,
        title: item.title || item.name || "Recipe",
        description: item.description || item.desc || "",
        img: resolveApiUrl(item.image || item.img || item.thumbnail) || PRODUCT_DETAIL_PLACEHOLDER,
      }))
      .filter((item) => item.title),
  };
}

/* ---------------------------- Sub-components ---------------------------- */

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
      .then((data) => {
        if (!controller.signal.aborted) setResults(normalizeSearchResults(data));
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
  const hasProducts = results.products.length > 0;
  const hasRecipes = results.recipes.length > 0;
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
              Result for: <span style={styles.searchQueryBox} className="bk-search-query-box">{displayQuery}</span>
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
              {results.products.map((product, index) => (
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

        {!isLoading && !error && hasRecipes && (
          <section style={styles.searchRecipesSection}>
            <div style={styles.searchSectionInner} className="bk-search-section-inner">
              <div style={styles.relatedTitleRow}>
                <Sparkles size={29} strokeWidth={2.4} color="#d7ad00" />
                <h2 style={styles.relatedTitle}>Inspirasi recipe</h2>
              </div>
              <div style={styles.searchRecipeGrid} className="bk-search-recipe-grid">
                {results.recipes.map((recipe, index) => (
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

function LegalPage({ page, view, scrolled, cartCount, wishCount, showToast, navigateTo, onSearch, toast, authUser, onLogout }) {
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

      <main style={styles.legalMain}>
        <section style={styles.legalHero}>
          <h1 style={styles.legalTitle}>{page.title}</h1>
          <p style={styles.legalUpdated}>Terakhir diperbarui: {page.updated}</p>
          {page.introDecor && <LegalWave />}
        </section>

        <article style={{ ...styles.legalArticle, ...(view === "terms" ? styles.legalArticleNarrow : {}) }}>
          {page.sections.map((section, index) => (
            <section key={section.title} style={styles.legalSection}>
              <h2 style={styles.legalSectionTitle}>{index + 1}. {section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} style={styles.legalParagraph}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul style={styles.legalList}>
                  {section.bullets.map((item) => (
                    <li key={item} style={styles.legalListItem}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {view === "terms" && (
            <div style={styles.legalActionRow}>
              <PillButton variant="solid" onClick={() => navigateTo("home")} style={styles.legalBackButton}>
                Kembali ke Beranda
              </PillButton>
            </div>
          )}
        </article>
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

const ABOUT_STATS = [
  { value: "2.400+", label: "Pengrajin Teregistrasi" },
  { value: "12.000+", label: "Karya Unik" },
  { value: "34", label: "Provinsi Terjangkau" },
  { value: "4.9/5", label: "Rating Kepuasan" },
];

const ABOUT_VALUES = [
  {
    icon: HandHeart,
    title: "Asli Buatan Tangan",
    text: "Setiap produk dikerjakan langsung oleh pengrajin berpengalaman dengan teknik tradisional yang diwariskan turun-temurun.",
  },
  {
    icon: Leaf,
    title: "Berkelanjutan",
    text: "Kami memilih bahan ramah lingkungan dan mendukung praktik produksi yang adil bagi setiap komunitas pengrajin.",
  },
  {
    icon: PencilLine,
    title: "Kriya Kontemporer",
    text: "Kami memadukan warisan budaya dengan sentuhan desain modern agar setiap karya relevan untuk gaya hidup masa kini.",
  },
];

function AboutPage({ scrolled, cartCount, wishCount, showToast, navigateTo, onSearch, toast, authUser, onLogout }) {
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

      <main style={styles.aboutMain}>
        <section style={styles.aboutHero}>
          <Reveal>
            <span style={styles.aboutEyebrow}>TENTANG KAMI</span>
            <h1 style={styles.aboutTitle}>Setiap karya adalah cerita berharga</h1>
            <p style={styles.aboutLead}>
              BumiKriya menghubungkan pengrajin Indonesia dengan pecinta karya tangan. Dari batik hingga keramik,
              kami merayakan keindahan kerajinan yang dibuat sepenuh hati.
            </p>
          </Reveal>
          <LegalWave />
        </section>

        <section style={styles.aboutStory}>
          <Reveal>
            <h2 style={styles.aboutSectionTitle}>Cerita Kami</h2>
            <div style={styles.aboutStoryBody}>
              <p style={styles.aboutParagraph}>
                BumiKriya dimulai dari kecintaan terhadap kerajinan tangan dan kekayaan budaya Nusantara. Kami percaya
                bahwa di balik setiap gelang manik, mug keramik, atau anyaman rumit, terdapat tangan-tangan terampil,
                waktu, dan cinta yang dituangkan ke dalam setiap detail.
              </p>
              <p style={styles.aboutParagraph}>
                Misi kami adalah memberdayakan pengrajin lokal dengan memberikan akses pasar yang lebih luas, harga yang
                adil, serta pengakuan atas keahlian mereka. Bagi para pelanggan, kami menghadirkan karya autentik yang
                bukan sekadar barang, melainkan pengalaman dan cerita.
              </p>
            </div>
          </Reveal>
        </section>

        <section style={styles.aboutValues}>
          <Reveal>
            <h2 style={styles.aboutSectionTitle}>Nilai yang Kami Pegang</h2>
          </Reveal>
          <div style={styles.aboutValuesGrid}>
            {ABOUT_VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={i * 0.12}>
                  <div style={styles.aboutValueCard}>
                    {v.icon && (
                      <span style={styles.aboutValueIcon}><Icon size={26} strokeWidth={2} /></span>
                    )}
                    <h3 style={styles.aboutValueTitle}>{v.title}</h3>
                    <p style={styles.aboutValueText}>{v.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section style={styles.aboutStats}>
          {ABOUT_STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <div style={styles.aboutStat}>
                <span style={styles.aboutStatValue}>{s.value}</span>
                <span style={styles.aboutStatLabel}>{s.label}</span>
              </div>
            </Reveal>
          ))}
        </section>

        <section style={styles.aboutCta}>
          <Reveal>
            <h2 style={styles.aboutCtaTitle}>Mari berkenalan lebih dekat</h2>
            <p style={styles.aboutCtaText}>Jelajahi karya-karya kriya pilihan dari para pengrajin terbaik Indonesia.</p>
            <PillButton variant="solid" onClick={() => navigateTo("home")} style={styles.legalBackButton}>
              Jelajahi Karya
            </PillButton>
          </Reveal>
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

const FAQ_ITEMS = [
  {
    q: "Bagaimana cara melakukan pemesanan di BumiKriya?",
    a: "Pilih produk yang kamu suka, tentukan jumlah, lalu klik “Tambah ke Keranjang”. Setelah selesai belanja, buka halaman keranjang, pilih alamat pengiriman, lalu selesaikan pembayaran. Konfirmasi pesananmu akan muncul di halaman “Pesanan Saya”.",
  },
  {
    q: "Metode pembayaran apa saja yang tersedia?",
    a: "Kami mendukung berbagai metode pembayaran, termasuk transfer bank, e-wallet, hingga pembayaran melalui Midtrans. Kamu bisa memilih metode yang paling nyaman saat checkout.",
  },
  {
    q: "Berapa lama proses pengiriman?",
    a: "Waktu pengiriman bergantung pada lokasi pengrajin dan alamat tujuanmu, umumnya antara 2–7 hari kerja. Estimasi waktu pengiriman akan ditampilkan saat kamu memilih alamat pengiriman.",
  },
  {
    q: "Bagaimana jika produk yang diterima rusak atau tidak sesuai?",
    a: "Kami bangga dengan setiap karya pengrajin. Jika produk yang kamu terima rusak saat pengiriman atau tidak sesuai dengan deskripsi, segera hubungi tim dukungan dalam 48 jam setelah barang diterima dan lampirkan foto. Kami akan membantu proses pengembalian atau penggantian.",
  },
  {
    q: "Bisakah saya membatalkan pesanan?",
    a: "Pembatalan dapat dilakukan selama pesanan belum dikirim oleh pengrajin. Silakan buka halaman “Pesanan Saya” dan pilih tombol batalkan, atau hubungi tim dukungan kami untuk bantuan lebih lanjut.",
  },
  {
    q: "Bagaimana cara melacak pesanan saya?",
    a: "Kamu dapat melacak pesanan melalui halaman “Pesanan Saya”. Setiap perubahan status—dari proses pembuatan hingga barang diterima—akan selalu diperbarui secara otomatis di sana.",
  },
  {
    q: "Apakah saya bisa menjual karya saya di BumiKriya?",
    a: "Tentu saja! Daftarkan akun sebagai penjual melalui halaman pendaftaran, lengkapi profil toko, lalu unggah produk-produk karyamu. Tim kami akan memoderasi agar kualitas dan keasliannya tetap terjaga.",
  },
  {
    q: "Bagaimana cara menghubungi tim dukungan BumiKriya?",
    a: "Kamu bisa mengirim pesan melalui halaman Kontak, atau menghubungi kami lewat email bumikriya2@gmail.com dan WhatsApp +62 812 8555 4702 pada jam kerja Senin–Jumat pukul 09.00–17.00 WIB.",
  },
];

function FaqPage({ scrolled, cartCount, wishCount, showToast, navigateTo, onSearch, toast, authUser, onLogout }) {
  const [openIndex, setOpenIndex] = useState(0);
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

      <main style={styles.faqMain}>
        <section style={styles.faqHero}>
          <Reveal>
            <span style={styles.faqEyebrow}>
              <HelpCircle size={14} strokeWidth={2.6} />
              PUSAT BANTUAN
            </span>
            <h1 style={styles.faqTitle}>Pertanyaan yang sering diajukan</h1>
            <p style={styles.faqLead}>
              Temukan jawaban seputar pemesanan, pembayaran, pengiriman, dan hal lain yang perlu kamu ketahui.
            </p>
          </Reveal>
          <LegalWave />
        </section>

        <section style={styles.faqList}>
          {FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            return (
              <Reveal key={item.q} delay={Math.min(index * 0.05, 0.25)}>
                <div style={styles.faqItem} className="bk-faq-item">
                  <button
                    type="button"
                    style={styles.faqButton}
                    className="bk-faq-button"
                    aria-expanded={open}
                    onClick={() => setOpenIndex(open ? -1 : index)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown size={20} strokeWidth={2.5} style={open ? { ...styles.faqCaret, transform: "rotate(180deg)" } : styles.faqCaret} />
                  </button>
                  {open && <div style={styles.faqAnswer}>{item.a}</div>}
                </div>
              </Reveal>
            );
          })}
        </section>

        <section style={styles.faqCta}>
          <Reveal>
            <h2 style={styles.faqCtaTitle}>Masih belum menemukan jawabannya?</h2>
            <p style={styles.faqCtaText}>Tim dukungan kami siap membantu kamu setiap hari pada jam kerja.</p>
            <div style={styles.faqCtaActions}>
              <PillButton variant="solid" onClick={() => navigateTo("contact")} style={styles.legalBackButton}>
                Hubungi Kami
              </PillButton>
            </div>
          </Reveal>
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

const CONTACT_CHANNELS = [
  { icon: Mail, title: "Email", value: "bumikriya2@gmail.com", note: "Balasan dalam 1x24 jam kerja" },
  { icon: Phone, title: "Telepon / WhatsApp", value: "+62 812 8555 4702", note: "Senin–Jumat, 09.00–17.00 WIB" },
  { icon: MapPin, title: "Alamat", value: "Jl. Kamarung, Citerep", note: "Cimahi, Indonesia" },
  { icon: Clock, title: "Jam Operasional", value: "Senin–Sabtu", note: "09.00–18.00 WIB" },
];

function ContactPage({ scrolled, cartCount, wishCount, showToast, navigateTo, onSearch, toast, authUser, onLogout }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const updateField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const handleSubmit = (event) => {
    event.preventDefault();
    setForm({ name: "", email: "", subject: "", message: "" });
    showToast("Pesan kamu terkirim. Tim kami akan segera menghubungimu.");
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

      <main style={styles.contactMain}>
        <section style={styles.contactHero}>
          <Reveal>
            <span style={styles.contactEyebrow}>
              <MessageCircle size={14} strokeWidth={2.6} />
              HUBUNGI KAMI
            </span>
            <h1 style={styles.contactTitle}>Kami siap membantu kamu</h1>
            <p style={styles.contactLead}>
              Punya pertanyaan atau butuh bantuan? Kirimkan pesanmu dan tim BumiKriya akan membalas secepatnya.
            </p>
          </Reveal>
          <LegalWave />
        </section>

        <section style={styles.contactWrap}>
          <div style={styles.contactGrid} className="bk-contact-grid">
            <Reveal>
              <div style={styles.contactCard}>
                <h2 style={styles.contactCardTitle}>Informasi Kontak</h2>
                {CONTACT_CHANNELS.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <div key={channel.title} style={styles.contactInfoItem}>
                      <span style={styles.contactInfoIcon}><Icon size={20} strokeWidth={2.2} /></span>
                      <div>
                        <strong style={styles.contactInfoTitle}>{channel.title}</strong>
                        <span style={styles.contactInfoValue}>{channel.value}</span>
                        <span style={styles.contactInfoNote}>{channel.note}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <form style={styles.contactForm} onSubmit={handleSubmit}>
                <h2 style={styles.contactFormTitle}>Kirim Pesan</h2>

                <div style={styles.contactFormRow} className="bk-contact-form-row">
                  <label style={styles.contactLabel}>
                    Nama
                    <input
                      style={styles.contactInput}
                      className="bk-contact-input"
                      value={form.name}
                      onChange={updateField("name")}
                      placeholder="Nama lengkap kamu"
                      required
                    />
                  </label>
                  <label style={styles.contactLabel}>
                    Email
                    <input
                      type="email"
                      style={styles.contactInput}
                      className="bk-contact-input"
                      value={form.email}
                      onChange={updateField("email")}
                      placeholder="nama@contoh.com"
                      required
                    />
                  </label>
                </div>

                <label style={styles.contactLabel}>
                  Subjek
                  <input
                    style={styles.contactInput}
                    className="bk-contact-input"
                    value={form.subject}
                    onChange={updateField("subject")}
                    placeholder="Apa yang bisa kami bantu?"
                    required
                  />
                </label>

                <label style={styles.contactLabel}>
                  Pesan
                  <textarea
                    style={styles.contactTextarea}
                    className="bk-contact-textarea"
                    value={form.message}
                    onChange={updateField("message")}
                    placeholder="Tulis pesan kamu di sini..."
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="bk-pill"
                  style={{ ...styles.pillBase, ...styles.pillSolid, ...styles.contactSubmit }}
                >
                  <Send size={17} strokeWidth={2.4} />
                  Kirim Pesan
                </button>
              </form>
            </Reveal>
          </div>
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

const BLOG_CATEGORIES = ["Semua", "Kriya", "Tutorial", "Cerita Pengrajin", "Gaya Hidup"];

const BLOG_POSTS = [
  {
    id: "menjaga-warna-batik-agar-tahan-lama",
    title: "Menjaga Warna Batik agar Tetap Cerah dan Awet",
    excerpt:
      "Batik bukan sekadar kain—ia adalah cerita yang tertulis dengan lilin dan pewarna. Berikut cara merawat batik kesayangan agar warnanya tetap indah untuk generasi berikutnya.",
    category: "Tutorial",
    author: "Ayu Puspita",
    date: "12 Agustus 2026",
    readTime: "5 menit",
    img: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=900&auto=format&fit=crop",
    bg: "#f3e0ce",
    tags: ["Batik", "Perawatan", "Tekstil"],
    featured: true,
  },
  {
    id: "tangan-di-balik-anyaman-bambu-sukabumi",
    title: "Tangan di Balik Anyaman Bambu Sukabumi",
    excerpt:
      "Mengenal Pak Jumadi, pengrajin anyaman generasi ketiga yang menjaga teknik nenek moyangnya tetap hidup di tengah zaman yang serba cepat.",
    category: "Cerita Pengrajin",
    author: "Rafi Ardiansyah",
    date: "5 Agustus 2026",
    readTime: "7 menit",
    img: "https://images.unsplash.com/photo-1590919001625-90fbdc27142f?q=80&w=900&auto=format&fit=crop",
    bg: "#e7efea",
    tags: ["Bambu", "Anyaman", "Pengrajin"],
    featured: false,
  },
  {
    id: "5-tips-memilih-keramik-artisanal",
    title: "5 Tips Memilih Keramik Artisanal untuk Rumahmu",
    excerpt:
      "Keramik buatan tangan punya karakter yang tidak bisa ditiru mesin. Yuk simak panduan singkat untuk menemukan keramik yang paling cocok dengan hunianmu.",
    category: "Gaya Hidup",
    author: "Nina Sari",
    date: "28 Juli 2026",
    readTime: "4 menit",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=900&auto=format&fit=crop",
    bg: "#eee4f0",
    tags: ["Keramik", "Dekorasi", "Tips"],
    featured: false,
  },
  {
    id: "menenun-dari-benang-menjadi-cerita",
    title: "Menenun: Dari Benang Menjadi Cerita",
    excerpt:
      "Proses menenun melibatkan kesabaran, ritme, dan sedikit keajaiban. Kami mengajakmu menyelami perjalanan seutas benang menjadi sehelai kain penuh makna.",
    category: "Kriya",
    author: "Ayu Puspita",
    date: "18 Juli 2026",
    readTime: "6 menit",
    img: "https://images.unsplash.com/photo-1580902025101-2d9eeb30360e?q=80&w=900&auto=format&fit=crop",
    bg: "#fdeee2",
    tags: ["Tenun", "Benang", "Kain"],
    featured: false,
  },
  {
    id: "panduan-menyimpan-perhiasan-manik",
    title: "Panduan Menyimpan Perhiasan Manik agar Tidak Kusam",
    excerpt:
      "Perhiasan manik-manik buatan tangan butuh perhatian khusus. Simak cara penyimpanan yang benar supaya warnanya tetap memikat setiap kali dipakai.",
    category: "Tutorial",
    author: "Rafi Ardiansyah",
    date: "10 Juli 2026",
    readTime: "3 menit",
    img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=900&auto=format&fit=crop",
    bg: "#f7e8ef",
    tags: ["Manik", "Perhiasan", "Perawatan"],
    featured: false,
  },
  {
    id: "gaya-hidup-slow-living-bersama-karya-kriya",
    title: "Slow Living bersama Karya Kriya Nusantara",
    excerpt:
      "Hidup pelan bukan berarti berhenti. Lewat karya kriya, kita belajar menikmati proses, menghargai detail, dan hidup lebih selaras dengan alam.",
    category: "Gaya Hidup",
    author: "Nina Sari",
    date: "2 Juli 2026",
    readTime: "8 menit",
    img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=900&auto=format&fit=crop",
    bg: "#e8edf2",
    tags: ["Slow Living", "Kriya", "Gaya Hidup"],
    featured: false,
  },
];

function BlogPage({ scrolled, cartCount, wishCount, showToast, navigateTo, onSearch, toast, authUser, onLogout }) {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [email, setEmail] = useState("");
  const visiblePosts = BLOG_POSTS.filter(
    (post) => activeCategory === "Semua" || post.category === activeCategory
  );

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (!email.trim()) {
      showToast("Masukkan email kamu dulu ya");
      return;
    }
    setEmail("");
    showToast("Berhasil berlangganan! Cek email kamu untuk konfirmasi.");
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

      <main style={styles.blogMain}>
        <section style={styles.blogHero}>
          <Reveal>
            <span style={styles.blogEyebrow}>
              <BookOpen size={14} strokeWidth={2.6} />
              BLOG BUMIKRIYA
            </span>
            <h1 style={styles.blogTitle}>Cerita, kriya, dan inspirasi</h1>
            <p style={styles.blogLead}>
              Temukan kisah para pengrajin, panduan merawat karya tangan, dan inspirasi menghadirkan kriya Nusantara ke dalam keseharianmu.
            </p>
          </Reveal>
          <LegalWave />
        </section>

        <section style={styles.blogCategories}>
          {BLOG_CATEGORIES.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                className="bk-pill"
                onClick={() => setActiveCategory(category)}
                style={{
                  ...styles.pillBase,
                  ...(active ? styles.pillSolid : styles.pillOutline),
                  ...styles.blogCategoryChip,
                }}
              >
                {category}
              </button>
            );
          })}
        </section>

        <section style={styles.blogList}>
          {visiblePosts.map((post, index) => {
            const isFeatured = post.featured && visiblePosts.length === BLOG_POSTS.length;
            return (
              <Reveal key={post.id} delay={Math.min(index * 0.08, 0.3)}>
                <article
                  style={{
                    ...styles.blogCard,
                    ...(isFeatured ? styles.blogCardFeatured : {}),
                  }}
                  className="bk-blog-card"
                >
                  <div
                    style={{
                      ...styles.blogThumbWrap,
                      background: post.bg,
                      ...(isFeatured ? styles.blogThumbWrapFeatured : {}),
                    }}
                  >
                    <img
                      src={post.img}
                      alt={post.title}
                      loading="lazy"
                      style={styles.blogThumb}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    {isFeatured && (
                      <span style={styles.blogFeaturedBadge}>
                        <Sparkles size={13} strokeWidth={2.4} />
                        Unggulan
                      </span>
                    )}
                  </div>
                  <div style={styles.blogBody}>
                    <span style={styles.blogCategory}>{post.category}</span>
                    <h3 style={styles.blogCardTitle}>{post.title}</h3>
                    <p style={styles.blogExcerpt}>{post.excerpt}</p>
                    <div style={styles.blogMeta}>
                      <span style={styles.blogMetaItem}>
                        <User size={13} strokeWidth={2.3} />
                        {post.author}
                      </span>
                      <span style={styles.blogMetaItem}>
                        <CalendarDays size={13} strokeWidth={2.3} />
                        {post.date}
                      </span>
                      <span style={styles.blogMetaItem}>
                        <Clock size={13} strokeWidth={2.3} />
                        {post.readTime}
                      </span>
                    </div>
                    <div style={styles.blogTags}>
                      {post.tags.map((tag) => (
                        <span key={tag} style={styles.blogTag}>{tag}</span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="bk-footer-link"
                      style={styles.blogReadMore}
                      onClick={() => showToast(`Membaca artikel: ${post.title}`)}
                    >
                      Baca Selengkapnya
                      <ArrowRight size={15} strokeWidth={2.4} />
                    </button>
                  </div>
                </article>
              </Reveal>
            );
          })}

          {visiblePosts.length === 0 && (
            <div style={styles.storefrontEmpty}>
              <BookOpen size={24} strokeWidth={2.1} />
              <span>Belum ada artikel untuk kategori ini.</span>
            </div>
          )}
        </section>

        <section style={styles.blogCta}>
          <Reveal>
            <h2 style={styles.blogCtaTitle}>Kami masih menulis cerita baru</h2>
            <p style={styles.blogCtaText}>
              Berlangganan buletin BumiKriya untuk mendapat cerita pengrajin, tips kriya, dan koleksi terbaru langsung di emailmu.
            </p>
            <form style={styles.blogSubscribe} onSubmit={handleSubscribe}>
              <input
                type="email"
                style={styles.blogSubscribeInput}
                className="bk-contact-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@contoh.com"
                aria-label="Alamat email"
              />
              <button
                type="submit"
                className="bk-pill"
                style={{ ...styles.pillBase, ...styles.pillSolid, ...styles.blogSubscribeButton }}
              >
                <Send size={16} strokeWidth={2.4} />
                Langganan
              </button>
            </form>
          </Reveal>
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

function CategoryProductsPage({ categoryId, categoryName, scrolled, cartCount, wishCount, showToast, navigateTo, navigateToProduct, onBack, onSearch, toast, authUser, onLogout, onAdd, onLike, liked, addedId }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");
    fetchUserDashboard({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setProducts(normalizeCategoryProducts(data.products, categoryId, categoryName, data.categories));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Gagal memuat produk.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [categoryId, categoryName]);

  const title = categoryName || "Kategori";

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

function normalizeCategories(raw) {
  const payload = raw?.data || raw?.result || raw?.payload || raw || {};
  const source = Array.isArray(payload) ? payload : Array.isArray(payload?.categories) ? payload.categories : Array.isArray(payload?.category) ? payload.category : Array.isArray(payload?.list) ? payload.list : Array.isArray(payload?.items) ? payload.items : [];

  return source
    .map((item) => ({
      id: item.id ?? item.uuid ?? item.category_id ?? item.categoryId ?? item._id ?? null,
      name: item.name || item.title || item.category_name || item.kategori || "Kategori",
      description:
        item.description ||
        item.desc ||
        item.about ||
        item.category_description ||
        "",
      img:
        resolveApiUrl(item.img) ||
        resolveApiUrl(item.image) ||
        resolveApiUrl(item.image_url) ||
        resolveApiUrl(item.photo) ||
        resolveApiUrl(item.thumbnail) ||
        "",
      isActive: item.is_active !== false,
    }))
    .filter((item) => item.name && item.isActive);
}

function pickCategoryFields(item) {
  const cat = typeof item.category === "object" && item.category ? item.category : {};
  return {
    id:
      item.category_id ??
      item.categoryId ??
      item.product_category_id ??
      item.productCategoryId ??
      cat.id ??
      cat.uuid ??
      cat.category_id ??
      cat.categoryId ??
      cat._id ??
      "",
    names: [
      item.category_name,
      item.categoryName,
      item.nama_kategori,
      item.kategori,
      item.category_label,
      item.badge,
      typeof item.category === "string" ? item.category : "",
      cat.name,
      cat.title,
      cat.category_name,
      cat.categoryName,
      cat.nama_kategori,
    ].filter((value) => typeof value === "string" && value.trim() !== ""),
  };
}

function slugifyCategory(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function productMatchesCategory(item, categoryId, categoryName) {
  const fields = pickCategoryFields(item);
  const id = String(categoryId || "").trim().toLowerCase();
  if (id) {
    const rawId = String(fields.id ?? "").trim().toLowerCase();
    if (rawId === id) return true;
  }
  const needle = String(categoryName || "").trim().toLowerCase();
  if (needle) {
    return fields.names.some((name) => String(name).trim().toLowerCase() === needle);
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
  const source = Array.isArray(rawProducts)
    ? rawProducts
    : rawProducts?.products || rawProducts?.items || rawProducts?.list || rawProducts?.data || [];

  const resolved = resolveCategoryMatch(categories, categoryId, categoryName);
  const resolvedId = resolved.id || String(categoryId || "").trim();
  const resolvedName = resolved.name || categoryName || "";

  return source
    .filter((item) => productMatchesCategory(item, resolvedId, resolvedName))
    .map((item, index) => ({
      id: item.id ?? item.uuid ?? item.product_id ?? item.productId ?? item._id ?? `product-${index + 1}`,
      storeId: pickStoreId(item),
      title: item.title || item.name || item.product_name || item.nama_produk || "Produk",
      price: formatStorefrontPrice(
        item.price ?? item.harga ?? item.selling_price ?? item.sale_price ?? item.price_value
      ),
      badge:
        item.badge ||
        item.category_name ||
        item.kategori ||
        (typeof item.category === "string" ? item.category : item.category?.name) ||
        "Kriya",
      img: resolveProductImage(item),
      bg: item.bg || PRODUCT_BG_COLORS[index % PRODUCT_BG_COLORS.length],
    }))
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

function softenAccent(color) {
  if (color === "#f0cc43") return "rgba(240, 204, 67, 0.42)";
  if (color === "#30a6d6") return "rgba(48, 166, 214, 0.26)";
  return "rgba(248, 117, 176, 0.25)";
}

const USER_NAME_KEYS = [
  "name",
  "full_name",
  "fullName",
  "fullname",
  "display_name",
  "displayName",
  "username",
  "nama",
  "nama_lengkap",
  "customer_name",
  "user_name",
  "first_name",
  "firstName",
  "real_name",
  "nickname",
];

const USER_EMAIL_KEYS = ["email", "mail", "email_address", "alamat_email"];
const USER_PHONE_KEYS = ["phone", "phone_number", "phoneNumber", "nomor_telepon", "telephone", "telp", "mobile"];
const USER_AVATAR_KEYS = ["avatar", "avatar_url", "avatarUrl", "photo", "photo_url", "image", "profile_picture", "photoprofil"];

function deepPick(user, keys, depth = 0, seen = new WeakSet()) {
  if (!user || typeof user !== "object" || depth > 8 || seen.has(user)) return "";
  seen.add(user);

  for (const key of keys) {
    const value = user[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  for (const value of Object.values(user)) {
    if (value && typeof value === "object") {
      const found = deepPick(value, keys, depth + 1, seen);
      if (found) return found;
    }
  }

  return "";
}

function pickDisplayName(user) {
  return deepPick(user, USER_NAME_KEYS);
}

function pickEmail(user) {
  return deepPick(user, USER_EMAIL_KEYS);
}

function pickPhone(user) {
  return deepPick(user, USER_PHONE_KEYS);
}

function buildProfilePhoneUpdatePayload(phone) {
  return USER_PHONE_KEYS.reduce((payload, key) => {
    payload[key] = phone;
    return payload;
  }, {});
}

function pickAvatar(user) {
  return resolveApiUrl(deepPick(user, USER_AVATAR_KEYS));
}

const NAME_CHANGE_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const NAME_CHANGE_STORAGE_PREFIX = "bk:name_changed_at:";

function getNameChangeStorageKey(profile) {
  const id = profile?.raw?.id || profile?.id || profile?.email || "guest";
  return `${NAME_CHANGE_STORAGE_PREFIX}${id}`;
}

function getLastNameChangeAt(profile) {
  try {
    const saved = Number(localStorage.getItem(getNameChangeStorageKey(profile)) || 0);
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
}

function recordNameChange(profile) {
  try {
    localStorage.setItem(getNameChangeStorageKey(profile), String(Date.now()));
  } catch {
    /* abaikan error penyimpanan */
  }
}

function getNameChangeCooldown(lastChangedAt) {
  if (!lastChangedAt) {
    return { locked: false, changedAt: 0, eligibleAt: 0, remainingMs: 0 };
  }
  const eligibleAt = lastChangedAt + NAME_CHANGE_COOLDOWN_MS;
  const remainingMs = Math.max(0, eligibleAt - Date.now());
  return { locked: remainingMs > 0, changedAt: lastChangedAt, eligibleAt, remainingMs };
}

function formatDurationRemaining(ms) {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_MINUTE = 60 * 1000;
  const days = Math.floor(ms / ONE_DAY);
  const hours = Math.floor((ms % ONE_DAY) / ONE_HOUR);
  const minutes = Math.floor((ms % ONE_HOUR) / ONE_MINUTE);
  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

function formatChangedAtLabel(dateMs) {
  if (!dateMs) return "";
  try {
    return new Date(dateMs).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function unwrapUserProfile(data) {
  if (!data || typeof data !== "object") return {};

  const candidates = [
    data.user,
    data.profile,
    data.data?.user,
    data.data?.profile,
    data.data?.data?.user,
    data.data?.data?.profile,
    data.result?.user,
    data.result?.profile,
    data.payload?.user,
    data.payload?.profile,
    data.data,
    data.result,
    data.payload,
    data,
  ];

  return candidates.find((candidate) => candidate && typeof candidate === "object") || {};
}

function normalizeProfile(raw, fallbackUser = {}) {
  const profile = unwrapUserProfile(raw);
  const merged = { ...(fallbackUser || {}), ...(profile || {}) };
  return {
    raw: merged,
    name: pickDisplayName(merged) || pickEmail(merged).split("@")[0] || "Pengguna",
    email: pickEmail(merged),
    phone: pickPhone(merged),
    avatar: pickAvatar(merged),
    membership: normalizeMembership(merged.membership || merged),
    orders: normalizeProfileOrders(merged.orders || merged.recent_orders || merged.latest_orders || []),
  };
}

function getProfileInitials(name) {
  const words = String(name || "P")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (words[0]?.[0] || "P").toUpperCase() + (words[1]?.[0] || "").toUpperCase();
}

function normalizeMembership(source = {}) {
  const level =
    source.current_level ||
    source.currentLevel ||
    source.member_type ||
    source.memberType ||
source.membership ||
    source.level ||
    "Bronze Member";
  const nextLevel = source.next_level || source.nextLevel || "";
  const rawProgress = clampPercent(
    source.progress_percentage ??
      source.progressPercentage ??
      source.progress ??
      source.percentage ??
      0
  );
  const remainingAmount =
    Number(source.remaining_amount ?? source.remainingAmount ?? source.amount_to_next_level ?? source.amountToNextLevel ?? 0) || 0;

  /* Level otomatis naik ketika progres sudah mencapai 100% dan masih ada
     level berikutnya. Backend seharusnya juga memperbarui level & reward,
     tapi frontend tetap menampilkan status yang benar. */
  const levelUpReached = nextLevel && rawProgress >= 100;
  const effectiveLevel = levelUpReached ? nextLevel : level;

  const benefits = Array.isArray(source.benefits) && source.benefits.length
    ? source.benefits.filter(Boolean).map(String)
    : getDefaultMemberBenefits(effectiveLevel, source.discount_percentage ?? source.discountPercentage);

  return {
    level: formatMemberLevel(effectiveLevel),
    nextLevel: nextLevel ? formatMemberLevel(nextLevel) : "",
    progress: rawProgress,
    progressText:
      source.progress_text ||
      source.progressText ||
      (levelUpReached && nextLevel
        ? `Selamat! Kamu sekarang menjadi ${formatMemberLevel(nextLevel)}`
        : nextLevel
          ? `Belanja ${formatRupiah(remainingAmount)} lagi untuk menjadi ${formatMemberLevel(nextLevel)}`
          : "Level tertinggi telah tercapai"),
    reward: normalizeMembershipReward(source),
    benefits,
  };
}

function normalizeMembershipReward(source = {}) {
  const candidate =
    source.reward_voucher ??
    source.rewardVoucher ??
    source.pending_reward ??
    source.pendingReward ??
    source.levelup_reward ??
    source.levelUpReward ??
    null;
  if (!candidate || typeof candidate !== "object") return null;

  const code =
    candidate.code ||
    candidate.voucher_code ||
    candidate.voucherCode ||
    candidate.promo_code ||
    candidate.name ||
    candidate.title ||
    "";
  if (!code) return null;

  const discountValue = pickVoucherNumber(candidate, [
    "discount_value", "discountValue", "amount", "discount_amount", "discountAmount", "nominal", "value",
  ]);
  const percent = pickVoucherNumber(candidate, [
    "discount_percent", "discountPercentage", "percentage", "percent", "percentage_value",
  ]);
  const minPurchase = pickVoucherNumber(candidate, [
    "min_purchase", "minPurchase", "minimum_purchase", "minimumPurchase", "min_order", "minOrder", "minimum_amount",
  ]);

  return {
    code: String(code).trim().toUpperCase(),
    title: candidate.title || candidate.name || `Voucher Hadiah Keanggotaan`,
    description: candidate.description || candidate.deskripsi || candidate.label || "",
    discountLabel: percent
      ? `Diskon ${formatDiscountPercent(percent)}%`
      : discountValue
        ? `Diskon ${formatRupiah(discountValue)}`
        : "",
    minPurchaseLabel: minPurchase ? `Min. belanja ${formatRupiah(minPurchase)}` : "",
    expiresAt: candidate.expires_at || candidate.expiresAt || candidate.valid_until || candidate.validUntil || candidate.end_date || candidate.endDate || "",
    displayEndsAt: formatVoucherDate(candidate.expires_at || candidate.expiresAt || candidate.valid_until || candidate.validUntil || candidate.end_date || candidate.endDate),
  };
}

function normalizeProfileOrders(rawOrders) {
  const orders = Array.isArray(rawOrders) ? rawOrders : [];
  return orders
    .map((order, index) => {
      const product = order.product || order.items?.[0]?.product || order.items?.[0] || {};
      const createdAt = order.created_at || order.createdAt || null;
      const statusSource = order.status;
      const status =
        typeof statusSource === "object"
          ? statusSource.label || statusSource.code
          : statusSource || order.status_code || order.statusCode || "Diproses";
      const statusCode =
        order.status_code ||
        order.statusCode ||
        (typeof statusSource === "object" ? statusSource.code : statusSource) ||
        "";

      return {
        id: order.id ?? order.order_id ?? order.orderId ?? order.order_number ?? order.orderNumber ?? `order-${index + 1}`,
        orderNumber: order.order_number || order.orderNumber || order.order_id || order.orderId || order.id || `ORD-${index + 1}`,
        title: product.name || product.product_name || order.product_name || order.productName || order.title || "Produk",
        priceValue: Number(order.price ?? order.total_amount ?? order.totalAmount ?? order.total ?? order.amount ?? product.price ?? 0) || 0,
        status: formatOrderStatus(status),
        statusCode: String(statusCode || "").toLowerCase(),
        action: order.action || getProfileOrderAction(statusCode || status),
        image: resolveProductImage(product) || resolveProductImage(order),
        createdAt,
      };
    })
    .sort((a, b) => {
      const timeA = a.createdAt ? Date.parse(a.createdAt) : 0;
      const timeB = b.createdAt ? Date.parse(b.createdAt) : 0;
      return timeB - timeA;
    });
}

function extractProfileOrderRows(response) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.payload,
    response?.orders,
    response?.items,
    response?.data?.orders,
    response?.data?.items,
    response?.data?.data,
    response?.result?.orders,
    response?.result?.items,
    response?.payload?.orders,
    response?.payload?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function extractBuyerOrderRows(response) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.payload,
    response?.orders,
    response?.items,
    response?.data?.orders,
    response?.data?.items,
    response?.data?.data,
    response?.result?.orders,
    response?.result?.items,
    response?.payload?.orders,
    response?.payload?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function unwrapBuyerOrderDetail(response) {
  if (!response || typeof response !== "object") return {};

  const candidates = [
    response.order,
    response.data?.order,
    response.result?.order,
    response.payload?.order,
    response.data?.data?.order,
    response.data,
    response.result,
    response.payload,
    response,
  ];

  return candidates.find((candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate)) || {};
}

function normalizeBuyerOrders(response) {
  return extractBuyerOrderRows(response)
    .map((order, index) => normalizeBuyerOrder(order, index))
    .sort((a, b) => {
      const timeA = a.createdAt ? Date.parse(a.createdAt) : 0;
      const timeB = b.createdAt ? Date.parse(b.createdAt) : 0;
      return timeB - timeA;
    });
}

function normalizeBuyerOrder(order, index = 0, fallback = {}) {
  const source = order && typeof order === "object" ? order : {};
  const merged = { ...(fallback.raw || fallback || {}), ...source };
  const id =
    merged.id ??
    merged.uuid ??
    merged.order_id ??
    merged.orderId ??
    merged.order_number ??
    merged.orderNumber ??
    fallback.id ??
    `order-${index + 1}`;
  const statusSource =
    merged.status_code ??
    merged.statusCode ??
    merged.order_status ??
    merged.orderStatus ??
    merged.status ??
    merged.payment_status ??
    merged.paymentStatus ??
    merged.payment?.transaction_status ??
    merged.payment?.status ??
    merged.payment?.status_code ??
    fallback.statusCode ??
    "";
  const paymentTransactionStatus =
    merged.payment?.transaction_status ??
    merged.payment?.status ??
    merged.payment?.status_code ??
    "";
  const paidAt = getBuyerOrderPaidAt(merged, fallback);
  const category = getBuyerOrderCategory(statusSource, paymentTransactionStatus, paidAt);
  const items = extractBuyerOrderItems(merged, fallback).map((item, itemIndex) =>
    normalizeBuyerOrderItem(item, itemIndex, merged)
  );
  const totalValue = pickMoney(
    merged.total_amount,
    merged.totalAmount,
    merged.grand_total,
    merged.grandTotal,
    merged.total_price,
    merged.totalPrice,
    merged.total,
    merged.amount,
    merged.payment?.amount,
    fallback.totalValue
  ) || items.reduce((total, item) => total + item.subtotal, 0);
  const orderNumber =
    merged.order_number ||
    merged.orderNumber ||
    merged.invoice_number ||
    merged.invoiceNumber ||
    merged.code ||
    merged.no_order ||
    merged.noOrder ||
    id;

  return {
    id,
    raw: merged,
    orderNumber: String(orderNumber || id).replace(/^#+/, ""),
    statusCode: String(statusSource || ""),
    statusLabel: formatBuyerOrderStatus(statusSource, paymentTransactionStatus, paidAt),
    category,
    createdAt: merged.created_at || merged.createdAt || merged.order_date || merged.orderDate || merged.date || fallback.createdAt || null,
    paidAt,
    totalValue,
    items: items.length ? items : [normalizeBuyerOrderItem({}, 0, merged)],
    storeName: pickStoreName(merged) || fallback.storeName || "",
    paymentMethod:
      merged.payment_method ||
      merged.paymentMethod ||
      merged.payment?.method ||
      merged.payment?.payment_method ||
      fallback.paymentMethod ||
      "",
    shippingAddress:
      formatOrderAddress(merged.shipping_address || merged.shippingAddress || merged.address || merged.destination_address) ||
      fallback.shippingAddress ||
      "",
  };
}

function extractBuyerOrderItems(order, fallback = {}) {
  const candidates = [
    order.items,
    order.order_items,
    order.orderItems,
    order.products,
    order.details,
    order.data?.items,
    order.data?.order_items,
  ];

  const rows = candidates.find(Array.isArray);
  if (rows?.length) return rows;
  if (Array.isArray(fallback.items) && fallback.items.length) return fallback.items.map((item) => item.raw || item);
  if (order.product || order.product_id || order.product_name || order.productName) return [order];
  return [];
}

function getBuyerOrderPaidAt(order = {}, fallback = {}) {
  return pickFirstString(
    order.paid_at,
    order.paidAt,
    order.paid_date,
    order.paidDate,
    order.payment_paid_at,
    order.paymentPaidAt,
    order.payment?.paid_at,
    order.payment?.paidAt,
    order.payment?.settlement_time,
    order.payment?.settlementTime,
    order.payment?.transaction_time,
    order.payment?.transactionTime,
    order.transaction?.paid_at,
    order.transaction?.paidAt,
    order.transaction?.settlement_time,
    order.transaction?.settlementTime,
    order.transaction?.transaction_time,
    order.transaction?.transactionTime,
    fallback.paidAt,
    fallback.raw?.paid_at,
    fallback.raw?.paidAt,
    fallback.raw?.payment?.paid_at,
    fallback.raw?.payment?.paidAt
  );
}

function normalizeBuyerOrderItem(item, index = 0, order = {}) {
  const source = item && typeof item === "object" ? item : {};
  const product = source.product || source.product_detail || source.productDetail || source.item || {};
  const merged = { ...product, ...source };
  const quantity = Number(merged.quantity ?? merged.qty ?? merged.jumlah ?? order.quantity ?? 1) || 1;
  const unitPrice = pickMoney(
    merged.unit_price,
    merged.unitPrice,
    merged.price,
    merged.product_price,
    merged.productPrice,
    product.price,
    order.price
  );
  const subtotal = pickMoney(merged.subtotal, merged.total, merged.total_price, merged.totalPrice) || unitPrice * quantity;
  const orderItemId = pickFirstString(
    merged.order_item_id,
    merged.orderItemId,
    merged.item_id,
    merged.itemId,
    source.id,
    source.uuid,
    merged.id
  );
  const productId = pickFirstString(
    merged.product_id,
    merged.productId,
    product.id,
    product.product_id,
    product.productId,
    source.product_id,
    source.productId
  );

  return {
    id: merged.id ?? merged.product_id ?? merged.productId ?? product.id ?? `item-${index + 1}`,
    orderItemId,
    productId,
    raw: source,
    title:
      merged.name ||
      merged.product_name ||
      merged.productName ||
      merged.title ||
      product.name ||
      order.product_name ||
      "Produk",
    quantity,
    unitPrice,
    subtotal,
    image: resolveProductImage(merged) || resolveProductImage(product) || resolveProductImage(order),
    storeName: pickStoreName(merged) || pickStoreName(order),
  };
}

function getBuyerOrderRequestId(order) {
  const source = order?.raw || order || {};
  return (
    source.id ??
    source.uuid ??
    source.order_id ??
    source.orderId ??
    order?.id ??
    ""
  );
}

function pickStoreName(source = {}) {
  const store = source.store || source.shop || source.seller || source.maker || {};
  return (
    source.store_name ||
    source.storeName ||
    source.shop_name ||
    source.shopName ||
    source.seller_name ||
    source.sellerName ||
    source.maker_name ||
    source.makerName ||
    store.name ||
    store.store_name ||
    store.storeName ||
    store.shop_name ||
    ""
  );
}

function pickMoney(...values) {
  for (const value of values) {
    const parsed = parseMoneyValue(value);
    if (parsed > 0) return parsed;
  }
  return 0;
}

function parseMoneyValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === undefined || value === null || value === "") return 0;

  const raw = String(value).trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  if (!cleaned) return 0;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (/\.\d{3}(\D|$)/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, "")) || 0;
  }
  return Number(cleaned.replace(",", ".")) || 0;
}

function getBuyerOrderCategory(status, paymentTransactionStatus, paidAt = "") {
  const normalized = String(status || "")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .trim();

  // Status yang diubah admin/seller (dikirim/selesai/dibatalkan) adalah
  // sumber utama: meskipun pesanan sudah dibayar, tampilkan status itu.
  if (normalized && /cancel|batal|void|dibatalkan/.test(normalized)) return "canceled";
  if (normalized && /selesai|complete|completed|done|success|finished/.test(normalized)) return "completed";
  if (normalized && /dikirim|kirim|ship|sent|delivered|on delivery|dalam pengiriman/.test(normalized)) return "shipped";

  if (paidAt) return "packed";

  // Prioritaskan status pembayaran Midtrans: hanya settlement/capture/authorize
  // (atau paid/lunas/terbayar) yang dianggap sudah dibayar & boleh dikemas.
  const pay = String(paymentTransactionStatus || "")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .trim();

  if (/settlement|capture|authorize|\bpaid\b|lunas|terbayar/.test(pay)) return "packed";
  if (
    pay &&
    /pending|challenge|expire|deny|failure|gagal|unpaid|belum bayar|belum lunas|waiting payment|menunggu pembayaran|payment pending/.test(
      pay
    )
  )
    return "unpaid";

  if (!normalized) return "unpaid";

  // Sudah dibayar (konfirmasi eksplisit) -> dikemas.
  if (/\bpaid\b|settlement|capture|authorize|lunas|terbayar|diproses|processing|proses|dikemas|packed/.test(normalized)) return "packed";

  // Belum ada konfirmasi pembayaran dari Midtrans -> belum dibayar (jangan dikemas).
  return "unpaid";
}

function formatBuyerOrderStatus(status, paymentTransactionStatus, paidAt = "") {
  const category = getBuyerOrderCategory(status, paymentTransactionStatus, paidAt);
  if (category === "unpaid") return "Belum Bayar";
  if (category === "packed") return "Dikemas";
  if (category === "shipped") return "Dikirim";
  if (category === "completed") return "Selesai";
  if (category === "canceled") return "Dibatalkan";
  return formatOrderStatus(status);
}

function getBuyerOrderStatusStyle(category) {
  if (category === "unpaid") return styles.orderStatusUnpaid;
  if (category === "shipped") return styles.orderStatusShipped;
  if (category === "completed") return styles.orderStatusCompleted;
  if (category === "canceled") return styles.orderStatusCanceled;
  return styles.orderStatusPacked;
}

function formatBuyerOrderDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatOrderAddress(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return "";
  return [
    value.recipient_name || value.recipientName || value.name,
    value.phone || value.phone_number || value.phoneNumber,
    value.address_line || value.addressLine || value.street || value.full_address || value.fullAddress || value.address,
    value.city || value.kota,
    value.province || value.provinsi,
    value.postal_code || value.postalCode || value.kode_pos,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function extractAddressRows(response) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.payload,
    response?.addresses,
    response?.items,
    response?.data?.addresses,
    response?.data?.items,
    response?.data?.data,
    response?.result?.addresses,
    response?.result?.items,
    response?.payload?.addresses,
    response?.payload?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function normalizeAddresses(response) {
  return extractAddressRows(response)
    .map((address, index) => normalizeAddress(address, index))
    .filter((address) => address.id)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

function normalizeAddress(address, index = 0) {
  const source = address?.address && typeof address.address === "object"
    ? { ...address.address, ...address }
    : address || {};
  const id =
    source.id ||
    source.uuid ||
    source.address_id ||
    source.addressId ||
    source._id ||
    `address-${index + 1}`;
  const name =
    source.receiver_name ||
    source.receiverName ||
    source.recipient_name ||
    source.recipientName ||
    source.full_name ||
    source.fullName ||
    source.name ||
    source.nama ||
    "Penerima";
  const label =
    source.label ||
    source.address_label ||
    source.addressLabel ||
    source.type ||
    source.tag ||
    "";
  const city = source.city || source.kota || source.regency || source.district || "";
  const province = source.province || source.state || source.region || source.provinsi || "";
  const postalCode = source.postal_code || source.postalCode || source.zip || source.kode_pos || "";
  const street =
    source.street ||
    source.address_line ||
    source.addressLine ||
    source.detail ||
    source.full_address ||
    source.fullAddress ||
    (typeof source.address === "string" ? source.address : "") ||
    "";

  const lat = Number(source.lat ?? source.latitude ?? source.latlong?.lat);
  const lng = Number(source.lng ?? source.longitude ?? source.latlong?.lng);

  return {
    id,
    name: String(name || "").trim(),
    phone: String(source.phone || source.phone_number || source.phoneNumber || source.telephone || source.telp || "").trim(),
    email: String(source.email || source.mail || "").trim(),
    label: String(label || "").trim(),
    address: String(street || "").trim(),
    city: String(city || "").trim(),
    province: String(province || "").trim(),
    postalCode: String(postalCode || "").trim(),
    notes: String(source.notes || source.note || source.courier_note || source.courierNote || "").trim(),
    isDefault: Boolean(source.is_default ?? source.isDefault ?? source.default ?? source.primary),
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    raw: source,
  };
}

function formatAddressText(address) {
  if (!address) return "";
  return [address.address, address.city, address.province, address.postalCode]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function getAddressOptionLabel(address) {
  const label = address.label ? `${address.label} - ` : "";
  const city = address.city || address.province || "Alamat";
  return `${label}${address.name} (${city})`;
}

function getAddressFormDefaults(address) {
  const lat = Number(address?.lat ?? address?.latitude ?? address?.raw?.lat ?? address?.raw?.latitude);
  const lng = Number(address?.lng ?? address?.longitude ?? address?.raw?.lng ?? address?.raw?.longitude);
  return {
    name: address?.name || "",
    phone: address?.phone || "",
    address: address?.address || "",
    city: address?.city || "",
    province: address?.province || "",
    postalCode: address?.postalCode || "",
    label: address?.label || "",
    notes: address?.notes || "",
    isDefault: Boolean(address?.isDefault),
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  };
}

function buildAddressPayload(form) {
  const payload = {
    recipient_name: form.name.trim(),
    phone: form.phone.trim(),
    address_line: form.address.trim(),
    kota: form.city.trim(),
    provinsi: form.province.trim(),
    kode_pos: form.postalCode.trim(),
    label: form.label.trim(),
    is_default: Boolean(form.isDefault),
  };

  if (Number.isFinite(form.lat)) payload.latitude = form.lat;
  if (Number.isFinite(form.lng)) payload.longitude = form.lng;

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") delete payload[key];
  });

  return payload;
}

function buildCheckoutShippingAddress(address) {
  if (!address) return "";

  const recipient = [address.name, address.phone].filter(Boolean).join(" - ");
  const location = formatAddressText(address);
  return [recipient, location, address.notes]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n");
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, Math.round(number)));
}

function formatMemberLevel(value) {
  const text = String(value || "Bronze Member")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return /member$/i.test(text) ? text : `${text} Member`;
}

function getDefaultMemberBenefits(level, discountPercentage) {
  const discount = Number(discountPercentage);
  const benefits = [];
  if (discount > 0) benefits.push(`Diskon ${discount}% untuk semua produk`);
  benefits.push("Akses ke promo member");
  benefits.push("Riwayat pesanan tersimpan");
  if (/gold|platinum|diamond/i.test(String(level))) benefits.push("Akses awal ke koleksi baru");
  return benefits;
}

function formatOrderStatus(value) {
  const raw = String(value || "Diproses").trim();
  const normalized = raw.replace(/[_-]+/g, " ").toLowerCase();
  if (normalized === "dikirim" || normalized === "shipped") return "Dikirim";
  if (normalized === "selesai" || normalized === "completed") return "Selesai";
  if (normalized === "dibatalkan" || normalized === "cancelled" || normalized === "canceled") return "Dibatalkan";
  if (normalized === "diproses" || normalized === "processing") return "Diproses";
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProfileOrderAction(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("selesai") || normalized.includes("completed")) return "Beli Lagi";
  if (normalized.includes("dikirim") || normalized.includes("shipped")) return "Lacak";
  return "Detail";
}

function extractProductReviewRows(response) {
  if (!response || typeof response !== "object") return [];
  const candidates = [
    response.reviews,
    response.items,
    response.list,
    response.data?.reviews,
    response.result?.reviews,
    response.payload?.reviews,
    response,
    response.data,
    response.result,
    response.payload,
    response.data?.data,
  ];
  return candidates.find(Array.isArray) || [];
}

function normalizeProductReviews(response) {
  return extractProductReviewRows(response).map((review, index) => {
    const user = review?.user && typeof review.user === "object" ? review.user : {};
    return {
      id: review?.id || review?.uuid || `review-${index}`,
      productId: review?.product_id || review?.productId || "",
      rating: Number(review?.rating ?? review?.stars ?? review?.score) || 0,
      comment: review?.comment || review?.review || review?.text || review?.ulasan || "",
      createdAt: review?.created_at || review?.createdAt || review?.date || review?.timestamp || null,
      photo: pickReviewPhoto(review),
      user: {
        id: user?.id || "",
        name: user?.name || review?.user_name || review?.userName || review?.name || "Pelanggan BumiKriya",
        avatar:
          resolveApiUrl(
            user?.photoprofil ||
              user?.photo_profile ||
              user?.photoProfil ||
              user?.avatar ||
              user?.profile_picture ||
              user?.profilePicture ||
              review?.avatar
          ) || "",
      },
      raw: review,
    };
  });
}

function getBestProductReviews(reviews) {
  return [...reviews].sort((a, b) => {
    const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (ratingDiff) return ratingDiff;

    const timeA = a.createdAt ? Date.parse(a.createdAt) || 0 : 0;
    const timeB = b.createdAt ? Date.parse(b.createdAt) || 0 : 0;
    if (timeA !== timeB) return timeB - timeA;

    return String(a.id).localeCompare(String(b.id));
  });
}

function pickReviewPhoto(review = {}) {
  const candidates = [
    review.image,
    review.image_url,
    review.imageUrl,
    review.photo,
    review.photo_url,
    review.photoUrl,
    review.foto,
    review.foto_url,
    review.review_image,
    review.reviewImage,
    review.review_photo,
    review.reviewPhoto,
    review.attachment,
    review.attachment_url,
    review.attachmentUrl,
    review.media,
    Array.isArray(review.images) ? review.images[0] : null,
    Array.isArray(review.photos) ? review.photos[0] : null,
    Array.isArray(review.attachments) ? review.attachments[0] : null,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") {
      const resolved = resolveApiUrl(candidate);
      if (resolved) return resolved;
      continue;
    }
    if (typeof candidate === "object") {
      const resolved = resolveApiUrl(
        candidate.url ||
          candidate.path ||
          candidate.image ||
          candidate.image_url ||
          candidate.photo ||
          candidate.photo_url ||
          candidate.file ||
          candidate.file_url
      );
      if (resolved) return resolved;
    }
  }
  return "";
}

function normalizeRatingSummary(response) {
  if (!response || typeof response !== "object") return { average: 0, count: 0 };
  return {
    average: Number(response.average_rating ?? response.averageRating ?? response.average ?? response.avg ?? 0) || 0,
    count: Number(response.review_count ?? response.reviewCount ?? response.total ?? response.count ?? 0) || 0,
  };
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isOrderItemReviewed(orderItemId) {
  if (!orderItemId) return false;
  try {
    const parsed = JSON.parse(localStorage.getItem("bkReviewedOrderItems") || "[]");
    return Array.isArray(parsed) && parsed.includes(String(orderItemId));
  } catch {
    return false;
  }
}

function markOrderItemReviewed(orderItemId) {
  if (!orderItemId) return;
  try {
    const parsed = JSON.parse(localStorage.getItem("bkReviewedOrderItems") || "[]");
    const list = Array.isArray(parsed) ? parsed : [];
    const key = String(orderItemId);
    if (!list.includes(key)) list.push(key);
    localStorage.setItem("bkReviewedOrderItems", JSON.stringify(list));
  } catch {}
}

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
            {onSearch && <HeaderSearch onSearch={onSearch} />}
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

