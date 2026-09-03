import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import {
  listPurchaseOrders,
  getPurchaseOrderById,
  getOpenPoLines,
} from '../../src/services/purchase-order-service.js';

/**
 * Test suite for Purchase Order Service list operations.
 * Focuses on data retrieval and transformation for frontend consumption.
 */
describe('Purchase Order Service - List Operations', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    };
  });

  describe('listPurchaseOrders()', () => {
    test('should return empty array when no purchase orders exist', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await listPurchaseOrders(mockDb);

      expect(result).toEqual([]);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    test('should return array of purchase orders with correct structure', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'po-001',
            po_number: 'PO-2026-0001',
            vendor_name: 'PT Supplier Jaya',
            status: 'DRAFT',
            created_at: '2026-09-01T10:00:00Z',
            updated_at: '2026-09-01T10:00:00Z',
          },
          {
            id: 'po-002',
            po_number: 'PO-2026-0002',
            vendor_name: 'PT Indo Supplier',
            status: 'SUBMITTED',
            created_at: '2026-09-02T11:00:00Z',
            updated_at: '2026-09-02T11:00:00Z',
          },
        ],
        rowCount: 2,
      });

      const result = await listPurchaseOrders(mockDb);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'po-001',
        poNumber: 'PO-2026-0001',
        vendorName: 'PT Supplier Jaya',
        status: 'DRAFT',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      });
      expect(result[1].status).toBe('SUBMITTED');
    });

    test('should transform snake_case database columns to camelCase', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'po-123',
            po_number: 'PO-2026-0003',
            vendor_name: 'PT Global Trade',
            status: 'DRAFT',
            created_at: '2026-09-03T14:30:00Z',
            updated_at: '2026-09-03T14:30:00Z',
          },
        ],
        rowCount: 1,
      });

      const result = await listPurchaseOrders(mockDb);

      expect(result[0]).not.toHaveProperty('po_number');
      expect(result[0]).not.toHaveProperty('vendor_name');
      expect(result[0]).toHaveProperty('poNumber');
      expect(result[0]).toHaveProperty('vendorName');
    });

    test('should order results by creation date (newest first)', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'po-001',
            po_number: 'PO-2026-0003',
            vendor_name: 'Vendor A',
            status: 'DRAFT',
            created_at: '2026-09-03T10:00:00Z',
            updated_at: '2026-09-03T10:00:00Z',
          },
          {
            id: 'po-002',
            po_number: 'PO-2026-0001',
            vendor_name: 'Vendor B',
            status: 'DRAFT',
            created_at: '2026-09-01T10:00:00Z',
            updated_at: '2026-09-01T10:00:00Z',
          },
        ],
        rowCount: 2,
      });

      const result = await listPurchaseOrders(mockDb);

      expect(result[0].createdAt).toBe('2026-09-03T10:00:00Z');
      expect(result[1].createdAt).toBe('2026-09-01T10:00:00Z');
    });

    test('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(listPurchaseOrders(mockDb)).rejects.toThrow('Database connection failed');
    });
  });

  describe('getPurchaseOrderById()', () => {
    test('should return null when purchase order not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await getPurchaseOrderById(mockDb, 'nonexistent-id');

      expect(result).toBeNull();
    });

    test('should return purchase order with complete structure', async () => {
      // Mock the header query
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-001',
            po_number: 'PO-2026-0001',
            vendor_name: 'PT Supplier Jaya',
            status: 'DRAFT',
            created_at: '2026-09-01T10:00:00Z',
            updated_at: '2026-09-01T10:00:00Z',
          },
        ],
        rowCount: 1,
      });

      // Mock the lines query
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-line-001',
            line_no: 1,
            item_code: 'ITEM-001',
            item_name: 'Safety Helmet',
            qty_ordered: 10,
            qty_received: 0,
            uom: 'PCS',
            unit_price: 150000,
            site_code: 'WH-JKT',
            required_date: '2026-09-15',
          },
        ],
        rowCount: 1,
      });

      // Mock the allocations query
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            pr_line_id: 'pr-line-001',
            allocated_qty: 10,
            pr_number: 'PR-2026-0001',
          },
        ],
        rowCount: 1,
      });

      const result = await getPurchaseOrderById(mockDb, 'po-001');

      expect(result).not.toBeNull();
      expect(result.poNumber).toBe('PO-2026-0001');
      expect(result.vendorName).toBe('PT Supplier Jaya');
      expect(result.status).toBe('DRAFT');
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].itemCode).toBe('ITEM-001');
      expect(result.lines[0].allocations).toHaveLength(1);
    });

    test('should include allocation source information in lines', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-002',
            po_number: 'PO-2026-0002',
            vendor_name: 'PT Indo Supplier',
            status: 'SUBMITTED',
            created_at: '2026-09-02T11:00:00Z',
            updated_at: '2026-09-02T11:00:00Z',
          },
        ],
        rowCount: 1,
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-line-002',
            line_no: 1,
            item_code: 'ITEM-002',
            item_name: 'Hi-Vis Jacket',
            qty_ordered: 20,
            qty_received: 0,
            uom: 'PCS',
            unit_price: 250000,
            site_code: 'WH-JKT',
            required_date: '2026-09-20',
          },
        ],
        rowCount: 1,
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            pr_line_id: 'pr-line-002',
            allocated_qty: 15,
            pr_number: 'PR-2026-0001',
          },
          {
            pr_line_id: 'pr-line-003',
            allocated_qty: 5,
            pr_number: 'PR-2026-0002',
          },
        ],
        rowCount: 2,
      });

      const result = await getPurchaseOrderById(mockDb, 'po-002');

      const line = result.lines[0];
      expect(line.allocations).toHaveLength(2);
      expect(line.allocations[0].prNumber).toBe('PR-2026-0001');
      expect(line.allocations[0].allocatedQty).toBe(15);
      expect(line.allocations[1].prNumber).toBe('PR-2026-0002');
      expect(line.allocations[1].allocatedQty).toBe(5);
    });

    test('should calculate qtyOpenForGr correctly', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-003',
            po_number: 'PO-2026-0003',
            vendor_name: 'PT Global Trade',
            status: 'SUBMITTED',
            created_at: '2026-09-03T14:30:00Z',
            updated_at: '2026-09-03T14:30:00Z',
          },
        ],
        rowCount: 1,
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-line-003',
            line_no: 1,
            item_code: 'ITEM-003',
            item_name: 'Test Item',
            qty_ordered: 100,
            qty_received: 40,
            uom: 'PCS',
            unit_price: 10000,
            site_code: 'WH-JKT',
            required_date: '2026-09-25',
          },
        ],
        rowCount: 1,
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await getPurchaseOrderById(mockDb, 'po-003');

      const line = result.lines[0];
      expect(line.qtyOpenForGr).toBe(60); // 100 - 40
    });
  });

  describe('getOpenPoLines()', () => {
    test('should return null when purchase order not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await getOpenPoLines(mockDb, 'nonexistent-id');

      expect(result).toBeNull();
    });

    test('should return purchase order info with open lines', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-001',
            po_number: 'PO-2026-0001',
            status: 'SUBMITTED',
          },
        ],
        rowCount: 1,
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-line-001',
            line_no: 1,
            item_code: 'ITEM-001',
            item_name: 'Safety Helmet',
            qty_ordered: 10,
            qty_received: 0,
            uom: 'PCS',
            unit_price: 150000,
            site_code: 'WH-JKT',
            required_date: '2026-09-15',
          },
          {
            id: 'po-line-002',
            line_no: 2,
            item_code: 'ITEM-002',
            item_name: 'Hi-Vis Jacket',
            qty_ordered: 20,
            qty_received: 20,
            uom: 'PCS',
            unit_price: 250000,
            site_code: 'WH-JKT',
            required_date: '2026-09-20',
          },
        ],
        rowCount: 2,
      });

      const result = await getOpenPoLines(mockDb, 'po-001');

      expect(result).not.toBeNull();
      expect(result.purchaseOrder.poNumber).toBe('PO-2026-0001');
      expect(result.purchaseOrder.status).toBe('SUBMITTED');
      expect(result.openLines).toHaveLength(1); // Only line 1 is open (qty_received < qty_ordered)
      expect(result.openLines[0].itemCode).toBe('ITEM-001');
    });

    test('should filter out fully received lines', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-002',
            po_number: 'PO-2026-0002',
            status: 'SUBMITTED',
          },
        ],
        rowCount: 1,
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-line-003',
            line_no: 1,
            item_code: 'ITEM-003',
            item_name: 'Test Item A',
            qty_ordered: 50,
            qty_received: 50,
            uom: 'PCS',
            unit_price: 10000,
            site_code: 'WH-JKT',
            required_date: '2026-09-25',
          },
          {
            id: 'po-line-004',
            line_no: 2,
            item_code: 'ITEM-004',
            item_name: 'Test Item B',
            qty_ordered: 100,
            qty_received: 0,
            uom: 'PCS',
            unit_price: 12000,
            site_code: 'WH-JKT',
            required_date: '2026-09-25',
          },
        ],
        rowCount: 2,
      });

      const result = await getOpenPoLines(mockDb, 'po-002');

      expect(result.openLines).toHaveLength(1);
      expect(result.openLines[0].qtyOpenForGr).toBe(100);
    });

    test('should return empty openLines when all items fully received', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-003',
            po_number: 'PO-2026-0003',
            status: 'SUBMITTED',
          },
        ],
        rowCount: 1,
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'po-line-005',
            line_no: 1,
            item_code: 'ITEM-005',
            item_name: 'All Received',
            qty_ordered: 50,
            qty_received: 50,
            uom: 'PCS',
            unit_price: 10000,
            site_code: 'WH-JKT',
            required_date: '2026-09-25',
          },
        ],
        rowCount: 1,
      });

      const result = await getOpenPoLines(mockDb, 'po-003');

      expect(result.openLines).toEqual([]);
    });
  });
});
