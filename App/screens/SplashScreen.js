import React, {useEffect, useRef} from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  Animated,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');

export const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const titleFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.sequence([
      // First fade in and scale up the logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 10,
          friction: 2,
          useNativeDriver: true,
        }),
      ]),
      // Then fade in the title
      Animated.timing(titleFadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, titleFadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <Image
          source={require('../Asset/Splash.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.text,
          {
            opacity: titleFadeAnim,
            transform: [
              {
                translateY: titleFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}>
        Global Encounter Food Management
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Changed from dark teal to white
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: width * 0.4, // 40% of screen width
    height: width * 0.4,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004D40', // Changed from white to dark teal for better contrast on white
    textAlign: 'center',
    paddingHorizontal: 20,
    letterSpacing: 1,
  },
});
