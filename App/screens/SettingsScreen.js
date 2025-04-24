import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  BackHandler,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {saveCustomIP, clearStoredIP} from '../config';

class ErrorBoundary extends React.Component {
  state = {hasError: false};

  static getDerivedStateFromError(error) {
    return {hasError: true};
  }

  componentDidCatch(error, errorInfo) {
    console.error('Settings Screen Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <Text style={styles.title}>Something went wrong</Text>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => {
                this.setState({hasError: false});
                if (this.props.navigation?.goBack) {
                  this.props.navigation.goBack();
                }
              }}>
              <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const SettingsScreen = ({navigation}) => {
  const [ipAddress, setIpAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Handle back button press
  const handleBackPress = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
      return true;
    }
    return false;
  }, [navigation]);

  useEffect(() => {
    loadIp();

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => {
      backHandler.remove();
    };
  }, [handleBackPress]);

  const loadIp = async () => {
    try {
      const savedIp = await AsyncStorage.getItem('server_ip');
      if (savedIp) {
        setIpAddress(savedIp);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error loading saved IP:', error);
      setError('Failed to load saved IP');
    }
  };

  const validateIp = ip => {
    try {
      if (!ip) return false;

      // Basic IP address validation
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) {
        return false;
      }

      // Check if each number is between 0 and 255
      const parts = ip.split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    } catch (error) {
      console.error('IP validation error:', error);
      return false;
    }
  };

  const saveIpAddress = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting to save IP:', ipAddress);

      if (!ipAddress) {
        throw new Error('IP address cannot be empty');
      }

      if (!validateIp(ipAddress)) {
        throw new Error('Invalid IP address format');
      }

      const success = await saveCustomIP(ipAddress);

      if (success) {
        setIsConnected(true);
        console.log('IP Address Saved:', ipAddress);
        Alert.alert('Success', 'IP address saved successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        setIsConnected(false);
        throw new Error('Failed to connect to server');
      }
    } catch (error) {
      console.error('Error saving IP:', error);
      setError(error.message);
      Alert.alert(
        'Error',
        error.message ||
          'Failed to save IP address. Please check your connection.',
      );
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const resetIpAddress = async () => {
    try {
      setLoading(true);
      setError(null);
      await clearStoredIP();
      setIpAddress('');
      setIsConnected(false);
      Alert.alert('Success', 'IP address configuration has been reset');
    } catch (error) {
      console.error('Error resetting IP:', error);
      setError('Failed to reset IP configuration');
      Alert.alert('Error', 'Failed to reset IP configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Server Settings</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Status: {isConnected ? '🟢 Connected' : '🔴 Not Connected'}
          </Text>
        </View>

        <Text style={styles.label}>Enter Server IP Address:</Text>
        <TextInput
          style={[
            styles.input,
            {borderColor: isConnected ? '#4CAF50' : '#ccc'},
          ]}
          placeholder="e.g., 192.168.1.100"
          value={ipAddress}
          onChangeText={text => {
            setIpAddress(text);
            setIsConnected(false);
          }}
          keyboardType="numeric"
          editable={!loading}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Testing connection...</Text>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveIpAddress}
              disabled={loading}>
              <Text style={styles.buttonText}>Save & Test Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetIpAddress}
              disabled={loading}>
              <Text style={[styles.buttonText, styles.resetButtonText]}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 Tip: Find your computer's IP address using:
          </Text>
          <Text style={styles.helpCommand}>
            {Platform.OS === 'ios'
              ? '• Mac: Run ifconfig'
              : '• Windows: Run ipconfig'}
          </Text>
          <Text style={styles.helpCommand}>
            Look for IPv4 Address or inet addr
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 40, // To offset the back button width
  },
  statusContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButtonText: {
    color: '#FF3B30',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  helpContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  helpCommand: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
});

export default SettingsScreen;
