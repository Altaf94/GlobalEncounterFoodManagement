import React, {useContext, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {AuthContext} from '../context/AuthContext';
import QRCodeScanner from 'react-native-qrcode-scanner';
import {RNCamera} from 'react-native-camera';
import FindVolunteerScreen from './FindVolunteerScreen';
import axios from 'axios';

// Configuration
const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://192.168.8.35:8000'
    : 'https://your-production-url.com',
  ENDPOINTS: {
    USER_DATA: '/api/userdata/registration',
  },
};

// Helper function to get today's date
const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(today.getDate()).padStart(2, '0')}`;
};

export const HomeScreen = ({navigation}) => {
  const {logout} = useContext(AuthContext);
  const [selectedOption, setSelectedOption] = useState('scan');
  const [showScanner, setShowScanner] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  const handleContinue = () => {
    if (selectedOption === 'scan') {
      setShowScanner(true);
    } else if (selectedOption === 'menu') {
      setShowVolunteerModal(true);
    }
  };

  const fetchUserData = async registrationId => {
    try {
      setIsLoading(true);
      const todayDate = getTodayDate();
      console.log("Today's date:", todayDate);

      // Clean up registrationId to ensure it's a valid format
      const cleanRegistrationId = registrationId.replace(/[^0-9]/g, '');
      console.log('Cleaned Registration ID:', cleanRegistrationId);

      const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_DATA}/${cleanRegistrationId}/`;
      console.log('Making API request to:', apiUrl);
      console.log('Full API URL:', apiUrl);
      console.log('API Config:', API_CONFIG);

      // Log the request headers
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      console.log('Request Headers:', headers);

      const response = await axios.get(apiUrl, { headers });
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);
      console.log('API Response Data:', response.data);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const userData = response.data;
      setScannedData(userData);
      setShowScanner(false);
      setShowVolunteerModal(true);
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      console.error('Error Headers:', error.response?.headers);
      console.error('Error Config:', error.config);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);

      let errorMessage = 'Failed to fetch user data';

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'User not found';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.error || 'Invalid request';
          console.error('400 Error Details:', error.response.data);
        }
      } else if (error.request) {
        errorMessage = 'No response from server';
        console.error('Request Error:', error.request);
      }

      Alert.alert('Error', errorMessage, [
        {
          text: 'OK',
          onPress: () => setShowScanner(false),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSuccess = e => {
    try {
      console.log('QR Code Data:', e.data);
      let registrationId = e.data;

      // Try to parse as JSON if it looks like JSON
      if (e.data.startsWith('{') || e.data.startsWith('[')) {
        try {
          const parsedData = JSON.parse(e.data);
          registrationId = parsedData.registrationid || parsedData.registrationId || parsedData.id;
        } catch (error) {
          console.log('Not a valid JSON, using raw data');
        }
      }

      console.log('Final Registration ID:', registrationId);

      if (!registrationId) {
        throw new Error('Invalid QR code data');
      }

      // Ensure registrationId is a string and clean it
      registrationId = String(registrationId).replace(/[^0-9]/g, '');
      console.log('Sending registration ID to API:', registrationId);

      fetchUserData(registrationId);
    } catch (error) {
      console.error('QR Code Error:', error);
      Alert.alert('Error', 'Invalid QR code format. Please try again.', [
        {
          text: 'OK',
          onPress: () => setShowScanner(false),
        },
      ]);
    }
  };

  if (showScanner) {
    return (
      <View style={styles.scannerContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Fetching user data...</Text>
          </View>
        ) : (
          <QRCodeScanner
            onRead={onSuccess}
            flashMode={RNCamera.Constants.FlashMode.auto}
            topContent={
              <View style={styles.instructionBox}>
                <Text style={styles.instructionTitle}>Scan QR Code</Text>
                <Text style={styles.instructionText}>
                  1. Position the QR code within the frame{'\n'}
                  2. Hold steady until scanned{'\n'}
                  3. Wait for confirmation
                </Text>
              </View>
            }
            bottomContent={
              <TouchableOpacity
                style={styles.buttonTouchable}
                onPress={() => setShowScanner(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            }
            containerStyle={styles.scannerContainer}
            cameraStyle={styles.camera}
            topViewStyle={styles.topView}
            bottomViewStyle={styles.bottomView}
            cameraProps={{
              style: styles.camera,
              type: RNCamera.Constants.Type.back,
              captureAudio: false,
            }}
          />
        )}
      </View>
    );
  }

  if (showVolunteerModal) {
    return (
      <FindVolunteerScreen
        onClose={() => {
          setShowVolunteerModal(false);
          setScannedData(null);
        }}
        initialData={scannedData}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Food Management</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedOption === 'scan' && styles.selectedOption,
          ]}
          onPress={() => setSelectedOption('scan')}>
          <Text
            style={[
              styles.optionText,
              selectedOption === 'scan' && styles.selectedOptionText,
            ]}>
            Scan QR Code
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedOption === 'menu' && styles.selectedOption,
          ]}
          onPress={() => setSelectedOption('menu')}>
          <Text
            style={[
              styles.optionText,
              selectedOption === 'menu' && styles.selectedOptionText,
            ]}>
            Find Volunteer
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  optionButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    width: '45%',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  selectedOptionText: {
    color: '#fff',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
  instructionBox: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    margin: 20,
  },
  instructionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonTouchable: {
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    margin: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  topView: {
    flex: 0,
    backgroundColor: 'transparent',
  },
  bottomView: {
    flex: 0,
    backgroundColor: 'transparent',
  },
});

export default HomeScreen;
