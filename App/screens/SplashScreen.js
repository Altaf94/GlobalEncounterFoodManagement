import React from 'react';
import {View, Image, StyleSheet, Text} from 'react-native';

export const SplashScreen = () => (
  <View style={styles.container}>
    <Image
      source={require('../Asset/Splash.png')}
      style={styles.image}
      resizeMode="contain"
    />
    <Text style={styles.text}>Global Encounter Food Management</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 20, // gives spacing between image and text
  },
  text: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
});
