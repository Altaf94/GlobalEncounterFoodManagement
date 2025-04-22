import {View, Button, TextInput} from 'react-native';
import {useContext} from 'react';
import {AuthContext} from '../context/AuthContext';

export const LoginScreen = () => {
  const {login} = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={{flex: 1, justifyContent: 'center', padding: 24}}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={() => login(username, password)} />
    </View>
  );
};
