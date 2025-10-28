import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  return (
    <AuthProvider>
      <LayoutContent 
        colorScheme={colorScheme} 
        fontsLoaded={fontsLoaded} 
        fontError={fontError} 
      />
    </AuthProvider>
  );
}

function LayoutContent({ 
  colorScheme,
  fontsLoaded,
  fontError
}: { 
  colorScheme: any, 
  fontsLoaded: boolean, 
  fontError: Error | null 
}) {
  const { user, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!fontsLoaded || authLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inAuthGroup = segments[0] === 'Login';

    if (user && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!user && !inAuthGroup) {
      router.replace('/Login');
    }
  }, [user, segments, authLoading, fontsLoaded]);

  if (!fontsLoaded || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    
 <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
  <SafeAreaView style={styles.wrapper}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
    <StatusBar style="auto" />
  </SafeAreaView>
</ThemeProvider>
  );

  
}
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginTop: 38
  }
});