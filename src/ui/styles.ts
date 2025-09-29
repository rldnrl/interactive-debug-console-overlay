/**
 * 디버그 오버레이의 CSS 스타일을 정의합니다.
 * 모든 스타일은 문자열로 관리되며, 라이브러리 초기화 시 동적으로 주입됩니다.
 */

/**
 * 다크 테마 색상 팔레트
 */
const DARK_THEME = {
  background: '#1e1e1e',
  surface: '#2d2d2d',
  border: '#404040',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textMuted: '#999999',
  accent: '#007acc',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  debug: '#9c27b0',
  scrollbar: '#555555',
  scrollbarHover: '#777777',
};

/**
 * 라이트 테마 색상 팔레트
 */
const LIGHT_THEME = {
  background: '#ffffff',
  surface: '#f5f5f5',
  border: '#e0e0e0',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  accent: '#1976d2',
  success: '#388e3c',
  warning: '#f57c00',
  error: '#d32f2f',
  info: '#1976d2',
  debug: '#7b1fa2',
  scrollbar: '#cccccc',
  scrollbarHover: '#999999',
};

/**
 * 기본 CSS 리셋 및 공통 스타일
 */
const BASE_STYLES = `
  .debug-overlay * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
`;

/**
 * 메인 오버레이 컨테이너 스타일
 */
const CONTAINER_STYLES = (theme: typeof DARK_THEME) => `
  .debug-overlay {
    position: fixed;
    background: ${theme.background};
    border: 1px solid ${theme.border};
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: ${theme.text};
    z-index: 999999;
    min-width: 300px;
    min-height: 200px;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .debug-overlay.hidden {
    display: none !important;
  }

  .debug-overlay.dragging {
    user-select: none;
    cursor: move;
  }

  .debug-overlay.resizing {
    user-select: none;
  }
`;

/**
 * 헤더 영역 스타일
 */
const HEADER_STYLES = (theme: typeof DARK_THEME) => `
  .debug-overlay-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: ${theme.surface};
    border-bottom: 1px solid ${theme.border};
    border-radius: 8px 8px 0 0;
    cursor: move;
    user-select: none;
  }

  .debug-overlay-title {
    font-weight: bold;
    font-size: 13px;
    color: ${theme.text};
  }

  .debug-overlay-controls {
    display: flex;
    gap: 4px;
  }

  .debug-overlay-button {
    background: transparent;
    border: 1px solid ${theme.border};
    color: ${theme.textSecondary};
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s ease;
  }

  .debug-overlay-button:hover {
    background: ${theme.border};
    color: ${theme.text};
  }

  .debug-overlay-button:active {
    transform: scale(0.95);
  }

  .debug-overlay-button.clear {
    border-color: ${theme.warning};
    color: ${theme.warning};
  }

  .debug-overlay-button.clear:hover {
    background: ${theme.warning};
    color: ${theme.background};
  }

  .debug-overlay-button.close {
    border-color: ${theme.error};
    color: ${theme.error};
  }

  .debug-overlay-button.close:hover {
    background: ${theme.error};
    color: ${theme.background};
  }
`;

/**
 * 필터 영역 스타일
 */
const FILTER_STYLES = (theme: typeof DARK_THEME) => `
  .debug-overlay-filters {
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    background: ${theme.surface};
    border-bottom: 1px solid ${theme.border};
    flex-wrap: wrap;
  }

  .debug-overlay-filter {
    background: transparent;
    border: 1px solid ${theme.border};
    color: ${theme.textSecondary};
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 10px;
    text-transform: uppercase;
    font-weight: bold;
    transition: all 0.2s ease;
    user-select: none;
  }

  .debug-overlay-filter:hover {
    border-color: ${theme.accent};
  }

  .debug-overlay-filter.active {
    background: ${theme.accent};
    border-color: ${theme.accent};
    color: ${theme.background};
  }

  .debug-overlay-filter.log.active {
    background: ${theme.textSecondary};
    border-color: ${theme.textSecondary};
  }

  .debug-overlay-filter.info.active {
    background: ${theme.info};
    border-color: ${theme.info};
  }

  .debug-overlay-filter.warn.active {
    background: ${theme.warning};
    border-color: ${theme.warning};
  }

  .debug-overlay-filter.error.active {
    background: ${theme.error};
    border-color: ${theme.error};
  }

  .debug-overlay-filter.debug.active {
    background: ${theme.debug};
    border-color: ${theme.debug};
  }
`;

/**
 * 로그 컨테이너 스타일
 */
const LOG_CONTAINER_STYLES = (theme: typeof DARK_THEME) => `
  .debug-overlay-logs {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
    background: ${theme.background};
  }

  .debug-overlay-logs::-webkit-scrollbar {
    width: 8px;
  }

  .debug-overlay-logs::-webkit-scrollbar-track {
    background: ${theme.surface};
  }

  .debug-overlay-logs::-webkit-scrollbar-thumb {
    background: ${theme.scrollbar};
    border-radius: 4px;
  }

  .debug-overlay-logs::-webkit-scrollbar-thumb:hover {
    background: ${theme.scrollbarHover};
  }

  .debug-overlay-log-entry {
    padding: 6px 12px;
    border-bottom: 1px solid ${theme.border};
    word-wrap: break-word;
    font-family: inherit;
  }

  .debug-overlay-log-entry:last-child {
    border-bottom: none;
  }

  .debug-overlay-log-entry.log {
    border-left: 3px solid ${theme.textSecondary};
  }

  .debug-overlay-log-entry.info {
    border-left: 3px solid ${theme.info};
  }

  .debug-overlay-log-entry.warn {
    border-left: 3px solid ${theme.warning};
    background: rgba(255, 152, 0, 0.05);
  }

  .debug-overlay-log-entry.error {
    border-left: 3px solid ${theme.error};
    background: rgba(244, 67, 54, 0.05);
  }

  .debug-overlay-log-entry.debug {
    border-left: 3px solid ${theme.debug};
  }

  .debug-overlay-log-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    font-size: 10px;
    color: ${theme.textMuted};
  }

  .debug-overlay-log-level {
    text-transform: uppercase;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 9px;
  }

  .debug-overlay-log-level.log {
    background: ${theme.textSecondary};
    color: ${theme.background};
  }

  .debug-overlay-log-level.info {
    background: ${theme.info};
    color: ${theme.background};
  }

  .debug-overlay-log-level.warn {
    background: ${theme.warning};
    color: ${theme.background};
  }

  .debug-overlay-log-level.error {
    background: ${theme.error};
    color: ${theme.background};
  }

  .debug-overlay-log-level.debug {
    background: ${theme.debug};
    color: ${theme.background};
  }

  .debug-overlay-log-timestamp {
    color: ${theme.textMuted};
  }

  .debug-overlay-log-content {
    color: ${theme.text};
    white-space: pre-wrap;
  }

  .debug-overlay-log-args {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .debug-overlay-log-arg {
    padding: 4px 8px;
    background: ${theme.surface};
    border-radius: 4px;
    border-left: 2px solid ${theme.border};
  }
`;

/**
 * JSON 뷰어 스타일
 */
const JSON_VIEWER_STYLES = (theme: typeof DARK_THEME) => `
  .debug-overlay-json {
    font-family: inherit;
    font-size: 11px;
  }

  .debug-overlay-json-key {
    color: ${theme.accent};
    font-weight: bold;
  }

  .debug-overlay-json-string {
    color: ${theme.success};
  }

  .debug-overlay-json-number {
    color: ${theme.info};
  }

  .debug-overlay-json-boolean {
    color: ${theme.warning};
    font-weight: bold;
  }

  .debug-overlay-json-null {
    color: ${theme.textMuted};
    font-style: italic;
  }

  .debug-overlay-json-undefined {
    color: ${theme.textMuted};
    font-style: italic;
  }

  .debug-overlay-json-object,
  .debug-overlay-json-array {
    margin-left: 16px;
  }

  .debug-overlay-json-toggle {
    cursor: pointer;
    user-select: none;
    color: ${theme.textSecondary};
    margin-right: 4px;
  }

  .debug-overlay-json-toggle:hover {
    color: ${theme.accent};
  }

  .debug-overlay-json-collapsed {
    color: ${theme.textMuted};
    font-style: italic;
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s ease;
  }

  .debug-overlay-json-collapsed:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${theme.accent};
    transform: scale(1.05);
  }
`;

/**
 * 리사이즈 핸들 스타일
 */
const RESIZE_HANDLE_STYLES = (theme: typeof DARK_THEME) => `
  .debug-overlay-resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    cursor: se-resize;
    background: linear-gradient(-45deg, transparent 0%, transparent 30%, ${theme.border} 30%, ${theme.border} 40%, transparent 40%, transparent 60%, ${theme.border} 60%, ${theme.border} 70%, transparent 70%);
  }

  .debug-overlay-resize-handle:hover {
    background: linear-gradient(-45deg, transparent 0%, transparent 30%, ${theme.accent} 30%, ${theme.accent} 40%, transparent 40%, transparent 60%, ${theme.accent} 60%, ${theme.accent} 70%, transparent 70%);
  }
`;

/**
 * 애니메이션 스타일
 */
const ANIMATION_STYLES = `
  @keyframes debug-overlay-fade-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .debug-overlay {
    animation: debug-overlay-fade-in 0.2s ease-out;
  }
`;

/**
 * 테마별 완전한 CSS 스타일 생성
 */
export function generateStyles(theme: 'light' | 'dark' = 'dark'): string {
  const colors = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  
  return [
    BASE_STYLES,
    CONTAINER_STYLES(colors),
    HEADER_STYLES(colors),
    FILTER_STYLES(colors),
    LOG_CONTAINER_STYLES(colors),
    JSON_VIEWER_STYLES(colors),
    RESIZE_HANDLE_STYLES(colors),
    ANIMATION_STYLES,
  ].join('\n');
}

/**
 * 스타일 시트를 DOM에 주입하는 함수
 */
export function injectStyles(theme: 'light' | 'dark' = 'dark'): HTMLStyleElement {
  const existingStyle = document.getElementById('debug-overlay-styles') as HTMLStyleElement;
  
  if (existingStyle) {
    existingStyle.textContent = generateStyles(theme);
    return existingStyle;
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'debug-overlay-styles';
  styleElement.textContent = generateStyles(theme);
  
  document.head.appendChild(styleElement);
  
  return styleElement;
}

/**
 * 스타일 시트를 DOM에서 제거하는 함수
 */
export function removeStyles(): void {
  const styleElement = document.getElementById('debug-overlay-styles');
  if (styleElement) {
    styleElement.remove();
  }
}
