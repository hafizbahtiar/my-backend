// Minimal OpenAPI spec (v3.0) for core auth endpoints. Extend incrementally.
export function getOpenApiSpec() {
  const spec: any = {
    openapi: '3.0.3',
    info: {
      title: 'My Backend API',
      version: '1.0.0',
      description: 'API documentation for the Bun/Hono backend',
    },
    servers: [{ url: '/' }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
    ],
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'firstName', 'lastName', 'username'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    username: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Registered' },
            '400': { description: 'Validation error' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Logged in' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token (rotates refresh token)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            '200': { description: 'New access & refresh token' },
            '401': { description: 'Invalid/expired token' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout and deactivate session',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Logged out' },
            '400': { description: 'Bad request' },
          },
        },
      },
      '/api/auth/account-status': {
        get: {
          tags: ['Auth'],
          summary: 'Public account status check',
          parameters: [
            { name: 'email', in: 'query', schema: { type: 'string', format: 'email' } },
            { name: 'username', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Status' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };

  return spec;
}


