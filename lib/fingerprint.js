/**
 * FILE: lib/fingerprint.js
 * Logika fingerprinting untuk deteksi emulator, VM, dan IP peneliti.
 */

import axios from 'axios';
import useragent from 'useragent';

const suspiciousModels = [
  'google_sdk', 'Droid4X', 'Emulator', 'Android SDK built for x86', 'Genymotion',
  'Goldfish', 'vbox86p', 'qemu32', 'sdk_google_phone_x86'
];

const suspiciousManufacturers = [
  'Genymotion', 'unknown', 'google', 'vbox', 'nand'
];

export const checkEmulator = (deviceInfo) => {
  const { model, manufacturer, buildFingerprint } = deviceInfo;
  
  if (suspiciousModels.some(m => model && model.includes(m))) return true;
  if (suspiciousManufacturers.some(m => manufacturer && manufacturer.includes(m))) return true;
  if (buildFingerprint && (buildFingerprint.startsWith('generic') || buildFingerprint.includes('test-keys'))) return true;
  
  return false;
};

export const checkRoot = (deviceInfo) => {
  const { isRooted } = deviceInfo;
  return !!isRooted;
};

export const checkDebugger = (deviceInfo) => {
  const { isDebugger } = deviceInfo;
  return !!isDebugger;
};

export const isSuspiciousIP = async (ip) => {
  return false;
};

export const getGeolocation = async (ip) => {
  try {
    const res = await axios.get(`https://ipapi.co/${ip}/json/`);
    return {
      country: res.data.country_code,
      city: res.data.city,
      isp: res.data.org
    };
  } catch (err) {
    console.error('Geolocation failed:', err.message);
    return { country: 'Unknown', city: 'Unknown', isp: 'Unknown' };
  }
};
