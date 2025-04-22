import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';

// Configuration
// Configuration
// ... existing code ...
const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://192.168.8.35:8000'
    : // ? 'http://192.168.0.126:8000'
      'https://your-production-url.com',
  ENDPOINTS: {
    SCHEDULE: '/api/foodtrucks/schedule',
  },
};
// ... existing code ...
// ... existing code ...

// Helper functions
const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(today.getDate()).padStart(2, '0')}`;
};

const getCurrentHour = () => new Date().getHours();

const VolunteerRegistrationModal = ({
  visible,
  onClose,
  initialData,
  registrationId: initialRegistrationId,
  apiConfig,
}) => {
  const [registrationId, setRegistrationId] = useState(initialRegistrationId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(initialData || null);
  const [activeMeal, setActiveMeal] = useState(null);

  useEffect(() => {
    if (initialData) {
      setUserData(initialData);
      setActiveMeal(determineMealStatus(initialData));
    }
    if (initialRegistrationId) {
      setRegistrationId(initialRegistrationId);
    }
  }, [initialData, initialRegistrationId]);

  const handleInputChange = text => {
    if (/^\d*$/.test(text)) {
      setRegistrationId(text);
    }
  };

  const determineMealStatus = data => {
    const currentHour = getCurrentHour();
    const isLunchTime = currentHour < 16; // Before 4PM

    if (isLunchTime) {
      return {
        type: 'lunch',
        available: data.lunch === true,
        text: 'Avail Lunch',
        statusColor: data.lunch ? styles.mealAvailable : styles.mealUnavailable,
        statusText: data.lunch ? 'Lunch Available' : 'Lunch Already Availed',
      };
    } else {
      return {
        type: 'dinner',
        available: data.dinner === true,
        text: 'Avail Dinner',
        statusColor: data.dinner ? styles.mealAvailable : styles.mealUnavailable,
        statusText: data.dinner ? 'Dinner Available' : 'Dinner Already Availed',
      };
    }
  };

  const fetchVolunteerData = async () => {
    if (!apiConfig) {
      Alert.alert('Error', 'API configuration not loaded');
      return;
    }

    const trimmedId = registrationId.trim();

    if (!trimmedId) {
      Alert.alert('Error', 'Please enter registration ID');
      return;
    }
    if (!/^\d+$/.test(trimmedId)) {
      Alert.alert('Error', 'Registration ID must contain only numbers');
      return;
    }
    setIsLoading(true);
    try {
      const apiUrl = `${apiConfig.BASE_URL}${
        apiConfig.ENDPOINTS.SCHEDULE
      }?registrationid=${trimmedId}&date=${getTodayDate()}`;
      
      console.log('Fetching data from:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all status codes from 200 to 499
        },
      });
      
      console.log('API Response:', response.data);
      
      // Check if the response indicates no data found
      if (response.status === 300 || response.data.status === 300) {
        Alert.alert(
          'User Not Found',
          'The registration ID you entered does not exist in our system.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setRegistrationId('');
                setUserData(null);
                setActiveMeal(null);
              },
              style: 'default',
            },
          ],
          { cancelable: false },
        );
        return;
      }

      const data = response.data;
      data.registrationid = trimmedId; // Add registration ID to the data
      setUserData(data);
      setActiveMeal(determineMealStatus(data));
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);

      let errorMessage = 'Failed to fetch data';
      let errorTitle = 'Error';

      if (error.response) {
        if (error.response.status === 404) {
          errorTitle = 'User Not Found';
          errorMessage = 'The registration ID you entered does not exist in our system.';
        } else if (error.response.status === 400) {
          errorTitle = 'Invalid Input';
          errorMessage = error.response.data.error || 'Please enter a valid registration ID';
        }
      } else if (error.request) {
        errorTitle = 'Connection Error';
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
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
              setRegistrationId('');
              setUserData(null);
              setActiveMeal(null);
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

  const handleMealAction = async () => {
    if (!apiConfig) {
      Alert.alert('Error', 'API configuration not loaded');
      return;
    }

    if (!userData || !activeMeal) return;
    setIsLoading(true);
    try {
      // Get registration ID from userData or input
      const registrationIdToUse = userData.registrationid || registrationId;
      
      if (!registrationIdToUse) {
        Alert.alert('Error', 'Registration ID is required');
        return;
      }

      const requestData = {
        registrationid: registrationIdToUse,
        date: getTodayDate(),
        lunch: activeMeal.type === 'lunch' ? false : userData.lunch,
        dinner: activeMeal.type === 'dinner' ? false : userData.dinner,
      };

      console.log('Sending request data:', JSON.stringify(requestData, null, 2));
      console.log('User data:', JSON.stringify(userData, null, 2));
      console.log('Active meal:', JSON.stringify(activeMeal, null, 2));
      console.log('Registration ID being used:', registrationIdToUse);

      const response = await axios.patch(
        `${apiConfig.BASE_URL}${apiConfig.ENDPOINTS.SCHEDULE}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const updatedData = response.data;
      setUserData(updatedData);
      Alert.alert('Success', 'Meal status updated successfully');
      onClose();
    } catch (error) {
      console.error('Update Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      console.error('Request data:', error.config?.data);
      Alert.alert('Error', 'Failed to update meal status');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setRegistrationId('');
    setUserData(null);
    setActiveMeal(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={resetModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>
            {userData ? 'Volunteer Details' : 'Enter Registration ID'}
          </Text>

          {userData ? (
            <>
              <View style={styles.detailsContainer}>
                <Text style={styles.detailText}>
                  Name: {userData.food_truck_name}
                </Text>
                <Text style={styles.detailText}>
                  Type: {userData.food_truck_type}
                </Text>
                <Text style={styles.detailText}>Date: {userData.date}</Text>
                <Text style={[styles.mealStatusText, activeMeal?.statusColor]}>
                  {activeMeal?.statusText}
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={resetModal}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>

                {activeMeal?.available && (
                  <TouchableOpacity
                    style={[styles.button, styles.availButton]}
                    onPress={handleMealAction}
                    disabled={isLoading}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>{activeMeal?.text}</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter registration ID"
                placeholderTextColor="#888"
                value={registrationId}
                onChangeText={handleInputChange}
                keyboardType="numeric"
                editable={!isLoading}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={resetModal}
                  disabled={isLoading}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.continueButton]}
                  onPress={fetchVolunteerData}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  detailsContainer: {
    marginBottom: 25,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  mealStatusText: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
  },
  mealAvailable: {
    color: '#4CAF50',
  },
  mealUnavailable: {
    color: '#F44336',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: 'grey',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  continueButton: {
    backgroundColor: '#2196f3',
  },
  availButton: {
    backgroundColor: '#4caf50',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default VolunteerRegistrationModal;
