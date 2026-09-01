import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests',
  timeout:180_000,
  expect:{timeout:120_000},
  fullyParallel:false,
  workers:1,
  use:{
    baseURL:'http://127.0.0.1:3000',
    trace:'retain-on-failure'
  },
  webServer:{
    command:'npm run start -- -p 3000',
    url:'http://127.0.0.1:3000/__test/tts',
    timeout:120_000,
    reuseExistingServer:false,
    env:{TTS_E2E:'1'}
  },
  projects:[
    {name:'chromium',use:{...devices['Desktop Chrome']}},
    {name:'firefox',use:{...devices['Desktop Firefox']}},
    {name:'webkit',use:{...devices['Desktop Safari']}}
  ]
});
