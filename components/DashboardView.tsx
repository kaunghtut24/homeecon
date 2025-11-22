import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateFinancialReport } from '../services/pdfService';
import { CURRENCIES } from '../constants';
import { Category } from '../types';
import { AiAdvisor } from './AiAdvisor';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';

import { Tooltip } from './Tooltip';

export const DashboardView = () => {
  const {
    envelopes,
    transactions,
    deleteTransaction,
    resetData,
    currentMonthIncome,
    currentMonthExpense,
    selectedMonth,
    prevMonth,
    nextMonth,
    setView,
    setInitialInputMode,
    homeCurrency,
    setHomeCurrency,
    rates,
    updateRate,
    refreshRates,
    getTransactionsForPeriod,
    convertAmount
  } = useApp();

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const currencySymbol = CURRENCIES.find(c => c.code === homeCurrency)?.symbol || '$';
  const netSavings = currentMonthIncome - currentMonthExpense;

  // Filter transactions for display
  const monthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === selectedMonth.getMonth() &&
      tDate.getFullYear() === selectedMonth.getFullYear();
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Chart Data (Daily Trend)
  const lineData = React.useMemo(() => {
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i).toISOString().split('T')[0];
      const dailyTotal = transactions
        .filter(t => t.date === dateStr && t.type === 'expense')
        .reduce((sum, t) => sum + t.normalizedTotal, 0);

      if (dailyTotal > 0 || i % 5 === 0) {
        data.push({ date: dateStr, amount: dailyTotal });
      }
    }
    return data;
  }, [transactions, selectedMonth, homeCurrency]);

  const handleDownloadReport = (period: 'month' | 'quarter' | 'year') => {
    const data = getTransactionsForPeriod(period);
    generateFinancialReport(data, envelopes, homeCurrency, period, selectedMonth);
    setShowReportModal(false);
  };

  const handleAddIncome = () => {
    setInitialInputMode('income');
    setView('scan');
  };

  const handleAddExpense = () => {
    setInitialInputMode('expense');
    setView('scan');
  };

  const monthName = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 space-y-8 animate-fade-in relative">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={prevMonth} className="p-2 bg-white rounded-full shadow hover:bg-slate-50 text-slate-600 transition">◀</button>
          <div className="text-center min-w-[150px]">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{monthName}</h1>
            <p className="text-slate-500 text-sm">Budget Overview</p>
          </div>
          <button onClick={nextMonth} className="p-2 bg-white rounded-full shadow hover:bg-slate-50 text-slate-600 transition">▶</button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Tooltip content="Change currency settings" position="bottom">
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-2 px-3 rounded-lg shadow-sm transition-colors text-sm"
            >
              🌍 {homeCurrency}
            </button>
          </Tooltip>

          <Tooltip content="Download financial reports" position="bottom">
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center space-x-2 transition-all text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden md:inline">Report</span>
            </button>
          </Tooltip>

          <Tooltip content="Add new income manually" position="bottom">
            <button
              onClick={handleAddIncome}
              className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center space-x-2 transition-transform active:scale-95 text-sm"
            >
              <span>+ Income</span>
            </button>
          </Tooltip>

          <Tooltip content="Add new expense manually" position="bottom">
            <button
              onClick={handleAddExpense}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition-transform active:scale-95 text-sm"
            >
              <span>+ Expense</span>
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <svg className="w-24 h-24 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Income</p>
          <p className="text-3xl font-bold text-emerald-600">{currencySymbol}{currentMonthIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <svg className="w-24 h-24 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Expenses</p>
          <p className="text-3xl font-bold text-red-600">{currencySymbol}{currentMonthExpense.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between h-32 ${netSavings >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${netSavings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Savings</p>
          <p className={`text-3xl font-bold ${netSavings >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{currencySymbol}{netSavings.toLocaleString()}</p>
        </div>
      </div>

      {/* AI Advisor */}
      <AiAdvisor
        income={currentMonthIncome}
        expense={currentMonthExpense}
        currencySymbol={currencySymbol}
        selectedMonth={selectedMonth}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Envelopes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
            Monthly Envelopes
          </h2>
          <div className="space-y-5">
            {envelopes.map((env) => {
              const percent = Math.min((env.spent / env.budgeted) * 100, 100);
              const isOver = env.spent > env.budgeted;
              return (
                <div
                  key={env.category}
                  onClick={() => setSelectedCategory(env.category)}
                  className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700">{env.category}</span>
                    <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-slate-500'}`}>
                      {currencySymbol}{env.spent.toLocaleString()} <span className="text-slate-300">/</span> {currencySymbol}{env.budgeted.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : ''}`}
                      style={{
                        width: `${percent}%`,
                        backgroundColor: isOver ? undefined : env.color
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Analytics */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 flex items-center mb-4">
              <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
              Expense Trend
            </h2>
            <div className="flex-1">
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(str) => {
                        const d = new Date(str);
                        return `${d.getDate()}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${currencySymbol}${val}`}
                    />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      formatter={(val: number) => [`${currencySymbol}${val.toFixed(2)}`, 'Amount']}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  No expense data for this month
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Transaction History</h2>
          <span className="text-xs text-slate-400 font-medium">{monthTransactions.length} entries</span>
        </div>
        <div className="divide-y divide-slate-100">
          {monthTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No transactions found for this month.
            </div>
          ) : (
            monthTransactions.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {t.type === 'income' ? '💰' : '🛒'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{t.merchantName}</p>
                    <p className="text-xs text-slate-500">
                      {t.date} • {t.currency}
                      {t.userDisplayName && <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-medium">{t.userDisplayName}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {t.type === 'income' ? '+' : '-'} {CURRENCIES.find(c => c.code === t.currency)?.symbol}{t.total.toLocaleString()}
                    </p>
                    {t.currency !== homeCurrency && (
                      <p className="text-xs text-slate-400">
                        ≈ {currencySymbol}{t.normalizedTotal.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category Detail Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-6 animate-fade-in max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-8 rounded-full" style={{ backgroundColor: envelopes.find(e => e.category === selectedCategory)?.color }}></div>
                <h3 className="text-xl font-bold text-slate-800">{selectedCategory} Details</h3>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4">
              {monthTransactions
                .filter(t => t.items.some(i => i.category === selectedCategory))
                .map(t => {
                  const categoryItems = t.items.filter(i => i.category === selectedCategory);
                  const categoryTotal = categoryItems.reduce((sum, i) => sum + i.amount, 0);
                  const normalizedCategoryTotal = convertAmount(categoryTotal, t.currency);

                  return (
                    <div key={t.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-800">{t.merchantName}</p>
                          <p className="text-xs text-slate-500">{t.date} • {t.userDisplayName || 'Me'}</p>
                        </div>
                        <p className="font-bold text-slate-700">
                          {currencySymbol}{normalizedCategoryTotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1 pl-4 border-l-2 border-slate-200">
                        {categoryItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-600">{item.name}</span>
                            <span className="text-slate-500">
                              {t.currency !== homeCurrency ? `~${currencySymbol}` : ''}
                              {convertAmount(item.amount, t.currency).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

              {monthTransactions.filter(t => t.items.some(i => i.category === selectedCategory)).length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No transactions found for this category in {monthName}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Currency Settings</h3>
              <button onClick={() => setShowCurrencyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Home Currency</label>
              <div className="grid grid-cols-3 gap-2">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setHomeCurrency(c.code)}
                    className={`p-2 rounded-lg border text-sm font-semibold transition-all ${homeCurrency === c.code
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                      }`}
                  >
                    {c.code} ({c.symbol})
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-slate-500 uppercase">Exchange Rates (to USD)</label>
                <button onClick={() => refreshRates()} className="text-xs text-emerald-600 font-semibold">⚡ Fetch Live</button>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                {Object.keys(rates).map((code) => (
                  <div key={code} className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-slate-600">1 USD = </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        value={rates[code]}
                        onChange={(e) => updateRate(code as any, parseFloat(e.target.value))}
                        className="w-24 text-right text-sm bg-white border border-slate-200 rounded p-1"
                      />
                      <span className="font-mono text-sm text-slate-500 w-8">{code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex space-x-3">
              <button onClick={resetData} className="flex-1 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 text-sm">Reset Data</button>
              <button onClick={() => setShowCurrencyModal(false)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 text-sm">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Generate Report</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3">
              <button onClick={() => handleDownloadReport('month')} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 flex items-center justify-center">
                📅 Current Month ({monthName})
              </button>
              <button onClick={() => handleDownloadReport('quarter')} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 flex items-center justify-center">
                📊 Last Quarter (3 Months)
              </button>
              <button onClick={() => handleDownloadReport('year')} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 flex items-center justify-center">
                📈 This Year
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};