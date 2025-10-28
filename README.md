# Progetto Universitario: Applicazione Mobile FASTGO Rider

**Università del Salento - Corso di Internet of Things - A.A. 2024-2025**

## Descrizione

Questa repository contiene il codice sorgente per l'applicazione mobile **FASTGO Rider**, sviluppata come parte del corso di Internet of Things. L'applicazione è destinata ai rider della piattaforma FASTGO e consente loro di gestire le proprie attività di consegna.

Realizzata utilizzando React Native ed Expo, l'applicazione permette ai rider di:
* Gestire il proprio stato (online/offline).
* Visualizzare gli ordini disponibili nelle vicinanze.
* Accettare o rifiutare ordini.
* Visualizzare i dettagli dell'ordine accettato su una mappa interattiva.
* Utilizzare la navigazione esterna per raggiungere la destinazione.
* Segnalare il completamento di una consegna.
* Monitorare lo "stato di salute" della consegna tramite integrazione con un componente IoT.
* Visualizzare lo storico delle consegne e il riepilogo dei guadagni.
* Tracciare i propri progressi attraverso un sistema di livelli (XP) e badge digitali (NFT).
* Stabilire una connessione TCP diretta con dispositivi esterni (es. Raspberry Pi) per funzionalità specifiche.

## Tecnologie Utilizzate

* **Framework:** React Native con Expo
* **Linguaggio:** TypeScript
* **Navigazione:** Expo Router, React Navigation
* **Gestione dello Stato:** React Context (`AuthContext` per autenticazione e IP backend), AsyncStorage (per token, IP, ID rider, nome rider, storico locale)
* **UI Components:**
    * React Native Core Components
    * Expo BlurView (per effetti visivi su iOS)
    * Expo Symbols (per icone SF Symbols su iOS)
    * React Native Maps (per visualizzazione mappa)
    * React Native Chart Kit (per grafici guadagni)
* **Comunicazione:**
    * Axios (per chiamate API REST al backend)
    * react-native-tcp-socket (per comunicazione TCP diretta con dispositivi IoT)
* **API & Funzionalità Native:**
    * Expo Haptics (feedback tattile)
    * Expo Location (geolocalizzazione)
    * Expo Web Browser (apertura link esterni)
* **Autenticazione:** Basata su token JWT, gestita tramite backend custom e `AuthContext`
* **Deployment:** EAS (Expo Application Services)

## Funzionalità Principali

1.  **Autenticazione Rider:**
    * Login sicuro tramite indirizzo IP del backend, email e password.
    * Gestione della sessione utente mediante token (access e refresh) salvati in AsyncStorage.

2.  **Gestione Stato e Ordini:**
    * Switch online/offline per la disponibilità a ricevere ordini.
    * Polling periodico per nuovi ordini disponibili quando online.
    * Visualizzazione degli ordini pendenti con dettagli (indirizzo).
    * Possibilità di accettare o rifiutare un ordine proposto.

3.  **Consegna Attiva:**
    * Visualizzazione dell'ordine corrente sulla mappa con marker di destinazione.
    * Integrazione con app di navigazione (es. Google Maps) per indicazioni stradali.
    * Monitoraggio in tempo reale dello stato di salute della consegna tramite API IoT.
    * Funzionalità per segnalare il completamento della consegna.

4.  **Integrazione IoT:**
    * Comunicazione con un backend IoT dedicato per avviare/fermare script relativi alla consegna attiva (es. monitoraggio sensori su Raspberry Pi).
    * Polling dello stato di salute (es. temperatura, urti) durante la consegna.
    * Schermata dedicata per la connessione TCP diretta a dispositivi (es. Raspberry Pi) per invio comandi/messaggi.

5.  **Profilo e Statistiche:**
    * Schermata utente con email e opzioni.
    * Visualizzazione dello storico delle consegne effettuate.
    * Riepilogo dei guadagni totali e settimanali, con grafico a barre dei guadagni giornalieri.
    * Sezione Badge per visualizzare il livello di esperienza (XP) e gli NFT collezionati.
    * Funzionalità di Logout con pulizia dei dati di sessione.

## Struttura del Progetto

Il progetto adotta la struttura basata su file system promossa da Expo Router:

* **`app/`**: Contiene tutte le route (schermate) dell'applicazione.
    * **`(tabs)/`**: Layout e schermate della Tab Navigation (`index.tsx` per la mappa, `user.tsx` per il profilo, `badge.tsx` per i badge).
    * `Login.tsx`: Schermata di autenticazione.
    * `Deliveries.tsx`: Schermata dello storico consegne.
    * `Earnings.tsx`: Schermata dei guadagni.
    * `TcpConnection.tsx`: Schermata per la connessione TCP.
    * `_layout.tsx`: Layout principale che gestisce l'autenticazione e il tema.
    * `+not-found.tsx`: Schermata per route non trovate.
* **`assets/`**: Include immagini (icone, loghi, splash screen) e font (`SpaceMono-Regular.ttf`).
* **`components/`**: Contiene componenti React riutilizzabili per l'interfaccia utente (es. `ThemedText`, `IconSymbol`, `Collapsible`, `ExternalLink`).
* **`constants/`**: Definizioni di costanti globali, come la palette di colori (`Colors.ts`).
* **`context/`**: Implementazione del Context API, in particolare `AuthContext.tsx` per la gestione dell'autenticazione e dello stato utente.
* **`hooks/`**: Custom Hooks per logica riutilizzabile (es. `useThemeColor`, `useColorScheme`).
* **`scripts/`**: Script di supporto per lo sviluppo (es. `reset-project.js`).
* **`types/`**: Definizioni di tipi TypeScript globali (`Types.ts`).
* **File di Configurazione**: Include `app.json` (config Expo), `eas.json` (config EAS Build/Submit), `package.json` (dipendenze e script), `tsconfig.json` (config TypeScript), `eslint.config.js` (config ESLint), `.gitignore`.

## Installazione ed Esecuzione

1.  **Clonare la repository:**
    ```bash
    git clone <URL_DELLA_REPOSITORY>
    cd wot-project-part1-Grassi-Massari-Santantonio
    ```
2.  **Installare le dipendenze:**
    ```bash
    npm install
    ```
3.  **Avviare l'applicazione con Expo:**
    ```bash
    npx expo start
    ```
4.  Seguire le istruzioni visualizzate nel terminale per aprire l'app su un emulatore Android, un simulatore iOS o su un dispositivo fisico tramite l'app Expo Go.

## Configurazione

Al primo avvio, l'applicazione presenterà la schermata di Login. È necessario inserire l'indirizzo IP (o hostname) del server backend FASTGO affinché l'app possa comunicare con le API per l'autenticazione, il caricamento degli ordini, dei guadagni e dei badge. L'IP inserito viene salvato localmente tramite AsyncStorage per gli accessi successivi. Assicurarsi che il dispositivo sia sulla stessa rete locale del backend o che l'IP sia raggiungibile.

## Autori

* **Francesco Grassi**
* **Daniele Massari**
* **Alessio Santantonio**
