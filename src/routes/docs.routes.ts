import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { getOpenApiSpec } from '../docs/openapi';

const docsRoutes = new Hono();

docsRoutes.get('/openapi.json', (c) => {
  return c.json(getOpenApiSpec());
});

docsRoutes.get('/docs', swaggerUI({ url: '/openapi.json' }));

export default docsRoutes;


