import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
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
  createNotificationsSocket,
  createCategory,
  createAccount,
  createVoucher,
  deleteCategory,
  deleteVoucher,
  fetchAccounts,
  fetchCategories,
  fetchAdminDashboard,
  fetchAccountsSummary,
  fetchCustomerDetail,
  fetchCustomerOrders,
  fetchCustomers,
  fetchOrderDetail,
  fetchOrders,
  fetchNotifications,
  fetchProducts,
  fetchUnreadNotificationCount,
  fetchVouchers,
  markAllNotificationsRead,
  markNotificationRead,
  readAccount,
  readVoucher,
  resolveApiUrl,
  updateAccount,
  updateAccountStatus,
  updateCategory,
  updateCustomerData,
  updateOrderStatus,
  updateVoucher,
} from "../lib/adminApi.js";
import { fetchMe } from "../lib/authApi.js";
import "./AdminDashboard.css";
import { ConfirmDialog } from "./ConfirmDialog.jsx";

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
  { label: "Voucher", icon: TicketPercent, view: "vouchers" },
  { label: "Pelanggan", icon: UsersRound, view: "customers" },
  { label: "Kelola Akun", icon: UserCog, view: "accounts" },
];

export function AdminDashboard({ onLogout, onGoHome }) {
  const [adminView, setAdminView] = useState("dashboard");
  const [rawDashboard, setRawDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [rawCategories, setRawCategories] = useState([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [rawOrders, setRawOrders] = useState([]);
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("Semua Status");
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [activeOrderMenuId, setActiveOrderMenuId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rawOrderDetail, setRawOrderDetail] = useState(null);
  const [isOrderDetailLoading, setIsOrderDetailLoading] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState("");
  const [rawCustomers, setRawCustomers] = useState([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState("");
  const [rawAccounts, setRawAccounts] = useState([]);
  const [accountQuery, setAccountQuery] = useState("");
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [rawAccountsSummary, setRawAccountsSummary] = useState(null);
  const [isAccountsSummaryLoading, setIsAccountsSummaryLoading] = useState(false);
  const [accountsSummaryError, setAccountsSummaryError] = useState("");
  const [activeAccountMenuId, setActiveAccountMenuId] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [rawAccountDetail, setRawAccountDetail] = useState(null);
  const [accountModalMode, setAccountModalMode] = useState("");
  const [isAccountDetailLoading, setIsAccountDetailLoading] = useState(false);
  const [activeCustomerMenuId, setActiveCustomerMenuId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [rawCustomerDetail, setRawCustomerDetail] = useState(null);
  const [rawCustomerOrders, setRawCustomerOrders] = useState([]);
  const [customerModalMode, setCustomerModalMode] = useState("");
  const [isCustomerDetailLoading, setIsCustomerDetailLoading] = useState(false);
  const [isCustomerOrdersLoading, setIsCustomerOrdersLoading] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [customerDetailError, setCustomerDetailError] = useState("");
  const [customerOrdersError, setCustomerOrdersError] = useState("");
  const [isStatusEditorOpen, setIsStatusEditorOpen] = useState(false);
  const [isSavingOrderStatus, setIsSavingOrderStatus] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [rawNotifications, setRawNotifications] = useState([]);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [accountRoleFilter, setAccountRoleFilter] = useState("Semua Peran");
  const [accountStatusFilter, setAccountStatusFilter] = useState("Semua Status");
  const [customerMemberFilter, setCustomerMemberFilter] = useState("Semua Member");
  const [isAccountFilterOpen, setIsAccountFilterOpen] = useState(false);
  const [isCustomerFilterOpen, setIsCustomerFilterOpen] = useState(false);
  const [rawVouchers, setRawVouchers] = useState([]);
  const [voucherQuery, setVoucherQuery] = useState("");
  const [isVouchersLoading, setIsVouchersLoading] = useState(false);
  const [vouchersError, setVouchersError] = useState("");
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [deletingVoucher, setDeletingVoucher] = useState(null);
  const [isSavingVoucher, setIsSavingVoucher] = useState(false);
  const [voucherModalMode, setVoucherModalMode] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [rawVoucherDetail, setRawVoucherDetail] = useState(null);
  const [isVoucherDetailLoading, setIsVoucherDetailLoading] = useState(false);
  const [activeVoucherMenuId, setActiveVoucherMenuId] = useState(null);
  const settingsRef = useRef(null);
  const notificationRef = useRef(null);
  const actionMenuRef = useRef(null);

  const dashboard = useMemo(() => normalizeDashboard(rawDashboard), [rawDashboard]);
  const categories = useMemo(() => normalizeCategories(rawCategories), [rawCategories]);
  const visibleCategories = useMemo(() => filterCategories(categories, categoryQuery), [categories, categoryQuery]);
  const orders = useMemo(() => normalizeOrderRecords(rawOrders), [rawOrders]);
  const visibleOrders = useMemo(() => filterOrders(orders, orderQuery, orderStatus), [orders, orderQuery, orderStatus]);
  const orderDetail = useMemo(() => normalizeOrderDetail(rawOrderDetail, selectedOrder), [rawOrderDetail, selectedOrder]);
  const customers = useMemo(() => normalizeCustomers(rawCustomers), [rawCustomers]);
  const visibleCustomers = useMemo(() => filterCustomers(customers, customerQuery, customerMemberFilter), [customers, customerQuery, customerMemberFilter]);
  const accounts = useMemo(() => normalizeAccounts(rawAccounts), [rawAccounts]);
  const accountsSummary = useMemo(() => extractAccountsSummary(rawAccountsSummary), [rawAccountsSummary]);
  const visibleAccounts = useMemo(
    () => filterAccounts(accounts, accountQuery, accountRoleFilter, accountStatusFilter),
    [accounts, accountQuery, accountRoleFilter, accountStatusFilter]
  );
  const customerDetail = useMemo(
    () => normalizeCustomerDetail(rawCustomerDetail, selectedCustomer),
    [rawCustomerDetail, selectedCustomer]
  );
  const customerOrders = useMemo(() => normalizeCustomerOrders(rawCustomerOrders), [rawCustomerOrders]);
  const customerStats = useMemo(() => summarizeCustomers(customers), [customers]);
  const accountStats = useMemo(() => summarizeAccounts(accounts, accountsSummary), [accounts, accountsSummary]);
  const accountDetail = useMemo(
    () => normalizeAccountDetail(rawAccountDetail, selectedAccount),
    [rawAccountDetail, selectedAccount]
  );
  const notifications = useMemo(() => normalizeNotifications(rawNotifications), [rawNotifications]);
  const vouchers = useMemo(() => normalizeVouchers(rawVouchers), [rawVouchers]);
  const visibleVouchers = useMemo(() => filterVouchers(vouchers, voucherQuery), [vouchers, voucherQuery]);
  const voucherDetail = useMemo(
    () => normalizeVoucherDetail(rawVoucherDetail, selectedVoucher),
    [rawVoucherDetail, selectedVoucher]
  );
  const voucherStats = useMemo(() => summarizeVouchers(vouchers), [vouchers]);
  const [adminUser, setAdminUser] = useState(getStoredUser);
  const isOrderDetail = adminView === "orderDetail";
  const isOrderWorkspace = adminView === "orders" || isOrderDetail;

  const loadDashboard = useCallback(async (signal) => {
    setIsLoading(true);
    setError("");

    try {
      const data = await fetchAdminDashboard({ signal });
      setRawDashboard(data);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard admin.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async (signal) => {
    setIsCategoriesLoading(true);
    setCategoriesError("");

    try {
      const [categoriesResult, productsResult] = await Promise.allSettled([
        fetchCategories({ signal }),
        fetchProducts({ signal }),
      ]);

      if (categoriesResult.status === "rejected") {
        throw categoriesResult.reason instanceof Error ? categoriesResult.reason : new Error("Gagal memuat kategori.");
      }

      const categoryItems = extractCategories(categoriesResult.value);
      const productItems = productsResult.status === "fulfilled" ? extractProducts(productsResult.value) : [];

      setRawCategories(countProductsByCategory(categoryItems, productItems));
    } catch (err) {
      if (err?.name === "AbortError") return;
      setCategoriesError(err instanceof Error ? err.message : "Gagal memuat kategori.");
    } finally {
      if (!signal?.aborted) setIsCategoriesLoading(false);
    }
  }, []);

  const loadVouchers = useCallback(async (signal) => {
    setIsVouchersLoading(true);
    setVouchersError("");

    try {
      const data = await fetchVouchers({ signal });
      setRawVouchers(extractVouchers(data));
    } catch (err) {
      if (err?.name === "AbortError") return;
      setVouchersError(err instanceof Error ? err.message : "Gagal memuat voucher.");
    } finally {
      if (!signal?.aborted) setIsVouchersLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async (signal) => {
    setIsOrdersLoading(true);
    setOrdersError("");

    try {
      const [ordersResult, customersResult] = await Promise.allSettled([
        fetchOrders({ signal }),
        fetchAllCustomers({ signal }),
      ]);

      if (ordersResult.status === "rejected") {
        throw ordersResult.reason instanceof Error ? ordersResult.reason : new Error("Gagal memuat pesanan.");
      }

      const orders = extractOrders(ordersResult.value);
      const customers = customersResult.status === "fulfilled" ? customersResult.value : [];
      setRawOrders(attachOrderCustomerNames(orders, buildCustomerNameMap(customers)));
    } catch (err) {
      if (err?.name === "AbortError") return;
      setOrdersError(err instanceof Error ? err.message : "Gagal memuat pesanan.");
    } finally {
      if (!signal?.aborted) setIsOrdersLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async (signal) => {
    setIsCustomersLoading(true);
    setCustomersError("");

    try {
      const data = await fetchCustomers({ page: 1, limit: 100, signal });
      setRawCustomers(extractCustomers(data));
    } catch (err) {
      if (err?.name === "AbortError") return;
      setCustomersError(err instanceof Error ? err.message : "Gagal memuat pelanggan.");
    } finally {
      if (!signal?.aborted) setIsCustomersLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async (signal) => {
    setIsAccountsLoading(true);
    setAccountsError("");

    try {
      const [accountsResult, customersResult] = await Promise.allSettled([
        fetchAccounts({ page: 1, limit: 100, signal }),
        fetchCustomers({ page: 1, limit: 100, signal }),
      ]);

      if (accountsResult.status === "rejected" && customersResult.status === "rejected") {
        throw (accountsResult.reason instanceof Error ? accountsResult.reason : new Error("Gagal memuat akun."));
      }

      setRawAccounts(
        mergeAccountUsers(
          accountsResult.status === "fulfilled" ? accountsResult.value : [],
          customersResult.status === "fulfilled" ? customersResult.value : []
        )
      );
    } catch (err) {
      if (err?.name === "AbortError") return;
      setAccountsError(err instanceof Error ? err.message : "Gagal memuat akun.");
    } finally {
      if (!signal?.aborted) setIsAccountsLoading(false);
    }
  }, []);

  const loadAccountsSummary = useCallback(async (signal) => {
    setIsAccountsSummaryLoading(true);
    setAccountsSummaryError("");

    try {
      const data = await fetchAccountsSummary({ signal });
      setRawAccountsSummary(data);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setAccountsSummaryError(err instanceof Error ? err.message : "Gagal memuat ringkasan akun.");
    } finally {
      if (!signal?.aborted) setIsAccountsSummaryLoading(false);
    }
  }, []);

  const refreshAdminProfile = useCallback(async () => {
    try {
      const me = await fetchMe();
      const user = me?.data?.user || me?.data?.data?.user || me?.user || me?.data || me;
      if (!user || typeof user !== "object") return;
      localStorage.setItem("authUser", JSON.stringify(user));
      setAdminUser(buildAdminUser(user));
    } catch {
      /* biarkan profil tersimpan tetap dipakai */
    }
  }, []);

  const isCurrentAdminAccount = useCallback((account) => {
    const accountEmail = String(account?.email || "").trim().toLowerCase();
    const accountId = String(getAccountId(account) ?? "").trim().toLowerCase();
    const adminEmail = String(adminUser?.email || "").trim().toLowerCase();
    const adminId = String(adminUser?.id || "").trim().toLowerCase();

    return Boolean((accountEmail && accountEmail === adminEmail) || (accountId && accountId === adminId));
  }, [adminUser?.email, adminUser?.id]);

  const loadNotifications = useCallback(async (signal) => {
    setIsNotificationsLoading(true);
    setNotificationsError("");

    try {
      const [notificationsResult, unreadResult] = await Promise.allSettled([
        fetchNotifications({ signal }),
        fetchUnreadNotificationCount({ signal }),
      ]);

      if (notificationsResult.status === "fulfilled") {
        setRawNotifications(extractNotifications(notificationsResult.value));
      } else if (notificationsResult.reason?.name !== "AbortError") {
        setNotificationsError(
          notificationsResult.reason instanceof Error
            ? notificationsResult.reason.message
            : "Gagal memuat notifikasi."
        );
      }

      if (unreadResult.status === "fulfilled") {
        setUnreadNotifications(extractUnreadCount(unreadResult.value) ?? countUnreadNotifications(notificationsResult.value));
      } else if (unreadResult.reason?.name !== "AbortError") {
        setUnreadNotifications((count) => count || countUnreadNotifications(notificationsResult.value));
      }
    } finally {
      if (!signal?.aborted) setIsNotificationsLoading(false);
    }
  }, []);

  const loadOrderDetail = useCallback(async (order, { openStatus = false, printReceipt = false } = {}) => {
    const orderId = getOrderId(order);
    if (!orderId) {
      setOrdersError("ID pesanan tidak ditemukan.");
      return;
    }

    setSelectedOrder(order);
    setRawOrderDetail(null);
    setOrderDetailError("");
    setIsOrderDetailLoading(true);
    setAdminView("orderDetail");
    setActiveOrderMenuId(null);
    setIsSidebarOpen(false);

    try {
      const data = await fetchOrderDetail(orderId);
      setRawOrderDetail(data);
      setIsStatusEditorOpen(openStatus);
      setPendingPrint(printReceipt);
    } catch (err) {
      setOrderDetailError(err instanceof Error ? err.message : "Gagal memuat detail pesanan.");
    } finally {
      setIsOrderDetailLoading(false);
    }
  }, []);

  const handleUpdateOrderStatus = useCallback(async (nextStatus) => {
    const orderId = getOrderId(selectedOrder);
    if (!orderId) {
      setOrderDetailError("ID pesanan tidak ditemukan.");
      return;
    }

    setIsSavingOrderStatus(true);
    setOrderDetailError("");
    try {
      await updateOrderStatus(orderId, { status: toBackendOrderStatus(nextStatus) });
      setIsStatusEditorOpen(false);
      await loadOrderDetail(selectedOrder);
      loadOrders();
    } catch (err) {
      setOrderDetailError(err instanceof Error ? err.message : "Gagal memperbarui status pesanan.");
    } finally {
      setIsSavingOrderStatus(false);
    }
  }, [selectedOrder, loadOrderDetail, loadOrders]);

  const openCustomerDialog = useCallback(async (customer, mode) => {
    const customerId = getCustomerId(customer);
    if (!customerId) {
      setCustomersError("ID pelanggan tidak ditemukan.");
      return;
    }

    setSelectedCustomer(customer);
    setRawCustomerDetail(null);
    setRawCustomerOrders([]);
    setCustomerModalMode(mode);
    setCustomerDetailError("");
    setCustomerOrdersError("");
    setActiveCustomerMenuId(null);
    setIsSidebarOpen(false);

    if (mode === "orders") {
      setIsCustomerOrdersLoading(true);
      try {
        const data = await fetchCustomerOrders(customerId);
        setRawCustomerOrders(extractOrders(data));
      } catch (err) {
        setCustomerOrdersError(err instanceof Error ? err.message : "Gagal memuat riwayat pesanan.");
      } finally {
        setIsCustomerOrdersLoading(false);
      }
      return;
    }

    setIsCustomerDetailLoading(true);
    if (mode === "profile") setIsCustomerOrdersLoading(true);
    try {
      if (mode === "profile") {
        const [detailResult, ordersResult] = await Promise.allSettled([
          fetchCustomerDetail(customerId),
          fetchCustomerOrders(customerId),
        ]);

        if (detailResult.status === "fulfilled") {
          setRawCustomerDetail(detailResult.value);
        } else {
          setCustomerDetailError(detailResult.reason instanceof Error ? detailResult.reason.message : "Gagal memuat detail pelanggan.");
        }

        if (ordersResult.status === "fulfilled") {
          setRawCustomerOrders(extractOrders(ordersResult.value));
        } else {
          setCustomerOrdersError(ordersResult.reason instanceof Error ? ordersResult.reason.message : "Gagal memuat riwayat pesanan.");
        }
      } else {
        const data = await fetchCustomerDetail(customerId);
        setRawCustomerDetail(data);
      }
    } catch (err) {
      setCustomerDetailError(err instanceof Error ? err.message : "Gagal memuat detail pelanggan.");
    } finally {
      setIsCustomerDetailLoading(false);
      if (mode === "profile") setIsCustomerOrdersLoading(false);
    }
  }, []);

  const closeCustomerDialog = useCallback(() => {
    setCustomerModalMode("");
    setSelectedCustomer(null);
    setRawCustomerDetail(null);
    setRawCustomerOrders([]);
    setCustomerDetailError("");
    setCustomerOrdersError("");
    setIsCustomerDetailLoading(false);
    setIsCustomerOrdersLoading(false);
    setIsSavingCustomer(false);
  }, []);

  const handleSaveCustomer = useCallback(async (formValues) => {
    const customerId = getCustomerId(customerDetail || selectedCustomer);
    if (!customerId) return;

    setIsSavingCustomer(true);
    setCustomerDetailError("");

    try {
      await updateCustomerData(customerId, buildCustomerPayload(formValues));
      await loadCustomers();
      const data = await fetchCustomerDetail(customerId);
      setRawCustomerDetail(data);
      const updatedNormalized = normalizeCustomerDetail(data, selectedCustomer);
      setSelectedCustomer(updatedNormalized);
      setCustomerModalMode("profile");
    } catch (err) {
      setCustomerDetailError(err instanceof Error ? err.message : "Gagal menyimpan data pelanggan.");
    } finally {
      setIsSavingCustomer(false);
    }
  }, [customerDetail, loadCustomers, selectedCustomer]);

  const openAccountDialog = useCallback(async (account, mode = "edit") => {
    if (mode === "create") {
      setSelectedAccount(null);
      setRawAccountDetail(null);
      setAccountModalMode("create");
      setAccountError("");
      setActiveAccountMenuId(null);
      return;
    }

    const accountId = getAccountId(account);
    if (!accountId) {
      setAccountsError("ID akun tidak ditemukan.");
      return;
    }

    setSelectedAccount(account);
    setRawAccountDetail(null);
    setAccountModalMode(mode);
    setAccountError("");
    setActiveAccountMenuId(null);
    setIsAccountDetailLoading(true);

    try {
      const data = await readAccount(accountId);
      setRawAccountDetail(data);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Gagal memuat detail akun.");
    } finally {
      setIsAccountDetailLoading(false);
    }
  }, []);

  const closeAccountDialog = useCallback(() => {
    setAccountModalMode("");
    setSelectedAccount(null);
    setRawAccountDetail(null);
    setAccountError("");
    setIsAccountDetailLoading(false);
    setIsSavingAccount(false);
  }, []);

  const handleSaveAccount = useCallback(async (formValues) => {
    const isCreate = accountModalMode === "create";
    const accountId = getAccountId(accountDetail || selectedAccount);

    if (!isCreate && !accountId) {
      setAccountError("ID akun tidak ditemukan.");
      return;
    }

    setIsSavingAccount(true);
    setAccountError("");

    try {
      if (isCreate) {
        await createAccount(buildAccountPayload(formValues, { isCreate: true, includeStatus: true }));
      } else {
        const payload = buildAccountPayload(formValues, { isCreate: false, includeStatus: false });
        await updateAccount(accountId, payload);

        if (formValues.status && formValues.status !== accountDetail?.status) {
          await updateAccountStatus(accountId, buildAccountStatusPayload(formValues.status));
        }
      }

      closeAccountDialog();
      await Promise.all([loadAccounts(), loadAccountsSummary()]);

      if (isCurrentAdminAccount(accountDetail || selectedAccount)) {
        await refreshAdminProfile();
      }
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Gagal menyimpan akun.");
    } finally {
      setIsSavingAccount(false);
    }
  }, [
    accountDetail,
    accountModalMode,
    closeAccountDialog,
    isCurrentAdminAccount,
    loadAccounts,
    loadAccountsSummary,
    refreshAdminProfile,
    selectedAccount,
  ]);

  const handleToggleAccountStatus = useCallback(async (account) => {
    const accountId = getAccountId(account);
    if (!accountId) {
      setAccountsError("ID akun tidak ditemukan.");
      return;
    }

    const nextStatus = account.isActive ? "inactive" : "active";
    setActiveAccountMenuId(null);
    setAccountsError("");
    setIsSavingAccount(true);

    try {
      await updateAccountStatus(accountId, buildAccountStatusPayload(nextStatus));
      await Promise.all([loadAccounts(), loadAccountsSummary()]);
    } catch (err) {
      setAccountsError(err instanceof Error ? err.message : "Gagal mengubah status akun.");
    } finally {
      setIsSavingAccount(false);
    }
  }, [loadAccounts, loadAccountsSummary]);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard]);

  useEffect(() => {
    const controller = new AbortController();

    fetchMe({ signal: controller.signal })
      .then((me) => {
        const user = me?.data?.user || me?.data?.data?.user || me?.user || me?.data || me;
        if (!user || typeof user !== "object") return;
        localStorage.setItem("authUser", JSON.stringify(user));
        setAdminUser(buildAdminUser(user));
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadNotifications(controller.signal);
    return () => controller.abort();
  }, [loadNotifications]);

  useEffect(() => {
    if (typeof WebSocket === "undefined") return undefined;

    let socket = null;
    let reconnectTimer = 0;
    let didClose = false;

    const connect = () => {
      try {
        socket = createNotificationsSocket();
      } catch {
        return;
      }

      socket.onmessage = (event) => {
        let payload = event.data;
        try {
          payload = JSON.parse(event.data);
        } catch {
          payload = { message: event.data };
        }

        const incoming = extractNotifications(payload);
        const nextUnread = extractUnreadCount(payload);

        if (incoming.length) {
          setRawNotifications((items) => mergeNotifications(incoming, items));
          setUnreadNotifications((count) => nextUnread ?? count + incoming.filter((item) => !isNotificationRead(item)).length);
          return;
        }

        if (nextUnread !== null) {
          setUnreadNotifications(nextUnread);
          return;
        }

        loadNotifications();
      };

      socket.onclose = () => {
        if (didClose) return;
        reconnectTimer = window.setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      didClose = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (adminView !== "categories") return undefined;
    const controller = new AbortController();
    loadCategories(controller.signal);
    return () => controller.abort();
  }, [adminView, loadCategories]);

  useEffect(() => {
    if (adminView !== "vouchers") return undefined;
    const controller = new AbortController();
    loadVouchers(controller.signal);
    return () => controller.abort();
  }, [adminView, loadVouchers]);

  useEffect(() => {
    if (adminView !== "orders") return undefined;
    const controller = new AbortController();
    loadOrders(controller.signal);
    return () => controller.abort();
  }, [adminView, loadOrders]);

  useEffect(() => {
    if (adminView !== "customers") return undefined;
    const controller = new AbortController();
    loadCustomers(controller.signal);
    return () => controller.abort();
  }, [adminView, loadCustomers]);

  useEffect(() => {
    if (adminView !== "accounts") return undefined;
    const controller = new AbortController();
    loadAccounts(controller.signal);
    return () => controller.abort();
  }, [adminView, loadAccounts]);

  useEffect(() => {
    if (adminView !== "accounts") return undefined;
    const controller = new AbortController();
    loadAccountsSummary(controller.signal);
    return () => controller.abort();
  }, [adminView, loadAccountsSummary]);

  useEffect(() => {
    if (!isSettingsOpen) return undefined;

    const closeSettings = (event) => {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
        return;
      }

      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeSettings);
    document.addEventListener("keydown", closeSettings);
    return () => {
      document.removeEventListener("mousedown", closeSettings);
      document.removeEventListener("keydown", closeSettings);
    };
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;

    const closeNotifications = (event) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
        return;
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeNotifications);
    document.addEventListener("keydown", closeNotifications);
    return () => {
      document.removeEventListener("mousedown", closeNotifications);
      document.removeEventListener("keydown", closeNotifications);
    };
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (!activeOrderMenuId && !activeCustomerMenuId && !activeAccountMenuId && !activeVoucherMenuId) return undefined;

    const closeActionMenu = (event) => {
      if (event.key === "Escape") {
        setActiveOrderMenuId(null);
        setActiveCustomerMenuId(null);
        setActiveAccountMenuId(null);
        setActiveVoucherMenuId(null);
        return;
      }

      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActiveOrderMenuId(null);
        setActiveCustomerMenuId(null);
        setActiveAccountMenuId(null);
        setActiveVoucherMenuId(null);
      }
    };

    document.addEventListener("mousedown", closeActionMenu);
    document.addEventListener("keydown", closeActionMenu);
    return () => {
      document.removeEventListener("mousedown", closeActionMenu);
      document.removeEventListener("keydown", closeActionMenu);
    };
  }, [activeAccountMenuId, activeCustomerMenuId, activeOrderMenuId, activeVoucherMenuId]);

  useEffect(() => {
    if (!pendingPrint || isOrderDetailLoading || !orderDetail) return;
    setPendingPrint(false);
    window.setTimeout(() => window.print(), 120);
  }, [isOrderDetailLoading, orderDetail, pendingPrint]);

  const handleToggleNotifications = useCallback(() => {
    setIsSettingsOpen(false);
    setIsNotificationsOpen((open) => {
      const nextOpen = !open;
      if (nextOpen && !rawNotifications.length) {
        loadNotifications();
      }
      return nextOpen;
    });
  }, [loadNotifications, rawNotifications.length]);

  const handleMarkNotificationRead = useCallback(async (notification) => {
    if (!notification?.apiId || notification.isRead) return;

    setRawNotifications((items) =>
      items.map((item) => (getNotificationId(item) === notification.apiId ? { ...item, is_read: true, isRead: true, read_at: new Date().toISOString() } : item))
    );
    setUnreadNotifications((count) => Math.max(0, count - 1));

    try {
      await markNotificationRead(notification.apiId);
    } catch (err) {
      setNotificationsError(err instanceof Error ? err.message : "Gagal menandai notifikasi dibaca.");
      loadNotifications();
    }
  }, [loadNotifications]);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (!notifications.length) return;

    setRawNotifications((items) => items.map((item) => ({ ...item, is_read: true, isRead: true, read_at: item.read_at || new Date().toISOString() })));
    setUnreadNotifications(0);

    try {
      await markAllNotificationsRead();
    } catch (err) {
      setNotificationsError(err instanceof Error ? err.message : "Gagal menandai semua notifikasi dibaca.");
      loadNotifications();
    }
  }, [loadNotifications, notifications.length]);

  const handleLogout = useCallback(() => {
    setLogoutConfirmOpen(true);
  }, []);

  const handleLogoutConfirmed = useCallback(() => {
    setIsSettingsOpen(false);
    onLogout?.();
  }, [onLogout]);

  const handleViewChange = useCallback((nextView) => {
    if (!["dashboard", "orders", "categories", "vouchers", "customers", "accounts"].includes(nextView)) return;
    setAdminView(nextView);
    setOrdersError("");
    setOrderDetailError("");
    setCategoriesError("");
    setCustomersError("");
    setAccountsError("");
    setAccountError("");
    setCustomerDetailError("");
    setCustomerOrdersError("");
    setVouchersError("");
    setActiveOrderMenuId(null);
    setActiveCustomerMenuId(null);
    setActiveAccountMenuId(null);
    setActiveVoucherMenuId(null);
    setIsStatusEditorOpen(false);
    setIsCategoryModalOpen(false);
    setIsVoucherModalOpen(false);
    setVoucherModalMode("");
    setAccountModalMode("");
    setCustomerModalMode("");
    setIsNotificationsOpen(false);
    setIsAccountFilterOpen(false);
    setIsCustomerFilterOpen(false);
    setSelectedCustomer(null);
    setSelectedAccount(null);
    setSelectedVoucher(null);
    setEditingCategory(null);
    setDeletingCategory(null);
    setDeletingVoucher(null);
    if (nextView !== "orderDetail") {
      setPendingPrint(false);
    }
    setIsSidebarOpen(false);
  }, []);

  const handleOpenCreateCategory = useCallback(() => {
    setEditingCategory(null);
    setCategoriesError("");
    setIsCategoryModalOpen(true);
  }, []);

  const handleOpenEditCategory = useCallback((category) => {
    setEditingCategory(category);
    setCategoriesError("");
    setIsCategoryModalOpen(true);
  }, []);

  const handleSaveCategory = useCallback(async (formValues) => {
    setIsSavingCategory(true);
    setCategoriesError("");

    try {
      if (editingCategory) {
        const categoryId = getCategoryApiId(editingCategory);
        if (!categoryId) throw new Error("ID kategori tidak ditemukan.");
        await updateCategory(categoryId, buildCategoryPayload(formValues));
      } else {
        await createCategory(buildCategoryPayload(formValues));
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      await loadCategories();
    } catch (err) {
      setCategoriesError(err instanceof Error ? err.message : "Gagal menyimpan kategori.");
    } finally {
      setIsSavingCategory(false);
    }
  }, [editingCategory, loadCategories]);

  const handleConfirmDeleteCategory = useCallback(async () => {
    if (!deletingCategory) return;

    const categoryId = getCategoryApiId(deletingCategory);
    if (!categoryId) {
      setCategoriesError("ID kategori tidak ditemukan.");
      return;
    }

    setIsSavingCategory(true);
    setCategoriesError("");

    try {
      await deleteCategory(categoryId);
      setRawCategories((items) =>
        extractCategories(items).filter((item) => String(getCategoryId(item)) !== String(categoryId))
      );
      setDeletingCategory(null);
    } catch (err) {
      setCategoriesError(formatCategoryDeleteError(err));
    } finally {
      setIsSavingCategory(false);
    }
  }, [deletingCategory]);

  const handleOpenCreateVoucher = useCallback(() => {
    setVoucherModalMode("create");
    setEditingVoucher(null);
    setSelectedVoucher(null);
    setRawVoucherDetail(null);
    setVouchersError("");
    setIsVoucherModalOpen(true);
    setIsSidebarOpen(false);
  }, []);

  const handleOpenEditVoucher = useCallback(async (voucher) => {
    const voucherId = getVoucherApiId(voucher);
    if (!voucherId) {
      setVouchersError("ID voucher tidak ditemukan.");
      return;
    }

    setVoucherModalMode("edit");
    setEditingVoucher(voucher);
    setSelectedVoucher(voucher);
    setRawVoucherDetail(null);
    setVouchersError("");
    setIsVoucherDetailLoading(true);
    setIsVoucherModalOpen(true);
    setIsSidebarOpen(false);

    try {
      const data = await readVoucher(voucherId);
      setRawVoucherDetail(data);
    } catch (err) {
      setVouchersError(err instanceof Error ? err.message : "Gagal memuat detail voucher.");
    } finally {
      setIsVoucherDetailLoading(false);
    }
  }, []);

  const handleCloseVoucherDialog = useCallback(() => {
    setIsVoucherModalOpen(false);
    setVoucherModalMode("");
    setEditingVoucher(null);
    setSelectedVoucher(null);
    setRawVoucherDetail(null);
    setVouchersError("");
    setIsVoucherDetailLoading(false);
    setIsSavingVoucher(false);
  }, []);

  const handleSaveVoucher = useCallback(async (formValues) => {
    const isCreate = voucherModalMode === "create";
    const voucherId = getVoucherApiId(voucherDetail || editingVoucher);

    if (!isCreate && !voucherId) {
      setVouchersError("ID voucher tidak ditemukan.");
      return;
    }

    setIsSavingVoucher(true);
    setVouchersError("");

    try {
      if (isCreate) {
        await createVoucher(buildVoucherPayload(formValues, { isCreate: true }));
      } else {
        await updateVoucher(voucherId, buildVoucherPayload(formValues, { isCreate: false }));
      }
      handleCloseVoucherDialog();
      await loadVouchers();
    } catch (err) {
      setVouchersError(err instanceof Error ? err.message : "Gagal menyimpan voucher.");
    } finally {
      setIsSavingVoucher(false);
    }
  }, [editingVoucher, handleCloseVoucherDialog, loadVouchers, voucherDetail, voucherModalMode]);

  const handleConfirmDeleteVoucher = useCallback(async () => {
    if (!deletingVoucher) return;

    const voucherId = getVoucherApiId(deletingVoucher);
    if (!voucherId) {
      setVouchersError("ID voucher tidak ditemukan.");
      return;
    }

    setIsSavingVoucher(true);
    setVouchersError("");

    try {
      await deleteVoucher(voucherId);
      setRawVouchers((items) =>
        extractVouchers(items).filter((item) => String(getVoucherId(item)) !== String(voucherId))
      );
      setDeletingVoucher(null);
    } catch (err) {
      setVouchersError(err instanceof Error ? err.message : "Gagal menghapus voucher.");
    } finally {
      setIsSavingVoucher(false);
    }
  }, [deletingVoucher]);

  return (
    <main className={`admin-shell ${isOrderWorkspace ? "admin-shell--orders" : ""} ${adminView === "categories" ? "admin-shell--categories" : ""}`}>
      <aside className={`admin-sidebar ${isSidebarOpen ? "is-open" : ""}`}>
        <button type="button" className="admin-brand" onClick={onGoHome} title="Kembali ke landing page">
          <span className="admin-brand__logo">
            <img src="/logo.png" alt="BumiKriya" />
          </span>
          <span>
            <strong>BumiKriya</strong>
            <small>Admin Studio</small>
          </span>
        </button>

        <nav className="admin-nav" aria-label="Navigasi admin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = adminView === item.view || (isOrderDetail && item.view === "orders");
            return (
              <button
                key={item.label}
                type="button"
                className={`admin-nav__item ${active ? "is-active" : ""}`}
                onClick={() => handleViewChange(item.view)}
              >
                <Icon size={20} strokeWidth={2.2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="admin-main">
        {!isOrderWorkspace && (
        <header className={`admin-topbar ${adminView === "categories" ? "admin-topbar--categories" : ""}`}>
          <button
            type="button"
            className="admin-mobile-menu"
            aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {adminView !== "categories" && (
            <div className="admin-breadcrumb">
              <span>Home</span>
              <ChevronRight size={16} />
                <strong>{adminView === "customers" ? "Pelanggan" : adminView === "accounts" ? "Kelola Akun" : adminView === "orders" ? "Pesanan" : adminView === "vouchers" ? "Voucher" : "Dashboard"}</strong>
            </div>
          )}

          <label className="admin-search">
            <Search size={21} strokeWidth={2.2} />
            <input
              type="search"
                value={adminView === "categories" ? categoryQuery : adminView === "vouchers" ? voucherQuery : adminView === "customers" ? customerQuery : adminView === "accounts" ? accountQuery : ""}
              onChange={(event) => {
                if (adminView === "categories") setCategoryQuery(event.target.value);
                if (adminView === "vouchers") setVoucherQuery(event.target.value);
                if (adminView === "customers") setCustomerQuery(event.target.value);
                if (adminView === "accounts") setAccountQuery(event.target.value);
              }}
                placeholder={adminView === "categories" ? "Cari kategori..." : adminView === "vouchers" ? "Cari voucher..." : adminView === "customers" ? "Cari pelanggan..." : adminView === "accounts" ? "Cari akun..." : "Cari pesanan, produk.."}
              aria-label={adminView === "categories" ? "Cari kategori" : adminView === "vouchers" ? "Cari voucher" : adminView === "customers" ? "Cari pelanggan" : adminView === "accounts" ? "Cari akun" : "Cari pesanan atau produk"}
            />
          </label>

          <div className="admin-actions">
            <div className="admin-notifications" ref={notificationRef}>
              <button
                type="button"
                className="admin-notification-button"
                aria-label="Notifikasi"
                aria-haspopup="dialog"
                aria-expanded={isNotificationsOpen}
                onClick={handleToggleNotifications}
              >
                <Bell size={21} strokeWidth={2.3} />
                {unreadNotifications > 0 && (
                  <span className="admin-notification-badge">{formatBadgeCount(unreadNotifications)}</span>
                )}
              </button>
              {isNotificationsOpen && (
                <NotificationsDropdown
                  error={notificationsError}
                  isLoading={isNotificationsLoading}
                  notifications={notifications}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                  onNotificationClick={handleMarkNotificationRead}
                  onRefresh={() => loadNotifications()}
                />
              )}
            </div>
            <div className="admin-settings" ref={settingsRef}>
              <button
                type="button"
                aria-label="Pengaturan"
                aria-haspopup="menu"
                aria-expanded={isSettingsOpen}
                onClick={() => {
                  setIsNotificationsOpen(false);
                  setIsSettingsOpen((open) => !open);
                }}
              >
                <Settings size={22} strokeWidth={2.3} />
              </button>
              {isSettingsOpen && (
                <div className="admin-settings-menu" role="menu">
                  <div className="admin-settings-menu__profile">
                    <span className="admin-account-avatar-mini admin-account-avatar-mini--settings">
                      {adminUser.avatar ? <img src={adminUser.avatar} alt={adminUser.name} loading="lazy" /> : adminUser.initials}
                    </span>
                    <div>
                      <strong>{adminUser.name}</strong>
                      {adminUser.email && <span>{adminUser.email}</span>}
                    </div>
                  </div>
                  <button type="button" role="menuitem" className="admin-settings-menu__item" onClick={handleLogout}>
                    <LogOut size={17} strokeWidth={2.4} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
            {adminUser.avatar ? (
              <img src={adminUser.avatar} alt={adminUser.name} className="admin-avatar" />
            ) : (
              <span className="admin-avatar admin-avatar--fallback" title={adminUser.name}>
                {adminUser.initials}
              </span>
            )}
          </div>
        </header>
        )}

        {adminView === "orders" ? (
          <OrderManagementPage
            activeMenuId={activeOrderMenuId}
            actionMenuRef={actionMenuRef}
            error={ordersError}
            isLoading={isOrdersLoading}
            orders={visibleOrders}
            query={orderQuery}
            rawCount={orders.length}
            status={orderStatus}
            onAction={(order, action) => {
              if (action === "detail") loadOrderDetail(order);
              if (action === "status") loadOrderDetail(order, { openStatus: true });
              if (action === "print") loadOrderDetail(order, { printReceipt: true });
              if (action === "cancel") loadOrderDetail(order, { openStatus: true });
            }}
            onMenuToggle={(orderId) => setActiveOrderMenuId((current) => (current === orderId ? null : orderId))}
            onQueryChange={setOrderQuery}
            onRefresh={() => loadOrders()}
            onStatusChange={setOrderStatus}
            onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
            isSidebarOpen={isSidebarOpen}
          />
        ) : isOrderDetail ? (
          <OrderDetailPage
            detail={orderDetail}
            error={orderDetailError}
            isLoading={isOrderDetailLoading}
            isStatusEditorOpen={isStatusEditorOpen}
            isSavingStatus={isSavingOrderStatus}
            onBack={() => handleViewChange("orders")}
            onCloseStatusEditor={() => setIsStatusEditorOpen(false)}
            onEditStatus={() => setIsStatusEditorOpen(true)}
            onSaveStatus={handleUpdateOrderStatus}
            onPrint={() => window.print()}
            onRefresh={() => selectedOrder && loadOrderDetail(selectedOrder)}
            onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
            isSidebarOpen={isSidebarOpen}
          />
        ) : adminView === "categories" ? (
          <CategoryManagementPage
            categories={visibleCategories}
            error={categoriesError}
            isLoading={isCategoriesLoading}
            rawCount={categories.length}
            onAdd={handleOpenCreateCategory}
            onDelete={setDeletingCategory}
            onEdit={handleOpenEditCategory}
            onRefresh={() => loadCategories()}
          />
        ) : adminView === "vouchers" ? (
          <VoucherManagementPage
            activeMenuId={activeVoucherMenuId}
            actionMenuRef={actionMenuRef}
            vouchers={visibleVouchers}
            error={vouchersError}
            isLoading={isVouchersLoading}
            rawCount={vouchers.length}
            stats={voucherStats}
            onAdd={handleOpenCreateVoucher}
            onMenuToggle={(voucherId) => setActiveVoucherMenuId((current) => (current === voucherId ? null : voucherId))}
            onAction={(voucher, action) => {
              if (action === "edit" || action === "detail") handleOpenEditVoucher(voucher);
              if (action === "delete") setDeletingVoucher(voucher);
            }}
            onRefresh={() => loadVouchers()}
          />
        ) : adminView === "accounts" ? (
          <AccountManagementPage
            activeMenuId={activeAccountMenuId}
            actionMenuRef={actionMenuRef}
            accounts={visibleAccounts}
            error={accountsError}
            isLoading={isAccountsLoading}
            rawCount={accounts.length}
            stats={accountStats}
            summary={accountsSummary}
            summaryError={accountsSummaryError}
            isSummaryLoading={isAccountsSummaryLoading}
            roleFilter={accountRoleFilter}
            statusFilter={accountStatusFilter}
            isFilterOpen={isAccountFilterOpen}
            onRoleFilterChange={setAccountRoleFilter}
            onStatusFilterChange={setAccountStatusFilter}
            onToggleFilter={() => setIsAccountFilterOpen((open) => !open)}
            onAction={(account, action) => {
              if (action === "edit" || action === "role") openAccountDialog(account, action);
              if (action === "status") handleToggleAccountStatus(account);
            }}
            onAdd={() => openAccountDialog(null, "create")}
            onMenuToggle={(accountId) => setActiveAccountMenuId((current) => (current === accountId ? null : accountId))}
            onRefresh={() => {
              loadAccounts();
              loadAccountsSummary();
            }}
          />
        ) : adminView === "customers" ? (
          <CustomerManagementPage
            activeMenuId={activeCustomerMenuId}
            actionMenuRef={actionMenuRef}
            customers={visibleCustomers}
            error={customersError}
            isLoading={isCustomersLoading}
            rawCount={customers.length}
            stats={customerStats}
            memberFilter={customerMemberFilter}
            isFilterOpen={isCustomerFilterOpen}
            onMemberFilterChange={setCustomerMemberFilter}
            onToggleFilter={() => setIsCustomerFilterOpen((open) => !open)}
            onAction={(customer, action) => {
              if (action === "profile") openCustomerDialog(customer, "profile");
              if (action === "edit") openCustomerDialog(customer, "edit");
              if (action === "orders") openCustomerDialog(customer, "orders");
            }}
            onMenuToggle={(customerId) => setActiveCustomerMenuId((current) => (current === customerId ? null : customerId))}
            onRefresh={() => loadCustomers()}
          />
        ) : (
          <DashboardHome
            dashboard={dashboard}
            error={error}
            isLoading={isLoading}
            onRefresh={() => loadDashboard()}
            onViewOrders={() => handleViewChange("orders")}
            adminUser={adminUser}
          />
        )}
      </div>

      {isCategoryModalOpen && (
        <CategoryModal
          category={editingCategory}
          error={categoriesError}
          isSaving={isSavingCategory}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
            setCategoriesError("");
          }}
          onSubmit={handleSaveCategory}
        />
      )}

      {accountModalMode && (
        <AccountModal
          account={accountDetail}
          error={accountError}
          isLoading={isAccountDetailLoading}
          mode={accountModalMode}
          isSaving={isSavingAccount}
          onClose={closeAccountDialog}
          onSubmit={handleSaveAccount}
        />
      )}

      {deletingCategory && (
        <CategoryDeleteDialog
          category={deletingCategory}
          error={categoriesError}
          isDeleting={isSavingCategory}
          onCancel={() => {
            setDeletingCategory(null);
            setCategoriesError("");
          }}
          onConfirm={handleConfirmDeleteCategory}
        />
      )}

      {isVoucherModalOpen && (
        <VoucherModal
          voucher={voucherDetail}
          error={vouchersError}
          isLoading={isVoucherDetailLoading}
          mode={voucherModalMode}
          isSaving={isSavingVoucher}
          onClose={handleCloseVoucherDialog}
          onSubmit={handleSaveVoucher}
        />
      )}

      {deletingVoucher && (
        <VoucherDeleteDialog
          voucher={deletingVoucher}
          error={vouchersError}
          isDeleting={isSavingVoucher}
          onCancel={() => {
            setDeletingVoucher(null);
            setVouchersError("");
          }}
          onConfirm={handleConfirmDeleteVoucher}
        />
      )}

      {customerModalMode === "profile" && (
        <CustomerProfileDialog
          customer={customerDetail}
          error={customerDetailError}
          isLoading={isCustomerDetailLoading}
          orders={customerOrders}
          onClose={closeCustomerDialog}
          onEdit={() => setCustomerModalMode("edit")}
        />
      )}

      {customerModalMode === "edit" && (
        <CustomerEditDialog
          customer={customerDetail}
          error={customerDetailError}
          isLoading={isCustomerDetailLoading}
          isSaving={isSavingCustomer}
          onClose={closeCustomerDialog}
          onSubmit={handleSaveCustomer}
        />
      )}

      {customerModalMode === "orders" && (
        <CustomerOrdersDialog
          customer={selectedCustomer}
          error={customerOrdersError}
          isLoading={isCustomerOrdersLoading}
          orders={customerOrders}
          onClose={closeCustomerDialog}
        />
      )}

      {isSidebarOpen && <button type="button" className="admin-scrim" aria-label="Tutup menu" onClick={() => setIsSidebarOpen(false)} />}

      <ConfirmDialog
        open={logoutConfirmOpen}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          handleLogoutConfirmed();
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </main>
  );
}

function DashboardHome({ dashboard, error, isLoading, onRefresh, onViewOrders, adminUser }) {
  return (
    <section className="admin-content">
      <div className="admin-heading">
            <div>
              <h1>Selamat Datang, {adminUser.firstName}</h1>
              <p>Berikut ringkasan toko Anda hari ini.</p>
            </div>

            <button type="button" className="admin-refresh" onClick={onRefresh} disabled={isLoading}>
              <RefreshCcw size={17} className={isLoading ? "is-spinning" : ""} />
              <span>{isLoading ? "Memuat" : "Refresh"}</span>
            </button>
          </div>

          {error && (
            <div className="admin-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={onRefresh}>
                Coba lagi
              </button>
            </div>
          )}

          <section className="admin-metrics" aria-label="Ringkasan toko">
            {metricCards.map((card) => {
              const Icon = card.icon;
              const changeText = dashboard[card.changeKey];
              return (
                <article key={card.key} className="admin-card admin-metric">
                  <div className={`admin-metric__icon admin-metric__icon--${card.accent}`}>
                    <Icon size={23} strokeWidth={2.35} />
                  </div>
                  <div className="admin-metric__label">{card.label}</div>
                  <strong className={isLoading ? "admin-skeleton admin-skeleton--value" : ""}>
                    {isLoading ? "" : card.formatter(dashboard[card.key])}
                  </strong>
                  <div className="admin-metric__change">
                    {changeText ? (
                      <>
                        <TrendingUp size={14} strokeWidth={2.8} />
                        <span>{changeText}</span>
                      </>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="admin-dashboard-grid">
            <article className="admin-card admin-top-sellers-card">
              <div className="admin-card__head">
                <h2>Top Seller Penghasilan Terbanyak</h2>
              </div>
              <TopSellersChart sellers={dashboard.topSellers} isLoading={isLoading} />
            </article>

            <article className="admin-card admin-orders-card">
              <div className="admin-orders__head">
                <h2>Pesanan Terbaru</h2>
                <button type="button" onClick={onViewOrders}>Lihat Semua</button>
              </div>

              <div className="admin-orders">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div className="admin-order admin-order--loading" key={index}>
                      <span className="admin-order__icon" />
                      <div className="admin-skeleton admin-skeleton--order" />
                      <div className="admin-skeleton admin-skeleton--pill" />
                    </div>
                  ))
                ) : dashboard.recentOrders.length ? (
                  dashboard.recentOrders.map((order) => <OrderItem key={order.id} order={order} />)
                ) : (
                  <div className="admin-empty-orders">
                    <BriefcaseBusiness size={24} />
                    <span>Belum ada pesanan terbaru.</span>
                  </div>
                )}
              </div>
            </article>
          </section>
        </section>
  );
}

function NotificationsDropdown({
  error,
  isLoading,
  notifications,
  onMarkAllRead,
  onNotificationClick,
  onRefresh,
}) {
  const hasUnread = notifications.some((notification) => !notification.isRead);

  return (
    <section className="admin-notification-popover" role="dialog" aria-labelledby="admin-notification-title">
      <div className="admin-notification-popover__head">
        <h2 id="admin-notification-title">Notifikasi</h2>
        <button type="button" onClick={onMarkAllRead} disabled={!hasUnread || isLoading}>
          Tandai semua dibaca
        </button>
      </div>

      {error && (
        <div className="admin-notification-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      <div className="admin-notification-list">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div className="admin-notification-item admin-notification-item--loading" key={index}>
              <span className="admin-skeleton admin-notification-item__icon" />
              <div>
                <span className="admin-skeleton admin-notification-item__title" />
                <span className="admin-skeleton admin-notification-item__message" />
                <span className="admin-skeleton admin-notification-item__time" />
              </div>
            </div>
          ))
        ) : notifications.length ? (
          notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <button
                type="button"
                className={`admin-notification-item ${notification.isRead ? "" : "is-unread"}`}
                key={notification.id}
                onClick={() => onNotificationClick(notification)}
              >
                <span className={`admin-notification-item__icon admin-notification-item__icon--${notification.accent}`}>
                  <Icon size={23} strokeWidth={2.2} />
                </span>
                <span className="admin-notification-item__body">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <time>{notification.displayTime}</time>
                </span>
              </button>
            );
          })
        ) : (
          <div className="admin-notification-empty">
            <Bell size={24} strokeWidth={2.2} />
            <span>Belum ada notifikasi.</span>
          </div>
        )}
      </div>

      <button type="button" className="admin-notification-popover__foot" onClick={onRefresh} disabled={isLoading}>
        Lihat semua notifikasi
      </button>
    </section>
  );
}

function AccountManagementPage({
  accounts,
  activeMenuId,
  actionMenuRef,
  error,
  isLoading,
  isSummaryLoading,
  onAction,
  onAdd,
  onMenuToggle,
  onRefresh,
  rawCount,
  stats,
  summaryError,
  roleFilter,
  statusFilter,
  isFilterOpen,
  onRoleFilterChange,
  onStatusFilterChange,
  onToggleFilter,
}) {
  const isFilterActive = roleFilter !== "Semua Peran" || statusFilter !== "Semua Status";
  const filterRef = useRef(null);

  useEffect(() => {
    if (!isFilterOpen) return undefined;

    const closeFilter = (event) => {
      if (event.key === "Escape") {
        onToggleFilter();
        return;
      }

      if (filterRef.current && !filterRef.current.contains(event.target)) {
        onToggleFilter();
      }
    };

    document.addEventListener("mousedown", closeFilter);
    document.addEventListener("keydown", closeFilter);
    return () => {
      document.removeEventListener("mousedown", closeFilter);
      document.removeEventListener("keydown", closeFilter);
    };
  }, [isFilterOpen, onToggleFilter]);

  return (
    <section className="admin-content admin-content--accounts">
      <div className="admin-account-heading">
        <div>
          <h1>Kelola Akun</h1>
          <p>Kelola akses dan peran administrator Studio Anda. Pastikan setiap anggota tim memiliki tingkat izin yang tepat.</p>
        </div>
        <button type="button" className="admin-account-add" onClick={onAdd}>
          <UserCog size={20} strokeWidth={2.6} />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      <div className="admin-account-overview">
        <section className="admin-account-total-card">
          <span className="admin-account-total-card__icon">
            <UsersRound size={22} strokeWidth={2.4} />
          </span>
          <small>Total Administrator</small>
          <strong>{isSummaryLoading ? "..." : `${formatCompactNumber(stats.total)} Akun`}</strong>
          <span className="admin-account-total-card__note">
            <UserCog size={14} strokeWidth={2.4} />
            {stats.verifiedText}
          </span>
        </section>

        <section className="admin-account-role-card">
          <div className="admin-account-role-card__title">
            <UserCog size={18} strokeWidth={2.4} />
            <span>Distribusi Peran Aktif</span>
          </div>
          <div className="admin-account-role-card__counts">
            <div>
              <strong>{formatCompactNumber(stats.admin)}</strong>
              <span>Admin</span>
            </div>
            <div>
              <strong>{formatCompactNumber(stats.seller)}</strong>
              <span>Seller</span>
            </div>
            <div>
              <strong>{formatCompactNumber(stats.user)}</strong>
              <span>User/Customer</span>
            </div>
          </div>
        </section>
      </div>

      {(error || summaryError) && (
        <div className="admin-error" role="alert">
          <span>{error || summaryError}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      <div className="admin-account-table-card">
        <div className="admin-account-table__title">
          <h2>Daftar Akun</h2>
          <div className="admin-filter-wrap" ref={filterRef}>
            <button
              type="button"
              className={isFilterActive ? "is-active" : ""}
              aria-haspopup="dialog"
              aria-expanded={isFilterOpen}
              onClick={onToggleFilter}
            >
              <List size={16} strokeWidth={2.4} />
              <span>Filter</span>
              {isFilterActive && <span className="admin-filter-dot" />}
            </button>
            {isFilterOpen && (
              <div className="admin-filter-popover" role="dialog" aria-label="Filter daftar akun">
                <label className="admin-filter-field">
                  <span>Peran</span>
                  <select value={roleFilter} onChange={(event) => onRoleFilterChange(event.target.value)} aria-label="Filter peran">
                    {ACCOUNT_ROLE_FILTER_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-filter-field">
                  <span>Status</span>
                  <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} aria-label="Filter status">
                    {ACCOUNT_STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="admin-account-table" role="table" aria-label="Daftar akun">
          <div className="admin-account-table__head" role="row">
            <span role="columnheader">Profil</span>
            <span role="columnheader">Email</span>
            <span role="columnheader">Peran</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Aksi</span>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div className="admin-account-row admin-account-row--loading" key={index} role="row">
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
              </div>
            ))
          ) : accounts.length ? (
            accounts.map((account) => (
              <AccountTableRow
                key={account.id}
                account={account}
                activeMenuId={activeMenuId}
                actionMenuRef={actionMenuRef}
                onAction={onAction}
                onMenuToggle={onMenuToggle}
              />
            ))
          ) : (
            <div className="admin-order-table__empty">
              <UsersRound size={28} />
              <span>Belum ada akun yang cocok.</span>
            </div>
          )}
        </div>

        <div className="admin-account-table__foot">
          <strong>Menampilkan {accounts.length ? `1-${accounts.length}` : "0"} dari {rawCount} akun</strong>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled>
              <ChevronLeftIcon />
            </button>
            <button type="button" aria-label="Halaman berikutnya" disabled={accounts.length >= rawCount}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountTableRow({ account, activeMenuId, actionMenuRef, onAction, onMenuToggle }) {
  const isMenuOpen = activeMenuId === account.id;

  return (
    <div className="admin-account-row" role="row">
      <div className="admin-account-row__profile" role="cell">
        <AccountAvatar account={account} />
        <strong>{account.name}</strong>
      </div>
      <span role="cell" className="admin-account-row__email">{account.email || "-"}</span>
      <span role="cell" className={`admin-account-role-pill admin-account-role-pill--${account.role}`}>
        {account.roleLabel}
      </span>
      <span role="cell" className={`admin-account-status-pill ${account.isActive ? "is-active" : "is-inactive"}`}>
        <span />
        {account.statusLabel}
      </span>
      <div className="admin-account-row__actions" role="cell" ref={isMenuOpen ? actionMenuRef : null}>
        <button
          type="button"
          aria-label={`Aksi akun ${account.name}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => onMenuToggle(account.id)}
        >
          <MoreVertical size={21} strokeWidth={2.8} />
        </button>
        {isMenuOpen && <AccountActionMenu account={account} onAction={onAction} />}
      </div>
    </div>
  );
}

function AccountActionMenu({ account, onAction }) {
  return (
    <div className="admin-account-action-menu" role="menu">
      <button type="button" role="menuitem" onClick={() => onAction(account, "edit")}>
        <Pencil size={16} strokeWidth={2.2} />
        <span>Edit Akun</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(account, "role")}>
        <UserCog size={16} strokeWidth={2.2} />
        <span>Ubah Peran</span>
      </button>
      <button type="button" role="menuitem" className="is-danger" onClick={() => onAction(account, "status")}>
        <CircleX size={16} strokeWidth={2.2} />
        <span>{account.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
      </button>
    </div>
  );
}

function AccountAvatar({ account }) {
  return (
    <span className="admin-account-avatar-mini">
      {account.avatar ? <img src={account.avatar} alt={account.name} loading="lazy" /> : account.initials}
    </span>
  );
}

  function CustomerManagementPage({
    activeMenuId,
    actionMenuRef,
    customers,
    error,
    isLoading,
    onAction,
    onAdd,
    onMenuToggle,
    onRefresh,
    rawCount,
    stats,
    isAccounts,
    accountsSummary,
    memberFilter,
    isFilterOpen,
    onMemberFilterChange,
    onToggleFilter,
  }) {
  const topCustomer = stats.topCustomer;
  const isFilterActive = memberFilter !== "Semua Member";
  const filterRef = useRef(null);

  useEffect(() => {
    if (!isFilterOpen) return undefined;

    const closeFilter = (event) => {
      if (event.key === "Escape") {
        onToggleFilter();
        return;
      }

      if (filterRef.current && !filterRef.current.contains(event.target)) {
        onToggleFilter();
      }
    };

    document.addEventListener("mousedown", closeFilter);
    document.addEventListener("keydown", closeFilter);
    return () => {
      document.removeEventListener("mousedown", closeFilter);
      document.removeEventListener("keydown", closeFilter);
    };
  }, [isFilterOpen, onToggleFilter]);

  return (
    <section className="admin-content admin-content--customers">
      <div className="admin-customer-layout">
        <div className="admin-customer-main">
          <div className="admin-customer-heading">
            <div>
              <h1>{isAccounts ? "Kelola Akun" : "Pelanggan"}</h1>
              <p>{isAccounts ? "Kelola akses dan peran administrator Studio Anda. Pastikan setiap anggota tim memiliki tingkat izin yang tepat." : "Kelola daftar pelanggan terdaftar dan riwayat pesanan mereka."}</p>
            </div>
            <div className="admin-customer-tools">
              {onAdd && (
                <button type="button" onClick={onAdd} className="admin-customer-add">
                  <Plus size={18} strokeWidth={2.3} />
                  <span>Tambah Akun</span>
                </button>
              )}
              <div className="admin-filter-wrap" ref={filterRef}>
                <button
                  type="button"
                  className={isFilterActive ? "is-active" : ""}
                  aria-haspopup="dialog"
                  aria-expanded={isFilterOpen}
                  onClick={onToggleFilter}
                  disabled={isLoading}
                >
                  <List size={18} strokeWidth={2.3} />
                  <span>Filter</span>
                  {isFilterActive && <span className="admin-filter-dot" />}
                </button>
                {isFilterOpen && (
                  <div className="admin-filter-popover" role="dialog" aria-label="Filter pelanggan">
                    <label className="admin-filter-field">
                      <span>Member</span>
                      <select value={memberFilter} onChange={(event) => onMemberFilterChange(event.target.value)} aria-label="Filter member">
                        {CUSTOMER_MEMBER_FILTER_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
              <button type="button" onClick={onRefresh} disabled={isLoading}>
                <RefreshCcw size={17} className={isLoading ? "is-spinning" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {isAccounts && accountsSummary && (
            <div className="admin-accounts-summary">
              <div className="admin-accounts-summary__cards">
                <div className="admin-accounts-card">
                  <span>Total Akun</span>
                  <strong>{pickNumber(accountsSummary, null, ["total", "count", "total_accounts", "total_admins"]) || customers.length}</strong>
                </div>
                <div className="admin-accounts-card">
                  <span>Distribusi Peran (contoh)</span>
                  <div className="admin-accounts-card__roles">
                    {renderRoleCounts(accountsSummary) }
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="admin-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={onRefresh}>Coba lagi</button>
            </div>
          )}

          <div className="admin-customer-table-card">
            <div className="admin-customer-table" role="table" aria-label="Daftar pelanggan">
              <div className="admin-customer-table__head" role="row">
                <span role="columnheader">Nama &amp; Kontak</span>
                <span role="columnheader">Tanggal Bergabung</span>
                <span role="columnheader">Total Pesanan</span>
                <span role="columnheader">Aksi</span>
              </div>

              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div className="admin-customer-row admin-customer-row--loading" key={index} role="row">
                    <span className="admin-skeleton" />
                    <span className="admin-skeleton" />
                    <span className="admin-skeleton" />
                    <span className="admin-skeleton" />
                  </div>
                ))
              ) : customers.length ? (
                customers.map((customer) => (
                  <CustomerTableRow
                    key={customer.id}
                    activeMenuId={activeMenuId}
                    actionMenuRef={actionMenuRef}
                    customer={customer}
                    onAction={onAction}
                    onMenuToggle={onMenuToggle}
                  />
                ))
              ) : (
                <div className="admin-order-table__empty">
                  <UsersRound size={28} />
                  <span>Belum ada pelanggan yang cocok.</span>
                </div>
              )}
            </div>

            <div className="admin-customer-table__foot">
              <strong>Menampilkan {customers.length ? `1-${customers.length}` : "0"} dari {rawCount} pelanggan</strong>
              <div>
                <button type="button" aria-label="Halaman sebelumnya" disabled>
                  <ChevronLeftIcon />
                </button>
                <button type="button" aria-label="Halaman berikutnya" disabled={customers.length >= rawCount}>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="admin-customer-side">
          <section className="admin-customer-stat">
            <span>Total Pelanggan Aktif</span>
            <strong>{formatCompactNumber(stats.activeCustomers)}</strong>
            <small><TrendingUp size={14} strokeWidth={2.8} /> {stats.monthlyChange}</small>
          </section>

          <section className="admin-customer-top">
            <h2>Pelanggan Teratas</h2>
            {topCustomer ? (
              <>
                <div className="admin-customer-top__identity">
                  <CustomerAvatar customer={topCustomer} />
                  <div>
                    <strong>{topCustomer.name}</strong>
                    <span>{topCustomer.memberType}</span>
                  </div>
                </div>
                <div className="admin-customer-top__stats">
                  <div>
                    <span>Total Belanja</span>
                    <strong>{formatShortRupiah(topCustomer.totalSpent)}</strong>
                  </div>
                  <div>
                    <span>Pesanan</span>
                    <strong>{topCustomer.totalOrders}x</strong>
                  </div>
                </div>
              </>
            ) : (
              <p>Belum ada data pelanggan.</p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

function CustomerTableRow({ activeMenuId, actionMenuRef, customer, onAction, onMenuToggle }) {
  const isMenuOpen = activeMenuId === customer.id;

  return (
    <div className="admin-customer-row" role="row">
      <div className="admin-customer-row__identity" role="cell">
        <CustomerAvatar customer={customer} />
        <div>
          <strong>{customer.name}</strong>
          <span>{customer.email || "-"}</span>
        </div>
      </div>
      <time role="cell">{customer.displayJoinedAt}</time>
      <strong role="cell" className="admin-customer-row__orders">{customer.totalOrders}</strong>
      <div className="admin-customer-row__actions" role="cell" ref={isMenuOpen ? actionMenuRef : null}>
        <button
          type="button"
          aria-label={`Aksi pelanggan ${customer.name}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => onMenuToggle(customer.id)}
        >
          <MoreVertical size={22} strokeWidth={2.8} />
        </button>
        {isMenuOpen && <CustomerActionMenu customer={customer} onAction={onAction} />}
      </div>
    </div>
  );
}

function CustomerActionMenu({ customer, onAction }) {
  return (
    <div className="admin-customer-action-menu" role="menu">
      <button type="button" role="menuitem" onClick={() => onAction(customer, "profile")}>
        <UsersRound size={15} strokeWidth={2} />
        <span>Lihat Profil</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(customer, "edit")}>
        <Pencil size={15} strokeWidth={2} />
        <span>Edit Data</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(customer, "orders")}>
        <RefreshCcw size={15} strokeWidth={2} />
        <span>Riwayat Pesanan</span>
      </button>
    </div>
  );
}

function CustomerAvatar({ customer }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [customer?.avatar]);

  if (!customer?.avatar || imageFailed) {
    return (
      <span className="admin-customer-avatar">
        {customer?.initials || getInitials(customer?.name)}
      </span>
    );
  }

  return (
    <span className="admin-customer-avatar">
      <img src={customer.avatar} alt={customer.name} loading="lazy" onError={() => setImageFailed(true)} />
    </span>
  );
}

function OrderManagementPage({
  activeMenuId,
  actionMenuRef,
  error,
  isLoading,
  isSidebarOpen,
  onAction,
  onMenuToggle,
  onQueryChange,
  onRefresh,
  onStatusChange,
  onToggleSidebar,
  orders,
  query,
  rawCount,
  status,
}) {
  return (
    <section className="admin-content admin-content--orders">
      <div className="admin-order-page-head">
        <div className="admin-order-title-row">
          <button
            type="button"
            className="admin-mobile-menu admin-mobile-menu--orders"
            aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
            onClick={onToggleSidebar}
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <h1>Manajemen Pesanan</h1>
            <p>Kelola dan lacak status pesanan pelanggan.</p>
          </div>
        </div>

        <div className="admin-order-controls">
          <label className="admin-order-search">
            <Search size={22} strokeWidth={2.4} />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Cari ID Pesanan atau Nama..."
              aria-label="Cari ID pesanan atau nama pelanggan"
            />
          </label>

          <div className="admin-order-status-filter">
            <select value={status} onChange={(event) => onStatusChange(event.target.value)} aria-label="Filter status pesanan">
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      <div className="admin-order-table-card">
        <div className="admin-order-table" role="table" aria-label="Daftar pesanan">
          <div className="admin-order-table__head" role="row">
            <span role="columnheader">Order ID</span>
            <span role="columnheader">Pelanggan</span>
            <span role="columnheader">Tanggal</span>
            <span role="columnheader">Total</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Aksi</span>
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div className="admin-order-row admin-order-row--loading" key={index} role="row">
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
              </div>
            ))
          ) : orders.length ? (
            orders.map((order) => (
              <OrderTableRow
                key={order.id}
                activeMenuId={activeMenuId}
                actionMenuRef={actionMenuRef}
                onAction={onAction}
                onMenuToggle={onMenuToggle}
                order={order}
              />
            ))
          ) : (
            <div className="admin-order-table__empty">
              <ClipboardList size={28} />
              <span>Belum ada pesanan yang cocok.</span>
            </div>
          )}
        </div>

        <div className="admin-order-table__foot">
          <strong>Menampilkan {orders.length ? `1-${orders.length}` : "0"} dari {rawCount} pesanan</strong>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled>
              <ChevronLeftIcon />
            </button>
            <button type="button" aria-label="Halaman berikutnya" disabled={orders.length >= rawCount}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderTableRow({ activeMenuId, actionMenuRef, onAction, onMenuToggle, order }) {
  const isMenuOpen = activeMenuId === order.id;

  return (
    <div className="admin-order-row" role="row">
      <button type="button" className="admin-order-row__code" role="cell" onClick={() => onAction(order, "detail")}>
        {order.code}
      </button>

      <div className="admin-order-row__customer" role="cell">
        <span className="admin-order-row__avatar">{order.initial}</span>
        <strong>{order.customer}</strong>
      </div>

      <time className="admin-order-row__date" role="cell">{order.displayDate}</time>
      <strong className="admin-order-row__total" role="cell">{formatRupiah(order.total)}</strong>
      <span className={`admin-order-chip ${getStatusClass(order.status)}`} role="cell">
        <span />
        {order.statusLabel}
      </span>

      <div className="admin-order-row__actions" role="cell" ref={isMenuOpen ? actionMenuRef : null}>
        <button
          type="button"
          aria-label={`Aksi pesanan ${order.code}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => onMenuToggle(order.id)}
        >
          <MoreVertical size={22} strokeWidth={2.8} />
        </button>

        {isMenuOpen && <OrderActionMenu order={order} onAction={onAction} />}
      </div>
    </div>
  );
}

function OrderActionMenu({ onAction, order }) {
  return (
    <div className="admin-order-action-menu" role="menu">
      <span className="admin-order-action-menu__grab" aria-hidden="true" />
      <div className="admin-order-action-menu__head">
        <h2>Aksi Pesanan</h2>
        <p>{order.code}</p>
      </div>

      <button type="button" role="menuitem" onClick={() => onAction(order, "detail")}>
        <Eye size={15} strokeWidth={2} />
        <span>Lihat Detail</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(order, "status")}>
        <PenLine size={15} strokeWidth={2} />
        <span>Update Status</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(order, "print")}>
        <Printer size={15} strokeWidth={2} />
        <span>Cetak Resi</span>
      </button>
      <button type="button" role="menuitem" className="is-danger" onClick={() => onAction(order, "cancel")}>
        <CircleX size={15} strokeWidth={2} />
        <span>Batalkan Pesanan</span>
      </button>
    </div>
  );
}

function OrderDetailPage({
  detail,
  error,
  isLoading,
  isSidebarOpen,
  isStatusEditorOpen,
  isSavingStatus,
  onBack,
  onCloseStatusEditor,
  onEditStatus,
  onSaveStatus,
  onPrint,
  onRefresh,
  onToggleSidebar,
}) {
  const customer = detail?.customer || {};
  const payment = detail?.payment || {};

  return (
    <section className="admin-order-detail-page">
      <div className="admin-order-detail-head">
        <div className="admin-order-title-row">
          <button
            type="button"
            className="admin-mobile-menu admin-mobile-menu--orders"
            aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
            onClick={onToggleSidebar}
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <div className="admin-order-detail-crumb">
              <button type="button" onClick={onBack}>Pesanan</button>
              <ChevronRight size={14} />
              <strong>{detail?.code || "Detail"}</strong>
            </div>
            <h1>Detail Pesanan <span>{detail?.code || ""}</span></h1>
          </div>
        </div>

        <div className="admin-order-detail-actions">
          <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onEditStatus} disabled={isLoading || !detail}>
            Edit Status
          </button>
          <button type="button" className="admin-form-button admin-form-button--primary" onClick={onPrint} disabled={isLoading || !detail}>
            <Printer size={17} />
            Cetak Resi
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      {isLoading ? (
        <div className="admin-order-detail-grid">
          <div className="admin-detail-card admin-detail-card--loading" />
          <div className="admin-detail-card admin-detail-card--loading" />
          <div className="admin-detail-card admin-detail-card--loading" />
        </div>
      ) : detail ? (
        <>
          <div className="admin-order-detail-grid">
            <div className="admin-order-detail-main">
              <section className="admin-detail-card admin-detail-products">
                <h2>DAFTAR PRODUK</h2>
                <div className="admin-detail-products__head">
                  <span>PRODUK</span>
                  <span>HARGA</span>
                  <span>JUMLAH</span>
                  <span>SUBTOTAL</span>
                </div>
                {detail.items.length ? (
                  detail.items.map((item) => (
                    <div className="admin-detail-product" key={item.id}>
                      <span className="admin-detail-product__icon">
                        {item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <PackageCheck size={22} />}
                      </span>
                      <div>
                        <strong>{item.name}</strong>
                        <small>SKU: {item.sku || "-"}</small>
                      </div>
                      <span>{formatRupiah(item.price)}</span>
                      <span>{item.quantity}</span>
                      <strong>{formatRupiah(item.subtotal)}</strong>
                    </div>
                  ))
                ) : (
                  <div className="admin-detail-empty">Belum ada produk pada pesanan ini.</div>
                )}
              </section>

              <section className="admin-detail-card admin-detail-payment">
                <h2>RINCIAN PEMBAYARAN</h2>
                <div>
                  <span>Subtotal Produk</span>
                  <strong>{formatRupiah(payment.subtotal)}</strong>
                </div>
                <div>
                  <span>Biaya Pengiriman</span>
                  <strong>{formatRupiah(payment.shipping)}</strong>
                </div>
                <div>
                  <span>Diskon</span>
                  <strong className="is-discount">- {formatRupiah(payment.discount)}</strong>
                </div>
                <div className="admin-detail-payment__total">
                  <span>Total Keseluruhan</span>
                  <strong>{formatRupiah(payment.total)}</strong>
                </div>
              </section>
            </div>

            <aside className="admin-order-detail-side">
              <section className="admin-detail-card admin-detail-customer">
                <h2>INFORMASI PELANGGAN</h2>
                <div className="admin-detail-customer__identity">
                  <span>{getInitial(customer.name)}</span>
                  <div>
                    <strong>{customer.name || "Pelanggan"}</strong>
                    <small>{customer.type || "Pelanggan Baru"}</small>
                  </div>
                </div>

                <InfoLine icon={Mail} label="Email" value={customer.email || "-"} />
                <InfoLine icon={Phone} label="Telepon" value={customer.phone || "-"} />
                <InfoLine icon={MapPin} label="Alamat Pengiriman" value={customer.address || "-"} />
              </section>

              <section className="admin-detail-card admin-detail-status">
                <div className="admin-detail-status__head">
                  <h2>STATUS PESANAN</h2>
                  <span className={`admin-order-chip ${getStatusClass(detail.status)}`}><span />{detail.statusLabel}</span>
                </div>
                <div className="admin-status-timeline">
                  {detail.timeline.map((item, index) => (
                    <div key={`${item.label}-${index}`} className={index === 0 ? "is-current" : ""}>
                      <span />
                      <div>
                        <strong>{item.label}</strong>
                        <time>{item.time}</time>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>

          {isStatusEditorOpen && (
            <StatusEditorDialog
              currentStatus={detail.statusLabel}
              isSaving={isSavingStatus}
              onClose={onCloseStatusEditor}
              onSave={onSaveStatus}
            />
          )}
        </>
      ) : (
        <div className="admin-order-table__empty">
          <ClipboardList size={28} />
          <span>Pilih pesanan untuk melihat detail.</span>
        </div>
      )}
    </section>
  );
}

function StatusEditorDialog({ currentStatus, isSaving, onSave, onClose }) {
  const [value, setValue] = useState(currentStatus || "Diproses");

  const handleSubmit = () => {
    if (isSaving || value === currentStatus) return;
    onSave(value);
  };

  return (
    <div className="admin-modal-scrim" role="presentation">
      <section className="admin-status-editor" role="dialog" aria-modal="true" aria-labelledby="admin-status-editor-title">
        <button type="button" className="admin-status-editor__close" aria-label="Tutup" onClick={onClose}>
          <X size={20} />
        </button>
        <h2 id="admin-status-editor-title">Update Status</h2>
        <label className="admin-field admin-field--full">
          <span>Status Pesanan</span>
          <div className="admin-select-wrap">
            <select value={value} onChange={(event) => setValue(event.target.value)}>
              {ORDER_STATUS_OPTIONS.filter((option) => option !== "Semua Status").map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown size={18} />
          </div>
        </label>
        <div className="admin-status-editor__actions">
          <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button type="button" className="admin-form-button admin-form-button--primary" onClick={handleSubmit} disabled={isSaving || value === currentStatus}>
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </section>
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="admin-info-line">
      <Icon size={18} strokeWidth={2.1} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CustomerProfileDialog({ customer, error, isLoading, orders, onClose, onEdit }) {
  const recentOrders = orders.slice(0, 2);
  const memberTypeLabel = String(customer?.memberType || "Bronze Member").toUpperCase();

  return (
    <div className="admin-modal-scrim" role="presentation">
      <section className="admin-customer-dialog admin-customer-dialog--profile" role="dialog" aria-modal="true" aria-labelledby="admin-customer-profile-title">
        <DialogHeader id="admin-customer-profile-title" title="Detail Profil" onClose={onClose} />

        {error && (
          <div className="admin-category-modal__error" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="admin-customer-dialog__loading" aria-label="Memuat detail pelanggan" />
        ) : (
          <>
            <div className="admin-customer-profile-hero">
              <CustomerAvatar customer={customer} />
              <div>
                <h3>{customer.name}</h3>
                <div>
                  <span>{memberTypeLabel}</span>
                  <small>Member Sejak: {customer.displayJoinedAt}</small>
                </div>
              </div>
            </div>

            <div className="admin-customer-profile-grid">
              <section className="admin-customer-profile-card">
                <h4>INFORMASI KONTAK</h4>
                <InfoLine icon={Mail} label="Email" value={customer.email || "-"} />
                <InfoLine icon={Phone} label="Telepon" value={customer.phone || "-"} />
                <InfoLine icon={MapPin} label="Alamat" value={customer.address || "-"} />
              </section>

              <section className="admin-customer-summary-card">
                <h4>RINGKASAN BELANJA</h4>
                <span>Total Belanja</span>
                <strong>{formatRupiah(customer.totalSpent)}</strong>
                <div>
                  <p>
                    <span>Total Pesanan</span>
                    <strong>{customer.totalOrders} Pesanan</strong>
                  </p>
                  <p>
                    <span>Rata-rata Nilai</span>
                    <strong>{formatRupiah(customer.averageOrderValue)}</strong>
                  </p>
                </div>
              </section>
            </div>

            <section className="admin-customer-recent">
              <h4>PESANAN TERAKHIR</h4>
              <div>
                {recentOrders.length ? (
                  recentOrders.map((order) => (
                    <article key={order.id}>
                      <div>
                        <strong>{order.code}</strong>
                        <time>{order.displayDateOnly}</time>
                      </div>
                      <span className={`admin-order-chip ${getStatusClass(order.status)}`}>{order.statusLabel}</span>
                    </article>
                  ))
                ) : (
                  <p>Belum ada riwayat pesanan.</p>
                )}
              </div>
            </section>
          </>
        )}

        <div className="admin-customer-dialog__actions">
          <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onEdit} disabled={isLoading}>
            Edit Profil
          </button>
          <button type="button" className="admin-form-button admin-form-button--primary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </section>
    </div>
  );
}

function CustomerEditDialog({ customer, error, isLoading, isSaving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => getCustomerFormState(customer));

  useEffect(() => {
    setForm(getCustomerFormState(customer));
  }, [customer]);

  useEffect(() => {
    return () => {
      if (form.avatarPreview) URL.revokeObjectURL(form.avatarPreview);
    };
  }, [form.avatarPreview]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updatePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setForm((current) => {
      if (current.avatarPreview) URL.revokeObjectURL(current.avatarPreview);

      return {
        ...current,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file),
      };
    });
  };

  const photoSrc = form.avatarPreview || form.avatar;
  const photoAlt = form.name || customer?.name || "Pelanggan";

  return (
    <div className="admin-modal-scrim" role="presentation">
      <section className="admin-customer-dialog admin-customer-dialog--edit" role="dialog" aria-modal="true" aria-labelledby="admin-customer-edit-title">
        <DialogHeader id="admin-customer-edit-title" title="Edit Data Pelanggan" onClose={onClose} />

        {error && (
          <div className="admin-category-modal__error" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="admin-customer-dialog__loading" aria-label="Memuat data pelanggan" />
        ) : (
          <form
            className="admin-customer-edit-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(form);
            }}
          >
            <div className="admin-customer-photo-field">
              <div className="admin-customer-photo-field__preview-container">
                <span className="admin-customer-photo-field__preview">
                  {photoSrc ? <img src={photoSrc} alt={photoAlt} /> : getInitials(photoAlt)}
                </span>
                <label className="admin-customer-photo-field__overlay" title="Ubah Foto Profil">
                  <Camera size={18} />
                  <input type="file" accept="image/*" onChange={updatePhoto} />
                </label>
              </div>
              <div className="admin-customer-photo-field__info">
                <div className="admin-customer-photo-field__actions-row">
                  <label className="admin-customer-photo-field__upload-btn">
                    <ImagePlus size={15} strokeWidth={2.3} />
                    <span>Upload Foto Baru</span>
                    <input type="file" accept="image/*" onChange={updatePhoto} />
                  </label>
                  {photoSrc && (
                    <button
                      type="button"
                      className="admin-customer-photo-field__remove-btn"
                      onClick={() => {
                        setForm((current) => {
                          if (current.avatarPreview) URL.revokeObjectURL(current.avatarPreview);
                          return {
                            ...current,
                            avatar: "",
                            avatarFile: null,
                            avatarPreview: "",
                          };
                        });
                      }}
                    >
                      <Trash2 size={15} strokeWidth={2.3} />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
                <small className="admin-customer-photo-field__help">
                  {form.avatarFile?.name || "JPG, PNG, atau WebP untuk foto profil pelanggan."}
                </small>
              </div>
            </div>

            <div className="admin-form-row">
              <label className="admin-field">
                <span>Nama Lengkap</span>
                <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
              </label>
              <label className="admin-field">
                <span>Tipe Member</span>
                <div className="admin-select-wrap">
                  <select value={form.memberType} onChange={(event) => updateField("memberType", event.target.value)}>
                    {CUSTOMER_MEMBER_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} />
                </div>
              </label>
            </div>

            <div className="admin-form-row">
              <label className="admin-field">
                <span>Alamat Email</span>
                <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Nomor Telepon</span>
                <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
              </label>
            </div>

            <label className="admin-field admin-field--full">
              <span>Alamat Pengiriman</span>
              <textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </label>

            <div className="admin-customer-dialog__actions">
              <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onClose} disabled={isSaving}>
                Batal
              </button>
              <button type="submit" className="admin-form-button admin-form-button--primary" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function CustomerOrdersDialog({ customer, error, isLoading, orders, onClose }) {
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const [page, setPage] = useState(1);
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleOrders = orders.slice(pageStart, pageStart + pageSize);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const displayName = customer?.name || "Pelanggan";

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="admin-modal-scrim" role="presentation">
      <section className="admin-customer-dialog admin-customer-dialog--orders" role="dialog" aria-modal="true" aria-labelledby="admin-customer-orders-title">
        <DialogHeader id="admin-customer-orders-title" title={`Riwayat Pesanan: ${displayName}`} onClose={onClose} />

        {error && (
          <div className="admin-category-modal__error" role="alert">
            {error}
          </div>
        )}

        <div className="admin-customer-order-stats">
          <div>
            <span>Total Pesanan</span>
            <strong>{orders.length}</strong>
          </div>
          <div>
            <span>Total Belanja</span>
            <strong>{formatRupiah(totalSpent)}</strong>
          </div>
        </div>

        <div className="admin-customer-order-table" role="table" aria-label={`Riwayat pesanan ${displayName}`}>
          <div className="admin-customer-order-table__head" role="row">
            <span role="columnheader">Order ID</span>
            <span role="columnheader">Tanggal</span>
            <span role="columnheader">Total</span>
            <span role="columnheader">Status</span>
          </div>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div className="admin-customer-order-row admin-customer-order-row--loading" role="row" key={index}>
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
              </div>
            ))
          ) : orders.length ? (
            visibleOrders.map((order) => (
              <div className="admin-customer-order-row" role="row" key={order.id}>
                <strong role="cell">{order.code}</strong>
                <time role="cell">{order.displayDateOnly}</time>
                <span role="cell">{formatRupiah(order.total)}</span>
                <span className={`admin-order-chip ${getStatusClass(order.status)}`} role="cell">{order.statusLabel}</span>
              </div>
            ))
          ) : (
            <div className="admin-order-table__empty">
              <ClipboardList size={28} />
              <span>Belum ada riwayat pesanan.</span>
            </div>
          )}
          <div className="admin-customer-order-table__foot">
            <span>
              Menampilkan {orders.length ? `${pageStart + 1}-${pageStart + visibleOrders.length}` : "0"} dari {orders.length} pesanan
            </span>
            <div>
              <button type="button" aria-label="Halaman sebelumnya" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeftIcon />
              </button>
              <button type="button" aria-label="Halaman berikutnya" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="admin-customer-dialog__actions">
          <button type="button" className="admin-form-button admin-form-button--ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
      </section>
    </div>
  );
}

function DialogHeader({ id, title, onClose }) {
  return (
    <header className="admin-customer-dialog__head">
      <h2 id={id}>{title}</h2>
      <button type="button" aria-label="Tutup" onClick={onClose}>
        <X size={22} />
      </button>
    </header>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function CategoryManagementPage({ categories, isLoading, error, rawCount, onAdd, onDelete, onEdit, onRefresh }) {
  return (
    <section className="admin-content admin-content--categories">
      <div className="admin-category-heading">
        <div>
          <h1>Manajemen Kategori</h1>
          <p>Kelola daftar kategori produk kerajinan Anda.</p>
        </div>
        <button type="button" className="admin-category-add" onClick={onAdd}>
          <Plus size={18} strokeWidth={2.7} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      {isLoading ? (
        <div className="admin-category-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="admin-category-card admin-category-card--loading" />
          ))}
        </div>
      ) : (
        <div className="admin-category-grid">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              icon={CATEGORY_CARD_ICONS[index % CATEGORY_CARD_ICONS.length]}
              onDelete={() => onDelete(category)}
              onEdit={() => onEdit(category)}
            />
          ))}

          <button type="button" className="admin-category-new-card" onClick={onAdd}>
            <span><Plus size={28} strokeWidth={2.6} /></span>
            <strong>Kategori Baru</strong>
            <small>{rawCount ? "Tambahkan kategori untuk produk baru" : "Tambahkan kategori pertama"}</small>
          </button>
        </div>
      )}
    </section>
  );
}

function CategoryCard({ category, icon: Icon, onDelete, onEdit }) {
  return (
    <article className={`admin-category-card ${category.image ? "has-image" : ""} ${category.isActive ? "" : "is-inactive"}`}>
      {category.image ? (
        <div className="admin-category-card__media">
          <img src={category.image} alt={category.name} loading="lazy" />
          <div className="admin-category-card__tools">
            <button type="button" aria-label={`Edit ${category.name}`} onClick={onEdit}>
              <Pencil size={15} strokeWidth={2.4} />
            </button>
            <button type="button" aria-label={`Hapus ${category.name}`} onClick={onDelete}>
              <Trash2 size={15} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      ) : (
        <div className="admin-category-card__top">
          <span className="admin-category-card__icon">
            <Icon size={22} strokeWidth={2.4} />
          </span>
          <div className="admin-category-card__tools">
            <button type="button" aria-label={`Edit ${category.name}`} onClick={onEdit}>
              <Pencil size={15} strokeWidth={2.4} />
            </button>
            <button type="button" aria-label={`Hapus ${category.name}`} onClick={onDelete}>
              <Trash2 size={15} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      )}

      <h2>{category.name}</h2>
      <p>{category.description || "Belum ada deskripsi untuk kategori ini."}</p>

      <div className="admin-category-card__foot">
        <span className="admin-category-card__count">
          <BriefcaseBusiness size={14} strokeWidth={2.3} />
          {category.productCount} Produk
        </span>
        <span className={`admin-category-status ${category.isActive ? "" : "is-inactive"}`}>
          {category.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>
    </article>
  );
}

function CategoryModal({ category, error, isSaving, onClose, onSubmit }) {
  const isEditing = Boolean(category);
  const [form, setForm] = useState(() => ({
    name: category?.name || "",
    description: category?.description || "",
    isActive: category?.isActive ?? true,
    image: null,
    imagePreview: category?.image || "",
  }));

  const setField = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImage = (event) => {
    const file = event.target.files[0] || null;
    setForm((current) => {
      if (current.imagePreview && current.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(current.imagePreview);
      }
      return {
        ...current,
        image: file,
        imagePreview: file ? URL.createObjectURL(file) : (category?.image || ""),
      };
    });
  };

  const clearImage = () => {
    setForm((current) => {
      if (current.imagePreview && current.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(current.imagePreview);
      }
      return { ...current, image: null, imagePreview: category?.image || "" };
    });
  };

  useEffect(() => {
    return () => {
      if (form.imagePreview && form.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(form.imagePreview);
      }
    };
  }, [form.imagePreview]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="admin-category-modal-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <form className="admin-category-modal" onSubmit={handleSubmit}>
        <h2>{isEditing ? "Edit Kategori" : "Tambah Kategori Baru"}</h2>

        <label className="admin-category-field">
          <span>Nama Kategori</span>
          <input
            type="text"
            value={form.name}
            onChange={setField("name")}
            placeholder="Contoh: Kerajinan Perak"
            required
          />
        </label>

        <div className="admin-category-image">
          <span className="admin-category-image__label">Gambar Kategori</span>
          <span className="admin-category-image__preview">
            {form.imagePreview ? <img src={form.imagePreview} alt="Preview kategori" /> : <ImagePlus size={30} />}
          </span>
          <div className="admin-category-image__actions">
            <label className="admin-category-upload">
              <input type="file" accept="image/*" onChange={handleImage} />
              {form.imagePreview ? "Ganti Gambar" : "Unggah Gambar"}
            </label>
            {form.imagePreview && (
              <button type="button" className="admin-category-upload admin-category-upload--ghost" onClick={clearImage}>
                Hapus
              </button>
            )}
          </div>
          <small>JPG, PNG, atau WebP, maks. 2MB</small>
        </div>

        <label className="admin-category-field">
          <span>Deskripsi</span>
          <textarea
            value={form.description}
            onChange={setField("description")}
            placeholder="Jelaskan detail kategori ini..."
            required
          />
        </label>

        <div className="admin-category-toggle-row">
          <div>
            <strong>Status Aktif</strong>
            <span>Tampilkan kategori ini ke pelanggan</span>
          </div>
          <label className="admin-switch">
            <input type="checkbox" checked={form.isActive} onChange={setField("isActive")} />
            <span />
          </label>
        </div>

        {error && <div className="admin-category-modal__error" role="alert">{error}</div>}

        <div className="admin-category-modal__actions">
          <button type="button" className="admin-category-button admin-category-button--ghost" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button type="submit" className="admin-category-button admin-category-button--primary" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : isEditing ? "Update" : "Simpan Kategori"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AccountModal({ account, error, isLoading, isSaving, mode, onClose, onSubmit }) {
  const isCreate = mode === "create";
  const isRoleMode = mode === "role";
  const title = isCreate ? "Tambah Akun Baru" : isRoleMode ? "Ubah Peran Akun" : "Edit Data Akun";
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(() => ({
    name: account?.name || "",
    email: account?.email || "",
    password: "",
    role: account?.role || "admin",
    status: account?.status || "active",
    avatar: account?.avatar || "",
    avatarFile: null,
    avatarPreview: "",
  }));

  const setField = (field) => (event) => {
    const value = event?.target?.type === "file" ? (event.target.files[0] || null) : event.target.value;
    if (field === "avatarFile") {
      const file = value;
      const preview = file ? URL.createObjectURL(file) : "";
      setForm((current) => ({ ...current, avatarFile: file, avatarPreview: preview }));
      return;
    }
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: account?.name || "",
      email: account?.email || "",
      role: account?.role || "admin",
      status: account?.status || "active",
      avatar: account?.avatar || "",
    }));
  }, [account]);

  useEffect(() => {
    return () => {
      if (form.avatarPreview) URL.revokeObjectURL(form.avatarPreview);
    };
  }, [form.avatarPreview]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="admin-category-modal-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <form className="admin-category-modal admin-account-modal" onSubmit={handleSubmit}>
        <div className="admin-account-modal__hero" aria-hidden="true" />
        <div className="admin-account-modal__head">
          <div>
            <h2>{title}</h2>
            <p>{isCreate ? "Berikan akses ke tim BumiKriya" : "Perbarui data, peran, dan status akun."}</p>
          </div>
          <button type="button" aria-label="Tutup popup" onClick={onClose} disabled={isSaving}>
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="admin-account-avatar">
          <span className="admin-account-avatar__preview">
            {form.avatarPreview || form.avatar ? <img src={form.avatarPreview || form.avatar} alt="Preview" /> : <Camera size={36} />}
          </span>
          <label className="admin-account-upload">
            <input type="file" accept="image/*" onChange={setField("avatarFile")} />
            Unggah Foto
          </label>
          <small>JPG atau PNG, maks. 2MB</small>
        </div>

        {isLoading && (
          <div className="admin-account-modal__loading">
            <span className="admin-skeleton" />
            <span className="admin-skeleton" />
          </div>
        )}

        <label className="admin-category-field">
          <span>Nama Lengkap</span>
          <input type="text" value={form.name} onChange={setField("name")} placeholder="Masukkan nama lengkap" required />
        </label>

        <label className="admin-category-field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={setField("email")} placeholder="nama@contoh.com" required />
        </label>

        <label className="admin-category-field">
          <span>Kata Sandi</span>
          <div className="admin-account-password">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={setField("password")}
              placeholder={isCreate ? "Minimal 8 karakter" : "Kosongkan jika tidak diubah"}
              minLength={form.password || isCreate ? 8 : undefined}
              required={isCreate}
            />
            <button type="button" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setShowPassword((visible) => !visible)}>
              <Eye size={18} strokeWidth={2.3} />
            </button>
          </div>
        </label>

        <label className="admin-category-field admin-account-modal-row">
          <div>
            <span>Peran Admin</span>
            <select value={form.role} onChange={setField("role")} aria-label="Peran Admin">
              <option value="admin">Admin</option>
              <option value="seller">Seller</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <span>Status</span>
            <select value={form.status} onChange={setField("status")} aria-label="Status Akun">
              <option value="active">Aktif</option>
              <option value="inactive">Non-aktif</option>
            </select>
          </div>
        </label>

        {error && <div className="admin-category-modal__error" role="alert">{error}</div>}

        <div className="admin-category-modal__actions">
          <button type="button" className="admin-category-button admin-category-button--ghost" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button type="submit" className="admin-category-button admin-category-button--primary" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : isCreate ? "Simpan Akun" : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CategoryDeleteDialog({ category, error, isDeleting, onCancel, onConfirm }) {
  return (
    <div className="admin-category-delete-scrim" role="presentation">
      <section className="admin-category-delete" role="dialog" aria-modal="true" aria-labelledby="category-delete-title">
        <div className="admin-category-delete__head">
          <span>
            <AlertTriangle size={34} strokeWidth={2.6} />
          </span>
        </div>
        <div className="admin-category-delete__body">
          <h2 id="category-delete-title">Hapus Kategori?</h2>
          <p>Apakah Anda yakin ingin menghapus kategori '{category.name}'? Tindakan ini tidak dapat dibatalkan.</p>
          {category.productCount > 0 && (
            <p className="admin-category-delete__warning">
              Kategori ini dipakai oleh <strong>{category.productCount} Produk</strong>. Produk yang memakainya akan kehilangan kategori tersebut.
            </p>
          )}
          {error && <div className="admin-category-modal__error" role="alert">{error}</div>}
          <div className="admin-category-delete__actions">
            <button type="button" className="admin-category-button admin-category-button--ghost" onClick={onCancel} disabled={isDeleting}>
              Batal
            </button>
            <button type="button" className="admin-category-button admin-category-button--danger" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

const VOUCHER_TYPE_OPTIONS = ["Persentase"];

function VoucherManagementPage({
  vouchers,
  error,
  isLoading,
  onAdd,
  onRefresh,
  rawCount,
  stats,
  activeMenuId,
  actionMenuRef,
  onAction,
  onMenuToggle,
}) {
  return (
    <section className="admin-content admin-content--vouchers">
      <div className="admin-voucher-heading">
        <div>
          <h1>Manajemen Voucher</h1>
          <p>Buat dan kelola kode voucher diskon untuk promosi toko Anda.</p>
        </div>
        <button type="button" className="admin-voucher-add" onClick={onAdd}>
          <TicketPercent size={20} strokeWidth={2.4} />
          <span>Tambah Voucher</span>
        </button>
      </div>

      <div className="admin-voucher-overview">
        <section className="admin-voucher-total-card">
          <span className="admin-voucher-total-card__icon">
            <TicketPercent size={22} strokeWidth={2.4} />
          </span>
          <small>Total Voucher</small>
          <strong>{isLoading ? "..." : formatCompactNumber(stats.total)}</strong>
          <span className="admin-voucher-total-card__note">
            <TicketPercent size={14} strokeWidth={2.4} />
            {stats.activeText}
          </span>
        </section>

        <section className="admin-voucher-usage-card">
          <div className="admin-voucher-usage-card__title">
            <TicketPercent size={18} strokeWidth={2.4} />
            <span>Pemakaian Voucher</span>
          </div>
          <div className="admin-voucher-usage-card__counts">
            <div>
              <strong>{formatCompactNumber(stats.usedCount)}</strong>
              <span>Terpakai</span>
            </div>
            <div>
              <strong>{formatCompactNumber(stats.active)}</strong>
              <span>Aktif</span>
            </div>
            <div>
              <strong>{formatCompactNumber(stats.expired)}</strong>
              <span>Kadaluarsa</span>
            </div>
          </div>
        </section>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRefresh}>Coba lagi</button>
        </div>
      )}

      <div className="admin-voucher-table-card">
        <div className="admin-voucher-table" role="table" aria-label="Daftar voucher">
          <div className="admin-voucher-table__head" role="row">
            <span role="columnheader">Kode</span>
            <span role="columnheader">Deskripsi</span>
            <span role="columnheader">Diskon</span>
            <span role="columnheader">Berlaku</span>
            <span role="columnheader">Pemakaian</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Aksi</span>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div className="admin-voucher-row admin-voucher-row--loading" key={index} role="row">
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
                <span className="admin-skeleton" />
              </div>
            ))
          ) : vouchers.length ? (
            vouchers.map((voucher) => (
              <VoucherTableRow
                key={voucher.id}
                activeMenuId={activeMenuId}
                actionMenuRef={actionMenuRef}
                onAction={onAction}
                onMenuToggle={onMenuToggle}
                voucher={voucher}
              />
            ))
          ) : (
            <div className="admin-order-table__empty">
              <TicketPercent size={28} />
              <span>Belum ada voucher yang cocok.</span>
            </div>
          )}
        </div>

        <div className="admin-voucher-table__foot">
          <strong>Menampilkan {vouchers.length ? `1-${vouchers.length}` : "0"} dari {rawCount} voucher</strong>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled>
              <ChevronLeftIcon />
            </button>
            <button type="button" aria-label="Halaman berikutnya" disabled={vouchers.length >= rawCount}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function VoucherTableRow({ activeMenuId, actionMenuRef, onAction, onMenuToggle, voucher }) {
  const isMenuOpen = activeMenuId === voucher.id;

  return (
    <div className="admin-voucher-row" role="row">
      <strong role="cell" className="admin-voucher-row__code">{voucher.code}</strong>
      <span role="cell" className="admin-voucher-row__desc">{voucher.name || voucher.description || "-"}</span>
      <strong role="cell" className="admin-voucher-row__discount">{voucher.discountLabel}</strong>
      <span role="cell" className="admin-voucher-row__dates">
        <span>{voucher.displayStartsAt}</span>
        <span>{voucher.displayEndsAt}</span>
      </span>
      <span role="cell" className="admin-voucher-row__usage">
        <strong>{formatCompactNumber(voucher.usedCount)}</strong>
        <small>{voucher.usageLimit ? `/ ${formatCompactNumber(voucher.usageLimit)}` : " / ∞"}</small>
      </span>
      <span role="cell" className={`admin-voucher-status-pill ${voucher.isExpired ? "is-inactive" : voucher.isActive ? "" : "is-inactive"}`}>
        <span />
        {voucher.statusLabel}
      </span>
      <div className="admin-voucher-row__actions" role="cell" ref={isMenuOpen ? actionMenuRef : null}>
        <button
          type="button"
          aria-label={`Aksi voucher ${voucher.code}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => onMenuToggle(voucher.id)}
        >
          <MoreVertical size={21} strokeWidth={2.8} />
        </button>
        {isMenuOpen && <VoucherActionMenu voucher={voucher} onAction={onAction} />}
      </div>
    </div>
  );
}

function VoucherActionMenu({ voucher, onAction }) {
  return (
    <div className="admin-voucher-action-menu" role="menu">
      <button type="button" role="menuitem" onClick={() => onAction(voucher, "detail")}>
        <Eye size={15} strokeWidth={2} />
        <span>Lihat Detail</span>
      </button>
      <button type="button" role="menuitem" onClick={() => onAction(voucher, "edit")}>
        <Pencil size={15} strokeWidth={2} />
        <span>Edit Voucher</span>
      </button>
      <button type="button" role="menuitem" className="is-danger" onClick={() => onAction(voucher, "delete")}>
        <Trash2 size={15} strokeWidth={2} />
        <span>Hapus Voucher</span>
      </button>
    </div>
  );
}

function VoucherModal({ voucher, error, isLoading, isSaving, mode, onClose, onSubmit }) {
  const isCreate = mode === "create";
  const [form, setForm] = useState(() => getVoucherFormState(voucher, isCreate));

  useEffect(() => {
    setForm(getVoucherFormState(voucher, isCreate));
  }, [voucher, isCreate]);

  const setField = (field) => (event) => {
    const target = event.target;
    let value;
    if (target.type === "checkbox") {
      value = target.checked;
    } else if (target.type === "number") {
      if (target.value === "" && target.validity && target.validity.badInput) return;
      value = target.value;
    } else {
      value = target.value;
    }
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="admin-category-modal-scrim" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <form className="admin-category-modal admin-voucher-modal" onSubmit={handleSubmit}>
        <div className="admin-voucher-modal__head">
          <div>
            <span className="admin-voucher-modal__icon"><TicketPercent size={22} strokeWidth={2.4} /></span>
            <div>
              <h2>{isCreate ? "Tambah Voucher Baru" : "Edit Voucher"}</h2>
              <p>{isCreate ? "Buat kode promo untuk pelanggan" : "Perbarui detail voucher promo"}</p>
            </div>
          </div>
          <button type="button" aria-label="Tutup popup" onClick={onClose} disabled={isSaving}>
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        {isLoading && (
          <div className="admin-account-modal__loading">
            <span className="admin-skeleton" />
            <span className="admin-skeleton" />
          </div>
        )}

        <div className="admin-voucher-modal__grid">
          <label className="admin-category-field">
            <span>Kode Voucher</span>
            <input
              type="text"
              value={form.code}
              onChange={setField("code")}
              placeholder="Contoh: HEMAT50"
              required
            />
          </label>

          <label className="admin-category-field">
            <span>Nama / Deskripsi</span>
            <input
              type="text"
              value={form.name}
              onChange={setField("name")}
              placeholder="Contoh: Diskon Belanja Pertama"
            />
          </label>

          <label className="admin-category-field">
            <span>Tipe Diskon</span>
            <div className="admin-select-wrap">
              <select value={form.discountType} onChange={setField("discountType")} aria-label="Tipe diskon voucher">
                {VOUCHER_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={18} />
            </div>
          </label>
          <label className="admin-category-field">
            <span>{form.discountType === "Nominal" ? "Nominal (Rp)" : "Persentase (%)"}</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.discountValue}
              onChange={setField("discountValue")}
              placeholder="0"
              required
            />
          </label>

          <label className="admin-category-field">
            <span>Min. Belanja (Rp)</span>
            <input
              type="number"
              min="0"
              value={form.minPurchase}
              onChange={setField("minPurchase")}
              placeholder="0"
            />
          </label>
          <label className="admin-category-field">
            <span>Maks. Diskon (Rp)</span>
            <input
              type="number"
              min="0"
              value={form.maxDiscount}
              onChange={setField("maxDiscount")}
              placeholder="0"
            />
          </label>

          <label className="admin-category-field">
            <span>Mulai Berlaku</span>
            <input type="date" value={form.startsAt} onChange={setField("startsAt")} />
          </label>
          <label className="admin-category-field">
            <span>Berakhir</span>
            <input type="date" value={form.endsAt} onChange={setField("endsAt")} />
          </label>

          <label className="admin-category-field">
            <span>Kuota Pemakaian</span>
            <input
              type="number"
              min="0"
              value={form.usageLimit}
              onChange={setField("usageLimit")}
              placeholder="0 = tanpa batas"
            />
          </label>

          <div className="admin-category-toggle-row">
            <div>
              <strong>Status Aktif</strong>
              <span>Tampilkan voucher ini ke pelanggan</span>
            </div>
            <label className="admin-switch">
              <input type="checkbox" checked={form.isActive} onChange={setField("isActive")} />
              <span />
            </label>
          </div>
        </div>

        {error && <div className="admin-category-modal__error" role="alert">{error}</div>}

        <div className="admin-category-modal__actions">
          <button type="button" className="admin-category-button admin-category-button--ghost" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button type="submit" className="admin-category-button admin-category-button--primary" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : isCreate ? "Simpan Voucher" : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function VoucherDeleteDialog({ voucher, error, isDeleting, onCancel, onConfirm }) {
  return (
    <div className="admin-category-delete-scrim" role="presentation">
      <section className="admin-category-delete" role="dialog" aria-modal="true" aria-labelledby="voucher-delete-title">
        <div className="admin-category-delete__head">
          <span>
            <AlertTriangle size={34} strokeWidth={2.6} />
          </span>
        </div>
        <div className="admin-category-delete__body">
          <h2 id="voucher-delete-title">Hapus Voucher?</h2>
          <p>Apakah Anda yakin ingin menghapus voucher '{voucher.code}'? Tindakan ini tidak dapat dibatalkan.</p>
          {error && <div className="admin-category-modal__error" role="alert">{error}</div>}
          <div className="admin-category-delete__actions">
            <button type="button" className="admin-category-button admin-category-button--ghost" onClick={onCancel} disabled={isDeleting}>
              Batal
            </button>
            <button type="button" className="admin-category-button admin-category-button--danger" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function TopSellersChart({ sellers, isLoading }) {
  const max = Math.max(...sellers.map((seller) => seller.earnings), 0);

  return (
    <div className="admin-top-sellers">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <div className="admin-top-seller admin-top-seller--loading" key={index}>
            <span className="admin-skeleton admin-top-seller__rank" />
            <div className="admin-top-seller__bar">
              <span className="admin-skeleton" />
              <span className="admin-skeleton admin-top-seller__track" />
            </div>
          </div>
        ))
      ) : sellers.length ? (
        sellers.map((seller, index) => (
          <div className="admin-top-seller" key={`${seller.name}-${index}`}>
            <span className={`admin-top-seller__rank ${index < 3 ? `is-top-${index}` : ""}`}>
              {seller.avatar ? <img src={seller.avatar} alt={seller.name} loading="lazy" /> : index + 1}
            </span>
            <div className="admin-top-seller__bar">
              <div className="admin-top-seller__identity">
                <strong>{seller.name}</strong>
                <span>{formatShortRupiah(seller.earnings)}</span>
              </div>
              <div className="admin-top-seller__track">
                <span
                  className="admin-top-seller__fill"
                  style={{ width: max ? `${Math.max((seller.earnings / max) * 100, 4)}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="admin-empty-top-sellers">
          <TrendingUp size={24} strokeWidth={2.2} />
          <span>Belum ada data top seller.</span>
        </div>
      )}
    </div>
  );
}

function OrderItem({ order }) {
  return (
    <div className="admin-order">
      <span className="admin-order__icon">
        <ClipboardList size={18} strokeWidth={2.2} />
      </span>
      <div className="admin-order__copy">
        <strong>{order.code}</strong>
        <span>{order.customer}</span>
      </div>
      <div className="admin-order__meta">
        <span className={`admin-order__status ${getStatusClass(order.status)}`}>{order.statusLabel}</span>
        <time>{order.displayTime}</time>
      </div>
    </div>
  );
}

function extractCustomers(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.customers)) return raw.data.customers;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.customers)) return raw.customers;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

async function fetchAllCustomers({ signal } = {}) {
  const pageSize = 100;
  const rows = [];

  const first = await fetchCustomers({ page: 1, limit: pageSize, signal });
  rows.push(...extractCustomers(first));

  const rawPagination = first?.data?.pagination || first?.pagination || {};
  const totalPages = Number(rawPagination.total_pages) || 1;

  for (let page = 2; page <= totalPages; page += 1) {
    try {
      const next = await fetchCustomers({ page, limit: pageSize, signal });
      rows.push(...extractCustomers(next));
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      break;
    }
  }

  return rows;
}

function extractAccountsSummary(raw) {
  if (!raw) return null;
  const payload = raw?.data?.summary || raw?.data || raw?.summary || raw;
  return payload;
}

function renderRoleCounts(summary) {
  if (!summary) return null;
  const roles =
    summary.roles ||
    summary.distribution ||
    summary.role_distribution ||
    summary.roleDistribution ||
    summary.role_counts ||
    summary.roles_count ||
    summary.roleCounts;
  if (roles && typeof roles === "object") {
    return Object.entries(roles).map(([role, count]) => (
      <span key={role} className="admin-accounts-role"><strong>{role}</strong>: {String(count)}</span>
    ));
  }

  // Try common fields
  const adminCount = pickNumber(summary, null, ["admin", "admins", "total_admins"]);
  const sellerCount = pickNumber(summary, null, ["seller", "sellers"]);
  const userCount = pickNumber(summary, null, ["user", "users"]);
  if (adminCount || sellerCount || userCount) {
    return (
      <>
        <span className="admin-accounts-role"><strong>Admin</strong>: {adminCount || 0}</span>
        <span className="admin-accounts-role"><strong>Seller</strong>: {sellerCount || 0}</span>
        <span className="admin-accounts-role"><strong>User</strong>: {userCount || 0}</span>
      </>
    );
  }

  return <span>Tidak ada data distribusi peran</span>;
}

function extractAccounts(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.accounts)) return raw.data.accounts;
  if (Array.isArray(raw?.data?.users)) return raw.data.users;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.accounts)) return raw.accounts;
  if (Array.isArray(raw?.users)) return raw.users;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

function mergeAccountUsers(accountRecords, customerRecords) {
  const accounts = extractAccounts(accountRecords);
  const customers = extractCustomers(customerRecords);

  const seenEmails = new Set();
  const seenIds = new Set();

  accounts.forEach((account) => {
    const email = String(account.email || account.mail || "").trim().toLowerCase();
    const id = String(getAccountId(account) ?? "").trim().toLowerCase();
    if (email) seenEmails.add(email);
    if (id) seenIds.add(id);
  });

  customers.forEach((customer) => {
    const email = String(customer.email || customer.mail || customer.customer_email || "").trim().toLowerCase();
    const id = String(getAccountId(customer) ?? "").trim().toLowerCase();

    if ((email && seenEmails.has(email)) || (id && seenIds.has(id))) return;

    if (email) seenEmails.add(email);
    if (id) seenIds.add(id);

    accounts.push({
      ...customer,
      role: customer.role || customer.user_role || customer.account_role || customer.type || "user",
      status: customer.status || customer.account_status || customer.state || "active",
    });
  });

  return accounts;
}

function normalizeAccounts(source) {
  return extractAccounts(source).map((account, index) => normalizeAccount(account, index));
}

function normalizeAccountDetail(raw, fallbackAccount) {
  const payload = raw?.data?.account || raw?.data?.user || raw?.data?.detail || raw?.data || raw?.account || raw?.user || raw?.detail || raw;
  const base = fallbackAccount?.raw || fallbackAccount || {};
  return normalizeAccount({ ...base, ...(payload || {}) });
}

function normalizeAccount(account = {}, index = 0) {
  const profile = account.profile || account.user || account.account || {};
  const name =
    account.name ||
    account.full_name ||
    account.fullName ||
    account.username ||
    profile.name ||
    profile.full_name ||
    profile.username ||
    "Admin";
  const role = normalizeAccountRole(account.role || account.user_role || account.account_role || account.type || profile.role || profile.type);
  const status = normalizeAccountStatus(
    account.status ||
      account.account_status ||
      account.state ||
      profile.status ||
      (account.is_active ?? account.isActive ?? account.active ?? profile.is_active ?? profile.isActive)
  );
  const createdAt =
    account.created_at ||
    account.createdAt ||
    account.joined_at ||
    account.joinedAt ||
    profile.created_at ||
    profile.createdAt;

  return {
    id: getAccountId(account) || getAccountId(profile) || `account-${index}`,
    name,
    initials: getInitials(name),
    email: account.email || account.mail || profile.email || profile.mail || "",
    role,
    roleLabel: getAccountRoleLabel(role),
    status,
    statusLabel: getAccountStatusLabel(status),
    isActive: status === "active",
    createdAt,
    displayCreatedAt: formatDateOnly(createdAt),
    avatar: resolveApiUrl(
      account.photoprofil ||
        account.photo_profil ||
        account.photoProfil ||
        account.avatar ||
        account.avatar_url ||
        account.photo ||
        profile.photoprofil ||
        profile.photo_profil ||
        profile.photoProfil ||
        profile.avatar ||
        profile.avatar_url ||
        profile.photo
    ),
    raw: account,
  };
}

function filterAccounts(accounts, query, roleFilter = "Semua Peran", statusFilter = "Semua Status") {
  let result = accounts;

  if (roleFilter && roleFilter !== "Semua Peran") {
    result = result.filter((account) => account.roleLabel === roleFilter);
  }

  if (statusFilter && statusFilter !== "Semua Status") {
    result = result.filter((account) => account.statusLabel === statusFilter);
  }

  const needle = query.trim().toLowerCase();
  if (!needle) return result;

  return result.filter((account) =>
    [account.name, account.email, account.roleLabel, account.statusLabel, account.id]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
}

function summarizeAccounts(accounts, summary) {
  const roleCounts = getSummaryRoleCounts(summary);
  const total = pickNumber(summary, null, ["total", "count", "total_accounts", "total_admins", "accounts_count"]) || accounts.length;
  const statusDistribution =
    summary?.status_distribution ||
    summary?.statusDistribution ||
    summary?.status_counts ||
    summary?.statusCounts || {};
  const activeTotal =
    pickNumber(summary, statusDistribution, ["active", "active_accounts", "activeAdmins", "active_admins", "aktif"]) ||
    accounts.filter((account) => account.isActive).length;

  return {
    total,
    activeTotal,
    admin: roleCounts.admin ?? accounts.filter((account) => account.role === "admin").length,
    seller: roleCounts.seller ?? accounts.filter((account) => account.role === "seller").length,
    user: roleCounts.user ?? accounts.filter((account) => account.role === "user").length,
    verifiedText: activeTotal === total && total > 0 ? "Semua terverifikasi" : `${formatCompactNumber(activeTotal)} akun aktif`,
  };
}

function getSummaryRoleCounts(summary) {
  const roles =
    summary?.roles ||
    summary?.distribution ||
    summary?.role_distribution ||
    summary?.roleDistribution ||
    summary?.role_counts ||
    summary?.roles_count ||
    summary?.roles_counts ||
    summary?.roleCounts ||
    {};
  const counts = {};

  if (roles && typeof roles === "object") {
    Object.entries(roles).forEach(([role, count]) => {
      counts[normalizeAccountRole(role)] = toNumber(count);
    });
  }

  counts.admin ??= pickNumber(summary, null, ["admin", "admins", "total_admins"]);
  counts.seller ??= pickNumber(summary, null, ["seller", "sellers", "total_sellers"]);
  counts.user ??= pickNumber(summary, null, ["user", "users", "customer", "customers", "total_users", "total_customers"]);

  return counts;
}

function getAccountId(account) {
  return account?.id || account?.uuid || account?.account_id || account?.accountId || account?.user_id || account?.userId || account?._id;
}

function normalizeAccountRole(value) {
  const role = String(value || "user").trim().toLowerCase();
  if (["administrator", "super_admin", "superadmin", "owner"].includes(role)) return "admin";
  if (["merchant", "vendor", "penjual"].includes(role)) return "seller";
  if (["customer", "pelanggan", "member"].includes(role)) return "user";
  if (["admin", "seller", "user"].includes(role)) return role;
  return "user";
}

function getAccountRoleLabel(role) {
  if (role === "admin") return "Admin";
  if (role === "seller") return "Seller";
  return "User";
}

function normalizeAccountStatus(value) {
  if (typeof value === "boolean") return value ? "active" : "inactive";
  const status = String(value ?? "active").trim().toLowerCase().replace(/\s+/g, "_");
  if (["inactive", "nonaktif", "non_aktif", "disabled", "blocked", "suspended", "false", "0"].includes(status)) return "inactive";
  return "active";
}

function getAccountStatusLabel(status) {
  return status === "inactive" ? "Non-aktif" : "Aktif";
}

function normalizeCustomers(source) {
  return extractCustomers(source).map((customer, index) => normalizeCustomer(customer, index));
}

function normalizeCustomerDetail(raw, fallbackCustomer) {
  const payload = raw?.data?.customer || raw?.data?.detail || raw?.data || raw?.customer || raw?.detail || raw;
  const base = fallbackCustomer?.raw || fallbackCustomer || {};
  return normalizeCustomer({ ...base, ...(payload || {}) });
}

function normalizeCustomer(customer = {}, index = 0) {
  const profile = customer.profile || customer.user || customer.account || {};
  const stats = customer.stats || customer.summary || customer.customer_stats || {};
  const address = customer.address || customer.shipping_address || customer.shippingAddress || profile.address || {};
  const name =
    customer.name ||
    customer.full_name ||
    customer.fullName ||
    customer.customer_name ||
    profile.name ||
    profile.full_name ||
    "Pelanggan";
  const totalOrders = pickNumber(customer, stats, [
    "totalOrders",
    "total_orders",
    "ordersCount",
    "orders_count",
    "order_count",
    "jumlah_pesanan",
  ]);
  const totalSpent = pickNumber(customer, stats, [
    "totalSpent",
    "total_spent",
    "totalShopping",
    "total_shopping",
    "totalBelanja",
    "total_belanja",
    "lifetime_value",
    "revenue",
  ]);
  const joinedAt =
    customer.joined_at ||
    customer.joinedAt ||
    customer.created_at ||
    customer.createdAt ||
    profile.created_at ||
    profile.createdAt;

  return {
    id: getCustomerId(customer) || getCustomerId(profile) || `customer-${index}`,
    name,
    initials: getInitials(name),
    email: customer.email || customer.mail || customer.customer_email || profile.email || "",
    phone: customer.phone || customer.phone_number || customer.customer_phone || profile.phone || profile.phone_number || "",
    address: formatAddress(address) || customer.address_text || customer.shipping_address_text || profile.address_text || "",
    memberType: normalizeCustomerMemberType(
      customer.member_type ||
        customer.memberType ||
        customer.type ||
        customer.tier ||
        customer.membership ||
        profile.member_type ||
        profile.memberType
    ),
    joinedAt,
    displayJoinedAt: formatDateOnly(joinedAt),
    totalOrders,
    totalSpent,
    averageOrderValue:
      pickNumber(customer, stats, ["averageOrderValue", "average_order_value", "avg_order_value"]) ||
      (totalOrders ? Math.round(totalSpent / totalOrders) : 0),
    avatar: resolveApiUrl(customer.photoprofil || customer.photo_profil || customer.photoProfil || customer.avatar || customer.avatar_url || customer.photo || profile.photoprofil || profile.photo_profil || profile.photoProfil || profile.avatar || profile.avatar_url || profile.photo),
    raw: customer,
  };
}

function normalizeCustomerMemberType(value) {
  if (value === undefined || value === null || value === "") return "Bronze Member";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "Bronze Member";
    const key = trimmed.toLowerCase().replace(/[^a-z]/g, "");
    const legacyMap = {
      regular: "Bronze Member",
      regularmember: "Bronze Member",
      basic: "Bronze Member",
      basicmember: "Bronze Member",
      bronze: "Bronze Member",
      bronzemember: "Bronze Member",
      silver: "Silver Member",
      silvermember: "Silver Member",
      gold: "Gold Member",
      goldmember: "Gold Member",
      platinum: "Platinum Member",
      platinummember: "Platinum Member",
    };
    return legacyMap[key] || trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (typeof value === "object") {
    const nested =
      value.name ||
      value.label ||
      value.title ||
      value.type ||
      value.tier ||
      value.membership ||
      value.member_type ||
      value.memberType ||
      value.level ||
      value.code;

    if (nested && nested !== value) {
      return normalizeCustomerMemberType(nested);
    }
  }

  return "Bronze Member";
}

function normalizeCustomerOrders(source) {
  return extractOrders(source).map((order, index) => {
    const createdAt = order.created_at || order.createdAt || order.order_date || order.orderDate || order.date || order.updated_at;
    return {
      ...normalizeOrderRecord(order, index),
      displayDateOnly: formatDateOnly(createdAt),
    };
  });
}

function filterCustomers(customers, query, memberFilter = "Semua Member") {
  let result = customers;

  if (memberFilter && memberFilter !== "Semua Member") {
    result = result.filter((customer) => customer.memberType === memberFilter);
  }

  const needle = query.trim().toLowerCase();
  if (!needle) return result;

  return result.filter((customer) =>
    [customer.name, customer.email, customer.phone, customer.memberType, customer.id]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
}

function summarizeCustomers(customers) {
  const topCustomer = [...customers].sort((a, b) => (b.totalSpent || b.totalOrders) - (a.totalSpent || a.totalOrders))[0] || null;

  return {
    activeCustomers: customers.length,
    monthlyChange: "+12% bulan ini",
    topCustomer,
  };
}

function getCustomerId(customer) {
  return customer?.id || customer?.uuid || customer?.customer_id || customer?.customerId || customer?.user_id || customer?.userId || customer?._id;
}

function getCustomerFormState(customer) {
  return {
    name: customer?.name || "",
    memberType: customer?.memberType || "Bronze Member",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    avatar: customer?.avatar || "",
    avatarFile: null,
    avatarPreview: "",
  };
}

function buildCustomerPayload(form) {
  if (form.avatarFile) {
    const payload = new FormData();
    const fields = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      member_type: form.memberType,
      address: form.address.trim(),
    };

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== "") payload.append(key, value);
    });

    payload.append("avatar", form.avatarFile);
    payload.append("photoprofil", form.avatarFile);
    payload.append("photo", form.avatarFile);
    return payload;
  }

  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    member_type: form.memberType,
    address: form.address.trim(),
  };

  if (form.avatar === "") {
    payload.avatar = "";
    payload.photoprofil = "";
    payload.photo = "";
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "" && !["avatar", "photoprofil", "photo"].includes(key)) {
      delete payload[key];
    }
  });

  return payload;
}

function buildAccountPayload(form, { isCreate = false, includeStatus = true } = {}) {
  const fields = {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password || undefined,
    role: form.role || undefined,
  };

  if (includeStatus) fields.status = form.status || undefined;
  if (!isCreate && !form.password) delete fields.password;

  if (form.avatarFile) {
    const payload = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== "") payload.append(key, value);
    });

    payload.append("avatar", form.avatarFile);
    payload.append("photoprofil", form.avatarFile);
    payload.append("photo", form.avatarFile);
    return payload;
  }

  const payload = { ...fields };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === "") delete payload[key];
  });

  return payload;
}

function buildAccountStatusPayload(status) {
  return { status };
}

function formatAddress(address) {
  if (!address) return "";
  if (typeof address === "string") return address;
  return [
    address.address,
    address.street,
    address.city,
    address.province || address.state,
    address.postal_code || address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function getInitials(name) {
  const words = String(name || "P")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (words[0]?.[0] || "P").toUpperCase() + (words[1]?.[0] || "").toUpperCase();
}

function formatDateOnly(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatShortRupiah(value) {
  if (!value) return formatRupiah(0);
  if (value >= 1000000) {
    const compact = value / 1000000;
    return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: compact % 1 ? 1 : 0 }).format(compact)}M`;
  }
  if (value >= 1000) {
    const compact = value / 1000;
    return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: compact % 1 ? 1 : 0 }).format(compact)}K`;
  }
  return formatRupiah(value);
}

function extractOrders(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.orders)) return raw.data.orders;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.orders)) return raw.orders;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

function normalizeOrderRecords(source) {
  return extractOrders(source).map((order, index) => normalizeOrderRecord(order, index));
}

function normalizeOrderRecord(order, index = 0) {
  const id = getOrderId(order) || `order-${index}`;
  const status = normalizeStatus(order.status || order.order_status || order.state || order.fulfillment_status || "diproses");
  const customer = getCustomerName(order);
  const total = pickNumber(order, order.payment || order.summary || {}, [
    "total",
    "total_amount",
    "grand_total",
    "grandTotal",
    "total_price",
    "amount",
    "subtotal",
  ]);
  const createdAt = order.created_at || order.createdAt || order.order_date || order.orderDate || order.date || order.updated_at;

  return {
    id,
    code: formatOrderCode(order.code || order.order_code || order.order_number || order.orderNumber || order.invoice_number || id),
    customer,
    initial: getInitial(customer),
    createdAt,
    displayDate: formatOrderTime(createdAt, order.display_date || order.displayDate || order.time),
    total,
    status,
    statusLabel: getOrderStatusLabel(status),
    raw: order,
  };
}

function normalizeOrderDetail(raw, fallbackOrder) {
  const payload = raw?.data?.order || raw?.data?.detail || raw?.data || raw?.order || raw?.detail || raw;
  if (!payload && !fallbackOrder) return null;

  const base = fallbackOrder?.raw || fallbackOrder || {};
  const merged = { ...base, ...(payload || {}) };
  const normalized = normalizeOrderRecord(merged);
  const items = normalizeOrderItems(
    merged.items ||
      merged.order_items ||
      merged.orderItems ||
      merged.products ||
      merged.details ||
      merged.detail_items ||
      []
  );
  const paymentSource = merged.payment || merged.summary || merged.payment_summary || {};
  const subtotal = pickNumber(merged, paymentSource, ["subtotal", "sub_total", "items_total", "product_total", "subtotal_produk"]);
  const shipping = pickNumber(merged, paymentSource, ["shipping_cost", "shippingCost", "delivery_fee", "deliveryFee", "ongkir", "biaya_pengiriman", "shipping", "shipping_fee"]);
  const discount = pickNumber(merged, paymentSource, ["discount", "discount_amount", "diskon"]);
  const total =
    pickNumber(merged, paymentSource, ["total", "total_amount", "grand_total", "grandTotal", "total_price", "amount"]) ||
    subtotal + shipping - discount;
  const customer = normalizeOrderCustomer(merged);

  return {
    ...normalized,
    items,
    customer,
    payment: {
      subtotal: subtotal || items.reduce((sum, item) => sum + item.subtotal, 0),
      shipping,
      discount,
      total,
    },
    timeline: normalizeOrderTimeline(merged, normalized),
  };
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const product = item.product || item.product_detail || {};
    const price = item.price ?? item.unit_price ?? item.product_price ?? product.price ?? 0;
    const quantity = item.quantity ?? item.qty ?? item.jumlah ?? 1;
    const subtotal = item.subtotal ?? item.total ?? item.line_total ?? toNumber(price) * toNumber(quantity);
    const image =
      resolveApiUrl(item.image) ||
      resolveApiUrl(product.image) ||
      resolveApiUrl(product.image_url) ||
      resolveApiUrl(product.thumbnail);

    return {
      id: item.id || item.uuid || item.order_item_id || product.id || `${index}`,
      name: item.name || item.product_name || item.title || product.name || product.title || "Produk",
      sku: item.sku || product.sku || product.code || "",
      price: toNumber(price),
      quantity: toNumber(quantity) || 1,
      subtotal: toNumber(subtotal),
      image,
    };
  });
}

function normalizeOrderCustomer(order) {
  const customer = order.customer || order.user || order.buyer || {};
  const shipping = order.shipping_address || order.shippingAddress || order.address || order.delivery_address || {};
  const name = getCustomerName(order);
  const addressText =
    typeof shipping === "string"
      ? shipping
      : [
          shipping.address,
          shipping.street,
          shipping.city,
          shipping.province || shipping.state,
          shipping.postal_code || shipping.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

  return {
    name,
    type: customer.type || customer.customer_type || "Pelanggan Baru",
    email: customer.email || order.customer_email || order.email || "",
    phone: customer.phone || customer.phone_number || order.customer_phone || order.phone || shipping.phone || "",
    address: addressText || order.shipping_address_text || order.address_text || "",
  };
}

function normalizeOrderTimeline(order, normalized) {
  const source = order.timeline || order.status_history || order.statusHistory || order.history || [];
  if (Array.isArray(source) && source.length) {
    return source.map((item) => ({
      label: item.label || item.title || getOrderStatusLabel(normalizeStatus(item.status || item.state || item.name)),
      time: formatOrderTime(item.created_at || item.createdAt || item.date || item.time, item.displayTime),
    }));
  }

  return [
    { label: statusToSentence(normalized.status), time: normalized.displayDate },
    { label: "Pembayaran Diterima", time: formatOrderTime(order.paid_at || order.paidAt || order.payment_date) },
    { label: "Pesanan Dibuat", time: formatOrderTime(order.created_at || order.createdAt || normalized.createdAt) },
  ].filter((item) => item.time && item.time !== "-");
}

function filterOrders(orders, query, status) {
  const needle = query.trim().toLowerCase();
  const statusNeedle = status === "Semua Status" ? "" : status.toLowerCase();

  return orders.filter((order) => {
    const matchesQuery = !needle || [order.code, order.customer, order.id].join(" ").toLowerCase().includes(needle);
    const matchesStatus = !statusNeedle || order.statusLabel.toLowerCase() === statusNeedle;
    return matchesQuery && matchesStatus;
  });
}

function getOrderId(order) {
  return order?.id || order?.uuid || order?.order_id || order?.orderId || order?._id;
}

function getCustomerName(order) {
  return (
    order.customer?.name ||
    order.user?.name ||
    order.buyer?.name ||
    order.customer_name ||
    order.customerName ||
    order.user_name ||
    order.userName ||
    order.buyer_name ||
    order.buyerName ||
    order.receiver_name ||
    order.receiverName ||
    order.recipient_name ||
    order.recipientName ||
    order.name ||
    extractRecipientFromShippingAddress(order) ||
    "Pelanggan"
  );
}

function extractRecipientFromShippingAddress(order) {
  const shipping = order.shipping_address || order.shippingAddress || order.address || order.destination_address;

  if (shipping && typeof shipping === "object") {
    return (
      shipping.recipient_name ||
      shipping.recipientName ||
      shipping.receiver_name ||
      shipping.receiverName ||
      shipping.buyer_name ||
      shipping.buyerName ||
      shipping.name ||
      ""
    );
  }

  if (typeof shipping === "string" && shipping.trim()) {
    const firstLine = shipping.split("\n")[0].trim();
    if (firstLine && firstLine.includes(" - ")) {
      const name = firstLine.split(" - ")[0].trim();
      if (name) return name;
    }
  }

  return "";
}

function buildCustomerNameMap(customers) {
  const map = new Map();
  for (const customer of customers) {
    const customerId = getCustomerId(customer);
    const name =
      customer.name ||
      customer.full_name ||
      customer.fullName ||
      customer.customer_name ||
      customer.customerName ||
      customer.profile?.name ||
      customer.user?.name ||
      customer.account?.name ||
      "";
    if (customerId && name) {
      map.set(String(customerId).trim().toLowerCase(), String(name));
    }
  }
  return map;
}

function attachOrderCustomerNames(orders, customerNameMap) {
  return orders.map((order) => {
    const userId =
      order.user_id ||
      order.userId ||
      order.customer_id ||
      order.customerId ||
      getCustomerId(order.customer || order.user || {});
    const matchedName = userId ? customerNameMap.get(String(userId).trim().toLowerCase()) : "";
    if (matchedName) {
      return { ...order, customer_name: matchedName };
    }

    const existingName = getCustomerName(order);
    if (existingName && existingName !== "Pelanggan") return order;

    return order;
  });
}

function getInitial(name) {
  return String(name || "P").trim().charAt(0).toUpperCase() || "P";
}

function formatOrderCode(value) {
  const text = String(value || "").trim();
  if (!text) return "#ORD-000";
  return text.startsWith("#") ? text : `#${text}`;
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase().replace(/\s+/g, "_");
  if (["sent", "shipped", "shipping", "delivered", "dikirim", "pengiriman"].includes(value)) return "dikirim";
  if (["done", "completed", "complete", "selesai", "success", "berhasil"].includes(value)) return "selesai";
  if (["cancelled", "canceled", "dibatalkan", "batal", "failed"].includes(value)) return "dibatalkan";
  return "diproses";
}

function getOrderStatusLabel(status) {
  if (status === "dikirim") return "Dikirim";
  if (status === "selesai") return "Selesai";
  if (status === "dibatalkan") return "Dibatalkan";
  return "Diproses";
}

function toBackendOrderStatus(status) {
  const value = normalizeStatus(status);
  if (value === "dikirim") return "DIKIRIM";
  if (value === "selesai") return "SELESAI";
  if (value === "dibatalkan") return "DIBATALKAN";
  return "DIPROSES";
}

function statusToSentence(status) {
  if (status === "dikirim") return "Sedang Dikirim";
  if (status === "selesai") return "Pesanan Selesai";
  if (status === "dibatalkan") return "Pesanan Dibatalkan";
  return "Sedang Diproses";
}

function normalizeDashboard(raw) {
  const payload = raw?.data?.dashboard || raw?.data || raw?.dashboard || raw || {};
  const stats = payload.stats || payload.summary || payload.metrics || {};

  return {
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
    totalSellers: pickNumber(payload, stats, [
      "totalSellers",
      "total_sellers",
      "sellersCount",
      "sellers_count",
      "sellerCount",
      "seller_count",
      "totalSeller",
      "total_seller",
      "jumlah_seller",
      "jumlah_sellers",
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
    activeProducts: pickNumber(payload, stats, [
      "activeProducts",
      "active_products",
      "productActive",
      "productsActive",
      "products_active",
      "totalProducts",
      "total_products",
      "produk_aktif",
    ]),
    salesChange: pickText(payload, stats, ["salesChange", "sales_change", "salesGrowth", "sales_growth", "revenueChange"]) || "",
    sellersChange: pickText(payload, stats, ["sellersChange", "sellers_change", "sellerGrowth", "seller_growth", "totalSellersChange", "total_sellers_change"]) || "",
    ordersChange: pickText(payload, stats, ["ordersChange", "orders_change", "newOrdersChange", "orderGrowth", "order_growth"]) || "",
    productsChange: pickText(payload, stats, ["productsChange", "products_change", "activeProductsChange", "lastProductUpdate"]) || "",
    topSellers: normalizeTopSellers(
      payload.topSellers ||
        payload.top_sellers ||
        payload.topSellerByRevenue ||
        payload.top_sellers_by_revenue ||
        payload.topSellersByEarnings ||
        payload.top_sellers_by_earnings ||
        payload.leaderboard ||
        []
    ),
    recentOrders: normalizeOrders(
      payload.recentOrders ||
        payload.recent_orders ||
        payload.latestOrders ||
        payload.latest_orders ||
        payload.orders ||
        []
    ),
  };
}

function normalizeTopSellers(source) {
  if (!Array.isArray(source)) return [];

  return source
    .map((item, index) => {
      const seller = item.seller || item.user || item.account || {};
      const stats = item.stats || item.summary || {};
      const avatar =
        item.photoprofil ||
        item.photo_profil ||
        item.photoProfil ||
        item.avatar ||
        item.avatar_url ||
        seller.photoprofil ||
        seller.photo_profil ||
        seller.photoProfil ||
        seller.avatar ||
        seller.avatar_url;

      return {
        name:
          item.seller_name ||
          item.sellerName ||
          item.store_name ||
          item.storeName ||
          item.store ||
          item.nama_toko ||
          item.username ||
          seller.name ||
          seller.username ||
          seller.store_name ||
          String(item.name || `Seller ${index + 1}`),
        earnings: pickNumber(item, stats, [
          "earnings",
          "total_earnings",
          "totalEarnings",
          "revenue",
          "total_revenue",
          "totalRevenue",
          "income",
          "penghasilan",
          "sales",
          "total_sales",
          "totalSales",
          "amount",
        ]),
        avatar: resolveApiUrl(avatar),
      };
    })
    .filter((seller) => seller.name && seller.earnings > 0)
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);
}

function normalizeOrders(source) {
  if (!Array.isArray(source)) return [];

  return source.slice(0, 3).map((order, index) => {
    const createdAt = order.created_at || order.createdAt || order.date || order.orderDate || order.updated_at;
    const status = String(order.status || order.order_status || order.state || "diproses").toLowerCase();

    return {
      id: order.id || order.uuid || order.order_id || order.orderNumber || index,
      code: order.code || order.order_code || order.orderNumber || order.order_number || order.order_id || `ORD-${String(order.id || index + 1).padStart(3, "0")}`,
      customer:
        order.customer?.name ||
        order.user?.name ||
        order.customer_name ||
        order.customerName ||
        order.name ||
        "Pelanggan",
      status,
      statusLabel: getStatusLabel(status),
      displayTime: formatOrderTime(createdAt, order.time || order.displayTime),
    };
  });
}

function pickNumber(primary, secondary, keys) {
  for (const key of keys) {
    const value = primary?.[key] ?? secondary?.[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "object") continue;
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

function pickDateText(primary, secondary, keys) {
  for (const key of keys) {
    const value = primary?.[key] ?? secondary?.[key];
    if (value === undefined || value === null || value === "") continue;
    return String(value);
  }
  return "";
}

function toNumber(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
  return Number(normalized) || 0;
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

function formatOrderTime(dateValue, fallback) {
  if (fallback) return String(fallback);
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status) {
  if (["sent", "shipped", "delivered", "dikirim"].includes(status)) return "DIKIRIM";
  if (["done", "completed", "complete", "selesai"].includes(status)) return "SELESAI";
  if (["cancelled", "canceled", "dibatalkan"].includes(status)) return "BATAL";
  return "DIPROSES";
}

function getStatusClass(status) {
  if (["sent", "shipped", "delivered", "dikirim"].includes(status)) return "is-sent";
  if (["done", "completed", "complete", "selesai"].includes(status)) return "is-done";
  if (["cancelled", "canceled", "dibatalkan"].includes(status)) return "is-cancelled";
  return "is-processing";
}

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

function extractVouchers(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.vouchers)) return raw.data.vouchers;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.data?.results)) return raw.data.results;
  if (Array.isArray(raw?.vouchers)) return raw.vouchers;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}

function normalizeVouchers(source) {
  return extractVouchers(source).map((voucher, index) => normalizeVoucher(voucher, index));
}

function normalizeVoucherDetail(raw, fallbackVoucher) {
  const payload = raw?.data?.voucher || raw?.data?.detail || raw?.data || raw?.voucher || raw?.detail || raw;
  const base = fallbackVoucher?.raw || fallbackVoucher || {};
  return normalizeVoucher({ ...base, ...(payload || {}) });
}

function normalizeVoucher(voucher = {}, index = 0) {
  const id = getVoucherId(voucher) || `voucher-${index}`;
  const discountType = normalizeVoucherType(
    voucher.discount_type ||
      voucher.discountType ||
      voucher.type ||
      voucher.kind ||
      voucher.rule?.type
  );
  const discountValue = pickNumber(voucher, voucher.rule || voucher.details || {}, [
    "discount_value",
    "discountValue",
    "value",
    "percent",
    "percentage",
    "discount_percent",
    "discountPercentage",
    "amount",
    "discount_amount",
    "discountAmount",
    "nominal",
  ]);
  const minPurchase = pickNumber(voucher, voucher.rule || voucher.details || {}, [
    "min_purchase",
    "minPurchase",
    "minimum_purchase",
    "minimumPurchase",
    "min_order",
    "minOrder",
    "min_order_amount",
    "minimum",
    "min_spend",
  ]);
  const maxDiscount = pickNumber(voucher, voucher.rule || voucher.details || {}, [
    "max_discount",
    "maxDiscount",
    "maximum_discount",
    "discount_limit",
    "discountLimit",
    "cap",
    "max_cap",
  ]);
  const usageLimit = pickNumber(voucher, voucher.rule || voucher.details || {}, [
    "usage_limit",
    "usageLimit",
    "usage_quota",
    "usageQuota",
    "max_uses",
    "maxUses",
    "quota",
    "total_quota",
    "max_usage",
  ]);
  const usedCount = pickNumber(voucher, voucher.stats || voucher.usage || voucher.details || {}, [
    "used_count",
    "usedCount",
    "usage_count",
    "usageCount",
    "redeem_count",
    "redeemCount",
    "uses",
    "usage",
    "used",
  ]);
  const startsAt = pickDateText(voucher, voucher.rule || voucher.details || {}, [
    "starts_at",
    "startsAt",
    "valid_from",
    "validFrom",
    "start_date",
    "startDate",
    "start",
    "active_from",
    "activeFrom",
  ]);
  const endsAt = pickDateText(voucher, voucher.rule || voucher.details || {}, [
    "ends_at",
    "endsAt",
    "valid_until",
    "validUntil",
    "valid_to",
    "validTo",
    "end_date",
    "endDate",
    "expiry",
    "expires_at",
    "expiresAt",
    "expired_at",
    "expiration_date",
    "active_to",
    "activeTo",
  ]);
  const createdAt = voucher.created_at || voucher.createdAt;
  const isExpired = isVoucherExpired(endsAt);
  const isActive = normalizeVoucherActive(voucher, isExpired);

  return {
    id,
    code: voucher.code || voucher.voucher_code || voucher.voucherCode || voucher.promo_code || `VOUCHER-${index + 1}`,
    name:
      voucher.name ||
      voucher.title ||
      voucher.label ||
      voucher.description ||
      voucher.deskripsi ||
      "",
    description: voucher.description || voucher.deskripsi || voucher.name || voucher.title || "",
    discountType,
    discountTypeLabel: discountType === "nominal" ? "Nominal" : "Persentase",
    discountValue,
    discountLabel: discountType === "nominal" ? formatRupiah(discountValue) : `${formatDiscountPercent(discountValue)}`,
    minPurchase,
    maxDiscount,
    usageLimit,
    usedCount,
    startsAt,
    endsAt,
    displayStartsAt: formatDateOnly(startsAt),
    displayEndsAt: formatDateOnly(endsAt),
    createdAt,
    isExpired,
    isActive,
    isActiveNow: isActive,
    statusLabel: isExpired ? "Kadaluarsa" : isActive ? "Aktif" : "Nonaktif",
    raw: voucher,
  };
}

function normalizeVoucherType(value) {
  const type = String(value || "").toLowerCase();
  if (
    ["nominal", "amount", "fixed", "cash", "rupiah", "idr", "rupiah_amount"].includes(type)
  ) {
    return "nominal";
  }
  return "percent";
}

function normalizeVoucherActive(voucher, isExpired) {
  if (isExpired) return false;
  if (voucher.is_active !== undefined && voucher.is_active !== null) return Boolean(voucher.is_active);
  if (voucher.isActive !== undefined && voucher.isActive !== null) return Boolean(voucher.isActive);
  if (voucher.status !== undefined && voucher.status !== null) {
    const status = String(voucher.status).toLowerCase();
    if (["inactive", "nonaktif", "disabled", "expired", "non-active"].includes(status)) return false;
    return true;
  }
  if (voucher.active !== undefined && voucher.active !== null) return Boolean(voucher.active);
  return true;
}

function isVoucherExpired(endsAt) {
  if (!endsAt) return false;
  const date = new Date(endsAt);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

function filterVouchers(vouchers, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return vouchers;

  return vouchers.filter((voucher) =>
    [voucher.code, voucher.name, voucher.description, voucher.discountTypeLabel, voucher.statusLabel, voucher.id]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
}

function summarizeVouchers(vouchers) {
  const active = vouchers.filter((voucher) => voucher.isActiveNow && !voucher.isExpired).length;
  const expired = vouchers.filter((voucher) => voucher.isExpired).length;
  const usedCount = vouchers.reduce((sum, voucher) => sum + (voucher.usedCount || 0), 0);

  return {
    total: vouchers.length,
    active,
    expired,
    usedCount,
    activeText: active === vouchers.length && vouchers.length > 0 ? "Semua aktif" : `${formatCompactNumber(active)} voucher aktif`,
  };
}

function getVoucherId(voucher) {
  return voucher?.id || voucher?.uuid || voucher?.voucher_id || voucher?.voucherId || voucher?._id;
}

function getVoucherApiId(voucher) {
  const rawId = getVoucherId(voucher?.raw);
  if (rawId) return rawId;
  if (voucher?.apiId) return voucher.apiId;
  if (voucher?.id && !/^voucher-\d+$/i.test(String(voucher.id))) return voucher.id;
  return "";
}

function getVoucherFormState(voucher, isCreate) {
  const source = isCreate ? {} : (voucher || {});
  return {
    code: source.code || "",
    name: source.name || "",
    discountType: source.discountTypeLabel === "Nominal" ? "Nominal" : "Persentase",
    discountValue: source.discountValue ?? "",
    minPurchase: source.minPurchase ?? "",
    maxDiscount: source.maxDiscount ?? "",
    startsAt: toDateInputValue(source.startsAt),
    endsAt: toDateInputValue(source.endsAt),
    usageLimit: source.usageLimit ?? "",
    isActive: isCreate ? true : (source.isActive ?? true),
  };
}

function toDateInputValue(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function buildVoucherPayload(form, { isCreate: _isCreate = false } = {}) {
  const payload = {
    code: String(form.code || "").trim().toUpperCase(),
    name: String(form.name || "").trim(),
    description: String(form.name || "").trim(),
    discount_percent: toNumber(form.discountValue),
  };

  if (form.minPurchase !== "" && form.minPurchase !== null && form.minPurchase !== undefined) {
    payload.min_purchase = toNumber(form.minPurchase);
  }
  if (form.maxDiscount !== "" && form.maxDiscount !== null && form.maxDiscount !== undefined) {
    payload.max_discount = toNumber(form.maxDiscount);
  }
  if (form.startsAt) payload.valid_from = toDateTimeValue(form.startsAt);
  if (form.endsAt) payload.valid_until = toDateTimeValue(form.endsAt);
  if (form.usageLimit !== "" && form.usageLimit !== null && form.usageLimit !== undefined) {
    payload.quota = Math.trunc(toNumber(form.usageLimit));
  }
  payload.is_active = Boolean(form.isActive);

  return payload;
}

function toDateTimeValue(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toISOString();
}

function formatDiscountPercent(value) {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: value % 1 ? 1 : 0 }).format(value || 0)}%`;
}

function extractNotifications(raw) {
  if (Array.isArray(raw)) return raw;

  const candidates = [
    raw?.data?.notifications,
    raw?.data?.items,
    raw?.data?.results,
    raw?.notifications,
    raw?.items,
    raw?.results,
    raw?.notification,
    raw?.data?.notification,
    raw?.data,
    raw,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (looksLikeNotification(candidate)) return [candidate];
  }

  return [];
}

function looksLikeNotification(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      (getNotificationId(value) ||
        value.title ||
        value.message ||
        value.body ||
        value.notification_type ||
        value.created_at ||
        value.createdAt)
  );
}

function normalizeNotifications(source) {
  return extractNotifications(source)
    .map((notification, index) => normalizeNotification(notification, index))
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime() || 0;
      const bTime = new Date(b.createdAt || 0).getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, 8);
}

function normalizeNotification(notification, index = 0) {
  const type = normalizeNotificationType(notification);
  const createdAt =
    notification.created_at ||
    notification.createdAt ||
    notification.timestamp ||
    notification.time ||
    notification.date ||
    notification.updated_at;
  const message =
    notification.message ||
    notification.body ||
    notification.description ||
    notification.content ||
    notification.text ||
    getNotificationFallbackMessage(type);

  return {
    apiId: getNotificationId(notification),
    id: getNotificationId(notification) || `notification-${createdAt || index}`,
    type,
    accent: getNotificationAccent(type),
    title: notification.title || notification.subject || notification.heading || getNotificationFallbackTitle(type, notification),
    message,
    createdAt,
    displayTime: formatRelativeTime(createdAt),
    isRead: isNotificationRead(notification),
    raw: notification,
  };
}

function mergeNotifications(incoming, current) {
  const seen = new Set();

  return [...extractNotifications(incoming), ...extractNotifications(current)].filter((notification, index) => {
    const id = getNotificationId(notification) || `${notification.title || notification.message || "notification"}-${index}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function getNotificationId(notification) {
  return notification?.id || notification?.uuid || notification?.notification_id || notification?.notificationId || notification?._id;
}

function isNotificationRead(notification) {
  if (!notification || typeof notification !== "object") return false;
  if (notification.is_read !== undefined) return Boolean(notification.is_read);
  if (notification.isRead !== undefined) return Boolean(notification.isRead);
  if (notification.read !== undefined) return Boolean(notification.read);
  if (notification.read_at || notification.readAt) return true;
  return String(notification.status || "").toLowerCase() === "read";
}

function countUnreadNotifications(raw) {
  return extractNotifications(raw).filter((notification) => !isNotificationRead(notification)).length;
}

function extractUnreadCount(raw) {
  if (typeof raw === "number") return raw;

  const candidates = [
    raw?.unread_count,
    raw?.unreadCount,
    raw?.count,
    raw?.total,
    raw?.data?.unread_count,
    raw?.data?.unreadCount,
    raw?.data?.count,
    raw?.data?.total,
    raw?.meta?.unread_count,
    raw?.meta?.unreadCount,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== "") return toNumber(candidate);
  }

  return null;
}

function normalizeNotificationType(notification) {
  const value = String(
    notification.type ||
      notification.notification_type ||
      notification.category ||
      notification.event ||
      notification.kind ||
      notification.title ||
      notification.message ||
      ""
  ).toLowerCase();

  if (value.includes("stock") || value.includes("stok") || value.includes("inventory")) return "stock";
  if (value.includes("customer") || value.includes("pelanggan") || value.includes("register")) return "customer";
  if (value.includes("order") || value.includes("pesanan") || value.includes("checkout")) return "order";
  return "general";
}

function getNotificationAccent(type) {
  if (type === "stock") return "danger";
  if (type === "customer") return "neutral";
  if (type === "order") return "pink";
  return "soft";
}

function getNotificationIcon(type) {
  if (type === "stock") return AlertTriangle;
  if (type === "customer") return UserCog;
  if (type === "order") return ShoppingBag;
  return Bell;
}

function getNotificationFallbackTitle(type, notification) {
  const orderCode = notification.order_code || notification.orderCode || notification.order_number || notification.orderNumber;
  const productName = notification.product_name || notification.productName || notification.product?.name;
  const customerName = notification.customer_name || notification.customerName || notification.user?.name || notification.customer?.name;

  if (type === "order") return orderCode ? `New Order ${formatOrderCode(orderCode)}` : "New Order";
  if (type === "stock") return productName ? `Stock Low: ${productName}` : "Stock Low";
  if (type === "customer") return customerName ? `Pelanggan Baru: ${customerName}` : "New Customer Registered";
  return "Notifikasi Baru";
}

function getNotificationFallbackMessage(type) {
  if (type === "order") return "Pesanan baru telah diterima dan menunggu proses.";
  if (type === "stock") return "Stok produk perlu diperiksa kembali.";
  if (type === "customer") return "Pelanggan baru telah mendaftar.";
  return "Ada pembaruan baru untuk admin.";
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return "Baru saja";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return "Baru saja";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari yang lalu`;

  return formatDateOnly(dateValue);
}

function formatBadgeCount(value) {
  return value > 99 ? "99+" : String(value);
}

function getStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem("authUser") || "{}");
    return buildAdminUser(user);
  } catch {
    return buildAdminUser({});
  }
}

function buildAdminUser(user) {
  const profile = user?.profile || user?.user || user?.account || {};
  const name =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    profile?.name ||
    profile?.full_name ||
    profile?.username ||
    "Admin";
  const avatar = resolveApiUrl(
    user?.photoprofil ||
      user?.photo_profil ||
      user?.photoProfil ||
      user?.avatar ||
      user?.avatar_url ||
      user?.photo ||
      profile?.photoprofil ||
      profile?.photo_profil ||
      profile?.photoProfil ||
      profile?.avatar ||
      profile?.avatar_url ||
      profile?.photo
  );
  return {
    id: user?.id || user?.uuid || user?.user_id || user?.userId || user?.account_id || user?.accountId || profile?.id || profile?.user_id || profile?.userId || "",
    name,
    firstName: String(name).split(" ")[0] || "Admin",
    email: user?.email || user?.mail || profile?.email || profile?.mail || "",
    avatar,
    initials: getInitials(name),
  };
}
