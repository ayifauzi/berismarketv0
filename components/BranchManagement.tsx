
import React, { useState, useEffect, useRef } from 'react';
import { Branch } from '../types';
import { StorageService } from '../services/storage';
import { findPlaceWithAI } from '../services/geminiService';
import { InventoryManager } from './InventoryManager';
import { Plus, Edit2, Trash2, MapPin, Store, Navigation, Globe, Package, X, Sparkles, Loader } from 'lucide-react';
import L from 'leaflet';

export const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  // Inventory State
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Map State & Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [previewBranch, setPreviewBranch] = useState<Branch | null>(null);

  // Branch Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  // AI Search State
  const [aiQuery, setAiQuery] = useState('');
  const [isSearchingAi, setIsSearchingAi] = useState(false);

  useEffect(() => {
    setBranches(StorageService.getBranches());
  }, []);

  // Initialize Map
  useEffect(() => {
    // Only initialize map if we are NOT in inventory view
    if (selectedBranch) return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([-6.2088, 106.8456], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    // Update Markers
    const map = mapInstanceRef.current;
    
    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    const bounds = L.latLngBounds([]);

    branches.forEach(branch => {
      if (branch.latitude && branch.longitude) {
        // Create custom marker logic
        const marker = L.marker([branch.latitude, branch.longitude])
          .addTo(map);

        // Add Click Listener
        marker.on('click', () => {
          setPreviewBranch(branch);
          // Center map on click slightly offset to show popup better
          map.flyTo([branch.latitude, branch.longitude], 15, { duration: 1 });
        });

        markersRef.current.push(marker);
        bounds.extend([branch.latitude, branch.longitude]);
      }
    });

    if (markersRef.current.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Invalidate size to ensure map renders correctly if container resized
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

  }, [branches, selectedBranch]);

  // --- AI Location Search ---
  const handleAiSearch = async () => {
    if (!aiQuery) return;
    setIsSearchingAi(true);
    const result = await findPlaceWithAI(aiQuery);
    setIsSearchingAi(false);

    if (result.lat && result.lng) {
        setLat(result.lat.toString());
        setLng(result.lng.toString());
        if (result.address) {
            setStreet(result.address);
            // Basic parsing attempt for city/state if comma separated
            const parts = result.address.split(',');
            if (parts.length > 1) setCity(parts[parts.length - 2].trim());
        }
    } else {
        alert("Could not find specific coordinates. Please try a more specific location name.");
    }
  };

  // --- Branch Handlers ---

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const branchData = {
      name,
      location,
      street,
      city,
      state,
      zipCode,
      latitude: parseFloat(lat) || 0,
      longitude: parseFloat(lng) || 0
    };

    if (editingBranch) {
        // Update
        const updated = { ...editingBranch, ...branchData };
        StorageService.updateBranch(updated);
        setBranches(StorageService.getBranches());
    } else {
        // Add
        const newBranch: Branch = {
            id: `B-${Date.now()}`,
            ...branchData
        };
        StorageService.addBranch(newBranch);
        setBranches(StorageService.getBranches());
    }
    closeBranchModal();
  };

  const openAddBranchModal = () => {
    setEditingBranch(null);
    resetBranchForm();
    setAiQuery('');
    setIsModalOpen(true);
  };

  const openEditBranchModal = (branch: Branch) => {
    setEditingBranch(branch);
    setName(branch.name);
    setLocation(branch.location);
    setStreet(branch.street || '');
    setCity(branch.city || '');
    setState(branch.state || '');
    setZipCode(branch.zipCode || '');
    setLat(branch.latitude?.toString() || '');
    setLng(branch.longitude?.toString() || '');
    setAiQuery('');
    setIsModalOpen(true);
    setPreviewBranch(null); // Close preview if open
  };

  const resetBranchForm = () => {
    setName('');
    setLocation('');
    setStreet('');
    setCity('');
    setState('');
    setZipCode('');
    setLat('');
    setLng('');
  };

  const handleDeleteBranch = (id: string) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
        StorageService.deleteBranch(id);
        setBranches(StorageService.getBranches());
        setPreviewBranch(null);
    }
  };

  const closeBranchModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  }

  // --- Inventory Handlers ---

  const handleManageStock = (branch: Branch) => {
    setSelectedBranch(branch);
    setPreviewBranch(null);
  };

  const closeInventory = () => {
    setSelectedBranch(null);
  };

  // --- Render Views ---

  if (selectedBranch) {
    return (
      <InventoryManager 
        branchId={selectedBranch.id} 
        branchName={selectedBranch.name} 
        onBack={closeInventory} 
      />
    );
  }

  // --- Main Branch Management View ---

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Branch Management</h2>
          <p className="text-sm text-gray-500">Manage store locations, addresses, and view map distribution.</p>
        </div>
        <button 
          onClick={openAddBranchModal}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition shadow-sm"
        >
          <Plus size={20} /> Add Branch
        </button>
      </div>

      {/* Map Section */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-hidden h-96 relative z-0">
         <div ref={mapContainerRef} className="w-full h-full rounded-lg relative" />
         
         {/* Map Preview Card */}
         {previewBranch && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white p-4 rounded-xl shadow-lg z-[1000] animate-in slide-in-from-bottom-2 border border-gray-200">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-lg text-gray-800">{previewBranch.name}</h3>
                 <button onClick={() => setPreviewBranch(null)} className="text-gray-400 hover:text-gray-600">
                   <X size={18} />
                 </button>
               </div>
               <p className="text-sm text-gray-600 mb-4">{previewBranch.street}, {previewBranch.city}</p>
               <div className="flex gap-2">
                  <button 
                    onClick={() => openEditBranchModal(previewBranch)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex justify-center items-center gap-1"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleManageStock(previewBranch)}
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium flex justify-center items-center gap-1"
                  >
                    <Package size={14} /> Stock
                  </button>
               </div>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
                <Store size={24} />
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openEditBranchModal(branch)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteBranch(branch.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg text-gray-800 mb-1">{branch.name}</h3>
            
            <div className="mt-2 space-y-2">
              <div className="flex items-center text-gray-600 text-sm">
                <Navigation size={14} className="mr-2 text-brand-400 shrink-0" />
                <span className="font-medium">{branch.location}</span>
              </div>
              
              <div className="flex items-start text-gray-500 text-sm pl-6 border-l-2 border-gray-100 ml-1.5 py-1">
                <p>
                  {branch.street}<br/>
                  {branch.city}, {branch.state} {branch.zipCode}
                </p>
              </div>
            </div>

            <button 
              onClick={() => handleManageStock(branch)}
              className="mt-4 w-full py-2 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-200 transition text-sm font-medium"
            >
              <Package size={16} /> Manage Stock
            </button>

            <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center mt-4">
              <div className="flex items-center text-xs text-gray-400 font-mono gap-1">
                 <Globe size={12} />
                 {branch.latitude?.toFixed(4)}, {branch.longitude?.toFixed(4)}
              </div>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 border-b pb-4">
              {editingBranch ? 'Edit Branch Details' : 'Register New Branch'}
            </h3>
            
            {/* AI Auto-fill Section */}
            {!editingBranch && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-2">
                  <Sparkles size={14} /> AI Auto-Fill with Google Maps
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="e.g. Monas Jakarta, Tunjungan Plaza Surabaya..."
                    className="flex-1 p-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAiSearch(); } }}
                  />
                  <button 
                    type="button"
                    onClick={handleAiSearch}
                    disabled={isSearchingAi || !aiQuery}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSearchingAi ? <Loader size={16} className="animate-spin" /> : 'Search'}
                  </button>
                </div>
                <p className="text-[10px] text-blue-600 mt-2">
                  Uses Gemini & Google Maps to find address and coordinates automatically.
                </p>
              </div>
            )}

            <form onSubmit={handleBranchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="e.g. Cabang Surabaya"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region / Area Label</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      required
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="e.g. Surabaya Timur"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                    <textarea 
                      required
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="Full street address..."
                      rows={2}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input 
                    type="text" 
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                  <input 
                    type="text" 
                    required
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input 
                    type="text" 
                    required
                    value={zipCode}
                    onChange={e => setZipCode(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="Post Code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input 
                    type="number" 
                    step="any"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="-6.2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input 
                    type="number" 
                    step="any"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="106.8000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button 
                  type="button" 
                  onClick={closeBranchModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-medium shadow-sm"
                >
                  {editingBranch ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
