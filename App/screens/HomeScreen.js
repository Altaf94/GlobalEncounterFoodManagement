import React, {useContext, useState, useEffect, useCallback} from 'react';
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
import {getApiConfig} from '../config';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

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

  const handleContinue = async () => {
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

      const cleanRegistrationId = registrationId.replace(/[^0-9]/g, '');
      console.log('Cleaned Registration ID:', cleanRegistrationId);

      const apiUrl = `${
        getApiConfig().BASE_URL
      }/api/foodtrucks/schedule?registrationid=${cleanRegistrationId}&date=${todayDate}`;
      console.log('Making API request to:', apiUrl);

      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      console.log('Request Headers:', headers);

      const response = await axios.get(apiUrl, {
        headers,
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept status codes between 200-499
        },
      });
      console.log('HomeScreen API Response:', response.data);

      // Handle status code 300 specifically
      if (response.status === 300 || response.data.status === 300) {
        setShowScanner(false); // Close camera first
        setScannedData(null); // Clear any scanned data
        Alert.alert(
          'User Not Found',
          'The registration ID you scanned does not exist in our system.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowVolunteerModal(false); // Ensure volunteer modal is closed
                setSelectedOption('scan'); // Reset to initial state
              },
            },
          ],
          {cancelable: false},
        );
        return;
      }

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const userData = {
        ...response.data,
        registrationid: cleanRegistrationId,
      };
      console.log('Setting scanned data with registration ID:', userData);

      setScannedData(userData);
      setShowScanner(false);
      setShowVolunteerModal(true);
    } catch (error) {
      console.error('API Error:', error);
      let errorMessage = 'Failed to fetch user data';
      let errorTitle = 'Error';

      if (error.message === 'Server not configured') {
        errorMessage = 'Please configure server settings first';
        Alert.alert('Configuration Required', errorMessage, [
          {
            text: 'Configure',
            onPress: () => {
              setShowScanner(false);
              navigation.navigate('Settings');
            },
          },
          {text: 'Cancel', onPress: () => setShowScanner(false)},
        ]);
        return;
      }

      if (error.response) {
        if (error.response.status === 404) {
          errorTitle = 'User Not Found';
          errorMessage =
            'The registration ID you scanned does not exist in our system.';
        } else if (error.response.status === 400) {
          errorTitle = 'Invalid QR Code';
          errorMessage =
            error.response.data.error ||
            'The QR code is not valid. Please try again.';
        }
      } else if (error.request) {
        errorTitle = 'Connection Error';
        errorMessage =
          'Unable to connect to the server. Please check your internet connection.';
      }

      Alert.alert(errorTitle, errorMessage, [
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
        registrationId={scannedData?.registrationid}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
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
    padding: wp('5%'),
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    marginBottom: hp('5%'),
    textAlign: 'center',
    color: '#333',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp('5%'),
  },
  optionButton: {
    padding: hp('2%'),
    borderRadius: wp('2%'),
    backgroundColor: '#f0f0f0',
    width: wp('40%'),
    alignItems: 'center',
    justifyContent: 'center',
    height: hp('10%'),
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: wp('4%'),
    color: '#000',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#fff',
  },
  bottomContainer: {
    marginBottom: hp('2%'),
  },
  continueButton: {
    backgroundColor: '#007AFF',
    padding: hp('2%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  continueButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: '#4CAF50',
    padding: hp('2%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: hp('2%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    color: '#777',
  },
  instructionBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: wp('2%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('4%'),
    marginBottom: hp('2%'),
    width: wp('85%'),
    alignSelf: 'center',
  },
  instructionTitle: {
    fontSize: wp('4.5%'),
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    textAlign: 'center',
  },
  instructionText: {
    fontSize: wp('3.5%'),
    color: '#fff',
    textAlign: 'center',
    lineHeight: hp('2.5%'),
  },
  buttonTouchable: {
    padding: hp('1.5%'),
    backgroundColor: '#007AFF',
    borderRadius: wp('2%'),
    marginHorizontal: wp('4%'),
    marginBottom: hp('4%'),
    width: wp('85%'),
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: wp('4%'),
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
    paddingTop: hp('2%'),
  },
  bottomView: {
    flex: 0,
    backgroundColor: 'transparent',
    paddingBottom: hp('2%'),
  },
});

export default HomeScreen;
