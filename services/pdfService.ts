
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Envelope, CurrencyCode } from '../types';
import { CURRENCIES } from '../constants';

export const generateFinancialReport = (
  transactions: Transaction[],
  envelopes: Envelope[], // Note: envelopes passed here are usually current month's. For yearly reports, we might just show totals.
  homeCurrency: CurrencyCode = 'USD',
  period: 'month' | 'quarter' | 'year' = 'month',
  referenceDate: Date = new Date()
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const currencySymbol = CURRENCIES.find(c => c.code === homeCurrency)?.symbol || '$';

  const formatCurrency = (amount: number) => `${currencySymbol}${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

  // Calculate Totals based on the passed transactions
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.normalizedTotal, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.normalizedTotal, 0);

  const netSavings = totalIncome - totalExpense;

  // -- Header --
  doc.setFillColor(16, 185, 129); 
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('HomeEcon Financial Report', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Period: ${period.toUpperCase()} ending ${referenceDate.toLocaleDateString()}`, 14, 26);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, 20);

  // -- Executive Summary --
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('Executive Summary', 14, 45);

  const startY = 50;
  const cardWidth = (pageWidth - 42) / 3;
  const cardHeight = 25;

  // Income
  doc.setFillColor(236, 253, 245); // Green 50
  doc.roundedRect(14, startY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('TOTAL INCOME', 19, startY + 8);
  doc.setFontSize(12);
  doc.setTextColor(4, 120, 87);
  doc.text(formatCurrency(totalIncome), 19, startY + 18);

  // Expense
  doc.setFillColor(254, 242, 242); // Red 50
  doc.roundedRect(14 + cardWidth + 7, startY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(220, 38, 38);
  doc.text('TOTAL EXPENSE', 19 + cardWidth + 7, startY + 8);
  doc.setFontSize(12);
  doc.setTextColor(185, 28, 28);
  doc.text(formatCurrency(totalExpense), 19 + cardWidth + 7, startY + 18);

  // Net
  const netColorBg = netSavings >= 0 ? [239, 246, 255] : [255, 247, 237]; // Blue or Orange
  doc.setFillColor(netColorBg[0], netColorBg[1], netColorBg[2]);
  doc.roundedRect(14 + (cardWidth + 7) * 2, startY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(netSavings >= 0 ? 37 : 194, netSavings >= 0 ? 99 : 65, netSavings >= 0 ? 235 : 12); 
  doc.text('NET SAVINGS', 19 + (cardWidth + 7) * 2, startY + 8);
  doc.setFontSize(12);
  doc.text(formatCurrency(netSavings), 19 + (cardWidth + 7) * 2, startY + 18);

  // -- Transactions Table --
  const transY = startY + cardHeight + 15;
  
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Transaction History', 14, transY);

  // Sort by date desc
  const sortedTrans = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const transactionData = sortedTrans.map(t => [
    t.date,
    t.type === 'income' ? `+ ${t.merchantName}` : t.merchantName,
    t.currency,
    t.total.toFixed(2),
    formatCurrency(t.normalizedTotal)
  ]);

  autoTable(doc, {
    startY: transY + 5,
    head: [['Date', 'Description', 'Curr', 'Original', `Home (${homeCurrency})`]],
    body: transactionData,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', lineWidth: 0 },
    bodyStyles: { textColor: [51, 65, 85] },
    columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
    },
    didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
            const originalRow = sortedTrans[data.row.index];
            if (originalRow.type === 'income') {
                data.cell.styles.textColor = [22, 163, 74]; // Green
            }
        }
    }
  });

  doc.save(`HomeEcon_Report_${period}_${referenceDate.toISOString().split('T')[0]}.pdf`);
};
