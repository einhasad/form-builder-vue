import { test, expect } from '@playwright/test'

test.describe('examples · FormRenderer basic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/examples/renderer-basic')
  })

  test('route is selected', async ({ page }) => {
    await expect(page.locator('[data-qa="sidebar-formrenderer"]')).toHaveClass(/is-active/)
  })

  test('pre-populated form definition is rendered', async ({ page }) => {
    await expect(page.locator('[data-qa="renderer-wrapper"]')).toBeVisible()
    await expect(page.locator('[data-qa="renderer-field"]')).toHaveCount(6)
    await expect(page.locator('[data-qa="field-label"]', { hasText: 'Full name' })).toBeVisible()
    // required marker rendered
    await expect(page.locator('[data-qa="required-marker"]').first()).toBeVisible()
  })

  test('header renders as h1', async ({ page }) => {
    await expect(page.locator('[data-qa="renderer-wrapper"] h1')).toHaveText('Contact details')
  })

  test('typing in a text input updates the v-model JSON', async ({ page }) => {
    const input = page.locator('input[name="full-name"]')
    await input.fill('Ada Lovelace')
    await expect(page.locator('[data-qa="user-data-json"]')).toContainText('"full-name"')
    await expect(page.locator('[data-qa="user-data-json"]')).toContainText('Ada Lovelace')
    await expect(page.locator('[data-qa="last-change"]')).toContainText('full-name')
  })

  test('select default value is reflected in the DOM', async ({ page }) => {
    // pre-populated "selected" option should be "Ukraine" (ua)
    const select = page.locator('select[name="country"]')
    await expect(select).toHaveValue('ua')
  })

  test('checkbox-group toggles values in the v-model', async ({ page }) => {
    const vueBox = page.locator('input[type="checkbox"][value="vue"]')
    await vueBox.check()
    await expect(page.locator('[data-qa="user-data-json"]')).toContainText('"vue"')
    await vueBox.uncheck()
    await expect(page.locator('[data-qa="user-data-json"]')).not.toContainText('"vue"')
  })
})

test.describe('examples · FormRenderer disabled', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/examples/renderer-disabled')
  })

  test('disabled prop disables every input by default', async ({ page }) => {
    const inputs = page.locator('[data-qa="renderer-wrapper"] input, [data-qa="renderer-wrapper"] textarea')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i += 1) {
      await expect(inputs.nth(i)).toBeDisabled()
    }
  })

  test('unchecking the toggle re-enables inputs', async ({ page }) => {
    await page.locator('[data-qa="disabled-toggle"]').uncheck()
    const inputs = page.locator('[data-qa="renderer-wrapper"] input, [data-qa="renderer-wrapper"] textarea')
    const count = await inputs.count()
    for (let i = 0; i < count; i += 1) {
      await expect(inputs.nth(i)).toBeEnabled()
    }
  })
})

test.describe('examples · composables', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/examples/composables')
  })

  test('useI18n translates a key and switches locale', async ({ page }) => {
    await expect(page.locator('[data-qa="i18n-locale"]')).toContainText('en-US')
    await expect(page.locator('[data-qa="i18n-result"]')).toHaveText('Checkbox Group')

    await page.locator('[data-qa="i18n-to-french"]').click()
    await expect(page.locator('[data-qa="i18n-locale"]')).toContainText('fr-FR')
    await expect(page.locator('[data-qa="i18n-result"]')).toHaveText('Groupe de cases à cocher')

    await page.locator('[data-qa="i18n-to-english"]').click()
    await expect(page.locator('[data-qa="i18n-result"]')).toHaveText('Checkbox Group')
  })

  test('useFieldRegistry exposes every built-in type', async ({ page }) => {
    await expect(page.locator('[data-qa="registry-count"]')).toContainText('14')
    for (const type of [
      'text', 'number', 'date', 'select', 'checkbox-group', 'radio-group',
      'checkbox', 'textarea', 'file', 'autocomplete', 'button', 'header',
      'paragraph', 'hidden',
    ]) {
      await expect(page.locator(`[data-qa="registry-type-${type}"]`)).toBeVisible()
    }
  })
})

test.describe('examples · shell', () => {
  test('sidebar hash-routed links navigate between examples', async ({ page }) => {
    await page.goto('/#/examples/builder-basic')
    await expect(page.locator('[data-qa="example-title"]')).toContainText('basic v-model')

    await page.locator('[data-qa="sidebar-events"]').click()
    await expect(page.locator('[data-qa="example-title"]')).toContainText('events')

    await page.locator('[data-qa="sidebar-formrenderer"]').click()
    await expect(page.locator('[data-qa="example-title"]')).toContainText('FormRenderer · basic')
  })

  test('root URL without a hash shows the docs view, not an example', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-qa="example-pane"]')).toHaveCount(0)
    await expect(page.locator('.hero-headline')).toBeVisible()
  })
})
