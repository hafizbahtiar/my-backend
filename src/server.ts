import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { compress } from 'hono/compress'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import connectDB from './config/database'
import { getConnectionStatus, serverConfig } from './config'
import routes from './routes'
import { requestMonitoring, healthCheck, serveUploadedFiles } from './middleware'
import { logger as customLogger } from './utils/logger'

const app = new Hono()

// Apply security middleware first (order matters)
// Use Hono's built-in CORS
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',');

app.use('*', cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
}))

// Use Hono's built-in security headers
app.use('*', secureHeaders())

// OPTIMIZATION: Add compression for JSON responses
app.use('*', compress())

// OPTIMIZATION: Pretty JSON in development (makes debugging easier)
if (serverConfig.nodeEnv === 'development') {
  app.use('*', logger()) // Request logging
  app.use('/api/*', prettyJSON()) // Pretty JSON responses
}

// Apply request monitoring middleware
app.use('*', requestMonitoring)

// Serve static files from uploads directory with security
app.use('/uploads/*', serveUploadedFiles())

// Root endpoint
app.get('/', (c) => {
  const dbStatus = getConnectionStatus()
  
  return c.json({
    message: 'Template Backend API',
    status: 'running',
    database: {
      connected: dbStatus.isConnected,
      state: dbStatus.readyStateText,
    },
    timestamp: new Date().toISOString(),
  })
})

// Health check endpoint (with monitoring)
app.get('/health', healthCheck)

// Mount all routes
app.route('/', routes)

// Initialize database connection
connectDB().catch((error: Error) => {
  customLogger.error('Failed to connect to database', error)
  process.exit(1)
})

// Start server with Bun.serve
Bun.serve({
  fetch: app.fetch,
  port: serverConfig.port,
  hostname: '0.0.0.0', // Listen on all interfaces
})

customLogger.info(`🚀 Server is running on http://localhost:${serverConfig.port}`)

export default app
