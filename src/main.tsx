import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/i18n'
import { migrate } from '@/core/state'
import { installLifecycleFlush } from '@/persistence/lifecycle'
import { createSaveStore } from '@/persistence/saveStore'
import { App } from './app/App'
import { loadLevels } from './app/levels'
import { readMode } from './app/mode'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root not found')
}

// Boot order: i18n (imported above) → save store with the P0-07 migrator → React.
const mode = readMode(location.search)
const saveStore = createSaveStore({ migrate })
installLifecycleFlush(saveStore)

createRoot(container).render(
  <StrictMode>
    <App mode={mode} saveStore={saveStore} loadLevels={() => loadLevels(mode)} />
  </StrictMode>,
)
