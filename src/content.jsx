import { createRoot } from 'react-dom/client'
import ContentPage from './content/content'
import './index.css'

// Create a container for the React app
const container = document.createElement('div')
container.id = '__dsa_buddy_root'
document.body.appendChild(container)

// Render the React component
const root = createRoot(container)
root.render(<ContentPage />)

console.log('DSA Buddy content script loaded with full functionality')