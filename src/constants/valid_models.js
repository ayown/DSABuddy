export const VALID_MODELS = [
  // ── Groq (Free) ──────────────────────────────────────────
  { model: 'llama-3.3-70b-versatile', name: 'groq_llama', display: 'Llama 3.3 70B (Free)' },
  { model: 'deepseek-r1-distill-llama-70b', name: 'groq_deepseek', display: 'DeepSeek R1 70B (Free)' },

  // ── Gemini (Free / Paid) ─────────────────────────────────
  { model: 'gemini-2.0-flash', name: 'gemini_flash', display: 'Gemini 2.0 Flash ⚡' },
  { model: 'gemini-2.0-flash-lite', name: 'gemini_1.5_pro', display: 'Gemini 2.0 Flash-Lite ⚡' },

  // ── Custom ───────────────────────────────────────────────
  { model: 'custom', name: 'custom', display: 'Custom (OpenAI Compatible)' },
]