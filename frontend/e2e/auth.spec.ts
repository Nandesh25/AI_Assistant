import { test, expect } from '@playwright/test';

/**
 * Authentication E2E flow. Registers a unique user, then verifies the
 * dashboard loads and that protected routes redirect when logged out.
 */
test.describe('Authentication', () => {
  test('user can register and reach the dashboard', async ({ page }) => {
    const unique = Date.now();
    await page.goto('/auth/register');

    await page.getByLabel('Username').fill(`e2e_${unique}`);
    await page.getByLabel('Email').fill(`e2e_${unique}@example.com`);
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Recent chats')).toBeVisible();
  });

  test('protected route redirects to login when unauthenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/auth\/login/);
  });
});
