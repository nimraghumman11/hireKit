import { test, expect } from '@playwright/test';

const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'TestPass123!';
const MOCK_USER = { id: 'e2e-user-dashboard', name: 'E2E Dashboard User', email: 'dashboard@example.com' };

function ok(data: unknown) {
  return {
    data,
    error: null,
    meta: { timestamp: new Date().toISOString(), requestId: 'e2e-mock' },
  };
}

async function mockAuthAndKits(page) {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ok({ token: 'mock-token', user: MOCK_USER })),
    });
  });

  await page.route('**/interview-kit**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        ok({
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        }),
      ),
    });
  });
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthAndKits(page);
    await page.goto('/login');
    await page.fill('[id="email-address"]', MOCK_USER.email);
    await page.fill('[id="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('dashboard loads and shows page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('new kit button navigates to create page', async ({ page }) => {
    await page.click('text=New Kit');
    await expect(page).toHaveURL('/kits/new');
  });

  test('search input filters kits by role title', async ({ page }) => {
    const search = page.locator('[aria-label="Search kits"]');
    await search.fill('Engineer');
    await expect(search).toHaveValue('Engineer');
  });
});
