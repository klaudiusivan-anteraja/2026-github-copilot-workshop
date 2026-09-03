import { describe, test, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import PRLinePicker from '../../src/components/PRLinePicker.vue';

/**
 * Test suite for PRLinePicker component.
 * Tests table rendering, checkbox selection, and load states.
 */
describe('PRLinePicker.vue', () => {
  let wrapper;

  const mockPrLines = [
    {
      id: 'pr-line-001',
      prNumber: 'PR-2026-0001',
      lineNo: 1,
      itemCode: 'ITEM-001',
      itemName: 'Safety Helmet',
      qtyRequested: 10,
      qtyAllocated: 2,
      qtyRemaining: 8,
    },
    {
      id: 'pr-line-002',
      prNumber: 'PR-2026-0001',
      lineNo: 2,
      itemCode: 'ITEM-002',
      itemName: 'Hi-Vis Jacket',
      qtyRequested: 20,
      qtyAllocated: 0,
      qtyRemaining: 20,
    },
  ];

  beforeEach(() => {
    wrapper = mount(PRLinePicker, {
      props: {
        prLines: mockPrLines,
        selectedLineIds: [],
        loading: false,
        error: '',
      },
    });
  });

  test('should render picker section', () => {
    expect(wrapper.find('.pr-picker-section').exists()).toBe(true);
  });

  test('should render section title', () => {
    const title = wrapper.find('.section-title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toContain('Select PR Lines');
  });

  test('should render table with headers when lines available', () => {
    const table = wrapper.find('table.picker-table');
    expect(table.exists()).toBe(true);
    
    const headers = wrapper.findAll('thead th');
    expect(headers.length).toBeGreaterThan(0);
  });

  test('should render table row for each PR line', () => {
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(2);
  });

  test('should display PR number in rows', () => {
    const text = wrapper.text();
    expect(text).toContain('PR-2026-0001');
  });

  test('should display item code and name', () => {
    const text = wrapper.text();
    expect(text).toContain('ITEM-001');
    expect(text).toContain('Safety Helmet');
    expect(text).toContain('ITEM-002');
    expect(text).toContain('Hi-Vis Jacket');
  });

  test('should display quantity columns', () => {
    const text = wrapper.text();
    expect(text).toContain('10'); // qtyRequested line 1
    expect(text).toContain('2');  // qtyAllocated line 1
    expect(text).toContain('8');  // qtyRemaining line 1
    expect(text).toContain('20'); // qtyRequested line 2
  });

  test('should render checkboxes for line selection', () => {
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    // Header checkbox + 2 line checkboxes
    expect(checkboxes.length).toBeGreaterThanOrEqual(3);
  });

  test('should emit selection when checkbox is clicked', async () => {
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    const firstLineCheckbox = checkboxes[1]; // Skip header
    
    await firstLineCheckbox.setValue(true);
    
    expect(wrapper.emitted('update:selectedLineIds')).toBeTruthy();
    const emitted = wrapper.emitted('update:selectedLineIds')[0][0];
    expect(emitted).toContain('pr-line-001');
  });

  test('should reflect parent-driven selectedLineIds updates', async () => {
    await wrapper.setProps({ selectedLineIds: ['pr-line-001'] });

    const updatedCheckboxes = wrapper.findAll('input[type="checkbox"]');
    expect(updatedCheckboxes[1].element.checked).toBe(true);
  });

  test('should show loading state', async () => {
    await wrapper.setProps({ loading: true });
    
    const loadingDiv = wrapper.find('.loading-state');
    expect(loadingDiv.exists()).toBe(true);
    expect(loadingDiv.text()).toContain('Loading');
  });

  test('should show error state', async () => {
    await wrapper.setProps({ error: 'Failed to load PR lines' });
    
    const errorDiv = wrapper.find('.error-state');
    expect(errorDiv.exists()).toBe(true);
    expect(errorDiv.text()).toContain('Failed to load PR lines');
  });

  test('should show empty state when no lines', async () => {
    await wrapper.setProps({ prLines: [] });
    
    const emptyDiv = wrapper.find('.empty-state');
    expect(emptyDiv.exists()).toBe(true);
    expect(emptyDiv.text()).toContain('No approved PR lines');
  });

  test('should select all lines when header checkbox is clicked', async () => {
    const headerCheckbox = wrapper.findAll('input[type="checkbox"]')[0];
    
    await headerCheckbox.setValue(true);
    
    expect(wrapper.emitted('update:selectedLineIds')).toBeTruthy();
    const emitted = wrapper.emitted('update:selectedLineIds')[0][0];
    expect(emitted).toContain('pr-line-001');
    expect(emitted).toContain('pr-line-002');
  });

  test('should deselect line when checkbox is unchecked', async () => {
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    
    await checkboxes[1].setValue(true); // Select line 1
    await wrapper.setProps({ selectedLineIds: ['pr-line-001'] });

    expect(wrapper.emitted('update:selectedLineIds')).toBeTruthy();
    const firstEmit = wrapper.emitted('update:selectedLineIds')[0][0];
    expect(firstEmit).toContain('pr-line-001');

    const updatedCheckboxes = wrapper.findAll('input[type="checkbox"]');
    await updatedCheckboxes[2].setValue(true); // Select line 2
    await wrapper.setProps({ selectedLineIds: ['pr-line-001', 'pr-line-002'] });
    
    const secondEmit = wrapper.emitted('update:selectedLineIds')[1][0];
    expect(secondEmit).toContain('pr-line-001');
    expect(secondEmit).toContain('pr-line-002');
    
    const finalCheckboxes = wrapper.findAll('input[type="checkbox"]');
    await finalCheckboxes[1].setValue(false);
    
    const thirdEmit = wrapper.emitted('update:selectedLineIds')[2][0];
    expect(thirdEmit).not.toContain('pr-line-001');
    expect(thirdEmit).toContain('pr-line-002');
  });

  test('should update table when prLines prop changes', async () => {
    const newLines = [
      {
        id: 'pr-line-003',
        prNumber: 'PR-2026-0002',
        lineNo: 1,
        itemCode: 'ITEM-003',
        itemName: 'Safety Gloves',
        qtyRequested: 50,
        qtyAllocated: 10,
        qtyRemaining: 40,
      },
    ];
    
    await wrapper.setProps({ prLines: newLines });
    
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(wrapper.text()).toContain('Safety Gloves');
  });

  test('should have retry button in error state', async () => {
    await wrapper.setProps({ error: 'Load failed', prLines: [] });
    
    const retryBtn = wrapper.find('.btn-outline');
    expect(retryBtn.exists()).toBe(true);
    expect(retryBtn.text()).toContain('Retry');
    expect(retryBtn.attributes('type')).toBe('button');
  });
});
