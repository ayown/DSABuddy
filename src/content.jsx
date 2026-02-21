import { createRoot } from 'react-dom/client'
import ContentPage from './content/content'
import './index.css'

const CONTAINER_ID = '__dsa_buddy_root'
let reactRoot = null

function ensureContainer() {
    // If already mounted and still in DOM, nothing to do
    if (document.getElementById(CONTAINER_ID)) return

    console.log('DSA Buddy: injecting bot icon container...')

    const container = document.createElement('div')
    container.id = CONTAINER_ID

    document.body.appendChild(container)

    reactRoot = createRoot(container)
    reactRoot.render(<ContentPage />)
}

// Initial injection
ensureContainer()

// Re-inject if LeetCode's SPA navigation removes our container
const bodyObserver = new MutationObserver(() => {
    if (!document.getElementById(CONTAINER_ID)) {
        console.log('DSA Buddy: container removed, re-injecting...')
        ensureContainer()
    }
})

// Observe direct children of document.body for removal
bodyObserver.observe(document.body, { childList: true, subtree: false })