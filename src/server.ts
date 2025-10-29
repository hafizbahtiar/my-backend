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
import { createTable, createBanner } from './utils/table'

// Beautiful startup banner
const showBanner = () => {
  createBanner('🚀 TEMPLATE BACKEND API - HONO + BUN + MONGODB 🚀');
  console.log('    Starting server in development mode...\n');
};

showBanner();

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


// Beautiful server startup message
const startupMessage = () => {
  console.log('\n🚀 SERVER STARTED SUCCESSFULLY!');
  
  // Server information table
  const serverInfo = [
    { label: 'Environment', value: serverConfig.nodeEnv },
    { label: 'Port', value: serverConfig.port.toString() },
    { label: 'Host', value: '0.0.0.0' },
    { label: 'URL', value: `http://localhost:${serverConfig.port}` },
  ];
  
  createTable('SERVER INFO', serverInfo);
  
  // Endpoints table
  const endpoints = [
    { label: 'Root', value: `http://localhost:${serverConfig.port}/` },
    { label: 'Health', value: `http://localhost:${serverConfig.port}/health` },
    { label: 'API', value: `http://localhost:${serverConfig.port}/api` },
  ];
  
  createTable('ENDPOINTS', endpoints);
  
  console.log(`🎯 Ready to accept requests!`);
  console.log(`📊 Environment: ${serverConfig.nodeEnv}`);
  console.log(`🌐 Server URL: http://localhost:${serverConfig.port}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);
};

startupMessage();

export default app
