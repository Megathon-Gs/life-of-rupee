// Pilot tally (P2-27). Paste into the DevTools console of ONE pilot device (Android Chrome
// remote debugging, chrome://inspect) while the game origin is open. It reads the device's own
// save and prints counts only: no learner id, no timestamps, no per-student record. Add the
// printed rows to the class tally sheet by hand, then close DevTools. Nothing is sent anywhere.
;(async () => {
  const db = await new Promise((resolve, reject) => {
    const open = indexedDB.open('paisa-street')
    open.onerror = () => reject(open.error)
    open.onsuccess = () => resolve(open.result)
  })
  const rows = await new Promise((resolve, reject) => {
    const all = db.transaction('saves').objectStore('saves').getAll()
    all.onerror = () => reject(all.error)
    all.onsuccess = () => resolve(all.result)
  })
  db.close()

  const levels = {}
  const errors = {}
  const bump = (map, key, field) => {
    map[key] ??= {}
    map[key][field] = (map[key][field] ?? 0) + 1
  }
  for (const { file } of rows) {
    const byLevel = {}
    for (const attempt of file.attempts) (byLevel[attempt.levelId] ??= []).push(attempt)
    for (const [levelId, attempts] of Object.entries(byLevel)) {
      attempts.sort((a, b) => a.endedAt.localeCompare(b.endedAt))
      const first = attempts[0]
      const last = attempts[attempts.length - 1]
      // An attempt record exists only for a finished attempt, so this is completion.
      bump(levels, levelId, 'learners_finished')
      if (attempts.length > 1) bump(levels, levelId, 'learners_replayed')
      if (first.stars === 3) bump(levels, levelId, 'first_attempt_3_stars')
      if (attempts.length > 1 && last.stars > first.stars) bump(levels, levelId, 'replay_improved')
      // Error categories before practice (first attempt) and after it (last attempt, replays only).
      for (const code of new Set(first.errors)) bump(errors, code, 'first_attempt')
      if (attempts.length > 1)
        for (const code of new Set(last.errors)) bump(errors, code, 'last_attempt')
    }
  }
  const out = { devices_profiles: rows.length, levels, errors }
  console.log(JSON.stringify(out, null, 2))
  return out
})()
