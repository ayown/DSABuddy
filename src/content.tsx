import './index.css'

// Simple content script that can be loaded by Chrome
console.log('DSA Buddy content script loaded')

// Add a simple UI element
const container = document.createElement('div')
container.id = '__dsa_buddy_container'
container.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 10000;
  background: white;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`
container.innerHTML = `
  <h3 style="margin: 0 0 10px 0; color: #333;">DSA Buddy</h3>
  <p style="margin: 0; font-size: 12px; color: #666;">Extension loaded successfully!</p>
`

document.body.appendChild(container)