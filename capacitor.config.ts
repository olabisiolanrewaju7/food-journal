import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ruach.foodjournal',
  appName: 'FoodJournal',
  // Point to live Vercel deployment — API routes stay server-side
  server: {
    url: 'https://food-journal-jet.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#004d1a',
      splashFullScreen: true,
      splashImmersive: true,
      showSpinner: false,
    },
  },
}

export default config
