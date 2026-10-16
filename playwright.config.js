import {defineConfig} from '@playwright/test';
const production = process.env.TEST_PRODUCTION === '1';
const url = `http://127.0.0.1:${production ? 5174 : 5173}`;
export default defineConfig({testDir:'./tests',use:{baseURL:url,headless:true,launchOptions:process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}},webServer:{command:production?'npm run preview -- --port 5174':'npm run dev -- --port 5173',url,reuseExistingServer:!production&&!process.env.CI}});
