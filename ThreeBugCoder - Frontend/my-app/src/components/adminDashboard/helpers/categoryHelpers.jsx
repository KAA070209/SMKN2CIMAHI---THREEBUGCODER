/* eslint-disable no-unused-vars */

import React from "react";

import { fetchCustomers, resolveApiUrl } from "../../../lib/adminApi.js";

import { pickNumber } from "./dashboardHelpers.jsx";

function extractCategories(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.categories)) return raw.data.categories;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.categories)) return raw.categories;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

const CATEGORY_PRODUCT_COUNT_KEYS = [
  "productCount",
  "product_count",
  "productsCount",
  "products_count",
  "totalProducts",
  "total_products",
  "count",
  "jumlah_produk",
];

function extractProducts(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.products)) return raw.data.products;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.products)) return raw.products;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
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

function countProductsByCategory(categories, products) {
  const countsById = {};
  const countsByName = {};

  for (const product of products) {
    const fields = pickCategoryFields(product);
    if (fields.id) {
      const key = String(fields.id);
      countsById[key] = (countsById[key] || 0) + 1;
    }
    for (const name of fields.names) {
      const key = String(name).trim().toLowerCase();
      if (key) countsByName[key] = (countsByName[key] || 0) + 1;
    }
  }

  return categories.map((category) => {
    const backendCount = pickNumber(category, category.stats || category.summary || {}, CATEGORY_PRODUCT_COUNT_KEYS);
    const categoryId = getCategoryId(category);
    const byId =
      categoryId !== undefined && categoryId !== null && categoryId !== "" ? countsById[String(categoryId)] || 0 : 0;
    const nameKey = String(
      category.name || category.title || category.category_name || category.kategori || ""
    ).trim().toLowerCase();
    const byName = nameKey ? countsByName[nameKey] || 0 : 0;
    return { ...category, productCount: backendCount || byId || byName };
  });
}

function normalizeCategories(source) {
  return extractCategories(source).map((category, index) => {
    const apiId = getCategoryId(category);
    const productCount = pickNumber(category, category.stats || category.summary || {}, CATEGORY_PRODUCT_COUNT_KEYS);

    const image = resolveApiUrl(
      category.img ||
      category.image ||
      category.image_url ||
      category.imageUrl ||
      category.photo ||
      category.thumbnail
    ) || "";

    return {
      id: apiId || `category-${index}`,
      apiId,
      name: category.name || category.title || category.category_name || category.kategori || "Kategori Tanpa Nama",
      description: category.description || category.desc || category.deskripsi || "",
      productCount,
      isActive: category.is_active ?? category.isActive ?? category.active ?? category.status !== "inactive",
      image,
      raw: category,
    };
  });
}

function filterCategories(categories, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return categories;

  return categories.filter((category) =>
    [category.name, category.description, category.id]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
}

function getCategoryId(category) {
  return category?.id || category?.uuid || category?.category_id || category?.categoryId || category?._id;
}

function getCategoryApiId(category) {
  const rawId = getCategoryId(category?.raw);
  if (rawId) return rawId;
  if (category?.apiId) return category.apiId;
  if (category?.id && !/^category-\d+$/i.test(String(category.id))) return category.id;
  return "";
}

function formatCategoryDeleteError(err) {
  const status = err?.status;
  const message = err instanceof Error ? err.message : "";
  const detail = [message, err?.text, JSON.stringify(err?.data || {})].join(" ").toLowerCase();

  if (status >= 500 || detail.includes("internal server error") || detail.includes("transactions")) {
    return "Kategori belum bisa dihapus karena server gagal memeriksa data transaksi. Pastikan backend/database sudah memiliki tabel transactions, lalu coba hapus lagi.";
  }

  return message || "Gagal menghapus kategori.";
}

function buildCategoryPayload(form) {
  const data = {
    name: form.name.trim(),
    description: form.description.trim(),
    is_active: form.isActive,
  };

  if (form.image instanceof File) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value === undefined ? "" : String(value));
    });
    formData.append("image", form.image);
    return formData;
  }

  Object.keys(data).forEach((key) => {
    if (data[key] === "") delete data[key];
  });

  return data;
}

export {
  extractCategories,
  CATEGORY_PRODUCT_COUNT_KEYS,
  extractProducts,
  pickCategoryFields,
  countProductsByCategory,
  normalizeCategories,
  filterCategories,
  getCategoryId,
  getCategoryApiId,
  formatCategoryDeleteError,
  buildCategoryPayload
};
