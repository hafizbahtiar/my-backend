import { Hono } from 'hono';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import sessionRoutes from './session.routes';
import deviceRoutes from './device.routes';
import addressRoutes from './address.routes';
import auditRoutes from './audit.routes';
import cronRoutes from './cron.routes';
import docsRoutes from './docs.routes';
import apiKeyRoutes from './apikey.routes';

const routes = new Hono();

// Mount all routes
routes.route('/api/auth', authRoutes);
routes.route('/api/user', userRoutes);
routes.route('/api/sessions', sessionRoutes);
routes.route('/api/devices', deviceRoutes);
routes.route('/api/addresses', addressRoutes);
routes.route('/api/audit', auditRoutes);
routes.route('/api/cron', cronRoutes);
routes.route('/api/apikeys', apiKeyRoutes);
routes.route('/', docsRoutes);

// Health check endpoint is now handled by monitoring middleware in server.ts

export default routes;

