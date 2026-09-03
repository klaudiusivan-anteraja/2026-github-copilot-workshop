import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import {
  listRequisitions,
  getRequisitionById,
} from '../../src/services/requisition-service.js';

/**
 * Test suite for Requisition Service list operations.
 * Focuses on data retrieval and transformation for frontend consumption.
 */
describe('Requisition Service - List Operations', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    };
  });

  describe('listRequisitions()', () => {
    test('should return empty array when no requisitions exist', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await listRequisitions(mockDb);

      expect(result).toEqual([]);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    test('should return array of requisitions with correct structure', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'req-001',
            pr_number: 'PR-2026-0001',
            requester_name: 'John Doe',
            department_name: 'Procurement',
            title: 'Office Supplies',
            status: 'DRAFT',
            created_at: '2026-09-01T10:00:00Z',
            updated_at: '2026-09-01T10:00:00Z',
          },
          {
            id: 'req-002',
            pr_number: 'PR-2026-0002',
            requester_name: 'Jane Smith',
            department_name: 'Operations',
            title: 'Safety Equipment',
            status: 'APPROVED',
            created_at: '2026-09-02T11:00:00Z',
            updated_at: '2026-09-02T11:00:00Z',
          },
        ],
        rowCount: 2,
      });

      const result = await listRequisitions(mockDb);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'req-001',
        prNumber: 'PR-2026-0001',
        requesterName: 'John Doe',
        departmentName: 'Procurement',
        title: 'Office Supplies',
        status: 'DRAFT',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      });
      expect(result[1].status).toBe('APPROVED');
    });

    test('should transform snake_case database columns to camelCase', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'req-123',
            pr_number: 'PR-2026-0003',
            requester_name: 'Alice Johnson',
            department_name: 'Engineering',
            title: 'Testing Equipment',
            status: 'SUBMITTED',
            created_at: '2026-09-03T14:30:00Z',
            updated_at: '2026-09-03T14:30:00Z',
          },
        ],
        rowCount: 1,
      });

      const result = await listRequisitions(mockDb);

      expect(result[0]).not.toHaveProperty('pr_number');
      expect(result[0]).not.toHaveProperty('requester_name');
      expect(result[0]).toHaveProperty('prNumber');
      expect(result[0]).toHaveProperty('requesterName');
    });

    test('should handle database query errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockDb.query.mockRejectedValue(dbError);

      await expect(listRequisitions(mockDb)).rejects.toThrow('Database connection failed');
    });

    test('should order results by creation date (newest first)', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'req-001',
            pr_number: 'PR-2026-0003',
            requester_name: 'User A',
            department_name: 'Dept A',
            title: 'Item A',
            status: 'DRAFT',
            created_at: '2026-09-03T10:00:00Z',
            updated_at: '2026-09-03T10:00:00Z',
          },
          {
            id: 'req-002',
            pr_number: 'PR-2026-0001',
            requester_name: 'User B',
            department_name: 'Dept B',
            title: 'Item B',
            status: 'DRAFT',
            created_at: '2026-09-01T10:00:00Z',
            updated_at: '2026-09-01T10:00:00Z',
          },
        ],
        rowCount: 2,
      });

      const result = await listRequisitions(mockDb);

      // First result should be the newest (most recent created_at)
      expect(result[0].createdAt).toBe('2026-09-03T10:00:00Z');
      expect(result[1].createdAt).toBe('2026-09-01T10:00:00Z');
    });
  });

  describe('getRequisitionById()', () => {
    test('should return null when requisition not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await getRequisitionById(mockDb, 'nonexistent-id');

      expect(result).toBeNull();
    });

    test('should return requisition with lines when found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'req-001',
            pr_number: 'PR-2026-0001',
            requester_name: 'John Doe',
            department_name: 'Procurement',
            title: 'Office Supplies',
            status: 'APPROVED',
            created_at: '2026-09-01T10:00:00Z',
            updated_at: '2026-09-01T10:00:00Z',
          },
        ],
        rowCount: 1,
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'line-001',
            line_no: 1,
            item_code: 'ITEM-001',
            item_name: 'Notebook',
            qty_requested: 50,
            qty_allocated: 30,
            qty_received: 0,
            uom: 'PCS',
            est_unit_price: 5000,
            site_code: 'WH-JKT',
            required_date: '2026-09-15',
            budget_center: 'BC-001',
            created_at: '2026-09-01T10:00:00Z',
            updated_at: '2026-09-01T10:00:00Z',
          },
        ],
        rowCount: 1,
      });

      const result = await getRequisitionById(mockDb, 'req-001');

      expect(result).not.toBeNull();
      expect(result.prNumber).toBe('PR-2026-0001');
      expect(result.status).toBe('APPROVED');
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].itemCode).toBe('ITEM-001');
      expect(result.lines[0].qtyRequested).toBe(50);
    });

    test('should return requisition header even with no lines', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'req-002',
            pr_number: 'PR-2026-0002',
            requester_name: 'Jane Smith',
            department_name: 'Operations',
            title: 'Equipment',
            status: 'DRAFT',
            created_at: '2026-09-02T11:00:00Z',
            updated_at: '2026-09-02T11:00:00Z',
          },
        ],
        rowCount: 1,
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await getRequisitionById(mockDb, 'req-002');

      expect(result).not.toBeNull();
      expect(result.prNumber).toBe('PR-2026-0002');
      expect(result.lines).toEqual([]);
    });

    test('should calculate correct remaining quantities for lines', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'req-003',
            pr_number: 'PR-2026-0003',
            requester_name: 'Bob Wilson',
            department_name: 'Finance',
            title: 'Audit Tools',
            status: 'APPROVED',
            created_at: '2026-09-03T14:30:00Z',
            updated_at: '2026-09-03T14:30:00Z',
          },
        ],
        rowCount: 1,
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'line-002',
            line_no: 1,
            item_code: 'ITEM-002',
            item_name: 'Audit Software',
            qty_requested: 100,
            qty_allocated: 40,
            qty_received: 20,
            uom: 'LICENSE',
            est_unit_price: 10000,
            site_code: 'WH-JKT',
            required_date: '2026-09-20',
            budget_center: 'BC-002',
            created_at: '2026-09-03T14:30:00Z',
            updated_at: '2026-09-03T14:30:00Z',
          },
        ],
        rowCount: 1,
      });

      const result = await getRequisitionById(mockDb, 'req-003');

      const line = result.lines[0];
      expect(line.qtyOpenForPo).toBe(60); // 100 - 40 = open for PO
    });
  });
});
