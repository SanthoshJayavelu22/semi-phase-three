// backend/src/docs/swaggerSpec.ts
export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SEMI Board & ERP API Documentation',
    version: '1.0.0',
    description: 'RESTful API endpoints for Society for Emergency Medicine India (SEMI) Institute ERP and Academy Portal.',
  },
  servers: [
    {
      url: 'http://localhost:5003',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'System Health Status',
        description: 'Returns real-time status of database connectivity and server metrics.',
        responses: {
          '200': { description: 'System Operational' },
          '503': { description: 'Service Degraded / DB Disconnected' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'User Login',
        description: 'Authenticates user and returns JWT authorization tokens.',
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/institute/apply': {
      post: {
        summary: 'Submit Institute Accreditation Application',
        description: 'Registers a new hospital institute application with required document links.',
        responses: {
          '201': { description: 'Application submitted successfully' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/api/results': {
      get: {
        summary: 'Fetch Examination Results',
        description: 'Retrieves paginated student results with course and semester filters.',
        responses: {
          '200': { description: 'Results retrieved successfully' },
        },
      },
    },
  },
};
