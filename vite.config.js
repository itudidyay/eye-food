import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handler as productLookup } from './netlify/functions/product-lookup.js'

// Netlify Functions only run on Netlify or under `netlify dev`. This small plugin runs the
// same product lookup inside `npm run dev`, so barcode lookup also works on your own computer.
// The production build is unchanged: on Netlify the real function is used.
function localNetlifyFunctions() {
  const routes = {
    '/.netlify/functions/product-lookup': productLookup,
  }
  return {
    name: 'local-netlify-functions',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const run = routes[url.pathname]
        if (!run) return next()

        const result = await run({
          httpMethod: req.method,
          queryStringParameters: Object.fromEntries(url.searchParams),
        })
        res.statusCode = result.statusCode
        for (const [name, value] of Object.entries(result.headers ?? {})) {
          res.setHeader(name, value)
        }
        res.end(result.body)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localNetlifyFunctions()],
})
