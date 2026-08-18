/* eslint-disable no-unused-vars */

import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  ChevronDown,
  ChevronRight,
  CircleX,
  ClipboardList,
  Eye,
  ImagePlus,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  Mail,
  MoreVertical,
  PackageCheck,
  PenLine,
  Pencil,
  Phone,
  Plus,
  Printer,
  RefreshCcw,
  Search,
  Settings,
  Shapes,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  TrendingUp,
  TicketPercent,
  UserCog,
  UsersRound,
  X,
  MapPin,
} from "lucide-react";

import {
  formatCompactNumber
} from "./helpers.jsx";

const metricCards = [
  {
    key: "totalSellers",
    label: "TOTAL SELLER",
    icon: UsersRound,
    accent: "pink",
    changeKey: "sellersChange",
    formatter: formatCompactNumber,
  },
  {
    key: "newOrders",
    label: "PESANAN BARU",
    icon: ShoppingCart,
    accent: "warm",
    changeKey: "ordersChange",
    formatter: formatCompactNumber,
  },
  {
    key: "activeProducts",
    label: "PRODUK AKTIF",
    icon: PackageCheck,
    accent: "ash",
    changeKey: "productsChange",
    formatter: formatCompactNumber,
  },
];

const ORDER_STATUS_OPTIONS = ["Semua Status", "Diproses", "Dikirim", "Selesai", "Dibatalkan"];
const CUSTOMER_MEMBER_OPTIONS = ["Bronze Member", "Silver Member", "Gold Member", "Platinum Member"];
const ACCOUNT_ROLE_FILTER_OPTIONS = ["Semua Peran", "Admin", "Seller", "User"];
const ACCOUNT_STATUS_FILTER_OPTIONS = ["Semua Status", "Aktif", "Non-aktif"];
const CUSTOMER_MEMBER_FILTER_OPTIONS = ["Semua Member", ...CUSTOMER_MEMBER_OPTIONS];
const CATEGORY_CARD_ICONS = [PenLine, CircleX, BriefcaseBusiness, Pencil, PackageCheck, ShoppingBag];

const navItems = [
  { label: "Ringkasan", icon: LayoutDashboard, view: "dashboard" },
  { label: "Pesanan", icon: ClipboardList, view: "orders" },
  { label: "Kategori", icon: Shapes, view: "categories" },
  { label: "Recipe Crafting", icon: BookOpen, view: "recipes" },
  { label: "Voucher", icon: TicketPercent, view: "vouchers" },
  { label: "Pelanggan", icon: UsersRound, view: "customers" },
  { label: "Kelola Akun", icon: UserCog, view: "accounts" },
];

export {
  metricCards,
  ORDER_STATUS_OPTIONS,
  CUSTOMER_MEMBER_OPTIONS,
  ACCOUNT_ROLE_FILTER_OPTIONS,
  ACCOUNT_STATUS_FILTER_OPTIONS,
  CUSTOMER_MEMBER_FILTER_OPTIONS,
  CATEGORY_CARD_ICONS,
  navItems
};
