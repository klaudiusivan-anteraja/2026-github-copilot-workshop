# Swagger/OpenAPI Documentation Setup

## Overview

This document describes the Swagger/OpenAPI integration added to the Procurement MVP Fastify backend.

## Installation

The following packages were installed to enable OpenAPI documentation:

```bash
npm install @fastify/swagger @fastify/swagger-ui
```

**Versions:**
- `@fastify/swagger`: 9.8.1 — Generates OpenAPI/Swagger specifications from route schemas
- `@fastify/swagger-ui`: 6.1.1 — Serves interactive Swagger UI documentation

## Configuration

### Backend Setup (`src/app.js`)

The Fastify app now registers both plugins:

```javascript
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

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
      { name: 'Health', description: 'Service health check' },
      { name: 'Requisitions', description: 'Requisition (PR) endpoints' },
      { name: 'Purchase Orders', description: 'Purchase Order (PO) endpoints' },
    ],
  },
});

app.register(swaggerUI, {
  routePrefix: '/api-docs',
});
```

## Route Documentation

### Schema Format

Each route now includes a `schema` property that documents:
- **tags**: Grouping in Swagger UI (e.g., "Requisitions", "Purchase Orders")
- **summary**: Brief endpoint description
- **description**: Detailed explanation
- **params**: URL parameter definitions
- **body**: Request body schema (for POST/PUT)
- **response**: Response schemas for different HTTP status codes

### Example Route

```javascript
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
```

## Accessing the Documentation

### Swagger UI

Open your browser and navigate to:

```
http://localhost:3000/api-docs
```

This provides an interactive interface to:
- View all endpoints organized by tag
- Read detailed descriptions and parameter information
- See request/response schemas
- **Try out** API endpoints directly from the UI

### Raw OpenAPI Specification

The generated OpenAPI/Swagger JSON specification is available at:

```
http://localhost:3000/api-docs/json
```

This can be used with tools like:
- Postman
- Insomnia
- API documentation generators
- CI/CD pipeline integration tests

## Documented Endpoints

### Health
- `GET /health` — Service status check

### Requisitions
- `GET /api/requisitions` — List all requisitions
- `POST /api/requisitions` — Create a new requisition
- `GET /api/requisitions/:id` — Get requisition by ID
- `POST /api/requisitions/:id/submit` — Submit a requisition
- `POST /api/requisitions/:id/approve` — Approve a requisition
- `GET /api/requisitions/:id/open-lines` — Get open lines for allocation

### Purchase Orders
- `GET /api/purchase-orders` — List all purchase orders
- `POST /api/purchase-orders` — Create a new purchase order
- `GET /api/purchase-orders/:id` — Get purchase order by ID
- `POST /api/purchase-orders/:id/submit` — Submit a purchase order
- `GET /api/purchase-orders/:id/open-lines` — Get open lines

## Schema Definitions

Reusable schemas are defined in each route file:

### Requisition Schema
```javascript
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
    lines: { /* line items array */ },
  },
};
```

### Purchase Order Schema
```javascript
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
    lines: { /* line items array */ },
  },
};
```

## Benefits

1. **Developer Experience**: Interactive API documentation available immediately
2. **Client Integration**: Accurate endpoint contracts for frontend/mobile clients
3. **API Testing**: Try endpoints directly in the browser without external tools
4. **Specification Export**: Download OpenAPI spec for CI/CD or third-party integrations
5. **Self-Documenting**: Schema definitions keep docs in sync with code
6. **Team Communication**: Clear API contracts reduce miscommunication

## Testing

The Swagger setup does not affect existing Jest tests:

```bash
npm test
# ✅ All 26 tests pass
```

## Future Enhancements

- Add request/response examples to schemas
- Document error response codes (429, 503, etc.)
- Add API authentication/authorization documentation
- Generate SDKs for specific client languages
- Integrate with API gateway documentation systems
