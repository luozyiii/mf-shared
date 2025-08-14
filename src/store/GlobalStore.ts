import { decryptObject, encryptObject } from './encryption';
import type {
  GlobalStoreInterface,
  StoreData,
  StoreOptions,
  StoreSubscriber,
} from './types';

/**
 * 全局存储类 - 支持跨微前端应用的数据存储和通信
 */
class GlobalStore implements GlobalStoreInterface {
  private data: StoreData = {};
  private subscribers: Map<string, Set<StoreSubscriber>> = new Map();
  private options: StoreOptions = {
    enablePersistence: true,
    enableEncryption: true,
    storageKey: 'mf-global-store',
  };
  private isInitialized = false;

  /**
   * 初始化存储
   */
  init(options?: StoreOptions): void {
    if (this.isInitialized) {
      console.warn('GlobalStore is already initialized');
      return;
    }

    this.options = { ...this.options, ...options };
    this.loadFromStorage();
    this.isInitialized = true;

    console.log('GlobalStore initialized with options:', this.options);
  }

  /**
   * 获取数据 - 支持嵌套路径如 'userinfo.name'
   */
  get<T = any>(key: string): T | undefined {
    if (!this.isInitialized) {
      console.warn('GlobalStore not initialized. Call init() first.');
      return undefined;
    }

    return this.getNestedValue(this.data, key) as T;
  }

  /**
   * 设置数据 - 支持嵌套路径如 'userinfo.name'
   */
  set(key: string, value: any, callback?: StoreSubscriber): void {
    if (!this.isInitialized) {
      console.warn('GlobalStore not initialized. Call init() first.');
      return;
    }

    const oldValue = this.get(key);
    this.setNestedValue(this.data, key, value);

    // 持久化到 localStorage
    if (this.options.enablePersistence) {
      this.saveToStorage();
    }

    // 通知订阅者（包括传入的回调）
    this.notifySubscribers(key, value, oldValue, callback);
  }

  /**
   * 订阅数据变化
   */
  subscribe(key: string, callback: StoreSubscriber): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)?.add(callback);

    // 返回取消订阅函数
    return () => this.unsubscribe(key, callback);
  }

  /**
   * 取消订阅
   */
  unsubscribe(key: string, callback: StoreSubscriber): void {
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.delete(callback);
      if (keySubscribers.size === 0) {
        this.subscribers.delete(key);
      }
    }
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.data = {};
    if (this.options.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * 销毁存储实例
   */
  destroy(): void {
    this.data = {};
    this.subscribers.clear();
    this.isInitialized = false;

    if (this.options.enablePersistence && this.options.storageKey) {
      localStorage.removeItem(this.options.storageKey);
    }
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * 设置嵌套值
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;

    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(
    key: string,
    newValue: any,
    oldValue: any,
    immediateCallback?: StoreSubscriber
  ): void {
    // 先执行立即回调（如果提供）
    if (immediateCallback) {
      try {
        immediateCallback(key, newValue, oldValue);
      } catch (error) {
        console.error('Error in immediate callback:', error);
      }
    }

    // 通知精确匹配的订阅者（跳过立即回调以避免重复）
    const exactSubscribers = this.subscribers.get(key);
    if (exactSubscribers) {
      for (const callback of Array.from(exactSubscribers)) {
        // 跳过立即回调，避免重复执行
        if (callback === immediateCallback) {
          continue;
        }
        try {
          callback(key, newValue, oldValue);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      }
    }

    // 通知父级路径的订阅者
    const keyParts = key.split('.');
    for (let i = keyParts.length - 1; i > 0; i--) {
      const parentKey = keyParts.slice(0, i).join('.');
      const parentSubscribers = this.subscribers.get(parentKey);
      if (parentSubscribers) {
        const parentNewValue = this.get(parentKey);
        for (const callback of Array.from(parentSubscribers)) {
          try {
            callback(parentKey, parentNewValue, oldValue);
          } catch (error) {
            console.error('Error in parent subscriber callback:', error);
          }
        }
      }
    }
  }

  /**
   * 从 localStorage 加载数据
   */
  private loadFromStorage(): void {
    if (!this.options.enablePersistence || !this.options.storageKey) return;

    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        if (this.options.enableEncryption) {
          this.data = decryptObject(stored);
        } else {
          this.data = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load data from storage:', error);
      this.data = {};
    }
  }

  /**
   * 保存数据到 localStorage
   */
  private saveToStorage(): void {
    if (!this.options.enablePersistence || !this.options.storageKey) return;

    try {
      let dataToStore: string;
      if (this.options.enableEncryption) {
        dataToStore = encryptObject(this.data);
      } else {
        dataToStore = JSON.stringify(this.data);
      }
      localStorage.setItem(this.options.storageKey, dataToStore);
    } catch (error) {
      console.error('Failed to save data to storage:', error);
    }
  }
}

export default GlobalStore;
