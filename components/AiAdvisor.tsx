import React from 'react';

interface AiAdvisorProps {
  income: number;
  expense: number;
  currencySymbol: string;
  selectedMonth: Date;
}

export const AiAdvisor = ({ income, expense, currencySymbol, selectedMonth }: AiAdvisorProps) => {
  const now = new Date();
  const isCurrentMonth = 
    now.getMonth() === selectedMonth.getMonth() && 
    now.getFullYear() === selectedMonth.getFullYear();

  // If looking at past months, show summary
  if (!isCurrentMonth) {
    const saved = income - expense;
    return (
      <div className="bg-slate-800 text-white p-4 rounded-xl shadow-md border border-slate-700 mb-6 flex items-start gap-4">
         <div className="bg-slate-700 p-2 rounded-lg text-xl">📅</div>
         <div>
            <h3 className="font-bold text-sm uppercase text-slate-400 tracking-wider">Historical Insight</h3>
            <p className="text-sm mt-1">
                In {selectedMonth.toLocaleString('default', { month: 'long' })}, you {saved >= 0 ? 'saved' : 'overspent by'} <span className="font-bold text-emerald-400">{currencySymbol}{Math.abs(saved).toLocaleString()}</span>.
            </p>
         </div>
      </div>
    );
  }

  // -- Logic for Current Month --
  
  // 1. No Income Logic
  if (income === 0) {
    return (
        <div className="bg-slate-800 text-white p-4 rounded-xl shadow-md border-l-4 border-emerald-500 mb-6 animate-fade-in">
            <div className="flex items-start gap-4">
                <div className="bg-slate-700 p-2 rounded-lg text-2xl">💡</div>
                <div>
                    <h3 className="font-bold text-emerald-400">Let's set a baseline</h3>
                    <p className="text-slate-300 text-sm mt-1">
                        I can't give you smart pacing advice until you add your <b>Monthly Income</b>. 
                        Tap the <span className="text-white font-bold">"+ Income"</span> button to start.
                    </p>
                </div>
            </div>
        </div>
    );
  }

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  
  const timeProgress = currentDay / daysInMonth; // e.g. 0.5 (50% through month)
  const spendProgress = expense / income;       // e.g. 0.6 (60% of money spent)

  let status: 'good' | 'warning' | 'critical' = 'good';
  let message = '';
  let icon = '👍';
  let colorClass = 'border-emerald-500';
  let textClass = 'text-emerald-400';

  // AI Logic Rules
  if (spendProgress > timeProgress + 0.15) {
    status = 'critical';
    icon = '🚨';
    colorClass = 'border-red-500';
    textClass = 'text-red-400';
    message = `Slow down! You are ${Math.round(timeProgress * 100)}% through the month but have spent ${Math.round(spendProgress * 100)}% of your income.`;
  } else if (spendProgress > timeProgress) {
    status = 'warning';
    icon = '⚠️';
    colorClass = 'border-orange-500';
    textClass = 'text-orange-400';
    message = `Pacing Alert: Your spending is slightly ahead of schedule. Try to stick to your envelopes for the rest of the week.`;
  } else {
    status = 'good';
    icon = '✅';
    colorClass = 'border-emerald-500';
    textClass = 'text-emerald-400';
    message = `Great job! You are spending within your means. You have ${Math.round((1 - spendProgress) * 100)}% of your income left for the remaining ${daysInMonth - currentDay} days.`;
  }

  return (
    <div className={`bg-slate-800 text-white p-4 rounded-xl shadow-md border-l-4 ${colorClass} mb-6 animate-fade-in`}>
        <div className="flex items-start gap-4">
            <div className="bg-slate-700 p-2 rounded-lg text-xl">{icon}</div>
            <div>
                <h3 className={`font-bold ${textClass} flex items-center`}>
                    AI Advisor
                    {status === 'critical' && <span className="ml-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full">High Alert</span>}
                </h3>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                    {message}
                </p>
                
                {/* Visual Bar */}
                <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                        <span>Month Progress</span>
                        <span>Spending</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden relative">
                        {/* Time Marker */}
                        <div 
                            className="absolute top-0 bottom-0 w-1 bg-white z-10 opacity-50" 
                            style={{ left: `${timeProgress * 100}%` }} 
                            title="Today"
                        ></div>
                        {/* Spend Bar */}
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${status === 'critical' ? 'bg-red-500' : status === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(spendProgress * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};