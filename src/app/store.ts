import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Derived, SaveFile } from '@/core/contracts'
import { derive, reducer, type Action, type DeriveContent } from '@/core/state'

/** Zustand state: the save file plus the only way to change it. */
export interface GameState {
  save: SaveFile
  dispatch: (action: Action) => void
}

export type GameStore = StoreApi<GameState> & {
  /** `derive(save)`, recomputed only when the attempt log changes. */
  derived: () => Derived
}

/** Memoizes `derive` on the attempts array, the only part of the save it reads. */
export function memoDerive(content: DeriveContent): (save: SaveFile) => Derived {
  let attempts: SaveFile['attempts'] | undefined
  let cached: Derived | undefined
  return (save) => {
    if (!cached || save.attempts !== attempts) {
      attempts = save.attempts
      cached = derive(save, content)
    }
    return cached
  }
}

/** Store wrapping the P0-07 reducer; `persist` receives every changed save. */
export function createGameStore(
  initial: SaveFile,
  content: DeriveContent,
  persist?: (save: SaveFile) => void,
): GameStore {
  const store = createStore<GameState>()((set, get) => ({
    save: initial,
    dispatch: (action) => {
      const save = reducer(get().save, action)
      if (save === get().save) return
      set({ save })
      persist?.(save)
    },
  }))
  const derived = memoDerive(content)
  return Object.assign(store, { derived: () => derived(store.getState().save) })
}

export const GameStoreContext = createContext<GameStore | null>(null)

/** The store provided by the playing profile. */
export function useGameStore(): GameStore {
  const store = useContext(GameStoreContext)
  if (!store) throw new Error('useGameStore needs a GameStoreContext provider')
  return store
}

/** Selects from the game state and re-renders when the selection changes. */
export function useGame<T>(selector: (state: GameState) => T): T {
  return useStore(useGameStore(), selector)
}

/** Derived stars, skills, flags and wallet for the current save. */
export function useDerived(): Derived {
  const store = useGameStore()
  return useStore(store, () => store.derived())
}
