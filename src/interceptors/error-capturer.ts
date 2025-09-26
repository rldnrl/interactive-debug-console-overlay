import { LogLevel } from '../types/types.js'
import type { LogEntry } from '../types/types.js'

/**
 * 에러 캡처 클래스
 *
 * - 전역 JavaScript 에러 캐치
 * - Promise rejection 에러 캐치
 * - 리소스 로드 에러 캐치
 * - 네트워크 에러 캐치 (선택적)
 */
export class ErrorCapturer {
  private _callbacks: Set<(entry: LogEntry) => void>
  private _originalErrorHandler: OnErrorEventHandler | null
  private _originalRejectionHandler:
    | ((event: PromiseRejectionEvent) => void)
    | null
  private _isActive: boolean

  /**
   * ErrorCapturer 인스턴스를 생성합니다.
   */
  constructor() {
    this._callbacks = new Set()
    this._originalErrorHandler = null
    this._originalRejectionHandler = null
    this._isActive = false
  }

  /**
   * 에러 캡처를 시작합니다.
   */
  public start(): void {
    if (this._isActive) {
      return
    }

    this._isActive = true

    this._originalErrorHandler = window.onerror
    this._originalRejectionHandler = window.onunhandledrejection

    window.onerror = (message, source, lineno, colno, error) => {
      this._handleGlobalError(message, source, lineno, colno, error)

      if (this._originalErrorHandler) {
        return this._originalErrorHandler.call(
          window,
          message,
          source,
          lineno,
          colno,
          error
        )
      }
      return false
    }

    window.onunhandledrejection = (event) => {
      this._handlePromiseRejection(event)

      if (this._originalRejectionHandler) {
        this._originalRejectionHandler.call(window, event)
      }
    }

    this._setupResourceErrorHandling()
  }

  /**
   * 에러 캡처를 중지합니다.
   */
  public stop(): void {
    if (!this._isActive) {
      return
    }

    this._isActive = false

    window.onerror = this._originalErrorHandler
    window.onunhandledrejection = this._originalRejectionHandler

    this._originalErrorHandler = null
    this._originalRejectionHandler = null
  }

  /**
   * 에러 콜백을 등록합니다.
   */
  public addCallback(callback: (entry: LogEntry) => void): void {
    this._callbacks.add(callback)
  }

  /**
   * 에러 콜백을 제거합니다.
   */
  public removeCallback(callback: (entry: LogEntry) => void): void {
    this._callbacks.delete(callback)
  }

  /**
   * 모든 콜백을 제거합니다.
   */
  public removeAllCallbacks(): void {
    this._callbacks.clear()
  }

  /**
   * 현재 활성 상태를 반환합니다.
   */
  public isActive(): boolean {
    return this._isActive
  }

  /**
   * 에러 캡처러를 정리합니다.
   */
  public destroy(): void {
    this.stop()
    this.removeAllCallbacks()
  }

  /**
   * 전역 JavaScript 에러를 처리합니다.
   */
  private _handleGlobalError(
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ): void {
    const errorMessage = typeof message === 'string' ? message : 'Unknown error'
    const errorSource = source || 'Unknown source'

    const entry: LogEntry = {
      id: this._generateId(),
      level: LogLevel.ERROR,
      args: [
        '🚨 [Global Error]',
        errorMessage,
        {
          source: errorSource,
          line: lineno || 0,
          column: colno || 0,
          timestamp: new Date().toISOString(),
        },
      ],
      timestamp: new Date(),
      ...(error?.stack && { stack: error.stack }),
    }

    this._notifyCallbacks(entry)
  }

  /**
   * Promise rejection을 처리합니다.
   */
  private _handlePromiseRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason
    let reasonText = 'Unknown rejection'
    let stack: string | undefined

    if (reason instanceof Error) {
      reasonText = reason.message
      stack = reason.stack
    } else if (typeof reason === 'string') {
      reasonText = reason
    } else {
      reasonText = JSON.stringify(reason)
    }

    const entry: LogEntry = {
      id: this._generateId(),
      level: LogLevel.ERROR,
      args: [
        '🚫 [Promise Rejection]',
        reasonText,
        {
          reason: reason,
          timestamp: new Date().toISOString(),
        },
      ],
      timestamp: new Date(),
      ...(stack && { stack }),
    }

    this._notifyCallbacks(entry)
  }

  /**
   * 리소스 로드 에러 핸들링을 설정합니다.
   */
  private _setupResourceErrorHandling(): void {
    window.addEventListener(
      'error',
      (event) => {
        if (event.target && event.target !== window) {
          const target = event.target as HTMLElement
          const tagName = target.tagName?.toLowerCase()
          const src =
            (target as any).src || (target as any).href || 'Unknown resource'

          const entry: LogEntry = {
            id: this._generateId(),
            level: LogLevel.ERROR,
            args: [
              '📁 [Resource Error]',
              `Failed to load ${tagName}: ${src}`,
              {
                tagName: tagName,
                src: src,
                timestamp: new Date().toISOString(),
              },
            ],
            timestamp: new Date(),
          }

          this._notifyCallbacks(entry)
        }
      },
      true
    )
  }

  /**
   * 고유 ID를 생성합니다.
   */
  private _generateId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2)
    return `error_${timestamp}_${random}`
  }

  /**
   * 모든 콜백에게 로그 엔트리를 전달합니다.
   */
  private _notifyCallbacks(entry: LogEntry): void {
    this._callbacks.forEach((callback) => {
      try {
        callback(entry)
      } catch (error) {
        console.error('에러 캡처 콜백 실행 중 오류:', error)
      }
    })
  }
}
