import { test, expect } from '@playwright/test'

test.describe('demo page', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    // `''` navigates to baseURL as-is, preserving any subpath like `/form-builder-vue/`.
    // `'/'` would be treated as root-absolute and strip the subpath (breaks on GH Pages).
    await page.goto('')
  })

  test('renders the hero', async ({ page }) => {
    await expect(page).toHaveTitle(/Form Builder/)
    await expect(page.locator('.hero-lede')).toContainText('A Vue 3 form builder you can actually reason about.')
    await expect(page.locator('[data-qa="live-demo"]')).toBeVisible()
    await expect(page.locator('.hero-pill-tag')).toHaveText(/^v\d+\.\d+$/)
  })

  test('header shows brand, nav, and search', async ({ page }) => {
    await expect(page.locator('.hdr-brand-name')).toHaveText('form-builder-vue')
    await expect(page.locator('.hdr-version')).toHaveText(/v\d+\.\d+\.\d+/)
    await expect(page.locator('.hdr-nav-item.is-active')).toHaveText('Docs')
    await expect(page.locator('.hdr-search-input')).toBeVisible()
  })

  test('header "Examples" link routes to the first example', async ({ page }) => {
    const link = page.locator('[data-qa="header-examples-link"]')
    await expect(link).toHaveAttribute('href', '#/examples/builder-basic')
    await link.click()
    await expect(page).toHaveURL(/#\/examples\/builder-basic$/)
    await expect(page.locator('[data-qa="example-pane"]')).toBeVisible()
  })

  test('header "Docs" link returns to the docs view', async ({ page }) => {
    await page.goto('#/examples/builder-basic')
    await expect(page.locator('[data-qa="example-pane"]')).toBeVisible()
    await page.locator('[data-qa="header-docs-link"]').click()
    await expect(page.locator('[data-qa="example-pane"]')).toHaveCount(0)
    await expect(page.locator('[data-qa="live-demo"]')).toBeVisible()
  })

  test('sidebar lists all documented sections', async ({ page }) => {
    const sections = [
      'Introduction', 'Installation', 'Quickstart',
      'FormBuilder', 'Field types', 'BuilderOptions', 'Events', 'Exposed methods',
      'FormRenderer', 'Disabled state', 'RendererOptions', 'v-model shape',
      'useFormBuilder', 'useFieldRegistry', 'useDragDrop', 'useI18n',
      'FormDataField', 'UserDataMap', 'FieldType enum', 'Changelog',
    ]
    for (const s of sections) {
      await expect(page.locator('.sidebar-link', { hasText: new RegExp(`^${s}$`) })).toBeVisible()
    }
  })

  test('anchor sidebar links scroll without changing active state', async ({ page }) => {
    const installation = page.locator('.sidebar-link', { hasText: 'Installation' })
    await expect(installation).not.toHaveClass(/is-active/)
    await installation.click()
    await expect(page).toHaveURL(/#installation$/)
  })

  test('example sidebar links mount the example and mark themselves active', async ({ page }) => {
    const link = page.locator('.sidebar-link', { hasText: 'BuilderOptions' })
    await expect(link).not.toHaveClass(/is-active/)
    await link.click()
    await expect(page).toHaveURL(/#\/examples\/builder-options$/)
    await expect(link).toHaveClass(/is-active/)
    await expect(page.locator('[data-qa="example-pane"]')).toBeVisible()
  })

  test('code-block copy buttons toggle to "copied"', async ({ page }) => {
    const block = page.locator('.codeblock .codeblock-copy').first()
    await expect(block).toHaveText('copy')
    await block.click()
    await expect(block).toHaveText('copied')
    await expect(block).toHaveText('copy', { timeout: 3_000 })
  })

  test('inline install copy button works', async ({ page }) => {
    const btn = page.locator('.codeblock--compact .codeblock-copy')
    await btn.click()
    await expect(btn).toHaveText('copied')
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toBe('npm install @einhasad-vue/form-builder-vue')
  })

  test('anchor nav scrolls to quickstart section', async ({ page }) => {
    await page.locator('.sidebar-link', { hasText: 'Quickstart' }).click()
    await expect(page).toHaveURL(/#quickstart$/)
    await expect(page.locator('#quickstart')).toBeInViewport()
  })

  test('FormBuilder props table lists both props', async ({ page }) => {
    const rows = page.locator('#formbuilder-props tbody tr')
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(0)).toContainText('modelValue')
    await expect(rows.nth(0)).toContainText('FormDataField[]')
    await expect(rows.nth(1)).toContainText('options')
    await expect(rows.nth(1)).toContainText('Partial<BuilderOptions>')
  })

  test('Events table lists all documented events', async ({ page }) => {
    const rows = page.locator('#events tbody tr')
    await expect(rows).toHaveCount(9)
    const expected = [
      'update:modelValue', 'field-added', 'field-removed',
      'field-updated', 'field-moved', 'field-selected', 'save', 'clear', 'loaded',
    ]
    for (let i = 0; i < expected.length; i += 1) {
      await expect(rows.nth(i)).toContainText(expected[i]!)
    }
  })

  test('BuilderOptions table lists all documented options', async ({ page }) => {
    const rows = page.locator('#options tbody tr')
    await expect(rows).toHaveCount(9)
    for (const opt of [
      'controlPosition', 'controlOrder', 'disableFields', 'disabledAttrs', 'showActionButtons',
      'editOnAdd', 'fieldRemoveWarn', 'fields', 'buttonStyles',
    ]) {
      await expect(page.locator('#options .prop-name', { hasText: new RegExp(`^${opt}$`) })).toBeVisible()
    }
  })

  test('field-type grid lists every built-in type', async ({ page }) => {
    const cards = page.locator('.field-card')
    await expect(cards).toHaveCount(14)
    await expect(cards.first()).toContainText('Autocomplete')
    await expect(cards.last()).toContainText('Text Area')
  })

  test('every field card matches a README-documented type', async ({ page }) => {
    const ids = [
      'text', 'number', 'date', 'select', 'checkbox-group', 'radio-group',
      'checkbox', 'textarea', 'file', 'autocomplete', 'button', 'header',
      'paragraph', 'hidden',
    ]
    for (const id of ids) {
      await expect(page.locator('.field-card code', { hasText: new RegExp(`^${id}$`) })).toBeVisible()
    }
  })

  test('live demo hosts a real FormBuilder with control chips + save/clear', async ({ page }) => {
    const demo = page.locator('[data-qa="live-demo"]')
    await expect(demo.locator('.preview-chrome-label')).toHaveText('auto-playing')
    await expect(demo.locator('.live-tab')).toHaveText(['Builder', 'Preview', 'JSON'])
    const builder = demo.locator('[data-qa="live-pane-builder"]')
    await expect(builder.locator('[data-qa="control-item"]')).toHaveCount(14)
    await expect(builder.locator('[data-qa="action-save"]')).toBeVisible()
    await expect(builder.locator('[data-qa="action-clear"]')).toBeVisible()
  })

  test('live demo auto-adds fields to the stage', async ({ page }) => {
    const fields = page.locator('[data-qa="live-pane-builder"] [data-qa="builder-field"]')
    await expect
      .poll(async () => fields.count(), { timeout: 6_000, intervals: [250] })
      .toBeGreaterThan(0)
  })

  test('search input updates its value and widens on focus', async ({ page }) => {
    const search = page.locator('.hdr-search-input')
    const initialWidth = await search.evaluate((el) => el.getBoundingClientRect().width)
    await search.fill('v-model')
    await expect(search).toHaveValue('v-model')
    // Width transitions under var(--dur-focus); poll until the growth settles.
    await expect.poll(
      async () => search.evaluate((el) => el.getBoundingClientRect().width),
      { timeout: 2_000, intervals: [100] },
    ).toBeGreaterThan(initialWidth)
  })

  test('footer renders updated date', async ({ page }) => {
    await expect(page.locator('.page-footer time')).toHaveText(/April 23, 2026/)
  })

  test('callouts render the note + tip blocks', async ({ page }) => {
    await expect(page.locator('.callout--note')).toContainText(/Stable, but young/)
    await expect(page.locator('.callout--tip')).toContainText(/Need a custom field type/)
    await expect(page.locator('.callout--tip')).toContainText('useFieldRegistry')
  })

  test('responsive: sidebar hides under 960px', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 })
    await expect(page.locator('.sidebar')).toBeHidden()
  })

  test('page content is present on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 380, height: 900 })
    await expect(page.locator('.hero-lede')).toBeVisible()
    await expect(page.locator('[data-qa="live-demo"]')).toBeVisible()
    await expect(page.locator('#installation .codeblock')).toBeVisible()
  })
})
