// Device Fingerprinting Logic for Phase 1
// In a real app, we would use expo-device, expo-application, and react-native-device-info

export const generateDeviceHash = () => {
  // Mock hashing of device characteristics (OS, Model, Screen Res, etc.)
  const mockCharacteristics = "iOS-iPhone14,2-1170x2532-15.4";
  
  // Simple deterministic hash for hackathon demo
  let hash = 0;
  for (let i = 0; i < mockCharacteristics.length; i++) {
    const char = mockCharacteristics.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `DEVICE-HASH-${Math.abs(hash).toString(16).toUpperCase()}`;
};

export const deviceSecurityContext = {
  isJailbroken: false,
  isVirtualCamera: false,
  deviceHash: generateDeviceHash(),
  trustScore: 85 // Starts at 85
};
