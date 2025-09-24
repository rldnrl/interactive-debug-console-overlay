import { LogLevel } from '../types/types.js'
import type {
  LogEntry,
  ConsoleInterceptorCallback,
  OriginalConsoleMethods,
} from '../types/types.js'

/**
 * 콘솔 인터셉터 클래스
 *
 * - 원본 console 메서드들을 백업
 * - console 메서드들을 오버라이드하여 로그 캐치
 * - 캐치된 로그를 LogEntry 형태로 변환
 * - 등록된 콜백들에게 로그 전달
 */
export class ConsoleInterceptor {
  private _originalMethods: OriginalConsoleMethods
  private _callbacks: Set<ConsoleInterceptorCallback>
  private _isIntercepting: boolean

  constructor() {
    this._originalMethods = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    }

    this._callbacks = new Set()
    this._isIntercepting = false
  }

  /**
   * 콘솔 인터셉션을 시작합니다.
   * console 메서드들을 오버라이드하여 로그를 캐치합니다.
   */
  public startIntercepting(): void {
    if (this._isIntercepting) {
      return
    }

    this._isIntercepting = true

    console.log = (...args: unknown[]) => {
      this._handleConsoleCall(LogLevel.LOG, args)
      this._originalMethods.log(...args)
    }

    console.info = (...args: unknown[]) => {
      this._handleConsoleCall(LogLevel.INFO, args)
      this._originalMethods.info(...args)
    }

    console.warn = (...args: unknown[]) => {
      this._handleConsoleCall(LogLevel.WARN, args)
      this._originalMethods.warn(...args)
    }

    console.error = (...args: unknown[]) => {
      this._handleConsoleCall(LogLevel.ERROR, args)
      this._originalMethods.error(...args)
    }

    console.debug = (...args: unknown[]) => {
      this._handleConsoleCall(LogLevel.DEBUG, args)
      this._originalMethods.debug(...args)
    }
  }

  /**
   * 콘솔 인터셉션을 중지합니다.
   * 원본 console 메서드들을 복원합니다.
   */
  public stopIntercepting(): void {
    if (!this._isIntercepting) {
      return
    }

    this._isIntercepting = false

    console.log = this._originalMethods.log
    console.info = this._originalMethods.info
    console.warn = this._originalMethods.warn
    console.error = this._originalMethods.error
    console.debug = this._originalMethods.debug
  }

  /**
   * 로그 콜백을 등록합니다.
   *
   * @param callback 로그가 발생할 때 호출될 콜백 함수
   */
  public addCallback(callback: ConsoleInterceptorCallback): void {
    this._callbacks.add(callback)
  }

  /**
   * 로그 콜백을 제거합니다.
   *
   * @param callback 제거할 콜백 함수
   */
  public removeCallback(callback: ConsoleInterceptorCallback): void {
    this._callbacks.delete(callback)
  }

  /**
   * 모든 콜백을 제거합니다.
   */
  public removeAllCallbacks(): void {
    this._callbacks.clear()
  }

  /**
   * 현재 인터셉팅 상태를 반환합니다.
   *
   * @returns 인터셉팅 중이면 true, 아니면 false
   */
  public isIntercepting(): boolean {
    return this._isIntercepting
  }

  /**
   * 수동으로 로그 항목을 생성하고 콜백들에게 전달합니다.
   * 외부에서 직접 로그를 추가할 때 사용됩니다.
   *
   * @param level 로그 레벨
   * @param args 로그 인자들
   */
  public manualLog(level: LogLevel, ...args: unknown[]): void {
    this._handleConsoleCall(level, args)
  }

  /**
   * 원본 console 메서드를 직접 호출합니다.
   * 인터셉션을 우회하여 로그를 출력할 때 사용됩니다.
   *
   * @param level 로그 레벨
   * @param args 로그 인자들
   */
  public callOriginal(level: LogLevel, ...args: unknown[]): void {
    const method = this._originalMethods[level]
    if (method) {
      method(...args)
    }
  }

  /**
   * 등록된 콜백 수를 반환합니다.
   *
   * @returns 콜백 수
   */
  public getCallbackCount(): number {
    return this._callbacks.size
  }

  /**
   * 인터셉터를 완전히 정리합니다.
   * 메모리 누수 방지를 위해 사용합니다.
   */
  public destroy(): void {
    this.stopIntercepting()
    this.removeAllCallbacks()
  }

  /**
   * console 메서드 호출을 처리합니다.
   * LogEntry를 생성하고 등록된 콜백들에게 전달합니다.
   *
   * @param level 로그 레벨
   * @param args 로그 인자들
   */
  private _handleConsoleCall(level: LogLevel, args: unknown[]): void {
    try {
      const stackTrace =
        level === LogLevel.ERROR ? this._captureStackTrace() : undefined
      const entry: LogEntry = {
        id: this._generateLogId(),
        level,
        args: [...args],
        timestamp: new Date(),
        ...(stackTrace && { stack: stackTrace }),
      }

      this._callbacks.forEach((callback) => {
        try {
          callback(entry)
        } catch (error) {
          this._originalMethods.error('콘솔 인터셉터 콜백 실행 중 오류:', error)
        }
      })
    } catch (error) {
      this._originalMethods.error('콘솔 인터셉터 처리 중 오류:', error)
    }
  }

  /**
   * 고유한 로그 ID를 생성합니다.
   *
   * @returns 고유 ID 문자열
   */
  private _generateLogId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2)
    return `log_${timestamp}_${random}`
  }

  /**
   * 현재 스택 트레이스를 캡처합니다.
   * 에러 로그에서 스택 정보를 제공하기 위해 사용됩니다.
   *
   * @returns 스택 트레이스 문자열 또는 undefined
   */
  private _captureStackTrace(): string | undefined {
    try {
      const error = new Error()
      const stack = error.stack

      if (!stack) {
        return undefined
      }

      const lines = stack.split('\n')
      const filteredLines = lines.filter((line, index) => {
        if (index === 0) return false
        if (line.includes('ConsoleInterceptor')) return false
        if (line.includes('_handleConsoleCall')) return false
        if (line.includes('_captureStackTrace')) return false
        return true
      })

      return filteredLines.length > 0 ? filteredLines.join('\n') : undefined
    } catch (error) {
      return undefined
    }
  }
}
