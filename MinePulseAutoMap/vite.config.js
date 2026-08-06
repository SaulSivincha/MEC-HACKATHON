import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { promises as fs } from 'node:fs'
import path from 'node:path'

function routePersistence() {
  const routesFile = path.resolve(process.cwd(), 'src/data/routes.json')
  return {
    name: 'pukaria-route-persistence',
    configureServer(server) {
      server.middlewares.use('/api/routes', (request, response, next) => {
        if (request.method !== 'POST') return next()
        let body = ''
        request.on('data', (chunk) => { body += chunk })
        request.on('end', async () => {
          try {
            const routes = JSON.parse(body)
            const valid = routes && typeof routes === 'object' && Object.values(routes).every(
              (points) => Array.isArray(points) && points.every(
                (point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite),
              ),
            )
            if (!valid) throw new Error('Formato de rutas inválido')
            await fs.writeFile(routesFile, `${JSON.stringify(routes, null, 2)}\n`, 'utf8')
            response.statusCode = 200
            response.setHeader('Content-Type', 'application/json')
            response.end('{"saved":true}')
          } catch (error) {
            response.statusCode = 400
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ saved: false, error: error.message }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), routePersistence()],
})
