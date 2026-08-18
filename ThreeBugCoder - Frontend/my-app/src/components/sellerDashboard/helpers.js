/* eslint-disable no-unused-vars */

import { resolveApiUrl } from "../../lib/userApi.js";

const FALLBACK_CATEGORIES = ["Keramik", "Tekstil", "Planters", "Batik", "Anyaman", "Dekorasi", "Aksesoris"];

const EMPTY_PRODUCT_FORM = {
  name: "",
  description: "",
  category: "",
  price: "",
  stock: "1",
  color: "",
  material: "",
  fits: "",
  image: "",
  images: [],
  isActive: true,
};

const EMPTY_STORE_FORM = {
  storeName: "",
  tagline: "",
  location: "",
  description: "",
  shippingPolicy: "",
  returnPolicy: "",
  customPolicy: "",
  logo: "",
  banner: "",
  logoFile: null,
  bannerFile: null,
  tags: [],
};

const ORDER_STATUS_OPTIONS = [
  { label: "Diproses", value: "processing" },
  { label: "Dikirim", value: "shipped" },
  { label: "Selesai", value: "selesai" },
  { label: "Dibatalkan", value: "cancelled" },
];

function buildInitialStoreForm(store) {
  if (!store) return { ...EMPTY_STORE_FORM };
  return {
    storeName: store.storeName || "",
    tagline: store.tagline || "",
    location: store.location || "",
    description: store.description || "",
    shippingPolicy: store.shippingPolicy || "",
    returnPolicy: store.returnPolicy || "",
    customPolicy: store.customPolicy || "",
    logo: store.logo || "",
    banner: store.banner || "",
    logoFile: null,
    bannerFile: null,
    tags: store.tags?.length ? [...store.tags] : [],
  };
}

function buildSellerStorePayload(form) {
  const payload = {
    store_name: form.storeName.trim(),
    tagline: form.tagline.trim(),
    address: form.location.trim(),
    description: form.description.trim(),
    shipping_policy: form.shippingPolicy.trim(),
    return_policy: form.returnPolicy.trim(),
    custom_policy: form.customPolicy.trim(),
    tags: JSON.stringify(form.tags || []),
  };

  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) data.append(key, value);
  });

  if (form.logoFile) {
    data.append("logo", form.logoFile);
  } else if (form.logo) {
    data.append("logo_url", form.logo);
  }

  if (form.bannerFile) {
    data.append("banner", form.bannerFile);
  } else if (form.banner) {
    data.append("banner_url", form.banner);
  }

  return data;
}

function buildInitialProductForm(product) {
  if (!product) return { ...EMPTY_PRODUCT_FORM };
  return {
    name: product.name || "",
    description: product.description || product.deskripsi || product.product_description || "",
    category: product.categoryId || "",
    price: product.price || "",
    stock: product.stock ?? "0",
    color: product.color || "",
    material: product.material || "",
    fits: product.fits || "",
    image: typeof product.image === "string" ? product.image : "",
    images: [],
    isActive: product.isActive ?? true,
  };
}

function buildInitialImagePreviews(product) {
  if (!product?.image || typeof product.image !== "string") return [];
  return [{ url: product.image, local: false }];
}

function buildSellerProductPayload(form) {
  const payload = {
    name: form.name.trim(),
    description: form.description.trim(),
    price: toNumber(form.price),
    stock: toNumber(form.stock),
    color: form.color.trim(),
    material: form.material.trim(),
    fits: form.fits.trim(),
    category_id: form.category,
    is_active: form.isActive,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "" || payload[key] === undefined || payload[key] === null) delete payload[key];
  });

  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => data.append(key, value));
  if (form.images && form.images.length) {
    form.images.forEach((image, index) => {
      data.append(index === 0 ? "image" : "images", image);
    });
  } else if (form.image) {
    data.append("image", form.image.trim());
  }
  return data;
}

function normalizeSellerStore(raw, user, summary = {}) {
  const store = extractSellerStoreRecord(raw);
  const policies = store.policies || store.policy || store.kebijakan || {};
  const fallbackDescription =
    "Kami memulai CraftyHands Studio dengan satu tujuan: membawa kembali sentuhan manusiawi ke dalam barang-barang sehari-hari.";

  return {
    storeName:
      store.store_name ||
      store.storeName ||
      store.name ||
      store.shop_name ||
      store.shopName ||
      summary.storeName ||
      user.storeName ||
      "CraftyHands Studio",
    tagline:
      store.tagline ||
      store.role_label ||
      store.roleLabel ||
      store.subtitle ||
      summary.roleLabel ||
      user.roleLabel ||
      "Master Crafter",
    location:
      store.location ||
      store.address ||
      store.alamat ||
      store.city ||
      store.kota ||
      "Portland, OR",
    description: store.description || store.deskripsi || store.bio || fallbackDescription,
    logo: resolveApiUrl(
      store.logo ||
        store.logo_url ||
        store.logoUrl ||
        store.avatar ||
        store.photo ||
        store.photo_url ||
        store.photoUrl ||
        summary.logo ||
        user.avatar
    ),
    banner:
      resolveApiUrl(
        store.banner ||
          store.banner_url ||
          store.bannerUrl ||
          store.cover ||
          store.cover_url ||
          store.coverUrl ||
          store.hero_image ||
          store.heroImage
      ) || "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?q=80&w=1400&auto=format&fit=crop",
    shippingPolicy:
      store.shipping_policy ||
      store.shippingPolicy ||
      policies.shipping ||
      policies.shipping_policy ||
      "3-5 Hari Kerja (Reguler)",
    returnPolicy:
      store.return_policy ||
      store.returnPolicy ||
      policies.return ||
      policies.return_policy ||
      "Diterima dalam 14 hari, kondisi utuh.",
    customPolicy:
      store.custom_policy ||
      store.customPolicy ||
      store.commission_policy ||
      store.commissionPolicy ||
      policies.custom ||
      policies.custom_policy ||
      "Sedang ditutup bulan ini.",
    tags: normalizeStoreTags(store.tags || store.categories || store.category_tags || store.categoryTags || store.labels),
  };
}

function extractSellerStoreRecord(raw) {
  const candidates = [
    raw?.data?.store,
    raw?.data?.shop,
    raw?.data?.seller,
    raw?.data?.profile,
    raw?.store,
    raw?.shop,
    raw?.seller,
    raw?.profile,
    raw?.data?.data?.store,
    raw?.data?.data,
    raw?.data,
    raw?.result?.store,
    raw?.result?.data,
    raw?.result,
    raw?.payload?.store,
    raw?.payload?.data,
    raw?.payload,
    raw,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) return candidate;
  }
  return {};
}

function normalizeStoreTags(source) {
  let parsed = source;
  if (typeof parsed === "string") {
    try {
      const value = JSON.parse(parsed);
      if (Array.isArray(value)) parsed = value;
    } catch {
      parsed = parsed ? [parsed] : [];
    }
  }
  const rows = Array.isArray(parsed) ? parsed : extractCollection(parsed, ["tags", "categories", "items", "list", "data"]);
  const tags = rows
    .map((tag) => {
      if (typeof tag === "string") return tag;
      return tag?.name || tag?.title || tag?.label || tag?.tag || "";
    })
    .map((tag) => String(tag).trim())
    .filter(Boolean);

  const unique = [];
  tags.forEach((tag) => {
    if (!unique.some((item) => item.toLowerCase() === tag.toLowerCase())) unique.push(tag);
  });

  return unique.length ? unique : ["Ceramics", "Small Batch", "Handmade"];
}

function normalizeSellerSummary(raw, user) {
  const payload = raw?.data?.summary || raw?.data?.dashboard || raw?.data || raw?.summary || raw?.dashboard || raw || {};
  const stats = payload.stats || payload.metrics || payload.summary || {};
  const recentOrders = normalizeSellerOrders(
    payload.recentOrders ||
      payload.recent_orders ||
      payload.latestOrders ||
      payload.latest_orders ||
      payload.orders ||
      raw?.data?.recentOrders ||
      raw?.data?.recent_orders ||
      raw?.data?.latestOrders ||
      raw?.data?.latest_orders ||
      raw?.data?.orders ||
      raw?.recentOrders ||
      raw?.recent_orders ||
      raw?.latestOrders ||
      raw?.latest_orders ||
      raw?.orders ||
      []
  );
  const salesTrend = normalizeSalesTrend(findSalesTrendSource(raw, payload, stats));
  const seller = payload.seller || payload.store || payload.shop || payload.profile || {};
  const storeName =
    seller.store_name ||
    seller.storeName ||
    seller.name ||
    payload.store_name ||
    payload.storeName ||
    user.storeName ||
    "CraftyHands Studio";
  const firstName = (user.name || seller.owner_name || seller.ownerName || storeName || "Maker").split(" ")[0] || "Maker";
  const pendingOrders = pickNumber(payload, stats, ["pendingOrders", "pending_orders", "ordersPending", "orders_pending"]);
  const activeProducts = pickNumber(payload, stats, [
    "activeProducts",
    "active_products",
    "productActive",
    "productsActive",
    "products_active",
    "totalProducts",
    "total_products",
    "produk_aktif",
  ]);
  const totalCategories = pickNumber(payload, stats, ["totalCategories", "total_categories", "categoriesCount", "categories_count"]);

  return {
    storeName,
    firstName,
    roleLabel: seller.role_label || seller.roleLabel || user.roleLabel || "Master Crafter",
    logo: resolveApiUrl(seller.logo || seller.logo_url || seller.logoUrl || payload.logo || user.avatar),
    totalSales: pickNumber(payload, stats, [
      "totalSales",
      "total_sales",
      "salesTotal",
      "sales_total",
      "revenue",
      "totalRevenue",
      "total_revenue",
      "total_penjualan",
    ]),
    newOrders: pickNumber(payload, stats, [
      "newOrders",
      "new_orders",
      "ordersToday",
      "orders_today",
      "pendingOrders",
      "pending_orders",
      "pesanan_baru",
    ]),
    activeProducts,
    salesChange: pickText(payload, stats, ["salesChange", "sales_change", "salesGrowth", "sales_growth", "revenueChange"]) || "Data terbaru",
    ordersDetail: pendingOrders ? `${formatCompactNumber(pendingOrders)} pesanan menunggu diproses` : "Tidak ada pesanan tertunda",
    productsDetail: totalCategories ? `${formatCompactNumber(totalCategories)} kategori aktif` : "Produk siap dijual",
    salesTrend: salesTrend.length ? salesTrend : buildSalesTrendFromOrders(recentOrders),
    recentOrders,
  };
}

function normalizeSalesTrend(source) {
  const rows = extractSalesTrendRows(source);
  if (!rows.length) return [];

  return rows
    .slice(0, 8)
    .map((item, index) => {
      if (typeof item === "number" || typeof item === "string") {
        return { label: getFallbackDay(index), value: toNumber(item) };
      }

      const label =
        item.label ||
        item.day ||
        item.weekday ||
        item.date ||
        item.month ||
        getFallbackDay(index);
      const value = pickNumber(item, item.stats || item.summary || {}, [
        "value",
        "total",
        "sales",
        "revenue",
        "amount",
        "totalSales",
        "total_sales",
        "total_revenue",
      ]);

      return { label: formatTrendLabel(label, index), value };
    })
    .filter((point) => point.value > 0 || point.label);
}

function findSalesTrendSource(...sources) {
  const keys = [
    "salesTrend",
    "sales_trend",
    "salesChart",
    "sales_chart",
    "salesGraph",
    "sales_graph",
    "revenueTrend",
    "revenue_trend",
    "revenueChart",
    "revenue_chart",
    "weeklySales",
    "weekly_sales",
    "dailySales",
    "daily_sales",
    "dailyRevenue",
    "daily_revenue",
    "trend",
    "trends",
    "chart",
    "charts",
    "graph",
    "series",
  ];

  for (const source of sources) {
    const found = findNestedValue(source, keys, 0);
    if (found !== undefined && found !== null && extractSalesTrendRows(found).length) return found;
  }

  return [];
}

function findNestedValue(source, keys, depth) {
  if (!source || typeof source !== "object" || depth > 3) return undefined;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }

  for (const key of ["data", "result", "payload", "summary", "dashboard", "stats", "metrics"]) {
    const found = findNestedValue(source[key], keys, depth + 1);
    if (found !== undefined && found !== null) return found;
  }

  return undefined;
}

function extractSalesTrendRows(source) {
  if (Array.isArray(source)) return source;

  if (!source || typeof source !== "object") return [];

  const collection = extractCollection(source, [
    "salesTrend",
    "sales_trend",
    "sales",
    "revenue",
    "trend",
    "trends",
    "chart",
    "charts",
    "series",
    "items",
    "list",
    "rows",
    "results",
    "data",
  ]);
  if (collection.length) return collection;

  const labels = source.labels || source.label || source.days || source.dates || source.categories;
  const values = source.values || source.value || source.data || source.sales || source.revenue || source.amounts || source.totals;
  if (Array.isArray(labels) && Array.isArray(values)) {
    return labels.map((label, index) => ({ label, value: values[index] }));
  }

  return Object.entries(source)
    .filter(([, value]) => value !== null && value !== undefined && (typeof value !== "object" || value.value !== undefined || value.total !== undefined))
    .map(([label, value]) => (typeof value === "object" ? { label, ...value } : { label, value }));
}

function buildSalesTrendFromOrders(orders) {
  if (!Array.isArray(orders) || !orders.length) return [];

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - offset));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date),
      value: 0,
    };
  });
  const byDate = new Map(days.map((day) => [day.key, day]));

  orders.forEach((order) => {
    const date = parseDate(order.createdAt || order.date || order.orderDate);
    if (!date) return;
    const key = date.toISOString().slice(0, 10);
    const bucket = byDate.get(key);
    if (bucket) bucket.value += toNumber(order.total);
  });

  return days.some((day) => day.value > 0) ? days.map(({ label, value }) => ({ label, value })) : [];
}

function normalizeSellerOrders(source, options = {}) {
  const limit = options.limit ?? 5;
  const rows = extractCollection(source, ["orders", "order", "items", "list", "data", "results"]);
  if (!rows.length) return [];

  return rows.slice(0, limit).map((order, index) => {
    const customerSource = order.customer || order.user || order.buyer || order.customer_info || order.customerInfo || {};
    const summary = order.payment || order.summary || order.invoice || {};
    const customer =
      customerSource.name ||
      customerSource.full_name ||
      customerSource.fullName ||
      order.customer_name ||
      order.customerName ||
      order.buyer_name ||
      order.buyerName ||
      "Pelanggan";
    const status = normalizeOrderStatus(order.status || order.order_status || order.state || order.fulfillment_status || "new");
    const items = normalizeOrderItems(order, index);
    const subtotal = pickNumber(order, summary, ["subtotal", "sub_total", "items_total", "itemsTotal"]) || sumOrderItems(items);
    const shippingCost = pickNumber(order, summary, ["shipping_cost", "shippingCost", "delivery_fee", "deliveryFee", "biaya_pengiriman", "shipping", "shipping_fee"]);
    const tax = pickNumber(order, summary, ["tax", "tax_amount", "taxAmount"]);
    const total =
      pickNumber(order, summary, ["total", "grand_total", "grandTotal", "amount", "total_amount", "totalAmount"]) ||
      subtotal + shippingCost + tax;
    const createdAt = order.created_at || order.createdAt || order.order_date || order.orderDate || order.date || order.updated_at;

    return {
      id: order.id || order.uuid || order.order_id || order.orderId || order._id || index,
      code: formatOrderCode(order.code || order.order_code || order.orderNumber || order.order_number || order.invoice_number || order.id || index + 1),
      customer,
      customerEmail: customerSource.email || order.customer_email || order.customerEmail || "",
      customerPhone:
        customerSource.phone ||
        customerSource.phone_number ||
        order.customer_phone ||
        order.customerPhone ||
        order.phone ||
        order.receiver_phone ||
        (order.shipping_address && order.shipping_address.phone) ||
        "",
      shippingAddress:
        formatAddress(
          order.shipping_address ||
            order.shippingAddress ||
            order.address ||
            order.delivery_address ||
            customerSource.shipping_address ||
            customerSource.shippingAddress ||
            customerSource.address ||
            order.shipping_details ||
            ""
        ) ||
        order.shipping_address_text ||
        order.shippingAddressText ||
        order.address_text ||
        customerSource.shipping_address_text ||
        customerSource.address_text ||
        "",
      shippingRecipient:
        order.receiver_name ||
        order.recipient_name ||
        (order.shipping_address && order.shipping_address.recipient_name) ||
        (customerSource.shipping_address && customerSource.shipping_address.recipient_name) ||
        (customerSource.shippingAddress && customerSource.shippingAddress.recipient_name) ||
        "",
      initials: getInitials(customer),
      item: formatOrderItemSummary(items),
      items,
      subtotal,
      shippingCost,
      tax,
      total,
      createdAt,
      dateLabel: formatOrderDate(createdAt),
      orderedAt: formatFullDateTime(createdAt),
      status,
      statusLabel: getStatusLabel(status),
      statusClass: getStatusClass(status),
      timeline: normalizeOrderTimeline(order, createdAt, status),
      accent: ["gold", "pink", "red", "blue"][index % 4],
    };
  });
}

function normalizeSellerProducts(source, categoryNameById) {
  return extractCollection(source, ["products", "items", "list", "data", "results"]).map((product, index) => {
    const stock = pickNumber(product, product.inventory || product.stock_detail || {}, [
      "stock",
      "stok",
      "quantity",
      "qty",
      "inventory",
      "stock_quantity",
      "stockQuantity",
    ]);
    const isActive =
      product.is_active ??
      product.isActive ??
      product.active ??
      (product.status ? String(product.status).toLowerCase() === "active" : stock > 0);
    const categoryId = product.category_id || product.category?.id || product.categoryId || "";
    const resolvedCategoryName =
      (categoryNameById && categoryNameById[categoryId]) ||
      product.category?.name ||
      product.category_name ||
      product.kategori ||
      product.type ||
      "Keramik";

    return {
      id: getProductId(product) || `seller-product-${index}`,
      name: product.name || product.title || product.product_name || product.nama_produk || "Produk Tanpa Nama",
      category: resolvedCategoryName,
      categoryId,
      price: pickNumber(product, product.pricing || {}, ["price", "harga", "selling_price", "sale_price", "amount"]),
      oldPrice: pickNumber(product, product.pricing || {}, ["old_price", "oldPrice", "original_price", "originalPrice", "compare_at_price"]),
      stock,
      description: product.description || product.deskripsi || product.product_description || "",
      image: resolveApiUrl(product.image) || getFallbackProductImage(index),
      color: product.color || "",
      material: product.material || "",
      fits: product.fits || "",
      isActive: Boolean(isActive),
    };
  });
}

function buildCategoryNameMap(rawCategories) {
  const map = {};
  extractCollection(rawCategories, ["categories", "category", "items", "list", "data"]).forEach((category) => {
    const id = category.id || category.slug;
    const name = category.name || category.title || category.category_name || category.nama_kategori;
    if (id && name) map[String(id)] = String(name);
  });
  return map;
}

function buildCategoryOptions(rawCategories, products) {
  const fromApi = extractCollection(rawCategories, ["categories", "category", "items", "list", "data"])
    .map((category) => ({
      id: category.id || category.slug || category,
      name: category.name || category.title || category.category_name || category.nama_kategori || category,
    }))
    .filter((category) => category.id && category.name)
    .map((category) => ({ id: String(category.id), name: String(category.name) }));
  const fromProducts = products
    .filter((product) => product.categoryId && product.category)
    .map((product) => ({ id: String(product.categoryId), name: String(product.category) }));
  const fallback = FALLBACK_CATEGORIES.map((name, index) => ({ id: `fallback-${index}`, name }));
  const merged = [...fromApi, ...fromProducts, ...fallback];
  const seen = new Set();
  return merged.filter((category) => {
    if (seen.has(category.id)) return false;
    seen.add(category.id);
    return true;
  });
}

function filterSellerProducts(products, query, categoryFilter) {
  const needle = query.trim().toLowerCase();
  return products.filter((product) => {
    const matchesQuery =
      !needle ||
      [product.name, product.category, product.color, product.material, product.id]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    const matchesCategory =
      categoryFilter === "Semua Produk" ||
      (categoryFilter === "Stok Menipis" ? product.stock <= 2 : product.category.toLowerCase() === categoryFilter.toLowerCase());
    return matchesQuery && matchesCategory;
  });
}

function filterSellerOrders(orders, query, statusFilter) {
  const needle = query.trim().toLowerCase();
  return orders.filter((order) => {
    const matchesQuery =
      !needle ||
      [order.code, order.customer, order.customerEmail, order.customerPhone, order.item, order.shippingAddress]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
}

function normalizeOrderItems(order, orderIndex) {
  const rawItems = extractCollection(
    order.items || order.order_items || order.orderItems || order.products || order.details,
    ["items", "order_items", "orderItems", "products", "data", "list"]
  );
  const items = rawItems.length
    ? rawItems
    : [
        {
          id: order.product_id || order.productId || order.item_id || order.itemId || `order-item-${orderIndex}`,
          name: order.product?.name || order.item_name || order.itemName || order.product_name || order.productName,
          product: order.product,
          quantity: order.quantity || order.qty,
          price: order.price,
          total: order.total,
          image: order.image,
        },
      ];

  return items.map((item, index) => {
    const product = item.product || item.product_detail || item.productDetail || {};
    const quantity = Math.max(1, toNumber(item.quantity || item.qty || item.pivot?.quantity || 1));
    const price = pickNumber(item, product.pricing || product, ["price", "unit_price", "unitPrice", "harga", "amount"]);
    const total = pickNumber(item, item.summary || {}, ["total", "line_total", "lineTotal", "subtotal"]) || price * quantity;

    return {
      id: item.id || item.uuid || item.order_item_id || item.orderItemId || product.id || `${orderIndex}-${index}`,
      name: product.name || product.title || item.name || item.title || item.product_name || item.productName || "Produk",
      quantity,
      price,
      total,
      image: resolveApiUrl(product.image || product.image_url || product.imageUrl || item.image || item.image_url || item.imageUrl),
    };
  });
}

function normalizeOrderStatus(status) {
  const value = String(status || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (["diproses", "process", "processed", "processing", "in_process", "packed", "dikemas", "ready_to_ship", "pending", "waiting", "menunggu", "baru", "new", "new_order"].includes(value)) return "processing";
  if (["dikirim", "pengiriman", "shipping", "sent", "ship", "shipped", "delivered", "terkirim"].includes(value)) return "shipped";
  if (["selesai", "done", "completed", "complete", "finished"].includes(value)) return "selesai";
  if (["dibatalkan", "dibatal", "cancelled", "canceled", "batal"].includes(value)) return "cancelled";
  return ORDER_STATUS_OPTIONS.some((item) => item.value === value) ? value : "processing";
}

function toApiOrderStatus(status) {
  const value = String(status || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (["diproses", "process", "processed", "processing", "in_process", "packed", "dikemas", "ready_to_ship", "new", "baru", "menunggu"].includes(value)) return "DIPROSES";
  if (["dikirim", "pengiriman", "shipping", "sent", "ship", "shipped", "delivered", "terkirim"].includes(value)) return "DIKIRIM";
  if (["selesai", "done", "completed", "complete", "finished"].includes(value)) return "SELESAI";
  if (["dibatalkan", "dibatal", "cancelled", "canceled", "batal"].includes(value)) return "DIBATALKAN";
  return "DIPROSES";
}

function normalizeOrderTimeline(order, createdAt, status) {
  const rawTimeline = extractCollection(order.timeline || order.history || order.status_history || order.statusHistory, [
    "timeline",
    "history",
    "items",
    "data",
  ]);

  if (rawTimeline.length) {
    return rawTimeline.map((event) => ({
      label: event.label || event.title || getStatusLabel(normalizeOrderStatus(event.status || event.state)) || "Order Updated",
      time: formatOrderTime(event.time || event.created_at || event.createdAt || event.date),
    }));
  }

  const baseTime = formatOrderTime(createdAt);
  const events = [{ label: "Order Placed", time: baseTime }];
  if (status !== "cancelled") {
    events.unshift({ label: "Payment Confirmed", time: formatOrderTime(order.paid_at || order.paidAt || createdAt) });
  }
  if (["processing", "shipped", "selesai"].includes(status)) {
    events.unshift({ label: "Processing Started", time: formatOrderTime(order.processed_at || order.processedAt || createdAt) });
  }
  if (["shipped", "selesai"].includes(status)) {
    events.unshift({ label: "Packed", time: formatOrderTime(order.packed_at || order.packedAt || createdAt) });
    events.unshift({ label: "Shipped", time: formatOrderTime(order.shipped_at || order.shippedAt || createdAt) });
  }
  if (status === "selesai") {
    events.unshift({ label: "Delivered", time: formatOrderTime(order.delivered_at || order.deliveredAt || createdAt) });
  }
  return events;
}

function sumOrderItems(items) {
  return items.reduce((total, item) => total + (item.total || item.price * item.quantity || 0), 0);
}

function formatOrderItemSummary(items) {
  if (!items.length) return "Produk";
  const first = items[0];
  return first.quantity > 1 ? `${first.name} x${first.quantity}` : first.name;
}

function formatAddress(address) {
  if (!address) return "";
  if (typeof address === "string") return address;
  const detail =
    address.address ||
    address.street ||
    address.line1 ||
    address.detail ||
    address.full_address ||
    address.address_text;
  const area =
    address.district || address.kecamatan || address.subdistrict || address.kelurahan;
  return [
    detail,
    area,
    address.city || address.kota || address.city_name,
    address.province || address.state || address.region,
    address.postal_code || address.postalCode || address.zip,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatFullDateTime(value) {
  const date = parseDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractCollection(response, keys) {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.payload,
    response?.data?.data,
    response?.result?.data,
    response?.payload?.data,
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

function getProductId(product) {
  return product?.id || product?.uuid || product?.product_id || product?.productId || product?._id;
}

function buildSellerUser(user) {
  const profile = user?.profile || user?.seller || user?.store || user?.account || user?.data || {};
  const current = profile.profile || profile.user || profile.seller || profile.store || profile;
  const name =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    profile?.name ||
    current?.name ||
    "Maker";
  return {
    name,
    storeName:
      user?.store_name ||
      user?.storeName ||
      profile?.store_name ||
      profile?.storeName ||
      current?.store_name ||
      current?.storeName ||
      "",
    roleLabel: user?.role_label || user?.roleLabel || profile?.role_label || profile?.roleLabel || "",
    avatar:
      user?.avatar ||
      user?.avatar_url ||
      user?.photo ||
      user?.photoprofil ||
      user?.photo_profil ||
      profile?.avatar ||
      current?.avatar ||
      profile?.logo,
  };
}

function pickNumber(primary, secondary, keys) {
  for (const key of keys) {
    const value = primary?.[key] ?? secondary?.[key];
    if (value === undefined || value === null || value === "" || typeof value === "object") continue;
    return toNumber(value);
  }
  return 0;
}

function pickText(primary, secondary, keys) {
  for (const key of keys) {
    const value = primary?.[key] ?? secondary?.[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function toNumber(value) {
  if (typeof value === "number") return value;
  return Number(String(value ?? "").replace(/[^\d.-]/g, "")) || 0;
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

function formatOrderDate(value) {
  const date = parseDate(value);
  if (!date) return "Tanggal belum tersedia";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  if (sameDay) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function formatOrderTime(value) {
  const date = parseDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatOrderCode(value) {
  const raw = String(value || "").trim();
  if (!raw) return "#ORD-001";
  return raw.startsWith("#") ? raw : `#${raw}`;
}

function getInitials(name) {
  return String(name || "P")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function getStatusLabel(status) {
  if (["new", "pending", "waiting", "menunggu", "baru"].includes(status)) return "Baru";
  if (["processing", "process", "diproses", "packed", "dikemas"].includes(status)) return "Diproses";
  if (["sent", "shipped", "delivered", "dikirim"].includes(status)) return "Dikirim";
  if (["done", "completed", "complete", "selesai"].includes(status)) return "Selesai";
  if (["cancelled", "canceled", "dibatalkan", "batal"].includes(status)) return "Dibatalkan";
  return "Diproses";
}

function getStatusClass(status) {
  if (["new", "pending", "waiting", "menunggu", "processing", "process", "diproses", "packed", "dikemas"].includes(status)) return "processing";
  if (["sent", "shipped", "delivered", "dikirim"].includes(status)) return "sent";
  if (["done", "completed", "complete", "selesai"].includes(status)) return "done";
  if (["cancelled", "canceled", "dibatalkan", "batal"].includes(status)) return "cancelled";
  return "processing";
}

function getFallbackDay(index) {
  return ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"][index] || `Hari ${index + 1}`;
}

function formatTrendLabel(value, index) {
  if (!value) return getFallbackDay(index);
  const date = new Date(value);
  if (!Number.isNaN(date.getTime()) && /\d{4}-\d{1,2}-\d{1,2}/.test(String(value))) {
    return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date);
  }
  return String(value);
}

function getFallbackProductImage(index) {
  const images = [
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=720&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595408076683-de1c39d55e0e?q=80&w=720&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=720&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=720&auto=format&fit=crop",
  ];

  return images[index % images.length];
}

export {
  buildInitialStoreForm,
  buildSellerStorePayload,
  buildInitialProductForm,
  buildInitialImagePreviews,
  buildSellerProductPayload,
  normalizeSellerStore,
  extractSellerStoreRecord,
  normalizeStoreTags,
  normalizeSellerSummary,
  normalizeSalesTrend,
  normalizeSellerOrders,
  normalizeSellerProducts,
  buildCategoryNameMap,
  buildCategoryOptions,
  filterSellerProducts,
  filterSellerOrders,
  normalizeOrderItems,
  normalizeOrderStatus,
  toApiOrderStatus,
  normalizeOrderTimeline,
  sumOrderItems,
  formatOrderItemSummary,
  formatAddress,
  formatFullDateTime,
  extractCollection,
  getProductId,
  buildSellerUser,
  pickNumber,
  pickText,
  toNumber,
  formatRupiah,
  formatCompactNumber,
  formatOrderDate,
  formatOrderTime,
  parseDate,
  formatOrderCode,
  getInitials,
  getStatusLabel,
  getStatusClass,
  getFallbackDay,
  formatTrendLabel,
  getFallbackProductImage,
  FALLBACK_CATEGORIES
};
