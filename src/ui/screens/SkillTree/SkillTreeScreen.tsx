import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { SkillNodeId, SkillTreeDef } from '@/core/contracts'
import { Button } from '../../shell/Button'
import { PixelIcon } from '../../shell/PixelIcon'
import styles from './SkillTreeScreen.module.css'

export type SkillNodeState = 'lit' | 'available' | 'locked'

/** Lit if completed; available if every prerequisite is lit; otherwise locked. */
export function skillNodeStates(tree: SkillTreeDef, completed: readonly SkillNodeId[]) {
  const done = new Set<string>(completed)
  const states = new Map<string, SkillNodeState>()
  for (const node of tree.nodes) {
    const prerequisites = tree.edges.filter(edge => edge.to === node.id).map(edge => edge.from)
    states.set(
      node.id,
      done.has(node.id) ? 'lit' : prerequisites.every(id => done.has(id)) ? 'available' : 'locked',
    )
  }
  return states
}

export interface SkillTreeScreenProps {
  tree: SkillTreeDef
  completed: readonly SkillNodeId[]
  /** A node lit by the level just finished; it gets a "Just learned" marker. */
  justLit?: SkillNodeId
  onBack?: () => void
}

/**
 * The five branches as lanes of nodes. Lit nodes glow marigold and join the
 * jade path; locked nodes say what they need. Read-only: unlock rules belong to
 * core, this screen only shows them.
 */
export function SkillTreeScreen({ tree, completed, justLit, onBack }: SkillTreeScreenProps) {
  const { t } = useTranslation('ui')
  const titleId = useId()
  const states = skillNodeStates(tree, completed)
  const label = (id: string) => {
    const node = tree.nodes.find(n => n.id === id)
    return node ? t(node.labelKey, { ns: 'world' }) : id
  }
  const litCount = tree.nodes.filter(n => states.get(n.id) === 'lit').length

  return (
    <section className={styles.screen} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {t('skillTree.title')}
        </h2>
        <p className={styles.progress}>
          <span>{t('skillTree.progress', { done: litCount, total: tree.nodes.length })}</span>
          <span className={styles.meter} aria-hidden="true">
            {tree.nodes.map(node => (
              <span key={node.id} className={styles.cell} data-state={states.get(node.id)} />
            ))}
          </span>
        </p>
      </header>

      <div className={styles.branches}>
        {tree.branches.map(branch => {
          const nodes = tree.nodes.filter(node => node.branch === branch.id)
          return (
            <section key={branch.id} className={styles.branch} aria-label={t(branch.labelKey, { ns: 'world' })}>
              <h3 className={styles.branchTitle}>{t(branch.labelKey, { ns: 'world' })}</h3>
              <ol className={styles.nodes}>
                {nodes.map(node => {
                  const state = states.get(node.id) ?? 'locked'
                  const needs = tree.edges
                    .filter(edge => edge.to === node.id && !completed.includes(edge.from))
                    .map(edge => label(edge.from))
                  return (
                    <li
                      key={node.id}
                      className={styles.node}
                      data-state={state}
                      data-just-lit={node.id === justLit || undefined}
                    >
                      <span className={styles.marker} aria-hidden="true">
                        {state === 'lit' && <PixelIcon name="check" scale={2} />}
                        {state === 'locked' && <PixelIcon name="lock" scale={2} />}
                      </span>
                      <span className={styles.nodeText}>
                        <span className={styles.nodeLabel}>{label(node.id)}</span>
                        <span className={styles.nodeState}>
                          {node.id === justLit ? t('skillTree.newlyLit') : t(`skillTree.state.${state}`)}
                        </span>
                        {state === 'locked' && needs.length > 0 && (
                          <span className={styles.nodeNeeds}>
                            {t('skillTree.needs', { skills: needs.join(', ') })}
                          </span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>

      {onBack && (
        <div className={styles.footer}>
          <Button variant="primary" onClick={onBack}>
            {t('skillTree.back')}
          </Button>
        </div>
      )}
    </section>
  )
}
