import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, CURRENT_USER, Transaction, AppConfig } from '../types';
import { StorageService } from '../services/storage';
import { Search, Plus, Minus, Trash2, Printer, CreditCard, ShoppingCart, Banknote, QrCode, X, CheckCircle, Calculator, FileDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>({ appName: 'OmniMarket', appLogo: '' });

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);

  useEffect(() => {
    // Load products for current branch
    setProducts(StorageService.getProducts(CURRENT_USER.branchId));
    // Load App Config for receipt branding
    setAppConfig(StorageService.getAppConfig());
  }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id && item.selectedUnit === product.baseUnit);
    if (existing) {
      updateQty(existing, 1);
    } else {
      setCart([...cart, {
        ...product,
        selectedUnit: product.baseUnit,
        qty: 1,
        unitPrice: product.basePrice,
        subtotal: product.basePrice
      }]);
    }
  };

  const updateQty = (item: CartItem, delta: number) => {
    const newCart = cart.map(c => {
      if (c === item) {
        const newQty = Math.max(1, c.qty + delta);
        return { ...c, qty: newQty, subtotal: newQty * c.unitPrice };
      }
      return c;
    });
    setCart(newCart);
  };

  const changeUnit = (item: CartItem, unitName: string) => {
    let newPrice = item.basePrice;
    if (unitName !== item.baseUnit) {
      const conv = item.conversions.find(c => c.name === unitName);
      if (conv) newPrice = conv.price;
    }

    setCart(cart.map(c => {
      if (c === item) {
        return { ...c, selectedUnit: unitName, unitPrice: newPrice, subtotal: c.qty * newPrice };
      }
      return c;
    }));
  };

  const removeFromCart = (item: CartItem) => {
    setCart(cart.filter(c => c !== item));
  };

  const grandTotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
  const changeAmount = Math.max(0, cashReceived - grandTotal);
  const isPaymentValid = paymentMethod === 'QRIS' || (paymentMethod === 'CASH' && cashReceived >= grandTotal);

  const openPaymentModal = () => {
    if (cart.length === 0) return;
    setPaymentMethod('CASH');
    setCashReceived(0);
    setIsPaymentModalOpen(true);
  };

  const handleFinalizePayment = () => {
    if (!isPaymentValid) return;

    const tx: Transaction = {
      id: `TX-${Date.now()}`,
      branchId: CURRENT_USER.branchId,
      date: new Date().toISOString(),
      items: [...cart],
      total: grandTotal,
      cashierName: CURRENT_USER.name,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod === 'CASH' ? cashReceived : undefined,
      change: paymentMethod === 'CASH' ? changeAmount : undefined
    };

    StorageService.addTransaction(tx);
    setReceipt(tx);
    setCart([]);
    setIsPaymentModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('receipt-content');
    if (!element) return;

    try {
      // Use html2canvas to capture the receipt element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions to match the receipt aspect ratio
      // Assuming a standard thermal paper width of 80mm
      const pdfWidth = 80; 
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${receipt?.id || 'transaction'}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm));
  }, [products, searchTerm]);

  // --- Receipt View ---
  if (receipt) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in fade-in zoom-in duration-300">
        
        {/* Printable Receipt Container */}
        <div id="receipt-content" className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full border border-gray-200 relative overflow-hidden">
          {/* Receipt jagged edge effect (simulated) - Hidden on print */}
          <div className="absolute top-0 left-0 w-full h-2 bg-brand-600 no-print" data-html2canvas-ignore="true"></div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{appConfig.appName}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{CURRENT_USER.branchId}</p>
            <p className="text-sm text-gray-500 mt-2 font-mono">{receipt.id}</p>
            <p className="text-sm text-gray-500">{new Date(receipt.date).toLocaleString()}</p>
          </div>
          
          <div className="border-t border-b border-dashed border-gray-300 py-4 space-y-2 mb-4">
            {receipt.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name} <span className="text-xs text-gray-400">x{item.qty} {item.selectedUnit}</span></span>
                <span className="font-medium">Rp {item.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
             <div className="flex justify-between text-lg font-bold text-gray-800">
               <span>Total</span>
               <span>Rp {receipt.total.toLocaleString()}</span>
             </div>
             
             <div className="flex justify-between text-sm text-gray-600">
               <span>Payment Method</span>
               <span className="font-medium">{receipt.paymentMethod}</span>
             </div>

             {receipt.paymentMethod === 'CASH' && (
               <>
                 <div className="flex justify-between text-sm text-gray-600">
                   <span>Cash Received</span>
                   <span>Rp {receipt.cashReceived?.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-sm font-bold text-green-600 border-t border-gray-100 pt-2 mt-2">
                   <span>Change</span>
                   <span>Rp {receipt.change?.toLocaleString()}</span>
                 </div>
               </>
             )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">Thank you for shopping with us!</p>
            
            {/* Buttons - Hidden from print and html2canvas */}
            <div className="flex justify-center gap-2 mt-6 no-print" data-html2canvas-ignore="true">
               <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-medium px-4 py-2 border border-brand-200 rounded-full hover:bg-brand-50 transition"
               >
                  <Printer size={16} /> Print
               </button>
               <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-medium px-4 py-2 border border-brand-200 rounded-full hover:bg-brand-50 transition"
               >
                  <FileDown size={16} /> PDF
               </button>
            </div>
          </div>
        </div>
        
        {/* Navigation Button - Hidden on print */}
        <button 
          onClick={() => setReceipt(null)} 
          className="no-print bg-brand-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-700 transition shadow-lg flex items-center gap-2"
        >
          <Plus size={20} /> New Transaction
        </button>
      </div>
    );
  }

  // --- Main POS View ---
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-4">
      {/* Product Grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm p-4 flex flex-col">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search product name or SKU..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-2">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-brand-500 transition-all hover:shadow-md bg-white flex flex-col group"
            >
              <div className="h-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden relative">
                <img src={product.image} alt={product.name} className="object-cover h-full w-full" />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Plus className="bg-white rounded-full p-1 shadow-sm" />
                </div>
              </div>
              <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
              <div className="mt-auto flex justify-between items-center">
                 <span className="font-bold text-brand-600">Rp {product.basePrice.toLocaleString()}</span>
                 <span className={`text-[10px] px-1 rounded ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    Stock: {product.stock}
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg flex flex-col border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart size={20} /> Current Order
          </h2>
          {cart.length > 0 && (
             <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-1 rounded-full">{cart.reduce((a,c) => a+c.qty,0)} Items</span>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 flex flex-col items-center">
                <ShoppingCart size={48} className="opacity-20 mb-2" />
                <p>Cart is empty</p>
                <p className="text-xs">Select items to begin</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="flex flex-col border-b border-gray-50 pb-3 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm text-gray-800">{item.name}</span>
                  <button onClick={() => removeFromCart(item)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <select 
                    value={item.selectedUnit}
                    onChange={(e) => changeUnit(item, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-1 py-1 bg-white outline-none cursor-pointer hover:border-brand-300 focus:border-brand-500"
                  >
                    <option value={item.baseUnit}>{item.baseUnit}</option>
                    {item.conversions.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
                    <button onClick={() => updateQty(item, -1)} className="p-1 rounded bg-white shadow-sm hover:text-brand-600"><Minus size={12} /></button>
                    <span className="text-sm w-6 text-center font-medium">{item.qty}</span>
                    <button onClick={() => updateQty(item, 1)} className="p-1 rounded bg-white shadow-sm hover:text-brand-600"><Plus size={12} /></button>
                  </div>
                  
                  <span className="font-semibold text-sm">Rp {item.subtotal.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
          <div className="flex justify-between mb-4 text-lg font-bold text-gray-800">
            <span>Total</span>
            <span>Rp {grandTotal.toLocaleString()}</span>
          </div>
          <button 
            onClick={openPaymentModal}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 text-white transition-all transform active:scale-[0.98]
              ${cart.length > 0 ? 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-200' : 'bg-gray-300 cursor-not-allowed'}
            `}
          >
            <CreditCard size={20} /> Pay Now
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <CreditCard className="text-brand-500" /> Payment
                    </h3>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Amount Display */}
                    <div className="text-center mb-8">
                        <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Total Amount</p>
                        <h2 className="text-4xl font-extrabold text-gray-900">Rp {grandTotal.toLocaleString()}</h2>
                    </div>

                    {/* Method Selector */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button 
                            onClick={() => setPaymentMethod('CASH')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}
                        >
                            <Banknote size={32} />
                            <span className="font-bold">Tunai (Cash)</span>
                        </button>
                        <button 
                            onClick={() => setPaymentMethod('QRIS')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'QRIS' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}
                        >
                            <QrCode size={32} />
                            <span className="font-bold">QRIS</span>
                        </button>
                    </div>

                    {/* Dynamic Content based on Method */}
                    {paymentMethod === 'CASH' ? (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cash Received</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-4 text-gray-400 font-bold">Rp</span>
                                    <input 
                                        type="number" 
                                        autoFocus
                                        value={cashReceived === 0 ? '' : cashReceived}
                                        onChange={(e) => setCashReceived(Number(e.target.value))}
                                        className="w-full pl-12 pr-4 py-3 text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:ring-0 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                             </div>

                             {/* Quick Money Buttons */}
                             <div className="flex gap-2 overflow-x-auto pb-2">
                                <button onClick={() => setCashReceived(grandTotal)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold whitespace-nowrap text-gray-600">Uang Pas</button>
                                <button onClick={() => setCashReceived(10000)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold whitespace-nowrap text-gray-600">10k</button>
                                <button onClick={() => setCashReceived(20000)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold whitespace-nowrap text-gray-600">20k</button>
                                <button onClick={() => setCashReceived(50000)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold whitespace-nowrap text-gray-600">50k</button>
                                <button onClick={() => setCashReceived(100000)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold whitespace-nowrap text-gray-600">100k</button>
                             </div>
                             
                             <div className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                                 <span className="text-gray-500 font-medium flex items-center gap-2"><Calculator size={16}/> Change</span>
                                 <span className={`text-xl font-bold ${changeAmount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    Rp {changeAmount.toLocaleString()}
                                 </span>
                             </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                             <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appConfig.appName)}-POS-TX-${Date.now()}`} 
                                    alt="QRIS Code" 
                                    className="w-48 h-48 object-contain"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-1 rounded-full border-2 border-white">
                                    <QrCode size={16} />
                                </div>
                             </div>
                             <div className="text-center space-y-1">
                                <p className="text-sm font-bold text-gray-800">Scan QRIS to Pay</p>
                                <p className="text-xs text-gray-500">Waiting for payment confirmation...</p>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button 
                        onClick={handleFinalizePayment}
                        disabled={!isPaymentValid}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                            ${isPaymentValid 
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        <CheckCircle size={24} />
                        Confirm Payment
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};