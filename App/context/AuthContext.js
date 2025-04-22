import React, {createContext, useState, useEffect} from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  const login = () => {
    setUserToken('dummy-token');
    setIsLoading(false);
  };

  const logout = () => {
    setUserToken(null);
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      const token = 'dummy-token'; // Replace with actual token check
      setUserToken(token);
    } catch (e) {
      console.log('Login error', e);
    } finally {
      // Keep splash screen for 4 seconds
      setTimeout(() => {
        setIsLoading(false);
      }, 4000);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{isLoading, userToken, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};
