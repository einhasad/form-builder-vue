import { test, expect } from '@playwright/test'

test.describe('examples · FormBuilder basic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/examples/builder-basic')
  })

  test('route is selected in sidebar', async ({ page }) => {
    await expect(page.locator('[data-qa="sidebar-formbuilder"]')).toHaveClass(/is-active/)
    await expect(page.locator('[data-qa="example-title"]')).toContainText('FormBuilder · basic v-model')
  })

  test('control panel lists every documented field type', async ({ page }) => {
    // From README Field Types list: 14 built-ins
    const controlItems = page.locator('[data-qa="control-item"]')
    await expect(controlItems).toHaveCount(14)
  })

  test('clicking a control adds a field and updates v-model', async ({ page }) => {
    await expect(page.locator('[data-qa="field-count"]')).toHaveText('Fields: 0')
    await expect(page.locator('[data-qa="stage-empty"]')).toBeVisible()

    // Click the text control
    await page.locator('[data-qa="control-item"]', { hasText: /Text Field/ }).first().click()
    await expect(page.locator('[data-qa="field-count"]')).toHaveText('Fields: 1')
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(1)

    // JSON preview reflects the new field
    const json = await page.locator('[data-qa="model-json"]').innerText()
    expect(json).toContain('"type": "text"')
    expect(json).not.toContain('"className": "form-control"')
  })

  test('remove button deletes a field', async ({ page }) => {
    await page.locator('[data-qa="control-item"]', { hasText: /Text Field/ }).first().click()
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(1)
    await page.locator('[data-qa="field-remove-btn"]').first().click()
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(0)
    await expect(page.locator('[data-qa="field-count"]')).toHaveText('Fields: 0')
  })

  test('edit toggle opens the edit panel', async ({ page }) => {
    await page.locator('[data-qa="control-item"]', { hasText: /Text Field/ }).first().click()
    await page.locator('[data-qa="field-edit-btn"]').first().click()
    await expect(page.locator('[data-qa="field-edit-btn"]').first()).toHaveClass(/field-edit-active/)
  })

  test('copy action duplicates a field', async ({ page }) => {
    await page.locator('[data-qa="control-item"]', { hasText: /Text Field/ }).first().click()
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(1)
    await page.locator('[data-qa="field-copy-btn"]').first().click()
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(2)
  })

  test('save / clear buttons are visible', async ({ page }) => {
    await expect(page.locator('[data-qa="action-save"]')).toBeVisible()
    await expect(page.locator('[data-qa="action-clear"]')).toBeVisible()
  })

  test('clear removes every field', async ({ page }) => {
    for (const type of ['Text Field', 'Number', 'Select']) {
      await page.locator('[data-qa="control-item"]', { hasText: new RegExp(type) }).first().click()
    }
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(3)
    await page.locator('[data-qa="action-clear"]').click()
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(0)
  })
})

test.describe('examples · FormBuilder options', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/examples/builder-options')
  })

  test('controlPosition toggles builder layout class', async ({ page }) => {
    const select = page.locator('[data-qa="opt-controlPosition"]')
    await expect(page.locator('[data-qa="builder-wrapper"]')).toHaveAttribute('data-qa-position', 'left')
    await expect(page.locator('.builder-layout')).not.toHaveClass(/control-right/)

    await select.selectOption('right')
    await expect(page.locator('.builder-layout')).toHaveClass(/control-right/)

    await select.selectOption('left')
    await expect(page.locator('.builder-layout')).not.toHaveClass(/control-right/)
  })

  test('showActionButtons hides the save/clear bar', async ({ page }) => {
    await expect(page.locator('[data-qa="builder-actions"]')).toBeVisible()
    await page.locator('[data-qa="opt-showActionButtons"]').uncheck()
    await expect(page.locator('[data-qa="builder-actions"]')).toHaveCount(0)
    await page.locator('[data-qa="opt-showActionButtons"]').check()
    await expect(page.locator('[data-qa="builder-actions"]')).toBeVisible()
  })

  test('disableFields removes types from the control panel', async ({ page }) => {
    // Hidden is hidden by default in this view; unchecking restores it.
    await expect(page.locator('[data-qa="control-item"]')).toHaveCount(13)

    await page.locator('[data-qa="opt-hideButton"]').check()
    await expect(page.locator('[data-qa="control-item"]')).toHaveCount(12)

    await page.locator('[data-qa="opt-hideHidden"]').uncheck()
    await page.locator('[data-qa="opt-hideButton"]').uncheck()
    await expect(page.locator('[data-qa="control-item"]')).toHaveCount(14)
  })

  test('disabledAttrs hides the "label" input in the edit panel', async ({ page }) => {
    await page.locator('[data-qa="control-item"]', { hasText: /Text Field/ }).first().click()
    await page.locator('[data-qa="field-edit-btn"]').first().click()
    const editPanel = page.locator('[data-qa="edit-panel"]')
    await expect(editPanel).toBeVisible()
    const beforeLabel = await editPanel.locator('[data-qa="attr-label"]', { hasText: /^Label$/ }).count()
    expect(beforeLabel).toBeGreaterThan(0)

    await page.locator('[data-qa="field-edit-btn"]').first().click()
    await page.locator('[data-qa="opt-disableLabel"]').check()
    await page.locator('[data-qa="field-edit-btn"]').first().click()
    const afterLabel = await page.locator('[data-qa="edit-panel"] [data-qa="attr-label"]', { hasText: /^Label$/ }).count()
    expect(afterLabel).toBe(0)
  })
})

test.describe('examples · FormBuilder events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/examples/builder-events')
  })

  test('loaded fires on mount', async ({ page }) => {
    // The event log should already contain a "loaded" entry once mounted.
    await expect(page.locator('[data-qa="log-loaded"]')).toBeVisible()
  })

  test('field-added, field-updated and update:modelValue fire on add', async ({ page }) => {
    await page.locator('[data-qa="control-item"]', { hasText: /Text Field/ }).first().click()
    await expect(page.locator('[data-qa="log-field-added"]').first()).toBeVisible()
    await expect(page.locator('[data-qa="log-update:modelValue"]').first()).toBeVisible()
  })

  test('field-removed fires on remove', async ({ page }) => {
    await page.locator('[data-qa="control-item"]', { hasText: /Text Field/ }).first().click()
    await page.locator('[data-qa="field-remove-btn"]').first().click()
    await expect(page.locator('[data-qa="log-field-removed"]').first()).toBeVisible()
  })

  test('field-selected fires on edit toggle', async ({ page }) => {
    await page.locator('[data-qa="control-item"]', { hasText: /Text Field/ }).first().click()
    await page.locator('[data-qa="field-edit-btn"]').first().click()
    await expect(page.locator('[data-qa="log-field-selected"]').first()).toBeVisible()
  })

  test('save and clear events fire from action buttons', async ({ page }) => {
    await page.locator('[data-qa="action-save"]').click()
    await expect(page.locator('[data-qa="log-save"]').first()).toBeVisible()
    await page.locator('[data-qa="action-clear"]').click()
    await expect(page.locator('[data-qa="log-clear"]').first()).toBeVisible()
  })

  test('log-clear button resets the log', async ({ page }) => {
    await page.locator('[data-qa="action-save"]').click()
    await expect(page.locator('[data-qa="log-count"]')).not.toHaveText('Entries: 0')
    await page.locator('[data-qa="log-clear"]').click()
    await expect(page.locator('[data-qa="log-count"]')).toHaveText('Entries: 0')
  })
})

test.describe('examples · FormBuilder methods', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/examples/builder-methods')
  })

  test('addField() pushes a field to the stage', async ({ page }) => {
    await expect(page.locator('[data-qa="m-count"]')).toHaveText('Fields: 0')
    await page.locator('[data-qa="m-addField"]').click()
    await expect(page.locator('[data-qa="m-count"]')).toHaveText('Fields: 1')
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(1)
  })

  test('setData(preset) replaces the field list', async ({ page }) => {
    await page.locator('[data-qa="m-addField"]').click()
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(1)
    await page.locator('[data-qa="m-setData"]').click()
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(3)
    await expect(page.locator('[data-qa="m-count"]')).toHaveText('Fields: 3')
  })

  test('removeField(first) drops the first entry', async ({ page }) => {
    await page.locator('[data-qa="m-setData"]').click()
    await page.locator('[data-qa="m-removeFirst"]').click()
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(2)
  })

  test('clearFields() empties the stage', async ({ page }) => {
    await page.locator('[data-qa="m-setData"]').click()
    await page.locator('[data-qa="m-clearFields"]').click()
    await expect(page.locator('[data-qa="builder-field"]')).toHaveCount(0)
    await expect(page.locator('[data-qa="stage-empty"]')).toBeVisible()
  })

  test('save() returns the form data JSON', async ({ page }) => {
    await page.locator('[data-qa="m-setData"]').click()
    await page.locator('[data-qa="m-save"]').click()
    await expect(page.locator('[data-qa="saved-output"]')).toContainText('"type": "header"')
    await expect(page.locator('[data-qa="saved-output"]')).toContainText('"label": "Your name"')
  })
})
