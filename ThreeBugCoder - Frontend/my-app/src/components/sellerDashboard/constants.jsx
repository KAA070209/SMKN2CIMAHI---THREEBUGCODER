/* eslint-disable no-unused-vars */

import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  UserCog,
  UserRound,
  X,
} from "lucide-react";

import {
  formatRupiah,
  formatCompactNumber,
  FALLBACK_CATEGORIES
} from "./helpers.js";

import { ReceiptIcon } from "./notifications.jsx";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  { label: "Produk Saya", icon: ShoppingBag, view: "products" },
  { label: "Pesanan", icon: ClipboardList, view: "orders" },
];

const metricCards = [
  {
    key: "totalSales",
    label: "TOTAL PENJUALAN",
    icon: ReceiptIcon,
    accent: "pink",
    formatter: formatRupiah,
    detailKey: "salesChange",
  },
  {
    key: "newOrders",
    label: "PESANAN BARU",
    icon: ShoppingCart,
    accent: "blue",
    formatter: formatCompactNumber,
    detailKey: "ordersDetail",
  },
  {
    key: "activeProducts",
    label: "PRODUK AKTIF",
    icon: PackageCheck,
    accent: "gold",
    formatter: formatCompactNumber,
    detailKey: "productsDetail",
  },
];

const SELLER_BLOB_PATH =
  "M50,5 C65,4 83,13 89,27 C95,41 92,52 95,65 C98,82 84,95 66,93 C52,92 47,99 32,94 C17,89 5,77 7,59 C9,43 1,34 10,21 C19,8 35,9 50,5 Z";

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

const ORDER_FILTERS = [
  { label: "All", value: "all" },
  { label: "Diproses", value: "processing" },
  { label: "Dikirim", value: "shipped" },
  { label: "Selesai", value: "selesai" },
  { label: "Dibatalkan", value: "cancelled" },
];

const ORDER_STATUS_OPTIONS = ORDER_FILTERS.filter((item) => item.value !== "all");

export {
  navItems,
  metricCards,
  FALLBACK_CATEGORIES,
  SELLER_BLOB_PATH,
  EMPTY_PRODUCT_FORM,
  EMPTY_STORE_FORM,
  ORDER_FILTERS,
  ORDER_STATUS_OPTIONS
};

