import { createStore } from 'zustand/vanilla'

export type LogType = 'log' | 'warn' | 'error' | 'info'

export interface LogEntry {
  id: number
  type: LogType
  timestamp: string
  message: unknown[]
}

/**
 * 디버그 오버레이의 활성 탭을 정의합니다.
 */

interface DebugState {
  logs: LogEntry[]
  filter: LogType | 'all'
  isExpanded: boolean
  addLog: (type: LogType, message: unknown[]) => void
  clearLogs: () => void
  setFilter: (filter: LogType | 'all') => void
  toggleExpand: () => void
}

/**
 * `zustand`를 사용하여 디버그 상태를 관리하는 커스텀 스토어를 생성합니다.
 * 이 스토어는 로그, 필터, 확장 상태를 관리하고 관련 액션을 제공합니다.
 */
export const createDebugStore = () =>
  createStore<DebugState>((set) => ({
    logs: [],
    filter: 'all',
    isExpanded: true,
    addLog: (type, message) =>
      set((state) => ({
        logs: [
          ...state.logs,
          {
            id: state.logs.length,
            type,
            timestamp: new Date().toLocaleTimeString(),
            message,
          },
        ],
      })),
    clearLogs: () => set({ logs: [] }),
    setFilter: (filter) => set({ filter }),
    toggleExpand: () => set((state) => ({ isExpanded: !state.isExpanded })),
  }))

export type DebugStore = ReturnType<typeof createDebugStore>
