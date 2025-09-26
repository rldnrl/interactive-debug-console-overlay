import { LogLevel } from '../types/types.js'
import type {
  DebugOverlayAPI,
  OverlayOptions,
  LogEntry,
} from '../types/types.js'
import { ConsoleInterceptor } from '../interceptors/console-interceptor.js'
import { LogStore } from '../storage/log-store.js'
import { OverlayRenderer } from '../ui/overlay-renderer.js'
import { ErrorCapturer } from '../interceptors/error-capturer.js'
import { injectStyles, removeStyles } from '../ui/styles.js'

/**
 * 디버그 오버레이 매니저 클래스
 *
 * 단일 책임: 위 세 클래스의 인스턴스를 생성하고, 이들 간의 데이터 흐름과 상호작용을 조율하는 '지휘자'의 책임만 가집니다.
 * 외부로 노출되는 Public API를 제공합니다.
 *
 * - ConsoleInterceptor, LogStore, OverlayRenderer 간의 협업 조율
 * - 라이브러리 생명주기 관리 (초기화, 정리)
 * - Public API 구현
 * - 설정 관리
 */
export class DebugOverlayManager implements DebugOverlayAPI {
  private _consoleInterceptor: ConsoleInterceptor | null
  private _logStore: LogStore | null
  private _overlayRenderer: OverlayRenderer | null
  private _errorCapturer: ErrorCapturer | null
  private _isInitialized: boolean
  private _options: OverlayOptions

  /**
   * DebugOverlayManager 인스턴스를 생성합니다.
   */
  constructor() {
    this._consoleInterceptor = null
    this._logStore = null
    this._overlayRenderer = null
    this._errorCapturer = null
    this._isInitialized = false
    this._options = {}
  }

  /**
   * 라이브러리의 모든 리소스를 준비하고 콘솔 감시를 시작합니다.
   * UI 패널은 DOM에 생성되지만 기본적으로 숨겨진 상태입니다.
   *
   * @param options 오버레이 설정 옵션
   */
  public init(options: OverlayOptions = {}): void {
    if (this._isInitialized) {
      console.warn('DebugOverlayManager가 이미 초기화되었습니다.')
      return
    }

    try {
      this._options = { ...options }

      injectStyles(this._options.theme)

      this._logStore = new LogStore(this._options.maxLogs)
      this._consoleInterceptor = new ConsoleInterceptor()
      this._errorCapturer = new ErrorCapturer()
      this._overlayRenderer = new OverlayRenderer(this._options)

      this._setupConnections()

      this._consoleInterceptor.startIntercepting()
      this._errorCapturer.start()
      this._overlayRenderer.createOverlay()

      this._isInitialized = true

      console.log('🐛 Interactive Debug Console Overlay가 초기화되었습니다.')
    } catch (error) {
      console.error('DebugOverlayManager 초기화 중 오류:', error)
      this._cleanup()
      throw error
    }
  }

  /**
   * 라이브러리가 사용한 모든 리소스를 정리하고 DOM에서 완전히 제거합니다.
   */
  public destroy(): void {
    if (!this._isInitialized) {
      return
    }

    try {
      this._cleanup()
      console.log('🐛 Interactive Debug Console Overlay가 정리되었습니다.')
    } catch (error) {
      console.error('DebugOverlayManager 정리 중 오류:', error)
    }
  }

  /**
   * 디버그 오버레이 UI 패널을 화면에 표시합니다.
   */
  public open(): void {
    this._ensureInitialized()

    if (this._overlayRenderer) {
      this._overlayRenderer.show()
    }
  }

  /**
   * 디버그 오버레이 UI 패널을 화면에서 숨깁니다.
   */
  public close(): void {
    this._ensureInitialized()

    if (this._overlayRenderer) {
      this._overlayRenderer.hide()
    }
  }

  /**
   * UI 패널의 표시/숨김 상태를 전환합니다.
   */
  public toggle(): void {
    this._ensureInitialized()

    if (this._overlayRenderer) {
      this._overlayRenderer.toggle()
    }
  }

  /**
   * 현재 표시 상태를 반환합니다.
   *
   * @returns 표시 중이면 true, 숨겨져 있으면 false
   */
  public isVisible(): boolean {
    if (!this._isInitialized || !this._overlayRenderer) {
      return false
    }

    return this._overlayRenderer.isVisible()
  }

  /**
   * 로그를 수동으로 추가합니다.
   *
   * @param level 로그 레벨
   * @param args 로그 인자들
   */
  public addLog(level: LogLevel, ...args: unknown[]): void {
    this._ensureInitialized()

    if (this._consoleInterceptor) {
      this._consoleInterceptor.manualLog(level, ...args)
    }
  }

  /**
   * 모든 로그를 삭제합니다.
   */
  public clearLogs(): void {
    this._ensureInitialized()

    if (this._logStore) {
      this._logStore.clearLogs()
    }
  }

  /**
   * 현재 설정 옵션을 반환합니다.
   *
   * @returns 현재 설정 옵션의 복사본
   */
  public getOptions(): OverlayOptions {
    return { ...this._options }
  }

  /**
   * 설정 옵션을 업데이트합니다.
   * 일부 설정은 재초기화가 필요할 수 있습니다.
   *
   * @param options 업데이트할 설정 옵션
   */
  public updateOptions(options: Partial<OverlayOptions>): void {
    this._ensureInitialized()

    const oldOptions = { ...this._options }
    this._options = { ...this._options, ...options }

    if (oldOptions.theme !== this._options.theme) {
      injectStyles(this._options.theme)
    }

    if (oldOptions.maxLogs !== this._options.maxLogs && this._logStore) {
      this._logStore.setMaxLogs(this._options.maxLogs || 1000)
    }
  }

  /**
   * 현재 로그 통계를 반환합니다.
   *
   * @returns 레벨별 로그 수 통계
   */
  public getStatistics(): Record<LogLevel, number> & { total: number } {
    this._ensureInitialized()

    if (this._logStore) {
      return this._logStore.getStatistics()
    }

    return {
      [LogLevel.LOG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.DEBUG]: 0,
      total: 0,
    }
  }

  /**
   * 로그를 검색합니다.
   *
   * @param searchText 검색할 텍스트
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 결과 로그 항목들
   */
  public searchLogs(
    searchText: string,
    caseSensitive: boolean = false
  ): LogEntry[] {
    this._ensureInitialized()

    if (this._logStore) {
      return this._logStore.searchLogs(searchText, caseSensitive)
    }

    return []
  }

  /**
   * 특정 시간 범위의 로그를 반환합니다.
   *
   * @param startTime 시작 시간
   * @param endTime 종료 시간
   * @returns 시간 범위 내의 로그 항목들
   */
  public getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    this._ensureInitialized()

    if (this._logStore) {
      return this._logStore.getLogsByTimeRange(startTime, endTime)
    }

    return []
  }

  /**
   * 로그를 JSON 형태로 내보냅니다.
   *
   * @returns JSON 문자열
   */
  public exportLogs(): string {
    this._ensureInitialized()

    if (this._logStore) {
      const logs = this._logStore.getAllLogs()
      return JSON.stringify(logs, null, 2)
    }

    return '[]'
  }

  /**
   * 컴포넌트들 간의 연결을 설정합니다.
   */
  private _setupConnections(): void {
    if (
      !this._consoleInterceptor ||
      !this._logStore ||
      !this._overlayRenderer ||
      !this._errorCapturer
    ) {
      throw new Error('모든 컴포넌트가 초기화되지 않았습니다.')
    }

    this._consoleInterceptor.addCallback((entry: LogEntry) => {
      this._logStore!.addLog(entry)
    })
    this._errorCapturer.addCallback((entry: LogEntry) => {
      this._logStore!.addLog(entry)
    })
    this._logStore.subscribe((logs: LogEntry[]) => {
      this._overlayRenderer!.renderLogs(logs)
    })
    this._overlayRenderer.onClear(() => {
      this.clearLogs()
    })

    this._overlayRenderer.onClose(() => {
      this.close()
    })

    this._overlayRenderer.onFilterChange((levels: LogLevel[]) => {
      if (this._logStore) {
        const filteredLogs = this._logStore.getLogsByLevels(levels)
        this._overlayRenderer!.renderLogs(filteredLogs)
      }
    })
  }

  /**
   * 모든 리소스를 정리합니다.
   */
  private _cleanup(): void {
    if (this._consoleInterceptor) {
      this._consoleInterceptor.destroy()
      this._consoleInterceptor = null
    }

    if (this._errorCapturer) {
      this._errorCapturer.destroy()
      this._errorCapturer = null
    }

    if (this._logStore) {
      this._logStore.destroy()
      this._logStore = null
    }

    if (this._overlayRenderer) {
      this._overlayRenderer.destroy()
      this._overlayRenderer = null
    }

    removeStyles()

    this._isInitialized = false
  }

  /**
   * 초기화 상태를 확인합니다.
   */
  private _ensureInitialized(): void {
    if (!this._isInitialized) {
      throw new Error(
        'DebugOverlayManager가 초기화되지 않았습니다. init()을 먼저 호출하세요.'
      )
    }
  }
}

/**
 * 전역 인스턴스 생성 및 내보내기
 * 싱글톤 패턴으로 하나의 인스턴스만 사용합니다.
 */
export const debugOverlay = new DebugOverlayManager()
