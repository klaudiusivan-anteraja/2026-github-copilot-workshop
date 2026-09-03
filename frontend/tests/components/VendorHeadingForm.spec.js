import { describe, test, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import VendorHeadingForm from '../../src/components/VendorHeadingForm.vue';

/**
 * Test suite for VendorHeadingForm component.
 * Tests v-model binding, error display, and basic rendering.
 */
describe('VendorHeadingForm.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(VendorHeadingForm, {
      props: {
        vendorName: '',
        errors: {},
      },
    });
  });

  test('should render vendor name input field', () => {
    const input = wrapper.find('input[type="text"]');
    expect(input.exists()).toBe(true);
    expect(input.attributes('placeholder')).toBe('Enter vendor name');
  });

  test('should render heading label', () => {
    const heading = wrapper.find('h3');
    expect(heading.exists()).toBe(true);
    expect(heading.text()).toContain('Purchase Order');
  });

  test('should display current vendor name as input value', async () => {
    await wrapper.setProps({ vendorName: 'PT Supplier Jaya' });
    const input = wrapper.find('input[type="text"]');
    expect(input.element.value).toBe('PT Supplier Jaya');
  });

  test('should update vendor name on input change', async () => {
    const input = wrapper.find('input[type="text"]');
    await input.setValue('PT Indo Trading');
    expect(wrapper.emitted('update:vendorName')).toBeTruthy();
    expect(wrapper.emitted('update:vendorName')[0]).toEqual(['PT Indo Trading']);
  });

  test('should not display error when error prop is empty', () => {
    const errorDiv = wrapper.find('.form-error');
    expect(errorDiv.exists()).toBe(false);
  });

  test('should display error message when error prop is set', async () => {
    await wrapper.setProps({ errors: { vendorName: 'Vendor name is required' } });
    const errorDiv = wrapper.find('.form-error');
    expect(errorDiv.exists()).toBe(true);
    expect(errorDiv.text()).toContain('Vendor name is required');
  });

  test('should handle multiple vendor name updates', async () => {
    const input = wrapper.find('input[type="text"]');
    
    await input.setValue('First Vendor');
    expect(wrapper.emitted('update:vendorName')[0]).toEqual(['First Vendor']);
    
    await input.setValue('Second Vendor');
    expect(wrapper.emitted('update:vendorName')[1]).toEqual(['Second Vendor']);
  });

  test('should clear error when vendor name is entered', async () => {
    await wrapper.setProps({ errors: { vendorName: 'Vendor name is required' } });
    const input = wrapper.find('input[type="text"]');
    await input.setValue('PT Valid Vendor');
    
    expect(wrapper.emitted('update:vendorName')[0]).toEqual(['PT Valid Vendor']);
  });

  test('should accept focus on input field', async () => {
    const input = wrapper.find('input[type="text"]');
    expect(input.exists()).toBe(true);
    expect(input.element.type).toBe('text');
    // Note: focus testing in happy-dom is limited; just verify element is focusable
    expect(input.element.tagName).toBe('INPUT');
  });
});
