import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FamilyService } from '../services/FamilyService';

import { Tooltip } from './Tooltip';

export const FamilySettingsView = () => {
    const { userProfile, refreshProfile } = useAuth();
    const [familyName, setFamilyName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleCreateFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        setLoading(true);
        setMessage(null);
        try {
            await FamilyService.createFamily(familyName, userProfile);
            await refreshProfile();
            setMessage({ type: 'success', text: 'Family created successfully!' });
            setFamilyName('');
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to create family. ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleJoinFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        setLoading(true);
        setMessage(null);
        try {
            await FamilyService.joinFamily(joinCode.toUpperCase(), userProfile);
            await refreshProfile();
            setMessage({ type: 'success', text: 'Joined family successfully!' });
            setJoinCode('');
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to join family. Check the code and try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (userProfile?.familyId) {
        return (
            <div className="p-6 space-y-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">
                            🏠
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">My Family</h2>
                            <p className="text-slate-500">You are part of a family group</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                        <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-2">Family Code</p>
                        <div className="text-4xl font-mono font-bold text-slate-800 tracking-widest mb-4">
                            {userProfile.familyId}
                        </div>
                        <Tooltip content="Share invitation code with others" position="bottom">
                            <button
                                onClick={async () => {
                                    const shareData = {
                                        title: 'Join my HomeEcon Family',
                                        text: `Join my family on HomeEcon! Use code: ${userProfile.familyId}`,
                                        url: window.location.href
                                    };
                                    if (navigator.share) {
                                        try {
                                            await navigator.share(shareData);
                                        } catch (err) {
                                            console.error('Error sharing:', err);
                                        }
                                    } else {
                                        navigator.clipboard.writeText(`Join my family on HomeEcon! Use code: ${userProfile.familyId}`);
                                        alert('Invite copied to clipboard!');
                                    }
                                }}
                                className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full font-bold hover:bg-emerald-200 transition-colors flex items-center justify-center mx-auto space-x-2"
                            >
                                <span>📤 Share Invite</span>
                            </button>
                        </Tooltip>
                        <p className="text-xs text-slate-400 mt-4">Share this code with family members to let them join.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-2xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Family Sharing</h2>
                <p className="text-slate-500">Create a group to track expenses together or join an existing one.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Create Family */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-xl">
                        ✨
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Create New Family</h3>
                    <p className="text-sm text-slate-500 mb-6">Start a fresh budget for your household.</p>

                    <form onSubmit={handleCreateFamily} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Family Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. The Smiths"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                value={familyName}
                                onChange={(e) => setFamilyName(e.target.value)}
                            />
                        </div>
                        <Tooltip content="Create a new family group" position="bottom">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Family'}
                            </button>
                        </Tooltip>
                    </form>
                </div>

                {/* Join Family */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4 text-xl">
                        🔗
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Join Existing Family</h3>
                    <p className="text-sm text-slate-500 mb-6">Enter an invite code to join a group.</p>

                    <form onSubmit={handleJoinFamily} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Family Code</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. A1B2C3"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none font-mono uppercase"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                            />
                        </div>
                        <Tooltip content="Join an existing family group" position="bottom">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Joining...' : 'Join Family'}
                            </button>
                        </Tooltip>
                    </form>
                </div>
            </div>
        </div>
    );
};
