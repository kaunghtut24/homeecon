import { db, isMockMode } from './firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';
import { Family, UserProfile } from '../types';

export const FamilyService = {
    async createFamily(name: string, user: UserProfile): Promise<Family | null> {
        if (isMockMode) {
            const mockFamily: Family = {
                id: Math.random().toString(36).substr(2, 6).toUpperCase(),
                name,
                members: [user.uid],
                createdAt: new Date().toISOString()
            };

            // Update mock user profile in local storage
            const updatedUser = { ...user, familyId: mockFamily.id };
            localStorage.setItem('mock_user_profile', JSON.stringify(updatedUser));
            localStorage.setItem(`mock_family_${mockFamily.id}`, JSON.stringify(mockFamily));

            return mockFamily;
        }

        try {
            // 1. Create Family Document
            const familyRef = doc(collection(db, 'families'));
            const familyId = familyRef.id.toUpperCase().substring(0, 6); // Simple 6-char code

            const newFamily: Family = {
                id: familyId,
                name,
                members: [user.uid],
                createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'families', familyId), newFamily);

            // 2. Update User Profile
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { familyId }, { merge: true });

            return newFamily;
        } catch (e) {
            console.error("Error creating family:", e);
            throw e;
        }
    },

    async joinFamily(familyId: string, user: UserProfile): Promise<Family | null> {
        if (isMockMode) {
            // Normalize familyId to uppercase to match how families are created
            const normalizedFamilyId = familyId.toUpperCase();
            const savedFamily = localStorage.getItem(`mock_family_${normalizedFamilyId}`);
            if (!savedFamily) throw new Error("Family not found");

            const family = JSON.parse(savedFamily) as Family;
            if (!family.members.includes(user.uid)) {
                family.members.push(user.uid);
                localStorage.setItem(`mock_family_${normalizedFamilyId}`, JSON.stringify(family));
            }

            const updatedUser = { ...user, familyId: normalizedFamilyId };
            localStorage.setItem('mock_user_profile', JSON.stringify(updatedUser));

            return family;
        }

        try {
            // Normalize familyId to uppercase to match how families are created
            const normalizedFamilyId = familyId.toUpperCase();
            const familyRef = doc(db, 'families', normalizedFamilyId);
            const familySnap = await getDoc(familyRef);

            if (!familySnap.exists()) {
                throw new Error("Family not found");
            }

            // 1. Add user to family members
            await updateDoc(familyRef, {
                members: arrayUnion(user.uid)
            });

            // 2. Update User Profile
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { familyId: normalizedFamilyId }, { merge: true });

            return familySnap.data() as Family;
        } catch (e) {
            console.error("Error joining family:", e);
            throw e;
        }
    },

    async getFamily(familyId: string): Promise<Family | null> {
        if (isMockMode) {
            const saved = localStorage.getItem(`mock_family_${familyId}`);
            return saved ? JSON.parse(saved) : null;
        }

        try {
            const docSnap = await getDoc(doc(db, 'families', familyId));
            return docSnap.exists() ? (docSnap.data() as Family) : null;
        } catch (e) {
            console.error("Error getting family:", e);
            return null;
        }
    },

    async validateFamilyCode(familyId: string): Promise<boolean> {
        if (!familyId) return false;
        const family = await this.getFamily(familyId.toUpperCase());
        return !!family;
    }
};
