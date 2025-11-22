import { Category, Envelope, CurrencyCode, Transaction } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.HOUSING]: '#ef4444',
  [Category.FOOD]: '#f97316',
  [Category.TRANSPORTATION]: '#eab308',
  [Category.UTILITIES]: '#84cc16',
  [Category.INSURANCE]: '#10b981',
  [Category.MEDICAL]: '#06b6d4',
  [Category.SAVINGS]: '#3b82f6',
  [Category.PERSONAL]: '#6366f1',
  [Category.ENTERTAINMENT]: '#8b5cf6',
  [Category.TRAVEL]: '#d946ef',
  [Category.SOCIAL_CONTRIBUTION]: '#f43f5e',
  [Category.OTHER]: '#64748b',
  [Category.INCOME]: '#10b981'
};

export const CURRENCIES: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat' },
];

export const INITIAL_ENVELOPES: Envelope[] = [
  { category: Category.HOUSING, budgeted: 1200, spent: 0, color: '#ef4444' }, // Red
  { category: Category.FOOD, budgeted: 600, spent: 0, color: '#f97316' }, // Orange
  { category: Category.TRANSPORTATION, budgeted: 300, spent: 0, color: '#eab308' }, // Yellow
  { category: Category.UTILITIES, budgeted: 200, spent: 0, color: '#84cc16' }, // Lime
  { category: Category.INSURANCE, budgeted: 150, spent: 0, color: '#10b981' }, // Emerald
  { category: Category.MEDICAL, budgeted: 100, spent: 0, color: '#06b6d4' }, // Cyan
  { category: Category.SAVINGS, budgeted: 500, spent: 0, color: '#3b82f6' }, // Blue
  { category: Category.PERSONAL, budgeted: 200, spent: 0, color: '#6366f1' }, // Indigo
  { category: Category.ENTERTAINMENT, budgeted: 150, spent: 0, color: '#8b5cf6' }, // Violet
  { category: Category.TRAVEL, budgeted: 300, spent: 0, color: '#d946ef' }, // Fuchsia
  { category: Category.SOCIAL_CONTRIBUTION, budgeted: 100, spent: 0, color: '#f43f5e' }, // Rose
  { category: Category.OTHER, budgeted: 100, spent: 0, color: '#64748b' }, // Slate
];

// Mock initial transactions
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    merchantName: 'Whole Foods Market',
    date: new Date().toISOString().split('T')[0], // Today
    type: 'expense',
    currency: 'USD',
    subtotal: 125.50,
    tax: 10.00,
    exchangeRate: 1,
    total: 135.50,
    normalizedTotal: 135.50,
    items: [
      { name: 'Organic Apples', amount: 8.50, category: Category.FOOD },
      { name: 'Milk', amount: 4.50, category: Category.FOOD }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    merchantName: 'Paris Bistro',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2 days ago
    type: 'expense',
    currency: 'EUR',
    subtotal: 40.00,
    tax: 5.00,
    exchangeRate: 1.10,
    total: 45.00,
    normalizedTotal: 49.50, // Approx 1.1 rate
    items: [
      { name: 'Dinner', amount: 45.00, category: Category.FOOD }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];
