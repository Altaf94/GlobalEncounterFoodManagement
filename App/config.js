// config.js
// Configuration
// Configuration
// ... existing code ...
import { Platform } from 'react-native';
import { getIpAddress } from 'react-native-network-info';

// Default configuration
const DEFAULT_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    SCHEDULE: '/api/foodtrucks/schedule',
    USER_DATA: '/api/userdata/registration',
  },
};

// Function to get the correct local IP
const getLocalIp = async () => {
  try {
    if (Platform.OS === 'android') {
      // For Android, we need to use the computer's IP address
      return '192.168.8.35'; // Replace with your computer's IP address
    } else if (Platform.OS === 'ios') {
      // For iOS, we can use localhost
      return 'localhost';
    }
  } catch (error) {
    console.error('Error getting local IP:', error);
    return 'localhost';
  }
};

// Function to get the API configuration
export const getApiConfig = async () => {
  const localIp = await getLocalIp();
  return {
    BASE_URL: `http://${localIp}:8000`,
    ENDPOINTS: DEFAULT_CONFIG.ENDPOINTS,
  };
};

// ... existing code ...
// ... existing code ...
// ... existing code ...

export default DEFAULT_CONFIG;
