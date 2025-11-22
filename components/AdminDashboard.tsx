import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/AdminService';
import { UserProfile, UserStatus } from '../types';

export const AdminDashboard = () => {
    const { userProfile, isAdmin } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'locked'>('all');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const [allUsers, pending] = await Promise.all([
                AdminService.getAllUsers(),
                AdminService.getPendingUsers()
            ]);
            setUsers(allUsers);
            setPendingUsers(pending);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        if (!userProfile) return;
        try {
            await AdminService.approveUser(userId, userProfile.uid);
            await loadUsers();
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Failed to approve user');
        }
    };

    const handleLock = async (userId: string) => {
        if (!userProfile) return;
        if (!confirm('Are you sure you want to lock this user?')) return;
        try {
            await AdminService.lockUser(userId, userProfile.uid);
            await loadUsers();
        } catch (error) {
            console.error('Error locking user:', error);
            alert('Failed to lock user');
        }
    };

    const handleUnlock = async (userId: string) => {
        if (!userProfile) return;
        try {
            await AdminService.unlockUser(userId, userProfile.uid);
            await loadUsers();
        } catch (error) {
            console.error('Error unlocking user:', error);
            alert('Failed to unlock user');
        }
    };

    const handleMakeAdmin = async (userId: string) => {
        if (!userProfile) return;
        if (!confirm('Are you sure you want to make this user an admin?')) return;
        try {
            await AdminService.makeAdmin(userId, userProfile.uid);
            await loadUsers();
        } catch (error) {
            console.error('Error making user admin:', error);
            alert('Failed to make user admin');
        }
    };

    const handleRemoveAdmin = async (userId: string) => {
        if (!userProfile) return;
        if (!confirm('Are you sure you want to remove admin privileges?')) return;
        try {
            await AdminService.removeAdmin(userId, userProfile.uid);
            await loadUsers();
        } catch (error) {
            console.error('Error removing admin:', error);
            alert('Failed to remove admin');
        }
    };

    const getStatusBadge = (status?: UserStatus) => {
        const statusMap = {
            [UserStatus.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            [UserStatus.APPROVED]: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            [UserStatus.LOCKED]: { bg: 'bg-red-100', text: 'text-red-800', label: 'Locked' },
            [UserStatus.DISABLED]: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Disabled' }
        };

        const config = statusMap[status || UserStatus.APPROVED];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const filteredUsers = users.filter(u => {
        if (filter === 'all') return true;
        if (filter === 'pending') return u.status === UserStatus.PENDING;
        if (filter === 'approved') return u.status === UserStatus.APPROVED;
        if (filter === 'locked') return u.status === UserStatus.LOCKED;
        return true;
    });

    const stats = {
        total: users.length,
        pending: users.filter(u => u.status === UserStatus.PENDING).length,
        active: users.filter(u => u.status === UserStatus.APPROVED).length,
        locked: users.filter(u => u.status === UserStatus.LOCKED).length
    };

    if (!isAdmin) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="text-slate-600 mt-2">You do not have admin privileges.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-slate-500 text-sm">Manage users and access control</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-sm text-slate-500">Total Users</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-700">Pending</p>
                    <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-sm text-green-700">Active</p>
                    <p className="text-2xl font-bold text-green-800">{stats.active}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <p className="text-sm text-red-700">Locked</p>
                    <p className="text-2xl font-bold text-red-800">{stats.locked}</p>
                </div>
            </div>

            {/* Pending Approvals */}
            {pendingUsers.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-yellow-900 mb-4">⚠️ Pending Approvals ({pendingUsers.length})</h2>
                    <div className="space-y-3">
                        {pendingUsers.map(user => (
                            <div key={user.uid} className="bg-white rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800">{user.displayName || 'Unknown'}</p>
                                    <p className="text-sm text-slate-500">{user.email}</p>
                                    <p className="text-xs text-slate-400">Registered: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(user.uid)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleLock(user.uid)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'locked'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${filter === f
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {user.displayName || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                                        <td className="px-6 py-4">
                                            {user.isAdmin ? (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-xs">User</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-center">
                                                {user.status === UserStatus.PENDING && (
                                                    <button
                                                        onClick={() => handleApprove(user.uid)}
                                                        className="text-green-600 hover:text-green-800 font-semibold text-xs"
                                                        title="Approve"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                )}
                                                {user.status === UserStatus.APPROVED && !user.isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => handleLock(user.uid)}
                                                            className="text-red-600 hover:text-red-800 font-semibold text-xs"
                                                            title="Lock"
                                                        >
                                                            🔒 Lock
                                                        </button>
                                                        <button
                                                            onClick={() => handleMakeAdmin(user.uid)}
                                                            className="text-purple-600 hover:text-purple-800 font-semibold text-xs"
                                                            title="Make Admin"
                                                        >
                                                            ⭐ Admin
                                                        </button>
                                                    </>
                                                )}
                                                {user.status === UserStatus.LOCKED && (
                                                    <button
                                                        onClick={() => handleUnlock(user.uid)}
                                                        className="text-green-600 hover:text-green-800 font-semibold text-xs"
                                                        title="Unlock"
                                                    >
                                                        🔓 Unlock
                                                    </button>
                                                )}
                                                {user.isAdmin && user.uid !== userProfile?.uid && (
                                                    <button
                                                        onClick={() => handleRemoveAdmin(user.uid)}
                                                        className="text-orange-600 hover:text-orange-800 font-semibold text-xs"
                                                        title="Remove Admin"
                                                    >
                                                        ✗ Remove Admin
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
