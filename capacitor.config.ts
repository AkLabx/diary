import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.diary.app',
  appName: 'Diary',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "876926327353-jcn65s0e39fa5c79tsh98f6fe77e6e72.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
