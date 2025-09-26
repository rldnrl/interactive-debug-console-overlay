import { LogLevel } from '../types/types.js';
import type { LogEntry } from '../types/types.js';

/**
 * 로그 저장소 클래스
 * 
 * 단일 책임: 로그 데이터를 메모리에 저장하고 관리(추가, 삭제, 조회)하는 책임만 가집니다.
 * - 로그 항목들을 배열로 관리
 * - 최대 로그 수 제한 기능
 * - 로그 필터링 기능
 * - 로그 검색 기능
 */
export class LogStore {
  private _logs: LogEntry[];
  private _maxLogs: number;
  private _listeners: Set<(logs: LogEntry[]) => void>;

  /**
   * LogStore 인스턴스를 생성합니다.
   * @param maxLogs 최대 저장할 로그 수 (기본값: 1000)
   */
  constructor(maxLogs: number = 1000) {
    this._logs = [];
    this._maxLogs = maxLogs;
    this._listeners = new Set();
  }

  /**
   * 새로운 로그 항목을 추가합니다.
   * 최대 로그 수를 초과하면 가장 오래된 로그를 제거합니다.
   * 
   * @param entry 추가할 로그 항목
   */
  public addLog(entry: LogEntry): void {
    this._logs.push(entry);

    // 최대 로그 수 제한
    if (this._logs.length > this._maxLogs) {
      this._logs.shift(); // 가장 오래된 로그 제거
    }

    this._notifyListeners();
  }

  /**
   * 모든 로그를 삭제합니다.
   */
  public clearLogs(): void {
    this._logs = [];
    this._notifyListeners();
  }

  /**
   * 모든 로그를 반환합니다.
   * 
   * @returns 모든 로그 항목의 복사본
   */
  public getAllLogs(): LogEntry[] {
    return [...this._logs];
  }

  /**
   * 특정 레벨의 로그만 필터링하여 반환합니다.
   * 
   * @param levels 포함할 로그 레벨들
   * @returns 필터링된 로그 항목들
   */
  public getLogsByLevels(levels: LogLevel[]): LogEntry[] {
    if (levels.length === 0) {
      return [];
    }

    const levelSet = new Set(levels);
    return this._logs.filter(log => levelSet.has(log.level));
  }

  /**
   * 특정 시간 범위의 로그를 반환합니다.
   * 
   * @param startTime 시작 시간
   * @param endTime 종료 시간
   * @returns 시간 범위 내의 로그 항목들
   */
  public getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this._logs.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  /**
   * 로그 내용에서 텍스트를 검색합니다.
   * 
   * @param searchText 검색할 텍스트
   * @param caseSensitive 대소문자 구분 여부 (기본값: false)
   * @returns 검색 조건에 맞는 로그 항목들
   */
  public searchLogs(searchText: string, caseSensitive: boolean = false): LogEntry[] {
    if (!searchText.trim()) {
      return this.getAllLogs();
    }

    const searchTerm = caseSensitive ? searchText : searchText.toLowerCase();

    return this._logs.filter(log => {
      // 로그 인자들을 문자열로 변환하여 검색
      const logContent = log.args
        .map(arg => this._stringifyLogArg(arg))
        .join(' ');

      const content = caseSensitive ? logContent : logContent.toLowerCase();
      return content.includes(searchTerm);
    });
  }

  /**
   * 최근 N개의 로그를 반환합니다.
   * 
   * @param count 반환할 로그 수
   * @returns 최근 로그 항목들
   */
  public getRecentLogs(count: number): LogEntry[] {
    if (count <= 0) {
      return [];
    }

    return this._logs.slice(-count);
  }

  /**
   * 특정 ID의 로그를 찾습니다.
   * 
   * @param id 찾을 로그의 ID
   * @returns 해당 로그 항목 또는 undefined
   */
  public getLogById(id: string): LogEntry | undefined {
    return this._logs.find(log => log.id === id);
  }

  /**
   * 현재 저장된 로그 수를 반환합니다.
   * 
   * @returns 로그 수
   */
  public getLogCount(): number {
    return this._logs.length;
  }

  /**
   * 최대 로그 수를 설정합니다.
   * 현재 로그 수가 새로운 최대값을 초과하면 오래된 로그들을 제거합니다.
   * 
   * @param maxLogs 새로운 최대 로그 수
   */
  public setMaxLogs(maxLogs: number): void {
    if (maxLogs <= 0) {
      throw new Error('최대 로그 수는 0보다 커야 합니다.');
    }

    this._maxLogs = maxLogs;

    // 현재 로그 수가 새로운 최대값을 초과하면 조정
    if (this._logs.length > this._maxLogs) {
      this._logs = this._logs.slice(-this._maxLogs);
      this._notifyListeners();
    }
  }

  /**
   * 현재 최대 로그 수를 반환합니다.
   * 
   * @returns 최대 로그 수
   */
  public getMaxLogs(): number {
    return this._maxLogs;
  }

  /**
   * 로그 변경 사항을 구독합니다.
   * 
   * @param listener 로그가 변경될 때 호출될 콜백 함수
   */
  public subscribe(listener: (logs: LogEntry[]) => void): void {
    this._listeners.add(listener);
  }

  /**
   * 로그 변경 사항 구독을 해제합니다.
   * 
   * @param listener 제거할 콜백 함수
   */
  public unsubscribe(listener: (logs: LogEntry[]) => void): void {
    this._listeners.delete(listener);
  }

  /**
   * 모든 구독을 해제합니다.
   */
  public unsubscribeAll(): void {
    this._listeners.clear();
  }

  /**
   * 로그 통계 정보를 반환합니다.
   * 
   * @returns 레벨별 로그 수와 전체 통계
   */
  public getStatistics(): Record<LogLevel, number> & { total: number } {
    const stats = {
      [LogLevel.LOG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.DEBUG]: 0,
      total: this._logs.length,
    };

    this._logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }

  /**
   * 모든 리스너에게 로그 변경 사항을 알립니다.
   */
  private _notifyListeners(): void {
    const logs = this.getAllLogs();
    this._listeners.forEach(listener => {
      try {
        listener(logs);
      } catch (error) {
        console.error('로그 리스너 실행 중 오류:', error);
      }
    });
  }

  /**
   * 로그 인자를 문자열로 변환합니다.
   * 검색 기능에서 사용됩니다.
   * 
   * @param arg 변환할 인자
   * @returns 문자열 표현
   */
  private _stringifyLogArg(arg: unknown): string {
    try {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
      if (typeof arg === 'function') return `[Function: ${arg.name || 'anonymous'}]`;
      
      return JSON.stringify(arg);
    } catch (error) {
      return `[Object: ${typeof arg}]`;
    }
  }

  /**
   * 로그 저장소를 완전히 정리합니다.
   * 메모리 누수 방지를 위해 사용합니다.
   */
  public destroy(): void {
    this._logs = [];
    this._listeners.clear();
  }
}
