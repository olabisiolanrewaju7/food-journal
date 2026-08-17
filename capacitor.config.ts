import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.foodjournal.app',
  appName: 'FoodJournal',
  // Point to live Vercel deployment — API routes stay server-side
  server: {
    url: 'https://food-journal-jet.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
  },
}

export default config
