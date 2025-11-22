import React from 'react';
import { useAuth } from '../context/AuthContext';

export const AccountLockedView = () => {
    const { signOut, userProfile } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-4xl">🔒</span>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Account Locked</h1>
                    <p className="text-slate-600">
                        Your account has been temporarily locked by an administrator. Please contact support for assistance.
                    </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                    <p className="text-sm text-red-800">
                        <strong>Account Details:</strong>
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                        Email: {userProfile?.email}
                    </p>
                    <p className="text-sm text-red-700">
                        Status: Locked
                    </p>
                </div>

                <button
                    onClick={signOut}
                    className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
};
