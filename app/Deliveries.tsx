import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';

type Delivery = {
  id: number;
  delivery_address: string;
  delivery_date: string;
  result: string;
};

export default function DeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const [riderName, setRiderName] = useState<string | null>(null);
  const [host, setHost]           = useState<string | null>(null);

  // 1) carica riderName
  useEffect(() => {
    AsyncStorage.getItem('riderName')
      .then(name => name && setRiderName(name))
      .catch(console.error);
  }, []);

  // 2) carica host/IP
  useEffect(() => {
    AsyncStorage.getItem('ip')
      .then(ip => ip && setHost(ip.trim()))
      .catch(console.error);
  }, []);

  // 3) callback per fetch
  const fetchDeliveries = useCallback(async () => {
    if (!host || !riderName) return;
    setError(null);
    if (!refreshing) setLoading(true);

    const baseUrl = `http://${host}:3000`;
    console.log(`Fetch ${baseUrl}/rider/${riderName}/deliveries`);

    try {
      const res = await fetch(`${baseUrl}/rider/${riderName}/deliveries`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json: Delivery[] = await res.json();
      setDeliveries(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [host, riderName, refreshing]);

  // 4) esegui fetch quando host e riderName esistono
  useEffect(() => {
    fetchDeliveries();
  }, [host, riderName]);

  // 5) UI
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Caricamento consegne…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Errore: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={deliveries}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDeliveries();
            }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.address}>{item.delivery_address}</Text>
            <Text style={styles.date}>{item.delivery_date}</Text>
            <Text style={styles.result}>{item.result}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>Nessuna consegna</Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fafafa', marginTop:25 },
  center:    { flex:1, justifyContent:'center', alignItems:'center' },
  error:     { color:'#c00', textAlign:'center' },
  row:       { padding:15, borderBottomWidth:1, borderColor:'#eee' },
  address:   { fontSize:16, fontWeight:'500' },
  date:      { fontSize:12, color:'#666' },
  result:    { fontSize:14, marginTop:4 },
  empty:     { textAlign:'center', marginTop:20, color:'#666' }
});
