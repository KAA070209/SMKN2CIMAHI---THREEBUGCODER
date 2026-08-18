import { useEffect, useRef, useState } from "react";

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

export {
  WISHLIST_ACCENTS,
  TRENDING_SEARCHES,
  toWishlistItem,
  parseRupiah,
  formatRupiah,
  pickRandomProducts,
  sortStorefrontProducts,
  REVIEWS,
  FOOTER_COLS,
  PRODUCT_FOOTER_CATEGORIES,
  LEGAL_PAGES,
  SHIPPING_OPTIONS,
  pickVoucherNumber,
  pickVoucherText,
  parseVoucherDate,
  formatVoucherDate,
  formatDiscountPercent,
  isVoucherActive,
  ASSUMED_VOUCHER_BASKET,
  normalizeDiscountType,
  pickDiscountType,
  resolveVoucherDiscount,
  normalizeAvailableVoucher,
  compareVoucherValue,
  sortAvailableVouchers,
  extractVoucherCollection,
  normalizeAvailableVouchers,
  pickFeaturedVoucher,
  useReducedMotion,
  Reveal,
  buildMidtransPaymentPayload,
  isPaidMidtransStatus
};
