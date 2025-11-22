import React from 'react';
import { useAuth } from '../context/AuthContext';

export const PendingApprovalView = () => {
    const { signOut, userProfile } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-4xl">⏳</span>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Account Pending Approval</h1>
                    <p className="text-slate-600">
                        Your account is awaiting admin approval. You'll be able to access the app once an administrator reviews your registration.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <p className="text-sm text-blue-800">
                        <strong>Account Details:</strong>
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                        Email: {userProfile?.email}
                    </p>
                    <p className="text-sm text-blue-700">
                        Name: {userProfile?.displayName}
                    </p>
                </div>

                <div className="text-sm text-slate-500">
                    <p>Please check back later or contact your administrator for assistance.</p>
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
