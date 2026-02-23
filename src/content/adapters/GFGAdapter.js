import { SiteAdapter } from './SiteAdapter'
import { extractCode } from '../util'
import { SELECTORS } from '@/constants/selectors'

function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

function firstElementByText(selector, minChars = 50) {
  const els = Array.from(document.querySelectorAll(selector))
  for (const el of els) {
    const t = normalizeText(el?.innerText || el?.textContent || '')
    if (t.length >= minChars) return el
  }
  return els[0] || null
}

export class GFGAdapter extends SiteAdapter {
  match(url) {
    try {
      const u = new URL(url)
      if (!u.hostname.endsWith('geeksforgeeks.org')) return false
      return (
        u.pathname.includes('/problems/') || u.pathname.includes('/problem/')
      )
    } catch {
      return false
    }
  }

  getProblemStatement() {
    const el = firstElementByText(SELECTORS.gfg.problemStatement, 80)
    const text = el ? el.innerText || el.textContent || '' : ''
    const cleaned = normalizeText(text)
    if (cleaned) return cleaned.slice(0, 2000)

    const meta = document.querySelector(
      'meta[name="description"], meta[property="og:description"]'
    )
    return normalizeText(meta?.getAttribute('content') || '').slice(0, 800)
  }

  getUserCode() {
    const editor = document.querySelector('.monaco-editor')
    const lines = editor
      ? editor.querySelectorAll('.view-lines .view-line')
      : document.querySelectorAll(SELECTORS.gfg.editorLines)
    const code = extractCode(lines)
    return code.trim()
  }

  getLanguage() {
    const candidate = document.querySelector(SELECTORS.gfg.language)
    if (!candidate) return 'UNKNOWN'

    if (candidate.tagName === 'SELECT') {
      const selected = candidate.options?.[candidate.selectedIndex]
      return (
        normalizeText(selected?.textContent || selected?.value || 'UNKNOWN') ||
        'UNKNOWN'
      )
    }

    const text = normalizeText(candidate.textContent)
    if (text && text.length < 60) return text
    return 'UNKNOWN'
  }

  getProblemName() {
    const titleEl = firstElementByText(SELECTORS.gfg.problemTitle, 5)
    const title = normalizeText(titleEl ? titleEl.textContent : '')
    if (title)
      return `gfg:${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`

    const url = window.location.href
    const m = /\/problems\/([^/?#]+)/.exec(url)
    if (m) return `gfg:${m[1]}`
    return `gfg:${window.location.pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'unknown'}`
  }
}
