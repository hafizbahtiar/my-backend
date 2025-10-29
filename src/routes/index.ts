import { Hono } from 'hono';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import sessionRoutes from './session.routes';
import deviceRoutes from './device.routes';
import addressRoutes from './address.routes';
import auditRoutes from './audit.routes';

const routes = new Hono();

// Mount all routes
routes.route('/api/auth', authRoutes);
routes.route('/api/user', userRoutes);
routes.route('/api/sessions', sessionRoutes);
routes.route('/api/devices', deviceRoutes);
routes.route('/api/addresses', addressRoutes);
routes.route('/api/audit', auditRoutes);

// Health check endpoint is now handled by monitoring middleware in server.ts

export default routes;

