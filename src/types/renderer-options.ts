import type { NotifyCallbacks } from './common'

/** Configuration options for the FormRenderer component. */
export interface RendererOptions {
  disableHTMLLabels: boolean
  notify: NotifyCallbacks
}
