import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { parseReceiptImage } from '../services/geminiService';
import { ParsedReceiptData, Category, CurrencyCode, TransactionType } from '../types';
import { CURRENCIES } from '../constants';
import { Loader } from './ui/Loader';

type Mode = 'scan' | 'manual';

export const ScanView = () => {
  const { setView, addTransaction, homeCurrency, rates, initialInputMode, setInitialInputMode } = useApp();
  const [mode, setMode] = useState<Mode>('scan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [type, setType] = useState<TransactionType>('expense');
  const [merchantName, setMerchantName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<CurrencyCode>(homeCurrency);
  const [total, setTotal] = useState<number>(0);
  const [items, setItems] = useState<{name: string; amount: number; category: string}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for navigation intent from Dashboard
  useEffect(() => {
    if (initialInputMode) {
        setMode('manual');
        setType(initialInputMode);
        initManualMode(initialInputMode);
        setInitialInputMode(null); // Reset so it doesn't persist
    }
  }, [initialInputMode]);

  // Initialize manual mode
  const initManualMode = (forceType?: TransactionType) => {
    setMode('manual');
    setImagePreview(null);
    setMerchantName('');
    setTotal(0);
    const initialType = forceType || type;
    setType(initialType);
    
    if (initialType === 'income') {
        setItems([{ name: 'Monthly Salary', amount: 0, category: Category.INCOME }]);
    } else {
        setItems([{ name: 'Item 1', amount: 0, category: Category.OTHER }]);
    }
    
    setCurrency(homeCurrency);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setIsProcessing(true);
        setError(null);
        
        try {
          const base64Data = base64String.split(',')[1];
          const result = await parseReceiptImage(base64Data, file.type);
          
          setMerchantName(result.merchantName);
          setDate(result.date);
          setTotal(result.total);
          setItems(result.items);
          setType('expense'); // OCR is usually expense
          if (result.currency && CURRENCIES.find(c => c.code === result.currency)) {
             setCurrency(result.currency as CurrencyCode);
          } else {
             setCurrency(homeCurrency);
          }
          
          setMode('manual');
        } catch (err: any) {
          setError(err.message || "Failed to process receipt.");
          setImagePreview(null);
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!merchantName || total <= 0) {
        setError("Please enter a name and amount.");
        return;
    }

    // If items don't equal total (often case in manual quick entry), normalize items
    let finalItems = items;
    if (type === 'income') {
        finalItems = [{ name: 'Income Source', amount: total, category: Category.INCOME }];
    } else {
         // Sanitize categories
         finalItems = items.map(i => ({
            ...i,
            category: (Object.values(Category).includes(i.category as Category) 
              ? i.category as Category 
              : Category.OTHER)
          }));
    }

    addTransaction({
      id: Date.now().toString(),
      merchantName,
      date,
      type,
      currency,
      subtotal: total,
      tax: 0,
      total,
      exchangeRate: rates[currency] / rates['USD'],
      normalizedTotal: 0, // Context handles this
      items: finalItems,
      receiptImageUrl: imagePreview || undefined
    });

    setView('dashboard');
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[idx] as any)[field] = value;
    setItems(newItems);
    if (type === 'expense') {
        const newTotal = newItems.reduce((sum, item) => sum + Number(item.amount), 0);
        setTotal(newTotal);
    }
  };

  const addNewItem = () => {
    setItems([...items, { name: '', amount: 0, category: Category.OTHER }]);
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
        <div className="relative w-64 h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
            <img src={imagePreview!} alt="Receipt" className="w-full h-full object-cover opacity-50 blur-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Loader />
            </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-700">AI Processing...</h3>
        <p className="text-slate-500">Extracting merchant, items, and currency.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto p-4">
       
       {/* Mode Toggle */}
       {!imagePreview && mode === 'scan' && (
          <div className="flex space-x-4 mb-8 justify-center">
            <button 
                className="bg-emerald-100 text-emerald-700 py-2 px-6 rounded-full font-semibold shadow-inner"
                disabled
            >
                📷 Scan Receipt
            </button>
            <button 
                onClick={() => initManualMode('expense')}
                className="bg-white text-slate-500 py-2 px-6 rounded-full font-semibold hover:bg-slate-50 border border-slate-200"
            >
                ✍️ Manual Entry
            </button>
          </div>
       )}

       {mode === 'scan' && !imagePreview && (
        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-8 animate-fade-in">
            <div className="bg-emerald-50 p-8 rounded-full shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Smart Receipt Scan</h2>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition hover:scale-105 w-full max-w-xs text-lg">
                Take Photo
            </button>
            <button onClick={() => setView('dashboard')} className="text-slate-400">Cancel</button>
        </div>
       )}

       {mode === 'manual' && (
         <div className="flex-1 overflow-y-auto pb-24 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{imagePreview ? 'Verify Scan' : 'Add Entry'}</h2>
                <button onClick={() => setMode('scan')} className="text-slate-500 text-sm">Cancel</button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">{error}</div>}

            <div className="space-y-6">
                {/* Type Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setType('expense')} 
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Expense
                    </button>
                    <button 
                        onClick={() => setType('income')} 
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Income
                    </button>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">{type === 'income' ? 'Source' : 'Merchant'}</label>
                        <input 
                            type="text" 
                            value={merchantName} 
                            onChange={(e) => setMerchantName(e.target.value)}
                            placeholder={type === 'income' ? 'e.g. Salary, Bonus' : 'e.g. Walmart'}
                            className="w-full text-lg font-semibold text-slate-800 border-b border-slate-200 focus:border-emerald-500 focus:outline-none py-1"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                            <input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full border-b border-slate-200 py-1 focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Currency</label>
                            <select 
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                className="w-full bg-transparent border-b border-slate-200 py-1 font-medium focus:outline-none"
                            >
                                {CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                         <label className="text-xs font-bold text-slate-400 uppercase">Total Amount</label>
                         <div className="flex items-center">
                             <span className="text-2xl font-bold text-slate-400 mr-1">{CURRENCIES.find(c => c.code === currency)?.symbol}</span>
                             <input 
                                type="number" 
                                step="0.01"
                                value={total} 
                                onChange={(e) => setTotal(parseFloat(e.target.value))}
                                className={`w-full text-3xl font-bold border-b border-slate-200 focus:outline-none py-1 ${type === 'income' ? 'text-emerald-600 focus:border-emerald-500' : 'text-red-600 focus:border-red-500'}`}
                             />
                         </div>
                    </div>
                </div>

                {/* Line Items (Only for Expense) */}
                {type === 'expense' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Line Items</h3>
                            <button onClick={addNewItem} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200">+ Add Item</button>
                        </div>
                        
                        {items.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input 
                                        value={item.name}
                                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                        placeholder="Item name"
                                        className="flex-1 font-medium text-slate-800 border-b border-transparent focus:border-emerald-300 focus:outline-none"
                                    />
                                    <div className="w-24 flex items-center">
                                        <span className="text-slate-400 text-sm mr-1">{CURRENCIES.find(c => c.code === currency)?.symbol}</span>
                                        <input 
                                            type="number"
                                            value={item.amount}
                                            onChange={(e) => updateItem(idx, 'amount', parseFloat(e.target.value))}
                                            className="w-full font-bold text-slate-700 focus:outline-none text-right"
                                        />
                                    </div>
                                </div>
                                <select 
                                    value={item.category}
                                    onChange={(e) => updateItem(idx, 'category', e.target.value)}
                                    className="text-sm bg-slate-50 text-slate-600 rounded p-1 w-full"
                                >
                                    {Object.values(Category).filter(c => c !== Category.INCOME).map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-lg md:relative md:shadow-none md:border-0 md:bg-transparent md:p-0 md:mt-8">
                <button 
                    onClick={handleSave}
                    className={`w-full text-white font-bold py-3 rounded-xl shadow-md text-lg transition-colors ${type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    {type === 'income' ? 'Save Income' : 'Save Expense'}
                </button>
            </div>
         </div>
       )}
    </div>
  );
};