export function extractCode(htmlContent) {
  // Extract the text content of each line with the 'view-line' class
  const code = Array.from(htmlContent)
    .map((line) => line.textContent || '') // Ensure textContent is not null
    .join('\n');

  return code
}