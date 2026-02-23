export const SELECTORS = {
  leetcode: {
    metaDescription: 'meta[name=description]',
    userCode: '.view-line',
    languageButton:
      'button.rounded.items-center.whitespace-nowrap.inline-flex.bg-transparent.dark\\:bg-dark-transparent.text-text-secondary.group',
  },
  hackerrank: {
    problemTitle: '[data-automation="challenge-name"], .challenge-name, h1',
    problemStatement:
      '[data-automation="problem-statement"], .problem-statement, .challenge-body-html, .challenge-body-html *',
    editorLines:
      '.monaco-editor .view-lines .view-line, .view-lines .view-line',
    language:
      '[data-automation="language-selector"], [data-automation="challenge-language-select"], select',
  },
  gfg: {
    problemTitle: 'h1, .problem-tab h1, [class*="problem"] h1',
    problemStatement:
      '.problem-statement, #problem-statement, [class*="problem_statement"], [class*="problemStatement"], [class*="problemDescription"], [class*="problem_content"], [class*="problemContent"], article',
    editorLines:
      '.monaco-editor .view-lines .view-line, .view-lines .view-line, .CodeMirror-code pre',
    language:
      'select#language, select[name*="language"], [class*="language"] select, select',
  },
}
