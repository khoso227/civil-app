import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.civilos.app',
  appName: 'Civil-OS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
