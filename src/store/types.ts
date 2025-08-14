// 存储系统的类型定义

export interface StoreData {
  [key: string]: any;
}

export type StoreSubscriber = (
  key: string,
  newValue: any,
  oldValue: any
) => void;

export interface StoreOptions {
  enablePersistence?: boolean;
  enableEncryption?: boolean;
  storageKey?: string;
}

export interface GlobalStoreInterface {
  init(options?: StoreOptions): void;
  get<T = any>(key: string): T | undefined;
  set(key: string, value: any, callback?: StoreSubscriber): void;
  subscribe(key: string, callback: StoreSubscriber): () => void;
  unsubscribe(key: string, callback: StoreSubscriber): void;
  clear(): void;
  destroy(): void;
}
