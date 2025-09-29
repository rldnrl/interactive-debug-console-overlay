
/**
 * JSON 뷰어 컴포넌트
 * 객체와 배열을 재귀적으로 시각화하여 접을 수 있는 트리 구조로 표시합니다.
 */
export class JsonViewer {
  private _maxDepth: number;

  /**
   * JsonViewer 인스턴스를 생성합니다.
   * @param maxDepth 최대 표시 깊이 (기본값: 3)
   */
  constructor(maxDepth: number = 3) {
    this._maxDepth = maxDepth;
  }

  /**
   * 값을 HTML 요소로 렌더링합니다.
   * @param value 렌더링할 값
   * @param key 객체의 키 (선택사항)
   * @param currentDepth 현재 깊이 (내부용)
   * @returns 렌더링된 HTML 요소
   */
  public render(value: unknown, key?: string, currentDepth: number = 0): HTMLElement {
    const container = document.createElement('div');
    container.className = 'debug-overlay-json';

    if (key !== undefined) {
      const keyElement = document.createElement('span');
      keyElement.className = 'debug-overlay-json-key';
      keyElement.textContent = `"${key}": `;
      container.appendChild(keyElement);
    }

    const valueElement = this._renderValue(value, currentDepth);
    container.appendChild(valueElement);

    return container;
  }

  /**
   * 값의 타입에 따라 적절한 렌더링 메서드를 호출합니다.
   * @param value 렌더링할 값
   * @param currentDepth 현재 깊이
   * @returns 렌더링된 HTML 요소
   */
  private _renderValue(value: unknown, currentDepth: number = 0): HTMLElement {
    if (value === null) {
      return this._renderNull();
    }

    if (value === undefined) {
      return this._renderUndefined();
    }

    switch (typeof value) {
      case 'string':
        return this._renderString(value);
      case 'number':
        return this._renderNumber(value);
      case 'boolean':
        return this._renderBoolean(value);
      case 'object':
        if (Array.isArray(value)) {
          return this._renderArray(value, currentDepth);
        }
        return this._renderObject(value as Record<string, unknown>, currentDepth);
      case 'function':
        return this._renderFunction(value);
      default:
        return this._renderUnknown(value);
    }
  }

  /**
   * 문자열 값을 렌더링합니다.
   */
  private _renderString(value: string): HTMLElement {
    const element = document.createElement('span');
    element.className = 'debug-overlay-json-string';
    element.textContent = `"${value}"`;
    return element;
  }

  /**
   * 숫자 값을 렌더링합니다.
   */
  private _renderNumber(value: number): HTMLElement {
    const element = document.createElement('span');
    element.className = 'debug-overlay-json-number';
    element.textContent = value.toString();
    return element;
  }

  /**
   * 불린 값을 렌더링합니다.
   */
  private _renderBoolean(value: boolean): HTMLElement {
    const element = document.createElement('span');
    element.className = 'debug-overlay-json-boolean';
    element.textContent = value.toString();
    return element;
  }

  /**
   * null 값을 렌더링합니다.
   */
  private _renderNull(): HTMLElement {
    const element = document.createElement('span');
    element.className = 'debug-overlay-json-null';
    element.textContent = 'null';
    return element;
  }

  /**
   * undefined 값을 렌더링합니다.
   */
  private _renderUndefined(): HTMLElement {
    const element = document.createElement('span');
    element.className = 'debug-overlay-json-undefined';
    element.textContent = 'undefined';
    return element;
  }

  /**
   * 함수를 렌더링합니다.
   */
  private _renderFunction(value: Function): HTMLElement {
    const element = document.createElement('span');
    element.className = 'debug-overlay-json-string';
    element.textContent = `[Function: ${value.name || 'anonymous'}]`;
    return element;
  }

  /**
   * 알 수 없는 타입을 렌더링합니다.
   */
  private _renderUnknown(value: unknown): HTMLElement {
    const element = document.createElement('span');
    element.className = 'debug-overlay-json-string';
    element.textContent = `[${typeof value}]`;
    return element;
  }

  /**
   * 객체를 렌더링합니다.
   */
  private _renderObject(obj: Record<string, unknown>, currentDepth: number): HTMLElement {
    const container = document.createElement('div');
    
    if (currentDepth >= this._maxDepth) {
      container.className = 'debug-overlay-json-collapsed';
      container.style.cursor = 'pointer';
      container.textContent = '{...}';
      
      // 클릭하면 확장할 수 있도록 이벤트 추가
      container.addEventListener('click', () => {
        // 새로운 뷰어로 전체 객체를 렌더링
        const expandedViewer = new JsonViewer(this._maxDepth + 3);
        const expandedElement = expandedViewer.render(obj, undefined, currentDepth);
        container.replaceWith(expandedElement);
      });
      
      return container;
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) {
      container.textContent = '{}';
      return container;
    }

    // 토글 가능한 객체 생성
    const toggle = document.createElement('span');
    toggle.className = 'debug-overlay-json-toggle';
    toggle.textContent = '▼';
    
    const objectContainer = document.createElement('div');
    objectContainer.className = 'debug-overlay-json-object';
    
    let isCollapsed = false;

    // 토글 기능
    toggle.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      toggle.textContent = isCollapsed ? '▶' : '▼';
      objectContainer.style.display = isCollapsed ? 'none' : 'block';
    });

    container.appendChild(toggle);
    container.appendChild(document.createTextNode('{ '));

    keys.forEach((key, index) => {
      const keyElement = document.createElement('div');
      
      const keySpan = document.createElement('span');
      keySpan.className = 'debug-overlay-json-key';
      keySpan.textContent = `"${key}": `;
      
      const valueElement = this._renderValue(obj[key], currentDepth + 1);
      
      keyElement.appendChild(keySpan);
      keyElement.appendChild(valueElement);
      
      if (index < keys.length - 1) {
        keyElement.appendChild(document.createTextNode(','));
      }
      
      objectContainer.appendChild(keyElement);
    });

    container.appendChild(objectContainer);
    container.appendChild(document.createTextNode(' }'));

    return container;
  }

  /**
   * 배열을 렌더링합니다.
   */
  private _renderArray(arr: unknown[], currentDepth: number): HTMLElement {
    const container = document.createElement('div');
    
    if (currentDepth >= this._maxDepth) {
      container.className = 'debug-overlay-json-collapsed';
      container.style.cursor = 'pointer';
      container.textContent = '[...]';
      
      // 클릭하면 확장할 수 있도록 이벤트 추가
      container.addEventListener('click', () => {
        // 새로운 뷰어로 전체 배열을 렌더링
        const expandedViewer = new JsonViewer(this._maxDepth + 3);
        const expandedElement = expandedViewer.render(arr, undefined, currentDepth);
        container.replaceWith(expandedElement);
      });
      
      return container;
    }

    if (arr.length === 0) {
      container.textContent = '[]';
      return container;
    }

    // 토글 가능한 배열 생성
    const toggle = document.createElement('span');
    toggle.className = 'debug-overlay-json-toggle';
    toggle.textContent = '▼';
    
    const arrayContainer = document.createElement('div');
    arrayContainer.className = 'debug-overlay-json-array';
    
    let isCollapsed = false;

    // 토글 기능
    toggle.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      toggle.textContent = isCollapsed ? '▶' : '▼';
      arrayContainer.style.display = isCollapsed ? 'none' : 'block';
    });

    container.appendChild(toggle);
    container.appendChild(document.createTextNode('[ '));

    arr.forEach((item, index) => {
      const itemElement = document.createElement('div');
      
      const indexSpan = document.createElement('span');
      indexSpan.className = 'debug-overlay-json-key';
      indexSpan.textContent = `${index}: `;
      
      const valueElement = this._renderValue(item, currentDepth + 1);
      
      itemElement.appendChild(indexSpan);
      itemElement.appendChild(valueElement);
      
      if (index < arr.length - 1) {
        itemElement.appendChild(document.createTextNode(','));
      }
      
      arrayContainer.appendChild(itemElement);
    });

    container.appendChild(arrayContainer);
    container.appendChild(document.createTextNode(' ]'));

    return container;
  }

  /**
   * 정적 메서드: 간단한 값 렌더링
   * 복잡한 객체나 배열이 아닌 단순한 값들을 빠르게 렌더링할 때 사용합니다.
   */
  public static renderSimple(value: unknown): HTMLElement {
    const viewer = new JsonViewer(1);
    return viewer.render(value);
  }

  /**
   * 정적 메서드: 값을 문자열로 변환
   * 로그 출력 시 사용할 수 있는 문자열 표현을 생성합니다.
   */
  public static stringify(value: unknown): string {
    try {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value === 'string') return `"${value}"`;
      if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
      
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return `[Circular or Invalid JSON: ${typeof value}]`;
    }
  }
}
