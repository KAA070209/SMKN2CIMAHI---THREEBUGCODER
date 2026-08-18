import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import {
  createNotificationsSocket,
  createCategory,
  createAccount,
  createRecipe,
  createVoucher,
  deleteCategory,
  deleteRecipe,
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
  fetchRecipes,
  fetchUnreadNotificationCount,
  fetchVouchers,
  markAllNotificationsRead,
  markNotificationRead,
  readAccount,
  readRecipe,
  readVoucher,
  updateAccount,
  updateAccountStatus,
  updateCategory,
  updateCustomerData,
  updateOrderStatus,
  updateRecipe,
  updateVoucher,
} from "../lib/adminApi.js";
import { fetchMe } from "../lib/authApi.js";
import "./AdminDashboard.css";
import { ConfirmDialog } from "./ConfirmDialog.jsx";
import { navItems } from "./adminDashboard/constants.jsx";
import {
  DashboardHome,
  NotificationsDropdown,
  AccountManagementPage,
  CustomerManagementPage,
  OrderManagementPage,
  OrderDetailPage,
  CustomerProfileDialog,
  CustomerEditDialog,
  CustomerOrdersDialog,
  CategoryManagementPage,
  CategoryModal,
  AccountModal,
  CategoryDeleteDialog,
  VoucherManagementPage,
  VoucherModal,
  VoucherDeleteDialog,
  RecipeManagementPage,
  RecipeDetailPage,
  RecipeFormPage,
  RecipeDeleteDialog,
} from "./adminDashboard/views.jsx";
import {
  extractCustomers,
  fetchAllCustomers,
  extractAccountsSummary,
  mergeAccountUsers,
  normalizeAccounts,
  normalizeAccountDetail,
  filterAccounts,
  summarizeAccounts,
  getAccountId,
  normalizeCustomers,
  normalizeCustomerDetail,
  normalizeCustomerOrders,
  filterCustomers,
  summarizeCustomers,
  getCustomerId,
  buildCustomerPayload,
  buildAccountPayload,
  buildAccountStatusPayload,
  extractOrders,
  normalizeOrderRecords,
  normalizeOrderDetail,
  filterOrders,
  getOrderId,
  buildCustomerNameMap,
  attachOrderCustomerNames,
  toBackendOrderStatus,
  normalizeDashboard,
  extractCategories,
  extractProducts,
  countProductsByCategory,
  normalizeCategories,
  filterCategories,
  getCategoryId,
  getCategoryApiId,
  formatCategoryDeleteError,
  buildCategoryPayload,
  extractVouchers,
  normalizeVouchers,
  normalizeVoucherDetail,
  filterVouchers,
  summarizeVouchers,
  getVoucherId,
  getVoucherApiId,
  buildVoucherPayload,
  extractRecipes,
  normalizeRecipes,
  normalizeRecipeDetail,
  filterRecipes,
  summarizeRecipes,
  getRecipeApiId,
} from "./adminDashboard/helpers.jsx";
import {
  extractNotifications,
  normalizeNotifications,
  mergeNotifications,
  getNotificationId,
  isNotificationRead,
  countUnreadNotifications,
  extractUnreadCount,
  formatBadgeCount,
  getStoredUser,
  buildAdminUser,
} from "./adminDashboard/notifications.js";

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
  const [rawRecipes, setRawRecipes] = useState([]);
  const [rawRecipeProducts, setRawRecipeProducts] = useState([]);
  const [recipeQuery, setRecipeQuery] = useState("");
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState("Semua Kategori");
  const [isRecipesLoading, setIsRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [rawRecipeDetail, setRawRecipeDetail] = useState(null);
  const [isRecipeDetailLoading, setIsRecipeDetailLoading] = useState(false);
  const [recipeFormMode, setRecipeFormMode] = useState("");
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [deletingRecipe, setDeletingRecipe] = useState(null);
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
  const recipes = useMemo(() => normalizeRecipes(rawRecipes, categories), [rawRecipes, categories]);
  const visibleRecipes = useMemo(
    () => filterRecipes(recipes, recipeQuery, recipeCategoryFilter),
    [recipes, recipeCategoryFilter, recipeQuery]
  );
  const recipeDetail = useMemo(
    () => normalizeRecipeDetail(rawRecipeDetail, selectedRecipe, categories),
    [rawRecipeDetail, selectedRecipe, categories]
  );
  const recipeStats = useMemo(() => summarizeRecipes(recipes), [recipes]);
  const [adminUser, setAdminUser] = useState(getStoredUser);
  const isOrderDetail = adminView === "orderDetail";
  const isRecipeDetail = adminView === "recipeDetail";
  const isRecipeForm = adminView === "recipeForm";
  const isOrderWorkspace = adminView === "orders" || isOrderDetail;
  const isRecipeWorkspace = adminView === "recipes" || isRecipeDetail || isRecipeForm;

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

  const loadRecipeOptions = useCallback(async (signal) => {
    try {
      const [categoriesResult, productsResult] = await Promise.allSettled([
        fetchCategories({ signal }),
        fetchProducts({ signal }),
      ]);

      if (categoriesResult.status === "fulfilled") {
        setRawCategories(extractCategories(categoriesResult.value));
      }
      if (productsResult.status === "fulfilled") {
        setRawRecipeProducts(extractProducts(productsResult.value));
      }
    } catch {
      /* Recipe options are supportive; main recipe error stays focused on /recipes. */
    }
  }, []);

  const loadRecipes = useCallback(async (signal) => {
    setIsRecipesLoading(true);
    setRecipesError("");

    try {
      const data = await fetchRecipes({ limit: 100, signal });
      setRawRecipes(extractRecipes(data));
    } catch (err) {
      if (err?.name === "AbortError") return;
      setRecipesError(err instanceof Error ? err.message : "Gagal memuat recipe crafting.");
    } finally {
      if (!signal?.aborted) setIsRecipesLoading(false);
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
    if (!["recipes", "recipeDetail", "recipeForm"].includes(adminView)) return undefined;
    const controller = new AbortController();
    loadRecipeOptions(controller.signal);
    return () => controller.abort();
  }, [adminView, loadRecipeOptions]);

  useEffect(() => {
    if (adminView !== "recipes") return undefined;
    const controller = new AbortController();
    loadRecipes(controller.signal);
    return () => controller.abort();
  }, [adminView, loadRecipes]);

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
    if (!["dashboard", "orders", "categories", "recipes", "recipeDetail", "recipeForm", "vouchers", "customers", "accounts"].includes(nextView)) return;
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
    setRecipesError("");
    setActiveOrderMenuId(null);
    setActiveCustomerMenuId(null);
    setActiveAccountMenuId(null);
    setActiveVoucherMenuId(null);
    setIsStatusEditorOpen(false);
    setIsCategoryModalOpen(false);
    setIsVoucherModalOpen(false);
    setVoucherModalMode("");
    if (nextView !== "recipeForm") setRecipeFormMode("");
    setAccountModalMode("");
    setCustomerModalMode("");
    setIsNotificationsOpen(false);
    setIsAccountFilterOpen(false);
    setIsCustomerFilterOpen(false);
    setSelectedCustomer(null);
    setSelectedAccount(null);
    setSelectedVoucher(null);
    if (nextView !== "recipeDetail" && nextView !== "recipeForm") {
      setSelectedRecipe(null);
      setRawRecipeDetail(null);
    }
    setEditingCategory(null);
    setDeletingCategory(null);
    setDeletingVoucher(null);
    setDeletingRecipe(null);
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

  const handleOpenCreateRecipe = useCallback(() => {
    setRecipeFormMode("create");
    setSelectedRecipe(null);
    setRawRecipeDetail(null);
    setRecipesError("");
    setAdminView("recipeForm");
    setIsSidebarOpen(false);
  }, []);

  const handleOpenRecipeDetail = useCallback(async (recipe) => {
    const recipeId = getRecipeApiId(recipe);
    if (!recipeId) {
      setRecipesError("ID recipe tidak ditemukan.");
      return;
    }

    setSelectedRecipe(recipe);
    setRawRecipeDetail(null);
    setRecipesError("");
    setIsRecipeDetailLoading(true);
    setAdminView("recipeDetail");
    setIsSidebarOpen(false);

    try {
      const data = await readRecipe(recipeId);
      setRawRecipeDetail(data);
    } catch (err) {
      setRecipesError(err instanceof Error ? err.message : "Gagal memuat detail recipe.");
    } finally {
      setIsRecipeDetailLoading(false);
    }
  }, []);

  const handleOpenEditRecipe = useCallback(async (recipe) => {
    const recipeId = getRecipeApiId(recipe);
    if (!recipeId) {
      setRecipesError("ID recipe tidak ditemukan.");
      return;
    }

    setRecipeFormMode("edit");
    setSelectedRecipe(recipe);
    setRawRecipeDetail(null);
    setRecipesError("");
    setIsRecipeDetailLoading(true);
    setAdminView("recipeForm");
    setIsSidebarOpen(false);

    try {
      const data = await readRecipe(recipeId);
      setRawRecipeDetail(data);
    } catch (err) {
      setRecipesError(err instanceof Error ? err.message : "Gagal memuat detail recipe.");
    } finally {
      setIsRecipeDetailLoading(false);
    }
  }, []);

  const handleSaveRecipe = useCallback(async (payload) => {
    const isCreate = recipeFormMode === "create";
    const recipeId = getRecipeApiId(recipeDetail || selectedRecipe);

    if (!isCreate && !recipeId) {
      setRecipesError("ID recipe tidak ditemukan.");
      return;
    }

    setIsSavingRecipe(true);
    setRecipesError("");

    try {
      if (isCreate) {
        await createRecipe(payload);
      } else {
        await updateRecipe(recipeId, payload);
      }
      setRecipeFormMode("");
      setSelectedRecipe(null);
      setRawRecipeDetail(null);
      setAdminView("recipes");
      await loadRecipes();
    } catch (err) {
      setRecipesError(err instanceof Error ? err.message : "Gagal menyimpan recipe.");
    } finally {
      setIsSavingRecipe(false);
    }
  }, [loadRecipes, recipeDetail, recipeFormMode, selectedRecipe]);

  const handleConfirmDeleteRecipe = useCallback(async () => {
    if (!deletingRecipe) return;

    const recipeId = getRecipeApiId(deletingRecipe);
    if (!recipeId) {
      setRecipesError("ID recipe tidak ditemukan.");
      return;
    }

    setIsSavingRecipe(true);
    setRecipesError("");

    try {
      await deleteRecipe(recipeId);
      setRawRecipes((items) =>
        extractRecipes(items).filter((item) => String(getRecipeApiId(item)) !== String(recipeId))
      );
      setDeletingRecipe(null);
      if (adminView === "recipeDetail") {
        setSelectedRecipe(null);
        setRawRecipeDetail(null);
        setAdminView("recipes");
      }
    } catch (err) {
      setRecipesError(err instanceof Error ? err.message : "Gagal menghapus recipe.");
    } finally {
      setIsSavingRecipe(false);
    }
  }, [adminView, deletingRecipe]);

  return (
    <main className={`admin-shell ${isOrderWorkspace ? "admin-shell--orders" : ""} ${isRecipeWorkspace ? "admin-shell--recipes" : ""} ${adminView === "categories" ? "admin-shell--categories" : ""}`}>
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
            const active =
              adminView === item.view ||
              (isOrderDetail && item.view === "orders") ||
              ((isRecipeDetail || isRecipeForm) && item.view === "recipes");
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
        {!isOrderWorkspace && !isRecipeDetail && !isRecipeForm && (
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
                <strong>{adminView === "customers" ? "Pelanggan" : adminView === "accounts" ? "Kelola Akun" : adminView === "orders" ? "Pesanan" : adminView === "recipes" ? "Recipe Crafting" : adminView === "vouchers" ? "Voucher" : "Dashboard"}</strong>
            </div>
          )}

          <label className="admin-search">
            <Search size={21} strokeWidth={2.2} />
            <input
              type="search"
                value={adminView === "categories" ? categoryQuery : adminView === "recipes" ? recipeQuery : adminView === "vouchers" ? voucherQuery : adminView === "customers" ? customerQuery : adminView === "accounts" ? accountQuery : ""}
              onChange={(event) => {
                if (adminView === "categories") setCategoryQuery(event.target.value);
                if (adminView === "recipes") setRecipeQuery(event.target.value);
                if (adminView === "vouchers") setVoucherQuery(event.target.value);
                if (adminView === "customers") setCustomerQuery(event.target.value);
                if (adminView === "accounts") setAccountQuery(event.target.value);
              }}
                placeholder={adminView === "categories" ? "Cari kategori..." : adminView === "recipes" ? "Cari recipe..." : adminView === "vouchers" ? "Cari voucher..." : adminView === "customers" ? "Cari pelanggan..." : adminView === "accounts" ? "Cari akun..." : "Cari pesanan, produk.."}
              aria-label={adminView === "categories" ? "Cari kategori" : adminView === "recipes" ? "Cari recipe" : adminView === "vouchers" ? "Cari voucher" : adminView === "customers" ? "Cari pelanggan" : adminView === "accounts" ? "Cari akun" : "Cari pesanan atau produk"}
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
        ) : adminView === "recipes" ? (
          <RecipeManagementPage
            categories={categories}
            recipes={visibleRecipes}
            error={recipesError}
            isLoading={isRecipesLoading}
            query={recipeQuery}
            rawCount={recipes.length}
            stats={recipeStats}
            categoryFilter={recipeCategoryFilter}
            onCategoryFilterChange={setRecipeCategoryFilter}
            onQueryChange={setRecipeQuery}
            onAdd={handleOpenCreateRecipe}
            onDelete={setDeletingRecipe}
            onDetail={handleOpenRecipeDetail}
            onEdit={handleOpenEditRecipe}
            onRefresh={() => {
              loadRecipes();
              loadRecipeOptions();
            }}
          />
        ) : isRecipeDetail ? (
          <RecipeDetailPage
            recipe={recipeDetail}
            error={recipesError}
            isLoading={isRecipeDetailLoading}
            onBack={() => handleViewChange("recipes")}
            onDelete={() => setDeletingRecipe(recipeDetail)}
            onEdit={() => recipeDetail && handleOpenEditRecipe(recipeDetail)}
            onRefresh={() => selectedRecipe && handleOpenRecipeDetail(selectedRecipe)}
            onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
            isSidebarOpen={isSidebarOpen}
          />
        ) : isRecipeForm ? (
          <RecipeFormPage
            categories={categories}
            products={rawRecipeProducts}
            recipe={recipeFormMode === "edit" ? recipeDetail : null}
            error={recipesError}
            isLoading={isRecipeDetailLoading}
            isSaving={isSavingRecipe}
            mode={recipeFormMode}
            onCancel={() => handleViewChange("recipes")}
            onSubmit={handleSaveRecipe}
            onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
            isSidebarOpen={isSidebarOpen}
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

      {deletingRecipe && (
        <RecipeDeleteDialog
          recipe={deletingRecipe}
          error={recipesError}
          isDeleting={isSavingRecipe}
          onCancel={() => {
            setDeletingRecipe(null);
            setRecipesError("");
          }}
          onConfirm={handleConfirmDeleteRecipe}
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
