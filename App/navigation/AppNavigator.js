import {NavigationContainer} from '@react-navigation/native';
import {AuthContext} from '../context/AuthContext';
import {useContext} from 'react';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import {SplashScreen} from '../screens/SplashScreen';

const AppNavigator = () => {
  const {isLoading, userToken} = useContext(AuthContext);

  console.log('isLoading', isLoading);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {userToken ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
