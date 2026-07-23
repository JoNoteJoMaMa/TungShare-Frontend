import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  use: {
    headless: true,
    launchOptions: {
      args: [
        '--allow-insecure-localhost',
        '--disable-web-security',
        '--enable-experimental-web-platform-features'
      ]
    }
  },
  webServer: [
    {
      command: 'node ../TungShare-Backend/server.js',
      url: 'http://localhost:8080/health',
      reuseExistingServer: true,
      timeout: 15_000,
    },
    {
      command: 'pnpm run dev --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 15_000,
    }
  ],
});
