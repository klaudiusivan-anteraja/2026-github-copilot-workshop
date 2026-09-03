import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import dbPlugin from './plugins/db.js';
import requisitionRoutes from './routes/requisition-routes.js';
import purchaseOrderRoutes from './routes/purchase-order-routes.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true,
  });

  app.register(swagger, {
    swagger: {
      info: {
        title: 'Procurement MVP API',
        description: 'API for managing Requisitions, Purchase Orders, and Goods Receipts',
        version: '1.0.0',
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        {
          name: 'Health',
          description: 'Service health check',
        },
        {
          name: 'Requisitions',
          description: 'Requisition (PR) endpoints',
        },
        {
          name: 'Purchase Orders',
          description: 'Purchase Order (PO) endpoints',
        },
      ],
    },
  });

  app.register(swaggerUI, {
    routePrefix: '/api-docs',
  });

  app.register(dbPlugin);
  app.register(requisitionRoutes);
  app.register(purchaseOrderRoutes);

  app.get('/health', {
    schema: {
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
      },
    },
  }, async () => ({ status: 'ok' }));

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (reply.sent) {
      return;
    }

    if (error.statusCode >= 400 && error.statusCode < 500) {
      reply.code(error.statusCode).send({ message: error.message });
      return;
    }

    reply.code(500).send({ message: 'Internal server error' });
  });

  return app;
}
