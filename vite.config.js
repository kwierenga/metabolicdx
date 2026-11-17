import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// Content stamps for the knowledge base and the scoring engine.
//
// KB_VERSION / KB_DATE in src/disorders.js are maintained by hand and guarded by
// src/__tests__/kb-version.test.js. These hashes need no maintenance: they are
// derived from the file contents at build time, so two builds differ in hash
// exactly when the data or engine differs. A saved case records the hashes it
// was scored under, which is how the app tells a stale result from a current one.
function hashOf(files) {
  const h = createHash('sha256')
  for (const f of files) h.update(readFileSync(resolve(here, f)))
  return h.digest('hex').slice(0, 8)
}
const KB_HASH = hashOf(['src/disorders.js'])
const ENGINE_HASH = hashOf(['src/scoring.js', 'src/analytes.js', 'src/modifiers.js', 'src/patterns.js', 'src/qc.js'])

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  define: {
    __KB_HASH__: JSON.stringify(KB_HASH),
    __ENGINE_HASH__: JSON.stringify(ENGINE_HASH),
  },
  build: {
    rollupOptions: {
      output: {
        // Split code by how often it changes, so a deploy only invalidates what
        // actually moved:
        //   react / supabase / xlsx  — vendor, changes on dependency bumps
        //   kb                       — the knowledge base (~750 KB of source),
        //                              changes on every disorder edit
        //   index                    — the React layer and engine
        // xlsx is additionally loaded on demand (dynamic import on file drop),
        // so it is not on the critical path at all.
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
          if (id.includes('node_modules/@supabase')) return 'supabase'
          if (id.includes('node_modules/xlsx')) return 'xlsx'
          if (/[\\/]src[\\/]disorders\.js$/.test(id)) return 'kb'
          return undefined
        },
      },
    },
  },
})
