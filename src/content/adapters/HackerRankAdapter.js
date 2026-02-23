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

export class HackerRankAdapter extends SiteAdapter {
  match(url) {
    try {
      const u = new URL(url)
      if (!u.hostname.endsWith('hackerrank.com')) return false
      return (
        u.pathname.includes('/challenges/') ||
        u.pathname.includes('/contests/') ||
        u.pathname.includes('/tests/')
      )
    } catch {
      return false
    }
  }

  getProblemStatement() {
    const el = firstVisibleElement(SELECTORS.hackerrank.problemStatement)
    const text = el ? el.innerText || el.textContent || '' : ''
    return normalizeText(text).slice(0, 2000)
  }

  getUserCode() {
    const editor = firstVisibleElement('.monaco-editor')
    const lines = editor
      ? editor.querySelectorAll('.view-lines .view-line')
      : document.querySelectorAll(SELECTORS.hackerrank.editorLines)
    const code = extractCode(lines)
    return code.trim()
  }

  getLanguage() {
    const candidate = firstVisibleElement(SELECTORS.hackerrank.language)
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
    const titleEl = firstVisibleElement(SELECTORS.hackerrank.problemTitle)
    const title = normalizeText(titleEl ? titleEl.textContent : '')
    if (title)
      return `hackerrank:${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`

    const url = window.location.href
    const m = /\/challenges\/([^/?#]+)/.exec(url)
    if (m) return `hackerrank:${m[1]}`
    return `hackerrank:${window.location.pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'unknown'}`
  }
}
