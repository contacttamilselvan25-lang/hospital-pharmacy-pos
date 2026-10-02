import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  ShieldCheck, 
  ShoppingCart, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Pill, 
  Lock, 
  LogOut, 
  ShieldAlert, 
  KeyRound, 
  ArrowRight, 
  TrendingUp, 
  Package, 
  Clock, 
  Ban, 
  Boxes, 
  BellRing, 
  LayoutDashboard, 
  ClipboardList, 
  History, 
  PlusCircle, 
  Sliders, 
  Search, 
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Trash2,
  Plus,
  Minus,
  BarChart3,
  FileText,
  UserPlus,
  Edit3,
  UserCheck,
  Download,
  FileSpreadsheet,
  UserCog
} from 'lucide-react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000/api';

export default function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState('POS'); // 'POS' | 'DASHBOARD' | 'INVENTORY' | 'REPORTS' | 'MOVEMENTS'

  // Reports State (Phase 9)
  const [reportsSubTab, setReportsSubTab] = useState('SALES'); // 'SALES' | 'LOW_STOCK' | 'EXPIRY'
  const [salesReportData, setSalesReportData] = useState(null);
  const [invoicesReportData, setInvoicesReportData] = useState([]);
  const [lowStockReportData, setLowStockReportData] = useState([]);
  const [expiryReportData, setExpiryReportData] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Server Health State
  const [backendHealth, setBackendHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  // Authentication State
  const [token, setToken] = useState(() => localStorage.getItem('pharmacy_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pharmacy_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login Form State (Strict manual entry - no auto-fill)
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Staff Security & Passkeys State (Admin Passkey Management & CRUD)
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingPasskeyVal, setEditingPasskeyVal] = useState('');
  const [passkeyFeedback, setPasskeyFeedback] = useState(null);

  // Staff Management Modals State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('cashier');
  const [newStaffPasskey, setNewStaffPasskey] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [staffModalLoading, setStaffModalLoading] = useState(false);
  const [staffModalError, setStaffModalError] = useState(null);

  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState(null);
  const [editStaffFullName, setEditStaffFullName] = useState('');
  const [editStaffUsername, setEditStaffUsername] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('cashier');
  const [editStaffPasskey, setEditStaffPasskey] = useState('');
  const [editStaffPassword, setEditStaffPassword] = useState('');
  const [editStaffActive, setEditStaffActive] = useState(1);
  const [editStaffEmail, setEditStaffEmail] = useState('');

  // Admin Self Profile Modal (Change own name / passkey)
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePasskey, setProfilePasskey] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Daily Archive & Sales History Clear State
  const [archivedReportsList, setArchivedReportsList] = useState([]);
  const [loadingArchives, setLoadingArchives] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [clearHistoryPasskey, setClearHistoryPasskey] = useState('');
  const [clearHistoryLoading, setClearHistoryLoading] = useState(false);
  const [clearHistoryResult, setClearHistoryResult] = useState(null);
  const [clearHistoryError, setClearHistoryError] = useState(null);
  const [autoSaveDailyLoading, setAutoSaveDailyLoading] = useState(false);
  const [autoSaveDailyFeedback, setAutoSaveDailyFeedback] = useState(null);

  // Dashboard & Alerts State
  const [dashboardStats, setDashboardStats] = useState(null);
  const [alertsData, setAlertsData] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [alertFilter, setAlertFilter] = useState('ALL');

  // Inventory Table State
  const [inventoryList, setInventoryList] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFormFilter, setInventoryFormFilter] = useState('ALL');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('ALL');
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Stock Movements State
  const [movementsList, setMovementsList] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // POS BILLING TERMINAL STATE (Phase 6 & 7)
  const [posSearch, setPosSearch] = useState('');
  const [posFormFilter, setPosFormFilter] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Patient');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'cash' | 'card' | 'upi'
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // Modals State
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedBatchForStock, setSelectedBatchForStock] = useState(null);
  const [stockChangeInput, setStockChangeInput] = useState(50);
  const [stockReasonInput, setStockReasonInput] = useState('New distributor shipment received');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);

  // Add Medicine Form Fields
  const [newMedName, setNewMedName] = useState('');
  const [newMedGeneric, setNewMedGeneric] = useState('');
  const [newMedBrand, setNewMedBrand] = useState('');
  const [newMedStrength, setNewMedStrength] = useState('');
  const [newMedForm, setNewMedForm] = useState('Tablet');
  const [newMedUnit, setNewMedUnit] = useState('strip');
  const [newMedMfg, setNewMedMfg] = useState('');
  const [newMedReorder, setNewMedReorder] = useState(50);
  const [newMedCritical, setNewMedCritical] = useState(15);
  const [newMedBatch, setNewMedBatch] = useState('BATCH-2026-01');
  const [newMedExpiry, setNewMedExpiry] = useState('2027-12-31');
  const [newMedQty, setNewMedQty] = useState(100);
  const [newMedPrice, setNewMedPrice] = useState(25.00);

  // Fetch backend health
  const checkBackendHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      const data = await response.json();
      setBackendHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to connect to backend:', err);
      setHealthError(err.message || 'Unable to connect to backend server');
      setBackendHealth(null);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoadingHealth(false);
    }
  };

  // Fetch Dashboard Stats & Alerts
  const fetchDashboardData = async (activeToken) => {
    const authToken = activeToken || token;
    if (!authToken) return;

    setLoadingDashboard(true);
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE}/dashboard/alerts`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setDashboardStats(stats);
      }
      if (alertsRes.ok) {
        const alertsJson = await alertsRes.json();
        setAlertsData(alertsJson.alerts || []);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Fetch Inventory List
  const fetchInventory = async (activeToken) => {
    const authToken = activeToken || token;
    if (!authToken) return;

    setLoadingInventory(true);
    try {
      let url = `${API_BASE}/inventory?search=${encodeURIComponent(inventorySearch)}&form=${inventoryFormFilter}`;
      if (inventoryStatusFilter !== 'ALL') {
        url += `&alert_type=${inventoryStatusFilter}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInventoryList(data.inventory || []);
      }
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Fetch Stock Movements History
  const fetchMovements = async (activeToken) => {
    const authToken = activeToken || token;
    if (!authToken) return;

    setLoadingMovements(true);
    try {
      const res = await fetch(`${API_BASE}/inventory/movements`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMovementsList(data.movements || []);
      }
    } catch (err) {
      console.error('Movements fetch error:', err);
    } finally {
      setLoadingMovements(false);
    }
  };

  // Fetch Reports Data (Phase 9)
  const fetchReportsData = async (activeToken) => {
    const authToken = activeToken || token;
    if (!authToken) return;

    setLoadingReports(true);
    try {
      const [salesRes, invoicesRes, lowRes, expRes] = await Promise.all([
        fetch(`${API_BASE}/reports/sales-summary`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${API_BASE}/reports/invoices`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${API_BASE}/reports/low-stock`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${API_BASE}/reports/expiry`, { headers: { 'Authorization': `Bearer ${authToken}` } })
      ]);

      if (salesRes.ok) {
        const d = await salesRes.json();
        setSalesReportData(d);
      }
      if (invoicesRes.ok) {
        const d = await invoicesRes.json();
        setInvoicesReportData(d.invoices || []);
      }
      if (lowRes.ok) {
        const d = await lowRes.json();
        setLowStockReportData(d.items || []);
      }
      if (expRes.ok) {
        const d = await expRes.json();
        setExpiryReportData(d.items || []);
      }
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch Staff Passkeys & Security Directory (Admin Only)
  const fetchStaffPasskeys = async (activeToken) => {
    const authToken = activeToken || token;
    if (!authToken) return;

    setLoadingStaff(true);
    try {
      const res = await fetch(`${API_BASE}/auth/staff-passkeys`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const d = await res.json();
        setStaffList(d.staff || []);
      }
    } catch (err) {
      console.error('Failed to load staff passkeys:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Admin Update Staff Passkey
  const handleUpdateStaffPasskey = async (userId, targetPasskey) => {
    if (!targetPasskey || !targetPasskey.trim()) {
      alert('Passkey cannot be empty');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/update-passkey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          new_passkey: targetPasskey.trim()
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to update passkey');

      setPasskeyFeedback({ type: 'success', text: `Passkey updated successfully! New passkey is active.` });
      setEditingUserId(null);
      setEditingPasskeyVal('');
      fetchStaffPasskeys(token);
      setTimeout(() => setPasskeyFeedback(null), 5000);
    } catch (err) {
      setPasskeyFeedback({ type: 'error', text: err.message });
      setTimeout(() => setPasskeyFeedback(null), 5000);
    }
  };

  // Fetch Archived Reports (PDF & Excel)
  const fetchArchivedReports = async (activeToken) => {
    const authToken = activeToken || token;
    if (!authToken) return;

    setLoadingArchives(true);
    try {
      const res = await fetch(`${API_BASE}/reports/archives`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const d = await res.json();
        setArchivedReportsList(d.archives || []);
      }
    } catch (err) {
      console.error('Failed to load archives list:', err);
    } finally {
      setLoadingArchives(false);
    }
  };

  // Download Archive File (PDF or Excel)
  const handleDownloadArchive = async (filename) => {
    try {
      const res = await fetch(`${API_BASE}/reports/download-archive/${encodeURIComponent(filename)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('File download failed');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Error downloading file: ' + err.message);
    }
  };

  // Trigger Daily PDF & Excel Export
  const handleAutoSaveDailyReport = async () => {
    setAutoSaveDailyLoading(true);
    setAutoSaveDailyFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/reports/auto-save-daily`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Auto-save failed');
      setAutoSaveDailyFeedback({ type: 'success', text: d.message });
      fetchArchivedReports();
    } catch (err) {
      setAutoSaveDailyFeedback({ type: 'error', text: err.message });
    } finally {
      setAutoSaveDailyLoading(false);
      setTimeout(() => setAutoSaveDailyFeedback(null), 6000);
    }
  };

  // Confirm Clear Sales & Report History (Admin Passkey Verification)
  const handleConfirmClearHistory = async () => {
    if (!clearHistoryPasskey || !clearHistoryPasskey.trim()) {
      setClearHistoryError('Please enter your Chief Pharmacist security passkey to confirm.');
      return;
    }

    setClearHistoryLoading(true);
    setClearHistoryError(null);

    try {
      const res = await fetch(`${API_BASE}/reports/clear-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ passkey: clearHistoryPasskey.trim() })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Clear history failed');

      setClearHistoryResult(d);
      setClearHistoryPasskey('');
      fetchReportsData();
      fetchDashboardData();
      fetchArchivedReports();
    } catch (err) {
      setClearHistoryError(err.message);
    } finally {
      setClearHistoryLoading(false);
    }
  };

  // Admin Add Staff Member
  const handleAddStaffMember = async (e) => {
    e.preventDefault();
    if (!newStaffFullName || !newStaffUsername || !newStaffPassword || !newStaffPasskey) {
      setStaffModalError('All fields marked * are required.');
      return;
    }

    setStaffModalLoading(true);
    setStaffModalError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: newStaffFullName.trim(),
          username: newStaffUsername.trim(),
          password: newStaffPassword.trim(),
          role: newStaffRole,
          passkey: newStaffPasskey.trim(),
          email: newStaffEmail ? newStaffEmail.trim() : null
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to add staff member');

      setPasskeyFeedback({ type: 'success', text: `Staff member ${newStaffFullName} added successfully!` });
      setShowAddStaffModal(false);
      setNewStaffFullName('');
      setNewStaffUsername('');
      setNewStaffPassword('');
      setNewStaffPasskey('');
      setNewStaffEmail('');
      fetchStaffPasskeys();
      setTimeout(() => setPasskeyFeedback(null), 5000);
    } catch (err) {
      setStaffModalError(err.message);
    } finally {
      setStaffModalLoading(false);
    }
  };

  // Admin Open Edit Staff Member
  const handleOpenEditStaff = (staff) => {
    setEditingStaffMember(staff);
    setEditStaffFullName(staff.full_name);
    setEditStaffUsername(staff.username);
    setEditStaffRole(staff.role);
    setEditStaffPasskey(staff.passkey || '');
    setEditStaffActive(staff.is_active);
    setEditStaffEmail(staff.email || '');
    setEditStaffPassword('');
    setStaffModalError(null);
    setShowEditStaffModal(true);
  };

  // Admin Save Edited Staff Member
  const handleSaveEditStaff = async (e) => {
    e.preventDefault();
    if (!editStaffFullName || !editStaffUsername || !editStaffPasskey) {
      setStaffModalError('Full name, username, and passkey cannot be empty.');
      return;
    }

    setStaffModalLoading(true);
    setStaffModalError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/staff/${editingStaffMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: editStaffFullName.trim(),
          username: editStaffUsername.trim(),
          role: editStaffRole,
          passkey: editStaffPasskey.trim(),
          is_active: editStaffActive,
          email: editStaffEmail ? editStaffEmail.trim() : null,
          password: editStaffPassword ? editStaffPassword.trim() : undefined
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to update staff member');

      // If admin updated their own account, update state
      if (editingStaffMember.id === currentUser?.id) {
        const updatedUser = { ...currentUser, full_name: editStaffFullName.trim(), username: editStaffUsername.trim(), role: editStaffRole };
        setCurrentUser(updatedUser);
        localStorage.setItem('pharmacy_user', JSON.stringify(updatedUser));
      }

      setPasskeyFeedback({ type: 'success', text: `Staff member updated successfully!` });
      setShowEditStaffModal(false);
      fetchStaffPasskeys();
      setTimeout(() => setPasskeyFeedback(null), 5000);
    } catch (err) {
      setStaffModalError(err.message);
    } finally {
      setStaffModalLoading(false);
    }
  };

  // Admin Delete Staff Member
  const handleDeleteStaffMember = async (staff) => {
    if (staff.id === currentUser?.id) {
      alert('You cannot delete your own logged-in account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove staff member ${staff.full_name} (@${staff.username})?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/staff/${staff.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to delete staff member');

      setPasskeyFeedback({ type: 'success', text: d.message });
      fetchStaffPasskeys();
      setTimeout(() => setPasskeyFeedback(null), 5000);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Admin Update Own Profile & Name
  const handleUpdateMyProfile = async (e) => {
    e.preventDefault();
    if (!profileFullName || !profileFullName.trim()) {
      setProfileMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: profileFullName.trim(),
          passkey: profilePasskey ? profilePasskey.trim() : undefined,
          password: profilePassword ? profilePassword.trim() : undefined
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to update profile');

      const updatedUser = { ...currentUser, full_name: profileFullName.trim() };
      setCurrentUser(updatedUser);
      localStorage.setItem('pharmacy_user', JSON.stringify(updatedUser));

      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      fetchStaffPasskeys();
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileMessage(null);
      }, 1500);
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  // View and Reprint Past Receipt
  const handleViewReceipt = async (saleId) => {
    try {
      const res = await fetch(`${API_BASE}/sales/${saleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedInvoice({
          sale_id: data.sale.id,
          invoice_number: data.sale.invoice_number,
          date_time: data.sale.created_at,
          cashier_name: data.sale.cashier_name,
          cashier_username: data.sale.cashier_username,
          customer_name: data.sale.customer_name,
          payment_method: data.sale.payment_method.toUpperCase(),
          total_amount: data.sale.total_amount,
          items: data.items.map(it => ({
            medicine_name: it.medicine_name,
            strength: it.strength,
            batch_number: it.batch_number,
            quantity: it.quantity,
            unit_price: it.unit_price,
            line_total: it.total_price
          }))
        });
      }
    } catch (err) {
      console.error('Failed to load past receipt:', err);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  useEffect(() => {
    if (token) {
      fetchDashboardData(token);
      fetchInventory(token);
      fetchMovements(token);
      fetchReportsData(token);
    }
  }, [token]);

  useEffect(() => {
    if (token && (activeTab === 'INVENTORY' || activeTab === 'POS')) {
      fetchInventory();
    } else if (token && activeTab === 'MOVEMENTS') {
      fetchMovements();
    } else if (token && activeTab === 'REPORTS') {
      fetchReportsData();
      fetchArchivedReports();
    } else if (token && activeTab === 'SECURITY') {
      fetchStaffPasskeys();
    }
  }, [activeTab, inventorySearch, inventoryFormFilter, inventoryStatusFilter]);

  // Handle Login with 3-Factor Credentials (Username + Password + Passkey)
  const handleLogin = async (username, password, passkey) => {
    if (!username || !password || !passkey) {
      setAuthError('Please enter your Username, Password, and Security Passkey.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password, 
          passkey: passkey.trim() 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('pharmacy_token', data.token);
      localStorage.setItem('pharmacy_user', JSON.stringify(data.user));

      // Clear input fields for security
      setUsernameInput('');
      setPasswordInput('');
      setPasskeyInput('');

      fetchDashboardData(data.token);
      fetchInventory(data.token);
      fetchMovements(data.token);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setToken(null);
    setCurrentUser(null);
    setDashboardStats(null);
    setAlertsData([]);
    setInventoryList([]);
    setMovementsList([]);
    setCart([]);
    setCompletedInvoice(null);
    localStorage.removeItem('pharmacy_token');
    localStorage.removeItem('pharmacy_user');
  };

  // CART LOGIC (Phase 6)
  const addToCart = (batch) => {
    setCheckoutError(null);

    // 1. Block Expired Medicine
    if (batch.calculatedStatus === 'EXPIRED') {
      setCheckoutError(`Cannot add "${batch.medicine_name}" (Batch ${batch.batch_number}): This medicine has expired and is legally prohibited from sale.`);
      return;
    }

    // 2. Block 0 Stock
    if (batch.quantity <= 0) {
      setCheckoutError(`Cannot add "${batch.medicine_name}": Out of stock.`);
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.batch_id === batch.batch_id);
      if (existing) {
        // Check if adding exceeds available physical stock
        if (existing.quantity + 1 > batch.quantity) {
          setCheckoutError(`Insufficient stock for "${batch.medicine_name}". Only ${batch.quantity} units are available.`);
          return prevCart;
        }
        return prevCart.map(item => 
          item.batch_id === batch.batch_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          batch_id: batch.batch_id,
          medicine_name: batch.medicine_name,
          strength: batch.strength,
          dosage_form: batch.dosage_form,
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          available_stock: batch.quantity,
          selling_price: batch.selling_price,
          quantity: 1
        }];
      }
    });
  };

  const updateCartQuantity = (batchId, newQty) => {
    setCheckoutError(null);
    const parsed = parseInt(newQty, 10);
    if (isNaN(parsed) || parsed <= 0) {
      removeFromCart(batchId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => {
        if (item.batch_id === batchId) {
          if (parsed > item.available_stock) {
            setCheckoutError(`Cannot select ${parsed} units for "${item.medicine_name}". Only ${item.available_stock} available in batch ${item.batch_number}.`);
            return { ...item, quantity: item.available_stock };
          }
          return { ...item, quantity: parsed };
        }
        return item;
      })
    );
  };

  const removeFromCart = (batchId) => {
    setCart(prevCart => prevCart.filter(item => item.batch_id !== batchId));
  };

  // Bill Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0);
  const cartTotal = Number(cartSubtotal.toFixed(2));

  // Handle Checkout (Phase 6 & 7)
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const res = await fetch(`${API_BASE}/sales/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: customerName,
          payment_method: paymentMethod,
          items: cart.map(item => ({
            batch_id: item.batch_id,
            quantity: item.quantity
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Checkout failed');
      }

      // Checkout Succeeded!
      setCompletedInvoice(data.invoice);
      setCart([]); // Clear cart
      setCustomerName('Walk-in Patient');

      // Refresh inventory, dashboard, and movements to reflect automatic stock deduction!
      fetchInventory();
      fetchDashboardData();
      fetchMovements();
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // POS Medicine Finder Filtered List
  const posFilteredInventory = inventoryList.filter(item => {
    const matchSearch = posSearch.trim() === '' || 
      item.medicine_name.toLowerCase().includes(posSearch.toLowerCase()) ||
      item.generic_name.toLowerCase().includes(posSearch.toLowerCase()) ||
      item.batch_number.toLowerCase().includes(posSearch.toLowerCase());

    const matchForm = posFormFilter === 'ALL' || item.dosage_form === posFormFilter;
    return matchSearch && matchForm;
  });

  // Submit New Medicine
  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMessage(null);

    try {
      const res = await fetch(`${API_BASE}/inventory/medicines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newMedName,
          generic_name: newMedGeneric,
          brand_name: newMedBrand,
          strength: newMedStrength,
          dosage_form: newMedForm,
          unit_of_measure: newMedUnit,
          manufacturer: newMedMfg,
          reorder_level: Number(newMedReorder),
          critical_level: Number(newMedCritical),
          batch_number: newMedBatch,
          expiry_date: newMedExpiry,
          quantity: Number(newMedQty),
          selling_price: Number(newMedPrice)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create medicine');

      setShowAddMedModal(false);
      setNewMedName('');
      setNewMedGeneric('');
      setNewMedBrand('');
      setNewMedStrength('');
      setNewMedMfg('');
      setNewMedBatch(`BATCH-${Date.now().toString().slice(-4)}`);
      setNewMedQty(100);
      setNewMedPrice(25.00);

      fetchInventory();
      fetchDashboardData();
      checkBackendHealth();
    } catch (err) {
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Medicine Batch (Admin Only)
  const handleDeleteBatch = async (batchId, medicineName, batchNumber) => {
    if (!window.confirm(`Are you sure you want to remove "${medicineName}" (Batch ${batchNumber}) from inventory?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/inventory/batches/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete medicine batch');

      fetchInventory();
      fetchDashboardData();
      fetchMovements();
    } catch (err) {
      alert(`Error deleting medicine: ${err.message}`);
    }
  };

  // Submit Stock Adjustment
  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedBatchForStock) return;
    setModalLoading(true);
    setModalMessage(null);

    try {
      const res = await fetch(`${API_BASE}/inventory/stock-adjustment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          batch_id: selectedBatchForStock.batch_id,
          change_quantity: Number(stockChangeInput),
          reason: stockReasonInput
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Stock adjustment failed');

      setShowStockModal(false);
      setSelectedBatchForStock(null);

      fetchInventory();
      fetchDashboardData();
      fetchMovements();
    } catch (err) {
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  // Filter alerts in dashboard view
  const filteredAlerts = alertsData.filter(item => {
    if (alertFilter === 'ALL') return true;
    return item.alertType === alertFilter;
  });

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="header-section no-print">
        <div className="brand-wrapper">
          <div className="brand-logo-icon">
            <Pill color="#ffffff" size={24} />
          </div>
          <div>
            <h1 className="brand-title">MediFlow POS</h1>
            <p className="brand-subtitle">Hospital Pharmacy Point of Sale & Inventory Management</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {currentUser ? (
            <div className="user-profile-badge">
              <div className="user-avatar" style={{ 
                background: currentUser.role === 'admin' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
              }}>
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{currentUser.full_name}</span>
                <span className="user-role-tag" style={{ 
                  color: currentUser.role === 'admin' ? '#60a5fa' : '#34d399' 
                }}>
                  ● {currentUser.role}
                </span>
              </div>
              <button 
                onClick={() => {
                  setProfileFullName(currentUser.full_name || '');
                  setProfilePasskey('');
                  setProfilePassword('');
                  setProfileMessage(null);
                  setShowProfileModal(true);
                }} 
                className="btn btn-secondary" 
                style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Edit My Profile & Name"
              >
                <UserCog size={14} />
                Profile
              </button>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                title="Log out"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <span className="badge badge-warning">
              <KeyRound size={12} />
              Unauthenticated
            </span>
          )}

          <button 
            id="refresh-health-btn"
            onClick={() => { checkBackendHealth(); if (token) { fetchDashboardData(); fetchInventory(); fetchMovements(); fetchReportsData(); } }} 
            disabled={loadingHealth || loadingDashboard || loadingReports} 
            className="btn btn-secondary"
            title="Refresh system status"
          >
            <RefreshCw size={14} className={(loadingHealth || loadingDashboard || loadingReports) ? 'animate-spin' : ''} />
            {(loadingHealth || loadingDashboard || loadingReports) ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      {currentUser && (
        <nav className="nav-tabs-bar no-print">
          <button 
            className={`nav-tab-btn pos-tab ${activeTab === 'POS' ? 'active' : ''}`}
            onClick={() => setActiveTab('POS')}
          >
            <ShoppingCart size={17} />
            POS Billing Counter
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'DASHBOARD' ? 'active' : ''}`}
            onClick={() => setActiveTab('DASHBOARD')}
          >
            <LayoutDashboard size={17} />
            Dashboard & Alerts
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'INVENTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('INVENTORY')}
          >
            <ClipboardList size={17} />
            Medicine Catalog ({inventoryList.length})
          </button>
          {currentUser.role === 'admin' ? (
            <button 
              className={`nav-tab-btn ${activeTab === 'REPORTS' ? 'active' : ''}`}
              onClick={() => setActiveTab('REPORTS')}
            >
              <BarChart3 size={17} />
              Sales & Reports
            </button>
          ) : (
            <button 
              className={`nav-tab-btn ${activeTab === 'REPORTS' ? 'active' : ''}`}
              onClick={() => setActiveTab('REPORTS')}
            >
              <FileText size={17} />
              My Billed Invoices
            </button>
          )}
          {currentUser.role === 'admin' && (
            <>
              <button 
                className={`nav-tab-btn ${activeTab === 'MOVEMENTS' ? 'active' : ''}`}
                onClick={() => setActiveTab('MOVEMENTS')}
              >
                <History size={17} />
                Stock Movements History
              </button>
              <button 
                className={`nav-tab-btn ${activeTab === 'SECURITY' ? 'active' : ''}`}
                onClick={() => setActiveTab('SECURITY')}
              >
                <KeyRound size={17} />
                Staff Passkeys & Access
              </button>
            </>
          )}
        </nav>
      )}

      {/* When Not Logged In: High-Security Staff Authentication Portal */}
      {!currentUser && (
        <section className="login-section">
          {/* Staff Manual Login Terminal */}
          <div className="glass-panel login-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ 
                width: '34px', 
                height: '34px', 
                borderRadius: '8px', 
                background: 'rgba(56, 189, 248, 0.15)', 
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Lock size={18} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Staff Security Login</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Manual verification required. Enter your assigned username, password, and security passkey.
            </p>

            {authError && (
              <div style={{ 
                padding: '12px 14px', 
                background: 'rgba(239, 68, 68, 0.15)', 
                border: '1px solid rgba(239, 68, 68, 0.35)', 
                borderRadius: '8px', 
                color: '#f87171', 
                fontSize: '0.875rem', 
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Access Denied:</strong> {authError}
                </div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(usernameInput, passwordInput, passkeyInput); }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#38bdf8' }}>&bull;</span> Staff Username
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. admin or cashier01"
                  value={usernameInput} 
                  onChange={(e) => setUsernameInput(e.target.value)} 
                  required 
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#38bdf8' }}>&bull;</span> Account Password
                </label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter staff password"
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  required 
                  autoComplete="current-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15' }}>
                  <KeyRound size={14} /> Security Passkey (Mandatory)
                </label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter Passkey (e.g. 2306324052)"
                  value={passkeyInput} 
                  onChange={(e) => setPasskeyInput(e.target.value)} 
                  required 
                  autoComplete="off"
                  style={{ borderColor: 'rgba(250, 204, 21, 0.4)' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                  Admin passkey is <strong style={{ color: '#facc15' }}>2306324052</strong>. Cashiers use their assigned passkeys.
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  marginTop: '12px', 
                  padding: '12px', 
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                disabled={authLoading}
              >
                <ShieldCheck size={18} />
                {authLoading ? 'Verifying Passkey...' : 'Authenticate & Open POS Terminal'}
              </button>
            </form>
          </div>

          {/* Security Protocol & Demo Credentials Guide */}
          <div className="glass-panel login-panel" style={{ background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ 
                width: '34px', 
                height: '34px', 
                borderRadius: '8px', 
                background: 'rgba(16, 185, 129, 0.15)', 
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={18} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Security Policy & Credentials</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '18px' }}>
              1-Click demo bypass is disabled. To prevent unauthorized dispensary changes, credentials must be entered manually:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Admin Card */}
              <div style={{ 
                padding: '14px', 
                borderRadius: '8px', 
                background: 'rgba(56, 189, 248, 0.08)', 
                border: '1px solid rgba(56, 189, 248, 0.25)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>Chief Pharmacist (Admin)</strong>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Full Master Control</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  <div>Username: <code>admin</code></div>
                  <div>Password: <code>admin123</code></div>
                  <div>Security Passkey: <strong style={{ color: '#facc15' }}>2306324052</strong></div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    &bull; Can add medicines, adjust stock, delete batches & update cashier passkeys.
                  </div>
                </div>
              </div>

              {/* Cashier 1 Card */}
              <div style={{ 
                padding: '14px', 
                borderRadius: '8px', 
                background: 'rgba(16, 185, 129, 0.08)', 
                border: '1px solid rgba(16, 185, 129, 0.25)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>Counter Cashier 1 (Priya Sharma)</strong>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>POS Billing</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  <div>Username: <code>cashier01</code></div>
                  <div>Password: <code>cashier123</code></div>
                  <div>Security Passkey: <strong style={{ color: '#34d399' }}>1111</strong></div>
                </div>
              </div>

              {/* Cashier 2 Card */}
              <div style={{ 
                padding: '14px', 
                borderRadius: '8px', 
                background: 'rgba(168, 85, 247, 0.08)', 
                border: '1px solid rgba(168, 85, 247, 0.25)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: '#c084fc', fontSize: '0.9rem' }}>Emergency Cashier 2 (Karthik Raj)</strong>
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>POS Billing</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  <div>Username: <code>cashier02</code></div>
                  <div>Password: <code>cashier123</code></div>
                  <div>Security Passkey: <strong style={{ color: '#c084fc' }}>2222</strong></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AUTHENTICATED TABS */}
      {currentUser && (
        <>
          {/* TAB: POS BILLING COUNTER (Phase 6 & 7) */}
          {activeTab === 'POS' && (
            <div className="pos-terminal-grid">
              {/* LEFT PANE: MEDICINE SEARCH & SELECTION */}
              <section className="glass-panel pos-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search color="#38bdf8" size={20} />
                    <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Medicine Finder</h3>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                    {posFilteredInventory.length} Available Batches
                  </span>
                </div>

                {/* Search Bar & Dosage Filter */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <input 
                      type="text" 
                      placeholder="Type medicine name (e.g. Paracetamol, Aceclofenac)..." 
                      className="search-input"
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <select 
                    className="filter-select"
                    value={posFormFilter}
                    onChange={(e) => setPosFormFilter(e.target.value)}
                  >
                    <option value="ALL">All Forms</option>
                    <option value="Tablet">Tablets</option>
                    <option value="Capsule">Capsules</option>
                    <option value="Syrup">Syrups</option>
                  </select>
                </div>

                {/* Medicine Batches List */}
                <div className="pos-medicines-list">
                  {posFilteredInventory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                      No matching medicines found in catalog.
                    </div>
                  ) : (
                    posFilteredInventory.map(batch => {
                      const isExpired = batch.calculatedStatus === 'EXPIRED';
                      const isOutOfStock = batch.quantity <= 0;

                      return (
                        <div 
                          key={batch.batch_id} 
                          className={`pos-med-card ${
                            isExpired ? 'expired' : batch.calculatedStatus.toLowerCase()
                          }`}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ color: '#fff', fontSize: '0.975rem' }}>{batch.medicine_name}</strong>
                              <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{batch.strength}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Batch: <code>{batch.batch_number}</code> &bull; Exp: <strong>{batch.expiry_date}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                              <span 
                                className="badge" 
                                style={{ 
                                  background: `${batch.statusColor}20`, 
                                  color: batch.statusColor,
                                  fontSize: '0.725rem',
                                  padding: '2px 8px'
                                }}
                              >
                                {isExpired ? 'EXPIRED' : `${batch.quantity} units available`}
                              </span>
                              {batch.daysRemaining > 0 && batch.daysRemaining <= 90 && (
                                <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                  Near Expiry
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                                ₹{batch.selling_price?.toFixed(2)}
                              </div>
                              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>per {batch.unit_of_measure}</div>
                            </div>

                            <button 
                              onClick={() => addToCart(batch)}
                              disabled={isExpired || isOutOfStock}
                              className={`btn ${isExpired ? 'btn-secondary' : 'btn-primary'}`}
                              style={{ 
                                padding: '8px 14px', 
                                fontSize: '0.825rem',
                                opacity: (isExpired || isOutOfStock) ? 0.4 : 1,
                                cursor: (isExpired || isOutOfStock) ? 'not-allowed' : 'pointer'
                              }}
                              title={isExpired ? 'Expired batch: Prohibited from sale' : isOutOfStock ? 'Out of stock' : 'Add to patient bill'}
                            >
                              {isExpired ? 'Expired' : isOutOfStock ? 'No Stock' : '+ Add'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* RIGHT PANE: ACTIVE PATIENT CART & BILLING */}
              <section className="glass-panel pos-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingCart color="#10b981" size={20} />
                    <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Patient Bill</h3>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                    {cart.length} Line Items
                  </span>
                </div>

                {/* Patient Name Input */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Patient Name / OPD No.</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Patient"
                  />
                </div>

                {/* Validation Error Alert */}
                {checkoutError && (
                  <div style={{ 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    marginBottom: '14px',
                    background: 'rgba(239, 68, 68, 0.2)', 
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171', 
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <ShieldAlert size={16} />
                    {checkoutError}
                  </div>
                )}

                {/* Cart Items List */}
                <div className="cart-items-list">
                  {cart.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px 20px', 
                      color: 'var(--text-dim)', 
                      border: '1px dashed var(--border-subtle)', 
                      borderRadius: '8px' 
                    }}>
                      <ShoppingCart size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                      <div>Cart is empty.</div>
                      <div style={{ fontSize: '0.775rem', marginTop: '4px' }}>Select medicines from the left to start billing.</div>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.batch_id} className="cart-item-row">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{item.medicine_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Batch: <code>{item.batch_number}</code> &bull; ₹{item.selling_price.toFixed(2)}/unit
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="qty-control">
                          <button 
                            className="qty-btn"
                            onClick={() => updateCartQuantity(item.batch_id, item.quantity - 1)}
                            title="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <input 
                            type="number" 
                            className="qty-input"
                            value={item.quantity}
                            onChange={(e) => updateCartQuantity(item.batch_id, e.target.value)}
                            min={1}
                            max={item.available_stock}
                          />
                          <button 
                            className="qty-btn"
                            onClick={() => updateCartQuantity(item.batch_id, item.quantity + 1)}
                            title="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div style={{ minWidth: '70px', textAlign: 'right' }}>
                          <strong style={{ color: '#fff', fontSize: '0.925rem' }}>
                            ₹{(item.quantity * item.selling_price).toFixed(2)}
                          </strong>
                        </div>

                        <button 
                          onClick={() => removeFromCart(item.batch_id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px', color: '#f87171' }}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Bill Calculation & Checkout Panel */}
                <div className="bill-summary-box">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Hospital Pharmacy Tax:</span>
                    <span>₹0.00 (Inclusive)</span>
                  </div>
                  <div className="summary-row grand-total">
                    <span>GRAND TOTAL:</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>

                  {/* Payment Method Selector */}
                  <label className="form-label" style={{ fontSize: '0.8rem', marginTop: '12px' }}>Payment Method</label>
                  <div className="payment-selector">
                    <button 
                      type="button" 
                      className={`payment-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('upi')}
                    >
                      <Smartphone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      UPI
                    </button>
                    <button 
                      type="button" 
                      className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <Banknote size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Cash
                    </button>
                    <button 
                      type="button" 
                      className={`payment-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Card
                    </button>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || checkoutLoading}
                    className="btn btn-primary"
                    style={{ 
                      width: '100%', 
                      padding: '12px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      fontSize: '1rem',
                      opacity: cart.length === 0 ? 0.5 : 1
                    }}
                  >
                    <CheckCircle2 size={18} />
                    {checkoutLoading ? 'Processing Checkout...' : `Complete Sale & Print Bill (₹${cartTotal.toFixed(2)})`}
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* TAB: DASHBOARD & ALERTS */}
          {activeTab === 'DASHBOARD' && (
            <>
              {/* Top KPI Cards Grid */}
              <div className="stats-grid">
                <div className="glass-panel stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Medicines</span>
                    <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
                      <Pill size={18} />
                    </div>
                  </div>
                  <div className="stat-value">{dashboardStats?.totalMedicines ?? '...'}</div>
                  <div className="stat-subtext">Active Master Catalog</div>
                </div>

                <div className="glass-panel stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Total Units</span>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                      <Boxes size={18} />
                    </div>
                  </div>
                  <div className="stat-value">{dashboardStats?.totalStockUnits?.toLocaleString() ?? '...'}</div>
                  <div className="stat-subtext">Units Across All Batches</div>
                </div>

                <div className="glass-panel stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Today's Sales</span>
                    <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="stat-value">₹{dashboardStats?.todayRevenue?.toFixed(2) ?? '0.00'}</div>
                  <div className="stat-subtext">{dashboardStats?.todayBills ?? 0} Bills Completed</div>
                </div>

                <div className="glass-panel stat-card" style={{ borderLeft: '3px solid #dc2626' }}>
                  <div className="stat-card-header">
                    <span className="stat-title" style={{ color: '#f87171' }}>Critical Stock</span>
                    <div className="stat-icon" style={{ background: 'rgba(220, 38, 38, 0.15)', color: '#ef4444' }}>
                      <AlertTriangle size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: '#ef4444' }}>{dashboardStats?.criticalStock ?? '0'}</div>
                  <div className="stat-subtext">&le; Critical threshold</div>
                </div>

                <div className="glass-panel stat-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                  <div className="stat-card-header">
                    <span className="stat-title" style={{ color: '#fbbf24' }}>Low Stock</span>
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                      <Package size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: '#f59e0b' }}>{dashboardStats?.lowStock ?? '0'}</div>
                  <div className="stat-subtext">&le; Reorder level</div>
                </div>

                <div className="glass-panel stat-card" style={{ borderLeft: '3px solid #f97316' }}>
                  <div className="stat-card-header">
                    <span className="stat-title" style={{ color: '#fb923c' }}>Near Expiry</span>
                    <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
                      <Clock size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: '#f97316' }}>{dashboardStats?.nearExpiry ?? '0'}</div>
                  <div className="stat-subtext">&lt; 90 days left</div>
                </div>

                <div className="glass-panel stat-card" style={{ borderLeft: '3px solid #ef4444' }}>
                  <div className="stat-card-header">
                    <span className="stat-title" style={{ color: '#fca5a5' }}>Expired</span>
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                      <Ban size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: '#ef4444' }}>{dashboardStats?.expired ?? '0'}</div>
                  <div className="stat-subtext">Blocked from sale</div>
                </div>
              </div>

              {/* Inventory Alerts Hub */}
              <section className="glass-panel alerts-hub-card">
                <div className="alerts-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BellRing color="#f59e0b" size={24} />
                    <div>
                      <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>⚠️ Inventory Alerts Hub</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        Dynamic alerts computed live from physical batch balances.
                      </p>
                    </div>
                  </div>

                  <div className="alerts-filter-tabs">
                    <button 
                      className={`filter-tab ${alertFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setAlertFilter('ALL')}
                    >
                      All Alerts ({alertsData.length})
                    </button>
                    <button 
                      className={`filter-tab ${alertFilter === 'CRITICAL_STOCK' ? 'active' : ''}`}
                      onClick={() => setAlertFilter('CRITICAL_STOCK')}
                    >
                      🔴 Critical ({alertsData.filter(a => a.alertType === 'CRITICAL_STOCK').length})
                    </button>
                    <button 
                      className={`filter-tab ${alertFilter === 'LOW_STOCK' ? 'active' : ''}`}
                      onClick={() => setAlertFilter('LOW_STOCK')}
                    >
                      🟡 Low Stock ({alertsData.filter(a => a.alertType === 'LOW_STOCK').length})
                    </button>
                    <button 
                      className={`filter-tab ${alertFilter === 'NEAR_EXPIRY' ? 'active' : ''}`}
                      onClick={() => setAlertFilter('NEAR_EXPIRY')}
                    >
                      🟠 Near Expiry ({alertsData.filter(a => a.alertType === 'NEAR_EXPIRY').length})
                    </button>
                    <button 
                      className={`filter-tab ${alertFilter === 'EXPIRED' ? 'active' : ''}`}
                      onClick={() => setAlertFilter('EXPIRED')}
                    >
                      ⚫ Expired ({alertsData.filter(a => a.alertType === 'EXPIRED').length})
                    </button>
                  </div>
                </div>

                <div className="alert-items-list">
                  {filteredAlerts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                      No active alerts under this filter.
                    </div>
                  ) : (
                    filteredAlerts.map((item, idx) => (
                      <div key={`${item.batch_id}-${item.alertType}-${idx}`} className="alert-item-row">
                        <div className="alert-item-left">
                          <div className="alert-badge-wrap">
                            <span 
                              className="badge" 
                              style={{ 
                                background: `${item.color}20`, 
                                color: item.color, 
                                border: `1px solid ${item.color}50` 
                              }}
                            >
                              <span className="status-dot" style={{ backgroundColor: item.color }}></span>
                              {item.badgeText}
                            </span>
                          </div>

                          <div className="alert-medicine-info">
                            <span className="alert-med-name">{item.medicine_name}</span>
                            <span className="alert-med-details">
                              Generic: {item.generic_name} &bull; Form: {item.dosage_form} &bull; Batch: <code>{item.batch_number}</code>
                            </span>
                          </div>
                        </div>

                        <div className="alert-item-right">
                          <div className="alert-stock-metrics">
                            <div style={{ color: '#fff', fontWeight: 600 }}>
                              Stock: <span style={{ color: item.color }}>{item.quantity} units</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                              Expiry: <strong>{item.expiry_date}</strong> {item.daysRemaining !== undefined && `(${item.daysRemaining > 0 ? `${item.daysRemaining} days left` : `Expired`})`}
                            </div>
                          </div>

                          {currentUser.role === 'admin' && (
                            <button 
                              onClick={() => {
                                setSelectedBatchForStock(item);
                                setStockChangeInput(50);
                                setStockReasonInput('Emergency stock replenishment');
                                setShowStockModal(true);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <Sliders size={13} />
                              Quick Replenish
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

          {/* TAB: INVENTORY CATALOG */}
          {activeTab === 'INVENTORY' && (
            <section className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
              <div className="inventory-controls">
                <div className="search-box-wrap">
                  <input 
                    type="text" 
                    placeholder="Search medicine name, generic name, batch number..." 
                    className="search-input"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />
                </div>

                <select 
                  className="filter-select"
                  value={inventoryFormFilter}
                  onChange={(e) => setInventoryFormFilter(e.target.value)}
                >
                  <option value="ALL">All Dosage Forms</option>
                  <option value="Tablet">Tablets</option>
                  <option value="Capsule">Capsules</option>
                  <option value="Syrup">Syrups</option>
                </select>

                <select 
                  className="filter-select"
                  value={inventoryStatusFilter}
                  onChange={(e) => setInventoryStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NORMAL">🟢 Normal Stock</option>
                  <option value="LOW">🟡 Low Stock (&le; Reorder)</option>
                  <option value="CRITICAL">🔴 Critical Stock</option>
                  <option value="NEAR_EXPIRY">🟠 Near Expiry (&lt;90d)</option>
                  <option value="EXPIRED">⚫ Expired</option>
                </select>

                {currentUser.role === 'admin' && (
                  <button 
                    onClick={() => setShowAddMedModal(true)} 
                    className="btn btn-primary"
                  >
                    <PlusCircle size={16} />
                    Add Medicine
                  </button>
                )}
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Generic Name</th>
                      <th>Strength & Form</th>
                      <th>Batch No</th>
                      <th>Expiry Date</th>
                      <th>Stock Qty</th>
                      <th>Reorder Lvl</th>
                      <th>Selling Price</th>
                      <th>Status</th>
                      {currentUser.role === 'admin' && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryList.length === 0 ? (
                      <tr>
                        <td colSpan={currentUser.role === 'admin' ? 10 : 9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                          {loadingInventory ? 'Loading inventory catalog...' : 'No medicines found matching filters.'}
                        </td>
                      </tr>
                    ) : (
                      inventoryList.map(item => (
                        <tr key={item.batch_id}>
                          <td>
                            <strong style={{ color: '#fff' }}>{item.medicine_name}</strong>
                            {item.brand_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Brand: {item.brand_name}</div>}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.generic_name}</td>
                          <td>
                            <span style={{ color: '#38bdf8' }}>{item.strength}</span> &bull; {item.dosage_form}
                          </td>
                          <td>
                            <code>{item.batch_number}</code>
                          </td>
                          <td>
                            <div>{item.expiry_date}</div>
                            <span style={{ 
                              fontSize: '0.725rem', 
                              color: item.daysRemaining <= 0 ? '#ef4444' : item.daysRemaining <= 90 ? '#f97316' : 'var(--text-dim)' 
                            }}>
                              {item.daysRemaining <= 0 ? 'Expired' : `${item.daysRemaining} days left`}
                            </span>
                          </td>
                          <td>
                            <strong style={{ fontSize: '1rem', color: item.statusColor }}>
                              {item.quantity} {item.unit_of_measure}s
                            </strong>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {item.reorder_level} (Crit: {item.critical_level})
                          </td>
                          <td style={{ fontWeight: 600, color: '#34d399' }}>
                            ₹{item.selling_price?.toFixed(2)}
                          </td>
                          <td>
                            <span 
                              className="badge" 
                              style={{ 
                                background: `${item.statusColor}20`, 
                                color: item.statusColor, 
                                border: `1px solid ${item.statusColor}40` 
                              }}
                            >
                              <span className="status-dot" style={{ backgroundColor: item.statusColor }}></span>
                              {item.calculatedStatus}
                            </span>
                          </td>
                          {currentUser.role === 'admin' && (
                            <td>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button 
                                  onClick={() => {
                                    setSelectedBatchForStock(item);
                                    setStockChangeInput(50);
                                    setStockReasonInput('New distributor shipment received');
                                    setShowStockModal(true);
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  title="Adjust or add stock to this medicine batch"
                                >
                                  <Sliders size={14} />
                                  Adjust
                                </button>
                                <button 
                                  onClick={() => handleDeleteBatch(item.batch_id, item.medicine_name, item.batch_number)}
                                  className="btn btn-secondary"
                                  style={{ 
                                    padding: '6px 12px', 
                                    fontSize: '0.8rem', 
                                    color: '#ef4444', 
                                    borderColor: 'rgba(239, 68, 68, 0.4)',
                                    background: 'rgba(239, 68, 68, 0.1)'
                                  }}
                                  title="Delete this medicine batch from inventory"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB: STOCK MOVEMENTS HISTORY */}
          {activeTab === 'MOVEMENTS' && (
            <section className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>📜 Complete Stock Movement Traceability</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    Permanent chronological record of every receipt, counter sale, or inventory adjustment.
                  </p>
                </div>
                <span className="badge badge-success">
                  {movementsList.length} Total Records
                </span>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Medicine & Batch</th>
                      <th>Movement Type</th>
                      <th>Quantity Change</th>
                      <th>Previous &rarr; New Stock</th>
                      <th>Reason / Invoice Reference</th>
                      <th>User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                          {loadingMovements ? 'Loading movements log...' : 'No stock movements recorded yet.'}
                        </td>
                      </tr>
                    ) : (
                      movementsList.map(m => (
                        <tr key={m.id}>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {m.created_at}
                          </td>
                          <td>
                            <strong style={{ color: '#fff' }}>{m.medicine_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Batch: <code>{m.batch_number}</code></div>
                          </td>
                          <td>
                            <span className="badge" style={{ 
                              background: m.movement_type === 'STOCK_RECEIVED' 
                                ? 'rgba(16, 185, 129, 0.15)' 
                                : m.movement_type === 'SALE' 
                                ? 'rgba(239, 68, 68, 0.15)' 
                                : 'rgba(56, 189, 248, 0.15)',
                              color: m.movement_type === 'STOCK_RECEIVED' 
                                ? '#34d399' 
                                : m.movement_type === 'SALE' 
                                ? '#f87171' 
                                : '#38bdf8'
                            }}>
                              {m.movement_type}
                            </span>
                          </td>
                          <td>
                            <strong style={{ 
                              color: m.quantity_change > 0 ? '#34d399' : '#ef4444',
                              fontSize: '0.95rem'
                            }}>
                              {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                            </strong>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {m.previous_quantity} &rarr; <strong style={{ color: '#fff' }}>{m.new_quantity}</strong>
                          </td>
                          <td style={{ color: 'var(--text-main)', maxWidth: '240px' }}>
                            {m.reason} {m.reference_id && <code style={{ fontSize: '0.75rem', color: '#38bdf8' }}>({m.reference_id})</code>}
                          </td>
                          <td>
                            <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{m.user_full_name || m.username}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB: REPORTS & ANALYTICS (Phase 9) */}
          {activeTab === 'REPORTS' && (
            <section className="glass-panel printable-report" style={{ padding: '24px', marginBottom: '28px' }}>
              <div className="reports-hub-bar no-print">
                {currentUser.role === 'admin' ? (
                  <div className="report-type-pills">
                    <button 
                      className={`report-pill-btn ${reportsSubTab === 'SALES' ? 'active' : ''}`}
                      onClick={() => setReportsSubTab('SALES')}
                    >
                      <TrendingUp size={15} />
                      Sales & Invoices Ledger
                    </button>
                    <button 
                      className={`report-pill-btn ${reportsSubTab === 'LOW_STOCK' ? 'active' : ''}`}
                      onClick={() => setReportsSubTab('LOW_STOCK')}
                    >
                      <Package size={15} />
                      Procurement Reorder Report ({lowStockReportData.length})
                    </button>
                    <button 
                      className={`report-pill-btn ${reportsSubTab === 'EXPIRY' ? 'active' : ''}`}
                      onClick={() => setReportsSubTab('EXPIRY')}
                    >
                      <Clock size={15} />
                      Expiry Surveillance Report ({expiryReportData.length})
                    </button>
                    <button 
                      className={`report-pill-btn ${reportsSubTab === 'ARCHIVES' ? 'active' : ''}`}
                      onClick={() => { setReportsSubTab('ARCHIVES'); fetchArchivedReports(); }}
                    >
                      <FileSpreadsheet size={15} />
                      Daily Archives & Backups ({archivedReportsList.length})
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: '4px' }}>
                      🧾 My Billed Invoices & Shift History
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      Review and reprint patient receipts processed during your active cashier shift.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {currentUser.role === 'admin' && (
                    <>
                      <button 
                        onClick={handleAutoSaveDailyReport}
                        disabled={autoSaveDailyLoading}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.825rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Compile and save today's report as PDF and Excel to server"
                      >
                        <FileSpreadsheet size={15} color="#10b981" />
                        {autoSaveDailyLoading ? 'Saving...' : 'Save Daily PDF & Excel'}
                      </button>

                      <button 
                        onClick={() => {
                          setClearHistoryPasskey('');
                          setClearHistoryError(null);
                          setClearHistoryResult(null);
                          setShowClearHistoryModal(true);
                        }}
                        className="btn btn-danger"
                        style={{ fontSize: '0.825rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Clear sales history with automatic PDF/Excel backup (Admin Only)"
                      >
                        <Trash2 size={15} />
                        Clear Sales History
                      </button>
                    </>
                  )}

                  <button 
                    onClick={() => window.print()} 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.825rem', padding: '7px 14px' }}
                  >
                    <Printer size={15} />
                    Print
                  </button>
                </div>
              </div>

              {autoSaveDailyFeedback && (
                <div style={{ 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  margin: '12px 0', 
                  background: autoSaveDailyFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${autoSaveDailyFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                  color: autoSaveDailyFeedback.type === 'error' ? '#f87171' : '#34d399',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldCheck size={16} />
                  {autoSaveDailyFeedback.text}
                </div>
              )}

              {/* Official Printable Report Header (Active on Paper & PDF export) */}
              <div className="print-report-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '8px', 
                      background: '#0284c7', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1.3rem'
                    }}>
                      +
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        MediFlow Central Hospital Pharmacy
                      </h2>
                      <p style={{ fontSize: '0.825rem', color: '#475569', margin: '2px 0 0 0' }}>
                        Department of Pharmacy Services &bull; Dispensary & Inventory Management
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>
                    <div><strong>Report:</strong> {
                      reportsSubTab === 'SALES' ? 'Sales Ledger & Revenue Analytics' : 
                      reportsSubTab === 'LOW_STOCK' ? 'Procurement & Reorder Schedule' : 
                      'Expiry Surveillance & FEFO Priority Report'
                    }</div>
                    <div><strong>Generated:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date().toLocaleTimeString()}</div>
                    <div><strong>Staff Officer:</strong> {currentUser?.full_name} ({currentUser?.role?.toUpperCase()})</div>
                  </div>
                </div>
              </div>

              {/* SUBTAB 1: SALES & INVOICES */}
              {reportsSubTab === 'SALES' && (
                <>
                  {/* Revenue Summary Cards (Admin Only) */}
                  {currentUser.role === 'admin' && (
                    <>
                      <div className="stats-grid" style={{ marginBottom: '22px' }}>
                        <div className="glass-panel stat-card">
                          <div className="stat-card-header">
                            <span className="stat-title">Total Revenue</span>
                            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                              <TrendingUp size={18} />
                            </div>
                          </div>
                          <div className="stat-value">₹{salesReportData?.summary?.totalRevenue?.toFixed(2) ?? '0.00'}</div>
                          <div className="stat-subtext">Net Pharmacy Sales</div>
                        </div>

                        <div className="glass-panel stat-card">
                          <div className="stat-card-header">
                            <span className="stat-title">Completed Bills</span>
                            <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
                              <FileText size={18} />
                            </div>
                          </div>
                          <div className="stat-value">{salesReportData?.summary?.totalBills ?? 0}</div>
                          <div className="stat-subtext">Invoices Generated</div>
                        </div>

                        <div className="glass-panel stat-card">
                          <div className="stat-card-header">
                            <span className="stat-title">Avg Invoice Value</span>
                            <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                              <CreditCard size={18} />
                            </div>
                          </div>
                          <div className="stat-value">₹{salesReportData?.summary?.averageBillValue?.toFixed(2) ?? '0.00'}</div>
                          <div className="stat-subtext">Average Spend per Patient</div>
                        </div>
                      </div>

                      {/* Payment Breakdown & Top Selling Split */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        {/* Payment Distribution */}
                        <div className="glass-panel" style={{ padding: '18px' }}>
                          <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '14px' }}>
                            💳 Payment Method Distribution
                          </h4>
                          {salesReportData?.paymentBreakdown?.length === 0 ? (
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No completed payments yet.</div>
                          ) : (
                            salesReportData?.paymentBreakdown?.map(p => {
                              const pct = salesReportData.summary.totalRevenue > 0 
                                ? Math.round((p.total_amount / salesReportData.summary.totalRevenue) * 100) 
                                : 0;
                              return (
                                <div key={p.payment_method} style={{ marginBottom: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#fff' }}>
                                    <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{p.payment_method}</span>
                                    <span>₹{p.total_amount.toFixed(2)} ({p.count} bills &bull; {pct}%)</span>
                                  </div>
                                  <div className="progress-bar-bg">
                                    <div 
                                      className="progress-bar-fill" 
                                      style={{ 
                                        width: `${pct}%`,
                                        background: p.payment_method === 'upi' ? '#10b981' : p.payment_method === 'cash' ? '#38bdf8' : '#a855f7'
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Top Selling Medicines */}
                        <div className="glass-panel" style={{ padding: '18px' }}>
                          <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '14px' }}>
                            ⭐ Top Dispensed Medicines
                          </h4>
                          {salesReportData?.topMedicines?.length === 0 ? (
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No medicines dispensed yet.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {salesReportData?.topMedicines?.map((m, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                                  <span style={{ color: '#fff' }}>{m.medicine_name} ({m.strength})</span>
                                  <span style={{ color: '#34d399', fontWeight: 600 }}>{m.total_quantity_sold} sold (₹{m.total_revenue_generated.toFixed(2)})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Invoices Ledger Table */}
                  <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '12px' }}>
                    {currentUser.role === 'admin' ? '📑 Hospital Invoices Ledger' : '📑 Shift Invoices'}
                  </h4>
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Invoice No</th>
                          <th>Date & Time</th>
                          <th>Patient Name</th>
                          <th>Cashier</th>
                          <th>Items</th>
                          <th>Payment</th>
                          <th>Total Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoicesReportData.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                              No invoices recorded yet.
                            </td>
                          </tr>
                        ) : (
                          invoicesReportData.map(inv => (
                            <tr key={inv.sale_id}>
                              <td><code>{inv.invoice_number}</code></td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.created_at}</td>
                              <td style={{ color: '#fff', fontWeight: 500 }}>{inv.customer_name}</td>
                              <td>{inv.cashier_name || inv.cashier_username}</td>
                              <td>{inv.item_count} items</td>
                              <td>
                                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#38bdf8' }}>
                                  {inv.payment_method.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700, color: '#34d399' }}>₹{inv.total_amount.toFixed(2)}</td>
                              <td>
                                <button 
                                  onClick={() => handleViewReceipt(inv.sale_id)}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.775rem' }}
                                  title="View and reprint receipt"
                                >
                                  <Printer size={12} />
                                  View Receipt
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* SUBTAB 2: LOW-STOCK PROCUREMENT REPORT */}
              {reportsSubTab === 'LOW_STOCK' && (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>
                      📋 Procurement Reorder Schedule
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      Items at or below reorder threshold. Use the recommended reorder quantity for new purchase orders.
                    </p>
                  </div>

                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Generic Name</th>
                          <th>Batch</th>
                          <th>Current Stock</th>
                          <th>Reorder Lvl</th>
                          <th>Critical Lvl</th>
                          <th>Status</th>
                          <th>Recommended Order Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockReportData.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                              🟢 All inventory items are currently well-stocked.
                            </td>
                          </tr>
                        ) : (
                          lowStockReportData.map(item => (
                            <tr key={item.batch_id}>
                              <td>
                                <strong style={{ color: '#fff' }}>{item.medicine_name}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{item.strength} &bull; {item.dosage_form}</div>
                              </td>
                              <td style={{ color: 'var(--text-muted)' }}>{item.generic_name}</td>
                              <td><code>{item.batch_number}</code></td>
                              <td>
                                <strong style={{ color: item.stock_status === 'CRITICAL' ? '#ef4444' : '#f59e0b', fontSize: '0.95rem' }}>
                                  {item.current_stock} units
                                </strong>
                              </td>
                              <td>{item.reorder_level}</td>
                              <td>{item.critical_level}</td>
                              <td>
                                <span className={`badge ${item.stock_status === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}`}>
                                  {item.stock_status}
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-success" style={{ fontSize: '0.825rem', padding: '4px 10px' }}>
                                  + {item.recommended_reorder_qty} units
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* SUBTAB 3: EXPIRY & FEFO SURVEILLANCE REPORT */}
              {reportsSubTab === 'EXPIRY' && (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>
                      ⏳ Expiry Surveillance & FEFO Priority Report
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      Monitors batches approaching expiration to ensure First-Expired-First-Out (FEFO) dispensing and strict disposal of expired stock.
                    </p>
                  </div>

                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Batch</th>
                          <th>Expiry Date</th>
                          <th>Days Left / Passed</th>
                          <th>Stock Units</th>
                          <th>Est. Inventory Value</th>
                          <th>Status</th>
                          <th>Action Mandate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expiryReportData.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                              🟢 No batches currently near expiration.
                            </td>
                          </tr>
                        ) : (
                          expiryReportData.map(item => (
                            <tr key={item.batch_id}>
                              <td>
                                <strong style={{ color: '#fff' }}>{item.medicine_name}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.strength}</div>
                              </td>
                              <td><code>{item.batch_number}</code></td>
                              <td><strong>{item.expiry_date}</strong></td>
                              <td>
                                <span style={{ 
                                  color: item.daysDifference <= 0 ? '#ef4444' : '#f97316',
                                  fontWeight: 600
                                }}>
                                  {item.daysDifference <= 0 ? `${Math.abs(item.daysDifference)} days EXPIRED` : `${item.daysDifference} days remaining`}
                                </span>
                              </td>
                              <td>{item.current_stock} units</td>
                              <td style={{ color: '#38bdf8' }}>₹{item.total_inventory_cost.toFixed(2)}</td>
                              <td>
                                <span className={`badge ${item.expiry_status === 'EXPIRED' ? 'badge-critical' : 'badge-warning'}`}>
                                  {item.expiry_status}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.8rem', color: item.expiry_status === 'EXPIRED' ? '#ef4444' : '#fb923c' }}>
                                {item.actionRequired}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* SUBTAB 4: DAILY ARCHIVES & BACKUPS (PDF & EXCEL) */}
              {reportsSubTab === 'ARCHIVES' && (
                <>
                  <div style={{ 
                    padding: '16px 20px', 
                    borderRadius: '12px', 
                    marginBottom: '20px', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}>
                    <div>
                      <h4 style={{ color: '#34d399', fontSize: '1.05rem', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileSpreadsheet size={20} />
                        Automated Daily PDF & Excel Server Archiving
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        Every day, sales reports are automatically compiled and saved in both <strong>Microsoft Excel (.xlsx)</strong> and <strong>Adobe PDF (.pdf)</strong> formats with date-stamped filenames.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={handleAutoSaveDailyReport} 
                        disabled={autoSaveDailyLoading}
                        className="btn btn-primary"
                        style={{ fontSize: '0.825rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileSpreadsheet size={15} />
                        {autoSaveDailyLoading ? 'Generating...' : 'Save Today\'s Report Now'}
                      </button>

                      <button 
                        onClick={() => fetchArchivedReports()} 
                        disabled={loadingArchives}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.825rem', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RefreshCw size={14} className={loadingArchives ? 'animate-spin' : ''} />
                        Refresh List
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Document Name</th>
                          <th>File Format</th>
                          <th>Generated Date & Time</th>
                          <th>File Size</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedReportsList.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-dim)' }}>
                              {loadingArchives ? 'Loading archive records...' : 'No daily archive files found. Click "Save Today\'s Report Now" to generate the first PDF & Excel files.'}
                            </td>
                          </tr>
                        ) : (
                          archivedReportsList.map((file, idx) => (
                            <tr key={idx}>
                              <td>
                                <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {file.type === 'excel' ? (
                                    <FileSpreadsheet color="#34d399" size={17} />
                                  ) : (
                                    <FileText color="#f87171" size={17} />
                                  )}
                                  {file.filename}
                                </strong>
                              </td>
                              <td>
                                <span className={`badge ${file.type === 'excel' ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                                  {file.type === 'excel' ? 'EXCEL (.xlsx)' : 'PDF DOCUMENT'}
                                </span>
                              </td>
                              <td>{new Date(file.createdAt).toLocaleString()}</td>
                              <td><code style={{ color: '#38bdf8' }}>{file.sizeFormatted}</code></td>
                              <td>
                                <button 
                                  onClick={() => handleDownloadArchive(file.filename)}
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.785rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                                  title={`Download ${file.filename}`}
                                >
                                  <Download size={13} />
                                  Download File
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Official Print Footer */}
              <div className="print-report-footer">
                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem', color: '#64748b' }}>
                  <span>Confidential Hospital Pharmacy Audit &bull; Generated from MediFlow POS System</span>
                  <span>Chief Pharmacist Verification: ___________________________</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </section>
          )}

          {/* TAB: STAFF SECURITY & PASSKEY MANAGEMENT (Admin Only) */}
          {activeTab === 'SECURITY' && currentUser.role === 'admin' && (
            <section className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <KeyRound color="#eab308" size={24} />
                    <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Hospital Security & Staff Passkeys Management</h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: '4px 0 0 0' }}>
                    Chief Pharmacist Control Center: Manage mandatory security passkeys for every pharmacy staff member.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => {
                      setNewStaffFullName('');
                      setNewStaffUsername('');
                      setNewStaffPassword('');
                      setNewStaffPasskey('');
                      setNewStaffRole('cashier');
                      setNewStaffEmail('');
                      setStaffModalError(null);
                      setShowAddStaffModal(true);
                    }}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <UserPlus size={16} />
                    Add Staff Member
                  </button>

                  <button 
                    onClick={() => {
                      setProfileFullName(currentUser.full_name || '');
                      setProfilePasskey('');
                      setProfilePassword('');
                      setProfileMessage(null);
                      setShowProfileModal(true);
                    }} 
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                    title="Change Dr. Ramesh / Admin display name"
                  >
                    <UserCog size={16} />
                    Edit My Name (Admin)
                  </button>

                  <button 
                    onClick={() => fetchStaffPasskeys()} 
                    className="btn btn-secondary"
                    disabled={loadingStaff}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <RefreshCw size={14} className={loadingStaff ? 'animate-spin' : ''} />
                    {loadingStaff ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {passkeyFeedback && (
                <div style={{ 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  marginBottom: '18px',
                  background: passkeyFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${passkeyFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                  color: passkeyFeedback.type === 'error' ? '#f87171' : '#34d399',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldCheck size={18} />
                  {passkeyFeedback.text}
                </div>
              )}

              {/* Security Summary Cards */}
              <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="glass-panel stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Chief Pharmacist Passkey</span>
                    <div className="stat-icon" style={{ background: 'rgba(250, 204, 21, 0.15)', color: '#facc15' }}>
                      <KeyRound size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ fontSize: '1.4rem', color: '#facc15', letterSpacing: '1px' }}>
                    {currentUser?.passkey || '2306324052'}
                  </div>
                  <div className="stat-subtext">Admin Master Security Passkey (Active)</div>
                </div>

                <div className="glass-panel stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Authorized Staff</span>
                    <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                      <ShieldCheck size={18} />
                    </div>
                  </div>
                  <div className="stat-value">{staffList.length || 3} Accounts</div>
                  <div className="stat-subtext">Role-Based Access Control Enforced</div>
                </div>

                <div className="glass-panel stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Security Status</span>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                      <Lock size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: '#34d399', fontSize: '1.25rem' }}>Strict Manual 3FA</div>
                  <div className="stat-subtext">1-Click bypass disabled system-wide</div>
                </div>
              </div>

              {/* Staff Passkeys Table */}
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Security Passkey / PIN</th>
                      <th>Account Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                          {loadingStaff ? 'Loading staff directory...' : 'Click "Refresh Staff List" to display active staff accounts.'}
                        </td>
                      </tr>
                    ) : (
                      staffList.map(s => {
                        return (
                          <tr key={s.id}>
                            <td>
                              <strong style={{ color: '#fff' }}>{s.full_name}</strong>
                              {s.id === currentUser?.id && (
                                <span className="badge badge-primary" style={{ marginLeft: '6px', fontSize: '0.7rem' }}>You</span>
                              )}
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email || 'No email registered'}</div>
                            </td>
                            <td><code>{s.username}</code></td>
                            <td>
                              <span className={`badge ${s.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
                                {s.role === 'admin' ? 'Chief Pharmacist' : 'Dispensary Cashier'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <code style={{ 
                                  fontSize: '0.95rem', 
                                  padding: '4px 10px', 
                                  borderRadius: '6px', 
                                  background: s.role === 'admin' ? 'rgba(250, 204, 21, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                  color: s.role === 'admin' ? '#facc15' : '#38bdf8',
                                  fontWeight: 700
                                }}>
                                  {s.passkey}
                                </code>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                                {s.is_active ? 'Active' : 'Deactivated'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '0.785rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                                  onClick={() => handleOpenEditStaff(s)}
                                  title="Edit staff name, username, passkey, or role"
                                >
                                  <Edit3 size={13} />
                                  Edit Member
                                </button>
                                {s.id !== currentUser?.id && (
                                  <button 
                                    className="btn btn-danger" 
                                    style={{ padding: '6px 10px', fontSize: '0.785rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => handleDeleteStaffMember(s)}
                                    title="Delete staff account"
                                  >
                                    <Trash2 size={13} />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Instructions on how Admin manages passkeys */}
              <div style={{ marginTop: '22px', padding: '16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={16} color="#38bdf8" />
                  Passkey Security Guidelines for Chief Pharmacist
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.7 }}>
                  <li><strong>Admin Passkey (<code>2306324052</code>):</strong> Grants master authority to add medicines, delete batches, adjust stock, and issue new passkeys.</li>
                  <li><strong>Cashier Passkeys (e.g. <code>1111</code>, <code>2222</code>):</strong> Unique to each dispensing counter cashier. Prevents non-pharmacy hospital staff from processing sales.</li>
                  <li><strong>Passkey Rotation:</strong> If a cashier leaves or shifts duty, click <em>"Change Passkey"</em> above to immediately assign a new PIN without changing their account.</li>
                </ul>
              </div>
            </section>
          )}
        </>
      )}

      {/* MODAL: PRINTABLE HOSPITAL PHARMACY INVOICE (Section 17) */}
      {completedInvoice && (
        <div className="modal-overlay">
          <div className="printable-receipt">
            <div className="receipt-header">
              <div className="receipt-hospital-name">🏥 DEMO HOSPITAL PHARMACY</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Central Pharmacy &bull; POS Terminal #1</div>
              <div className="receipt-meta">
                <div><strong>Invoice:</strong> {completedInvoice.invoice_number}</div>
                <div><strong>Date & Time:</strong> {completedInvoice.date_time}</div>
                <div><strong>Cashier:</strong> {completedInvoice.cashier_name} ({completedInvoice.cashier_username})</div>
                <div><strong>Patient:</strong> {completedInvoice.customer_name}</div>
              </div>
            </div>

            <table className="receipt-items-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {completedInvoice.items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{it.medicine_name}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{it.strength}</div>
                    </td>
                    <td><code>{it.batch_number}</code></td>
                    <td>{it.quantity}</td>
                    <td>₹{it.unit_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{it.line_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="receipt-totals">
              <div className="receipt-total-row">
                <span>GRAND TOTAL:</span>
                <span>₹{completedInvoice.total_amount.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '4px' }}>
                Payment Method: <strong>{completedInvoice.payment_method}</strong> (PAID)
              </div>
            </div>

            <div className="receipt-footer">
              <div>*** GET WELL SOON ***</div>
              <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>Prescription medicines once sold cannot be returned.</div>
            </div>

            {/* Print & Close Buttons (Hidden during printing) */}
            <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => window.print()} 
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px' }}
              >
                <Printer size={16} />
                Print Receipt
              </button>
              <button 
                onClick={() => setCompletedInvoice(null)} 
                className="btn btn-receipt-close"
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#0f172a', 
                  color: '#ffffff',
                  border: '1px solid #334155',
                  fontWeight: 700
                }}
              >
                New Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW MEDICINE */}
      {showAddMedModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">➕ Add Medicine to Master Catalog</h3>
              <button onClick={() => setShowAddMedModal(false)} className="btn btn-secondary" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {modalMessage && (
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                marginBottom: '14px',
                background: modalMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: modalMessage.type === 'error' ? '#f87171' : '#34d399',
                fontSize: '0.85rem'
              }}>
                {modalMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateMedicine}>
              <div className="form-group">
                <label className="form-label">Medicine Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Ciprofloxacin 500 mg" 
                  value={newMedName} 
                  onChange={(e) => setNewMedName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Generic Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Ciprofloxacin" 
                    value={newMedGeneric} 
                    onChange={(e) => setNewMedGeneric(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Brand Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Ciplox" 
                    value={newMedBrand} 
                    onChange={(e) => setNewMedBrand(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Strength *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 500 mg" 
                    value={newMedStrength} 
                    onChange={(e) => setNewMedStrength(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage Form *</label>
                  <select 
                    className="form-input" 
                    value={newMedForm} 
                    onChange={(e) => setNewMedForm(e.target.value)}
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Manufacturer</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Cipla Ltd." 
                    value={newMedMfg} 
                    onChange={(e) => setNewMedMfg(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. strip / bottle" 
                    value={newMedUnit} 
                    onChange={(e) => setNewMedUnit(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Reorder Level (Low Stock Warning) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newMedReorder} 
                    onChange={(e) => setNewMedReorder(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Critical Stock Level *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newMedCritical} 
                    onChange={(e) => setNewMedCritical(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              {/* Initial Inventory Batch Setup Section */}
              <div style={{ 
                marginTop: '16px', 
                padding: '14px 16px', 
                background: 'rgba(56, 189, 248, 0.08)', 
                borderRadius: '8px', 
                border: '1px solid rgba(56, 189, 248, 0.25)' 
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={15} />
                  Initial Inventory Batch Setup (Available Immediately)
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Batch Number *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. BATCH-2026-01"
                      value={newMedBatch} 
                      onChange={(e) => setNewMedBatch(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={newMedExpiry} 
                      onChange={(e) => setNewMedExpiry(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Initial Stock Quantity (Units) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={newMedQty} 
                      onChange={(e) => setNewMedQty(e.target.value)} 
                      min="0"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price per Unit (₹) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-input" 
                      value={newMedPrice} 
                      onChange={(e) => setNewMedPrice(e.target.value)} 
                      min="0"
                      required 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddMedModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={modalLoading} 
                  className="btn btn-primary"
                >
                  {modalLoading ? 'Creating...' : 'Create Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT */}
      {showStockModal && selectedBatchForStock && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">📦 Add Stock / Stock Adjustment</h3>
              <button onClick={() => setShowStockModal(false)} className="btn btn-secondary" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ 
              padding: '14px 18px', 
              background: 'rgba(0, 0, 0, 0.35)', 
              borderRadius: '8px', 
              marginBottom: '18px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>
                {selectedBatchForStock.medicine_name}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Batch: <code>{selectedBatchForStock.batch_number}</code> &bull; Expiry: {selectedBatchForStock.expiry_date}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#38bdf8', marginTop: '6px' }}>
                Current Physical Stock: <strong>{selectedBatchForStock.quantity} units</strong>
              </div>
            </div>

            {modalMessage && (
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                marginBottom: '14px',
                background: modalMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: modalMessage.type === 'error' ? '#f87171' : '#34d399',
                fontSize: '0.85rem'
              }}>
                {modalMessage.text}
              </div>
            )}

            <form onSubmit={handleAdjustStock}>
              <div className="form-group">
                <label className="form-label">
                  Quantity Change (+ to Add, - to Deduct) *
                </label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={stockChangeInput} 
                  onChange={(e) => setStockChangeInput(e.target.value)} 
                  required 
                />
                <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  New Projected Stock: <strong>{Number(selectedBatchForStock.quantity) + (Number(stockChangeInput) || 0)} units</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mandatory Audit Reason *</label>
                <select 
                  className="form-input"
                  value={stockReasonInput}
                  onChange={(e) => setStockReasonInput(e.target.value)}
                  required
                >
                  <option value="New distributor shipment received">New distributor shipment received</option>
                  <option value="Emergency stock replenishment">Emergency stock replenishment</option>
                  <option value="Damaged / broken packaging adjustment">Damaged / broken packaging adjustment (-)</option>
                  <option value="Expired stock removal">Expired stock removal (-)</option>
                  <option value="Physical count inventory correction">Physical count inventory correction</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowStockModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={modalLoading} 
                  className="btn btn-primary"
                >
                  {modalLoading ? 'Updating Stock...' : 'Confirm Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF MEMBER */}
      {showAddStaffModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">👥 Add New Staff Member</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="btn btn-secondary" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {staffModalError && (
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                marginBottom: '14px', 
                background: 'rgba(239, 68, 68, 0.2)', 
                color: '#f87171', 
                fontSize: '0.85rem' 
              }}>
                {staffModalError}
              </div>
            )}

            <form onSubmit={handleAddStaffMember}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Dr. Rajesh Kumar or Sneha Patel"
                  value={newStaffFullName} 
                  onChange={(e) => setNewStaffFullName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Username (Login ID) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. rajesh or sneha01"
                    value={newStaffUsername} 
                    onChange={(e) => setNewStaffUsername(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select 
                    className="form-input"
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                  >
                    <option value="cashier">Dispensary Cashier</option>
                    <option value="admin">Chief Pharmacist (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Account Password *</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Enter login password"
                    value={newStaffPassword} 
                    onChange={(e) => setNewStaffPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Security Passkey / PIN *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 5566 or 2306324052"
                    value={newStaffPasskey} 
                    onChange={(e) => setNewStaffPasskey(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hospital Email (Optional)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="staff@hospital.org"
                  value={newStaffEmail} 
                  onChange={(e) => setNewStaffEmail(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddStaffModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={staffModalLoading} 
                  className="btn btn-primary"
                >
                  {staffModalLoading ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STAFF MEMBER */}
      {showEditStaffModal && editingStaffMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">✏️ Edit Staff Member: {editingStaffMember.username}</h3>
              <button onClick={() => setShowEditStaffModal(false)} className="btn btn-secondary" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {staffModalError && (
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                marginBottom: '14px', 
                background: 'rgba(239, 68, 68, 0.2)', 
                color: '#f87171', 
                fontSize: '0.85rem' 
              }}>
                {staffModalError}
              </div>
            )}

            <form onSubmit={handleSaveEditStaff}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editStaffFullName} 
                  onChange={(e) => setEditStaffFullName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editStaffUsername} 
                    onChange={(e) => setEditStaffUsername(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select 
                    className="form-input"
                    value={editStaffRole}
                    onChange={(e) => setEditStaffRole(e.target.value)}
                  >
                    <option value="cashier">Dispensary Cashier</option>
                    <option value="admin">Chief Pharmacist (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Security Passkey / PIN *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editStaffPasskey} 
                    onChange={(e) => setEditStaffPasskey(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select 
                    className="form-input"
                    value={editStaffActive}
                    onChange={(e) => setEditStaffActive(Number(e.target.value))}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Reset Password (Leave blank to keep unchanged)</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Enter new password to reset"
                    value={editStaffPassword} 
                    onChange={(e) => setEditStaffPassword(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={editStaffEmail} 
                    onChange={(e) => setEditStaffEmail(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowEditStaffModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={staffModalLoading} 
                  className="btn btn-primary"
                >
                  {staffModalLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MY ADMIN PROFILE / CHANGE OWN NAME */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">👑 Edit My Profile & Name</h3>
              <button onClick={() => setShowProfileModal(false)} className="btn btn-secondary" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {profileMessage && (
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                marginBottom: '14px', 
                background: profileMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                color: profileMessage.type === 'error' ? '#f87171' : '#34d399', 
                fontSize: '0.85rem' 
              }}>
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateMyProfile}>
              <div className="form-group">
                <label className="form-label">My Full Name (Admin Display Name) *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileFullName} 
                  onChange={(e) => setProfileFullName(e.target.value)} 
                  placeholder="e.g. Dr. Ramesh (Chief Pharmacist)"
                  required 
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  This name appears on all billed invoices, reports, top-bar, and system audit logs.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Change My Security Passkey (Leave blank to keep current)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profilePasskey} 
                  onChange={(e) => setProfilePasskey(e.target.value)} 
                  placeholder="Enter new security passkey"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Change My Account Password (Leave blank to keep current)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={profilePassword} 
                  onChange={(e) => setProfilePassword(e.target.value)} 
                  placeholder="Enter new password"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowProfileModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={profileLoading} 
                  className="btn btn-primary"
                >
                  {profileLoading ? 'Updating...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLEAR SALES & REPORT HISTORY (ADMIN ONLY) */}
      {showClearHistoryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={20} />
                Clear Sales & Report History
              </h3>
              <button onClick={() => setShowClearHistoryModal(false)} className="btn btn-secondary" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {clearHistoryResult ? (
              <div style={{ padding: '16px 0' }}>
                <div style={{ 
                  padding: '16px', 
                  borderRadius: '10px', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  marginBottom: '18px'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={18} />
                    Sales History Cleared Successfully
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: '4px 0' }}>
                    {clearHistoryResult.purgedBills} sales bills were purged. All reports and counters have been reset.
                  </p>
                  <p style={{ fontSize: '0.825rem', color: '#a7f3d0', margin: '8px 0 0 0' }}>
                    A permanent safety backup was automatically saved to the server as both <strong>Microsoft Excel (.xlsx)</strong> and <strong>Adobe PDF</strong>.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <button 
                    onClick={() => handleDownloadArchive(clearHistoryResult.excelFile)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <Download size={15} />
                    Download Backup (.xlsx)
                  </button>
                  <button 
                    onClick={() => handleDownloadArchive(clearHistoryResult.pdfFile)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <Download size={15} />
                    Download Backup (PDF)
                  </button>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button 
                    onClick={() => { setShowClearHistoryModal(false); setClearHistoryResult(null); }}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ 
                  padding: '14px 16px', 
                  borderRadius: '8px', 
                  background: 'rgba(239, 68, 68, 0.12)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  marginBottom: '18px'
                }}>
                  <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <AlertTriangle size={16} />
                    High-Security Action: Admin Authorization Required
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#cbd5e1', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    This will clear active completed sales transactions and reset the reports ledger.
                    <br />
                    <strong>Automatic Safety Protection:</strong> A complete backup of the current records will be compiled into <strong>PDF and Excel (.xlsx)</strong> files and saved permanently on the server before clearing.
                  </p>
                </div>

                {clearHistoryError && (
                  <div style={{ 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    marginBottom: '14px', 
                    background: 'rgba(239, 68, 68, 0.2)', 
                    color: '#f87171', 
                    fontSize: '0.85rem' 
                  }}>
                    {clearHistoryError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ color: '#fff', fontWeight: 600 }}>
                    Enter Chief Pharmacist Security Passkey *
                  </label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Enter admin passkey (e.g. 2306324052)"
                    value={clearHistoryPasskey} 
                    onChange={(e) => setClearHistoryPasskey(e.target.value)} 
                    autoFocus
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Only the Chief Pharmacist security passkey can authorize history purge.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowClearHistoryModal(false)} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleConfirmClearHistory}
                    disabled={clearHistoryLoading} 
                    className="btn btn-danger"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={15} />
                    {clearHistoryLoading ? 'Archiving & Purging...' : 'Authorize & Clear History'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Architecture Modules Roadmap */}
      <div className="grid-cards no-print">
        <div className="glass-panel module-card">
          <div>
            <div className="module-header">
              <div className="module-icon-wrap" style={{ color: '#0ea5e9' }}>
                <Server size={20} />
              </div>
              <h3 className="module-title">1. Express Backend</h3>
            </div>
            <p className="module-desc">
              REST API with CORS, SQLite WAL, and structured error handling.
            </p>
          </div>
          <div>
            <span className="badge badge-success">Phase 1 Configured</span>
          </div>
        </div>

        <div className="glass-panel module-card">
          <div>
            <div className="module-header">
              <div className="module-icon-wrap" style={{ color: '#10b981' }}>
                <Database size={20} />
              </div>
              <h3 className="module-title">2. Relational Database</h3>
            </div>
            <p className="module-desc">
              SQLite schema: 7 tables, foreign keys, and seed test data.
            </p>
          </div>
          <div>
            <span className="badge badge-success">Phase 2 Completed</span>
          </div>
        </div>

        <div className="glass-panel module-card">
          <div>
            <div className="module-header">
              <div className="module-icon-wrap" style={{ color: '#a855f7' }}>
                <ShieldCheck size={20} />
              </div>
              <h3 className="module-title">3. Role-Based Auth</h3>
            </div>
            <p className="module-desc">
              JWT tokens, bcrypt password hashing, and route protection.
            </p>
          </div>
          <div>
            <span className="badge badge-success">Phase 3 Completed</span>
          </div>
        </div>

        <div className="glass-panel module-card">
          <div>
            <div className="module-header">
              <div className="module-icon-wrap" style={{ color: '#f59e0b' }}>
                <AlertTriangle size={20} />
              </div>
              <h3 className="module-title">4. Stock Alert Engine</h3>
            </div>
            <p className="module-desc">
              4-tier alerts: Low Stock, Critical Stock, Near-Expiry, and Expired.
            </p>
          </div>
          <div>
            <span className="badge badge-success">Phase 4 Completed</span>
          </div>
        </div>

        <div className="glass-panel module-card">
          <div>
            <div className="module-header">
              <div className="module-icon-wrap" style={{ color: '#38bdf8' }}>
                <Boxes size={20} />
              </div>
              <h3 className="module-title">5. Medicine & Inventory</h3>
            </div>
            <p className="module-desc">
              Catalog table, batch tracking, stock addition, and adjustments.
            </p>
          </div>
          <div>
            <span className="badge badge-success">Phase 5 Completed</span>
          </div>
        </div>

        <div className="glass-panel module-card">
          <div>
            <div className="module-header">
              <div className="module-icon-wrap" style={{ color: '#ec4899' }}>
                <ShoppingCart size={20} />
              </div>
              <h3 className="module-title">6 & 7. Cashier POS & Stock Deduction</h3>
            </div>
            <p className="module-desc">
              POS cart, transaction safety, automatic stock deduction, and invoice printing.
            </p>
          </div>
          <div>
            <span className="badge badge-success">Phase 6 & 7 Active</span>
          </div>
        </div>
      </div>

      <footer className="footer-section no-print">
        College Project Demo &bull; Hospital Pharmacy POS &bull; Built with React & Node.js
      </footer>
    </div>
  );
}
