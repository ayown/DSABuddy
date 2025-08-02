# DSA Buddy

DSA Buddy is a Chrome extension designed to help users practice and learn Data Structures and Algorithms (DSA) efficiently. Built with React, TypeScript, and Vite, it offers an interactive interface, curated resources, and productivity tools for DSA enthusiasts.

## Features

- 📚 Interactive DSA content and resources
- 📝 Practice problems and solutions
- 🔍 Quick search and navigation
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast development with Vite and HMR

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [pnpm](https://pnpm.io/) (or npm/yarn)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/DSABuddy.git
   cd DSABuddy
   ```

2. **Install dependencies:**
   ```sh
   pnpm install
   # or
   npm install
   ```

3. **Start the development server:**
   ```sh
   pnpm dev
   # or
   npm run dev
   ```

4. **Build for production:**
   ```sh
   pnpm build
   # or
   npm run build
   ```

5. **Load the extension in Chrome:**
   - Run the build command above.
   - Go to `chrome://extensions/` in your browser.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `dist` folder.

## Project Structure

```
DSABuddy/
├── public/             # Static assets
├── src/                # Source code
│   ├── assets/         # Images and static files
│   ├── components/     # React components
│   ├── constants/      # Constant values
│   ├── content/        # Content scripts
│   ├── hooks/          # Custom React hooks
│   ├── interface/      # TypeScript interfaces/types
│   ├── App.tsx         # Main App component
│   ├── background.js   # Chrome extension background script
│   ├── content.tsx     # Content script entry
│   ├── main.tsx        # App entry point
│   └── index.css       # Global styles
├── index.html
├── manifest.json
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── ...
```

## Linting & Formatting

- **ESLint** is configured for type-aware linting.
- **Prettier** is used for code formatting.

## License

[MIT](LICENSE)

---

Made with ❤️ using React, TypeScript, and Vite.