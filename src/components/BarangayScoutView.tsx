import React, { useState, useEffect } from 'react';
import { 
  Users, 
  PlusCircle, 
  MapPin, 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Database, 
  Radio, 
  Share2, 
  FileText, 
  Trash2, 
  Zap, 
  ArrowRight,
  Shield,
  LifeBuoy,
  HeartPulse,
  Droplet
} from 'lucide-react';
import { Incident, OccupantsProfile, NetworkMode, UrgencyLevel, IncidentCategory } from '../types';
import { encodeSmsPayload, encodeBleAdvertisement } from '../utils/smsBleCodec';

interface BarangayScoutViewProps {
  networkMode: NetworkMode;
  onSyncBatch: (incidents: Incident[]) => Promise<void>;
  userCoords: { lat: number; lng: number; addressText: string } | null;
}

export const BarangayScoutView: React.FC<BarangayScoutViewProps> = ({
  networkMode,
  onSyncBatch,
  userCoords,
}) => {
  // Offline Local Queue (Stored in localStorage)
  const [offlineQueue, setOfflineQueue] = useState<Incident[]>(() => {
    const saved = localStorage.getItem('resilink_scout_queue');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      {
        id: "SCOUT-2026-901",
        timestamp: Date.now() - 1000 * 60 * 15,
        source: "scout_proxy",
        reporterName: "Tanod Jun (Scout #04)",
        category: "trapped",
        urgencyLevel: 5,
        location: {
          lat: 14.6355,
          lng: 121.0972,
          addressText: "House #18, Alley 2, Brgy Tumana",
          barangay: "Tumana",
          purok: "Purok 2",
          accuracyMeters: 5,
        },
        occupants: {
          total: 4,
          seniors: 2,
          infants: 0,
          injured: 1,
          specialConditions: ["Bedridden stroke patient, needs extraction stretcher"],
        },
        hazards: {
          waterLevelMeters: 1.9,
          structuralDamage: "partial",
          powerLinesDown: false,
        },
        requiredResources: ["Rubber Rescue Boat", "Medical Spine Stretcher", "Life Vests (x4)"],
        status: "reported",
        notes: "Water rising past front porch. Bedridden grandmother on wooden dining table.",
        aiTriageSummary: "Critical P5: Bedridden stroke patient in 1.9m rising flood. Immediate boat with rigid stretcher required.",
        smsPayload: "#SOS*14.6355,121.0972*P5*STROKE_BED*4P*W1.9*B82#",
        bleBroadcastCode: "SOS-5:14.635,121.097#901",
        syncStatus: "local_only",
      },
      {
        id: "SCOUT-2026-902",
        timestamp: Date.now() - 1000 * 60 * 30,
        source: "scout_proxy",
        reporterName: "Tanod Jun (Scout #04)",
        category: "supplies",
        urgencyLevel: 3,
        location: {
          lat: 14.6370,
          lng: 121.0990,
          addressText: "2nd Floor Balcony, #45 Riverside Dr",
          barangay: "Tumana",
          purok: "Purok 3",
          accuracyMeters: 6,
        },
        occupants: {
          total: 6,
          seniors: 0,
          infants: 2,
          injured: 0,
          specialConditions: ["Infant formula exhausted, 2 babies crying"],
        },
        hazards: {
          waterLevelMeters: 1.2,
          structuralDamage: "none",
        },
        requiredResources: ["Infant Milk Formula (0-6mo)", "Clean Drinking Water", "Rations"],
        status: "reported",
        notes: "Family safe on 2nd floor balcony but out of clean water and baby milk for 8 hours.",
        aiTriageSummary: "Priority P3: 2 infants at high dehydration risk. Structural safety adequate.",
        smsPayload: "#SOS*14.6370,121.0990*P3*INF2_MILK*6P*W1.2*B80#",
        bleBroadcastCode: "SOS-3:14.637,121.099#902",
        syncStatus: "local_only",
      },
    ];
  });

  // Form states for adding next house in field survey
  const [scoutName, setScoutName] = useState(() => localStorage.getItem('resilink_scout_name') || 'Tanod Jun (Scout #04)');
  const [barangayName, setBarangayName] = useState('Brgy Tumana');
  const [purokZone, setPurokZone] = useState('Purok 2');
  const [houseAddress, setHouseAddress] = useState('House #24, Green St');
  const [category, setCategory] = useState<IncidentCategory>('trapped');
  const [urgency, setUrgency] = useState<UrgencyLevel>(4);
  const [occupantsTotal, setOccupantsTotal] = useState(3);
  const [seniorsCount, setSeniorsCount] = useState(1);
  const [infantsCount, setInfantsCount] = useState(0);
  const [injuredCount, setInjuredCount] = useState(0);
  const [waterDepth, setWaterDepth] = useState(1.4);
  const [specialNeedText, setSpecialNeedText] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Save scout queue to localStorage
  useEffect(() => {
    localStorage.setItem('resilink_scout_queue', JSON.stringify(offlineQueue));
    localStorage.setItem('resilink_scout_name', scoutName);
  }, [offlineQueue, scoutName]);

  const handleAddSurveyTicket = (e: React.FormEvent) => {
    e.preventDefault();

    // Slightly randomize offset from current user coordinates to simulate neighborhood grid
    const baseLat = userCoords?.lat || 14.6349;
    const baseLng = userCoords?.lng || 121.0964;
    const offsetLat = baseLat + (Math.random() - 0.5) * 0.006;
    const offsetLng = baseLng + (Math.random() - 0.5) * 0.006;

    const occProfile: OccupantsProfile = {
      total: occupantsTotal,
      seniors: seniorsCount,
      infants: infantsCount,
      injured: injuredCount,
      specialConditions: specialNeedText ? [specialNeedText] : [],
    };

    const smsCode = encodeSmsPayload(
      offsetLat,
      offsetLng,
      urgency,
      category,
      occProfile,
      waterDepth,
      85
    );

    const bleCode = encodeBleAdvertisement(offsetLat, offsetLng, urgency, Date.now().toString());

    const requiredResources: string[] = [];
    if (category === 'trapped' || waterDepth > 1.0) requiredResources.push('Rubber Rescue Boat', 'Life Vests');
    if (injuredCount > 0) requiredResources.push('First Aid Spine Board / Stretcher');
    if (specialNeedText) requiredResources.push(specialNeedText);
    if (category === 'supplies') requiredResources.push('Potable Water Rations', 'Ready-to-Eat Food');
    if (requiredResources.length === 0) requiredResources.push('Evacuation Assistance');

    const newTicket: Incident = {
      id: `SCOUT-${Date.now().toString().slice(-4)}`,
      timestamp: Date.now(),
      source: 'scout_proxy',
      reporterName: scoutName,
      category,
      urgencyLevel: urgency,
      location: {
        lat: offsetLat,
        lng: offsetLng,
        addressText: `${houseAddress}, ${barangayName}`,
        barangay: barangayName,
        purok: purokZone,
        accuracyMeters: 5,
      },
      occupants: occProfile,
      hazards: {
        waterLevelMeters: waterDepth,
        structuralDamage: waterDepth > 2.0 ? 'partial' : 'none',
      },
      requiredResources,
      status: 'reported',
      notes: fieldNotes || `Field logged by ${scoutName}. Water depth: ${waterDepth}m.`,
      aiTriageSummary: `Scout Verified: Urgency P${urgency} for ${occupantsTotal} occupants at ${houseAddress}.`,
      smsPayload: smsCode,
      bleBroadcastCode: bleCode,
      syncStatus: 'local_only',
    };

    setOfflineQueue(prev => [newTicket, ...prev]);
    setHouseAddress(`House #${Math.floor(Math.random() * 80) + 10}, River Alley`);
    setFieldNotes('');
    setSpecialNeedText('');
  };

  const handleSyncAll = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    try {
      await onSyncBatch(offlineQueue);
      setOfflineQueue(prev => prev.map(i => ({ ...i, syncStatus: 'synced_to_hq' })));
      setSyncFeedback(`Successfully synchronized ${offlineQueue.length} field tickets to Incident Command HQ!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message || 'Check connection or simulate BLE Hop.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteTicket = (id: string) => {
    setOfflineQueue(prev => prev.filter(t => t.id !== id));
  };

  const handleClearSynced = () => {
    setOfflineQueue(prev => prev.filter(t => t.syncStatus !== 'synced_to_hq'));
  };

  const unSyncedCount = offlineQueue.filter(t => t.syncStatus === 'local_only').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Scout Header & Field Verification Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  BARANGAY FIRST-RESPONDER
                </span>
                <span className="text-xs text-slate-400 font-mono">100% Offline-Capable</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Field Scout & Proxy Rapid Triage Logger
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                For Barangay Tanods, youth scouts, and zone captains surveying street by street.
              </p>
            </div>
          </div>

          {/* Sync Trigger / BLE Mesh Hop Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing || unSyncedCount === 0}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all ${
                unSyncedCount > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/50 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing ? 'Syncing...' : `Sync to Command HQ (${unSyncedCount})`}
              </span>
            </button>

            <button
              onClick={() => setShowExportModal(!showExportModal)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Export Offline Hex / QR Data for Physical Handover"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* 2-COLUMN LAYOUT: Rapid Field Logger Form (Left) & Offline Sync Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Rapid Field Logging Form */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-amber-400" />
              Log Next Stranded Household
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Scout: <input 
                type="text" 
                value={scoutName} 
                onChange={(e) => setScoutName(e.target.value)}
                className="bg-slate-950 border border-slate-700 px-1.5 py-0.5 rounded text-amber-300 text-xs"
              />
            </span>
          </div>

          <form onSubmit={handleAddSurveyTicket} className="space-y-4">
            
            {/* House Location & Zone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">House / Landmark</label>
                <input
                  type="text"
                  required
                  value={houseAddress}
                  onChange={(e) => setHouseAddress(e.target.value)}
                  placeholder="e.g. House #24, Alley 3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Purok / Zone</label>
                <select
                  value={purokZone}
                  onChange={(e) => setPurokZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Purok 1 (Riverside)">Purok 1 (Riverside)</option>
                  <option value="Purok 2 (Lowland Basin)">Purok 2 (Lowland Basin)</option>
                  <option value="Purok 3 (Chapel Zone)">Purok 3 (Chapel Zone)</option>
                  <option value="Purok 4 (Upper Ground)">Purok 4 (Upper Ground)</option>
                </select>
              </div>
            </div>

            {/* Urgency & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Incident Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="trapped">Trapped / Flood Submerged</option>
                  <option value="medical">Medical Trauma / Injury</option>
                  <option value="supplies">Food / Clean Water Deficit</option>
                  <option value="hazard">Civic Hazard (Wire/Tree)</option>
                  <option value="evacuation">Evac Center Support</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Triage Priority</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(parseInt(e.target.value) as UrgencyLevel)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                >
                  <option value="5">🔴 Priority 5 (Immediate Life Threat)</option>
                  <option value="4">🟠 Priority 4 (Severe Medical/Injury)</option>
                  <option value="3">🟡 Priority 3 (High Resource Need)</option>
                  <option value="2">🔵 Priority 2 (Moderate Hazard)</option>
                  <option value="1">🟢 Priority 1 (Minor / Cleared)</option>
                </select>
              </div>
            </div>

            {/* Occupants Count */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">Occupant Breakdown</label>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Total</span>
                  <input
                    type="number"
                    min="1"
                    value={occupantsTotal}
                    onChange={(e) => setOccupantsTotal(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-center font-bold text-white text-sm"
                  />
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-amber-400 block">Seniors</span>
                  <input
                    type="number"
                    min="0"
                    value={seniorsCount}
                    onChange={(e) => setSeniorsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-center font-bold text-amber-400 text-sm"
                  />
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-rose-400 block">Infants</span>
                  <input
                    type="number"
                    min="0"
                    value={infantsCount}
                    onChange={(e) => setInfantsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-center font-bold text-rose-400 text-sm"
                  />
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-red-500 block">Injured</span>
                  <input
                    type="number"
                    min="0"
                    value={injuredCount}
                    onChange={(e) => setInjuredCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-center font-bold text-red-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Water Depth Gauge */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Observed Water Depth:</span>
                <span className="font-bold text-amber-400 font-mono">{waterDepth}m</span>
              </div>
              <input
                type="range"
                min="0"
                max="3.5"
                step="0.1"
                value={waterDepth}
                onChange={(e) => setWaterDepth(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Special Medical Need or Notes */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Special Condition / Specific Resource Needed</label>
              <input
                type="text"
                value={specialNeedText}
                onChange={(e) => setSpecialNeedText(e.target.value)}
                placeholder="e.g. Wheelchair-bound, Oxygen required, Open wound bleeding"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save Ticket to Offline Queue</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Offline Queue & Sync Staging Area */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Local Queue ({offlineQueue.length} Tickets)
                </h3>
              </div>
              {offlineQueue.some(t => t.syncStatus === 'synced_to_hq') && (
                <button
                  onClick={handleClearSynced}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                >
                  Clear Synced
                </button>
              )}
            </div>

            {/* List of queued tickets */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {offlineQueue.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <CheckCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <span>No tickets in queue. Use the form on the left to log households.</span>
                </div>
              ) : (
                offlineQueue.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-3 rounded-xl border transition-all ${
                      ticket.syncStatus === 'synced_to_hq'
                        ? 'bg-slate-950/50 border-slate-800/60 opacity-60'
                        : ticket.urgencyLevel === 5
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded ${
                            ticket.urgencyLevel === 5 ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            P{ticket.urgencyLevel}
                          </span>
                          <span className="font-bold text-xs text-white">
                            {ticket.location.addressText}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {ticket.occupants.total} Occupants ({ticket.occupants.seniors} seniors, {ticket.occupants.infants} infants, {ticket.occupants.injured} injured) • Water: {ticket.hazards.waterLevelMeters || 0}m
                        </p>
                        {ticket.notes && (
                          <p className="text-[11px] text-slate-300 italic mt-0.5">"{ticket.notes}"</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          ticket.syncStatus === 'synced_to_hq'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {ticket.syncStatus === 'synced_to_hq' ? 'SYNCED' : 'UNSYNCED'}
                        </span>
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick BLE Hop Demonstration Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              BLE Broadcast Ready (31B Packets)
            </span>
            <span>Queue Memory: {JSON.stringify(offlineQueue).length} bytes</span>
          </div>
        </div>

      </div>

      {/* EXPORT HEX MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                Dead-Zone Physical Export
              </h4>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white text-xs">
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-slate-300">
              When 100% of cell towers are dead, this payload can be copied, scanned via QR, or dumped via Web Bluetooth to a passing rescue unit.
            </p>
            <textarea
              readOnly
              rows={5}
              value={JSON.stringify(offlineQueue, null, 2)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-amber-300 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(offlineQueue));
                  alert('Copied offline queue JSON to clipboard!');
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Copy Queue Payload
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
