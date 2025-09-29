/**
 * Interactive Debug Console Overlay
 *
 * 프레임워크에 구애받지 않는(framework-agnostic), 제로 디펜던시(zero-dependency) 디버깅 도구
 * 웹뷰(WebView)와 같이 디버깅이 어려운 환경에서 개발자가 화면 위에서 직접 console 로그를 확인할 수 있도록 돕습니다.
 *
 * @author Your Name
 * @version 1.0.0
 * @license MIT
 */

export type {
  LogEntry,
  ConsoleInterceptorCallback,
  OverlayOptions,
  JsonValue,
  JsonObject,
  JsonArray,
  OverlayElements,
  DragState,
  ResizeState,
  OverlayState,
  OriginalConsoleMethods,
  DebugOverlayAPI,
} from './types/types.js'

export { LogLevel } from './types/types.js'

export { DebugOverlayManager } from './core/debug-overlay-manager.js'
export { ConsoleInterceptor } from './interceptors/console-interceptor.js'
export { LogStore } from './storage/log-store.js'
export { OverlayRenderer } from './ui/overlay-renderer.js'
export { ErrorCapturer } from './interceptors/error-capturer.js'
export { JsonViewer } from './components/json-viewer.js'

export { generateStyles, injectStyles, removeStyles } from './ui/styles.js'

export { debugOverlay } from './core/debug-overlay-manager.js'

import {
  DebugOverlayManager,
  debugOverlay,
} from './core/debug-overlay-manager.js'
import { ConsoleInterceptor } from './interceptors/console-interceptor.js'
import { LogStore } from './storage/log-store.js'
import { OverlayRenderer } from './ui/overlay-renderer.js'
import { ErrorCapturer } from './interceptors/error-capturer.js'
import { JsonViewer } from './components/json-viewer.js'
import { LogLevel } from './types/types.js'
import type { OverlayOptions } from './types/types.js'

/**
 * 기본 내보내기: 전역 디버그 오버레이 인스턴스
 *
 * 사용 예시:
 * ```typescript
 * import debugOverlay from 'interactive-debug-console-overlay';
 *
 * // 초기화
 * debugOverlay.init({
 *   theme: 'dark',
 *   position: 'bottom-right',
 *   width: 500,
 *   height: 400
 * });
 *
 * // 오버레이 표시
 * debugOverlay.open();
 *
 * // 수동 로그 추가
 * debugOverlay.addLog('info', 'Hello, Debug!');
 *
 * // 정리
 * debugOverlay.destroy();
 * ```
 */
export { debugOverlay as default } from './core/debug-overlay-manager.js'

/**
 * 브라우저 환경에서 전역 객체에 라이브러리 등록
 * UMD 빌드에서 사용됩니다.
 */
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.InteractiveDebugConsoleOverlay = {
    debugOverlay,
    DebugOverlayManager,
    ConsoleInterceptor,
    LogStore,
    OverlayRenderer,
    ErrorCapturer,
    JsonViewer,
    LogLevel,
  }
}

/**
 * 라이브러리 정보
 */
export const VERSION = '1.0.0'
export const LIBRARY_NAME = 'Interactive Debug Console Overlay'

/**
 * 빠른 시작을 위한 헬퍼 함수들
 */

/**
 * 기본 설정으로 디버그 오버레이를 빠르게 시작합니다.
 *
 * @param autoOpen 초기화 후 자동으로 오버레이를 열지 여부 (기본값: false)
 * @returns 디버그 오버레이 인스턴스
 */
export function quickStart(autoOpen: boolean = false): typeof debugOverlay {
  debugOverlay.init({
    theme: 'dark',
    position: 'bottom-right',
    width: 400,
    height: 300,
    autoScroll: true,
  })

  if (autoOpen) {
    debugOverlay.open()
  }

  return debugOverlay
}

/**
 * 개발 모드에서만 디버그 오버레이를 활성화합니다.
 *
 * @param isDevelopment 개발 모드 여부
 * @param options 오버레이 설정 옵션
 * @returns 디버그 오버레이 인스턴스 또는 null
 */
export function initForDevelopment(
  isDevelopment: boolean = false,
  options: OverlayOptions = {}
): typeof debugOverlay | null {
  if (!isDevelopment) {
    return null
  }

  debugOverlay.init({
    theme: 'dark',
    position: 'bottom-right',
    width: 450,
    height: 350,
    autoScroll: true,
    ...options,
  })

  return debugOverlay
}

/**
 * 모바일 환경에 최적화된 설정으로 초기화합니다.
 *
 * @param options 추가 설정 옵션
 * @returns 디버그 오버레이 인스턴스
 */
export function initForMobile(
  options: OverlayOptions = {}
): typeof debugOverlay {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

  debugOverlay.init({
    theme: 'dark',
    position: 'bottom-right',
    width: isMobile ? Math.min(350, window.innerWidth - 40) : 400,
    height: isMobile ? Math.min(250, window.innerHeight - 100) : 300,
    opacity: 0.9,
    autoScroll: true,
    ...options,
  })

  return debugOverlay
}

/**
 * 키보드 단축키로 오버레이를 토글할 수 있도록 설정합니다.
 *
 * @param key 단축키 (기본값: 'F12')
 * @param ctrlKey Ctrl 키 조합 여부 (기본값: false)
 * @param altKey Alt 키 조합 여부 (기본값: false)
 * @param shiftKey Shift 키 조합 여부 (기본값: false)
 * @returns 정리 함수
 */
export function enableKeyboardShortcut(
  key: string = 'F12',
  ctrlKey: boolean = false,
  altKey: boolean = false,
  shiftKey: boolean = false
): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      event.key === key &&
      event.ctrlKey === ctrlKey &&
      event.altKey === altKey &&
      event.shiftKey === shiftKey
    ) {
      event.preventDefault()
      debugOverlay.toggle()
    }
  }

  document.addEventListener('keydown', handleKeyDown)

  return () => {
    document.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * 에러 발생 시 자동으로 오버레이를 표시하도록 설정합니다.
 */
export function enableAutoShowOnError(): void {
  const originalErrorHandler = window.onerror
  const originalUnhandledRejectionHandler = window.onunhandledrejection

  window.onerror = (message, source, lineno, colno, error) => {
    debugOverlay.open()

    if (originalErrorHandler) {
      return originalErrorHandler.call(
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
    debugOverlay.open()

    if (originalUnhandledRejectionHandler) {
      return originalUnhandledRejectionHandler.call(window, event)
    }
  }
}
