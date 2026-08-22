import React from 'react';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  SignalHigh, 
  SignalLow, 
  ShieldAlert, 
  Users, 
  MapPin, 
  BookOpen, 
  Activity,
  BatteryCharging
} from 'lucide-react';
import { NetworkMode } from '../types';

interface NavigationHeaderProps {
  activeTab: 'citizen_sos' | 'scout_mode' | 'command_map' | 'defense_blueprint';
  setActiveTab: (tab: 'citizen_sos' | 'scout_mode' | 'command_map' | 'defense_blueprint') => void;
  networkMode: NetworkMode;
  setNetworkMode: (mode: NetworkMode) => void;
  activeIncidentsCount: number;
  criticalCount: number;
  offlineQueueCount: number;
  onOpenProfileModal?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  setActiveTab,
  networkMode,
  setNetworkMode,
  activeIncidentsCount,
  criticalCount,
  offlineQueueCount,
  onOpenProfileModal,
}) => {
  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Brand & Live Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-lg shadow-rose-950/50">
              <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[10px] font-bold text-white items-center justify-center">
                    {criticalCount}
                  </span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  RESILINK <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-medium">DISASTER TRIAGE</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Hyper-Local First-Response & Zero-Cost Micro-Disaster Network
              </p>
            </div>
          </div>

          {/* Quick Network Simulator for Mobile */}
          <div className="md:hidden flex items-center gap-1.5">
            <button
              onClick={() => setNetworkMode(
                networkMode === 'full_online' ? 'degraded_2g' : networkMode === 'degraded_2g' ? 'total_blackout_mesh' : 'full_online'
              )}
              className={`px-2 py-1 rounded text-xs font-mono font-medium flex items-center gap-1 border ${
                networkMode === 'full_online'
                  ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-400'
                  : networkMode === 'degraded_2g'
                  ? 'bg-amber-950/60 border-amber-600/40 text-amber-400'
                  : 'bg-rose-950/60 border-rose-600/40 text-rose-400 animate-pulse'
              }`}
              title="Click to toggle simulated network condition"
            >
              {networkMode === 'full_online' && <Wifi className="w-3 h-3" />}
              {networkMode === 'degraded_2g' && <SignalLow className="w-3 h-3" />}
              {networkMode === 'total_blackout_mesh' && <WifiOff className="w-3 h-3" />}
              <span className="uppercase">{networkMode === 'full_online' ? '5G' : networkMode === 'degraded_2g' ? '2G' : 'MESH'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            id="nav-tab-citizen-sos"
            onClick={() => setActiveTab('citizen_sos')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'citizen_sos'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 ring-1 ring-rose-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>1-Tap SOS Beacon</span>
          </button>

          <button
            id="nav-tab-scout-mode"
            onClick={() => setActiveTab('scout_mode')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0 relative ${
              activeTab === 'scout_mode'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40 ring-1 ring-amber-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Barangay Scout (Offline)</span>
            {offlineQueueCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                {offlineQueueCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-command-map"
            onClick={() => setActiveTab('command_map')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'command_map'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Command Map & AI Triage</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
              {activeIncidentsCount}
            </span>
          </button>

          <button
            id="nav-tab-defense-blueprint"
            onClick={() => setActiveTab('defense_blueprint')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'defense_blueprint'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 ring-1 ring-emerald-400/50'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Capstone Defense</span>
          </button>

          {onOpenProfileModal && (
            <button
              id="nav-btn-profile-setup"
              onClick={onOpenProfileModal}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 text-indigo-300 hover:text-white bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 transition-all shrink-0"
              title="Edit Family Representative, Address & GPS Coordinates"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Set My Profile</span>
            </button>
          )}
        </nav>

        {/* Network & Hardware Telemetry Simulator (Desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-sans">Simulate Network:</span>
          </div>

          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setNetworkMode('full_online')}
              className={`px-2.5 py-1 text-xs font-mono rounded-l-md transition-colors ${
                networkMode === 'full_online'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
              title="Full 4G/5G/Fiber Active"
            >
              5G Full
            </button>
            <button
              onClick={() => setNetworkMode('degraded_2g')}
              className={`px-2.5 py-1 text-xs font-mono border-x border-slate-800 transition-colors ${
                networkMode === 'degraded_2g'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
              title="Degraded 2G SMS Shortcode Fallback"
            >
              2G (SMS)
            </button>
            <button
              onClick={() => setNetworkMode('total_blackout_mesh')}
              className={`px-2.5 py-1 text-xs font-mono rounded-r-md transition-colors ${
                networkMode === 'total_blackout_mesh'
                  ? 'bg-rose-600 text-white font-bold animate-pulse'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
              title="0% Cell Signal - Mode C Offline BLE/Mesh Beacon"
            >
              Mode C (Mesh)
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
