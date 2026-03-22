/**
 * Rehype plugin: extract h2/h3 headings (after rehype-slug has set their ids)
 * and inject them as a named ESM export `headings` from the MDX module.
 *
 * Run order: AFTER rehype-slug (which sets id attributes), BEFORE Shiki
 * (which doesn't affect headings but runs last).
 *
 * The exported `headings` array flows through import.meta.glob into the
 * ContentModule interface — no DOM scraping needed at runtime.
 */
import type { Element, Root } from 'hast'
import type { Plugin } from 'unified'
import { toString } from 'hast-util-to-string'
import { visit } from 'unist-util-visit'

interface HeadingItem {
  id: string
  text: string
  depth: 2 | 3
}

export const rehypeExportHeadings: Plugin<[], Root> = () => (tree) => {
  const headings: HeadingItem[] = []

  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'h2' && node.tagName !== 'h3')
      return
    const id = node.properties?.id
    if (typeof id !== 'string' || !id)
      return
    headings.push({
      id,
      text: toString(node),
      depth: Number(node.tagName[1]) as 2 | 3,
    })
  })

  // Inject: export const headings = [...]
  tree.children.push({
    type: 'mdxjsEsm' as 'element',
    value: `export const headings = ${JSON.stringify(headings)}`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExportNamedDeclaration',
            specifiers: [],
            source: null,
            declaration: {
              type: 'VariableDeclaration',
              kind: 'const',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: { type: 'Identifier', name: 'headings' },
                  init: {
                    type: 'ArrayExpression',
                    elements: headings.map(h => ({
                      type: 'ObjectExpression',
                      properties: [
                        {
                          type: 'Property',
                          kind: 'init',
                          computed: false,
                          shorthand: false,
                          method: false,
                          key: { type: 'Identifier', name: 'id' },
                          value: { type: 'Literal', value: h.id, raw: JSON.stringify(h.id) },
                        },
                        {
                          type: 'Property',
                          kind: 'init',
                          computed: false,
                          shorthand: false,
                          method: false,
                          key: { type: 'Identifier', name: 'text' },
                          value: { type: 'Literal', value: h.text, raw: JSON.stringify(h.text) },
                        },
                        {
                          type: 'Property',
                          kind: 'init',
                          computed: false,
                          shorthand: false,
                          method: false,
                          key: { type: 'Identifier', name: 'depth' },
                          value: { type: 'Literal', value: h.depth, raw: String(h.depth) },
                        },
                      ],
                    })),
                  },
                },
              ],
            },
          },
        ],
      },
    },
  } as unknown as Element)
}
