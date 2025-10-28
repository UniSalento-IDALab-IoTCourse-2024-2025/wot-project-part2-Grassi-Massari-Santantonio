import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function EarningsScreen() {
  const [data, setData] = useState<{
    total: number;
    weekly: number;
    weeklyData: number[];
  } | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [riderName, setRiderName] = useState<string | null>(null);
  const [host, setHost]           = useState<string | null>(null);

  // Carica riderName da AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('riderName')
      .then(name => name && setRiderName(name))
      .catch(console.error);
  }, []);

  // Carica host/IP da AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('ip')
      .then(ip => ip && setHost(ip.trim()))
      .catch(console.error);
  }, []);

  // Funzione per recuperare i guadagni
  const fetchEarnings = useCallback(async () => {
    if (!host || !riderName) return;

    setError(null);
    if (!refreshing) setLoading(true);

    const baseUrl = `http://${host}:3000`;
    console.log(`Fetch earnings from ${baseUrl}/rider/${riderName}/earnings`);

    try {
      const res = await fetch(`${baseUrl}/rider/${riderName}/earnings`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      console.log('Earnings data:', json);

      setData({
        total: json.total,
        weekly: json.weekly,
        weeklyData: json.weeklyData || []
      });
    } catch (e: any) {
      console.log('Error fetching earnings:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [host, riderName, refreshing]);

  // Avvia la fetch quando riderName e host sono pronti
  useEffect(() => {
    fetchEarnings();
  }, [host, riderName]);

  // Stato di caricamento
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Caricamento guadagni…</Text>
      </SafeAreaView>
    );
  }

  // Stato di errore
  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Errore di rete: {error}</Text>
      </SafeAreaView>
    );
  }

  // Nessun dato disponibile
  if (!data) return null;

  const { total, weekly, weeklyData } = data;
  const chartWidth = screenWidth - 40;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchEarnings();
            }}
          />
        }
      >
        <View style={styles.card}>
          <Text style={styles.label}>Totale</Text>
          <Text style={styles.amount}>€{total.toFixed(2)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Questa settimana</Text>
          <Text style={styles.amount}>€{weekly.toFixed(2)}</Text>
        </View>

        <Text style={styles.chartTitle}>Guadagni giornalieri</Text>
        <BarChart
          data={{
            labels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
            datasets: [{ data: weeklyData }]
          }}
          width={chartWidth}
          height={220}
          yAxisLabel="€"
          fromZero
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#f9f9f9',
            backgroundGradientTo: '#f9f9f9',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(76,175,80,${opacity})`,
            labelColor: () => '#333'
          }}
          style={styles.chart} yAxisSuffix={''}        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    marginTop: 25
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  error: {
    color: '#c00',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 3
  },
  label: {
    fontSize: 16,
    color: '#555'
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 10,
    color: '#444'
  },
  chart: {
    marginHorizontal: 20,
    borderRadius: 16
  }
});
