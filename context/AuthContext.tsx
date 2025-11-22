import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isMockMode } from '../services/firebase';
import { UserProfile } from '../types';
import { FamilyService } from '../services/FamilyService';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string, name: string, familyCode?: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (uid: string, email: string) => {
        if (isMockMode) {
            const saved = localStorage.getItem('mock_user_profile');
            if (saved) {
                setUserProfile(JSON.parse(saved));
            } else {
                // Create default mock profile
                const newProfile: UserProfile = { uid, email, displayName: email.split('@')[0] };
                localStorage.setItem('mock_user_profile', JSON.stringify(newProfile));
                setUserProfile(newProfile);
            }
            return;
        }

        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
            } else {
                // Create new profile
                const newProfile: UserProfile = {
                    uid,
                    email,
                    displayName: email.split('@')[0]
                };
                await setDoc(docRef, newProfile);
                setUserProfile(newProfile);
            }
        } catch (e) {
            console.error("Error fetching user profile:", e);
        }
    };

    useEffect(() => {
        if (isMockMode) {
            const mockUser = localStorage.getItem('mock_user');
            if (mockUser) {
                const u = JSON.parse(mockUser);
                setUser(u);
                fetchUserProfile(u.uid, u.email);
            }
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await fetchUserProfile(currentUser.uid, currentUser.email || '');
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user.uid, user.email || '');
        }
    };

    const signIn = async (email: string, pass: string) => {
        if (isMockMode) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockUser = { uid: 'mock-user-id', email } as User;
            setUser(mockUser);
            localStorage.setItem('mock_user', JSON.stringify(mockUser));
            await fetchUserProfile(mockUser.uid, email);
            return;
        }
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUp = async (email: string, pass: string, name: string, familyCode?: string) => {
        setLoading(true);
        try {
            // 1. Validate Family Code if provided
            if (familyCode) {
                const isValid = await FamilyService.validateFamilyCode(familyCode);
                if (!isValid) {
                    throw new Error("Invalid Family Code. Please check and try again, or leave it empty to create a new family later.");
                }
            }

            // 2. Create Auth User
            let userCredential;
            if (isMockMode) {
                // Mock Signup
                const mockUser = {
                    uid: 'mock-user-' + Date.now(),
                    email: email,
                    displayName: name
                };
                localStorage.setItem('mock_user', JSON.stringify(mockUser));

                const initialProfile: UserProfile = {
                    uid: mockUser.uid,
                    email: email,
                    displayName: name
                };
                localStorage.setItem('mock_user_profile', JSON.stringify(initialProfile));

                setUser(mockUser as any);
                setUserProfile(initialProfile);

                // 3. Join Family if code provided
                if (familyCode) {
                    await FamilyService.joinFamily(familyCode, initialProfile);
                    // Refresh profile to get updated familyId
                    const updatedProfile = { ...initialProfile, familyId: familyCode };
                    setUserProfile(updatedProfile);
                }
            } else {
                // Real Firebase Signup
                userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                const user = userCredential.user;

                // Create User Profile
                const profile: UserProfile = {
                    uid: user.uid,
                    email: user.email!,
                    displayName: name
                };

                await setDoc(doc(db, 'users', user.uid), profile);

                // 3. Join Family if code provided
                if (familyCode) {
                    await FamilyService.joinFamily(familyCode, profile);
                    // Fetch updated profile
                    const updatedSnap = await getDoc(doc(db, 'users', user.uid));
                    if (updatedSnap.exists()) {
                        setUserProfile(updatedSnap.data() as UserProfile);
                    }
                } else {
                    setUserProfile(profile);
                }
            }
        } catch (error: any) {
            console.error("Error signing up:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        if (isMockMode) {
            setUser(null);
            setUserProfile(null);
            localStorage.removeItem('mock_user');
            return;
        }
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signIn, signUp, signOut, refreshProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
