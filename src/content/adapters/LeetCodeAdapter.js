import { SiteAdapter } from './SiteAdapter';
import { extractCode } from '../util';
import { SELECTORS } from '@/constants/selectors';

export class LeetCodeAdapter extends SiteAdapter {
    match(url) {
        return url.includes('leetcode.com/problems/');
    }

    getProblemStatement() {
        // Try to get the full problem description from the DOM first
        const descriptionEl = document.querySelector('[data-track-load="description_content"]')
            || document.querySelector('.elfjS')  // LeetCode's description container class
            || document.querySelector('[class*="description"]');

        if (descriptionEl) {
            // Get text content, clean up whitespace
            const fullText = descriptionEl.innerText || descriptionEl.textContent || '';
            if (fullText.trim().length > 50) {
                // Truncate to avoid token overload but keep enough for context
                return fullText.trim().slice(0, 2000);
            }
        }

        // Fallback: meta description (just a one-liner)
        const metaDescriptionEl = document.querySelector(SELECTORS.leetcode.metaDescription);
        return metaDescriptionEl?.getAttribute('content') || '';
    }

    getUserCode() {
        const userCurrentCodeContainer = document.querySelectorAll(SELECTORS.leetcode.userCode);
        return extractCode(userCurrentCodeContainer);
    }

    getLanguage() {
        const changeLanguageButton = document.querySelector(
            SELECTORS.leetcode.languageButton
        );
        if (changeLanguageButton && changeLanguageButton.textContent) {
            return changeLanguageButton.textContent;
        }
        return 'UNKNOWN';
    }

    getProblemName() {
        const url = window.location.href;
        const match = /\/problems\/([^/]+)/.exec(url);
        return match ? match[1] : 'Unknown Problem';
    }
}
