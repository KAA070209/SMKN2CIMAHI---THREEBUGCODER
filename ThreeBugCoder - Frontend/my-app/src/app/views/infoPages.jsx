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

export {
  LegalPage,
  ABOUT_STATS,
  ABOUT_VALUES,
  AboutPage,
  FAQ_ITEMS,
  FaqPage,
  CONTACT_CHANNELS,
  ContactPage,
  BLOG_CATEGORIES,
  BLOG_POSTS,
  BlogPage
};
