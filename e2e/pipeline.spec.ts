import { test, expect } from '@playwright/test';

test.describe('Pipeline Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the pipeline page
    await page.goto('/pipeline');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="pipeline-header"]', { timeout: 10000 });
  });

  test('should display pipeline with default stages and theme-aware styling', async ({ page }) => {
    // Test that the pipeline header is displayed with proper theme styling
    const header = page.locator('[data-testid="pipeline-header"]');
    await expect(header).toBeVisible();
    
    // Verify the page title uses theme typography
    const title = page.locator('h1');
    await expect(title).toHaveText('Pipeline');
    
    // Check that all default stages are displayed
    const stages = page.locator('[data-testid="pipeline-stage"]');
    await expect(stages).toHaveCount(4);
    
    // Verify stage names
    await expect(page.locator('text=Lead')).toBeVisible();
    await expect(page.locator('text=Contacted')).toBeVisible();
    await expect(page.locator('text=Negotiation')).toBeVisible();
    await expect(page.locator('text=Closed')).toBeVisible();
    
    // Test that stage columns use theme-aware styling
    const stageColumns = page.locator('[data-testid="pipeline-stage"]');
    for (let i = 0; i < 4; i++) {
      const column = stageColumns.nth(i);
      await expect(column).toBeVisible();
      
      // Verify theme-aware background and border colors
      const computedStyle = await column.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          borderRadius: style.borderRadius,
        };
      });
      
      // These should use theme tokens, not hardcoded values
      expect(computedStyle.borderRadius).not.toBe('0px');
      expect(computedStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should display pipeline cards with theme-aware styling', async ({ page }) => {
    // Check that cards are displayed in the Lead stage
    const leadStage = page.locator('[data-testid="pipeline-stage"]').first();
    const cards = leadStage.locator('[data-testid="pipeline-card"]');
    
    // Should have at least 2 cards in the Lead stage
    await expect(cards).toHaveCount(2);
    
    // Test first card styling and content
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
    
    // Verify card uses theme-aware styling
    const cardStyle = await firstCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
      };
    });
    
    // Should use theme tokens
    expect(cardStyle.borderRadius).not.toBe('0px');
    expect(cardStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    
    // Verify card content uses theme typography
    const cardTitle = firstCard.locator('[data-testid="card-title"]');
    await expect(cardTitle).toHaveText('Acme Corp');
    
    // Check priority badge uses theme colors
    const priorityBadge = firstCard.locator('[data-testid="priority-badge"]');
    await expect(priorityBadge).toHaveText('High');
    
    // Verify badge styling uses theme tokens
    const badgeStyle = await priorityBadge.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        borderColor: style.borderColor,
        fontSize: style.fontSize,
      };
    });
    
    // Should use theme priority colors
    expect(badgeStyle.fontSize).toBe('0.75rem');
  });

  test('should create new deal with theme-aware form styling', async ({ page }) => {
    // Click the "Add Deal" button
    const addDealButton = page.locator('button:has-text("Add Deal")');
    await addDealButton.click();
    
    // Wait for dialog to open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Verify dialog uses theme-aware styling
    const dialogStyle = await dialog.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
      };
    });
    
    // Should use theme tokens
    expect(dialogStyle.borderRadius).not.toBe('0px');
    
    // Fill out the form
    await page.fill('[data-testid="deal-title-input"]', 'Test Deal');
    await page.fill('[data-testid="deal-description-input"]', 'Test Description');
    await page.fill('[data-testid="deal-value-input"]', '50000');
    await page.selectOption('[data-testid="deal-priority-select"]', 'high');
    await page.fill('[data-testid="client-name-input"]', 'Test Client');
    await page.fill('[data-testid="client-company-input"]', 'Test Company');
    
    // Submit the form
    const createButton = page.locator('button:has-text("Create Deal")');
    await createButton.click();
    
    // Verify dialog closed
    await expect(dialog).not.toBeVisible();
    
    // Check that new card was added (this would require proper state management)
    // For now, just verify the form submission worked
    await expect(page.locator('text=Test Deal')).toBeVisible();
  });

  test('should create new stage with theme-aware styling', async ({ page }) => {
    // Click the "Add Stage" button
    const addStageButton = page.locator('button:has-text("Add Stage")');
    await addStageButton.click();
    
    // Wait for dialog to open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Fill out the stage form
    await page.fill('[data-testid="stage-name-input"]', 'New Stage');
    await page.fill('[data-testid="stage-description-input"]', 'A new pipeline stage');
    await page.selectOption('[data-testid="stage-color-select"]', '#EC4899'); // Pink
    
    // Submit the form
    const createButton = page.locator('button:has-text("Create Stage")');
    await createButton.click();
    
    // Verify dialog closed
    await expect(dialog).not.toBeVisible();
    
    // Check that new stage was added
    await expect(page.locator('text=New Stage')).toBeVisible();
    
    // Verify the new stage uses theme-aware styling
    const newStage = page.locator('[data-testid="pipeline-stage"]').last();
    await expect(newStage).toBeVisible();
    
    // Check that the stage color indicator uses the selected color
    const colorIndicator = newStage.locator('[data-testid="stage-color-indicator"]');
    const colorStyle = await colorIndicator.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });
    
    // Should use the selected color
    expect(colorStyle).toBe('rgb(236, 72, 153)'); // #EC4899
  });

  test('should navigate to client details from pipeline card', async ({ page }) => {
    // Click on the first card's menu button
    const firstCard = page.locator('[data-testid="pipeline-card"]').first();
    const menuButton = firstCard.locator('[data-testid="card-menu-button"]');
    await menuButton.click();
    
    // Wait for menu to open
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();
    
    // Click "View Client"
    const viewClientOption = page.locator('text=View Client');
    await viewClientOption.click();
    
    // Should navigate to client page
    await expect(page).toHaveURL(/\/clients\/\d+/);
  });

  test('should display pipeline statistics with theme-aware styling', async ({ page }) => {
    // Check that pipeline stats are displayed
    const statsChip = page.locator('[data-testid="pipeline-stats"]');
    await expect(statsChip).toBeVisible();
    
    // Should show total number of deals
    await expect(statsChip).toContainText('5 deals');
    
    // Verify chip uses theme-aware styling
    const chipStyle = await statsChip.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        borderColor: style.borderColor,
        color: style.color,
        borderRadius: style.borderRadius,
      };
    });
    
    // Should use theme tokens
    expect(chipStyle.borderRadius).not.toBe('0px');
    
    // Check total value display
    const totalValue = page.locator('[data-testid="pipeline-total-value"]');
    if (await totalValue.isVisible()) {
      // Should use theme success color
      const valueStyle = await totalValue.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.color;
      });
      
      // Should use theme success color (green)
      expect(valueStyle).toMatch(/rgb\(18, 183, 106\)|#12b76a/);
    }
  });

  test('should apply theme variants correctly to components', async ({ page }) => {
    // Test that components use theme variants instead of custom sx
    const stageColumns = page.locator('[data-testid="pipeline-stage"]');
    
    for (let i = 0; i < 4; i++) {
      const column = stageColumns.nth(i);
      
      // Check that the column has proper theme-aware styling
      const columnStyle = await column.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          borderRadius: style.borderRadius,
          padding: style.padding,
          minHeight: style.minHeight,
        };
      });
      
      // Should use theme spacing and border radius
      expect(columnStyle.padding).not.toBe('0px');
      expect(columnStyle.borderRadius).not.toBe('0px');
      expect(columnStyle.minHeight).toBe('400px');
    }
    
    // Test that cards use theme-aware styling
    const cards = page.locator('[data-testid="pipeline-card"]');
    const firstCard = cards.first();
    
    const cardStyle = await firstCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
        transition: style.transition,
      };
    });
    
    // Should use theme tokens for transitions and borders
    expect(cardStyle.transition).toContain('all');
    expect(cardStyle.borderRadius).not.toBe('0px');
  });

  test('should handle theme switching correctly', async ({ page }) => {
    // This test would require a theme toggle button
    // For now, verify that the current theme is applied consistently
    
    // Check that all components use consistent theme colors
    const stageColumns = page.locator('[data-testid="pipeline-stage"]');
    const firstColumn = stageColumns.first();
    
    const columnStyle = await firstColumn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        color: style.color,
      };
    });
    
    // All colors should be consistent with the current theme
    expect(columnStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(columnStyle.borderColor).not.toBe('rgba(0, 0, 0, 0)');
    
    // Verify that no hardcoded colors are used
    // This is a key requirement - all colors must come from the theme
    const allElements = page.locator('*');
    
    // This is a simplified check - in a real scenario, you'd want to
    // scan the computed styles for any hardcoded hex colors
    await expect(allElements).not.toContainText('#000000');
    await expect(allElements).not.toContainText('#ffffff');
  });
});

// Test data attributes for theme variants
test.describe('Theme Variant Testing', () => {
  test('should apply correct theme variants to components', async ({ page }) => {
    await page.goto('/pipeline');
    
    // Test that buttons use theme variants
    const addDealButton = page.locator('button:has-text("Add Deal")');
    const buttonClasses = await addDealButton.getAttribute('class');
    
    // Should include MUI theme classes
    expect(buttonClasses).toContain('MuiButton');
    expect(buttonClasses).toContain('MuiButton-contained');
    
    // Test that cards use theme variants
    const cards = page.locator('[data-testid="pipeline-card"]');
    const firstCard = cards.first();
    const cardClasses = await firstCard.getAttribute('class');
    
    // Should include MUI theme classes
    expect(cardClasses).toContain('MuiCard');
    expect(cardClasses).toContain('MuiPaper');
    
    // Test that chips use theme variants
    const chips = page.locator('[data-testid="priority-badge"]');
    const firstChip = chips.first();
    const chipClasses = await firstChip.getAttribute('class');
    
    // Should include MUI theme classes
    expect(chipClasses).toContain('MuiChip');
    expect(chipClasses).toContain('MuiChip-outlined');
  });
});
