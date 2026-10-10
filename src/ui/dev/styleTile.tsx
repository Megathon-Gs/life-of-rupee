import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../tokens'
import { Button } from '../shell/Button'
import { PixelIcon } from '../shell/PixelIcon'
import { PixelStar } from '../shell/PixelStar'
import styles from './StyleTile.module.css'

const SWATCHES = [
  ['Sand', '--c-sand-50', '--c-sand-100', '--c-sand-200', '--c-sand-400'],
  ['Blue-ink', '--c-ink-900', '--c-ink-700', '--c-ink-500'],
  ['Jade', '--c-jade-700', '--c-jade-500', '--c-jade-100'],
  ['Marigold', '--c-marigold-600', '--c-marigold-400', '--c-marigold-100'],
  ['Coral', '--c-coral-700', '--c-coral-500', '--c-coral-100'],
  ['Leaf · Sky · Terracotta', '--c-leaf-600', '--c-sky-400', '--c-sky-200', '--c-terracotta-600'],
] as const

/** Static style-tile specimen: every value here comes from tokens.css. */
function StyleTile() {
  return (
    <div data-ps-ui className={styles.tile}>
      <section className={styles.block} aria-labelledby="palette">
        <h2 id="palette" className={styles.h2}>Palette</h2>
        <ul className={styles.swatches}>
          {SWATCHES.map(([name, ...vars]) => (
            <li key={name} className={styles.family}>
              <span className={styles.familyName}>{name}</span>
              <span className={styles.chips}>
                {vars.map(v => (
                  <span key={v} className={styles.chip} style={{ background: `var(${v})` }} title={v} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="type">
        <h2 id="type" className={styles.h2}>Type</h2>
        <p className={styles.t3xl}>Open your first account</p>
        <p className={styles.txl}>Meena needs a safe place for festival money.</p>
        <p className={styles.tmd}>
          Check which documents the bank can accept. Nothing here asks for your real details.
        </p>
        <p className={styles.tmd}>₹1,250.00 · ₹ 48,000 · 3 of 3</p>
        <div lang="te" data-ps-ui className={styles.telugu}>
          <p className={styles.txl}>మీ మొదటి ఖాతాను తెరవండి</p>
          <p className={styles.tmd}>
            బ్యాంకు ఏ పత్రాలను అంగీకరించగలదో చూడండి. ఇక్కడ మీ నిజమైన వివరాలు అడగబడవు.
          </p>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="controls">
        <h2 id="controls" className={styles.h2}>Controls</h2>
        <div className={styles.row}>
          <Button variant="primary">Try again</Button>
          <Button>Continue</Button>
          <Button variant="quiet">Skip</Button>
          <Button iconOnly aria-label="Settings">
            <PixelIcon name="settings" scale={3} />
          </Button>
        </div>
        <div className={styles.row}>
          <span className={styles.focusDemo}>Focus ring</span>
          <Button disabled>Locked</Button>
        </div>
      </section>

      <section className={styles.block} aria-labelledby="stars">
        <h2 id="stars" className={styles.h2}>Stars and nodes</h2>
        <div className={styles.row}>
          <PixelStar state="earned" scale={5} />
          <PixelStar state="earned" scale={5} />
          <PixelStar state="lost" scale={5} />
          <PixelStar state="empty" scale={3} />
        </div>
        <div className={styles.row}>
          <span className={`${styles.node} ${styles.lit}`}>Financial Identity</span>
          <span className={`${styles.node} ${styles.next}`}>Digital Payments</span>
          <span className={`${styles.node} ${styles.locked}`}>Spotting Fraud</span>
        </div>
      </section>

      <section className={`${styles.block} ${styles.surfaceDemo}`} aria-labelledby="surfaces">
        <h2 id="surfaces" className={styles.h2}>Surfaces</h2>
        <div className={styles.paper}>Paper panel: bezel + hard drop</div>
        <div className={styles.inkPlate}>Ink plate: HUD sign</div>
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyleTile />
  </StrictMode>,
)
