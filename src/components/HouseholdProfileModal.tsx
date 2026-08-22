import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Home, 
  Phone, 
  Users, 
  Baby, 
  HeartHandshake, 
  Wind, 
  Save, 
  Check, 
  Compass, 
  Crosshair, 
  Info,
  ShieldCheck,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { OccupantsProfile } from '../types';

interface HouseholdProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords: { lat: number; lng: number; addressText: string } | null;
  setUserCoords: (coords: { lat: number; lng: number; addressText: string }) => void;
  onProfileUpdated?: () => void;
}

export const HouseholdProfileModal: React.FC<HouseholdProfileModalProps> = ({
  isOpen,
  onClose,
  userCoords,
  setUserCoords,
  onProfileUpdated,
}) => {
  // Household Profile State
  const [fullName, setFullName] = useState(() => localStorage.getItem('resilink_user_name') || 'Maria Santos');
  const [phone, setPhone] = useState(() => localStorage.getItem('resilink_user_phone') || '+63 917 555 0192');
  const [address, setAddress] = useState(() => localStorage.getItem('resilink_user_address') || 'House #12, Riverside Subd');
  const [barangay, setBarangay] = useState(() => localStorage.getItem('resilink_user_barangay') || 'Brgy Tumana');
  const [purok, setPurok] = useState(() => localStorage.getItem('resilink_user_purok') || 'Purok 3');

  // Custom GPS Lat/Lng (Defaults or Live)
  const [latInput, setLatInput] = useState<string>(() => userCoords ? userCoords.lat.toString() : '14.6349');
  const [lngInput, setLngInput] = useState<string>(() => userCoords ? userCoords.lng.toString() : '121.0964');

  // Occupants
  const [totalOccupants, setTotalOccupants] = useState<number>(3);
  const [seniors, setSeniors] = useState<number>(1);
  const [infants, setInfants] = useState<number>(1);
  const [injured, setInjured] = useState<number>(0);
  const [specialConditions, setSpecialConditions] = useState<string>('Asthma / Needs Pediatric Inhaler');

  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load existing occupants profile
  useEffect(() => {
    const saved = localStorage.getItem('resilink_user_profile');
    if (saved) {
      try {
        const parsed: OccupantsProfile = JSON.parse(saved);
        setTotalOccupants(parsed.total || 1);
        setSeniors(parsed.seniors || 0);
        setInfants(parsed.infants || 0);
        setInjured(parsed.injured || 0);
        setSpecialConditions(parsed.specialConditions?.join(', ') || '');
      } catch (e) { /* ignore */ }
    }
  }, [isOpen]);

  useEffect(() => {
    if (userCoords) {
      setLatInput(userCoords.lat.toFixed(6));
      setLngInput(userCoords.lng.toFixed(6));
      if (!localStorage.getItem('resilink_user_address')) {
        setAddress(userCoords.addressText);
      }
    }
  }, [userCoords]);

  if (!isOpen) return null;

  // Real Hardware GPS Acquisition
  const handleDetectLiveGps = () => {
    setIsDetectingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatInput(lat.toFixed(6));
          setLngInput(lng.toFixed(6));
          const generatedAddr = `GPS Pin [${lat.toFixed(4)}, ${lng.toFixed(4)}], ${barangay}`;
          setAddress(generatedAddr);
          setUserCoords({
            lat,
            lng,
            addressText: generatedAddr,
          });
          setIsDetectingGps(false);
        },
        (err) => {
          console.warn('Geolocation failed or permission denied:', err);
          alert('GPS permission was blocked or unavailable. You can enter your exact coordinates manually below!');
          setIsDetectingGps(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert('Your browser does not support GPS Geolocation. Please type your coordinates manually.');
      setIsDetectingGps(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedLat = parseFloat(latInput) || 14.6349;
    const parsedLng = parseFloat(lngInput) || 121.0964;

    const conditionsArray = specialConditions
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const profileData: OccupantsProfile = {
      total: Math.max(1, totalOccupants),
      seniors: Math.max(0, seniors),
      infants: Math.max(0, infants),
      injured: Math.max(0, injured),
      specialConditions: conditionsArray,
    };

    // Save to LocalStorage
    localStorage.setItem('resilink_user_name', fullName);
    localStorage.setItem('resilink_user_phone', phone);
    localStorage.setItem('resilink_user_address', address);
    localStorage.setItem('resilink_user_barangay', barangay);
    localStorage.setItem('resilink_user_purok', purok);
    localStorage.setItem('resilink_user_profile', JSON.stringify(profileData));

    // Update coordinates across app
    setUserCoords({
      lat: parsedLat,
      lng: parsedLng,
      addressText: `${address}, ${barangay}`,
    });

    setSavedSuccess(true);
    if (onProfileUpdated) onProfileUpdated();

    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-6 my-auto text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  OFFLINE HOUSEHOLD PROFILE
                </span>
                <span className="text-xs text-slate-400 font-mono">100% Local Device Storage</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                Emergency Household & Location Setup
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          
          {/* Section 1: Contact & Personal Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 1. Family Representative / Contact
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +63 917 555 0192"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Physical Address & Real Hardware GPS */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 2. Home Location & GPS Coordinates
              </h4>
              
              <button
                type="button"
                onClick={handleDetectLiveGps}
                disabled={isDetectingGps}
                className="px-3 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Crosshair className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                <span>{isDetectingGps ? 'Acquiring Satellite GPS...' : 'Use My Actual GPS Pin'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">House / Street</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House #12, Riverside Subd"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Barangay / Village</label>
                <input
                  type="text"
                  required
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  placeholder="e.g. Brgy Tumana"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Purok / Zone</label>
                <input
                  type="text"
                  value={purok}
                  onChange={(e) => setPurok(e.target.value)}
                  placeholder="e.g. Purok 3 (Lowland)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Exact Latitude & Longitude Inputs */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">EXACT LATITUDE</span>
                  <input
                    type="text"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">EXACT LONGITUDE</span>
                  <input
                    type="text"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="text-[11px] text-slate-400 sm:max-w-xs">
                💡 <span className="text-slate-300">Why this matters:</span> This coordinate is encoded directly into your 85-byte SMS & BLE radio beacon so rescue boats navigate to your exact roof.
              </div>
            </div>
          </div>

          {/* Section 3: Vulnerable Household Breakdown */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> 3. Vulnerable Occupants Breakdown
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Total People</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={totalOccupants}
                  onChange={(e) => setTotalOccupants(parseInt(e.target.value) || 1)}
                  className="w-full bg-transparent text-center font-bold text-white text-base py-1"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-amber-400 block font-semibold">Seniors (60+)</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={seniors}
                  onChange={(e) => setSeniors(parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-center font-bold text-amber-400 text-base py-1"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-rose-400 block font-semibold">Infants (0-3yr)</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={infants}
                  onChange={(e) => setInfants(parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-center font-bold text-rose-400 text-base py-1"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-red-500 block font-semibold">Injured / Sick</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={injured}
                  onChange={(e) => setInjured(parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-center font-bold text-red-500 text-base py-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Special Medical Conditions or Life-Support Gear Needed
              </label>
              <input
                type="text"
                value={specialConditions}
                onChange={(e) => setSpecialConditions(e.target.value)}
                placeholder="e.g. Asthma, Oxygen Concentrator Needed, Bedridden Stroke, Dialysis"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all ${
                savedSuccess
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50 active:scale-95'
              }`}
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Household Profile Saved!' : 'Save Offline Profile'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
