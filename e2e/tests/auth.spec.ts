import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'E2E User';
const MOCK_USER = { id: 'e2e-user-1', name: TEST_NAME, email: TEST_EMAIL };

function ok(data: unknown) {
  return {
    data,
    error: null,
    meta: { timestamp: new Date().toISOString(), requestId: 'e2e-mock' },
  };
}

async function mockRegister(page) {
  await page.route('**/auth/register', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ok({ token: 'mock-token', user: MOCK_USER })),
    });
  });
}

async function mockLogin(page, shouldSucceed = true) {
  await page.route('**/auth/login', async (route) => {
    if (shouldSucceed) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ token: 'mock-token', user: MOCK_USER })),
      });
      return;
    }

    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        data: null,
        error: { message: 'Invalid email or password' },
        meta: { timestamp: new Date().toISOString(), requestId: 'e2e-mock' },
      }),
    });
  });
}

async function registerThroughUi(page, email: string, password: string, name: string) {
  await page.goto('/register');
  await page.fill('[id="full-name"]', name);
  await page.fill('[id="email-address"]', email);
  await page.fill('[id="password"]', password);
  await page.fill('[id="confirm-password"]', password);
  await page.click('button[type="submit"]');
}

test.describe('Authentication', () => {
  test('user can register', async ({ page }) => {
    await mockRegister(page);
    await registerThroughUi(page, TEST_EMAIL, TEST_PASSWORD, TEST_NAME);

    // App behavior: successful registration redirects to login.
    await expect(page).toHaveURL('/login');
  });

  test('user can log in with existing account', async ({ page }) => {
    await mockRegister(page);
    await mockLogin(page, true);
    // Ensure this test is self-contained and does not depend on test order.
    const email = `e2e-login-${Date.now()}@example.com`;
    await registerThroughUi(page, email, TEST_PASSWORD, TEST_NAME);
    await expect(page).toHaveURL('/login');

    await page.goto('/login');
    await page.fill('[id="email-address"]', email);
    await page.fill('[id="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('login shows error for wrong password', async ({ page }) => {
    await mockLogin(page, false);
    await page.goto('/login');
    await page.fill('[id="email-address"]', TEST_EMAIL);
    await page.fill('[id="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});
