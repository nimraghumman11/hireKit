import { test, expect } from '@playwright/test';

const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'TestPass123!';
const MOCK_USER = { id: 'e2e-user-create', name: 'E2E Create User', email: 'create@example.com' };

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

test.describe('Create Interview Kit', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthAndKits(page);
    await page.goto('/login');
    await page.fill('[id="email-address"]', MOCK_USER.email);
    await page.fill('[id="password"]', E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('hiring manager can open new-kit page and fill description', async ({ page }) => {
    await page.click('text=New Kit');
    await expect(page).toHaveURL('/kits/new');

    const description = page.locator('#description');
    await expect(description).toBeVisible();
    await description.fill(
      'We need a senior frontend engineer to own React architecture, collaborate with product and design, and mentor junior developers.',
    );
    await expect(description).toHaveValue(/senior frontend engineer/i);
  });

  test('form shows validation for short description', async ({ page }) => {
    await page.goto('/kits/new');
    await page.fill('#description', 'short');
    await page.click('button:has-text("Generate interview kit")');
    await expect(page.getByText(/at least 40 characters/i)).toBeVisible();
  });
});
