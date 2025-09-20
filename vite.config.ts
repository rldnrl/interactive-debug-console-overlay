import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dts from 'vite-plugin-dts'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const baseConfig: UserConfig = {
    plugins: [
      react(),
      dts({
        insertTypesEntry: true,
      }),
    ],
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'InteractiveDebugConsoleOverlay',
        formats: ['es', 'umd'],
        fileName: (format) => `index.${format}.js`,
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }

  if (command === 'serve') {
    // Dev server specific config
    return {
      ...baseConfig,
      plugins: [...(baseConfig.plugins || []), tailwindcss()],
      build: undefined, // In serve mode, we don't need the library build options
    }
  } else {
    // Build specific config
    return baseConfig
  }
})
