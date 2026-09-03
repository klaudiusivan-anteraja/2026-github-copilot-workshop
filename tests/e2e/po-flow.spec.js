import { test, expect } from '@playwright/test';

test.describe('PO Module Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2')).toContainText('Procurement Dashboard');
  });

  test('PO List page loads with Purchase Orders nav link', async ({ page }) => {
    await page.click('a:has-text("Purchase Orders")');
    await page.waitForURL('/purchase-orders');
    await expect(page.locator('h2')).toContainText('Purchase Orders');
  });

  test('Create PO from approved PR lines', async ({ page }) => {
    await page.getByRole('link', { name: /Purchase Orders/i }).click();
    await page.waitForURL('/purchase-orders');

    const newPOBtn = page.getByRole('link', { name: /New PO/i });
    await expect(newPOBtn).toBeVisible();
    await newPOBtn.click();

    await page.waitForURL('/purchase-orders/new');
    await expect(page.locator('h2')).toContainText('Create Purchase Order');

    const firstLineCheckbox = page.locator('tbody input[type="checkbox"]').first();
    await expect(firstLineCheckbox).toBeVisible();
    await firstLineCheckbox.check();

    await page.locator('#vendor-name').fill('PT Supplier Jaya');
    await page.getByLabel('Qty Ordered *').first().fill('1');
    await page.getByRole('button', { name: 'Create Purchase Order' }).click();

    await page.waitForURL(/\/purchase-orders\/[a-zA-Z0-9-]+$/);
    await expect(page.locator('h2')).toContainText('Detail Purchase Order');
  });

  test('Submit PO and verify detail page', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    const firstLineCheckbox = page.locator('tbody input[type="checkbox"]').first();
    await firstLineCheckbox.check();
    await page.locator('#vendor-name').fill('PT Supplier Jaya');
    await page.getByLabel('Qty Ordered *').first().fill('1');
    await page.getByRole('button', { name: 'Create Purchase Order' }).click();

    await page.waitForURL(/\/purchase-orders\/[a-zA-Z0-9-]+$/);
    await expect(page.locator('h2')).toContainText('Detail Purchase Order');

    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=DRAFT')).toBeVisible();
  });

  test('Submit PO button transitions status', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    const firstLineCheckbox = page.locator('tbody input[type="checkbox"]').first();
    await firstLineCheckbox.check();
    await page.locator('#vendor-name').fill('PT Supplier Jaya');
    await page.getByLabel('Qty Ordered *').first().fill('1');
    await page.getByRole('button', { name: 'Create Purchase Order' }).click();
    await page.waitForURL(/\/purchase-orders\/[a-zA-Z0-9-]+$/);

    await page.goto('/purchase-orders');
    const firstPOLink = page.locator('tbody td a').first();
    await expect(firstPOLink).toBeVisible();
    await firstPOLink.click();

    const submitPOBtn = page.getByRole('button', { name: 'Submit PO' });
    await expect(submitPOBtn).toBeVisible();
    await submitPOBtn.click();

    await expect(page.locator('.status-badge.submitted')).toContainText('SUBMITTED');
  });
});
