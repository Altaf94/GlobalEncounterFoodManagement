import React, {useContext, useState, useEffect} from 'react';
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
import VolunteerRegistrationModal from '../Component/VolunteerRegistrationModal';
import axios from 'axios';
import { getApiConfig } from '../config';
import FindVolunteerScreen from './FindVolunteerScreen';

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
  const [apiConfig, setApiConfig] = useState(null);

  useEffect(() => {
    const setupApiConfig = async () => {
      const config = await getApiConfig();
      setApiConfig(config);
    };
    setupApiConfig();
  }, []);

  const handleContinue = () => {
    if (selectedOption === 'scan') {
      setShowScanner(true);
    } else if (selectedOption === 'menu') {
      setShowVolunteerModal(true);
    }
  };

  const fetchUserData = async registrationId => {
    if (!apiConfig) {
      Alert.alert('Error', 'API configuration not loaded');
      return;
    }

    try {
      setIsLoading(true);
      const todayDate = getTodayDate();
      console.log("Today's date:", todayDate);

      // Clean up registrationId to ensure it's a valid format
      const cleanRegistrationId = registrationId.replace(/[^0-9]/g, '');
      console.log('Cleaned Registration ID:', cleanRegistrationId);

      // Validate registration ID
      if (!cleanRegistrationId || cleanRegistrationId.length === 0) {
        throw new Error('Please enter a valid registration ID');
      }

      const apiUrl = `${apiConfig.BASE_URL}${apiConfig.ENDPOINTS.SCHEDULE}?registrationid=${cleanRegistrationId}&date=${todayDate}`;
      console.log('Making API request to:', apiUrl);
      console.log('Registration ID:', cleanRegistrationId);
      console.log('Date:', todayDate);

      // Log the full request configuration
      console.log('Request Configuration:', {
        url: apiUrl,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all status codes from 200 to 499
        },
      });

      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);
      console.log('API Response Data:', response.data);

      // Check if the response indicates no data found
      if (response.status === 300 || response.data.status === 300) {
        Alert.alert(
          'User Not Found',
          'The registration ID you entered does not exist in our system.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setShowScanner(false);
                setShowVolunteerModal(false);
              },
              style: 'default',
            },
          ],
          { cancelable: false },
        );
        return;
      }

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const userData = response.data;
      // Add registration ID to the user data
      userData.registrationid = cleanRegistrationId;
      setScannedData(userData);
      setShowScanner(false);
      setShowVolunteerModal(true);
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      console.error('Error Headers:', error.response?.headers);
      console.error('Error Config:', error.config);
      console.error('Full Error Object:', JSON.stringify(error, null, 2));

      let errorMessage = 'Failed to fetch user data';
      let errorTitle = 'Error';

      if (error.response) {
        if (error.response.status === 404) {
          errorTitle = 'User Not Found';
          errorMessage = 'The registration ID you entered does not exist in our system.';
        } else if (error.response.status === 400) {
          errorTitle = 'Invalid Input';
          errorMessage = error.response.data.error || 'Please enter a valid registration ID';
          console.error('400 Error Details:', error.response.data);
        }
      } else if (error.request) {
        errorTitle = 'Connection Error';
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        console.error('Request Error:', error.request);
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(
        errorTitle,
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setShowScanner(false);
              setShowVolunteerModal(false);
            },
            style: 'default',
          },
        ],
        { cancelable: false },
      );
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
          registrationId =
            parsedData.registrationid ||
            parsedData.registrationId ||
            parsedData.id;
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
        apiConfig={apiConfig}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Welcome to Global Encounter Food Management
        </Text>

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
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
  },
  bottomContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#2C3E50',
    marginTop: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  optionButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#E8F0FE',
    width: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6E0F0',
  },
  selectedOption: {
    backgroundColor: '#4A90E2',
    borderColor: '#3A7BC8',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#2C3E50',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: 300,
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  topView: {
    flex: 0,
    height: 'auto',
    width: '100%',
  },
  bottomView: {
    flex: 0,
    height: 'auto',
    width: '100%',
  },
  instructionBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    margin: 20,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: '90%',
    alignSelf: 'center',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#5D6D7E',
    lineHeight: 24,
    textAlign: 'left',
  },
  buttonTouchable: {
    padding: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    margin: 20,
    marginBottom: 40,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#5D6D7E',
    fontWeight: '500',
  },
});

export default HomeScreen;
