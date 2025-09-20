import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BalanceSheet, ProfitLoss, StockReport, PartnerLedger } from '../types';

// Company information
const COMPANY_INFO = {
  name: 'Shiv Furniture',
  address: 'Business Address, City, State - PIN',
  phone: '+91 XXXXX XXXXX',
  email: 'info@shivfurniture.com'
};

export const exportBalanceSheetToPDF = (balanceSheet: BalanceSheet, asOfDate: string) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(COMPANY_INFO.name, 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('BALANCE SHEET', 105, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`As of ${new Date(asOfDate).toLocaleDateString()}`, 105, 40, { align: 'center' });
  
  let yPosition = 60;
  
  // Assets Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('ASSETS', 20, yPosition);
  yPosition += 10;
  
  // Current Assets
  doc.setFontSize(12);
  doc.text('Current Assets:', 25, yPosition);
  yPosition += 5;
  
  balanceSheet.assets.currentAssets.forEach(asset => {
    doc.setFont(undefined, 'normal');
    doc.text(`  ${asset.name}`, 30, yPosition);
    doc.text(`₹${asset.balance.toLocaleString()}`, 150, yPosition, { align: 'right' });
    yPosition += 5;
  });
  
  doc.setFont(undefined, 'bold');
  doc.text('Total Current Assets:', 30, yPosition);
  doc.text(`₹${balanceSheet.assets.totalCurrentAssets.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 10;
  
  // Fixed Assets
  doc.text('Fixed Assets:', 25, yPosition);
  yPosition += 5;
  
  balanceSheet.assets.fixedAssets.forEach(asset => {
    doc.setFont(undefined, 'normal');
    doc.text(`  ${asset.name}`, 30, yPosition);
    doc.text(`₹${asset.balance.toLocaleString()}`, 150, yPosition, { align: 'right' });
    yPosition += 5;
  });
  
  doc.setFont(undefined, 'bold');
  doc.text('Total Fixed Assets:', 30, yPosition);
  doc.text(`₹${balanceSheet.assets.totalFixedAssets.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 5;
  
  doc.text('TOTAL ASSETS:', 25, yPosition);
  doc.text(`₹${balanceSheet.assets.totalAssets.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 20;
  
  // Liabilities & Equity Section
  doc.text('LIABILITIES & EQUITY', 20, yPosition);
  yPosition += 10;
  
  // Current Liabilities
  doc.text('Current Liabilities:', 25, yPosition);
  yPosition += 5;
  
  balanceSheet.liabilities.currentLiabilities.forEach(liability => {
    doc.setFont(undefined, 'normal');
    doc.text(`  ${liability.name}`, 30, yPosition);
    doc.text(`₹${liability.balance.toLocaleString()}`, 150, yPosition, { align: 'right' });
    yPosition += 5;
  });
  
  doc.setFont(undefined, 'bold');
  doc.text('Total Current Liabilities:', 30, yPosition);
  doc.text(`₹${balanceSheet.liabilities.totalCurrentLiabilities.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 10;
  
  // Equity
  doc.text('Equity:', 25, yPosition);
  yPosition += 5;
  
  balanceSheet.equity.accounts.forEach(equity => {
    doc.setFont(undefined, 'normal');
    doc.text(`  ${equity.name}`, 30, yPosition);
    doc.text(`₹${equity.balance.toLocaleString()}`, 150, yPosition, { align: 'right' });
    yPosition += 5;
  });
  
  doc.setFont(undefined, 'bold');
  doc.text('Total Equity:', 30, yPosition);
  doc.text(`₹${balanceSheet.equity.totalEquity.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 5;
  
  doc.text('TOTAL LIABILITIES & EQUITY:', 25, yPosition);
  doc.text(`₹${balanceSheet.totalLiabilitiesAndEquity.toLocaleString()}`, 150, yPosition, { align: 'right' });
  
  // Save the PDF
  doc.save(`Balance_Sheet_${asOfDate}.pdf`);
};

export const exportProfitLossToPDF = (profitLoss: ProfitLoss, fromDate: string, toDate: string) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(COMPANY_INFO.name, 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('PROFIT & LOSS STATEMENT', 105, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`From ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`, 105, 40, { align: 'center' });
  
  let yPosition = 60;
  
  // Income Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('INCOME', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Sales Income', 25, yPosition);
  doc.text(`₹${profitLoss.income.sales.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 5;
  
  doc.text('Other Income', 25, yPosition);
  doc.text(`₹${profitLoss.income.otherIncome.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 5;
  
  doc.setFont(undefined, 'bold');
  doc.text('Total Income', 25, yPosition);
  doc.text(`₹${profitLoss.income.totalIncome.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 15;
  
  // Expenses Section
  doc.text('EXPENSES', 20, yPosition);
  yPosition += 10;
  
  doc.setFont(undefined, 'normal');
  doc.text('Purchases', 25, yPosition);
  doc.text(`₹${profitLoss.expenses.purchases.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 5;
  
  doc.text('Operating Expenses', 25, yPosition);
  doc.text(`₹${profitLoss.expenses.operatingExpenses.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 5;
  
  doc.text('Other Expenses', 25, yPosition);
  doc.text(`₹${profitLoss.expenses.otherExpenses.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 5;
  
  doc.setFont(undefined, 'bold');
  doc.text('Total Expenses', 25, yPosition);
  doc.text(`₹${profitLoss.expenses.totalExpenses.toLocaleString()}`, 150, yPosition, { align: 'right' });
  yPosition += 15;
  
  // Net Profit/Loss
  doc.setFontSize(14);
  doc.text('NET PROFIT/LOSS', 25, yPosition);
  doc.text(`₹${profitLoss.netProfit.toLocaleString()}`, 150, yPosition, { align: 'right' });
  
  // Save the PDF
  doc.save(`Profit_Loss_${fromDate}_to_${toDate}.pdf`);
};

export const exportStockReportToPDF = (stockReport: StockReport[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(COMPANY_INFO.name, 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('STOCK REPORT', 105, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`As of ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });
  
  // Prepare table data
  const tableData = stockReport.map(item => [
    item.product.name,
    item.product.category,
    item.openingStock.toString(),
    item.purchases.toString(),
    item.sales.toString(),
    item.closingStock.toString(),
    `₹${item.product.purchasePrice.toLocaleString()}`,
    `₹${item.value.toLocaleString()}`
  ]);
  
  // Create table
  autoTable(doc, {
    head: [['Product', 'Category', 'Opening', 'Purchases', 'Sales', 'Closing', 'Unit Price', 'Value']],
    body: tableData,
    startY: 50,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] }
  });
  
  // Save the PDF
  doc.save(`Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportPartnerLedgerToPDF = (ledger: PartnerLedger, fromDate: string, toDate: string) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(COMPANY_INFO.name, 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('PARTNER LEDGER', 105, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`${ledger.contact.name} - ${ledger.contact.type}`, 105, 40, { align: 'center' });
  doc.text(`From ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`, 105, 50, { align: 'center' });
  
  // Opening Balance
  doc.setFontSize(10);
  doc.text(`Opening Balance: ₹${ledger.openingBalance.toLocaleString()}`, 20, 65);
  
  // Prepare table data
  const tableData = ledger.transactions.map(transaction => [
    new Date(transaction.date).toLocaleDateString(),
    transaction.description,
    transaction.reference || '-',
    `₹${transaction.debit.toLocaleString()}`,
    `₹${transaction.credit.toLocaleString()}`,
    `₹${transaction.balance.toLocaleString()}`
  ]);
  
  // Create table
  autoTable(doc, {
    head: [['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Balance']],
    body: tableData,
    startY: 75,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] }
  });
  
  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total Debit: ₹${ledger.totalDebit.toLocaleString()}`, 20, finalY);
  doc.text(`Total Credit: ₹${ledger.totalCredit.toLocaleString()}`, 70, finalY);
  doc.text(`Closing Balance: ₹${ledger.closingBalance.toLocaleString()}`, 130, finalY);
  
  // Save the PDF
  doc.save(`Partner_Ledger_${ledger.contact.name}_${fromDate}_to_${toDate}.pdf`);
};

// Excel export utility (using CSV format for simplicity)
export const exportToCSV = (data: any[], filename: string, headers: string[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
