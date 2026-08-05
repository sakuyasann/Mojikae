import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  // WxtVitest は wxt/browser などの解決とフェイク実装を用意してくれる
  plugins: [WxtVitest()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
