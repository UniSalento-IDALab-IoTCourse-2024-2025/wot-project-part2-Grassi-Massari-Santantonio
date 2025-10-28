// app/(tabs)/badge.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

type Nft = { id: string; uri: string };

export default function BadgeScreen() {
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riderName, setRiderName] = useState<string | null>(null);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    const loadRiderName = async () => {
      const name = await AsyncStorage.getItem('riderName');
      if (name) {
        console.log('Rider salvato:', name);
        setRiderName(name);
      }
      console.log("inizio caricamneto id");
      const id = await AsyncStorage.getItem('riderId');
      console.log("fine caricamneto id: ", id);
      if (id) {
        setRiderId(id);
      }
    };

    loadRiderName();
  }, []);

  useEffect(() => {
    const loadIp = async () => {
      const ip = await AsyncStorage.getItem('ip');
      if (ip) {
        console.log('ip:', ip);
        setHost(ip);
      }
    };

    loadIp();
  }, []);

  const baseUrl = `http://${host}:3000`;
  console.log('baseUrl: ', baseUrl);

  useEffect(() => {
    if (!riderName || !riderId || !host) return;
    console.log('Badge mount, inizio fetch…');
    (async () => {
      try {

        console.log('GET', `${baseUrl}/rider/${riderName}/experience`);
        const xpRes = await fetch(
          `${baseUrl}/rider/${riderName}/experience`
        );
        if (!xpRes.ok)
          throw new Error(`xp status: ${xpRes.status}`);
        const xpJson = await xpRes.json();
        console.log('xp:', xpJson);
        if (xpJson > 100) {
          setXp(100);
        } else {
          setXp(xpJson.experience);
        }

        console.log('expirience: ', xpJson.experience);

        console.log('GET', `${baseUrl}/rider/${riderId}/nfts`);
        const nftRes = await fetch(`${baseUrl}/rider/${riderId}/nfts`);
        if (!nftRes.ok)
          throw new Error(`nfts status: ${nftRes.status}`);
        const nftsJson: Nft[] = await nftRes.json();
        console.log('nfts:', nftsJson);
        setNfts(nftsJson);


      } catch (e: any) {
        console.error('Errore fetch badge:', e.message);
        setError(e.message);
      } finally {
        console.log('fetch badge FINITO');
        setLoading(false);
      }
    })();
  }, [riderName, riderId, host]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Caricamento badge…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Errore di rete: {error}</Text>
      </SafeAreaView>
    );
  }

  const level = Math.min(5, Math.floor(xp / 100) + 1);
  const currentXP = xp % 100;
  const xpPercent = (currentXP / 100) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Livello {level} / 5</Text>
      <View style={styles.barBg}>
        <View
          style={[styles.barFg, { width: `${xpPercent}%` }]}
        />
      </View>
      <Text style={styles.xpText}>
        {currentXP} / 100 XP
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {nfts.map((n) => (
          <NFTCard key={n.id} id={n.id} uri={n.uri} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function NFTCard({ uri, id }: { uri: string; id: string }) {
  const [img, setImg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      `NFTCard ${id}: fetch metadata ${uri}`
    );
    (async () => {
      try {
        let newUri = uri;
        console.log("OLD URI: ", newUri);
        if (newUri.startsWith('https://dweb.link/ipfs/')) {
          newUri = newUri.replace('https://dweb.link/ipfs/', 'https://yellow-tremendous-chickadee-226.mypinata.cloud/ipfs/')
        }
        console.log("NEW URI: ", newUri);
        const res = await fetch(newUri);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        console.log(`NFT ${id}:`, json);
        const originalUrl = json.image;

        console.log("Old link image ", originalUrl);

        let imageUrl = originalUrl;
        if (imageUrl.startsWith('https://gateway.pinata.cloud/ipfs/')) {
          imageUrl = imageUrl.replace('https://gateway.pinata.cloud/ipfs/', 'https://yellow-tremendous-chickadee-226.mypinata.cloud/ipfs/');

        }

        console.log("new Link image ", imageUrl);
        setImg(imageUrl);


      } catch (e: any) {
        console.error(
          `NFT ${id} error:`,
          e.message
        );
        setErr(e.message);
      }
    })();
  }, [uri, id]);

  if (err) {
    return (
      <View
        style={[styles.card, styles.cardError]}
      >
        <Text style={styles.cardText}>#{id}</Text>
        <Text style={styles.error}>{err}</Text>
      </View>
    );
  }

  if (!img) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: img }}
        style={styles.image}
      />
      <Text style={styles.cardText}>#{id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fafafa',
    marginTop: 25
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  barBg: {
    height: 20,
    backgroundColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFg: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  xpText: {
    textAlign: 'center',
    marginBottom: 12,
  },
  scroll: {
    paddingVertical: 10,
  },
  card: {
    width: 120,
    height: 140,
    backgroundColor: '#fff',
    marginRight: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  cardError: { backgroundColor: '#fee' },
  cardText: { marginTop: 6, fontWeight: '600' },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  error: {
    color: '#c00',
    textAlign: 'center',
  },
});
