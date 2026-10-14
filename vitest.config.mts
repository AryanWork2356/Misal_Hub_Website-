import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      // `server-only` throws outside Next's server build; in unit tests it is a no-op
      'server-only': path.resolve(root, 'tests/stubs/server-only.ts'),
    },
  },
});
