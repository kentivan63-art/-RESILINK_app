export type IncidentSource = 'citizen_sos' | 'scout_proxy' | 'sms_gateway' | 'ble_relay';

export type IncidentCategory = 'trapped' | 'medical' | 'supplies' | 'hazard' | 'evacuation';

export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

export type IncidentStatus = 'reported' | 'triaged' | 'dispatched' | 'en_route' | 'rescued' | 'cleared';

export type NetworkMode = 'full_online' | 'degraded_2g' | 'total_blackout_mesh';

export interface LocationData {
  lat: number;
  lng: number;
  addressText: string;
  barangay?: string;
  purok?: string;
  accuracyMeters?: number;
}

export interface OccupantsProfile {
  total: number;
  seniors: number;
  infants: number;
  injured: number;
  specialConditions: string[];
}

export interface HazardsData {
  waterLevelMeters?: number;
  structuralDamage?: 'none' | 'partial' | 'collapsed';
  fireActive?: boolean;
  powerLinesDown?: boolean;
}

export interface DispatchedUnit {
  unitId: string;
  unitName: string;
  vehicleType: string;
  etaMinutes?: number;
  assignedAt?: number;
  contactNumber?: string;
}

export interface Incident {
  id: string;
  timestamp: number;
  source: IncidentSource;
  reporterName?: string;
  reporterContact?: string;
  category: IncidentCategory;
  urgencyLevel: UrgencyLevel;
  location: LocationData;
  occupants: OccupantsProfile;
  hazards: HazardsData;
  requiredResources: string[];
  status: IncidentStatus;
  dispatchedUnit?: DispatchedUnit;
  notes: string;
  aiTriageSummary?: string;
  smsPayload?: string;
  bleBroadcastCode?: string;
  syncStatus: 'local_only' | 'relayed' | 'synced_to_hq';
}

export interface AiTriageResult {
  category: IncidentCategory;
  urgencyLevel: UrgencyLevel;
  urgencyReason: string;
  detectedOccupants: OccupantsProfile;
  requiredResources: string[];
  triageSummary: string;
  hazardWarnings: string[];
  recommendedAction: string;
}

export interface ClusterGroup {
  center: { lat: number; lng: number };
  incidentIds: string[];
  totalPeople: number;
  highestUrgency: UrgencyLevel;
  incidents: Incident[];
}
