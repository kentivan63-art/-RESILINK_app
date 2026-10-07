import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  WifiOff, 
  Radio, 
  DollarSign, 
  Cpu, 
  HelpCircle, 
  CheckCircle, 
  ArrowRight,
  Layers,
  Smartphone,
  MapPin,
  Sparkles
} from 'lucide-react';

export const DefenseBlueprintModal: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'ladder' | 'ble_tech' | 'zero_cost' | 'panel_qa'>('ladder');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Blueprint Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                CAPSTONE DEFENSE & ARCHITECTURE
              </span>
              <span className="text-xs text-slate-400 font-mono">Academic & Technical Blueprint</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Engineering Defense & System Justification
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Comprehensive reference for panel presentations, architecture diagrams, and tough technical defenses.
            </p>
          </div>
        </div>

        {/* Blueprint Navigation Tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveSection('ladder')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSection === 'ladder'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4-Tier Degradation Ladder</span>
          </button>

          <button
            onClick={() => setActiveSection('ble_tech')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSection === 'ble_tech'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>BLE Without Pairing Tech</span>
          </button>

          <button
            onClick={() => setActiveSection('zero_cost')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSection === 'zero_cost'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>$0 Zero-Cost Tech Stack</span>
          </button>

          <button
            onClick={() => setActiveSection('panel_qa')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSection === 'panel_qa'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Panel Defense Q&A</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 4-TIER DEGRADATION LADDER */}
      {activeSection === 'ladder' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              The 4-Tier Graceful Degradation Architecture
            </h3>
            <p className="text-xs text-slate-300">
              Disasters destroy infrastructure in stages. Most apps fail completely when 4G goes down. Our architecture downshifts across 4 independent layers:
            </p>

            <div className="space-y-3">
              
              {/* Tier 1 */}
              <div className="bg-slate-950 border border-emerald-500/40 p-4 rounded-xl flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/40 shrink-0">
                  T1
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">Tier 1: Full High-Speed Online Mode (4G / 5G / Fiber)</h4>
                    <span className="px-2 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">100% Online</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Live geospatial map, real-time Gemini 3.7 Flash triage extraction, instant dispatch routing, and multi-user synchronization.
                  </p>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="bg-slate-950 border border-amber-500/40 p-4 rounded-xl flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/40 shrink-0">
                  T2
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">Tier 2: Degraded 2G / 1-Bar Cellular Mode</h4>
                    <span className="px-2 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">Micro-SMS Bridge</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    When mobile data fails to load web pages, the system downshifts to <strong>85-byte compressed SMS shortcodes</strong> (<code className="text-amber-300 font-mono text-[11px]">#SOS*14.63,121.09*P5*ASTHMA#</code>) that penetrate congested towers via the 2G signaling channel.
                  </p>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="bg-slate-950 border border-rose-500/40 p-4 rounded-xl flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center border border-rose-500/40 shrink-0">
                  T3
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">Tier 3: Total Telecom Blackout (Towers Dead / 0% Signal)</h4>
                    <span className="px-2 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">BLE Unpaired Beacon</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Phones emit 31-byte Bluetooth Low Energy advertising packets continuously. Passing responders or boat scouts capture these beacons within 30-50m with <strong>zero manual pairing or confirmation</strong>.
                  </p>
                </div>
              </div>

              {/* Tier 4 */}
              <div className="bg-slate-950 border border-indigo-500/40 p-4 rounded-xl flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/40 shrink-0">
                  T4
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">Tier 4: Zero Device / Dead Battery / Senior Citizen</h4>
                    <span className="px-2 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">Barangay Scout Proxy</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    A single Barangay Tanod or youth volunteer walks or paddles through the zone, logging stranded families into their offline PWA cache. Physical shouting/whistling is converted into digital triage tickets.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: BLE WITHOUT PAIRING TECHNICAL DETAILS */}
      {activeSection === 'ble_tech' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            How Bluetooth Works Without Manual Pairing (BLE Advertising)
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <h4 className="font-bold text-emerald-400 text-sm">The Difference: Bluetooth Classic vs. BLE Advertising</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40">
                <span className="font-bold text-rose-300 block mb-1">❌ Bluetooth Classic (Pairing)</span>
                <p className="text-slate-400">
                  Requires 2-way handshakes, PIN confirmation, popup approval, and sustained connection. Fails during emergencies and drains battery in 2 hours.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
                <span className="font-bold text-emerald-300 block mb-1">✅ BLE Advertising (Beacons)</span>
                <p className="text-slate-400">
                  One-way broadcast into the open air (like a radio tower). Any scanning device within 30-50m catches the 31-byte packet without asking permission.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="font-bold text-slate-300 block mb-1">Hardware Compatibility:</span>
              <p className="text-slate-400">
                Supported on every Android phone since <strong>Android 5.0 Lollipop (2014)</strong>. This means 99.8% of low-cost phones in the Philippines (Realme, Transsion/Infinix, Tecno, Xiaomi, Samsung) support this natively at zero cost.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: $0 ZERO-COST TECH STACK */}
      {activeSection === 'zero_cost' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            $0 Zero-Cost Production Stack
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">🗺️ Maps & GIS ($0)</span>
              <p className="text-slate-400">
                Uses <strong>Leaflet.js + OpenStreetMap standard tiles</strong> instead of paid Google Maps Platform. Unlimited map tile requests with zero credit card or billing required.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">⚡ AI Triage Model ($0)</span>
              <p className="text-slate-400">
                Uses <strong>Gemini 3.7 Flash</strong> API (generous free tier) to parse unstructured distress calls, extract urgency 1-5, and identify required medical/boat resources.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">📱 Progressive Web App ($0)</span>
              <p className="text-slate-400">
                Built with <strong>React + IndexedDB + Service Workers</strong>. Works offline in any browser without Google Play Store developer fees ($25) or Apple Developer fees ($99/yr).
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">🔊 Audio Whistle Synthesizer ($0)</span>
              <p className="text-slate-400">
                Utilizes the <strong>Web Audio API (OscillatorNode)</strong> to produce a 3000Hz triangle wave search-and-rescue acoustic whistle directly from the phone speaker.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: CAPSTONE PANEL DEFENSE Q&A */}
      {activeSection === 'panel_qa' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            Panel Q&A Defense Cheat Sheet
          </h3>

          <div className="space-y-3 text-xs">
            
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">
                Q1: "What if someone's battery dies or they have a $10 keypad phone?"
              </span>
              <p className="text-slate-300">
                <strong>Answer:</strong> "That is why the system implements the <strong>Tier 4 Barangay Proxy Scout Model</strong>. In real Philippine and Southeast Asian disasters, only 1 barangay tanod or youth leader per street needs a device. They survey the block and log trapped residents offline. The victims do not need their own active smartphones."
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">
                Q2: "How do you stop fake SOS distress calls or prank reports?"
              </span>
              <p className="text-slate-300">
                <strong>Answer:</strong> "Through three verification layers: (1) <strong>Spatial Clustering:</strong> Multiple independent reports within a 50m radius automatically increase confidence. (2) <strong>Scout Role Verification:</strong> Verified Barangay Tanods have priority badges that skip unverified queues. (3) <strong>Device Telemetry:</strong> GPS accuracy, timestamp, and battery levels are captured to filter bot attacks."
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">
                Q3: "Why not just use Facebook or Viber groups?"
              </span>
              <p className="text-slate-300">
                <strong>Answer:</strong> "Social media lacks spatial coordinates, causes duplicate rescue trips ('rescue cannibalization'), and offers zero status lifecycle tracking. A Facebook post has no indicator showing if someone was already rescued 2 hours ago. Our system tracks live status: <em>Reported → Dispatched → Rescued</em>."
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
