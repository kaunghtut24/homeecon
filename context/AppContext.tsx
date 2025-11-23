import React, { createContext, useContext, useState, PropsWithChildren, useEffect, useMemo } from 'react';
import { Transaction, Envelope, ViewState, Category, CurrencyCode } from '../types';
import { INITIAL_ENVELOPES } from '../constants';
import { db, isMockMode } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, or, Query, DocumentData } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { BudgetService, BudgetConfig } from '../services/BudgetService';
import { parseDate } from '../utils/dateUtils';

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
  isRolloverEnabled: boolean;
  toggleRollover: () => void;

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
const STORAGE_KEY_ROLLOVER = 'homeecon_rollover_enabled';

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

  // Rollover State
  const [isRolloverEnabled, setIsRolloverEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROLLOVER);
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

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

    // Construct query
    // If user has familyId, fetch transactions where (userId == uid) OR (familyId == familyId)
    // Otherwise, just fetch where userId == uid

    let qWithOrderBy: Query<DocumentData>;
    let qWithoutOrderBy: Query<DocumentData>;

    if (userProfile?.familyId) {
      qWithOrderBy = query(
        collection(db, 'transactions'),
        or(
          where('userId', '==', user.uid),
          where('familyId', '==', userProfile.familyId)
        ),
        orderBy('date', 'desc')
      );

      qWithoutOrderBy = query(
        collection(db, 'transactions'),
        or(
          where('userId', '==', user.uid),
          where('familyId', '==', userProfile.familyId)
        )
      );
    } else {
      qWithOrderBy = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      qWithoutOrderBy = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid)
      );
    }

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
          const docs = snapshot.docs.map(doc => {
            const data = doc.data();
            // Normalize items categories to ensure they're Category enum values
            const normalizedItems = (data.items || []).map((item: any) => ({
              ...item,
              category: typeof item.category === 'string'
                ? (Object.values(Category).includes(item.category as Category)
                  ? item.category as Category
                  : Category.OTHER)
                : (item.category || Category.OTHER)
            }));

            return {
              ...data,
              id: doc.id,
              items: normalizedItems
            } as Transaction;
          });

          // Sort client-side by date (descending)
          docs.sort((a, b) => {
            const dateA = parseDate(a.date).getTime();
            const dateB = parseDate(b.date).getTime();
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROLLOVER, JSON.stringify(isRolloverEnabled));
  }, [isRolloverEnabled]);


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

    // Normalize and validate date format
    if (cleanData.date) {
      try {
        // Try to parse the date and normalize to YYYY-MM-DD format
        const dateObj = new Date(cleanData.date);
        if (isNaN(dateObj.getTime())) {
          throw new Error("Invalid date");
        }
        // Normalize to YYYY-MM-DD format
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        cleanData.date = `${year}-${month}-${day}`;
      } catch (e) {
        console.error("Invalid date format:", cleanData.date);
        alert(`Failed to save transaction: Invalid date format. Please use YYYY-MM-DD format.`);
        return;
      }
    }

    // Ensure items is always an array
    if (!cleanData.items || !Array.isArray(cleanData.items)) {
      cleanData.items = [];
    }

    // Validate items array - ensure all items have required fields
    cleanData.items = cleanData.items
      .filter((item: any) => item && item.name && !isNaN(Number(item.amount)) && item.category)
      .map((item: any) => ({
        name: item.name || 'Item',
        amount: Number(item.amount) || 0,
        category: item.category || Category.OTHER
      }));

    console.log("Adding transaction:", cleanData);

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
    // When updating, save the current homeCurrency as the budget's currency
    const newBudgets = budgets.map(b => b.categoryId === categoryId ? { ...b, limit, currency: homeCurrency } : b);
    setBudgets(newBudgets);
    await BudgetService.saveUserBudgets(userProfile, newBudgets);
  };

  const addCategory = async (name: string, limit: number, color: string) => {
    if (!userProfile) return;
    const newCategory: BudgetConfig = {
      categoryId: name, // Use name as ID for custom
      name,
      limit,
      currency: homeCurrency, // Save with current currency
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
      const tDate = parseDate(t.date);
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
      .filter(t => parseDate(t.date) < startOfSelectedMonth)
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

      .map(b => {
        // Convert budget limit to home currency if it has a stored currency
        // If no currency is stored (legacy), assume it's already in the desired unit (raw) or treat as USD?
        // We'll treat missing currency as "raw" (no conversion) to avoid breaking existing views,
        // but users should update their budgets to fix this.
        const limit = b.currency ? convertAmount(b.limit, b.currency) : b.limit;

        return {
          category: b.categoryId as Category, // Cast for now, or update Envelope type
          budgeted: limit,
          spent: 0,
          color: b.color
        };
      });

    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        // If transaction has items, use them; otherwise use total as a single item
        if (t.items && t.items.length > 0) {
          t.items.forEach(item => {
            // Skip items with invalid amounts
            if (!item.amount || isNaN(item.amount) || item.amount <= 0) return;

            // Ensure category is a valid Category enum value (handle string to enum conversion)
            let itemCategory: Category;
            if (typeof item.category === 'string') {
              // Try to match string to Category enum
              const categoryMatch = Object.values(Category).find(c => c === item.category);
              itemCategory = categoryMatch || Category.OTHER;
            } else {
              itemCategory = item.category || Category.OTHER;
            }

            const envIndex = currentEnvelopes.findIndex(e => e.category === itemCategory);
            const itemNormalized = convertAmount(item.amount, t.currency);

            if (envIndex >= 0) {
              currentEnvelopes[envIndex].spent += itemNormalized;
            } else {
              // If category not found (e.g. hidden or deleted), add to Other
              const otherIdx = currentEnvelopes.findIndex(e => e.category === Category.OTHER);
              if (otherIdx >= 0) currentEnvelopes[otherIdx].spent += itemNormalized;
            }
          });
        } else {
          // No items - use transaction total as a single expense in "Other" category
          const totalNormalized = convertAmount(t.total, t.currency);
          const otherIdx = currentEnvelopes.findIndex(e => e.category === Category.OTHER);
          if (otherIdx >= 0) {
            currentEnvelopes[otherIdx].spent += totalNormalized;
          }
        }
      }
    });
    return currentEnvelopes;
  }, [filteredTransactions, homeCurrency, rates, budgets]);


  const getTransactionsForPeriod = (period: 'month' | 'quarter' | 'year') => {
    const now = selectedMonth;
    return transactions.filter(t => {
      const tDate = parseDate(t.date);
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

  const toggleRollover = () => {
    setIsRolloverEnabled(prev => !prev);
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
      getTransactionsForPeriod,
      isRolloverEnabled,
      toggleRollover
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