import { decryptObject, encryptObject } from '../utils/encryption';
import type {
  GlobalStoreInterface,
  StorageStrategy,
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
    storageKey: 'mf-shell-store',
  };
  private isInitialized = false;

  // 新增：按 key 或前缀的存储策略
  private strategies: Map<string, StorageStrategy> = new Map();

  // 新增：跨 Tab 同步（尽量复用原 localStorage 聚合存储），同时用 BroadcastChannel 提升可靠性
  private channel: BroadcastChannel | null = null;

  private makeItemKey(key: string): string {
    return `${this.options.storageKey || 'mf-shell-store'}:${key}`;
  }

  private findStrategyFor(key: string): StorageStrategy | undefined {
    // 最长前缀匹配
    let bestPrefix = '';
    let bestStrategy: StorageStrategy | undefined = undefined;
    this.strategies.forEach((strategy, prefix) => {
      if (key.startsWith(prefix) && prefix.length > bestPrefix.length) {
        bestPrefix = prefix;
        bestStrategy = strategy;
      }
    });
    return bestStrategy;
  }

  private persistPerKey(key: string, value: any): void {
    const strategy = this.findStrategyFor(key);
    if (!strategy || strategy.medium === 'memory') return;

    try {
      const itemKey = this.makeItemKey(key);

      // 如果值是 undefined，删除持久化存储
      if (value === undefined) {
        if (strategy.medium === 'local') {
          localStorage.removeItem(itemKey);
        } else if (strategy.medium === 'session') {
          sessionStorage.removeItem(itemKey);
        }
        return;
      }

      const serialized = strategy.encrypted
        ? encryptObject(value)
        : JSON.stringify(value);
      if (strategy.medium === 'local') {
        localStorage.setItem(itemKey, serialized);
      } else if (strategy.medium === 'session') {
        sessionStorage.setItem(itemKey, serialized);
      }
    } catch (e) {
      console.warn('persistPerKey failed:', e);
    }
  }

  private loadPerKey(key: string): any | undefined {
    const strategy = this.findStrategyFor(key);
    if (!strategy || strategy.medium === 'memory') return undefined;
    try {
      const itemKey = this.makeItemKey(key);
      const raw =
        strategy.medium === 'local'
          ? localStorage.getItem(itemKey)
          : sessionStorage.getItem(itemKey);
      if (!raw) return undefined;
      const obj = strategy.encrypted ? decryptObject(raw) : JSON.parse(raw);
      return obj;
    } catch (e) {
      console.warn('loadPerKey failed:', e);
      return undefined;
    }
  }

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

    // 初始化跨 Tab 同步通道
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(
          this.options.storageKey || 'mf-shell-store'
        );
        this.channel.onmessage = (ev: MessageEvent) => {
          const msg = ev.data as {
            type: string;
            key?: string;
            value?: any;
            prefix?: string;
            appStorageKey?: string;
          } & { type: 'set' | 'clearAppData' };
          if (msg?.type === 'set' && msg.key) {
            // 合并来自其他 Tab 的更新
            const oldValue = this.get(msg.key);
            this.setNestedValue(this.data, msg.key, msg.value);
            // 聚合持久化
            if (this.options.enablePersistence) {
              this.saveToStorage();
            }
            // 通知本地订阅者（标记为远端来源，无需再广播）
            this.notifySubscribers(msg.key, msg.value, oldValue);
          } else if (msg?.type === 'clearAppData' && msg.appStorageKey) {
            // 清理应用数据（来自其他 Tab）
            const isCurrentApp = msg.appStorageKey === this.options.storageKey;

            if (isCurrentApp) {
              // 只有当清理的是当前应用时，才清理内存数据和通知订阅者
              this.data = {};
              if (this.options.enablePersistence) {
                this.saveToStorage();
              }
              // 通知所有订阅者
              this.subscribers.forEach((_, key) => {
                this.notifySubscribers(key, undefined, undefined);
              });
            }
            // 注意：localStorage 的清理已经由发送消息的 Tab 完成，这里不需要重复清理
          }
        };
      }

      // storage 事件降级：当其他 Tab 写入聚合存储键时，合并数据
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', (e: StorageEvent) => {
          if (!e.key || e.key !== (this.options.storageKey || 'mf-shell-store'))
            return;
          try {
            const incoming = this.options.enableEncryption
              ? decryptObject(e.newValue || '')
              : JSON.parse(e.newValue || '{}');
            if (incoming && typeof incoming === 'object') {
              this.data = incoming;
              // 通知顶层订阅者（粗粒度），避免逐个键比对
              this.subscribers.forEach((subs, key) => {
                for (const cb of Array.from(subs)) {
                  try {
                    cb(key, this.get(key), undefined);
                  } catch {}
                }
              });
            }
          } catch {}
        });
      }
    } catch (e) {
      console.warn('BroadcastChannel/storage init failed:', e);
    }

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

    // 先从内存读取
    const val = this.getNestedValue(this.data, key) as T | undefined;
    if (val !== undefined) return val;

    // 再尝试从按键持久化中加载
    const loaded = this.loadPerKey(key);
    if (loaded !== undefined) {
      this.setNestedValue(this.data, key, loaded);
      // 聚合持久化（仅在开启时）
      if (this.options.enablePersistence) this.saveToStorage();
      return loaded as T;
    }

    return undefined;
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

    // 细粒度持久化（按策略）
    this.persistPerKey(key, value);

    // 持久化到 localStorage（聚合，兼容旧行为）
    if (this.options.enablePersistence) {
      this.saveToStorage();
    }

    // 通过 BroadcastChannel 通知其他 Tab
    try {
      this.channel?.postMessage({ type: 'set', key, value });
    } catch {}

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

    try {
      this.channel?.close();
    } catch {}
    this.channel = null;

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

    // 如果值是 undefined，删除该键
    if (value === undefined) {
      delete target[lastKey];
    } else {
      target[lastKey] = value;
    }
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

  // 新增：为指定 key 或前缀配置存储策略
  configureStrategy(keyOrPrefix: string, strategy: StorageStrategy): void {
    this.strategies.set(keyOrPrefix, strategy);
  }

  /**
   * 清理特定应用的所有数据
   * @param appStorageKey 应用的存储键名，如 'mf-shell-store', 'mf-template-store'
   */
  clearAppData(appStorageKey: string): void {
    try {
      // 判断是否清理当前实例的数据
      const isCurrentApp = appStorageKey === this.options.storageKey;

      if (isCurrentApp) {
        // 1) 如果是当前应用，清理内存中的所有数据
        this.data = {};

        // 5) 通知所有订阅者数据已清空
        this.subscribers.forEach((_, key) => {
          this.notifySubscribers(key, undefined, undefined);
        });
      }

      // 2) 清理指定应用的聚合持久化存储（无论是否为当前应用）
      localStorage.removeItem(appStorageKey);

      // 4) 清理细粒度持久化存储（localStorage 和 sessionStorage）
      const storagePrefix = `${appStorageKey}:`;

      // 清理 localStorage
      const localKeys = Object.keys(localStorage);
      for (const key of localKeys) {
        if (key.startsWith(storagePrefix)) {
          try {
            localStorage.removeItem(key);
          } catch {}
        }
      }

      // 清理 sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      for (const key of sessionKeys) {
        if (key.startsWith(storagePrefix)) {
          try {
            sessionStorage.removeItem(key);
          } catch {}
        }
      }

      // 6) 发送跨 Tab 通知
      try {
        this.channel?.postMessage({ type: 'clearAppData', appStorageKey });
      } catch {}
    } catch (error) {
      console.warn('Failed to clear app data:', error);
    }
  }
}

export default GlobalStore;
