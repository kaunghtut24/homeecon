import { db, isMockMode } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import { UserProfile, UserStatus } from '../types';

const MOCK_USERS_KEY = 'homeecon_admin_users';

export const AdminService = {
    /**
     * Check if a user is an admin
     */
    async isAdmin(userId: string): Promise<boolean> {
        if (isMockMode) {
            const users = this.getMockUsers();
            const user = users.find(u => u.uid === userId);
            return user?.isAdmin === true && user?.status === UserStatus.APPROVED;
        }

        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) return false;

            const userData = userDoc.data() as UserProfile;
            return userData.isAdmin === true && userData.status === UserStatus.APPROVED;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    },

    /**
     * Get all users (admin only)
     */
    async getAllUsers(): Promise<UserProfile[]> {
        if (isMockMode) {
            return this.getMockUsers();
        }

        try {
            const usersQuery = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(usersQuery);
            return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
        } catch (error) {
            console.error('Error fetching all users:', error);
            return [];
        }
    },

    /**
     * Get pending users awaiting approval
     */
    async getPendingUsers(): Promise<UserProfile[]> {
        if (isMockMode) {
            return this.getMockUsers().filter(u => u.status === UserStatus.PENDING);
        }

        try {
            const pendingQuery = query(
                collection(db, 'users'),
                where('status', '==', UserStatus.PENDING),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(pendingQuery);
            return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
        } catch (error) {
            console.error('Error fetching pending users:', error);
            return [];
        }
    },

    /**
     * Approve a user
     */
    async approveUser(userId: string, adminId: string): Promise<void> {
        if (isMockMode) {
            const users = this.getMockUsers();
            const userIndex = users.findIndex(u => u.uid === userId);
            if (userIndex >= 0) {
                users[userIndex].status = UserStatus.APPROVED;
                users[userIndex].approvedBy = adminId;
                users[userIndex].approvedAt = new Date().toISOString();
                this.saveMockUsers(users);
            }
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                status: UserStatus.APPROVED,
                approvedBy: adminId,
                approvedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error approving user:', error);
            throw error;
        }
    },

    /**
     * Lock a user account
     */
    async lockUser(userId: string, adminId: string): Promise<void> {
        if (isMockMode) {
            const users = this.getMockUsers();
            const userIndex = users.findIndex(u => u.uid === userId);
            if (userIndex >= 0) {
                users[userIndex].status = UserStatus.LOCKED;
                this.saveMockUsers(users);
            }
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                status: UserStatus.LOCKED
            });
        } catch (error) {
            console.error('Error locking user:', error);
            throw error;
        }
    },

    /**
     * Unlock a user account
     */
    async unlockUser(userId: string, adminId: string): Promise<void> {
        if (isMockMode) {
            const users = this.getMockUsers();
            const userIndex = users.findIndex(u => u.uid === userId);
            if (userIndex >= 0) {
                users[userIndex].status = UserStatus.APPROVED;
                this.saveMockUsers(users);
            }
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                status: UserStatus.APPROVED
            });
        } catch (error) {
            console.error('Error unlocking user:', error);
            throw error;
        }
    },

    /**
     * Disable a user account permanently
     */
    async disableUser(userId: string, adminId: string): Promise<void> {
        if (isMockMode) {
            const users = this.getMockUsers();
            const userIndex = users.findIndex(u => u.uid === userId);
            if (userIndex >= 0) {
                users[userIndex].status = UserStatus.DISABLED;
                this.saveMockUsers(users);
            }
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                status: UserStatus.DISABLED
            });
        } catch (error) {
            console.error('Error disabling user:', error);
            throw error;
        }
    },

    /**
     * Make a user an admin
     */
    async makeAdmin(userId: string, adminId: string): Promise<void> {
        if (isMockMode) {
            const users = this.getMockUsers();
            const userIndex = users.findIndex(u => u.uid === userId);
            if (userIndex >= 0) {
                users[userIndex].isAdmin = true;
                this.saveMockUsers(users);
            }
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                isAdmin: true
            });
        } catch (error) {
            console.error('Error making user admin:', error);
            throw error;
        }
    },

    /**
     * Remove admin privileges from a user
     */
    async removeAdmin(userId: string, adminId: string): Promise<void> {
        if (isMockMode) {
            const users = this.getMockUsers();
            const userIndex = users.findIndex(u => u.uid === userId);
            if (userIndex >= 0) {
                users[userIndex].isAdmin = false;
                this.saveMockUsers(users);
            }
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                isAdmin: false
            });
        } catch (error) {
            console.error('Error removing admin:', error);
            throw error;
        }
    },

    // Mock mode helpers
    getMockUsers(): UserProfile[] {
        try {
            const saved = localStorage.getItem(MOCK_USERS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    },

    saveMockUsers(users: UserProfile[]): void {
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    }
};
