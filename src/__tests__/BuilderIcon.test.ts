import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BuilderIcon from '../components/BuilderIcon.vue'

describe('BuilderIcon', () => {
  it('renders an SVG for a known field type', () => {
    const wrapper = mount(BuilderIcon, { props: { type: 'text' } })
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('data-qa')).toBe('builder-icon')
    expect(svg.attributes('width')).toBe('14')
    expect(svg.attributes('height')).toBe('14')
    expect(svg.findAll('path').length).toBeGreaterThan(0)
  })

  it('applies a custom size', () => {
    const wrapper = mount(BuilderIcon, { props: { type: 'number', size: 22 } })
    expect(wrapper.find('svg').attributes('width')).toBe('22')
  })

  it('renders rects for types that use them', () => {
    const wrapper = mount(BuilderIcon, { props: { type: 'date' } })
    expect(wrapper.findAll('rect').length).toBe(1)
  })

  it('renders a filled circle for radio-group (solid center dot)', () => {
    const wrapper = mount(BuilderIcon, { props: { type: 'radio-group' } })
    const circles = wrapper.findAll('circle')
    const filled = circles.filter((c) => c.attributes('fill') === 'currentColor')
    expect(filled.length).toBe(1)
  })

  it('renders nothing for an unknown type', () => {
    const wrapper = mount(BuilderIcon, { props: { type: 'does-not-exist' } })
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.html()).toBe('<!--v-if-->')
  })
})
