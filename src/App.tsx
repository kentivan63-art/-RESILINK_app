import React, { useState, useEffect } from 'react';
import { NavigationHeader } from './components/NavigationHeader';
import { CitizenSosView } from './components/CitizenSosView';
import { BarangayScoutView } from './components/BarangayScoutView';
import { CommandMapView } from './components/CommandMapView';
import { DefenseBlueprintModal } from './components/DefenseBlueprintModal';
import { HouseholdProfileModal } from './components/HouseholdProfileModal';
import { Incident, NetworkMode, DispatchedUnit } from './types';
import { INITIAL_INCIDENTS } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'citizen_sos' | 'scout_mode' | 'command_map' | 'defense_blueprint'>('citizen_sos');
  const [networkMode, setNetworkMode] = useState<NetworkMode>('full_online');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Incidents Store
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const local = localStorage.getItem('resilink_live_incidents');
    if (local) {
      try { return JSON.parse(local); } catch (e) { /* fallback */ }
    }
    return INITIAL_INCIDENTS;
  });

  // Dynamic User Coords (Loaded from localStorage or acquired via browser Geolocation)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; addressText: string } | null>(() => {
    const savedLat = localStorage.getItem('resilink_user_lat');
    const savedLng = localStorage.getItem('resilink_user_lng');
    const savedAddr = localStorage.getItem('resilink_user_address');
    if (savedLat && savedLng) {
      return {
        lat: parseFloat(savedLat),
        lng: parseFloat(savedLng),
        addressText: savedAddr || `GPS Pin [${parseFloat(savedLat).toFixed(4)}, ${parseFloat(savedLng).toFixed(4)}]`,
      };
    }
    return null;
  });

  // Automatically query device GPS hardware on app load if not set
  useEffect(() => {
    if (!userCoords && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            addressText: `Live GPS: Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`,
          };
          setUserCoords(coords);
          localStorage.setItem('resilink_user_lat', coords.lat.toString());
          localStorage.setItem('resilink_user_lng', coords.lng.toString());
          localStorage.setItem('resilink_user_address', coords.addressText);
        },
        (_err) => {
          // If user denies GPS or running in restricted iframe, use default location
          const fallback = {
            lat: 14.6349,
            lng: 121.0964,
            addressText: "Block 4 Lot 12, Riverside Subd, Brgy Tumana",
          };
          setUserCoords(fallback);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else if (!userCoords) {
      setUserCoords({
        lat: 14.6349,
        lng: 121.0964,
        addressText: "Block 4 Lot 12, Riverside Subd, Brgy Tumana",
      });
    }
  }, []);

  // Save updated coords to localStorage
  useEffect(() => {
    if (userCoords) {
      localStorage.setItem('resilink_user_lat', userCoords.lat.toString());
      localStorage.setItem('resilink_user_lng', userCoords.lng.toString());
    }
  }, [userCoords]);

  // Save incidents to localStorage as persistent offline client cache
  useEffect(() => {
    localStorage.setItem('resilink_live_incidents', JSON.stringify(incidents));
  }, [incidents]);

  // Handler to clear sample mock incidents so users can see only their live SOS tickets
  const handleClearMockData = () => {
    if (confirm('Clear pre-loaded simulation incidents and display only your live SOS beacons?')) {
      setIncidents([]);
      localStorage.setItem('resilink_live_incidents', JSON.stringify([]));
    }
  };

  // Fetch initial incidents from backend if in full_online mode
  useEffect(() => {
    if (networkMode === 'full_online') {
      fetch('/api/incidents')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.incidents?.length > 0) {
            setIncidents(data.incidents);
          }
        })
        .catch((err) => console.log('Using local offline incidents cache:', err));
    }
  }, [networkMode]);

  // Send SOS
  const handleSendSos = async (newInc: Partial<Incident>) => {
    const fullInc = newInc as Incident;
    setIncidents((prev) => [fullInc, ...prev]);

    if (networkMode === 'full_online') {
      try {
        await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullInc),
        });
      } catch (e) {
        console.error('Failed to post incident to server, stored locally:', e);
      }
    }
  };

  // Sync batch from Scout
  const handleSyncBatch = async (batch: Incident[]) => {
    setIncidents((prev) => {
      const updated = [...prev];
      for (const item of batch) {
        const idx = updated.findIndex((i) => i.id === item.id);
        if (idx >= 0) {
          updated[idx] = { ...item, syncStatus: 'synced_to_hq' };
        } else {
          updated.unshift({ ...item, syncStatus: 'synced_to_hq' });
        }
      }
      return updated;
    });

    if (networkMode !== 'total_blackout_mesh') {
      try {
        await fetch('/api/incidents/batch-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidents: batch }),
        });
      } catch (e) {
        console.error('Failed to batch sync to server:', e);
      }
    }
  };

  // Update Status / Dispatch
  const handleUpdateStatus = (id: string, newStatus: any, unit?: DispatchedUnit) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          return {
            ...inc,
            status: newStatus,
            dispatchedUnit: unit || inc.dispatchedUnit,
          };
        }
        return inc;
      })
    );

    if (networkMode === 'full_online') {
      fetch(`/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, dispatchedUnit: unit }),
      }).catch((e) => console.log('Offline patch locally applied:', e));
    }
  };

  // Add Incident from Gemini AI Triage
  const handleAddIncidentFromAi = (incident: Incident) => {
    setIncidents((prev) => [incident, ...prev]);
    if (networkMode === 'full_online') {
      fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      }).catch((e) => console.log('Offline add locally applied:', e));
    }
  };

  const activeCount = incidents.filter((i) => i.status !== 'cleared').length;
  const criticalCount = incidents.filter((i) => i.urgencyLevel === 5 && i.status !== 'cleared').length;
  
  const offlineScoutQueue = (() => {
    try {
      const q = localStorage.getItem('resilink_scout_queue');
      return q ? JSON.parse(q).filter((i: any) => i.syncStatus === 'local_only').length : 0;
    } catch {
      return 0;
    }
  })();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      
      {/* Universal Navigation & Telemetry Header */}
      <NavigationHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        networkMode={networkMode}
        setNetworkMode={setNetworkMode}
        activeIncidentsCount={activeCount}
        criticalCount={criticalCount}
        offlineQueueCount={offlineScoutQueue}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'citizen_sos' && (
          <CitizenSosView
            networkMode={networkMode}
            onSendSos={handleSendSos}
            userCoords={userCoords}
            setUserCoords={setUserCoords}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
          />
        )}

        {activeTab === 'scout_mode' && (
          <BarangayScoutView
            networkMode={networkMode}
            onSyncBatch={handleSyncBatch}
            userCoords={userCoords}
          />
        )}

        {activeTab === 'command_map' && (
          <CommandMapView
            incidents={incidents}
            onUpdateStatus={handleUpdateStatus}
            onAddIncidentFromAi={handleAddIncidentFromAi}
            userCoords={userCoords}
            onClearMockData={handleClearMockData}
          />
        )}

        {activeTab === 'defense_blueprint' && (
          <DefenseBlueprintModal />
        )}
      </main>

      {/* Offline Household Profile Setup Modal */}
      <HouseholdProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userCoords={userCoords}
        setUserCoords={setUserCoords}
      />

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ResiLink Community Disaster & First-Response Triage System • Capstone Project Prototype</span>
          <span className="font-mono text-slate-400">Zero-Cost ($0) Open-Source Stack: Leaflet, PWA, Web Audio SAR, Gemini 3.7 Flash</span>
        </div>
      </footer>

    </div>
  );
}
