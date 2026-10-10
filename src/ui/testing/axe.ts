type AxeResults = { violations: Array<{ id: string; help: string; nodes: Array<{ target: unknown }> }> }
type Axe = { run: (context: Element, options?: object) => Promise<AxeResults> }
type NodeRequire = ((id: string) => unknown) & { resolve: (id: string) => string }

/**
 * axe-core as shipped with the @axe-core/playwright dev dependency (no new
 * package). jsdom has no layout or paint, so colour contrast is checked in the
 * real-browser gallery test instead. `node:module` is imported by a variable
 * specifier so Node's global types stay out of the browser-typed UI program.
 */
export async function axeViolations(container: Element) {
  const specifier = 'node:module'
  const { createRequire } = (await import(/* @vite-ignore */ specifier)) as {
    createRequire: (from: string) => NodeRequire
  }
  const require = createRequire(import.meta.url)
  const axePath = createRequire(require.resolve('@axe-core/playwright')).resolve('axe-core')
  const axe = require(axePath) as Axe
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  return results.violations.map(v => `${v.id}: ${v.help} (${v.nodes.map(n => String(n.target)).join(', ')})`)
}
