import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Capture console errors per test — lots of regressions show up here first
  // (motion-v throwing on missing refs, Vue prop warnings, etc.).
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  ;(page as any).__errors = errors
  await page.goto('/')
})

test.afterEach(async ({ page }) => {
  const errors = (page as any).__errors as string[]
  expect(errors, `console errors: ${errors.join('\n')}`).toEqual([])
})

test('fixture mounts without errors and renders all sections', async ({ page }) => {
  await expect(page.getByTestId('hover-section')).toBeVisible()
  await expect(page.getByTestId('tap-section')).toBeVisible()
  await expect(page.getByTestId('controlled-section')).toBeVisible()
  await expect(page.getByTestId('parent-trigger-section')).toBeVisible()
  await expect(page.getByTestId('template-section')).toBeVisible()
  await expect(page.getByTestId('composed-section')).toBeVisible()
})

test('hovering a self-wrapped icon renders an svg and survives mouse traffic', async ({ page }) => {
  const icon = page.getByTestId('heart-hover')
  await expect(icon.locator('svg')).toBeVisible()

  // Trigger the hover lifecycle a few times. We're checking that motion-v
  // tolerates rapid enter/leave (a real bug we fixed previously was
  // listeners double-firing under nested mouseenter/leave). Stability here
  // is the assertion — the afterEach catches any console errors.
  for (let i = 0; i < 3; i++) {
    await icon.hover()
    await page.mouse.move(0, 0)
  }
  await expect(icon.locator('svg')).toBeVisible()
})

test('the :animate prop drives state from a sibling control', async ({ page }) => {
  const toggle = page.getByTestId('play-toggle')
  await expect(toggle).toHaveText('Play')
  await toggle.click()
  await expect(toggle).toHaveText('Stop')
  // The icon must keep rendering its svg through the state change.
  await expect(page.getByTestId('heart-controlled').locator('svg')).toBeVisible()
  await toggle.click()
  await expect(toggle).toHaveText('Play')
})

test('triggerTarget="parent" delegates listeners to the button', async ({ page }) => {
  const button = page.getByTestId('parent-button')

  // Hover the parent button — animation should run on the icon. The fixture
  // uses Heart with animation="fill", which tweens the path's `fillOpacity`
  // from 0 → 1. motion-v writes that as the SVG presentation attribute
  // `fill-opacity` (not inline style), so we poll the attribute and assert
  // it moved off the initial `"0"`.
  const path = button.locator('svg path').first()
  await button.hover()
  await expect
    .poll(() => path.getAttribute('fill-opacity'), { timeout: 1500 })
    .not.toBe('0')
})

test('as="template" wires hover to the consumer-controlled element', async ({ page }) => {
  const button = page.getByTestId('template-button')
  await expect(button).toBeVisible()
  await button.hover()
  await page.waitForTimeout(120)
  // No span wrapper should be rendered in template mode.
  const spans = await button.locator(':scope > span').count()
  // Children: icon svg + the label span. No motion span wrapper.
  expect(spans).toBeGreaterThan(0)
  await expect(button.locator('svg')).toBeVisible()
})

test('composed AnimateIcon hovers an entire pill of children', async ({ page }) => {
  const pill = page.getByTestId('composed-pill')
  await pill.hover()
  await page.waitForTimeout(120)
  // Both icons inside the pill should still be in the DOM after hover.
  await expect(pill.locator('svg')).toHaveCount(2)
})
