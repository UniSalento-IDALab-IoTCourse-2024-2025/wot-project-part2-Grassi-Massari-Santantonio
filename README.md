# FastGo Client Service

Questo repository contiene il microservizio dedicato alla gestione del profilo "Client"  nella piattaforma FastGo. Il servizio è sviluppato in Java Spring Boot e si occupa di memorizzare i dati anagrafici dei clienti, sincronizzandosi con il servizio di Autenticazione tramite RabbitMQ.

## Struttura del Progetto

.
├── src/main/java/com/fastgo/client/fastgo_client/
│   ├── component/          # Listener RabbitMQ (SyncListener)
│   ├── config/             # Configurazione RabbitMQ
│   ├── service/            # Logica di business (ClientService)
│   ├── domain/             # Entità MongoDB (Client)
│   ├── repositories/       # Interfaccia MongoRepository
│   ├── security/           # Gestione e validazione JWT
│   └── dto/                # Data Transfer Objects
├── src/main/resources/
│   └── application.properties # Configurazione applicativa
├── docker-compose.yml      # Orchestrazione container (App + MongoDB)
└── build.gradle            # Gestione dipendenze Gradle

## Prerequisiti

* Java JDK 21 (basato sull'immagine Docker `eclipse-temurin:21-jdk`)
* MongoDB
* RabbitMQ

## Configurazione

Il servizio richiede la configurazione delle seguenti proprietà nel file `src/main/resources/application.properties` o tramite variabili d'ambiente:

1. Database (MongoDB):
   spring.data.mongodb.uri=mongodb://clientdb:27017/client

2. RabbitMQ (Messaging):
   spring.rabbitmq.host=172.31.12.119 (o IP del container RabbitMQ)
   spring.rabbitmq.port=5672
   spring.rabbitmq.username=guest
   spring.rabbitmq.password=guest

## Compilazione e Avvio

### Metodo 1: Tramite Gradle (Locale)

1. Pulizia e build del progetto:
   ./gradlew clean build

2. Avvio dell'applicazione:
   ./gradlew bootRun

### Metodo 2: Tramite Docker Compose

Il file `docker-compose.yml` incluso avvia sia il microservizio che un'istanza dedicata di MongoDB.

1. Generare il file JAR:
   ./gradlew clean build

2. Avviare i container:
   docker-compose up -d


## Architettura e Sincronizzazione

Il servizio implementa un pattern di architettura "Event-Driven" per la creazione dei profili:

1. Quando un utente si registra sull'Authentication Service, viene inviato un evento su RabbitMQ.
2. La classe `SyncListener` di questo servizio intercetta l'evento.
3. Il metodo `saveClientFromDto` in `ClientService` salva i dati (Nome, Cognome, Foto profilo) nel database locale MongoDB.

Questo garantisce che il servizio Client possa operare anche se il servizio di Autenticazione è temporaneamente offline, mantenendo una copia locale dei dati necessari.

## Funzionalità Principali

* Gestione Profilo Cliente:
  * Salvataggio e aggiornamento dati anagrafici.
  * Recupero informazioni cliente tramite Token JWT.
  * Gestione immagine del profilo.

* Sicurezza:
  * Validazione Token JWT tramite `JwtUtilities`.
  * Controllo dei ruoli (Role.USER).