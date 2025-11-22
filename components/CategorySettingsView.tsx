import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category } from '../types';
import { Tooltip } from './Tooltip';

const BudgetRow = ({ budget, homeCurrency, updateBudget, toggleCategory }: any) => {
    const [limit, setLimit] = useState(budget.limit.toString());

    const handleBlur = () => {
        const val = parseFloat(limit);
        if (!isNaN(val) && val >= 0 && val !== budget.limit) {
            updateBudget(budget.categoryId, val);
        } else {
            setLimit(budget.limit.toString()); // Reset if invalid or unchanged
        }
    };

    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-medium text-slate-800 flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.color }}></div>
                <span>{budget.name}</span>
                {budget.isCustom && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Custom</span>}
            </td>
            <td className="px-6 py-4">
                <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    onBlur={handleBlur}
                    className="w-24 px-2 py-1 border border-slate-200 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition-all"
                />
            </td>
            <td className="px-6 py-4 text-center">
                <div className="w-6 h-6 rounded-full mx-auto border border-slate-200" style={{ backgroundColor: budget.color }}></div>
            </td>
            <td className="px-6 py-4 text-center">
                <button
                    onClick={() => toggleCategory(budget.categoryId, !budget.isHidden)}
                    className={`p-2 rounded-full transition-colors ${budget.isHidden ? 'text-slate-300 hover:text-slate-500' : 'text-emerald-500 hover:text-emerald-600 bg-emerald-50'}`}
                    title={budget.isHidden ? "Show Category" : "Hide Category"}
                >
                    {budget.isHidden ? '👁️‍🗨️' : '👁️'}
                </button>
            </td>
        </tr>
    );
};

export const CategorySettingsView = () => {
    const { budgets, updateBudget, addCategory, toggleCategory, homeCurrency } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryLimit, setNewCategoryLimit] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#64748b');

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName && newCategoryLimit) {
            await addCategory(newCategoryName, parseFloat(newCategoryLimit), newCategoryColor);
            setShowAddModal(false);
            setNewCategoryName('');
            setNewCategoryLimit('');
            setNewCategoryColor('#64748b');
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Category Settings</h1>
                    <p className="text-slate-500 text-sm">Manage your budget limits and categories</p>
                </div>
                <Tooltip content="Add a new custom category" position="left">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition-transform active:scale-95 text-sm"
                    >
                        <span>+ Add Category</span>
                    </button>
                </Tooltip>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Budget Limit ({homeCurrency})</th>
                                <th className="px-6 py-4 text-center">Color</th>
                                <th className="px-6 py-4 text-center">Visible</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {budgets.map((budget) => (
                                <BudgetRow
                                    key={budget.categoryId}
                                    budget={budget}
                                    homeCurrency={homeCurrency}
                                    updateBudget={updateBudget}
                                    toggleCategory={toggleCategory}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Category Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">Add New Category</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Gym, Hobbies"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Budget ({homeCurrency})</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                                    value={newCategoryLimit}
                                    onChange={(e) => setNewCategoryLimit(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Color Code</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        className="h-10 w-10 rounded cursor-pointer border-0"
                                        value={newCategoryColor}
                                        onChange={(e) => setNewCategoryColor(e.target.value)}
                                    />
                                    <span className="text-sm text-slate-500 font-mono">{newCategoryColor}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                            >
                                Create Category
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
