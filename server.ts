import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory mock persistent database for active emergency incidents
export interface IncidentRecord {
  id: string;
  timestamp: number;
  source: "citizen_sos" | "scout_proxy" | "sms_gateway" | "ble_relay";
  reporterName?: string;
  reporterContact?: string;
  category: "trapped" | "medical" | "supplies" | "hazard" | "evacuation";
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  location: {
    lat: number;
    lng: number;
    addressText: string;
    barangay?: string;
    accuracyMeters?: number;
  };
  occupants: {
    total: number;
    seniors: number;
    infants: number;
    injured: number;
    specialConditions: string[];
  };
  hazards: {
    waterLevelMeters?: number;
    structuralDamage?: "none" | "partial" | "collapsed";
    fireActive?: boolean;
    powerLinesDown?: boolean;
  };
  requiredResources: string[];
  status: "reported" | "triaged" | "dispatched" | "en_route" | "rescued" | "cleared";
  dispatchedUnit?: {
    unitId: string;
    unitName: string;
    vehicleType: string;
    etaMinutes?: number;
  };
  notes: string;
  aiTriageSummary?: string;
  smsPayload?: string;
  bleBroadcastCode?: string;
  syncStatus: "local_only" | "relayed" | "synced_to_hq";
}

// Initial realistic disaster scenario incidents (centered around vulnerable river basin district)
let incidentsStore: IncidentRecord[] = [
  {
    id: "INC-2026-8801",
    timestamp: Date.now() - 1000 * 60 * 25, // 25 mins ago
    source: "citizen_sos",
    reporterName: "Maria Santos",
    reporterContact: "+63 917 555 0192",
    category: "trapped",
    urgencyLevel: 5,
    location: {
      lat: 14.6349,
      lng: 121.0964,
      addressText: "Block 4 Lot 12, Riverside Subd, Brgy Tumana",
      barangay: "Tumana",
      accuracyMeters: 8,
    },
    occupants: {
      total: 3,
      seniors: 1,
      infants: 1,
      injured: 0,
      specialConditions: ["Child with active asthma, no inhaler", "Senior wheelchair-bound"],
    },
    hazards: {
      waterLevelMeters: 2.1,
      structuralDamage: "partial",
      powerLinesDown: true,
    },
    requiredResources: ["Rubber Rescue Boat", "Pediatric Oxygen / Inhaler Kit", "Life Vests (x3)"],
    status: "dispatched",
    dispatchedUnit: {
      unitId: "UNIT-ALPHA-1",
      unitName: "BFP Water Rescue Alpha",
      vehicleType: "Rigid Inflatable Boat (RIB)",
      etaMinutes: 12,
    },
    notes: "Floodwater reached 2nd floor staircase. Child is wheezing. Battery low at 18%.",
    aiTriageSummary: "Critical Level 5: Rapidly rising 2.1m flood with pediatric respiratory distress and trapped mobility-impaired senior. Immediate boat extraction required.",
    smsPayload: "#SOS*14.6349,121.0964*P5*ASTHMA_SR*3P*W2.1*BAT18#",
    bleBroadcastCode: "BLE_SOS_8801_P5_BOAT_O2",
    syncStatus: "synced_to_hq",
  },
  {
    id: "INC-2026-8802",
    timestamp: Date.now() - 1000 * 60 * 45,
    source: "scout_proxy",
    reporterName: "Tanod Jun (Barangay Scout #04)",
    category: "medical",
    urgencyLevel: 4,
    location: {
      lat: 14.6382,
      lng: 121.1012,
      addressText: "San Jose St corner P. Burgos, Brgy Concepcion",
      barangay: "Concepcion Uno",
      accuracyMeters: 15,
    },
    occupants: {
      total: 4,
      seniors: 2,
      infants: 0,
      injured: 1,
      specialConditions: ["Compound leg fracture from collapsed awning"],
    },
    hazards: {
      waterLevelMeters: 0.9,
      structuralDamage: "partial",
    },
    requiredResources: ["Stretcher / Spine Board", "First Aid Trauma Kit", "4x4 High-Clearance Truck"],
    status: "triaged",
    notes: "Scout logged on foot. Patient stabilized on table above 0.9m floodwater. Bleeding controlled.",
    aiTriageSummary: "Urgent Level 4: Severe orthopedic trauma requiring rigid spinal immobilization and high-clearance transport.",
    smsPayload: "#PROXY*14.6382,121.1012*P4*FRACTURE*4P*W0.9*SCOUT04#",
    bleBroadcastCode: "BLE_SOS_8802_P4_STRETCH",
    syncStatus: "synced_to_hq",
  },
  {
    id: "INC-2026-8803",
    timestamp: Date.now() - 1000 * 60 * 10,
    source: "ble_relay",
    reporterName: "Anonymous Beacon",
    category: "supplies",
    urgencyLevel: 3,
    location: {
      lat: 14.6321,
      lng: 121.0928,
      addressText: "Zone 3 Chapel Roof Evac Point",
      barangay: "Malanday",
      accuracyMeters: 25,
    },
    occupants: {
      total: 14,
      seniors: 3,
      infants: 4,
      injured: 0,
      specialConditions: ["Dehydration risk, potable water exhausted"],
    },
    hazards: {
      waterLevelMeters: 1.5,
      structuralDamage: "none",
    },
    requiredResources: ["Potable Drinking Water (50L)", "Ready-to-Eat Relief Meals", "Flashlights / Radio"],
    status: "reported",
    notes: "Relayed via passing scout phone BLE hop. Group safely perched on elevated church terrace.",
    aiTriageSummary: "Priority Level 3: 14 stranded evacuees with zero drinking water. Safe from immediate submersion but urgent supply drop needed.",
    smsPayload: "#BLE_RELAY*14.6321,121.0928*P3*WATER_FOOD*14P#",
    bleBroadcastCode: "BLE_SOS_8803_P3_WATER_14P",
    syncStatus: "synced_to_hq",
  },
  {
    id: "INC-2026-8804",
    timestamp: Date.now() - 1000 * 60 * 60,
    source: "sms_gateway",
    reporterName: "SMS Ingest (+639201112233)",
    category: "hazard",
    urgencyLevel: 2,
    location: {
      lat: 14.6415,
      lng: 121.0988,
      addressText: "JP Rizal St near Mercury Drug",
      barangay: "Nangka",
      accuracyMeters: 30,
    },
    occupants: {
      total: 0,
      seniors: 0,
      infants: 0,
      injured: 0,
      specialConditions: [],
    },
    hazards: {
      powerLinesDown: true,
      structuralDamage: "partial",
    },
    requiredResources: ["Power Grid Isolation Crew", "Road Blockade Tape"],
    status: "dispatched",
    dispatchedUnit: {
      unitId: "MERALCO-CREW-7",
      unitName: "Meralco Emergency Line Crew",
      vehicleType: "Utility Bucket Truck",
      etaMinutes: 30,
    },
    notes: "Live electric wire submerged in ankle-deep puddle. Area blocked with chairs by locals.",
    aiTriageSummary: "Level 2 Civic Hazard: Submerged live electrical line posing electrocution threat to wading pedestrians.",
    smsPayload: "#SMS*14.6415,121.0988*P2*LIVE_WIRE*MERALCO#",
    syncStatus: "synced_to_hq",
  },
];

// Lazy Gemini client helper
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAiClient && process.env.GEMINI_API_KEY) {
    genAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

// API: Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now(), incidentsCount: incidentsStore.length });
});

// API: Get all incidents
app.get("/api/incidents", (_req: Request, res: Response) => {
  res.json({ success: true, incidents: incidentsStore });
});

// API: Create new incident (SOS, Scout, SMS bridge)
app.post("/api/incidents", (req: Request, res: Response) => {
  const newIncident: IncidentRecord = {
    id: req.body.id || `INC-${Date.now().toString().slice(-6)}`,
    timestamp: req.body.timestamp || Date.now(),
    source: req.body.source || "citizen_sos",
    reporterName: req.body.reporterName || "Direct SOS User",
    reporterContact: req.body.reporterContact || "",
    category: req.body.category || "trapped",
    urgencyLevel: req.body.urgencyLevel || 4,
    location: req.body.location || {
      lat: 14.635 + (Math.random() - 0.5) * 0.02,
      lng: 121.095 + (Math.random() - 0.5) * 0.02,
      addressText: "GPS Coordinates Captured",
      barangay: "Riverside District",
      accuracyMeters: 10,
    },
    occupants: req.body.occupants || {
      total: 1,
      seniors: 0,
      infants: 0,
      injured: 0,
      specialConditions: [],
    },
    hazards: req.body.hazards || {},
    requiredResources: req.body.requiredResources || ["Rescue Verification"],
    status: "reported",
    notes: req.body.notes || "1-Tap Panic Beacon Activated",
    aiTriageSummary: req.body.aiTriageSummary || "Emergency beacon logged directly by citizen.",
    smsPayload: req.body.smsPayload || `#SOS*${req.body.location?.lat?.toFixed(4)},${req.body.location?.lng?.toFixed(4)}*P${req.body.urgencyLevel || 4}#`,
    bleBroadcastCode: req.body.bleBroadcastCode || `BLE_SOS_${Date.now().toString().slice(-4)}`,
    syncStatus: "synced_to_hq",
  };

  incidentsStore.unshift(newIncident);
  res.status(201).json({ success: true, incident: newIncident });
});

// API: Batch sync from offline scout queues
app.post("/api/incidents/batch-sync", (req: Request, res: Response) => {
  const incomingList: IncidentRecord[] = req.body.incidents || [];
  let addedCount = 0;
  let updatedCount = 0;

  for (const item of incomingList) {
    const existingIndex = incidentsStore.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      incidentsStore[existingIndex] = {
        ...incidentsStore[existingIndex],
        ...item,
        syncStatus: "synced_to_hq",
      };
      updatedCount++;
    } else {
      incidentsStore.unshift({
        ...item,
        syncStatus: "synced_to_hq",
      });
      addedCount++;
    }
  }

  res.json({
    success: true,
    addedCount,
    updatedCount,
    totalIncidents: incidentsStore.length,
  });
});

// API: Update incident status / assign dispatch unit
app.patch("/api/incidents/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const index = incidentsStore.findIndex((i) => i.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: "Incident not found" });
    return;
  }

  incidentsStore[index] = {
    ...incidentsStore[index],
    ...req.body,
  };

  res.json({ success: true, incident: incidentsStore[index] });
});

// API: Delete / Clear incident
app.delete("/api/incidents/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  incidentsStore = incidentsStore.filter((i) => i.id !== id);
  res.json({ success: true, remaining: incidentsStore.length });
});

// API: AI-Powered Automated Triage Analyzer using Gemini 3.7 Flash
app.post("/api/triage/ai-parse", async (req: Request, res: Response) => {
  try {
    const { rawReportText, contextLocation } = req.body;

    if (!rawReportText || typeof rawReportText !== "string") {
      res.status(400).json({ success: false, error: "rawReportText is required." });
      return;
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback deterministic parsing if API key is not yet set
      const isCritical = /trap|drown|roof|chest|stroke|bleed|unconscious|asthma|baby/i.test(rawReportText);
      const isMed = /injur|fracture|wound|insulin|oxygen|dialysis|sick|elder/i.test(rawReportText);
      const isBoat = /flood|submerge|water|river|chest deep|neck deep|roof/i.test(rawReportText);

      const urgency: 1 | 2 | 3 | 4 | 5 = isCritical ? 5 : isMed ? 4 : isBoat ? 3 : 2;
      const requiredGear = [
        isBoat ? "Rubber Rescue Boat" : "4x4 Ground Vehicle",
        isMed ? "Medical First Aid / Oxygen Kit" : "Food & Clean Water Pack",
        "Life Vests",
      ];

      res.json({
        success: true,
        isAiGenerated: false,
        triageResult: {
          category: isCritical ? "trapped" : isMed ? "medical" : isBoat ? "trapped" : "supplies",
          urgencyLevel: urgency,
          urgencyReason: isCritical ? "Immediate life hazard / entrapment" : "Urgent medical/resource requirement",
          detectedOccupants: {
            total: 3,
            seniors: /senior|elder|lolo|lola|grandm/i.test(rawReportText) ? 1 : 0,
            infants: /baby|infant|child|bata/i.test(rawReportText) ? 1 : 0,
            injured: /injur|fractur|wound|bleed/i.test(rawReportText) ? 1 : 0,
            specialConditions: ["Extracted from narrative"],
          },
          requiredResources: requiredGear,
          triageSummary: `Automated assessment: Urgency Level ${urgency}. Requires ${requiredGear.join(", ")}.`,
          hazardWarnings: isBoat ? ["High Water Velocity", "Submerged Obstacles"] : [],
          recommendedAction: "Dispatch nearest available neighborhood response unit.",
        },
      });
      return;
    }

    // Call Gemini 3.7 Flash with structured JSON output
    const prompt = `You are an expert Disaster Triage & Emergency Response AI Coordinator.
Analyze the following chaotic citizen or field scout distress report from a disaster zone (such as severe flooding, typhoon, or landslide).
Extract precise structured triage categorization, urgency score (1 to 5), extracted vulnerabilities, and required rescue equipment.

Context Location: ${contextLocation || "Urban/Rural Flood Basin"}
Distress Message: "${rawReportText}"

Urgency Level Definition:
- 5: Critical / Immediate Life Threat (e.g. rising flood trapped on roof, drowning risk, severe acute medical trauma, pediatric respiratory distress, unconscious)
- 4: Urgent / Severe (e.g. serious injuries, fractures, chronic medical needs without meds like insulin/oxygen, water up to chest)
- 3: High Resource Need (e.g. stranded group safe from water but out of food/water, hypothermia risk)
- 2: Moderate Civic Hazard (e.g. live power line down, road blocked)
- 1: Minor (e.g. general inquiry, property damage without safety hazard)

Output valid JSON matching this schema:
{
  "category": "trapped" | "medical" | "supplies" | "hazard" | "evacuation",
  "urgencyLevel": 1 | 2 | 3 | 4 | 5,
  "urgencyReason": "string explanation",
  "detectedOccupants": {
    "total": number,
    "seniors": number,
    "infants": number,
    "injured": number,
    "specialConditions": ["string"]
  },
  "requiredResources": ["string", "string"],
  "triageSummary": "concise 2-sentence clinical/tactical triage summary for incident commanders",
  "hazardWarnings": ["string"],
  "recommendedAction": "immediate actionable step for rescue dispatcher"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            urgencyLevel: { type: Type.INTEGER },
            urgencyReason: { type: Type.STRING },
            detectedOccupants: {
              type: Type.OBJECT,
              properties: {
                total: { type: Type.INTEGER },
                seniors: { type: Type.INTEGER },
                infants: { type: Type.INTEGER },
                injured: { type: Type.INTEGER },
                specialConditions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["total", "seniors", "infants", "injured", "specialConditions"],
            },
            requiredResources: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            triageSummary: { type: Type.STRING },
            hazardWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendedAction: { type: Type.STRING },
          },
          required: [
            "category",
            "urgencyLevel",
            "urgencyReason",
            "detectedOccupants",
            "requiredResources",
            "triageSummary",
            "recommendedAction",
          ],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      isAiGenerated: true,
      triageResult: parsedJson,
    });
  } catch (error: any) {
    console.error("Error in AI triage parse:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to parse distress report" });
  }
});

// API: De-duplication and Spatial Clustering Analyzer
app.post("/api/triage/spatial-cluster", (req: Request, res: Response) => {
  const radiusMeters = req.body.radiusMeters || 50;
  const clusters: { center: { lat: number; lng: number }; incidentIds: string[]; totalPeople: number; highestUrgency: number }[] = [];

  // Simple haversine / spatial clustering
  for (const inc of incidentsStore) {
    let matchedCluster = clusters.find((c) => {
      const dLat = (c.center.lat - inc.location.lat) * 111000;
      const dLng = (c.center.lng - inc.location.lng) * 111000 * Math.cos((c.center.lat * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      return dist <= radiusMeters;
    });

    if (matchedCluster) {
      matchedCluster.incidentIds.push(inc.id);
      matchedCluster.totalPeople += inc.occupants.total || 1;
      matchedCluster.highestUrgency = Math.max(matchedCluster.highestUrgency, inc.urgencyLevel);
    } else {
      clusters.push({
        center: { lat: inc.location.lat, lng: inc.location.lng },
        incidentIds: [inc.id],
        totalPeople: inc.occupants.total || 1,
        highestUrgency: inc.urgencyLevel,
      });
    }
  }

  res.json({ success: true, clusters, totalIncidents: incidentsStore.length });
});

// Production & Vite Development integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Triage Hub Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
