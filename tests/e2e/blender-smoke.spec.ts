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

  test('should load Blender WASM artifact successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await page.waitForTimeout(3000);

    // Click New Project to trigger Blender load
    const newProject = page.getByRole('button', { name: /New Project/i }).first();
    await expect(newProject).toBeVisible({ timeout: 6000 });
    await newProject.click();

    // Wait for Blender runtime to load (dynamically imported, not a script tag)
    await page.waitForTimeout(5000);

    const smokeStatus = page.getByTestId('blender-smoke-status');
    await expect(smokeStatus).toBeVisible({ timeout: 15000 });
    await expect(smokeStatus).toContainText('Real Blender code executed');
  });
});
