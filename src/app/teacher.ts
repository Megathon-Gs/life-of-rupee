import type {
  AttemptRecord,
  Derived,
  LevelDef,
  SkillTreeDef,
  TeacherSummary,
} from '@/core/contracts'
import type { TeacherError } from '@/ui/screens/TeacherSummary'

/** Local "Show my teacher" totals: summed best stars per branch and levels passed. */
export function buildTeacherSummary(
  derived: Derived,
  levels: readonly LevelDef[],
  tree: SkillTreeDef,
): TeacherSummary {
  const branchOf = new Map(tree.nodes.map((node) => [node.id as string, node.branch]))
  const stars = new Map(tree.branches.map((branch) => [branch.id, 0]))
  let levelsCompleted = 0
  for (const level of levels) {
    const starsEarned = derived.bestStars[level.id as string] ?? 0
    if (starsEarned < 1) continue
    levelsCompleted += 1
    for (const node of level.skillNodes) {
      const branch = branchOf.get(node as string)
      if (branch !== undefined) stars.set(branch, (stars.get(branch) ?? 0) + starsEarned)
    }
  }
  return {
    starsByBranch: tree.branches.map((branch) => ({
      labelKey: branch.labelKey,
      stars: stars.get(branch.id) ?? 0,
    })),
    levelsCompleted,
  }
}

/** Most frequent error categories across the attempt log, plain codes only. */
export function topErrors(attempts: readonly AttemptRecord[], limit = 5): TeacherError[] {
  const counts = new Map<string, number>()
  for (const attempt of attempts) {
    for (const code of attempt.errors) counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([code, count]) => ({ code, count }))
}