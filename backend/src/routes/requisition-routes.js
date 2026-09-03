import {
  approveRequisition,
  createRequisition,
  getRequisitionById,
  getRequisitionOpenLines,
  listRequisitions,
  submitRequisition,
} from '../services/requisition-service.js';

const requisitionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    prNumber: { type: 'string' },
    status: { type: 'string' },
    requesterName: { type: 'string' },
    departmentName: { type: 'string' },
    title: { type: 'string' },
    notes: { type: ['string', 'null'] },
    neededByDate: { type: ['string', 'null'] },
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
          qtyRequested: { type: 'number' },
          qtyAllocated: { type: 'number' },
          qtyReceived: { type: 'number' },
          qtyOpenForPo: { type: 'number' },
          uom: { type: 'string' },
          estUnitPrice: { type: 'number' },
          siteCode: { type: 'string' },
          requiredDate: { type: ['string', 'null'] },
          budgetCenter: { type: ['string', 'null'] },
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

export default async function requisitionRoutes(fastify) {
  fastify.get('/api/requisitions', {
    schema: {
      tags: ['Requisitions'],
      summary: 'List all requisitions',
      description: 'Retrieve a list of all purchase requisitions',
      response: {
        200: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: requisitionSchema,
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const items = await listRequisitions(fastify.db);
    return { items };
  });

  fastify.post('/api/requisitions', {
    schema: {
      tags: ['Requisitions'],
      summary: 'Create a new requisition',
      description: 'Create a new purchase requisition with line items',
      body: {
        type: 'object',
        required: ['requesterName', 'departmentName', 'title', 'lines'],
        properties: {
          requesterName: { type: 'string', minLength: 1 },
          departmentName: { type: 'string', minLength: 1 },
          title: { type: 'string', minLength: 1 },
          notes: { type: ['string', 'null'] },
          neededByDate: { type: ['string', 'null'] },
          lines: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: [
                'itemCode',
                'itemName',
                'qtyRequested',
                'uom',
                'estUnitPrice',
                'siteCode',
              ],
              properties: {
                itemCode: { type: 'string', minLength: 1 },
                itemName: { type: 'string', minLength: 1 },
                qtyRequested: { type: 'number', exclusiveMinimum: 0 },
                uom: { type: 'string', minLength: 1 },
                estUnitPrice: { type: 'number', minimum: 0 },
                siteCode: { type: 'string', minLength: 1 },
                requiredDate: { type: ['string', 'null'] },
                budgetCenter: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
      response: {
        201: requisitionSchema,
        400: errorSchema,
        422: errorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const requisition = await createRequisition(fastify.db, request.body);
      reply.code(201);
      return requisition;
    } catch (error) {
      if (error.statusCode) {
        reply.code(error.statusCode);
        return { message: error.message };
      }

      throw error;
    }
  });

  fastify.post('/api/requisitions/:id/submit', {
    schema: {
      tags: ['Requisitions'],
      summary: 'Submit a requisition',
      description: 'Submit a draft requisition (transition from DRAFT to SUBMITTED)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: requisitionSchema,
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const requisition = await submitRequisition(fastify.db, request.params.id);
      if (!requisition) {
        reply.code(404);
        return { message: 'Requisition not found' };
      }

      return requisition;
    } catch (error) {
      if (error.statusCode) {
        reply.code(error.statusCode);
        return { message: error.message };
      }

      throw error;
    }
  });

  fastify.post('/api/requisitions/:id/approve', {
    schema: {
      tags: ['Requisitions'],
      summary: 'Approve a requisition',
      description: 'Approve a submitted requisition (transition from SUBMITTED to APPROVED)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: requisitionSchema,
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const requisition = await approveRequisition(fastify.db, request.params.id);
      if (!requisition) {
        reply.code(404);
        return { message: 'Requisition not found' };
      }

      return requisition;
    } catch (error) {
      if (error.statusCode) {
        reply.code(error.statusCode);
        return { message: error.message };
      }

      throw error;
    }
  });

  fastify.get('/api/requisitions/:id', {
    schema: {
      tags: ['Requisitions'],
      summary: 'Get requisition by ID',
      description: 'Retrieve a specific requisition with all its details and line items',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: requisitionSchema,
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
    const requisition = await getRequisitionById(fastify.db, request.params.id);
    if (!requisition) {
      reply.code(404);
      return { message: 'Requisition not found' };
    }

    return requisition;
  });

  fastify.get('/api/requisitions/:id/open-lines', {
    schema: {
      tags: ['Requisitions'],
      summary: 'Get open lines for a requisition',
      description: 'Retrieve line items from a requisition that have unallocated quantities (for PO creation)',
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
            requisition: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                prNumber: { type: 'string' },
                status: { type: 'string' },
              },
            },
            openLines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  lineNo: { type: 'integer' },
                  itemCode: { type: 'string' },
                  itemName: { type: 'string' },
                  qtyRequested: { type: 'number' },
                  qtyAllocated: { type: 'number' },
                  qtyReceived: { type: 'number' },
                  qtyOpenForPo: { type: 'number' },
                  uom: { type: 'string' },
                  estUnitPrice: { type: 'number' },
                  siteCode: { type: 'string' },
                  requiredDate: { type: ['string', 'null'] },
                  budgetCenter: { type: ['string', 'null'] },
                },
              },
            },
          },
        },
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
    const payload = await getRequisitionOpenLines(fastify.db, request.params.id);
    if (!payload) {
      reply.code(404);
      return { message: 'Requisition not found' };
    }

    return payload;
  });
}
