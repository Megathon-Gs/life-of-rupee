import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { i18n } from '@/i18n'
import type { Locale } from '@/core/contracts'
import { GalleryColumn, SURFACES, type Surface } from './Gallery'
import '../tokens'
import './gallery-page.css'

/*
 * Dev gallery: /src/ui/dev/gallery.html
 *   ?surface=hud|dialogue|panel|results|skilltree|settings  one surface, full viewport
 *   ?locale=en|te                                           one locale (default: both)
 *   ?motion=reduced|full                                    force the motion setting
 */
const params = new URLSearchParams(location.search)
const surfaceParam = params.get('surface') as Surface | null
const solo = surfaceParam !== null && SURFACES.includes(surfaceParam)
const locales: Locale[] = params.get('locale') === 'te' ? ['te'] : params.get('locale') === 'en' ? ['en'] : ['en', 'te']
const motion = params.get('motion')
const reducedMotion = motion === 'reduced' ? true : motion === 'full' ? false : 'system'

function GalleryPage() {
  if (solo) {
    return (
      <main>
        <h1 className="gallery-sr-only">Lifeof₹ UI gallery: {surfaceParam}</h1>
        <GalleryColumn i18n={i18n} locale={locales[0]!} reducedMotion={reducedMotion} surfaces={[surfaceParam!]} solo />
      </main>
    )
  }
  return (
    <main className="gallery">
      <h1 className="gallery-title">Lifeof₹ UI gallery</h1>
      <div className="gallery-columns">
        {locales.map(locale => (
          <GalleryColumn key={locale} i18n={i18n} locale={locale} reducedMotion={reducedMotion} surfaces={SURFACES} />
        ))}
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GalleryPage />
  </StrictMode>,
)
