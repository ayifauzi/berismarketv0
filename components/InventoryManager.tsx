
import React, { useState, useEffect } from 'react';
import { Product, UnitConversion } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Edit2, Trash2, Search, ArrowLeft, X, Save, ClipboardPen, ArrowRightLeft, Package, AlertTriangle, Filter, Check, Calculator, Upload, Link as LinkIcon, Maximize2 } from 'lucide-react';

interface InventoryManagerProps {
  branchId: string;
  branchName?: string;
  onBack?: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ branchId, branchName, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  
  // Low Stock Config (Persisted)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('inventory_low_stock_limit');
    return saved ? Number(saved) : 10;
  });
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem('inventory_low_stock_limit', lowStockThreshold.toString());
  }, [lowStockThreshold]);
  
  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Lightbox State
  const [showLightbox, setShowLightbox] = useState(false);

  // Adjustment Modal State
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjProduct, setAdjProduct] = useState<Product | null>(null);
  const [adjMode, setAdjMode] = useState<'add' | 'remove' | 'set'>('add');
  const [adjValue, setAdjValue] = useState<number>(0);
  const [adjReason, setAdjReason] = useState('New Stock In');
  const [customAdjReason, setCustomAdjReason] = useState('');

  // Form State - Product Basics
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pBaseUnit, setPBaseUnit] = useState('Pcs');
  const [pPrice, setPPrice] = useState<number>(0);
  const [pStock, setPStock] = useState<number>(0);
  const [pImage, setPImage] = useState('');

  // Form State - Conversions
  const [pConversions, setPConversions] = useState<UnitConversion[]>([]);
  const [cName, setCName] = useState('');
  const [cQty, setCQty] = useState<number>(1);
  const [cRefUnit, setCRefUnit] = useState<string>(''); // Reference unit for creating conversions
  const [cPrice, setCPrice] = useState<number>(0);
  const [editConvIdx, setEditConvIdx] = useState<number | null>(null);

  useEffect(() => {
    setProducts(StorageService.getProducts(branchId));
  }, [branchId]);

  // --- Product CRUD Handlers ---

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setPName(product.name);
      setPSku(product.sku);
      setPCategory(product.category);
      setPBaseUnit(product.baseUnit);
      setPPrice(product.basePrice);
      setPStock(product.stock);
      setPConversions(product.conversions || []);
      setCRefUnit(product.baseUnit);
      setPImage(product.image || '');
    } else {
      setEditingProduct(null);
      setPName('');
      setPSku('');
      setPCategory('');
      setPBaseUnit('Pcs');
      setCRefUnit('Pcs');
      setPPrice(0);
      setPStock(0);
      setPConversions([]);
      setPImage('');
    }
    // Reset conversion inputs
    setCName('');
    setCQty(1);
    setCPrice(0);
    setEditConvIdx(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 150000) { // 150KB limit for demo to prevent LS overflow
            alert("Image too large for demo storage (max 150KB). Please use a URL or smaller image.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setPImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: pName,
      sku: pSku,
      category: pCategory,
      branchId: branchId,
      baseUnit: pBaseUnit,
      basePrice: Number(pPrice),
      stock: Number(pStock),
      conversions: pConversions,
      image: pImage || `https://picsum.photos/200?random=${Date.now()}`
    };

    if (editingProduct) {
      StorageService.saveProduct({ ...editingProduct, ...productData });
    } else {
      const newProduct: Product = {
        id: `P-${Date.now()}`,
        ...productData,
      };
      StorageService.saveProduct(newProduct);
    }

    setProducts(StorageService.getProducts(branchId));
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this product?')) {
      StorageService.deleteProduct(id);
      setProducts(StorageService.getProducts(branchId));
    }
  };

  // --- Conversion Handlers ---

  const addConversion = () => {
    if (!cName || cQty < 1 || cPrice <= 0) {
      alert("Please enter valid details.");
      return;
    }
    
    // Check duplicate name
    const duplicate = pConversions.findIndex(c => c.name.toLowerCase() === cName.toLowerCase());
    if (duplicate !== -1 && duplicate !== editConvIdx) {
        alert("Unit name already exists.");
        return;
    }

    // Calculate Multiplier based on Reference Unit
    let multiplier = 1;
    if (cRefUnit !== pBaseUnit) {
        const ref = pConversions.find(c => c.name === cRefUnit);
        if (ref) multiplier = ref.quantity;
    }
    const finalQty = cQty * multiplier;

    const newConv = { name: cName, quantity: finalQty, price: cPrice };

    if (editConvIdx !== null) {
      // Update existing
      const updated = [...pConversions];
      updated[editConvIdx] = newConv;
      setPConversions(updated);
      setEditConvIdx(null);
    } else {
      // Add new
      setPConversions([...pConversions, newConv]);
    }

    // Reset inputs
    setCName('');
    setCQty(1);
    setCRefUnit(pBaseUnit);
    setCPrice(0);
  };

  const editConversion = (idx: number) => {
    const conv = pConversions[idx];
    setCName(conv.name);
    setCQty(conv.quantity); // When editing, we revert to Base Unit view to avoid confusion
    setCRefUnit(pBaseUnit);
    setCPrice(conv.price);
    setEditConvIdx(idx);
  };

  const removeConversion = (idx: number) => {
    setPConversions(pConversions.filter((_, i) => i !== idx));
    if (editConvIdx === idx) {
        setEditConvIdx(null);
        setCName('');
        setCQty(1);
        setCPrice(0);
    }
  };

  // --- Stock Adjustment Handlers ---

  const openAdjModal = (product: Product) => {
    setAdjProduct(product);
    setAdjMode('add');
    setAdjValue(0);
    setAdjReason('New Stock In');
    setCustomAdjReason('');
    setIsAdjModalOpen(true);
  };

  const handleAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProduct) return;

    let newStock = adjProduct.stock;
    const val = Number(adjValue);

    if (adjMode === 'add') newStock += val;
    if (adjMode === 'remove') newStock = Math.max(0, newStock - val);
    if (adjMode === 'set') newStock = Math.max(0, val);

    const finalReason = adjReason === 'Other' ? (customAdjReason || 'Unspecified Adjustment') : adjReason;

    StorageService.adjustProductStock(adjProduct.id, newStock, finalReason);
    setProducts(StorageService.getProducts(branchId));
    setIsAdjModalOpen(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search);
    if (showLowStockOnly) {
        return matchesSearch && p.stock <= lowStockThreshold;
    }
    return matchesSearch;
  });

  const lowStockCount = products.filter(p => p.stock <= lowStockThreshold).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory{branchName ? `: ${branchName}` : ''}</h2>
          <p className="text-sm text-gray-500">Manage stock levels, units, and product catalog</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                 <div className="flex items-center px-3 gap-2 border-r border-gray-300">
                    <span className="text-xs font-bold text-gray-500 uppercase">Alert Limit</span>
                    <input 
                        type="number"
                        min="0"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                        className="w-16 p-1 text-center border border-gray-300 rounded text-sm outline-none focus:border-brand-500"
                    />
                 </div>
                 <button 
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition ${
                        showLowStockOnly 
                        ? 'bg-red-100 text-red-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                 >
                    <Filter size={16} />
                    {showLowStockOnly ? 'Filtering Low Stock' : 'Filter Low Stock'}
                    {lowStockCount > 0 && !showLowStockOnly && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{lowStockCount}</span>
                    )}
                 </button>
              </div>
          </div>

          <button 
            onClick={() => openModal()}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition w-full md:w-auto justify-center"
          >
            <Plus size={20} /> Add Product
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-sm">
                <th className="pb-3 font-medium pl-2">Product Name</th>
                <th className="pb-3 font-medium">SKU</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium text-right">Price (Base)</th>
                <th className="pb-3 font-medium text-center">Stock</th>
                <th className="pb-3 font-medium text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map(product => {
                const isLowStock = product.stock <= lowStockThreshold;
                return (
                    <tr key={product.id} className={`group transition-colors border-l-4 ${isLowStock ? 'bg-red-50 border-red-500 hover:bg-red-100' : 'hover:bg-gray-50 border-transparent'}`}>
                    <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                           {product.image && (
                               <img src={product.image} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" />
                           )}
                           <div>
                                <div className="font-medium text-gray-800">{product.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    {product.baseUnit} 
                                    {product.conversions && product.conversions.length > 0 && (
                                        <span className="bg-gray-100 px-1 rounded text-[10px] text-gray-500">+{product.conversions.length} units</span>
                                    )}
                                </div>
                           </div>
                        </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{product.sku}</td>
                    <td className="py-3 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{product.category}</span>
                    </td>
                    <td className="py-3 text-sm text-right font-medium">Rp {product.basePrice.toLocaleString()}</td>
                    <td className="py-3 text-center">
                        <span title={isLowStock ? "Low Stock Warning" : "Stock Level OK"} className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {isLowStock && <AlertTriangle size={12} />}
                            {product.stock}
                        </span>
                    </td>
                    <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => openAdjModal(product)} 
                            className="p-1.5 hover:bg-orange-50 text-orange-600 rounded flex items-center gap-1 text-xs font-medium mr-2 border border-orange-100"
                            title="Adjust Stock"
                        >
                            <ClipboardPen size={14} /> Adjust
                        </button>
                        <button onClick={() => openModal(product)} className="p-1.5 hover:bg-brand-50 text-brand-600 rounded">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded">
                            <Trash2 size={16} />
                        </button>
                        </div>
                    </td>
                    </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No products found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Details with Image Upload */}
              <div className="flex gap-4 items-start">
                  <div className="space-y-2">
                     <label className="block text-sm font-medium text-gray-700">Image</label>
                     <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative group">
                        {pImage ? (
                           <>
                             <img src={pImage} alt="Product" className="w-full h-full object-cover" />
                             {/* Overlay for Zoom / Edit */}
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                 <button 
                                    type="button" 
                                    onClick={() => setShowLightbox(true)}
                                    className="p-1 bg-white/20 rounded-full text-white hover:bg-white/40 hover:scale-110 transition"
                                    title="Zoom Image"
                                 >
                                    <Maximize2 size={18} />
                                 </button>
                                 <label className="cursor-pointer text-xs text-white bg-black/40 px-2 py-0.5 rounded hover:bg-black/60">
                                    Change
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                 </label>
                             </div>
                           </>
                        ) : (
                           <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-brand-500 hover:bg-gray-50 transition">
                                <Upload size={24} className="mb-1" />
                                <span className="text-[10px]">Upload</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                           </label>
                        )}
                     </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input required type="text" value={pName} onChange={e => setPName(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. Kopi Kapal Api" />
                     </div>
                     
                     <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><LinkIcon size={12}/> Image URL (Optional)</label>
                         <input type="text" value={pImage} onChange={e => setPImage(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full p-2 border rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none" />
                     </div>
                  </div>
              </div>
                  
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input required type="text" value={pSku} onChange={e => setPSku(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input required type="text" value={pCategory} onChange={e => setPCategory(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Unit</label>
                  <select 
                    value={pBaseUnit} 
                    onChange={e => { setPBaseUnit(e.target.value); setCRefUnit(e.target.value); }} 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Box">Box</option>
                    <option value="Kg">Kg</option>
                    <option value="Bungkus">Bungkus</option>
                    <option value="Sachet">Sachet</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Rp)</label>
                  <input required type="number" min="0" value={pPrice} onChange={e => setPPrice(Number(e.target.value))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
              </div>

              {/* Unit Conversions Section */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                 <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Package size={16} className="text-brand-500" /> Unit Conversions
                 </h4>
                 
                 {/* Conversion List */}
                 <div className="space-y-2 mb-4">
                    {pConversions.map((conv, idx) => {
                        // Calculate price comparison (Discount/Premium)
                        const baseTotal = pPrice * conv.quantity;
                        const savings = baseTotal - conv.price;
                        const pct = savings > 0 ? Math.round((savings / baseTotal) * 100) : 0;
                        
                        return (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-lg text-sm border ${editConvIdx === idx ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-800">{conv.name}</span>
                                    <span className="text-gray-400">=</span>
                                    <span className="font-medium text-gray-600">{conv.quantity} {pBaseUnit}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-bold text-brand-600">Rp {conv.price.toLocaleString()}</span>
                                    {pct > 0 && (
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded-full font-medium">
                                            Save {pct}%
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => editConversion(idx)} className="text-blue-400 hover:text-blue-600 p-1.5 hover:bg-white rounded">
                                    <Edit2 size={14} />
                                </button>
                                <button type="button" onClick={() => removeConversion(idx)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-white rounded">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    )})}
                    {pConversions.length === 0 && (
                        <div className="text-center py-4 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                            No conversions defined.<br/>(e.g. 1 Karton = 12 Pcs)
                        </div>
                    )}
                 </div>

                 {/* Add/Edit Conversion Form */}
                 <div className={`p-3 rounded-lg border transition-colors ${editConvIdx !== null ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-100'}`}>
                    <label className={`block text-xs font-bold mb-2 uppercase flex items-center justify-between ${editConvIdx !== null ? 'text-blue-800' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-2">{editConvIdx !== null ? <><Edit2 size={12}/> Editing Unit</> : 'Add New Unit'}</span>
                        {editConvIdx !== null && <button type="button" onClick={() => { setEditConvIdx(null); setCName(''); setCQty(1); setCPrice(0); }} className="text-red-500 hover:underline">Cancel</button>}
                    </label>
                    <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-5 md:col-span-4">
                            <label className="block text-[10px] text-gray-400 mb-0.5">Unit Name</label>
                            <input 
                                type="text" placeholder="e.g. Karton" 
                                value={cName} onChange={e => setCName(e.target.value)}
                                className="w-full p-2 text-sm border rounded outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        </div>
                        <div className="col-span-3 md:col-span-2">
                            <label className="block text-[10px] text-gray-400 mb-0.5">Quantity</label>
                            <input 
                                type="number" placeholder="Qty" min="1"
                                value={cQty} onChange={e => setCQty(Number(e.target.value))}
                                className="w-full p-2 text-sm border rounded outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        </div>
                         {/* Reference Unit Selector - Allows '1 Karton = 10 Slop' logic */}
                        <div className="col-span-4 md:col-span-3">
                             <label className="block text-[10px] text-gray-400 mb-0.5">Relative To</label>
                             <select 
                                value={cRefUnit}
                                onChange={(e) => setCRefUnit(e.target.value)}
                                disabled={editConvIdx !== null} // Disable ref change on edit to simplify logic
                                className="w-full p-2 text-sm border rounded outline-none focus:ring-1 focus:ring-brand-500 bg-white disabled:bg-gray-100"
                             >
                                 <option value={pBaseUnit}>{pBaseUnit} (Base)</option>
                                 {pConversions.map((c, i) => (
                                     // Don't show self if editing, but we disabled editing anyway
                                     <option key={i} value={c.name}>{c.name}</option>
                                 ))}
                             </select>
                        </div>
                        <div className="col-span-8 md:col-span-3">
                            <label className="block text-[10px] text-gray-400 mb-0.5">Price</label>
                            <input 
                                type="number" placeholder="Rp" min="0"
                                value={cPrice} onChange={e => setCPrice(Number(e.target.value))}
                                className="w-full p-2 text-sm border rounded outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        </div>
                        <div className="col-span-4 md:col-span-12 flex items-end">
                            <button 
                                type="button" 
                                onClick={addConversion}
                                className={`w-full py-2 text-white rounded flex items-center justify-center transition-colors ${editConvIdx !== null ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-600 hover:bg-brand-700'}`}
                                title={editConvIdx !== null ? "Update Conversion" : "Add Conversion"}
                            >
                                {editConvIdx !== null ? <Check size={16} /> : <Plus size={16} />} 
                                <span className="md:hidden ml-1">{editConvIdx !== null ? 'Update' : 'Add'}</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Helper text for calculation */}
                    {cRefUnit !== pBaseUnit && cQty > 0 && (
                         <div className="mt-2 text-[10px] text-blue-600 flex items-center gap-1">
                             <Calculator size={10} />
                             <span>Calculation: 1 {cName || 'New Unit'} = {cQty} x {cRefUnit} = <strong>{(() => {
                                 const ref = pConversions.find(c => c.name === cRefUnit);
                                 return ref ? cQty * ref.quantity : cQty;
                             })()} {pBaseUnit}</strong></span>
                         </div>
                    )}
                 </div>
              </div>

              {/* Stock Input (New Only) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-1">Current Stock Level ({pBaseUnit})</label>
                <input 
                  required 
                  type="number" 
                  min="0" 
                  value={pStock} 
                  onChange={e => setPStock(Number(e.target.value))} 
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none text-lg font-bold text-gray-800" 
                />
                <p className="text-xs text-gray-500 mt-1">
                    {editingProduct ? 'Note: Use "Adjust Stock" on dashboard for audit logs.' : 'Initial stock count.'}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center gap-2">
                    <Save size={18} /> Save Product
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLightbox(false)}>
           <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
              <img src={pImage} alt="Product Zoom" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              <button 
                onClick={() => setShowLightbox(false)}
                className="absolute top-0 right-0 m-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
              >
                 <X size={24} />
              </button>
           </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjModalOpen && adjProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-xl font-bold text-gray-800">Adjust Stock</h3>
                  <p className="text-sm text-gray-500">{adjProduct.name}</p>
               </div>
               <button onClick={() => setIsAdjModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleAdjSubmit} className="space-y-4">
              <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                {(['add', 'remove', 'set'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAdjMode(m)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors ${adjMode === m ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {m} Stock
                  </button>
                ))}
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                 <span className="block text-xs text-gray-500 uppercase tracking-wide">Current Stock</span>
                 <span className="text-3xl font-bold text-gray-800">{adjProduct.stock} <span className="text-sm font-normal text-gray-500">{adjProduct.baseUnit}</span></span>
              </div>

              <div className="flex items-center gap-4">
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                       {adjMode === 'set' ? 'New Total Stock' : 'Quantity to ' + adjMode}
                    </label>
                    <input 
                      autoFocus
                      required
                      type="number"
                      min="0"
                      value={adjValue}
                      onChange={(e) => setAdjValue(Number(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-xl font-bold"
                    />
                 </div>
                 <div className="pt-6 text-gray-400">
                    <ArrowRightLeft />
                 </div>
                 <div className="flex-1 text-center opacity-70">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Resulting Stock</label>
                    <div className="text-xl font-bold text-gray-800">
                       {adjMode === 'add' ? adjProduct.stock + Number(adjValue) : 
                        adjMode === 'remove' ? Math.max(0, adjProduct.stock - Number(adjValue)) :
                        Number(adjValue)}
                    </div>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Adjustment</label>
                <div className="space-y-2">
                    <select 
                        value={adjReason}
                        onChange={(e) => setAdjReason(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                    >
                        <option value="New Stock In">New Stock In</option>
                        <option value="Damaged Goods">Damaged Goods</option>
                        <option value="Expired">Expired</option>
                        <option value="Stocktake Correction">Stocktake Correction</option>
                        <option value="Internal Use">Internal Use</option>
                        <option value="Other">Other...</option>
                    </select>
                    {adjReason === 'Other' && (
                        <input 
                            type="text" 
                            placeholder="Enter specific reason..."
                            required
                            value={customAdjReason}
                            onChange={(e) => setCustomAdjReason(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                    )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <button type="button" onClick={() => setIsAdjModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center gap-2">
                    <Save size={18} /> Confirm Adjustment
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
