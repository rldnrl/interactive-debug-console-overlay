import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    return {
      plugins: [
        dts({
          insertTypesEntry: true,
          rollupTypes: true,
        }),
      ],
      build: {
        lib: {
          entry: resolve(
            fileURLToPath(new URL('.', import.meta.url)),
            'src/index.ts'
          ),
          name: 'InteractiveDebugConsoleOverlay',
          formats: ['es', 'umd'],
          fileName: (format) =>
            `interactive-debug-console-overlay.${format === 'es' ? 'js' : 'umd.js'}`,
        },
        rollupOptions: {
          external: [],
          output: {
            globals: {},
          },
        },
        sourcemap: true,
        minify: false,
        target: 'es2015',
      },
    }
  }

  return {
    root: '.',
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'dist-dev',
    },
  }
})
