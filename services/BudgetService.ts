import { db, isMockMode } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, Category, CurrencyCode } from '../types';
import { INITIAL_ENVELOPES } from '../constants';

export interface BudgetConfig {
    categoryId: string; // Can be a Category enum value or custom string
    name: string;       // Display name
    limit: number;
    currency?: CurrencyCode; // The currency this limit is set in
    color: string;
    isHidden: boolean;
    isCustom: boolean;
}

const STORAGE_KEY_BUDGETS = 'homeecon_budgets';

export const BudgetService = {
    async getUserBudgets(user: UserProfile): Promise<BudgetConfig[]> {
        if (isMockMode) {
            const saved = localStorage.getItem(STORAGE_KEY_BUDGETS);
            if (saved) {
                return JSON.parse(saved);
            }
            // Return defaults if nothing saved
            return this.getDefaultBudgets();
        }

        try {
            const docRef = doc(db, 'user_settings', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().budgets) {
                return docSnap.data().budgets as BudgetConfig[];
            }

            // If no budgets found, return defaults (and maybe save them?)
            return this.getDefaultBudgets();
        } catch (e) {
            console.error("Error fetching budgets:", e);
            return this.getDefaultBudgets();
        }
    },

    async saveUserBudgets(user: UserProfile, budgets: BudgetConfig[]): Promise<void> {
        if (isMockMode) {
            localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
            return;
        }

        try {
            const docRef = doc(db, 'user_settings', user.uid);
            await setDoc(docRef, { budgets }, { merge: true });
        } catch (e) {
            console.error("Error saving budgets:", e);
            throw e;
        }
    },

    getDefaultBudgets(): BudgetConfig[] {
        return INITIAL_ENVELOPES.map(env => ({
            categoryId: env.category,
            name: env.category,
            limit: env.budgeted,
            currency: 'USD', // Default to USD for initial envelopes
            color: env.color,
            isHidden: false,
            isCustom: false
        }));
    }
};
