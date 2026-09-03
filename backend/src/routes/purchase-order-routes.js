import {
  createPurchaseOrder,
  getOpenPoLines,
  getPurchaseOrderById,
  listPurchaseOrders,
  submitPurchaseOrder,
} from '../services/purchase-order-service.js';

const purchaseOrderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    poNumber: { type: 'string' },
    status: { type: 'string' },
    vendorName: { type: 'string' },
    prNumber: { type: ['string', 'null'] },
    requesterName: { type: ['string', 'null'] },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          lineNo: { type: 'integer' },
          itemCode: { type: 'string' },
          itemName: { type: 'string' },
          qtyOrdered: { type: 'number' },
          qtyReceived: { type: 'number' },
          qtyOpenForGr: { type: 'number' },
          uom: { type: 'string' },
          unitPrice: { type: 'number' },
          siteCode: { type: 'string' },
          requiredDate: { type: ['string', 'null'] },
          allocations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                prLineId: { type: 'string' },
                prNumber: { type: 'string' },
                requesterName: { type: 'string' },
                allocatedQty: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
};

const errorSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
};

export default async function purchaseOrderRoutes(fastify) {
  fastify.get('/api/purchase-orders', {
    schema: {
      tags: ['Purchase Orders'],
      summary: 'List all purchase orders',
      description: 'Retrieve a list of all purchase orders',
      response: {
        200: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: purchaseOrderSchema,
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const items = await listPurchaseOrders(fastify.db);
    return { items };
  });

  fastify.post('/api/purchase-orders', {
    schema: {
      tags: ['Purchase Orders'],
      summary: 'Create a new purchase order',
      description: 'Create a new PO with allocated quantities from approved requisition lines',
      body: {
        type: 'object',
        required: ['vendorName', 'lines'],
        properties: {
          vendorName: { type: 'string', minLength: 1 },
          lines: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: [
                'prLineId',
                'itemCode',
                'itemName',
                'qtyOrdered',
                'unitPrice',
                'uom',
                'siteCode',
              ],
              properties: {
                prLineId: { type: 'string' },
                itemCode: { type: 'string' },
                itemName: { type: 'string' },
                qtyOrdered: { type: 'number', exclusiveMinimum: 0 },
                unitPrice: { type: 'number', minimum: 0 },
                uom: { type: 'string' },
                siteCode: { type: 'string' },
                requiredDate: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
      response: {
        201: purchaseOrderSchema,
        400: errorSchema,
        422: errorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const purchaseOrder = await createPurchaseOrder(fastify.db, request.body);
      reply.code(201);
      return purchaseOrder;
    } catch (error) {
      if (error.statusCode) {
        reply.code(error.statusCode);
        return { message: error.message };
      }

      throw error;
    }
  });

  fastify.post('/api/purchase-orders/:id/submit', {
    schema: {
      tags: ['Purchase Orders'],
      summary: 'Submit a purchase order',
      description: 'Submit a draft PO (transition from DRAFT to SUBMITTED)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: purchaseOrderSchema,
        404: errorSchema,
        422: errorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const purchaseOrder = await submitPurchaseOrder(fastify.db, request.params.id);
      if (!purchaseOrder) {
        reply.code(404);
        return { message: 'Purchase order not found' };
      }

      return purchaseOrder;
    } catch (error) {
      if (error.statusCode) {
        reply.code(error.statusCode);
        return { message: error.message };
      }

      throw error;
    }
  });

  fastify.get('/api/purchase-orders/:id', {
    schema: {
      tags: ['Purchase Orders'],
      summary: 'Get purchase order by ID',
      description: 'Retrieve a specific purchase order with all its details and line items',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: purchaseOrderSchema,
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
    const purchaseOrder = await getPurchaseOrderById(fastify.db, request.params.id);
    if (!purchaseOrder) {
      reply.code(404);
      return { message: 'Purchase order not found' };
    }

    return purchaseOrder;
  });

  fastify.get('/api/purchase-orders/:id/open-lines', {
    schema: {
      tags: ['Purchase Orders'],
      summary: 'Get open lines for a purchase order',
      description: 'Retrieve line items from a PO that have unallocated quantities (for GR creation)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            purchaseOrder: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                poNumber: { type: 'string' },
                status: { type: 'string' },
              },
            },
            openLines: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
    const payload = await getOpenPoLines(fastify.db, request.params.id);
    if (!payload) {
      reply.code(404);
      return { message: 'Purchase order not found' };
    }

    return payload;
  });
}
