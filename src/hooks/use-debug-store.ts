import { createStore } from 'zustand/vanilla'

export type LogType = 'log' | 'warn' | 'error' | 'info'

export interface LogEntry {
  id: number
  type: LogType
  timestamp: string
  message: unknown[]
}

interface DebugState {
  /**
   * 수집된 모든 로그 항목의 배열입니다.
   */
  logs: LogEntry[]
  /**
   * 현재 적용된 로그 필터입니다. ('all' 또는 특정 로그 타입)
   */
  filter: LogType | 'all'
  /**
   * 디버그 오버레이의 확장/축소 상태입니다.
   */
  isExpanded: boolean
  /**
   * 새로운 로그 항목을 스토어에 추가합니다.
   */
  addLog: (type: LogType, message: unknown[]) => void
  /**
   * 모든 로그 항목을 스토어에서 제거합니다.
   */
  clearLogs: () => void
  /**
   * 로그 필터를 설정합니다.
   */
  setFilter: (filter: LogType | 'all') => void
  /**
   * 오버레이의 확장/축소 상태를 토글합니다.
   */
  toggleExpand: () => void
}

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
