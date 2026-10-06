/**
 * Queries by what the user sees — label, accessible name, text, role — rather
 * than by class names or component internals.
 */
import { flushPromises, type DOMWrapper, type VueWrapper } from '@vue/test-utils'

/** A mounted component or an element in it, as `find` or `get` returned it. */
type Element_ = Omit<DOMWrapper<Element>, 'exists'>
type Root = VueWrapper | Element_

const text = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()

/** The form control labelled `label`, by `<label for>` or `aria-label`. */
export function field<T extends Element = HTMLInputElement>(
  root: Root,
  label: string,
): DOMWrapper<T> {
  const byFor = root.findAll('label').find((l) => text(l.element) === label)
  const target = byFor && root.find<T>(`#${byFor.attributes('for')}`)
  if (target?.exists()) return target
  const byAria = root.findAll<T>('[aria-label]').find((el) => el.attributes('aria-label') === label)
  if (byAria) return byAria
  throw new Error(`No field labelled "${label}" in:\n${root.html()}`)
}

/** Every button whose visible text contains `name` (an exact match wins). */
export function queryButtons(root: Root, name: string): DOMWrapper<HTMLButtonElement>[] {
  const all = root.findAll<HTMLButtonElement>('button')
  const exact = all.filter((b) => text(b.element) === name)
  return exact.length ? exact : all.filter((b) => text(b.element).includes(name))
}

export function button(root: Root, name: string): DOMWrapper<HTMLButtonElement> {
  const [first] = queryButtons(root, name)
  if (!first) throw new Error(`No button "${name}" in:\n${root.html()}`)
  return first
}

/** The link (RouterLink renders an `<a>`) whose text contains `name`. */
export function link(root: Root, name: string): DOMWrapper<HTMLAnchorElement> {
  const found = root.findAll<HTMLAnchorElement>('a').find((a) => text(a.element).includes(name))
  if (!found) throw new Error(`No link "${name}" in:\n${root.html()}`)
  return found
}

/** The text of the `role="alert"` message, or `null` when none is shown. */
export function alertText(root: Root): string | null {
  const alert = root.find('[role="alert"]')
  return alert.exists() ? text(alert.element) : null
}

/** The page's visible text, whitespace collapsed. */
export function pageText(root: Root): string {
  return text(root.element)
}

/** Types into the field labelled `label`. */
export async function fill(root: Root, label: string, value: string) {
  await field(root, label).setValue(value)
}

/** Submits the form around `el`, then lets every pending request settle. */
export async function submit(root: Root, selector = 'form') {
  await root.get(selector).trigger('submit')
  await flushPromises()
}

/** Clicks and waits for the requests and navigation the click starts. */
export async function click(el: Element_) {
  await el.trigger('click')
  await flushPromises()
}
