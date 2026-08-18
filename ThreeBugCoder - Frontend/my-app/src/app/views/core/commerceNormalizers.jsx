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
import { styles, FONT_DISPLAY } from "../../../styles.js";
import { GlobalStyle } from "../../../components/GlobalStyle.jsx";
import { ConfirmDialog } from "../../../components/ConfirmDialog.jsx";
import LocationPickerMap from "../../../components/LocationPickerMap.jsx";
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
} from "../../../lib/userApi.js";
import { getMidtransSnapEnvironment, loadMidtransSnap, resetMidtransSnap } from "../../../lib/midtrans.js";
import {
  getStoredAuthUser,
  getSessionUser,
} from "../../../lib/authApi.js";
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
} from "../../appHelpers.jsx";

import {
  PRODUCT_BG_COLORS,
  PRODUCT_DETAIL_PLACEHOLDER,
  STORE_BANNER_PLACEHOLDER,
  STORE_AVATAR_PLACEHOLDER,
  PRODUCT_DETAIL_ACCENTS,
  productDetailStyles,
  storeDetailStyles
} from "./productStoreStyles.jsx";
import { pickMoney, pickStoreName } from "./profileOrderCore.jsx";

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

function pickCategoryFields(item = {}) {
  return getProductCategoryFields(item);
}

function getProductCategoryFields(item = {}) {
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

function normalizeStorefront(raw) {
  const payload = raw?.data || raw?.result || raw?.payload || raw || {};
  const root = payload.data || payload;

  const productsSource =
    (Array.isArray(root?.products) && root.products) ||
    (Array.isArray(root?.items) && root.items) ||
    (Array.isArray(root?.list) && root.list) ||
    (Array.isArray(root?.value) && root.value) ||
    (Array.isArray(root?.values) && root.values) ||
    (Array.isArray(root?.rows) && root.rows) ||
    (Array.isArray(root?.results) && root.results) ||
    (Array.isArray(payload?.products) && payload.products) ||
    (Array.isArray(payload?.items) && payload.items) ||
    (Array.isArray(payload?.value) && payload.value) ||
    (Array.isArray(payload?.values) && payload.values) ||
    (Array.isArray(payload?.rows) && payload.rows) ||
    (Array.isArray(payload?.results) && payload.results) ||
    (Array.isArray(raw) && raw) ||
    [];

  const categoriesSource =
    (Array.isArray(root?.categories) && root.categories) ||
    (Array.isArray(root?.category) && root.category) ||
    (Array.isArray(root?.kategori) && root.kategori) ||
    (Array.isArray(root?.value) && root.value) ||
    (Array.isArray(root?.values) && root.values) ||
    (Array.isArray(root?.rows) && root.rows) ||
    (Array.isArray(root?.results) && root.results) ||
    (Array.isArray(payload?.categories) && payload.categories) ||
    (Array.isArray(payload?.value) && payload.value) ||
    (Array.isArray(payload?.values) && payload.values) ||
    (Array.isArray(payload?.rows) && payload.rows) ||
    (Array.isArray(payload?.results) && payload.results) ||
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
      const categoryFields = getProductCategoryFields(item);
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
  const source = raw?.data?.data || raw?.data || raw?.result?.data || raw?.result || raw?.payload?.data || raw?.payload || raw || {};
  const productsSource = extractSearchCollection(source, ["products", "items", "product_results", "productResults", "materials"]);
  const storesSource = extractSearchCollection(source, ["stores", "shops", "sellers", "store_results", "storeResults"]);
  const recipesSource = extractSearchCollection(source, ["recipes", "recipe", "projects", "crafts", "tutorials", "recipe_results", "recipeResults"]);

  return {
    products: productsSource
      .map((item, index) => normalizeSearchProduct(item, index))
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
      .map((item, index) => normalizeSearchRecipe(item, index))
      .filter((item) => item.title),
  };
}

function extractSearchCollection(source, keys) {
  if (Array.isArray(source)) return source;
  if (!source || typeof source !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(source[key])) return source[key];
  }

  const nested = [source.data, source.result, source.payload, source.value, source.results]
    .find((candidate) => candidate && typeof candidate === "object");
  if (!nested || nested === source) return [];

  for (const key of keys) {
    if (Array.isArray(nested[key])) return nested[key];
  }

  return [];
}

function normalizeSearchProduct(item = {}, index = 0) {
  const product = item.product || item.suggested_product || item.suggestedProduct || item.product_detail || item.productDetail || item;
  const price = product.price ?? product.harga ?? product.selling_price ?? product.sale_price ?? product.price_value ?? 0;
  const stock = Number(product.stock ?? product.stok ?? item.stock ?? item.stok ?? 0) || 0;

  return {
    id: product.id ?? product.uuid ?? product.product_id ?? product.productId ?? item.id ?? item.uuid ?? `search-product-${index + 1}`,
    productId: product.product_id ?? product.productId ?? product.id ?? product.uuid ?? item.product_id ?? item.productId,
    storeId: pickStoreId(product) || pickStoreId(item),
    title: product.name || product.title || product.product_name || product.nama_produk || item.name || item.title || "Produk",
    price: formatStorefrontPrice(price),
    priceValue: parseRupiah(price),
    badge: product.category_name || product.categoryName || product.category?.name || (stock > 0 ? `${stock} stok` : "Produk"),
    img: resolveProductImage(product) || resolveProductImage(item) || PRODUCT_DETAIL_PLACEHOLDER,
    bg: product.bg || item.bg || PRODUCT_BG_COLORS[index % PRODUCT_BG_COLORS.length],
  };
}

function normalizeSearchRecipe(item = {}, index = 0) {
  const rawMaterials = Array.isArray(item.materials)
    ? item.materials
    : Array.isArray(item.ingredients)
      ? item.ingredients
      : Array.isArray(item.recipe_materials)
        ? item.recipe_materials
        : [];
  const materials = rawMaterials.map(normalizeSearchRecipeMaterial).filter((material) => material.name);
  const relatedProducts = [
    ...materials.flatMap((material) => material.products),
    ...(Array.isArray(item.related_products) ? item.related_products : []),
    ...(Array.isArray(item.relatedProducts) ? item.relatedProducts : []),
    ...(Array.isArray(item.products) ? item.products : []),
  ]
    .map((product, productIndex) => normalizeSearchProduct(product, productIndex))
    .filter((product) => product.title);

  return {
    id: item.id ?? item.uuid ?? item.recipe_id ?? item.recipeId ?? `search-recipe-${index + 1}`,
    title: item.title || item.name || item.recipe_title || item.recipeTitle || `Recipe ${index + 1}`,
    description: item.description || item.desc || item.summary || "",
    img: resolveApiUrl(item.image || item.image_url || item.imageUrl || item.img || item.thumbnail) || PRODUCT_DETAIL_PLACEHOLDER,
    materials,
    relatedProducts,
  };
}

function normalizeSearchRecipeMaterial(material = {}) {
  if (typeof material === "string") return { name: material, products: [] };

  const quantity = material.quantity_needed ?? material.quantityNeeded ?? material.quantity ?? material.qty ?? "";
  const unit = material.unit || material.satuan || "";
  const note = material.note || material.notes || material.description || "";
  const name =
    material.material_name ||
    material.materialName ||
    material.ingredient_name ||
    material.ingredientName ||
    material.name ||
    material.title ||
    "";
  const label = [quantity, unit, name].map((part) => String(part || "").trim()).filter(Boolean).join(" ");
  const products = [
    material.suggested_product,
    material.suggestedProduct,
    ...(Array.isArray(material.recommended_products) ? material.recommended_products : []),
    ...(Array.isArray(material.recommendedProducts) ? material.recommendedProducts : []),
  ].filter(Boolean);

  return {
    name: label || String(name || note || "").trim(),
    note,
    products,
  };
}

/* ---------------------------- Sub-components ---------------------------- */

export {
  normalizeCart,
  extractCartItems,
  normalizeCartItem,
  pickCartCategoryLabel,
  normalizeCartQuantity,
  getCartItemRequestId,
  normalizeWishlist,
  extractWishlistItems,
  normalizeWishlistItem,
  pickCategoryFields,
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
  normalizeSearchRecipe
};
