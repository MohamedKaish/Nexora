import { defineConfig } from 'vitest/config'
import path from 'path'
import dns from 'node:dns'

// Prioritize IPv4 on Windows to prevent undici connect timeouts on unreachable IPv6 addresses
dns.setDefaultResultOrder('ipv4first')

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 90000,
    hookTimeout: 90000,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})

