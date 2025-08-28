import GlobalStore from './GlobalStore';
import type { StorageStrategy, StoreOptions, StoreSubscriber } from './types';

// 创建全局单例实例
let globalStoreInstance: GlobalStore | null = null;

/**
 * 获取全局存储实例
 */
function getGlobalStore(): GlobalStore {
  if (!globalStoreInstance) {
    globalStoreInstance = new GlobalStore();

    // 将实例挂载到 window 对象上，确保跨应用共享
    if (typeof window !== 'undefined') {
      (window as any).globalStore = globalStoreInstance;
    }
  }
  return globalStoreInstance;
}

/**
 * 初始化全局存储
 * 在微前端主应用中调用，子应用无需调用
 */
export function initGlobalStore(options?: StoreOptions): void {
  const store = getGlobalStore();
  store.init(options);
}

/** 配置存储策略（按 key 或前缀） */
export function configureStoreStrategy(keyOrPrefix: string, strategy: StorageStrategy): void {
  getStore().configureStrategy(keyOrPrefix, strategy);
}

/** 清理特定应用的所有数据 */
export function clearAppData(appStorageKey: string): void {
  getStore().clearAppData(appStorageKey);
}

/**
 * 获取全局存储实例（统一入口）
 */
function getStore(): GlobalStore {
  // 优先从 window.globalStore 获取（确保跨应用一致性）
  if (typeof window !== 'undefined' && (window as any).globalStore) {
    return (window as any).globalStore;
  }
  return getGlobalStore();
}

/**
 * 获取存储的值
 * 支持嵌套路径，如 'userinfo.name'
 */
export function getStoreValue<T = any>(key: string): T | undefined {
  return getStore().get<T>(key);
}

/**
 * 设置存储的值
 * 支持嵌套路径，如 'userinfo.name'
 */
export function setStoreValue(key: string, value: any, callback?: StoreSubscriber): void {
  getStore().set(key, value, callback);
}

/**
 * 订阅数据变化
 */
export function subscribeStore(key: string, callback: StoreSubscriber): () => void {
  return getStore().subscribe(key, callback);
}

/**
 * 取消订阅
 */
export function unsubscribeStore(key: string, callback: StoreSubscriber): void {
  getStore().unsubscribe(key, callback);
}

/**
 * 清空所有数据
 */
export function clearStore(): void {
  getStore().clear();
}

// React Hooks 从单独文件导出
export { useStoreValue, useStoreSubscription } from './hooks';

// 导出类型
export * from './types';
export { default as GlobalStore } from './GlobalStore';

// 默认导出便捷函数
export default {
  init: initGlobalStore,
  get: getStoreValue,
  set: setStoreValue,
  subscribe: subscribeStore,
  unsubscribe: unsubscribeStore,
  clear: clearStore,
  configureStrategy: configureStoreStrategy,
  clearAppData: clearAppData,
};
