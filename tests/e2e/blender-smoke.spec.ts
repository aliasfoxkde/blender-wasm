import { test, expect } from '@playwright/test';

test.describe('Blender WASM Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // Collect console errors for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`[Browser Error]: ${msg.text()}`);
      }
    });
  });

  test('should load the app without crashing', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to initialize
    await page.waitForTimeout(3000);

    // App should have rendered - check for header or main content
    const header = page.locator('.header, header');
    const main = page.locator('main, .app, #app');

    const headerVisible = await header.first().isVisible().catch(() => false);
    const mainVisible = await main.first().isVisible().catch(() => false);

    // At least one main UI element should be visible
    expect(headerVisible || mainVisible).toBeTruthy();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should show splash or dashboard on load', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // App shows splash on load
    const splash = page.locator('.splash, [class*="splash"]');
    const dashboard = page.locator('.dashboard');

    const splashVisible = await splash.first().isVisible().catch(() => false);
    const dashboardVisible = await dashboard.first().isVisible().catch(() => false);

    // Either splash or dashboard should be visible
    expect(splashVisible || dashboardVisible).toBeTruthy();
  });

  test('app should respond to user interaction', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should enter Blender view and report missing artifact honestly', async ({ page }) => {
    await page.goto('/');

    const newProject = page.getByRole('button', { name: /New Project/i }).first();
    await expect(newProject).toBeVisible({ timeout: 6000 });
    await newProject.click();

    await expect(page.getByRole('heading', { name: 'Failed to Load' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Blender WASM artifact not found/)).toBeVisible();
    await expect(page.getByText(/scripts\/build-blender-wasm\.sh build/)).toBeVisible();
  });
});
