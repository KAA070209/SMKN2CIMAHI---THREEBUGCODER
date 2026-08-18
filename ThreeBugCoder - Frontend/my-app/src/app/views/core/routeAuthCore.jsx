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

export {
  isLoggedIn,
  isAdminSession,
  isSellerUser
};