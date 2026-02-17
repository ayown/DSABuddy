import { SiteAdapter } from './SiteAdapter';
import { extractCode } from '../util';
import { SELECTORS } from '@/constants/selectors';

export class LeetCodeAdapter extends SiteAdapter {
    match(url) {
        return url.includes('leetcode.com/problems/');
    }

    getProblemStatement() {
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
