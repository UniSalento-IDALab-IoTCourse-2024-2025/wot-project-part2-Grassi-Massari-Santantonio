import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function UserScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();

      const [riderName, setRiderName] = useState<string | null>(null);

  useEffect(() => {
    const loadRiderName = async () => {
      const name = await AsyncStorage.getItem('riderName');
      if (name) {
        console.log('Rider salvato:', name);
        setRiderName(name);
      }
    };

    loadRiderName();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 {user?.email || 'Rider'}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('../Deliveries')}
      >
        <Text style={styles.buttonText}>📦 Consegne</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('../Earnings')}
      >
        <Text style={styles.buttonText}>💰 Guadagni</Text>
      </TouchableOpacity>

       <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('../TcpConnection')}
      >
        <Text style={styles.buttonText}>Connessione</Text>
      </TouchableOpacity>


      <TouchableOpacity
        style={[styles.button, styles.logout]}
        onPress={async () => {
          await AsyncStorage.clear();
          await signOut();
          router.replace('/Login');
        }}
      >
        <Text style={styles.buttonText}>🚪 Esci</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
  },
  logout: {
    marginTop: 40,
    backgroundColor: '#fcc',
  },
});
