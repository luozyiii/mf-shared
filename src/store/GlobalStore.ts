import { decryptObject, encryptObject } from '../utils/encryption';
import type {
  GlobalStoreInterface,
  StorageStrategy,
  StoreData,
  StoreOptions,
  StoreSubscriber,
} from './types';

/**
 * 存储核心类 - 负责内存数据管理和嵌套路径操作
 */
class StorageCore {
  private data: StoreData = {};

  get<T = any>(path: string): T | undefined {
    return this.getNestedValue(this.data, path) as T | undefined;
  }

  set(path: string, value: any): any {
    const oldValue = this.get(path);
    this.setNestedValue(this.data, path, value);
    return oldValue;
  }

  clear(): void {
    this.data = {};
  }

  getData(): StoreData {
    return this.data;
  }

  setData(data: StoreData): void {
    this.data = data;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

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

    if (value === undefined) {
      delete target[lastKey];
    } else {
      target[lastKey] = value;
    }
  }
}

/**
 * 订阅管理器 - 负责事件订阅和通知
 */
class SubscriptionManager {
  private subscribers: Map<string, Set<StoreSubscriber>> = new Map();

  subscribe(key: string, callback: StoreSubscriber): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)?.add(callback);
    return () => this.unsubscribe(key, callback);
  }

  unsubscribe(key: string, callback: StoreSubscriber): void {
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.delete(callback);
      if (keySubscribers.size === 0) {
        this.subscribers.delete(key);
      }
    }
  }

  notify(
    key: string,
    newValue: any,
    oldValue: any,
    storageCore: StorageCore,
    immediateCallback?: StoreSubscriber
  ): void {
    // 先执行立即回调
    if (immediateCallback) {
      try {
        immediateCallback(key, newValue, oldValue);
      } catch (error) {
        console.error('Error in immediate callback:', error);
      }
    }

    // 通知精确匹配的订阅者
    const exactSubscribers = this.subscribers.get(key);
    if (exactSubscribers) {
      for (const callback of Array.from(exactSubscribers)) {
        if (callback === immediateCallback) continue;
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
        const parentNewValue = storageCore.get(parentKey);
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

  clear(): void {
    this.subscribers.clear();
  }
}

/**
 * 持久化管理器 - 负责数据持久化存储
 */
class PersistenceManager {
  private options: StoreOptions;
  private strategies: Map<string, StorageStrategy> = new Map();

  constructor(options: StoreOptions) {
    this.options = options;
  }

  configureStrategy(keyOrPrefix: string, strategy: StorageStrategy): void {
    this.strategies.set(keyOrPrefix, strategy);
  }

  private makeItemKey(key: string): string {
    return `${this.options.storageKey || 'mf-shell-store'}:${key}`;
  }

  private findStrategyFor(key: string): StorageStrategy | undefined {
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

  persistKey(key: string, value: any): void {
    const strategy = this.findStrategyFor(key);
    if (!strategy || strategy.medium === 'memory') return;

    try {
      const itemKey = this.makeItemKey(key);
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
      console.warn('persistKey failed:', e);
    }
  }

  loadKey(key: string): any | undefined {
    const strategy = this.findStrategyFor(key);
    if (!strategy || strategy.medium === 'memory') return undefined;
    try {
      const itemKey = this.makeItemKey(key);
      const raw =
        strategy.medium === 'local'
          ? localStorage.getItem(itemKey)
          : sessionStorage.getItem(itemKey);
      if (!raw) return undefined;
      return strategy.encrypted ? decryptObject(raw) : JSON.parse(raw);
    } catch (e) {
      console.warn('loadKey failed:', e);
      return undefined;
    }
  }

  saveToStorage(data: StoreData): void {
    if (!this.options.enablePersistence || !this.options.storageKey) return;
    try {
      const dataToStore = this.options.enableEncryption
        ? encryptObject(data)
        : JSON.stringify(data);
      localStorage.setItem(this.options.storageKey, dataToStore);
    } catch (error) {
      console.error('Failed to save data to storage:', error);
    }
  }

  loadFromStorage(): StoreData {
    if (!this.options.enablePersistence || !this.options.storageKey) return {};
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        return this.options.enableEncryption
          ? decryptObject(stored)
          : JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load data from storage:', error);
    }
    return {};
  }

  clearAppData(appStorageKey: string): void {
    try {
      localStorage.removeItem(appStorageKey);
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
    } catch (error) {
      console.warn('Failed to clear app data:', error);
    }
  }
}

/**
 * 跨Tab同步管理器 - 负责BroadcastChannel通信
 */
class SyncManager {
  private channel: BroadcastChannel | null = null;
  private options: StoreOptions;

  constructor(options: StoreOptions) {
    this.options = options;
  }

  init(onMessage: (msg: any) => void): void {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(
          this.options.storageKey || 'mf-shell-store'
        );
        this.channel.onmessage = (ev: MessageEvent) => {
          onMessage(ev.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel init failed:', e);
    }
  }

  broadcast(message: any): void {
    try {
      this.channel?.postMessage(message);
    } catch {}
  }

  destroy(): void {
    try {
      this.channel?.close();
    } catch {}
    this.channel = null;
  }
}

/**
 * 全局存储类 - 支持跨微前端应用的数据存储和通信
 */
class GlobalStore implements GlobalStoreInterface {
  private storageCore: StorageCore;
  private subscriptionManager: SubscriptionManager;
  private persistenceManager: PersistenceManager;
  private syncManager: SyncManager;
  private options: StoreOptions = {
    enablePersistence: true,
    enableEncryption: true,
    storageKey: 'mf-shell-store',
  };
  private isInitialized = false;

  constructor() {
    this.storageCore = new StorageCore();
    this.subscriptionManager = new SubscriptionManager();
    this.persistenceManager = new PersistenceManager(this.options);
    this.syncManager = new SyncManager(this.options);
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

    // 重新创建管理器实例以使用新配置
    this.persistenceManager = new PersistenceManager(this.options);
    this.syncManager = new SyncManager(this.options);

    // 加载持久化数据
    const storedData = this.persistenceManager.loadFromStorage();
    this.storageCore.setData(storedData);

    this.isInitialized = true;

    // 初始化跨Tab同步
    this.syncManager.init((msg: any) => {
      this.handleSyncMessage(msg);
    });

    // 设置storage事件监听
    this.setupStorageListener();

    console.log('GlobalStore initialized with options:', this.options);
  }

  private handleSyncMessage(msg: any): void {
    if (msg?.type === 'set' && msg.key) {
      const oldValue = this.storageCore.get(msg.key);
      this.storageCore.set(msg.key, msg.value);
      if (this.options.enablePersistence) {
        this.persistenceManager.saveToStorage(this.storageCore.getData());
      }
      this.subscriptionManager.notify(
        msg.key,
        msg.value,
        oldValue,
        this.storageCore
      );
    } else if (msg?.type === 'clearAppData' && msg.appStorageKey) {
      const isCurrentApp = msg.appStorageKey === this.options.storageKey;
      if (isCurrentApp) {
        this.storageCore.clear();
        if (this.options.enablePersistence) {
          this.persistenceManager.saveToStorage(this.storageCore.getData());
        }
      }
    }
  }

  private setupStorageListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (!e.key || e.key !== (this.options.storageKey || 'mf-shell-store'))
          return;
        try {
          const incoming = this.options.enableEncryption
            ? decryptObject(e.newValue || '')
            : JSON.parse(e.newValue || '{}');
          if (incoming && typeof incoming === 'object') {
            this.storageCore.setData(incoming);
          }
        } catch {}
      });
    }
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
    const val = this.storageCore.get<T>(key);
    if (val !== undefined) return val;

    // 再尝试从按键持久化中加载
    const loaded = this.persistenceManager.loadKey(key);
    if (loaded !== undefined) {
      this.storageCore.set(key, loaded);
      // 聚合持久化（仅在开启时）
      if (this.options.enablePersistence) {
        this.persistenceManager.saveToStorage(this.storageCore.getData());
      }
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

    const oldValue = this.storageCore.get(key);
    this.storageCore.set(key, value);

    // 细粒度持久化（按策略）
    this.persistenceManager.persistKey(key, value);

    // 持久化到 localStorage（聚合，兼容旧行为）
    if (this.options.enablePersistence) {
      this.persistenceManager.saveToStorage(this.storageCore.getData());
    }

    // 通过 BroadcastChannel 通知其他 Tab
    this.syncManager.broadcast({ type: 'set', key, value });

    // 通知订阅者（包括传入的回调）
    this.subscriptionManager.notify(
      key,
      value,
      oldValue,
      this.storageCore,
      callback
    );
  }

  /**
   * 订阅数据变化
   */
  subscribe(key: string, callback: StoreSubscriber): () => void {
    return this.subscriptionManager.subscribe(key, callback);
  }

  /**
   * 取消订阅
   */
  unsubscribe(key: string, callback: StoreSubscriber): void {
    this.subscriptionManager.unsubscribe(key, callback);
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.storageCore.clear();
    if (this.options.enablePersistence) {
      this.persistenceManager.saveToStorage(this.storageCore.getData());
    }
  }

  /**
   * 销毁存储实例
   */
  destroy(): void {
    this.storageCore.clear();
    this.subscriptionManager.clear();
    this.syncManager.destroy();
    this.isInitialized = false;

    if (this.options.enablePersistence && this.options.storageKey) {
      localStorage.removeItem(this.options.storageKey);
    }
  }

  /**
   * 为指定 key 或前缀配置存储策略
   */
  configureStrategy(keyOrPrefix: string, strategy: StorageStrategy): void {
    this.persistenceManager.configureStrategy(keyOrPrefix, strategy);
  }

  /**
   * 清理特定应用的所有数据
   * @param appStorageKey 应用的存储键名，如 'mf-shell-store', 'mf-template-store'
   */
  clearAppData(appStorageKey: string): void {
    const isCurrentApp = appStorageKey === this.options.storageKey;

    if (isCurrentApp) {
      this.storageCore.clear();
    }

    this.persistenceManager.clearAppData(appStorageKey);
    this.syncManager.broadcast({ type: 'clearAppData', appStorageKey });
  }
}

export default GlobalStore;
