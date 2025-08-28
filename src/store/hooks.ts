import { useCallback, useEffect, useState } from 'react';
import { getStoreValue, setStoreValue, subscribeStore } from './index';
import type { StoreSubscriber } from './types';

/**
 * React Hook - 使用存储值
 * 正确实现的 React Hook，支持响应式更新
 */
export function useStoreValue<T = any>(
  key: string
): [T | undefined, (value: T) => void] {
  const [value, setValue] = useState<T | undefined>(() =>
    getStoreValue<T>(key)
  );

  useEffect(() => {
    // 同步当前值（防止初始化时的竞态条件）
    const currentValue = getStoreValue<T>(key);
    setValue(currentValue);

    // 订阅数据变化
    const unsubscribe = subscribeStore(
      key,
      (changedKey: string, newValue: any) => {
        if (changedKey === key) {
          setValue(newValue);
        }
      }
    );

    return unsubscribe;
  }, [key]); // 移除 value 依赖，避免无限循环

  const setStoreValueCallback = useCallback(
    (newValue: T) => {
      setStoreValue(key, newValue);
    },
    [key]
  );

  return [value, setStoreValueCallback];
}

/**
 * React Hook - 订阅存储变化
 */
export function useStoreSubscription(
  key: string,
  callback: StoreSubscriber
): void {
  useEffect(() => {
    const unsubscribe = subscribeStore(key, callback);
    return unsubscribe;
  }, [key, callback]);
}
