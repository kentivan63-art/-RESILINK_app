import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  LifeBuoy, 
  HeartPulse, 
  Droplet, 
  Zap, 
  MapPin, 
  Send, 
  MessageSquare, 
  Radio, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Flashlight, 
  User, 
  Baby, 
  HeartHandshake, 
  Wind,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Incident, OccupantsProfile, NetworkMode, IncidentCategory, UrgencyLevel } from '../types';
import { encodeSmsPayload, encodeBleAdvertisement, generateSmsLink } from '../utils/smsBleCodec';

interface CitizenSosViewProps {
  networkMode: NetworkMode;
  onSendSos: (incidentData: Partial<Incident>) => void;
  userCoords: { lat: number; lng: number; addressText: string } | null;
  setUserCoords: (coords: { lat: number; lng: number; addressText: string }) => void;
  onOpenProfileModal?: () => void;
}

export const CitizenSosView: React.FC<CitizenSosViewProps> = ({
  networkMode,
  onSendSos,
  userCoords,
  setUserCoords,
  onOpenProfileModal,
}) => {
  // Category selection
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory>('trapped');
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>(5);

  // Occupants quick profile (stored in localStorage for zero-re-typing)
  const [occupants, setOccupants] = useState<OccupantsProfile>(() => {
    const saved = localStorage.getItem('resilink_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      total: 3,
      seniors: 1,
      infants: 1,
      injured: 0,
      specialConditions: ['Asthma / Inhaler Needed'],
    };
  });

  const [reporterName, setReporterName] = useState(() => localStorage.getItem('resilink_user_name') || 'Maria Santos');
  const [contactNumber, setContactNumber] = useState(() => localStorage.getItem('resilink_user_phone') || '+63 917 555 0192');
  const [waterLevelMeters, setWaterLevelMeters] = useState<number>(1.8);
  const [customNote, setCustomNote] = useState('');
  
  // Status states
  const [isLocating, setIsLocating] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isWhistlePlaying, setIsWhistlePlaying] = useState(false);
  const [isDistressStrobe, setIsDistressStrobe] = useState(false);

  // Audio Context for Rescue Whistle
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const oscRef = React.useRef<OscillatorNode | null>(null);
  const gainRef = React.useRef<GainNode | null>(null);

  // Save profile to local storage automatically
  useEffect(() => {
    localStorage.setItem('resilink_user_profile', JSON.stringify(occupants));
    localStorage.setItem('resilink_user_name', reporterName);
    localStorage.setItem('resilink_user_phone', contactNumber);
  }, [occupants, reporterName, contactNumber]);

  // Acquire GPS on mount if not present
  useEffect(() => {
    if (!userCoords) {
      locateUser();
    }
  }, []);

  const locateUser = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            addressText: `GPS Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`,
          });
          setIsLocating(false);
        },
        (_err) => {
          // Fallback to default high-risk river basin coordinate (Tumana, Marikina, PH)
          setUserCoords({
            lat: 14.6349,
            lng: 121.0964,
            addressText: "Block 4 Lot 12, Riverside Subd, Brgy Tumana",
          });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setUserCoords({
        lat: 14.6349,
        lng: 121.0964,
        addressText: "Block 4 Lot 12, Riverside Subd, Brgy Tumana",
      });
      setIsLocating(false);
    }
  };

  // Sound Synthesizer for Emergency Whistle (International SAR Morse SOS / Whistle)
  const toggleWhistle = () => {
    if (isWhistlePlaying) {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      setIsWhistlePlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 2800 Hz to 3200 Hz is peak human ear acoustic sensitivity for rescue whistles
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(3000, ctx.currentTime);

        // Pulsing whistle cadence
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
        setIsWhistlePlaying(true);
      } catch (err) {
        console.error('AudioContext error:', err);
      }
    }
  };

  const handleSelectCategory = (cat: IncidentCategory, urg: UrgencyLevel) => {
    setSelectedCategory(cat);
    setUrgencyLevel(urg);
  };

  const handleTriggerSos = () => {
    const lat = userCoords?.lat || 14.6349;
    const lng = userCoords?.lng || 121.0964;

    const smsCode = encodeSmsPayload(
      lat,
      lng,
      urgencyLevel,
      selectedCategory,
      occupants,
      waterLevelMeters,
      78 // battery approx
    );

    const bleCode = encodeBleAdvertisement(lat, lng, urgencyLevel, Date.now().toString());

    const requiredResources: string[] = [];
    if (selectedCategory === 'trapped' || waterLevelMeters > 1.0) requiredResources.push('Rubber Rescue Boat', 'Life Vests');
    if (occupants.specialConditions.some(c => /asthma|breath/i.test(c))) requiredResources.push('Pediatric Oxygen / Inhaler Kit');
    if (occupants.injured > 0) requiredResources.push('Stretcher / First Aid Spine Board');
    if (selectedCategory === 'supplies') requiredResources.push('Potable Water (20L)', 'Relief Food Rations');
    if (requiredResources.length === 0) requiredResources.push('Search & Rescue Team');

    const newInc: Incident = {
      id: `SOS-${Date.now().toString().slice(-6)}`,
      timestamp: Date.now(),
      source: networkMode === 'total_blackout_mesh' ? 'ble_relay' : networkMode === 'degraded_2g' ? 'sms_gateway' : 'citizen_sos',
      reporterName,
      reporterContact: contactNumber,
      category: selectedCategory,
      urgencyLevel,
      location: {
        lat,
        lng,
        addressText: userCoords?.addressText || 'GPS Pin Broadcast',
        barangay: 'Riverside Barangay',
        accuracyMeters: 8,
      },
      occupants,
      hazards: {
        waterLevelMeters: selectedCategory === 'trapped' ? waterLevelMeters : 0,
        powerLinesDown: false,
        structuralDamage: waterLevelMeters > 2 ? 'partial' : 'none',
      },
      requiredResources,
      status: 'reported',
      notes: customNote || (selectedCategory === 'trapped' ? `Trapped by ${waterLevelMeters}m floodwater. Need immediate boat evacuation.` : 'Emergency SOS triggered.'),
      aiTriageSummary: `Priority ${urgencyLevel}: ${occupants.total} individuals (${occupants.seniors} seniors, ${occupants.infants} infants). Requires ${requiredResources.slice(0, 2).join(', ')}.`,
      smsPayload: smsCode,
      bleBroadcastCode: bleCode,
      syncStatus: networkMode === 'full_online' ? 'synced_to_hq' : 'local_only',
    };

    onSendSos(newInc);
    setSubmittedIncident(newInc);
  };

  const copySmsText = () => {
    if (submittedIncident?.smsPayload) {
      navigator.clipboard.writeText(submittedIncident.smsPayload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  const currentLat = userCoords?.lat || 14.6349;
  const currentLng = userCoords?.lng || 121.0964;
  const currentSmsPreview = encodeSmsPayload(
    currentLat,
    currentLng,
    urgencyLevel,
    selectedCategory,
    occupants,
    waterLevelMeters,
    78
  );

  return (
    <div className={`space-y-6 max-w-4xl mx-auto ${isDistressStrobe ? 'bg-amber-400 text-black p-4 rounded-3xl transition-colors duration-150' : ''}`}>
      
      {/* High-Visibility Emergency Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                CITIZEN 1-TAP PANIC BEACON
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {networkMode === 'total_blackout_mesh' ? 'Mode C (Zero Internet Active)' : networkMode === 'degraded_2g' ? '2G SMS Ready' : 'Online'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Request Immediate Rescue or Relief
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Zero typing required. Coordinates and saved household profile are automatically packaged.
            </p>
          </div>

          {/* Rescue Whistle & Screen Strobe Tool for Night/Fog */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleWhistle}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isWhistlePlaying
                  ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/50 animate-bounce'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Acoustic 3000Hz Whistle Sound for SAR dogs/boats"
            >
              {isWhistlePlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{isWhistlePlaying ? 'STOP WHISTLE' : 'RESCUE WHISTLE'}</span>
            </button>

            <button
              onClick={() => setIsDistressStrobe(!isDistressStrobe)}
              className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                isDistressStrobe
                  ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Screen Strobe / High-Contrast Visual Beacon"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* GPS Coordinate Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-mono text-slate-200">
              {userCoords ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : 'Detecting GPS...'}
            </span>
            <span className="text-slate-400 text-[11px] truncate max-w-[220px] sm:max-w-xs">
              ({userCoords?.addressText || 'Riverside Disaster Zone'})
            </span>
          </div>

          <button
            onClick={locateUser}
            disabled={isLocating}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium underline underline-offset-2"
          >
            <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Acquiring GPS...' : 'Refresh Coordinates'}
          </button>
        </div>
      </div>

      {/* BIG 1-TAP EMERGENCY TRIGGER CARDS (No Form Cognitive Overload) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Card 1: Trapped / Flood Submersion */}
        <button
          onClick={() => handleSelectCategory('trapped', 5)}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
            selectedCategory === 'trapped'
              ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500/50 shadow-xl shadow-rose-950/80'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl ${selectedCategory === 'trapped' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
              <LifeBuoy className="w-6 h-6 animate-pulse" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              URGENCY P5
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
              TRAPPED / RISING WATER
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Stranded on roof or 2nd floor. Requires Rubber Rescue Boat extraction.
            </p>
          </div>
        </button>

        {/* Card 2: Severe Medical Emergency */}
        <button
          onClick={() => handleSelectCategory('medical', 4)}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
            selectedCategory === 'medical'
              ? 'bg-amber-950/70 border-amber-500 ring-2 ring-amber-500/50 shadow-xl shadow-amber-950/80'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl ${selectedCategory === 'medical' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
              <HeartPulse className="w-6 h-6" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              URGENCY P4
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
              MEDICAL / OXYGEN / INJURY
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Asthma attack, severe fracture, missing insulin, or open wound.
            </p>
          </div>
        </button>

        {/* Card 3: Food / Drinking Water Exhausted */}
        <button
          onClick={() => handleSelectCategory('supplies', 3)}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
            selectedCategory === 'supplies'
              ? 'bg-sky-950/70 border-sky-500 ring-2 ring-sky-500/50 shadow-xl shadow-sky-950/80'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl ${selectedCategory === 'supplies' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
              <Droplet className="w-6 h-6" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              URGENCY P3
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
              POTABLE WATER & FOOD
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Isolated evacuation point with no clean drinking water or infant milk.
            </p>
          </div>
        </button>

      </div>

      {/* QUICK HOUSEHOLD PROFILE & CONDITIONS (1-Tap Incrementors) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-400" />
            Household Profile ({reporterName} • {contactNumber})
          </h3>
          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline underline-offset-2"
            >
              Configure Profile & Exact GPS
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          {/* Total Occupants */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Total People</span>
              <span className="text-lg font-bold text-white">{occupants.total}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOccupants(prev => ({ ...prev, total: Math.max(1, prev.total - 1) }))}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 flex items-center justify-center text-sm"
              >
                -
              </button>
              <button
                onClick={() => setOccupants(prev => ({ ...prev, total: prev.total + 1 }))}
                className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Seniors */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Seniors (60+)</span>
              <span className="text-lg font-bold text-amber-400">{occupants.seniors}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOccupants(prev => ({ ...prev, seniors: Math.max(0, prev.seniors - 1) }))}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 flex items-center justify-center text-sm"
              >
                -
              </button>
              <button
                onClick={() => setOccupants(prev => ({ ...prev, seniors: prev.seniors + 1 }))}
                className="w-7 h-7 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-500 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Infants / Toddlers */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Infants / Kids</span>
              <span className="text-lg font-bold text-rose-400">{occupants.infants}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOccupants(prev => ({ ...prev, infants: Math.max(0, prev.infants - 1) }))}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 flex items-center justify-center text-sm"
              >
                -
              </button>
              <button
                onClick={() => setOccupants(prev => ({ ...prev, infants: prev.infants + 1 }))}
                className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Injured */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Injured</span>
              <span className="text-lg font-bold text-red-500">{occupants.injured}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOccupants(prev => ({ ...prev, injured: Math.max(0, prev.injured - 1) }))}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 flex items-center justify-center text-sm"
              >
                -
              </button>
              <button
                onClick={() => setOccupants(prev => ({ ...prev, injured: prev.injured + 1 }))}
                className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>

        </div>

        {/* Quick Vulnerability Pills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {['Asthma / Inhaler Needed', 'Oxygen Required', 'Wheelchair / Bedridden', 'Insulin Dependent', 'Pregnant'].map(tag => {
            const isSelected = occupants.specialConditions.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => {
                  if (isSelected) {
                    setOccupants(prev => ({ ...prev, specialConditions: prev.specialConditions.filter(c => c !== tag) }));
                  } else {
                    setOccupants(prev => ({ ...prev, specialConditions: [...prev.specialConditions, tag] }));
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-rose-600/30 text-rose-200 border border-rose-500/60 ring-1 ring-rose-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                <span>{tag}</span>
                {isSelected && <Check className="w-3 h-3 text-rose-300 ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Estimated Flood Depth */}
        {selectedCategory === 'trapped' && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Estimated Water Depth at Location:</span>
              <span className="font-bold text-rose-400 font-mono">{waterLevelMeters} meters (~{(waterLevelMeters * 3.28).toFixed(1)} ft)</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="4.0"
              step="0.1"
              value={waterLevelMeters}
              onChange={(e) => setWaterLevelMeters(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.3m (Knee Deep)</span>
              <span>1.5m (Chest Deep)</span>
              <span>3.0m+ (2nd Floor / Roof)</span>
            </div>
          </div>
        )}
      </div>

      {/* MASTER 1-TAP TRANSMISSION BUTTON */}
      <div className="space-y-3">
        <button
          id="btn-master-sos"
          onClick={handleTriggerSos}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.99] text-white font-black text-lg sm:text-xl tracking-wide shadow-2xl shadow-rose-950/80 ring-4 ring-rose-500/40 flex items-center justify-center gap-3 transition-all"
        >
          <Radio className="w-6 h-6 animate-ping" />
          <span>BROADCAST EMERGENCY SOS BEACON NOW</span>
        </button>

        {/* Immediate Mode C Fallback Bridge (Instant SMS Shortcut) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-200 block">Mode C Zero-Data SMS Fallback:</span>
              <code className="text-slate-400 font-mono text-[11px] break-all">{currentSmsPreview}</code>
            </div>
          </div>

          <a
            href={generateSmsLink('911', currentSmsPreview)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Launch Native SMS (911)</span>
          </a>
        </div>
      </div>

      {/* Confirmation Card after submission */}
      {submittedIncident && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-2xl p-5 shadow-2xl relative animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-base">
                  Emergency Beacon Transmitted ({submittedIncident.id})
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-semibold">
                  STATUS: {submittedIncident.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Your coordinates and triage priority ({submittedIncident.urgencyLevel}/5) have been sent to the Operations Command Map and local Barangay Scouts.
              </p>
              
              <div className="mt-3 pt-2 border-t border-emerald-800/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">BLE Broadcast Packet:</span>
                  <span className="text-emerald-400">{submittedIncident.bleBroadcastCode}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] block">SMS Shortcode Payload:</span>
                    <span className="text-amber-300 truncate block max-w-[180px]">{submittedIncident.smsPayload}</span>
                  </div>
                  <button
                    onClick={copySmsText}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                    title="Copy SMS Payload"
                  >
                    {copiedPayload ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
