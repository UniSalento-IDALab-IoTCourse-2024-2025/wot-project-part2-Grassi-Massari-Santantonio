import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface Order {
  id: number;
  delivery_address: string;
  dest_lat: number;
  dest_long: number;
  status: string;
  rider_id?: number | null;
}

export default function Home() {
  const [online, setOnline] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [host, setHost] = useState<string | null>(null);
  const [riderId, setRiderId] = useState<number | null>(null);
  const [riderName, setRiderName] = useState<string | null>(null);
  const [healthLevel, setHealthLevel] = useState(3);
  const [healthStatus, setHealthStatus] = useState("MEDIUM");
  const [loading, setLoading] = useState(true);

  // Ref per la mappa e per tenere traccia degli intervalli
  const mapRef = useRef<MapView>(null);
  const healthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const healthTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseUrl = host ? `http://${host}:3000` : null;
  const iotUrl = host ? `http://${host}:3001` : null;

  const healthColors = {
    "VERY NEGATIVE": "#FF0000",
    "NEGATIVE": "#FF4D4D",
    "MEDIUM": "#FFD700",
    "POSITIVE": "#7CFC00",
    "VERY POSITIVE": "#32CD32"
  };

  const mapApiOrderToOrder = (apiOrder: any): Order => {
    return {
      id: apiOrder.id,
      delivery_address: apiOrder.destination,
      dest_lat: apiOrder.destinationCoords.latitude,
      dest_long: apiOrder.destinationCoords.longitude,
      status: apiOrder.status,
      rider_id: apiOrder.rider_id
    };
  };

  // Funzione per animare la mappa verso la destinazione
  const animateToDestination = (order: Order) => {
    if (mapRef.current && !isNaN(order.dest_lat) && !isNaN(order.dest_long)) {
      const region = {
        latitude: order.dest_lat,
        longitude: order.dest_long,
        latitudeDelta: 0.01, // Zoom più vicino per la destinazione
        longitudeDelta: 0.01,
      };

      mapRef.current.animateToRegion(region, 1000); // Animazione di 1 secondo
      console.log('Animating map to destination:', region);
    }
  };

  // Carica IP, Rider ID e Rider Name dalla memoria
  useEffect(() => {
    const loadData = async () => {
      try {
        const ip = await AsyncStorage.getItem('ip');
        if (ip) {
          setHost(ip.trim());
          console.log('Host loaded:', ip.trim());
        }

        const id = await AsyncStorage.getItem('riderId');
        if (id) {
          const parsedId = parseInt(id);
          setRiderId(parsedId);
          console.log('Rider ID loaded:', parsedId);
        }

        const name = await AsyncStorage.getItem('riderName');
        if (name) {
          setRiderName(name);
          console.log('Rider Name loaded:', name);
        }

        if (riderId && baseUrl) {
          try {
            console.log('Checking for active order for rider:', riderId);
            console.log(`fetch to: ${baseUrl}/orders/pending/${riderId}`)
            const response = await axios.get(`${baseUrl}/orders/pending/${riderId}`);

            if (response.data && response.data.length > 0) {
              const apiOrder = response.data[0];
              console.log('Active order found:', apiOrder);

              const activeOrder: Order = mapApiOrderToOrder(apiOrder);
              console.log('Mapped active order:', activeOrder);

              if (typeof activeOrder.dest_lat !== 'number' || typeof activeOrder.dest_long !== 'number') {
                console.error('Invalid coordinates in order:', activeOrder);
                Alert.alert('Errore', 'Coordinate di destinazione non valide');
                return;
              }

              setCurrentOrder(activeOrder);
              setDelivering(true);
              setOnline(true);

              // Anima la mappa verso la destinazione
              setTimeout(() => animateToDestination(activeOrder), 500);

              if (riderName) {
                try {
                  await startIotScript(activeOrder.id);
                } catch (error) {
                  console.log('Failed to start IoT script', error);
                }
              }

              const url = `https://www.google.com/maps/dir/?api=1&destination=${activeOrder.dest_lat},${activeOrder.dest_long}`;
              // Rimuovi l'apertura automatica di Google Maps
              // Linking.openURL(url).catch(err => console.log('Error opening maps', err));
            }
          } catch (err) {
            console.log('Error fetching active order', err);
          }
        }
      } catch (err) {
        console.log('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [baseUrl, riderId, riderName]);

  // Avvia lo script IoT
  const startIotScript = async (orderId: number) => {
    if (!iotUrl || !riderName) {
      console.log('Missing IoT URL or riderName', { iotUrl, riderName });
      return;
    }

    try {
      console.log('Starting IoT script for order:', orderId);
      const response = await axios.post(`${iotUrl}/start`, {
        riderName,
        orderId
      });

      console.log('IoT start response:', response.data);
      return response.data;
    } catch (err: any) {
      console.log('Error starting IoT script:', err);
      const errorMessage = err.response?.data?.error || 'Errore durante l\'avvio script IoT';
      Alert.alert('Errore IoT', errorMessage);
      throw err;
    }
  };

  // Ferma lo script IoT
  const stopIotScript = async (riderId: number, orderId: number) => {
    if (!iotUrl) {
      console.log('Missing IoT URL');
      return;
    }

    try {
      console.log('Stopping IoT script');
      await axios.put(
        `${iotUrl}/stop`,
        { riderId },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('IoT stop response');

      // check-nft su baseUrl (non iotUrl)
      axios.post(
        `${baseUrl}/check-nft`,
        { riderId },
        { headers: { 'Content-Type': 'application/json' } }
      ).then(() => console.log('check-nft called'))
        .catch(err => console.error('check-nft error:', err));

      // update-expierence su baseUrl
      axios.put(
        `${baseUrl}/rider/update-expierence`,
        { riderId },
        { headers: { 'Content-Type': 'application/json' } }
      ).then(() => console.log('update-expierence called'))
        .catch(err => console.error('update-expierence error:', err));

      // schedulo upload-on-bc dopo 20s
      setTimeout(() => {
        axios.post(
          `${baseUrl}/upload-order-on-bc`,
          { riderId, orderId },
          { headers: { 'Content-Type': 'application/json' } }
        )
          .then(resp => console.log('upload-order-on-bc:', resp.data))
          .catch(err => console.error('upload-order-on-bc error:', err));
      }, 20_000);

    } catch (err: any) {
      console.error('Error stopping IoT script:', err);
      const errorMessage = err.response?.data?.error || 'Errore durante lo stop script IoT';
      Alert.alert('Errore IoT', errorMessage);
      throw err;
    }
  };

  // Recupera gli ordini in sospeso
  const fetchPendingOrders = async () => {
    if (!baseUrl) {
      console.log('Base URL not available, skipping fetch');
      return;
    }

    try {
      console.log('Fetching pending orders from:', `${baseUrl}/orders/pending`);
      const res = await axios.get<Order[]>(`${baseUrl}/orders/pending`);
      console.log('Pending orders received:', res.data);

      const normalizedOrders = res.data.map((order: any) => {
        if (order.delivery_address && order.dest_lat && order.dest_long) {
          console.log('Order already in correct format:', order);
          return order;
        }
        return mapApiOrderToOrder(order);
      }).filter((order): order is Order => order !== null);

      console.log('Normalized pending orders:', normalizedOrders);
      setPendingOrders(normalizedOrders);
    } catch (err: any) {
      console.log('Error fetching pending orders:', err.message);
      if (err.response) {
        console.log('API error response:', err.response.data);
      }
    }
  };

  // Polling quando online
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (online && !delivering && baseUrl) {
      console.log('Starting order polling');
      fetchPendingOrders();
      interval = setInterval(fetchPendingOrders, 5000 * 12);
    }

    return () => {
      if (interval) {
        console.log('Clearing order polling interval');
        clearInterval(interval);
      }
    };
  }, [online, delivering, baseUrl]);

  // Funzione per fermare il polling della salute
  const stopHealthPolling = () => {
    console.log('Stopping health polling');
    if (healthTimeoutRef.current) {
      clearTimeout(healthTimeoutRef.current);
      healthTimeoutRef.current = null;
    }
    if (healthIntervalRef.current) {
      clearInterval(healthIntervalRef.current);
      healthIntervalRef.current = null;
    }
  };

  // Funzione per avviare il polling della salute
  const startHealthPolling = () => {
    console.log('Starting health polling');

    const fetchHealth = async () => {
      console.log('fetchHealth chiamata, stato:', {
        iotUrl: !!iotUrl,
        delivering
      });

      if (!iotUrl || !delivering) {
        console.log('fetchHealth: condizioni non soddisfatte', {
          hasIotUrl: !!iotUrl,
          delivering
        });
        return;
      }

      try {
        console.log('Chiamata HTTP a:', `${iotUrl}/run`);
        const response = await axios.post(`${iotUrl}/run`);

        console.log('Risposta ricevuta:', {
          status: response.status,
          data: response.data,
          result: response.data.result
        });

        if (response.data.result) {
          const result = response.data.result.toUpperCase() as keyof typeof levelMap;
          console.log('Aggiornamento stato salute:', {
            oldStatus: healthStatus,
            newStatus: result,
            oldLevel: healthLevel
          });

          setHealthStatus(result);

          const levelMap = {
            "VERY NEGATIVE": 1,
            "NEGATIVE": 2,
            "MEDIUM": 3,
            "POSITIVE": 4,
            "VERY POSITIVE": 5
          };

          const newLevel = levelMap[result] || 3;
          console.log('Nuovo livello calcolato:', newLevel);
          setHealthLevel(newLevel);

          console.log('Stato salute aggiornato con successo');
        } else {
          console.log('Nessun result nella risposta');
        }
      } catch (error) {
        console.error('Errore durante fetch health status:', error);
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as any).response === 'object'
        ) {
          console.error('Dettagli errore HTTP:', {
            status: (error as any).response.status,
            data: (error as any).response.data
          });
        }
      }
    };

    // Prima chiamata dopo 10 secondi
    console.log('Scheduling prima chiamata health tra 10 secondi');
    healthTimeoutRef.current = setTimeout(() => {
      console.log('Esecuzione prima chiamata health');
      fetchHealth();

      // Polling successivo ogni 5 secondi
      console.log('Avvio polling ogni 5 secondi');
      healthIntervalRef.current = setInterval(() => {
        console.log('Polling health - chiamata periodica');
        fetchHealth();
      }, 5000);
    }, 10000);
  };

  // Avvia il polling quando inizia la consegna
  useEffect(() => {
    console.log('useEffect delivering cambio:', delivering);

    if (delivering) {
      console.log('Consegna iniziata, avvio health polling tra 5 secondi');

      const startTimeout = setTimeout(() => {
        console.log('Timeout scaduto, avvio health polling');
        startHealthPolling();
      }, 5000);

      return () => {
        console.log('Cleanup useEffect delivering - consegna terminata');
        clearTimeout(startTimeout);
        stopHealthPolling();
      };
    } else {
      console.log('Consegna terminata, stop health polling');
      stopHealthPolling();
    }
  }, [delivering]);

  // Cleanup generale quando il componente viene smontato
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleanup health polling');
      stopHealthPolling();
    };
  }, []);

  const handleAccept = async (orderId: number) => {
    if (!baseUrl || !riderId) {
      console.log('Missing baseUrl or riderId', { baseUrl, riderId });
      Alert.alert('Errore', 'Configurazione mancante');
      return;
    }

    try {
      console.log('Accepting order:', orderId, 'with rider:', riderId);
      const response = await axios.post(`${baseUrl}/update-order`, {
        riderId,
        orderId
      });

      console.log('Accept response:', response.data);

      if (response.data.success) {
        const acceptedOrder = response.data.order;
        console.log('Order accepted successfully:', acceptedOrder);

        setCurrentOrder(acceptedOrder);
        setDelivering(true);
        setPendingOrders([]);

        // Anima la mappa verso la destinazione
        setTimeout(() => animateToDestination(acceptedOrder), 500);

        if (riderName) {
          try {
            await startIotScript(orderId);
          } catch (error) {
            console.log('IoT script start failed, continuing anyway');
          }
        } else {
          console.log('Skipping IoT start, riderName not available');
        }

        Alert.alert('Ordine accettato', 'Inizia la consegna verso la destinazione');
      } else {
        console.log('API returned success=false');
        Alert.alert('Errore', 'Accettazione ordine fallita');
      }
    } catch (err: any) {
      console.log('Error accepting order:', err);
      const errorMessage = err.response?.data?.error || 'Errore durante l\'accettazione';
      Alert.alert('Errore', errorMessage);
    }
  };

  const handleReject = (orderId: number) => {
    console.log('Rejecting order:', orderId);
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const handleComplete = async () => {
    if (!baseUrl || !riderId || !currentOrder) {
      console.log('Missing data for completion', { baseUrl, riderId, currentOrder });
      return;
    }

    try {
      console.log('Completing order:', currentOrder.id);
      const response = await axios.post(`${baseUrl}/complete-order`, {
        riderId,
        orderId: currentOrder.id
      });

      console.log('Complete response:', response.data);

      if (response.data.success) {
        const orderId = response.data.order.id;
        try {
          await stopIotScript(riderId, orderId);
        } catch (error) {
          console.log('IoT script stop failed, continuing anyway');
        }

        Alert.alert('Consegna completata', 'Ordine consegnato con successo');

        console.log('Impostando delivering = false - questo dovrebbe fermare il polling');

        setCurrentOrder(null);
        setDelivering(false);

        // Reset dello stato di salute
        setHealthStatus("MEDIUM");
        setHealthLevel(3);

        if (online) {
          console.log('Refetching pending orders after completion');
          fetchPendingOrders();
        }
      } else {
        Alert.alert('Errore', response.data.error || 'Completamento consegna fallito');
      }
    } catch (err: any) {
      console.log('Error completing delivery:', err.message);
      Alert.alert('Errore', 'Completamento consegna fallito');
    }
  };

  const renderHealthBar = () => {
    console.log('renderHealthBar chiamato con:', {
      healthLevel,
      healthStatus,
      delivering
    });

    if (!delivering) {
      return null;
    }

    const activeColor = healthColors[healthStatus as keyof typeof healthColors] || "#FFD700";

    return (
      <View style={styles.healthBarContainer}>
        {[...Array(5)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.healthSegment,
              index < healthLevel
                ? { backgroundColor: activeColor }
                : styles.healthInactive
            ]}
          />
        ))}
        <Text style={[styles.healthText, { color: activeColor }]}>
          {healthStatus}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      )}

      {renderHealthBar()}

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 45.4641,
          longitude: 9.1919,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Marker della destinazione (verde) - rimosso il marker rosso */}
        {currentOrder &&
          !isNaN(currentOrder.dest_lat) &&
          !isNaN(currentOrder.dest_long) && (
            <Marker
              coordinate={{
                latitude: currentOrder.dest_lat,
                longitude: currentOrder.dest_long
              }}
              title="Destinazione"
              description={currentOrder.delivery_address}
              pinColor="green"
            />
          )}
      </MapView>

      <TouchableOpacity
        style={[styles.onlineButton, online && styles.onlineActive]}
        onPress={() => {
          const newOnline = !online;
          console.log('Online status changed to:', newOnline);
          setOnline(newOnline);
          if (!newOnline) {
            console.log('Going offline, resetting state');
            setDelivering(false);
            setCurrentOrder(null);
          }
        }}
      >
        <Text style={styles.onlineText}>
          {online ? 'In cerca di ordini...' : 'Vai Online'}
        </Text>
      </TouchableOpacity>

      {online && pendingOrders.length > 0 && (
        <View style={styles.orderBox}>
          <Text style={styles.orderText}>Ordini disponibili:</Text>
          <ScrollView style={styles.ordersContainer}>
            {pendingOrders.map(order => (
              <View key={order.id} style={styles.orderItem}>
                <Text style={styles.orderDestination}>
                  Consegna verso: {order.delivery_address}
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(order.id)}
                  >
                    <Text style={styles.btnText}>Rifiuta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(order.id)}
                  >
                    <Text style={styles.btnText}>Accetta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {currentOrder && delivering && (
        <View style={styles.orderBox}>
          <Text style={styles.orderText}>
            Consegna in corso verso: {currentOrder.delivery_address}
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${currentOrder.dest_lat},${currentOrder.dest_long}&travelmode=driving`;
                Linking.openURL(url).catch(err => {
                  console.log('Google Maps opening error:', err);
                  Alert.alert("Errore", "Impossibile aprire Google Maps");
                });
              }}
            >
              <Text style={styles.btnText}>Apri Navigatore</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleComplete}
            >
              <Text style={styles.btnText}>Consegna completata</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {online && pendingOrders.length === 0 && !delivering && (
        <View style={styles.noOrdersBox}>
          <Text style={styles.noOrdersText}>Nessun ordine disponibile al momento</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  onlineButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  onlineActive: { backgroundColor: '#d1ffd1' },
  onlineText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  orderBox: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 300,
  },
  ordersContainer: {
    maxHeight: 200,
  },
  orderItem: {
    marginVertical: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderDestination: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  orderText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  rejectBtn: {
    backgroundColor: '#ffcccc',
    padding: 10,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#ccffcc',
    padding: 10,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  btnText: {
    fontWeight: 'bold',
    color: '#333',
  },
  noOrdersBox: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noOrdersText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  healthActive: {
    backgroundColor: '#4CAF50',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  healthBarContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  healthSegment: {
    width: 30,
    height: 10,
    marginHorizontal: 3,
    borderRadius: 5,
  },
  healthInactive: {
    backgroundColor: '#E0E0E0',
  },
  healthText: {
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 14,
  },
});