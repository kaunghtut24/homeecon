import React, { createContext, useContext, useState, PropsWithChildren, useEffect, useMemo } from 'react';
import { Transaction, Envelope, ViewState, Category, CurrencyCode } from '../types';
import { INITIAL_ENVELOPES } from '../constants';
import { db, isMockMode } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { BudgetService, BudgetConfig } from '../services/BudgetService';

interface AppContextType {
  currentView: ViewState;
  setView: (view: ViewState) => void;

  // Input Mode Control
  initialInputMode: 'income' | 'expense' | null;
  setInitialInputMode: (mode: 'income' | 'expense' | null) => void;

  // Time Travel
  selectedMonth: Date; // First day of the month
  prevMonth: () => void;
  nextMonth: () => void;

  // Data
  transactions: Transaction[];
  envelopes: Envelope[];
  currentMonthIncome: number;
  currentMonthExpense: number;
  openingBalance: number; // Rollover from previous months
  netSavings: number; // Current month savings

  // Budget Management
  budgets: BudgetConfig[];
  updateBudget: (categoryId: string, limit: number) => Promise<void>;
  addCategory: (name: string, limit: number, color: string) => Promise<void>;
  toggleCategory: (categoryId: string, isHidden: boolean) => Promise<void>;

  // Currency
  homeCurrency: CurrencyCode;
  setHomeCurrency: (code: CurrencyCode) => void;
  rates: Record<string, number>; // Rates relative to USD (Base)
  updateRate: (currency: CurrencyCode, rate: number) => void;
  convertAmount: (amount: number, fromCurrency: CurrencyCode) => number;
  refreshRates: () => Promise<void>;

  // Actions
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  resetData: () => void;

  // Helpers
  getTransactionsForPeriod: (period: 'month' | 'quarter' | 'year') => Transaction[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage Keys
const STORAGE_KEY_CURRENCY = 'homeecon_currency';
const STORAGE_KEY_RATES = 'homeecon_rates';
const STORAGE_KEY_MOCK_TRANSACTIONS = 'homeecon_mock_transactions';

// Default rates relative to USD
const DEFAULT_RATES: Record<string, number> = {
  'USD': 1.0,
  'EUR': 0.92,
  'GBP': 0.77,
  'JPY': 150.0,
  'CAD': 1.38,
  'AUD': 1.52,
  'INR': 84.0,
  'MMK': 2100.0,
};

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  const { user, userProfile } = useAuth();
  const [currentView, setView] = useState<ViewState>('dashboard');
  const [initialInputMode, setInitialInputMode] = useState<'income' | 'expense' | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetConfig[]>([]);

  const [homeCurrency, setHomeCurrency] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
      return (saved as CurrencyCode) || 'USD';
    } catch (e) {
      return 'USD';
    }
  });

  const [rates, setRates] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RATES);
      return saved ? JSON.parse(saved) : DEFAULT_RATES;
    } catch (e) {
      return DEFAULT_RATES;
    }
  });

  // Date State
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  // -- Persistence Effects --

  // Load Budgets
  useEffect(() => {
    const loadBudgets = async () => {
      if (userProfile) {
        const loaded = await BudgetService.getUserBudgets(userProfile);
        setBudgets(loaded);
      } else {
        // Default if no user yet (or loading)
        setBudgets(BudgetService.getDefaultBudgets());
      }
    };
    loadBudgets();
  }, [userProfile]);

  // Listen to Firestore Transactions or Load Mock Data
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    if (isMockMode) {
      const saved = localStorage.getItem(STORAGE_KEY_MOCK_TRANSACTIONS);
      if (saved) {
        setTransactions(JSON.parse(saved));
      }
      return;
    }

    if (userProfile === undefined) {
      return;
    }

    let filterField: string;
    let filterValue: string;

    if (userProfile?.familyId) {
      filterField = 'familyId';
      filterValue = userProfile.familyId;
    } else {
      filterField = 'userId';
      filterValue = user.uid;
    }

    // Try query with orderBy first (requires index)
    // If it fails, fall back to query without orderBy (no index needed)
    const qWithOrderBy = query(
      collection(db, 'transactions'),
      where(filterField, '==', filterValue),
      orderBy('date', 'desc')
    );

    const qWithoutOrderBy = query(
      collection(db, 'transactions'),
      where(filterField, '==', filterValue)
    );

    let currentUnsubscribe: (() => void) | null = null;
    let hasSwitchedToFallback = false;

    // Setup listener with automatic fallback on index errors
    const setupListener = () => {
      // Use fallback query directly to avoid index issues
      // This ensures transactions load immediately while indexes are building
      console.log('Setting up transaction listener with fallback query');
      
      currentUnsubscribe = onSnapshot(
        qWithoutOrderBy,
        (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as Transaction[];

          // Sort client-side by date (descending)
          docs.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA; // Descending order
          });

          setTransactions(docs);
        },
        (error: any) => {
          console.error('Error loading transactions:', error);
          setTransactions([]);
        }
      );
    };

    setupListener();

    return () => {
      if (currentUnsubscribe) {
        currentUnsubscribe();
      }
    };
  }, [user, userProfile]);


  // Save Mock Data when transactions change (only in mock mode)
  useEffect(() => {
    if (isMockMode && user) {
      localStorage.setItem(STORAGE_KEY_MOCK_TRANSACTIONS, JSON.stringify(transactions));
    }
  }, [transactions, user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENCY, homeCurrency);
  }, [homeCurrency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rates));
  }, [rates]);


  // -- Actions --

  const prevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const convertAmount = (amount: number, fromCurrency: CurrencyCode): number => {
    if (fromCurrency === homeCurrency) return amount;
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[homeCurrency] || 1;

    const amountInUSD = amount / fromRate;
    const amountInHome = amountInUSD * toRate;
    return parseFloat(amountInHome.toFixed(2));
  };

  const updateRate = (currency: CurrencyCode, rate: number) => {
    setRates(prev => ({ ...prev, [currency]: rate }));
  };

  const refreshRates = async () => {
    const newRates = { ...rates };
    Object.keys(newRates).forEach(key => {
      if (key !== 'USD') {
        const fluctuation = (Math.random() * 0.02) - 0.01;
        newRates[key] = parseFloat((newRates[key] + fluctuation).toFixed(4));
      }
    });
    setRates(newRates);
  };

  const addTransaction = async (newTransaction: Transaction) => {
    if (!user) return;

    const normalizedTotal = convertAmount(newTransaction.total, newTransaction.currency);

    // Prepare transaction data
    const t: any = {
      ...newTransaction,
      normalizedTotal,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };

    // Add Family Info if available
    if (userProfile?.familyId) {
      t.familyId = userProfile.familyId;
    }
    if (userProfile?.displayName) {
      t.userDisplayName = userProfile.displayName;
    } else if (user.email) {
      t.userDisplayName = user.email.split('@')[0];
    }

    if (isMockMode) {
      // Generate a fake ID
      const mockT = { ...t, id: Math.random().toString(36).substr(2, 9) };
      setTransactions(prev => [mockT, ...prev]);
      return;
    }

    // Remove id field and clean up undefined values for Firestore
    const { id, ...data } = t;
    
    // Clean up undefined values - Firestore doesn't accept undefined
    // Also handle null values and ensure all required fields are valid
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      // Skip receiptImageUrl if it's undefined, null, or empty
      if (key === 'receiptImageUrl') {
        if (value && value !== '' && value !== undefined && value !== null) {
          cleanData[key] = value;
        }
        return; // Skip adding undefined receiptImageUrl
      }
      
      // Only include defined, non-null values
      if (value !== undefined && value !== null) {
        // Ensure exchangeRate is a valid number
        if (key === 'exchangeRate' && (isNaN(value) || !isFinite(value))) {
          cleanData[key] = 1; // Default to 1 if invalid
        } else {
          cleanData[key] = value;
        }
      }
    });
    
    // Final cleanup: Remove any undefined values that might have slipped through
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    // Validate required fields
    if (!cleanData.userId || !cleanData.merchantName || !cleanData.date || !cleanData.type) {
      const errorMsg = `Missing required fields: userId=${!!cleanData.userId}, merchantName=${!!cleanData.merchantName}, date=${!!cleanData.date}, type=${!!cleanData.type}`;
      console.error("Validation error:", errorMsg);
      alert(`Failed to save transaction: ${errorMsg}`);
      return;
    }

    // Validate date format
    if (cleanData.date && isNaN(new Date(cleanData.date).getTime())) {
      console.error("Invalid date format:", cleanData.date);
      alert(`Failed to save transaction: Invalid date format`);
      return;
    }

    try {
      await addDoc(collection(db, 'transactions'), cleanData);
    } catch (e: any) {
      console.error("Error adding transaction: ", e);
      const errorMessage = e?.message || e?.code || "Unknown error";
      alert(`Failed to save transaction: ${errorMessage}`);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    if (isMockMode) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (e) {
      console.error("Error deleting transaction: ", e);
      alert("Failed to delete transaction");
    }
  };

  const resetData = async () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      if (isMockMode) {
        setTransactions([]);
        localStorage.removeItem(STORAGE_KEY_MOCK_TRANSACTIONS);
        return;
      }

      transactions.forEach(t => {
        deleteTransaction(t.id);
      });
    }
  };

  // -- Budget Actions --
  const updateBudget = async (categoryId: string, limit: number) => {
    if (!userProfile) return;
    const newBudgets = budgets.map(b => b.categoryId === categoryId ? { ...b, limit } : b);
    setBudgets(newBudgets);
    await BudgetService.saveUserBudgets(userProfile, newBudgets);
  };

  const addCategory = async (name: string, limit: number, color: string) => {
    if (!userProfile) return;
    const newCategory: BudgetConfig = {
      categoryId: name, // Use name as ID for custom
      name,
      limit,
      color,
      isHidden: false,
      isCustom: true
    };
    const newBudgets = [...budgets, newCategory];
    setBudgets(newBudgets);
    await BudgetService.saveUserBudgets(userProfile, newBudgets);
  };

  const toggleCategory = async (categoryId: string, isHidden: boolean) => {
    if (!userProfile) return;
    const newBudgets = budgets.map(b => b.categoryId === categoryId ? { ...b, isHidden } : b);
    setBudgets(newBudgets);
    await BudgetService.saveUserBudgets(userProfile, newBudgets);
  };

  // -- Computed Data --

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === selectedMonth.getMonth() &&
        tDate.getFullYear() === selectedMonth.getFullYear();
    });
  }, [transactions, selectedMonth]);

  const currentMonthIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + convertAmount(t.total, t.currency), 0);
  }, [filteredTransactions, homeCurrency, rates]);

  const currentMonthExpense = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertAmount(t.total, t.currency), 0);
  }, [filteredTransactions, homeCurrency, rates]);

  const netSavings = currentMonthIncome - currentMonthExpense;

  // Calculate Opening Balance (Sum of all PREVIOUS months)
  const openingBalance = useMemo(() => {
    const startOfSelectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);

    return transactions
      .filter(t => new Date(t.date) < startOfSelectedMonth)
      .reduce((sum, t) => {
        const amount = convertAmount(t.total, t.currency);
        return t.type === 'income' ? sum + amount : sum - amount;
      }, 0);
  }, [transactions, selectedMonth, homeCurrency, rates]);

  const envelopes = useMemo(() => {
    // Use dynamic budgets instead of INITIAL_ENVELOPES
    // Filter out hidden categories
    const currentEnvelopes: Envelope[] = budgets
      .filter(b => !b.isHidden)
      .map(b => ({
        category: b.categoryId as Category, // Cast for now, or update Envelope type
        budgeted: b.limit,
        spent: 0,
        color: b.color
      }));

    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        t.items.forEach(item => {
          const envIndex = currentEnvelopes.findIndex(e => e.category === item.category);
          const itemNormalized = convertAmount(item.amount, t.currency);

          if (envIndex >= 0) {
            currentEnvelopes[envIndex].spent += itemNormalized;
          } else {
            // If category not found (e.g. hidden or deleted), maybe add to Other?
            // Or just ignore? For now, let's try to find "Other"
            const otherIdx = currentEnvelopes.findIndex(e => e.category === Category.OTHER);
            if (otherIdx >= 0) currentEnvelopes[otherIdx].spent += itemNormalized;
          }
        });
      }
    });
    return currentEnvelopes;
  }, [filteredTransactions, homeCurrency, rates, budgets]);


  const getTransactionsForPeriod = (period: 'month' | 'quarter' | 'year') => {
    const now = selectedMonth;
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (period === 'month') {
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      } else if (period === 'quarter') {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return tDate >= threeMonthsAgo && tDate <= endOfMonth;
      } else {
        return tDate.getFullYear() === now.getFullYear();
      }
    });
  };

  return (
    <AppContext.Provider value={{
      currentView,
      setView,
      initialInputMode,
      setInitialInputMode,
      transactions,
      envelopes,
      addTransaction,
      deleteTransaction,
      resetData,
      homeCurrency,
      setHomeCurrency,
      rates,
      updateRate,
      convertAmount,
      refreshRates,
      selectedMonth,
      prevMonth,
      nextMonth,
      currentMonthIncome,
      currentMonthExpense,
      openingBalance,
      netSavings,
      budgets,
      updateBudget,
      addCategory,
      toggleCategory,
      getTransactionsForPeriod
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};