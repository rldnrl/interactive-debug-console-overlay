import { LogLevel } from '../types/types.js'
import type {
  LogEntry,
  OverlayOptions,
  OverlayElements,
  OverlayState,
} from '../types/types.js'
import { JsonViewer } from '../components/json-viewer.js'

/**
 * 오버레이 렌더러 클래스
 *
 * 단일 책임: 전달받은 데이터를 기반으로 실제 DOM 요소를 화면에 그리고 제거하며, UI 이벤트를 처리하는 책임만 가집니다.
 * - DOM 요소 생성 및 관리
 * - 로그 항목들의 시각적 렌더링
 * - 드래그 앤 드롭 기능
 * - 리사이즈 기능
 * - 필터링 UI
 * - 사용자 인터랙션 처리
 */
export class OverlayRenderer {
  private _elements: OverlayElements | null
  private _state: OverlayState
  private _options: Required<OverlayOptions>
  private _onClearCallback: (() => void) | null
  private _onCloseCallback: (() => void) | null
  private _onFilterChangeCallback: ((levels: LogLevel[]) => void) | null

  /**
   * OverlayRenderer 인스턴스를 생성합니다.
   *
   * @param options 오버레이 설정 옵션
   */
  constructor(options: OverlayOptions = {}) {
    this._elements = null
    this._onClearCallback = null
    this._onCloseCallback = null
    this._onFilterChangeCallback = null

    this._options = {
      maxLogs: options.maxLogs ?? 1000,
      position: options.position ?? 'bottom-right',
      width: options.width ?? 400,
      height: options.height ?? 300,
      opacity: options.opacity ?? 0.95,
      zIndex: options.zIndex ?? 999999,
      theme: options.theme ?? 'dark',
      autoScroll: options.autoScroll ?? true,
      enabledLevels: options.enabledLevels ?? [
        LogLevel.LOG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.DEBUG,
      ],
    }

    this._state = {
      isVisible: false,
      activeFilters: new Set(this._options.enabledLevels),
      dragState: {
        isDragging: false,
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
      },
      resizeState: {
        isResizing: false,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
      },
    }
  }

  /**
   * 오버레이 DOM 요소들을 생성하고 초기화합니다.
   */
  public createOverlay(): void {
    if (this._elements) {
      return
    }

    const container = document.createElement('div')
    container.className = 'debug-overlay hidden'
    container.style.cssText = this._getContainerStyles()

    const header = this._createHeader()
    container.appendChild(header.element)

    const filters = this._createFilters()
    container.appendChild(filters)

    const logContainer = this._createLogContainer()
    container.appendChild(logContainer)

    const resizeHandle = this._createResizeHandle()
    container.appendChild(resizeHandle)

    document.body.appendChild(container)

    this._elements = {
      container,
      header: header.element,
      title: header.title,
      controls: header.controls,
      clearButton: header.clearButton,
      closeButton: header.closeButton,
      filters,
      logContainer,
      resizeHandle,
    }

    this._attachEventListeners()
  }

  /**
   * 오버레이를 표시합니다.
   */
  public show(): void {
    if (!this._elements) {
      this.createOverlay()
    }

    if (this._elements && !this._state.isVisible) {
      this._elements.container.classList.remove('hidden')
      this._state.isVisible = true
    }
  }

  /**
   * 오버레이를 숨깁니다.
   */
  public hide(): void {
    if (this._elements && this._state.isVisible) {
      this._elements.container.classList.add('hidden')
      this._state.isVisible = false
    }
  }

  /**
   * 오버레이 표시/숨김을 토글합니다.
   */
  public toggle(): void {
    if (this._state.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * 현재 표시 상태를 반환합니다.
   */
  public isVisible(): boolean {
    return this._state.isVisible
  }

  /**
   * 로그 항목들을 렌더링합니다.
   *
   * @param logs 렌더링할 로그 항목들
   */
  public renderLogs(logs: LogEntry[]): void {
    if (!this._elements) {
      return
    }

    const filteredLogs = logs.filter((log) =>
      this._state.activeFilters.has(log.level)
    )

    this._elements.logContainer.innerHTML = ''

    filteredLogs.forEach((log) => {
      const logElement = this._createLogElement(log)
      this._elements!.logContainer.appendChild(logElement)
    })

    if (this._options.autoScroll) {
      this._scrollToBottom()
    }
  }

  /**
   * 모든 로그를 삭제합니다.
   */
  public clearLogs(): void {
    if (this._elements) {
      this._elements.logContainer.innerHTML = ''
    }
  }

  /**
   * 클리어 버튼 클릭 콜백을 설정합니다.
   */
  public onClear(callback: () => void): void {
    this._onClearCallback = callback
  }

  /**
   * 닫기 버튼 클릭 콜백을 설정합니다.
   */
  public onClose(callback: () => void): void {
    this._onCloseCallback = callback
  }

  /**
   * 필터 변경 콜백을 설정합니다.
   */
  public onFilterChange(callback: (levels: LogLevel[]) => void): void {
    this._onFilterChangeCallback = callback
  }

  /**
   * 오버레이를 완전히 제거합니다.
   */
  public destroy(): void {
    if (this._elements) {
      this._elements.container.remove()
      this._elements = null
    }
    this._state.isVisible = false
  }

  /**
   * 컨테이너의 CSS 스타일을 생성합니다.
   */
  private _getContainerStyles(): string {
    const position = this._getPositionStyles()

    return `
      width: ${this._options.width}px;
      height: ${this._options.height}px;
      opacity: ${this._options.opacity};
      z-index: ${this._options.zIndex};
      ${position}
    `
  }

  /**
   * 위치에 따른 CSS 스타일을 생성합니다.
   */
  private _getPositionStyles(): string {
    const margin = '20px'

    switch (this._options.position) {
      case 'top-left':
        return `top: ${margin}; left: ${margin};`
      case 'top-right':
        return `top: ${margin}; right: ${margin};`
      case 'bottom-left':
        return `bottom: ${margin}; left: ${margin};`
      case 'bottom-right':
      default:
        return `bottom: ${margin}; right: ${margin};`
    }
  }

  /**
   * 헤더 영역을 생성합니다.
   */
  private _createHeader(): {
    element: HTMLDivElement
    title: HTMLSpanElement
    controls: HTMLDivElement
    clearButton: HTMLButtonElement
    closeButton: HTMLButtonElement
  } {
    const header = document.createElement('div')
    header.className = 'debug-overlay-header'

    const title = document.createElement('span')
    title.className = 'debug-overlay-title'
    title.textContent = 'Debug Console'

    const controls = document.createElement('div')
    controls.className = 'debug-overlay-controls'

    const clearButton = document.createElement('button')
    clearButton.className = 'debug-overlay-button clear'
    clearButton.textContent = 'Clear'

    const closeButton = document.createElement('button')
    closeButton.className = 'debug-overlay-button close'
    closeButton.textContent = '×'

    controls.appendChild(clearButton)
    controls.appendChild(closeButton)

    header.appendChild(title)
    header.appendChild(controls)

    return {
      element: header,
      title,
      controls,
      clearButton,
      closeButton,
    }
  }

  /**
   * 필터 영역을 생성합니다.
   */
  private _createFilters(): HTMLDivElement {
    const filters = document.createElement('div')
    filters.className = 'debug-overlay-filters'

    const levels: LogLevel[] = [
      LogLevel.LOG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.DEBUG,
    ]

    levels.forEach((level) => {
      const button = document.createElement('button')
      button.className = `debug-overlay-filter ${level}`
      button.textContent = level.toUpperCase()
      button.dataset.level = level

      if (this._state.activeFilters.has(level)) {
        button.classList.add('active')
      }

      filters.appendChild(button)
    })

    return filters
  }

  /**
   * 로그 컨테이너를 생성합니다.
   */
  private _createLogContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.className = 'debug-overlay-logs'
    return container
  }

  /**
   * 리사이즈 핸들을 생성합니다.
   */
  private _createResizeHandle(): HTMLDivElement {
    const handle = document.createElement('div')
    handle.className = 'debug-overlay-resize-handle'
    return handle
  }

  /**
   * 개별 로그 항목 요소를 생성합니다.
   */
  private _createLogElement(log: LogEntry): HTMLDivElement {
    const element = document.createElement('div')
    element.className = `debug-overlay-log-entry ${log.level}`

    const meta = document.createElement('div')
    meta.className = 'debug-overlay-log-meta'

    const levelBadge = document.createElement('span')
    levelBadge.className = `debug-overlay-log-level ${log.level}`
    levelBadge.textContent = log.level.toUpperCase()

    const timestamp = document.createElement('span')
    timestamp.className = 'debug-overlay-log-timestamp'
    timestamp.textContent = this._formatTimestamp(log.timestamp)

    meta.appendChild(levelBadge)
    meta.appendChild(timestamp)

    const content = document.createElement('div')
    content.className = 'debug-overlay-log-content'

    if (log.args.length === 0) {
      content.textContent = '(empty)'
    } else {
      const argsContainer = document.createElement('div')
      argsContainer.className = 'debug-overlay-log-args'

      log.args.forEach((arg) => {
        const argElement = this._createLogArgElement(arg)
        argsContainer.appendChild(argElement)
      })

      content.appendChild(argsContainer)
    }

    if (log.stack) {
      const stackElement = document.createElement('pre')
      stackElement.className = 'debug-overlay-log-stack'
      stackElement.textContent = log.stack
      content.appendChild(stackElement)
    }

    element.appendChild(meta)
    element.appendChild(content)

    return element
  }

  /**
   * 로그 인자 요소를 생성합니다.
   */
  private _createLogArgElement(arg: unknown): HTMLDivElement {
    const element = document.createElement('div')
    element.className = 'debug-overlay-log-arg'

    if (typeof arg === 'object' && arg !== null) {
      const jsonViewer = new JsonViewer(5)
      const jsonElement = jsonViewer.render(arg)
      element.appendChild(jsonElement)
    } else {
      element.textContent = JsonViewer.stringify(arg)
    }

    return element
  }

  /**
   * 타임스탬프를 포맷팅합니다.
   */
  private _formatTimestamp(timestamp: Date): string {
    const hours = timestamp.getHours().toString().padStart(2, '0')
    const minutes = timestamp.getMinutes().toString().padStart(2, '0')
    const seconds = timestamp.getSeconds().toString().padStart(2, '0')
    const milliseconds = timestamp.getMilliseconds().toString().padStart(3, '0')

    return `${hours}:${minutes}:${seconds}.${milliseconds}`
  }

  /**
   * 로그 컨테이너를 맨 아래로 스크롤합니다.
   */
  private _scrollToBottom(): void {
    if (this._elements) {
      this._elements.logContainer.scrollTop =
        this._elements.logContainer.scrollHeight
    }
  }

  /**
   * 이벤트 리스너들을 등록합니다.
   */
  private _attachEventListeners(): void {
    if (!this._elements) return

    this._elements.clearButton.addEventListener('click', () => {
      if (this._onClearCallback) {
        this._onClearCallback()
      }
    })

    this._elements.closeButton.addEventListener('click', () => {
      if (this._onCloseCallback) {
        this._onCloseCallback()
      }
    })

    this._elements.filters.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.classList.contains('debug-overlay-filter')) {
        this._handleFilterClick(target)
      }
    })

    this._elements.header.addEventListener('mousedown', (event) => {
      this._startDrag(event)
    })

    this._elements.resizeHandle.addEventListener('mousedown', (event) => {
      this._startResize(event)
    })

    document.addEventListener('mousemove', (event) => {
      this._handleMouseMove(event)
    })

    document.addEventListener('mouseup', () => {
      this._handleMouseUp()
    })
  }

  /**
   * 필터 버튼 클릭을 처리합니다.
   */
  private _handleFilterClick(button: HTMLElement): void {
    const level = button.dataset.level as LogLevel
    if (!level) return

    button.classList.toggle('active')

    if (button.classList.contains('active')) {
      this._state.activeFilters.add(level)
    } else {
      this._state.activeFilters.delete(level)
    }

    if (this._onFilterChangeCallback) {
      this._onFilterChangeCallback(Array.from(this._state.activeFilters))
    }
  }

  /**
   * 드래그를 시작합니다.
   */
  private _startDrag(event: MouseEvent): void {
    if (!this._elements) return

    event.preventDefault()

    const rect = this._elements.container.getBoundingClientRect()

    this._state.dragState = {
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    }

    this._elements.container.classList.add('dragging')
  }

  /**
   * 리사이즈를 시작합니다.
   */
  private _startResize(event: MouseEvent): void {
    if (!this._elements) return

    event.preventDefault()
    event.stopPropagation()

    const rect = this._elements.container.getBoundingClientRect()

    this._state.resizeState = {
      isResizing: true,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    }

    this._elements.container.classList.add('resizing')
  }

  /**
   * 마우스 이동을 처리합니다.
   */
  private _handleMouseMove(event: MouseEvent): void {
    if (!this._elements) return

    if (this._state.dragState.isDragging) {
      const deltaX = event.clientX - this._state.dragState.startX
      const deltaY = event.clientY - this._state.dragState.startY

      const newLeft = this._state.dragState.startLeft + deltaX
      const newTop = this._state.dragState.startTop + deltaY

      this._elements.container.style.left = `${newLeft}px`
      this._elements.container.style.top = `${newTop}px`
      this._elements.container.style.right = 'auto'
      this._elements.container.style.bottom = 'auto'
    }

    if (this._state.resizeState.isResizing) {
      const deltaX = event.clientX - this._state.resizeState.startX
      const deltaY = event.clientY - this._state.resizeState.startY

      const newWidth = Math.max(
        300,
        this._state.resizeState.startWidth + deltaX
      )
      const newHeight = Math.max(
        200,
        this._state.resizeState.startHeight + deltaY
      )

      this._elements.container.style.width = `${newWidth}px`
      this._elements.container.style.height = `${newHeight}px`
    }
  }

  /**
   * 마우스 업을 처리합니다.
   */
  private _handleMouseUp(): void {
    if (!this._elements) return

    if (this._state.dragState.isDragging) {
      this._state.dragState.isDragging = false
      this._elements.container.classList.remove('dragging')
    }

    if (this._state.resizeState.isResizing) {
      this._state.resizeState.isResizing = false
      this._elements.container.classList.remove('resizing')
    }
  }
}
