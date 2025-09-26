/**
 * 콘솔 로그 레벨을 정의하는 열거형
 */
export enum LogLevel {
  LOG = 'log',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

/**
 * 콘솔 로그 항목의 인터페이스
 */
export interface LogEntry {
  /** 고유 식별자 */
  id: string;
  /** 로그 레벨 */
  level: LogLevel;
  /** 로그 메시지와 인자들 */
  args: unknown[];
  /** 로그가 생성된 시간 */
  timestamp: Date;
  /** 스택 트레이스 (에러인 경우) */
  stack?: string;
}

/**
 * 콘솔 인터셉터의 콜백 함수 타입
 */
export type ConsoleInterceptorCallback = (entry: LogEntry) => void;

/**
 * 오버레이 설정 옵션
 */
export interface OverlayOptions {
  /** 최대 로그 항목 수 (기본값: 1000) */
  maxLogs?: number;
  /** 오버레이 위치 (기본값: 'bottom-right') */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** 초기 너비 (기본값: 400) */
  width?: number;
  /** 초기 높이 (기본값: 300) */
  height?: number;
  /** 투명도 (기본값: 0.95) */
  opacity?: number;
  /** z-index 값 (기본값: 999999) */
  zIndex?: number;
  /** 테마 (기본값: 'dark') */
  theme?: 'light' | 'dark';
  /** 자동 스크롤 활성화 (기본값: true) */
  autoScroll?: boolean;
  /** 필터링할 로그 레벨들 */
  enabledLevels?: LogLevel[];
}

/**
 * JSON 뷰어에서 사용하는 값의 타입
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

/**
 * JSON 객체 타입
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * JSON 배열 타입
 */
export interface JsonArray extends Array<JsonValue> {}

/**
 * 렌더링된 DOM 요소의 참조를 저장하는 인터페이스
 */
export interface OverlayElements {
  /** 메인 오버레이 컨테이너 */
  container: HTMLDivElement;
  /** 헤더 영역 */
  header: HTMLDivElement;
  /** 제목 텍스트 */
  title: HTMLSpanElement;
  /** 컨트롤 버튼들 */
  controls: HTMLDivElement;
  /** 클리어 버튼 */
  clearButton: HTMLButtonElement;
  /** 닫기 버튼 */
  closeButton: HTMLButtonElement;
  /** 로그 필터 영역 */
  filters: HTMLDivElement;
  /** 로그 컨테이너 */
  logContainer: HTMLDivElement;
  /** 리사이즈 핸들 */
  resizeHandle: HTMLDivElement;
}

/**
 * 드래그 상태를 관리하는 인터페이스
 */
export interface DragState {
  /** 드래그 중인지 여부 */
  isDragging: boolean;
  /** 시작 X 좌표 */
  startX: number;
  /** 시작 Y 좌표 */
  startY: number;
  /** 시작 시점의 요소 위치 */
  startLeft: number;
  /** 시작 시점의 요소 위치 */
  startTop: number;
}

/**
 * 리사이즈 상태를 관리하는 인터페이스
 */
export interface ResizeState {
  /** 리사이즈 중인지 여부 */
  isResizing: boolean;
  /** 시작 X 좌표 */
  startX: number;
  /** 시작 Y 좌표 */
  startY: number;
  /** 시작 시점의 요소 크기 */
  startWidth: number;
  /** 시작 시점의 요소 크기 */
  startHeight: number;
}

/**
 * 오버레이 상태를 관리하는 인터페이스
 */
export interface OverlayState {
  /** 오버레이가 표시되고 있는지 여부 */
  isVisible: boolean;
  /** 현재 필터링된 로그 레벨들 */
  activeFilters: Set<LogLevel>;
  /** 드래그 상태 */
  dragState: DragState;
  /** 리사이즈 상태 */
  resizeState: ResizeState;
}

/**
 * 콘솔 메서드의 원본 참조를 저장하는 인터페이스
 */
export interface OriginalConsoleMethods {
  log: typeof console.log;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
  debug: typeof console.debug;
}

/**
 * 라이브러리의 Public API 인터페이스
 */
export interface DebugOverlayAPI {
  /** 라이브러리 초기화 */
  init(options?: OverlayOptions): void;
  /** 라이브러리 정리 및 제거 */
  destroy(): void;
  /** 오버레이 표시 */
  open(): void;
  /** 오버레이 숨김 */
  close(): void;
  /** 오버레이 표시/숨김 토글 */
  toggle(): void;
  /** 현재 표시 상태 반환 */
  isVisible(): boolean;
  /** 로그 수동 추가 */
  addLog(level: LogLevel, ...args: unknown[]): void;
  /** 모든 로그 삭제 */
  clearLogs(): void;
}
