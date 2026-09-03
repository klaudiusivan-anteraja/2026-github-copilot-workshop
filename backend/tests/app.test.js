import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { buildApp } from '../src/app.js';

describe('app validation handling', () => {
  let app;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  test('returns Fastify validation status and message for invalid request bodies', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/requisitions',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('requesterName'),
      })
    );
  });

  test('accepts the camelCase requisition create payload used by the frontend', async () => {
    const client = {
      query: jest.fn((sql) => {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
          return { rows: [], rowCount: 0 };
        }

        return { rows: [], rowCount: 1 };
      }),
      release: jest.fn(),
    };

    let detailQueryCall = 0;
    app.db.query = jest.fn((sql) => {
      if (sql.includes('COUNT(*)::int AS total FROM purchase_requisitions')) {
        return { rows: [{ total: 0 }], rowCount: 1 };
      }

      detailQueryCall += 1;
      if (detailQueryCall === 1) {
        return {
          rows: [{
            id: 'created-pr-id',
            pr_number: 'PR-2026-0001',
            status: 'DRAFT',
            requester_name: 'Rina',
            department_name: 'Ops',
            title: 'Safety stock',
            notes: null,
            needed_by_date: '2026-10-01',
            created_at: '2026-09-03T00:00:00.000Z',
            updated_at: '2026-09-03T00:00:00.000Z',
          }],
          rowCount: 1,
        };
      }

      return {
        rows: [{
          id: 'line-1',
          line_no: 1,
          item_code: 'ITEM-001',
          item_name: 'Helmet',
          qty_requested: 2,
          qty_allocated: 0,
          qty_received: 0,
          uom: 'PCS',
          est_unit_price: 10,
          site_code: 'JKT',
          required_date: null,
          budget_center: null,
        }],
        rowCount: 1,
      };
    });
    app.db.pool.connect = jest.fn(async () => client);

    const response = await app.inject({
      method: 'POST',
      url: '/api/requisitions',
      payload: {
        requesterName: 'Rina',
        departmentName: 'Ops',
        title: 'Safety stock',
        neededByDate: '2026-10-01',
        lines: [
          {
            itemCode: 'ITEM-001',
            itemName: 'Helmet',
            qtyRequested: 2,
            uom: 'PCS',
            estUnitPrice: 10,
            siteCode: 'JKT',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual(
      expect.objectContaining({
        prNumber: 'PR-2026-0001',
        requesterName: 'Rina',
        departmentName: 'Ops',
        title: 'Safety stock',
      })
    );
  });
});
