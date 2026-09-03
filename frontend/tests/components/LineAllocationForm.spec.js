import { describe, test, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LineAllocationForm from '../../src/components/LineAllocationForm.vue';

/**
 * Test suite for LineAllocationForm component.
 * Tests line allocation form rendering and error display.
 * This component renders forms for multiple selected lines.
 */
describe('LineAllocationForm.vue', () => {
  let wrapper;

  const mockSelectedLines = [
    {
      id: 'line-001',
      itemCode: 'ITEM-001',
      itemName: 'Safety Helmet',
      qtyRequested: 10,
      qtyAllocated: 2,
      qtyRemaining: 8,
      qtyOrdered: 0,
      unitPrice: 150000,
      requiredDate: '',
    },
  ];

  beforeEach(() => {
    wrapper = mount(LineAllocationForm, {
      props: {
        selectedLines: mockSelectedLines,
        errors: [],
      },
    });
  });

  test('should render allocation section when lines are selected', () => {
    expect(wrapper.find('.allocation-section').exists()).toBe(true);
  });

  test('should render section title', () => {
    const title = wrapper.find('.section-title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toContain('Allocate');
  });

  test('should not render section when no lines are selected', async () => {
    await wrapper.setProps({ selectedLines: [] });
    expect(wrapper.find('.allocation-section').exists()).toBe(false);
  });

  test('should render allocation card for each selected line', () => {
    const cards = wrapper.findAll('.allocation-card');
    expect(cards).toHaveLength(1);
  });

  test('should display item code and name in card header', () => {
    const header = wrapper.find('.card-header');
    expect(header.text()).toContain('ITEM-001');
    expect(header.text()).toContain('Safety Helmet');
  });

  test('should display qty remaining in read-only field', () => {
    const readonlyValue = wrapper.find('.readonly-value');
    expect(readonlyValue.text()).toBe('8');
  });

  test('should display qty hint (requested - allocated)', () => {
    const hint = wrapper.find('.form-hint');
    expect(hint.text()).toContain('10');
    expect(hint.text()).toContain('2');
  });

  test('should render qty ordered input', () => {
    const inputs = wrapper.findAll('input[type="number"]');
    expect(inputs.length).toBeGreaterThan(0);
  });

  test('should render unit price input', () => {
    const inputs = wrapper.findAll('input[type="number"]');
    // Should have at least qty and price inputs
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  test('should render optional required date input', () => {
    const dateInput = wrapper.find('input[type="date"]');
    expect(dateInput.exists()).toBe(true);
  });

  test('should have remove button with X symbol', () => {
    const removeBtn = wrapper.find('.btn-remove');
    expect(removeBtn.exists()).toBe(true);
    expect(removeBtn.text()).toBe('✕');
  });

  test('should emit remove-line event when remove button clicked', async () => {
    const removeBtn = wrapper.find('.btn-remove');
    await removeBtn.trigger('click');
    
    expect(wrapper.emitted('remove-line')).toBeTruthy();
    expect(wrapper.emitted('remove-line')[0]).toEqual([0]); // First line index
  });

  test('should render remove button as a non-submit button', () => {
    const removeBtn = wrapper.find('.btn-remove');
    expect(removeBtn.attributes('type')).toBe('button');
  });

  test('should display error for qty when validation fails', async () => {
    const errorArray = [{ qtyOrdered: 'Quantity exceeds available' }];
    await wrapper.setProps({ errors: errorArray });
    
    const errorSpan = wrapper.find('.form-error');
    expect(errorSpan.exists()).toBe(true);
    expect(errorSpan.text()).toContain('Quantity exceeds available');
  });

  test('should display error for unit price when validation fails', async () => {
    const errorArray = [{ unitPrice: 'Price must be >= 0' }];
    await wrapper.setProps({ errors: errorArray });
    
    const errorSpans = wrapper.findAll('.form-error');
    const priceError = errorSpans.find(el => el.text().includes('Price'));
    expect(priceError).toBeTruthy();
  });

  test('should handle multiple lines with different errors', async () => {
    const multipleLines = [
      { ...mockSelectedLines[0], id: 'line-001' },
      {
        id: 'line-002',
        itemCode: 'ITEM-002',
        itemName: 'Helmet Liner',
        qtyRequested: 20,
        qtyAllocated: 5,
        qtyRemaining: 15,
        qtyOrdered: 25, // Over-allocated
        unitPrice: 10000,
        requiredDate: '',
      },
    ];
    
    const errorArray = [
      {},
      { qtyOrdered: 'Exceeds available: 15' },
    ];
    
    await wrapper.setProps({ selectedLines: multipleLines, errors: errorArray });
    
    const cards = wrapper.findAll('.allocation-card');
    expect(cards).toHaveLength(2);
  });
});
