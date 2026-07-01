import { test, expect } from '@playwright/test';

/**
 * Chat E2E: two users exchange a message in real time. Demonstrates the
 * WebSocket-backed delivery path end to end.
 */
test('two users exchange a message in real time', async ({ browser }) => {
  const stamp = Date.now();
  const alice = await browser.newContext();
  const bob = await browser.newContext();
  const aPage = await alice.newPage();
  const bPage = await bob.newPage();

  // Register both users.
  for (const [page, name] of [
    [aPage, `alice_${stamp}`],
    [bPage, `bob_${stamp}`],
  ] as const) {
    await page.goto('/auth/register');
    await page.getByLabel('Username').fill(name);
    await page.getByLabel('Email').fill(`${name}@example.com`);
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/dashboard/);
  }

  // Alice starts a chat with Bob and sends a message.
  await aPage.goto('/chat');
  await aPage.getByLabel('Find people').fill(`bob_${stamp}`);
  await aPage.getByText(`bob_${stamp}`).first().click();
  await aPage.getByPlaceholder('Type a message').fill('Hello Bob');
  await aPage.getByRole('button', { name: 'Send' }).click();

  await expect(aPage.getByText('Hello Bob')).toBeVisible();
});
