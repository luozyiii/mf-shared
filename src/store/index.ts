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
export function configureStoreStrategy(
  keyOrPrefix: string,
  strategy: StorageStrategy
): void {
  const store =
    typeof window !== 'undefined' && (window as any).globalStore
      ? (window as any).globalStore
      : getGlobalStore();
  store.configureStrategy(keyOrPrefix, strategy);
}

/** 按前缀清理数据 */
export function clearStoreByPrefix(prefix: string): void {
  const store =
    typeof window !== 'undefined' && (window as any).globalStore
      ? (window as any).globalStore
      : getGlobalStore();
  store.clearByPrefix(prefix);
}

/**
 * 获取存储的值
 * 支持嵌套路径，如 'userinfo.name'
 */
export function getStoreValue<T = any>(key: string): T | undefined {
  // 优先从 window.globalStore 获取（确保跨应用一致性）
  if (typeof window !== 'undefined' && (window as any).globalStore) {
    return (window as any).globalStore.get(key);
  }

  const store = getGlobalStore();
  return store.get<T>(key);
}

/**
 * 设置存储的值
 * 支持嵌套路径，如 'userinfo.name'
 */
export function setStoreValue(
  key: string,
  value: any,
  callback?: StoreSubscriber
): void {
  // 优先使用 window.globalStore（确保跨应用一致性）
  if (typeof window !== 'undefined' && (window as any).globalStore) {
    (window as any).globalStore.set(key, value, callback);
    return;
  }

  const store = getGlobalStore();
  store.set(key, value, callback);
}

/**
 * 订阅数据变化
 */
export function subscribeStore(
  key: string,
  callback: StoreSubscriber
): () => void {
  // 优先使用 window.globalStore
  if (typeof window !== 'undefined' && (window as any).globalStore) {
    return (window as any).globalStore.subscribe(key, callback);
  }

  const store = getGlobalStore();
  return store.subscribe(key, callback);
}

/**
 * 取消订阅
 */
export function unsubscribeStore(key: string, callback: StoreSubscriber): void {
  // 优先使用 window.globalStore
  if (typeof window !== 'undefined' && (window as any).globalStore) {
    (window as any).globalStore.unsubscribe(key, callback);
    return;
  }

  const store = getGlobalStore();
  store.unsubscribe(key, callback);
}

/**
 * 清空所有数据
 */
export function clearStore(): void {
  // 优先使用 window.globalStore
  if (typeof window !== 'undefined' && (window as any).globalStore) {
    (window as any).globalStore.clear();
    return;
  }

  const store = getGlobalStore();
  store.clear();
}

/**
 * React Hook - 使用存储值
 */
export function useStoreValue<T = any>(
  key: string
): [T | undefined, (value: T) => void] {
  // 这里需要 React，但为了保持简单，我们先提供基础版本
  // 在实际使用时，可以根据需要添加 React hooks
  const getValue = () => getStoreValue<T>(key);
  const setValue = (value: T) => setStoreValue(key, value);

  return [getValue(), setValue];
}

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
  useValue: useStoreValue,
  configureStrategy: configureStoreStrategy,
  clearByPrefix: clearStoreByPrefix,
};
