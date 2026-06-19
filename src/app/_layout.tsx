import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LogbookProvider } from '@/context/logbook-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LogbookProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </LogbookProvider>
    </SafeAreaProvider>
  );
}
