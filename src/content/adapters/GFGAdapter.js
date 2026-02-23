import { SiteAdapter } from './SiteAdapter'
import { extractCode } from '../util'
import { SELECTORS } from '@/constants/selectors'

function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

function firstVisibleElement(selector) {
  const els = Array.from(document.querySelectorAll(selector))
  return els.find((el) => el && el.offsetParent !== null) || null
}

export class GFGAdapter extends SiteAdapter {
  match(url) {
    try {
      const u = new URL(url)
      return u.hostname.endsWith('geeksforgeeks.org') && u.pathname.includes('/problems/')
    } catch {
      return false
    }
  }

  getProblemStatement() {
    const el = firstVisibleElement(SELECTORS.gfg.problemStatement)
    const text = el ? (el.innerText || el.textContent || '') : ''
    return normalizeText(text).slice(0, 2000)
  }

  getUserCode() {
    const editor = firstVisibleElement('.monaco-editor')
    const lines = editor
      ? editor.querySelectorAll('.view-lines .view-line')
      : document.querySelectorAll(SELECTORS.gfg.editorLines)
    const code = extractCode(lines)
    return code.trim()
  }

  getLanguage() {
    const candidate = firstVisibleElement(SELECTORS.gfg.language)
    if (!candidate) return 'UNKNOWN'

    if (candidate.tagName === 'SELECT') {
      const selected = candidate.options?.[candidate.selectedIndex]
      return normalizeText(selected?.textContent || selected?.value || 'UNKNOWN') || 'UNKNOWN'
    }

    const text = normalizeText(candidate.textContent)
    if (text && text.length < 60) return text
    return 'UNKNOWN'
  }

  getProblemName() {
    const titleEl = firstVisibleElement(SELECTORS.gfg.problemTitle)
    const title = normalizeText(titleEl ? titleEl.textContent : '')
    if (title) return `gfg:${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

    const url = window.location.href
    const m = /\/problems\/([^/?#]+)/.exec(url)
    if (m) return `gfg:${m[1]}`
    return `gfg:${window.location.pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'unknown'}`
  }
}