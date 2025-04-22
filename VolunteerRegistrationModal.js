import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Make sure to install this package

const VolunteerRegistrationModal = ({
  visible,
  onClose,
  onContinue,
  isLoading: parentLoading,
}) => {
  const [registrationId, setRegistrationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [volunteerData, setVolunteerData] = useState(null);

  const fetchVolunteerData = async id => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://127.0.0.1:8000/api/userdata/registration/${id}/`,
      );
      const userData = response.data;
      setVolunteerData(userData);

      if (userData.type.toLowerCase() === 'volunteer') {
        // No Alert here since we're showing the data in the modal
      } else {
        Alert.alert(
          'Invalid Volunteer',
          'This registration ID does not belong to a volunteer',
          [{text: 'OK'}],
        );
        setVolunteerData(null);
      }
    } catch (error) {
      let errorMessage = 'Failed to fetch volunteer data';

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Volunteer not found with this ID';
        } else {
          errorMessage = error.response.data.error || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }

      Alert.alert('Error', errorMessage, [{text: 'OK'}]);
      setVolunteerData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (registrationId.trim()) {
      fetchVolunteerData(registrationId);
    } else {
      Alert.alert('Input Required', 'Please enter a registration ID');
    }
  };

  const handleClose = () => {
    setVolunteerData(null);
    setRegistrationId('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {volunteerData ? (
            <ScrollView contentContainerStyle={styles.dataContainer}>
              <View style={styles.header}>
                <Icon name="verified-user" size={30} color="#4CAF50" />
                <Text style={styles.dataTitle}>Volunteer Verified</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Name:</Text>
                <Text style={styles.dataValue}>{volunteerData.name}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Type:</Text>
                <Text style={styles.dataValue}>{volunteerData.type}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Registration ID:</Text>
                <Text style={styles.dataValue}>{registrationId}</Text>
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  onContinue(volunteerData);
                  handleClose();
                }}>
                <Text style={styles.confirmButtonText}>Confirm Volunteer</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <>
              <Text style={styles.title}>Enter Volunteer Registration ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Registration ID"
                placeholderTextColor="#999"
                value={registrationId}
                onChangeText={setRegistrationId}
                autoCapitalize="none"
                keyboardType="numeric"
                editable={!isLoading}
              />

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={isLoading}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.continueButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleContinue}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Search</Text>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 25,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  continueButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  dataContainer: {
    padding: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  dataTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 10,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dataLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 25,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default VolunteerRegistrationModal;
