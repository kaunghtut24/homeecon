export enum Category {
  HOUSING = 'Housing',
  FOOD = 'Food',
  TRANSPORTATION = 'Transportation',
  UTILITIES = 'Utilities',
  INSURANCE = 'Insurance',
  MEDICAL = 'Medical',
  SAVINGS = 'Savings',
  PERSONAL = 'Personal',
  ENTERTAINMENT = 'Entertainment',
  TRAVEL = 'Travel',
  SOCIAL_CONTRIBUTION = 'Social Contribution',
  OTHER = 'Other',
  INCOME = 'Income' // Added for Income transactions
}

export type TransactionType = 'income' | 'expense';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'INR' | 'MMK';

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
}

export interface LineItem {
  name: string;
  amount: number;
  category: Category;
}

export interface Transaction {
  id: string;
  merchantName: string; // Or Source for income
  date: string;

  type: TransactionType;

  // The values in the currency of the transaction
  currency: CurrencyCode;
  subtotal: number;
  tax: number;
  total: number;

  // The exchange rate used at the time of transaction (relative to base)
  exchangeRate: number;

  // The calculated amount in the user's home currency (for budgeting)
  normalizedTotal: number;

  items: LineItem[];
  receiptImageUrl?: string;
  userId?: string;
  familyId?: string;
  userDisplayName?: string;
  createdAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  familyId?: string;
}

export interface Family {
  id: string;
  name: string;
  members: string[]; // Array of uids
  createdAt: string;
}

export interface Envelope {
  category: Category;
  budgeted: number;
  spent: number; // Always in Base/Home Currency
  color: string;
}

export type ViewState = 'dashboard' | 'scan' | 'reports' | 'categories' | 'settings';

export interface ParsedReceiptData {
  merchantName: string;
  date: string;
  currency?: CurrencyCode;
  subtotal: number;
  tax: number;
  total: number;
  items: {
    name: string;
    amount: number;
    category: string;
  }[];
}
