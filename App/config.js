import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, Platform} from 'react-native';

// Production URL (Railway)
const RAILWAY_URL = 'https://pythonbackend-production-0ee2.up.railway.app';
const LOCAL_URL = Platform.select({
  ios: 'http://127.0.0.1:8000',
  android: 'http://10.0.2.2:8000',
});

export const BASE_URL = RAILWAY_URL;
export const FOODTRUCKS_ENDPOINT = '/api/foodtrucks/schedule';

export const getApiConfig = () => ({
  BASE_URL: RAILWAY_URL,
  ENDPOINTS: {
    USER_DATA: '/api/userdata/registration',
    SCHEDULE: FOODTRUCKS_ENDPOINT,
  },
});
