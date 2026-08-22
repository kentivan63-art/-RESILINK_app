import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Sparkles, 
  Filter, 
  Send, 
  LifeBuoy, 
  HeartPulse, 
  Droplet, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Users, 
  Truck, 
  Radio, 
  AlertOctagon,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Crosshair,
  Trash2
} from 'lucide-react';
import { Incident, UrgencyLevel, IncidentCategory, AiTriageResult } from '../types';
import { RESCUE_UNITS_CATALOG } from '../data/mockData';

interface CommandMapViewProps {
  incidents: Incident[];
  onUpdateStatus: (id: string, newStatus: any, unit?: any) => void;
  onAddIncidentFromAi: (incident: Incident) => void;
  userCoords?: { lat: number; lng: number; addressText: string } | null;
  onClearMockData?: () => void;
}

export const CommandMapView: React.FC<CommandMapViewProps> = ({
  incidents,
  onUpdateStatus,
  onAddIncidentFromAi,
  userCoords,
  onClearMockData,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Filters & State
  const [selectedUrgency, setSelectedUrgency] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [gearFilter, setGearFilter] = useState<string>('all');
  const [enableClustering, setEnableClustering] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // AI Triage Assistant State
  const [rawDistressInput, setRawDistressInput] = useState('');
  const [isAiTriaging, setIsAiTriaging] = useState(false);
  const [aiTriageResult, setAiTriageResult] = useState<AiTriageResult | null>(null);
  const [aiContextZone, setAiContextZone] = useState('Disaster Area');

  // Center Map on User's Actual GPS Location
  const handleRecenterOnUser = () => {
    if (!mapInstanceRef.current) return;
    if (userCoords) {
      mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 16, { animate: true });
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true });
      });
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = userCoords?.lat || 14.636;
      const initialLng = userCoords?.lng || 121.098;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: true,
      });

      // Free CartoDB Dark Matter OpenStreetMap tiles ($0 budget)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }
  }, []);

  // Update map center when userCoords changes
  useEffect(() => {
    if (mapInstanceRef.current && userCoords) {
      // If user coordinates exist, add an identifiable "YOU ARE HERE" marker
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      const userPinIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: #3b82f6; opacity: 0.35; animation: ping-slow 2s infinite;"></div>
            <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background-color: #2563eb; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
              📍
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userPinIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="font-size: 12px; font-weight: bold; color: #1e293b;">
            <span style="color: #2563eb;">🎯 YOUR CONFIGURED LOCATION</span><br/>
            ${userCoords.addressText}<br/>
            <span style="font-size: 10px; color: #64748b; font-family: monospace;">[${userCoords.lat.toFixed(5)}, ${userCoords.lng.toFixed(5)}]</span>
          </div>
        `);
      userMarkerRef.current = userMarker;
    }
  }, [userCoords]);

  // Update Markers on Incidents or Filter Change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    // Filter incidents
    const filtered = incidents.filter((inc) => {
      if (selectedUrgency !== 'all' && inc.urgencyLevel !== selectedUrgency) return false;
      if (selectedCategory !== 'all' && inc.category !== selectedCategory) return false;
      if (gearFilter !== 'all') {
        const matchesGear = inc.requiredResources.some(r => r.toLowerCase().includes(gearFilter.toLowerCase()));
        if (!matchesGear) return false;
      }
      return true;
    });

    // Render Markers
    filtered.forEach((inc) => {
      const getMarkerColor = (urg: UrgencyLevel, status: string) => {
        if (status === 'cleared' || status === 'rescued') return '#10b981'; // green
        switch (urg) {
          case 5: return '#f43f5e'; // rose-500
          case 4: return '#f59e0b'; // amber-500
          case 3: return '#0284c7'; // sky-600
          case 2: return '#8b5cf6'; // violet-500
          default: return '#64748b'; // slate-500
        }
      };

      const color = getMarkerColor(inc.urgencyLevel, inc.status);
      const isCritical = inc.urgencyLevel === 5 && inc.status !== 'cleared';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            ${isCritical ? `<div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: ${color}; opacity: 0.4; animation: ping-slow 2s infinite;"></div>` : ''}
            <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background-color: ${color}; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);">
              P${inc.urgencyLevel}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([inc.location.lat, inc.location.lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 800; color: ${color};">PRIORITY ${inc.urgencyLevel}</span>
            <span style="font-size: 10px; background: #334155; padding: 1px 6px; border-radius: 4px; color: #cbd5e1; text-transform: uppercase;">${inc.status}</span>
          </div>
          <div style="font-weight: 700; color: #f8fafc; margin-bottom: 2px;">${inc.location.addressText}</div>
          <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">${inc.occupants.total} Occupants (${inc.occupants.seniors} seniors, ${inc.occupants.infants} infants)</div>
          ${inc.hazards.waterLevelMeters ? `<div style="color: #38bdf8; font-size: 11px;">Water Depth: ${inc.hazards.waterLevelMeters}m</div>` : ''}
          <div style="color: #cbd5e1; font-size: 11px; margin-top: 4px; border-top: 1px solid #334155; padding-top: 4px;">
            <strong>Gear:</strong> ${inc.requiredResources.join(', ')}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedIncident(inc);
      });

      markersGroup.addLayer(marker);
    });

  }, [incidents, selectedUrgency, selectedCategory, gearFilter]);

  // Handle AI Triage Request
  const handleRunAiTriage = async () => {
    if (!rawDistressInput.trim()) return;
    setIsAiTriaging(true);
    try {
      const response = await fetch('/api/triage/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawReportText: rawDistressInput,
          contextLocation: aiContextZone,
        }),
      });
      const data = await response.json();
      if (data.success && data.triageResult) {
        setAiTriageResult(data.triageResult);
      }
    } catch (err) {
      console.error('AI Triage error:', err);
    } finally {
      setIsAiTriaging(false);
    }
  };

  const handleApplyAiTicketToMap = () => {
    if (!aiTriageResult) return;

    // Center randomly near active district
    const lat = 14.636 + (Math.random() - 0.5) * 0.008;
    const lng = 121.098 + (Math.random() - 0.5) * 0.008;

    const newInc: Incident = {
      id: `AI-TRIAGE-${Date.now().toString().slice(-4)}`,
      timestamp: Date.now(),
      source: 'citizen_sos',
      reporterName: 'AI Voice/Text Ingest',
      category: aiTriageResult.category,
      urgencyLevel: aiTriageResult.urgencyLevel,
      location: {
        lat,
        lng,
        addressText: `Extracted: ${aiContextZone}`,
        barangay: 'Brgy Tumana',
        accuracyMeters: 10,
      },
      occupants: aiTriageResult.detectedOccupants,
      hazards: {
        waterLevelMeters: aiTriageResult.urgencyLevel >= 4 ? 2.0 : 0.8,
        structuralDamage: 'partial',
      },
      requiredResources: aiTriageResult.requiredResources,
      status: 'triaged',
      notes: rawDistressInput,
      aiTriageSummary: aiTriageResult.triageSummary,
      smsPayload: `#SOS*${lat.toFixed(4)},${lng.toFixed(4)}*P${aiTriageResult.urgencyLevel}*AI_INGEST#`,
      syncStatus: 'synced_to_hq',
    };

    onAddIncidentFromAi(newInc);
    setSelectedIncident(newInc);
    setRawDistressInput('');
    setAiTriageResult(null);
  };

  const criticalCount = incidents.filter(i => i.urgencyLevel === 5 && i.status !== 'cleared').length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      
      {/* Tactical Incident Command Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  INCIDENT COMMAND CENTER
                </span>
                {criticalCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    {criticalCount} Critical P5 Active
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Real-Time Geospatial Triage & Resource Dispatch
              </h2>
            </div>
          </div>

          {/* Tactical Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Priority Filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="bg-transparent text-slate-200 text-xs focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="5">P5 Critical Only</option>
                <option value="4">P4 Severe</option>
                <option value="3">P3 High Resource</option>
                <option value="2">P2 Hazard</option>
                <option value="1">P1 Minor</option>
              </select>
            </div>

            {/* Recenter on My Location Button */}
            <button
              onClick={handleRecenterOnUser}
              className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-xl text-xs font-bold transition-all"
              title="Fly map directly to your real coordinates"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Center on Me</span>
            </button>

            {/* Clear Sample Incidents Option */}
            {onClearMockData && (
              <button
                onClick={onClearMockData}
                className="flex items-center gap-1 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 px-2 py-1 rounded-xl text-xs transition-all"
                title="Clear pre-loaded demo pins to view only your own live SOS tickets"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Demo Pins</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* MAIN 2-PANEL LAYOUT: Interactive Map (Left) & Dispatch + Gemini AI Triage Controller (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* MAP CONTAINER (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[480px] lg:min-h-[620px] flex flex-col">
          <div ref={mapContainerRef} className="w-full flex-1 z-10" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-20 bg-slate-950/90 backdrop-blur border border-slate-800/80 rounded-xl p-2.5 text-[11px] space-y-1.5 shadow-xl">
            <div className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">Triage Urgency Legend</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping-slow" />
                <span className="text-slate-300">P5 Life Threat</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">P4 Medical</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-slate-300">P3 Supplies</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Rescued/Cleared</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTROLLER: Active Incident Inspector & AI Triage Parser (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. ACTIVE INCIDENT DISPATCH INSPECTOR */}
          {selectedIncident ? (
            <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                      selectedIncident.urgencyLevel === 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      PRIORITY {selectedIncident.urgencyLevel}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {selectedIncident.id}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base mt-1">
                    {selectedIncident.location.addressText}
                  </h3>
                </div>

                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700 uppercase">
                  {selectedIncident.status}
                </span>
              </div>

              {/* Occupant & Hazard Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">OCCUPANTS</span>
                  <span className="text-slate-200">
                    {selectedIncident.occupants.total} Total ({selectedIncident.occupants.seniors} SR, {selectedIncident.occupants.infants} INF, {selectedIncident.occupants.injured} INJ)
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">WATER LEVEL</span>
                  <span className="text-rose-400 font-mono font-bold">
                    {selectedIncident.hazards.waterLevelMeters || 0}m Depth
                  </span>
                </div>
              </div>

              {/* Required Resources */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-500 block text-[10px] mb-1 font-bold">REQUIRED RESCUE GEAR:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedIncident.requiredResources.map((res, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[11px]">
                      {res}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tactical Summary */}
              {selectedIncident.aiTriageSummary && (
                <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 italic">
                  "{selectedIncident.aiTriageSummary}"
                </p>
              )}

              {/* DISPATCH ACTION CONTROLS */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Command Dispatch Actions:
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateStatus(
                      selectedIncident.id, 
                      'dispatched', 
                      RESCUE_UNITS_CATALOG[0]
                    )}
                    className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch Boat Alpha</span>
                  </button>

                  <button
                    onClick={() => onUpdateStatus(selectedIncident.id, 'cleared')}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Rescued</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-slate-400 text-xs">
              <MapPin className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">Select any marker on the map</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Click a pin to inspect occupants, water depth, required equipment, and dispatch rescue teams.
              </p>
            </div>
          )}

          {/* 2. GEMINI 3.7 FLASH AI TRIAGE ASSISTANT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm">
                  Gemini AI Disaster Triage Parser
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Gemini 3.7 Flash
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Paste raw chaotic citizen text, radio transcripts, or SMS logs. The AI automatically parses urgency (1-5), vulnerable occupants, and required gear.
            </p>

            <textarea
              rows={3}
              value={rawDistressInput}
              onChange={(e) => setRawDistressInput(e.target.value)}
              placeholder="e.g. 'Tulog pa si lola tapos lampas tao na tubig sa Tumana Purok 3 may hika pa yung pamangkin ko wala kaming bangka tulong po'"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
            />

            {/* Quick Test Distress Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] text-slate-400">
              <span className="text-slate-500 shrink-0">Try preset:</span>
              <button
                onClick={() => setRawDistressInput("Trapped on roof with 2-month infant and senior grandmother. Water rising fast near riverbank, need rubber boat and milk.")}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
              >
                Roof Flood + Baby
              </button>
              <button
                onClick={() => setRawDistressInput("Compound fracture on right leg after roof collapsed, heavy bleeding in community chapel, need stretcher immediately.")}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
              >
                Trauma Fracture
              </button>
            </div>

            <button
              onClick={handleRunAiTriage}
              disabled={isAiTriaging || !rawDistressInput.trim()}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                isAiTriaging || !rawDistressInput.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white ring-2 ring-indigo-500/40 active:scale-95'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiTriaging ? 'animate-spin' : ''}`} />
              <span>{isAiTriaging ? 'Analyzing with Gemini...' : 'Analyze & Extract Triage Priority'}</span>
            </button>

            {/* AI Result Card */}
            {aiTriageResult && (
              <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-3 space-y-2 text-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Assessment: Priority {aiTriageResult.urgencyLevel}/5
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">{aiTriageResult.category}</span>
                </div>

                <p className="text-slate-300 text-[11px]">
                  {aiTriageResult.triageSummary}
                </p>

                <div className="flex flex-wrap gap-1">
                  {aiTriageResult.requiredResources.map((r, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] border border-indigo-800">
                      {r}
                    </span>
                  ))}
                </div>

                <button
                  onClick={handleApplyAiTicketToMap}
                  className="w-full mt-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Pin Directly onto Command Map</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
