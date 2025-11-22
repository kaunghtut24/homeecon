import React, { createContext, useContext, useState, PropsWithChildren, useEffect, useMemo } from 'react';
import { Transaction, Envelope, ViewState, Category, CurrencyCode } from '../types';
import { INITIAL_ENVELOPES } from '../constants';
import { db, isMockMode } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

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

    // Determine query filter: Family ID takes precedence, else User ID
    // We need to wait for userProfile to be loaded? 
    // Actually, AuthContext loads it. We can access it via useAuth().
    // But we need to add it to the dependency array.

    // Note: We need to handle the case where userProfile is loading.
    // For now, we'll assume if user is present, we check the profile.
    if (userProfile === undefined) { // userProfile is null if not found, undefined if still loading
      // User is logged in, but profile is still loading. Wait for it.
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

    const q = query(
      collection(db, 'transactions'),
      where(filterField, '==', filterValue),
      orderBy('date', 'desc') // Order by date descending
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Transaction[];

      // Sort by date desc (Firestore orderBy handles this, but keeping for consistency/mock mode)
      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(docs);
    });

    return () => unsubscribe();
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

    // Remove id if it exists, let Firestore generate it
    const { id, ...data } = t;

    try {
      await addDoc(collection(db, 'transactions'), data);
    } catch (e) {
      console.error("Error adding transaction: ", e);
      alert("Failed to save transaction");
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

      // Delete all user transactions
      // Note: In a real app, use a batch or cloud function for this
      transactions.forEach(t => {
        deleteTransaction(t.id);
      });
    }
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

  const envelopes = useMemo(() => {
    const currentEnvelopes = JSON.parse(JSON.stringify(INITIAL_ENVELOPES)) as Envelope[];

    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        t.items.forEach(item => {
          const envIndex = currentEnvelopes.findIndex(e => e.category === item.category);
          const itemNormalized = convertAmount(item.amount, t.currency);

          if (envIndex >= 0) {
            currentEnvelopes[envIndex].spent += itemNormalized;
          } else {
            const otherIdx = currentEnvelopes.findIndex(e => e.category === Category.OTHER);
            if (otherIdx >= 0) currentEnvelopes[otherIdx].spent += itemNormalized;
          }
        });
      }
    });
    return currentEnvelopes;
  }, [filteredTransactions, homeCurrency, rates]);


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