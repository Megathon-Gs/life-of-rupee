import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root not found')
}

createRoot(container).render(
  <StrictMode>
    <main>
      <h1>Paisa Street</h1>
      <p>Money skills for the street you live on.</p>
    </main>
  </StrictMode>,
)
