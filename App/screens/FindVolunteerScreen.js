import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import VolunteerRegistrationModal from '../Component/VolunteerRegistrationModal';
import { getApiConfig } from '../config';

const FindVolunteerScreen = ({onClose, initialData, apiConfig: initialApiConfig}) => {
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [apiConfig, setApiConfig] = useState(initialApiConfig);

  useEffect(() => {
    const setupApiConfig = async () => {
      if (!initialApiConfig) {
        const config = await getApiConfig();
        setApiConfig(config);
      }
    };
    setupApiConfig();
  }, [initialApiConfig]);

  const handleClose = () => {
    setIsModalVisible(false);
    onClose();
  };

  if (!apiConfig) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading configuration...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Volunteer</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setIsModalVisible(true)}
        disabled={!apiConfig}>
        <Text style={styles.buttonText}>Enter Registration ID</Text>
      </TouchableOpacity>

      <VolunteerRegistrationModal
        visible={isModalVisible}
        onClose={handleClose}
        isLoading={isLoading}
        apiConfig={apiConfig}
        initialData={initialData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default FindVolunteerScreen;
