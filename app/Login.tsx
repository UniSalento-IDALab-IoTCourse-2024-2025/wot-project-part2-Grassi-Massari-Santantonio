import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [ip, setIp]           = useState('10.125.156.149');
  const { signIn, isLoading } = useAuth();
  const router                = useRouter();

  const handleLogin = async () => {
    if (!email || !password || !ip) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    try {
      await signIn(ip, email, password);
    } catch (e: any) {
      Alert.alert('Login fallito', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Rider</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Indirizzo IP"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        value={ip}
        onChangeText={setIp}
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin} 
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Caricamento...' : 'Accedi'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20 },
  title:     { fontSize:28, textAlign:'center', marginBottom:40 },
  input:     {
    height:50, backgroundColor:'#fff', borderRadius:10,
    paddingHorizontal:15, marginBottom:20, borderWidth:1, borderColor:'#ccc'
  },
  button:    {
    backgroundColor:'#007AFF', padding:15, borderRadius:10,
    opacity:1
  },
  buttonText:{ color:'#fff', textAlign:'center', fontWeight:'bold' },
});