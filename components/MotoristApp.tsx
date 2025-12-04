import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { CURRENT_USER, MotoristVisit } from '../types';
import { MapPin, Camera, Navigation, Send, CheckCircle } from 'lucide-react';
import L from 'leaflet';

export const MotoristApp: React.FC = () => {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [shopName, setShopName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
        },
        (error) => console.error(error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    if (location && mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([location.lat, location.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap.current);
      
      // Add custom marker icon logic here if needed, keeping it simple for now
    }
    
    if (location && leafletMap.current) {
        // Clear previous markers (simplified)
        leafletMap.current.eachLayer((layer) => {
            if (layer instanceof L.Marker) leafletMap.current?.removeLayer(layer);
        });
        
        L.marker([location.lat, location.lng]).addTo(leafletMap.current)
          .bindPopup("You are here").openPopup();
        leafletMap.current.setView([location.lat, location.lng]);
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !shopName) return;

    setIsSubmitting(true);
    const visit: MotoristVisit = {
      id: `V-${Date.now()}`,
      motoristName: CURRENT_USER.name,
      shopName,
      timestamp: new Date().toISOString(),
      latitude: location.lat,
      longitude: location.lng,
      notes
    };

    setTimeout(() => { // Simulate network delay
      StorageService.addVisit(visit);
      setIsSubmitting(false);
      setSuccess(true);
      setShopName('');
      setNotes('');
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Navigation className="animate-bounce mb-4 text-brand-500" size={48} />
        <p>Acquiring GPS Signal...</p>
        <p className="text-xs mt-2">Please allow location access</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] -m-4 md:m-0">
      {/* Map View */}
      <div className="h-1/2 w-full relative bg-gray-100">
        <div ref={mapRef} className="h-full w-full z-0" />
        <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-md z-[400] text-xs">
          <p className="font-bold text-gray-700">Lat: {location.lat.toFixed(5)}</p>
          <p className="font-bold text-gray-700">Lng: {location.lng.toFixed(5)}</p>
        </div>
      </div>

      {/* Action Sheet */}
      <div className="h-1/2 bg-white rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] -mt-4 z-[500] p-6 relative flex flex-col overflow-y-auto">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
        
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="text-brand-500" /> Log Visit
        </h2>

        {success ? (
           <div className="flex-1 flex flex-col items-center justify-center text-green-600 animate-in fade-in zoom-in duration-300">
              <CheckCircle size={64} className="mb-4" />
              <h3 className="text-xl font-bold">Visit Logged!</h3>
              <p className="text-sm text-gray-500">Syncing with HQ...</p>
           </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shop Name</label>
              <input 
                required
                type="text" 
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="e.g. Toko Berkah Jaya"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none"
                placeholder="Stock status, competitor promo..."
              />
            </div>

            <div className="mt-auto pt-4">
               <button 
                type="button"
                className="w-full mb-3 py-3 border border-brand-200 text-brand-600 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-brand-50"
               >
                 <Camera size={20} /> Upload Photo (Simulated)
               </button>

               <button 
                 type="submit"
                 disabled={isSubmitting}
                 className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
               >
                 {isSubmitting ? <span className="animate-spin">...</span> : <><Send size={20} /> Check In</>}
               </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};