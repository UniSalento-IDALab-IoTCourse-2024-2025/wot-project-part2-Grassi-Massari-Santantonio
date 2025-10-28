import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import TcpSocket from 'react-native-tcp-socket';

// Define types for the TCP Socket
interface TcpSocketClient {
  destroy: () => void;
  write: (data: string) => void;
  on: (event: string, callback: (data?: any) => void) => void;
}

const TcpConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [serverIp, setServerIp] = useState('10.125.156.149');
  const [serverPort, setServerPort] = useState('12345');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [client, setClient] = useState<TcpSocketClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (client) {
        try {
          client.destroy();
        } catch (e) {
          console.log("Cleanup error:", e);
        }
      }
    };
  }, [client]);

  const connectToServer = async () => {
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
    setResponse('');
    
    try {
      const port = parseInt(serverPort, 10);
      
      // Validate inputs
      if (!serverIp || !port || port < 1 || port > 65535) {
        throw new Error('IP o porta non validi');
      }

      console.log(`Tentativo di connessione a ${serverIp}:${port}`);
      
      // Check if TcpSocket is available
      if (!TcpSocket || !TcpSocket.createConnection) {
        throw new Error('TcpSocket non disponibile. Verifica l\'installazione della libreria.');
      }
      
      // Create a new TCP client
      const newClient = TcpSocket.createConnection(
        { 
          host: serverIp, 
          port: port,
          tls: false,
        },
        () => {
          console.log('Connesso con successo');
          setIsConnected(true);
          setIsConnecting(false);
          setClient(newClient as TcpSocketClient);
          Alert.alert('Connesso', `Connesso al server ${serverIp}:${port}`);
        }
      ) as TcpSocketClient;
      
      // Check if client was created successfully
      if (!newClient) {
        throw new Error('Impossibile creare la connessione TCP');
      }
      
      // Setup event handlers
      newClient.on('data', (data) => {
        const responseText = data.toString();
        console.log('Dati ricevuti:', responseText);
        setResponse(responseText);
      });
      
      newClient.on('error', (error: Error) => {
        console.log('Errore TCP:', error);
        setIsConnecting(false);
        Alert.alert('Errore', `Errore di connessione: ${error.message}`);
        disconnect();
      });
      
      newClient.on('close', () => {
        console.log('Connessione chiusa dal server');
        setIsConnecting(false);
        Alert.alert('Connessione chiusa', 'La connessione con il server è stata chiusa');
        disconnect();
      });

      newClient.on('connect', () => {
        console.log('Evento connect ricevuto');
      });
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (isConnecting) {
          console.log('Timeout connessione');
          setIsConnecting(false);
          Alert.alert('Timeout', 'Timeout della connessione');
          if (newClient) {
            newClient.destroy();
          }
        }
      }, 10000); // 10 second timeout
      
      // Clear timeout when connection is established
      newClient.on('connect', () => {
        clearTimeout(connectionTimeout);
      });
      
    } catch (error) {
      console.log('Errore durante la connessione:', error);
      setIsConnecting(false);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      Alert.alert('Errore', `Impossibile connettersi: ${errorMessage}`);
    }
  };

  const disconnect = () => {
    if (client) {
      try {
        client.destroy();
      } catch (e) {
        console.log("Errore durante la disconnessione:", e);
      }
      setClient(null);
    }
    setIsConnected(false);
    setResponse('');
  };

  const sendMessage = () => {
    if (!client || !message.trim()) return;
    
    try {
      console.log('Invio messaggio:', message);
      // Send message with newline terminator
      client.write(message + '\n');
      setMessage('');
    } catch (error) {
      console.log('Errore invio messaggio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      Alert.alert('Errore', `Invio fallito: ${errorMessage}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connessione Raspberry Pi</Text>
      
      {!isConnected ? (
        <View style={styles.connectionPanel}>
          <TextInput
            style={styles.input}
            placeholder="Indirizzo IP (es. 192.168.1.100)"
            value={serverIp}
            onChangeText={setServerIp}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Porta (es. 12345)"
            value={serverPort}
            onChangeText={setServerPort}
            keyboardType="numeric"
          />
          
          <Button 
            title={isConnecting ? "Connessione in corso..." : "Connetti al Server"} 
            onPress={connectToServer} 
            color="#4CAF50"
            disabled={isConnecting}
          />
          
          <Text style={styles.tipText}>
            Assicurati che il server sia in esecuzione e raggiungibile
          </Text>
        </View>
      ) : (
        <View style={styles.chatPanel}>
          <Text style={styles.connectedText}>
            Connesso a: {serverIp}:{serverPort}
          </Text>
          
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Scrivi un messaggio o comando"
            placeholderTextColor="#999"
            onSubmitEditing={sendMessage}
          />
          
          <View style={styles.buttonContainer}>
            <Button 
              title="Invia Messaggio" 
              onPress={sendMessage} 
              color="#2196F3"
              disabled={!message.trim()}
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="Disconnetti" 
              onPress={disconnect} 
              color="#F44336"
            />
          </View>
          
          {response ? (
            <View style={styles.responseContainer}>
              <Text style={styles.responseLabel}>Risposta dal server:</Text>
              <Text style={styles.responseText}>{response}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  connectionPanel: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  chatPanel: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  connectedText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#4CAF50',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonSpacer: {
    width: 20,
  },
  responseContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e9f5e9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  responseLabel: {
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
  },
  tipText: {
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
});

export default TcpConnection;