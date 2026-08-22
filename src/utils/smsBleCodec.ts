import { Incident, OccupantsProfile } from '../types';

/**
 * Encodes an incident into an ultra-compact SMS payload (< 100 bytes)
 * Format: #SOS*LAT,LNG*P[1-5]*CODE*OCCUPANTS*WATER*BATTERY#
 * Example: #SOS*14.6349,121.0964*P5*ASTHMA_SR*3P*W2.1*BAT18#
 */
export function encodeSmsPayload(
  lat: number,
  lng: number,
  urgency: number,
  category: string,
  occupants: OccupantsProfile,
  waterLevel?: number,
  batteryLevel?: number
): string {
  const latStr = lat.toFixed(4);
  const lngStr = lng.toFixed(4);
  const urgStr = `P${urgency}`;
  
  const tags: string[] = [];
  if (occupants.seniors > 0) tags.push(`SR${occupants.seniors}`);
  if (occupants.infants > 0) tags.push(`INF${occupants.infants}`);
  if (occupants.injured > 0) tags.push(`INJ${occupants.injured}`);
  if (occupants.specialConditions.some(c => /asthma|breath|o2/i.test(c))) tags.push('O2');
  
  const tagStr = tags.length > 0 ? tags.join('_') : category.toUpperCase();
  const occStr = `${occupants.total}P`;
  const waterStr = waterLevel ? `W${waterLevel.toFixed(1)}` : 'W0';
  const batStr = batteryLevel ? `B${Math.round(batteryLevel)}` : 'B--';

  return `#SOS*${latStr},${lngStr}*${urgStr}*${tagStr}*${occStr}*${waterStr}*${batStr}#`;
}

/**
 * Encodes a BLE 31-byte Advertising Packet Payload
 * BLE Advertising Data payload is limited to 31 bytes in Bluetooth 4.0/5.0 specifications.
 */
export function encodeBleAdvertisement(lat: number, lng: number, urgency: number, id: string): string {
  const shortId = id.replace(/[^a-zA-Z0-9]/g, '').slice(-4);
  return `SOS-${urgency}:${lat.toFixed(3)},${lng.toFixed(3)}#${shortId}`;
}

/**
 * Creates an OS-native SMS invocation URI (works directly on Android and iOS browsers)
 */
export function generateSmsLink(emergencyNumber: string, payload: string): string {
  // Use standard sms: URI format compatible with Android & iOS
  const encodedBody = encodeURIComponent(payload);
  return `sms:${emergencyNumber}?body=${encodedBody}`;
}
