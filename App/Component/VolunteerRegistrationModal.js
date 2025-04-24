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
import {BASE_URL, FOODTRUCKS_ENDPOINT} from '../config';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

// Helper functions
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getCurrentHour = () => new Date().getHours();

const VolunteerRegistrationModal = ({
  visible,
  onClose,
  initialData,
  registrationId: initialRegistrationId,
}) => {
  const [registrationId, setRegistrationId] = useState(
    initialRegistrationId || '',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(initialData || null);
  const [activeMeal, setActiveMeal] = useState(null);

  useEffect(() => {
    if (initialData) {
      setUserData(initialData);
      setActiveMeal(determineMealStatus(initialData));
      // Set registration ID from initialData if available
      if (initialData.registrationid) {
        setRegistrationId(initialData.registrationid);
      }
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
        statusColor: data.dinner
          ? styles.mealAvailable
          : styles.mealUnavailable,
        statusText: data.dinner ? 'Dinner Available' : 'Dinner Already Availed',
      };
    }
  };

  const fetchVolunteerData = async () => {
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
      const apiUrl = `${BASE_URL}${FOODTRUCKS_ENDPOINT}?registrationid=${trimmedId}&date=${getTodayDate()}`;

      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        },
      });
      console.log('VolunteerRegistrationModal GET Response:', response.data);

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
          {cancelable: false},
        );
        return;
      }

      const data = response.data;
      data.registrationid = trimmedId;
      setUserData(data);
      setActiveMeal(determineMealStatus(data));
    } catch (error) {
      let errorMessage = 'Failed to fetch data';
      let errorTitle = 'Error';

      if (error.response) {
        if (error.response.status === 404) {
          errorTitle = 'User Not Found';
          errorMessage =
            'The registration ID you entered does not exist in our system.';
        } else if (error.response.status === 400) {
          errorTitle = 'Invalid Input';
          errorMessage =
            error.response.data.error || 'Please enter a valid registration ID';
        }
      } else if (error.request) {
        errorTitle = 'Connection Error';
        errorMessage =
          'Unable to connect to the server. Please check your internet connection.';
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
        {cancelable: false},
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMealAction = async () => {
    if (!userData || !activeMeal) return;
    setIsLoading(true);
    try {
      // First try to get registration ID from userData, then from state
      const registrationIdToUse = userData.registrationid || registrationId;
      console.log('Using registration ID:', registrationIdToUse);

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

      console.log('Sending PATCH request with data:', requestData);

      const response = await axios.patch(
        `${BASE_URL}${FOODTRUCKS_ENDPOINT}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );
      console.log('VolunteerRegistrationModal PATCH Response:', response.data);

      const updatedData = response.data;
      setUserData(updatedData);
      Alert.alert('Success', 'Meal status updated successfully');
      onClose();
    } catch (error) {
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
    padding: wp('5%'),
    borderRadius: wp('3%'),
    width: wp('90%'),
    maxWidth: wp('90%'),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: hp('0.2%')},
    shadowOpacity: 0.25,
    shadowRadius: wp('1%'),
    elevation: 5,
  },
  title: {
    fontSize: wp('5.5%'),
    fontWeight: 'bold',
    marginBottom: hp('2%'),
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('2%'),
    padding: hp('2%'),
    marginBottom: hp('2%'),
    fontSize: wp('4%'),
    backgroundColor: '#f9f9f9',
  },
  detailsContainer: {
    marginBottom: hp('3%'),
  },
  detailText: {
    fontSize: wp('4%'),
    marginBottom: hp('1%'),
    color: '#555',
  },
  mealStatusText: {
    fontSize: wp('4.2%'),
    fontWeight: '600',
    marginTop: hp('2%'),
    padding: hp('1.2%'),
    borderRadius: wp('2%'),
    textAlign: 'center',
  },
  mealAvailable: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  mealUnavailable: {
    color: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp('2%'),
  },
  button: {
    flex: 1,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: hp('0.2%')},
    shadowOpacity: 0.1,
    shadowRadius: wp('1%'),
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  continueButton: {
    backgroundColor: '#2196F3',
  },
  availButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: wp('4%'),
  },
});

export default VolunteerRegistrationModal;
