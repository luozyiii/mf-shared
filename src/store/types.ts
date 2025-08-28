// 存储系统的类型定义

export interface StoreData {
  [key: string]: any;
}

export type StoreSubscriber = (key: string, newValue: any, oldValue: any) => void;

export interface StoreOptions {
  enablePersistence?: boolean; // 传统：将整份数据加密后写入 storageKey
  enableEncryption?: boolean; // 仅对整份数据生效（兼容旧行为）
  storageKey?: string; // 旧版聚合存储 key（默认 mf-global-store）
}

// 细粒度存储介质
export type StorageMedium = 'memory' | 'local' | 'session';

// 针对具体 key 或前缀的策略
export interface StorageStrategy {
  medium: StorageMedium; // local=localStorage, session=sessionStorage, memory=仅内存
  encrypted?: boolean; // 针对该key单独加密（仅当 medium !== 'memory' 时有意义）
}

export interface GlobalStoreInterface {
  init(options?: StoreOptions): void;
  get<T = any>(key: string): T | undefined;
  set(key: string, value: any, callback?: StoreSubscriber): void;
  subscribe(key: string, callback: StoreSubscriber): () => void;
  unsubscribe(key: string, callback: StoreSubscriber): void;
  clear(): void;
  destroy(): void;

  // 新增能力
  configureStrategy(keyOrPrefix: string, strategy: StorageStrategy): void;
}
