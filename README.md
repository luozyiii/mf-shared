# MF-Shared

[![Deploy to GitHub Pages](https://github.com/luozyiii/micro-frontend-app/actions/workflows/deploy-mf-shared.yml/badge.svg)](https://github.com/luozyiii/micro-frontend-app/actions/workflows/deploy-mf-shared.yml)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://luozyiii.github.io/mf-shared/)

微前端共享模块，基于 Module Federation 2.0 提供跨应用状态管理和数据存储。

## 功能特性

- **全局状态管理** - 跨微前端应用的统一状态存储
- **数据加密存储** - 支持敏感数据的 XOR 加密存储
- **多存储策略** - 支持 localStorage、sessionStorage、内存存储
- **跨应用同步** - 基于 BroadcastChannel 的实时数据同步
- **事件订阅** - 灵活的数据变化监听机制
- **细粒度控制** - 按 key 前缀配置不同存储策略

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm run dev
```

访问 http://localhost:2999

### 构建

```bash
pnpm run build
```

## 使用方式

### 在主应用中初始化

```typescript
import { initGlobalStore } from 'mfShared/store';

// 初始化全局存储
initGlobalStore({
  enablePersistence: true,
  enableEncryption: true,
  storageKey: 'my-app-store'
});
```

### 基本操作

```typescript
import { getStoreValue, setStoreValue, subscribeStore } from 'mfShared/store';

// 设置值
setStoreValue('user.name', 'John');

// 获取值
const userName = getStoreValue('user.name');

// 订阅变化
const unsubscribe = subscribeStore('user.name', (key, newValue, oldValue) => {
  console.log(`${key} changed from ${oldValue} to ${newValue}`);
});
```

### 配置存储策略

```typescript
import { configureStoreStrategy } from 'mfShared/store';

// 用户数据使用加密的 localStorage
configureStoreStrategy('user.', {
  medium: 'local',
  encrypted: true
});

// 临时数据使用 sessionStorage
configureStoreStrategy('temp.', {
  medium: 'session',
  encrypted: false
});

// 缓存数据仅存储在内存
configureStoreStrategy('cache.', {
  medium: 'memory'
});
```

### React Hook

```typescript
import { useStoreValue } from 'mfShared/store';

function UserProfile() {
  const [userName, setUserName] = useStoreValue('user.name');
  
  return (
    <input 
      value={userName || ''} 
      onChange={(e) => setUserName(e.target.value)}
    />
  );
}
```

## Module Federation 配置

### 暴露的模块

- `'.'` - 主入口组件
- `'./store'` - 全局状态管理

### 在其他应用中使用

```typescript
// module-federation.config.ts
export default createModuleFederationConfig({
  name: 'myApp',
  remotes: {
    mfShared: 'mfShared@http://localhost:2999/remoteEntry.js'
  }
});
```

## API 参考

### 核心方法

- `initGlobalStore(options?)` - 初始化全局存储
- `getStoreValue<T>(key)` - 获取存储值
- `setStoreValue(key, value, callback?)` - 设置存储值
- `subscribeStore(key, callback)` - 订阅数据变化
- `unsubscribeStore(key, callback)` - 取消订阅
- `clearStore()` - 清空所有数据
- `clearAppData(appStorageKey)` - 清理应用数据

### 高级功能

- `configureStoreStrategy(keyOrPrefix, strategy)` - 配置存储策略
- `useStoreValue<T>(key)` - React Hook

## 开发命令

```bash
# 开发模式
pnpm run dev

# 构建
pnpm run build

# 代码检查
pnpm run lint

# 格式化代码
pnpm run format

# 类型检查
pnpm run type-check

# Storybook
pnpm run storybook
```

## 技术栈

- **Module Federation 2.0** - 微前端架构
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Rsbuild** - 构建工具
- **Biome** - 代码检查和格式化
- **Storybook** - 组件文档
