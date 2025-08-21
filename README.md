# MF-Shared

[![Deploy to GitHub Pages](https://github.com/luozyiii/micro-frontend-app/actions/workflows/deploy-mf-shared.yml/badge.svg)](https://github.com/luozyiii/micro-frontend-app/actions/workflows/deploy-mf-shared.yml)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://luozyiii.github.io/mf-shared/)

> 微前端共享状态管理模块，基于 Module Federation 2.0 实现跨应用数据共享

## ✨ 核心特性

- 🔄 **跨应用状态同步** - 基于 BroadcastChannel 实现实时数据同步
- 🔐 **数据加密存储** - 支持 XOR 加密的安全数据存储
- 📦 **多存储策略** - localStorage / sessionStorage / 内存存储
- 🎯 **细粒度控制** - 按 key 前缀配置不同存储策略
- ⚛️ **React 集成** - 提供开箱即用的 React Hook

## 🚀 快速开始

### 安装与运行

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建
pnpm run build
```

### 基本使用

```typescript
import { initGlobalStore, getStoreValue, setStoreValue } from 'mfShared/store';

// 1. 初始化（仅在主应用中调用）
initGlobalStore({
  enablePersistence: true,
  enableEncryption: true
});

// 2. 存储数据
setStoreValue('user.name', 'John');

// 3. 读取数据
const userName = getStoreValue('user.name');

// 4. React Hook
import { useStoreValue } from 'mfShared/store';

function UserProfile() {
  const [userName, setUserName] = useStoreValue('user.name');
  return <input value={userName || ''} onChange={(e) => setUserName(e.target.value)} />;
}
```

## ⚙️ 高级配置

### 存储策略配置

```typescript
import { configureStoreStrategy } from 'mfShared/store';

// 用户数据：加密本地存储
configureStoreStrategy('user.', {
  medium: 'local',
  encrypted: true
});

// 临时数据：会话存储
configureStoreStrategy('temp.', {
  medium: 'session',
  encrypted: false
});

// 缓存数据：内存存储
configureStoreStrategy('cache.', {
  medium: 'memory'
});
```

### Module Federation 集成

```typescript
// module-federation.config.ts
export default createModuleFederationConfig({
  name: 'myApp',
  remotes: {
    mfShared: 'mfShared@http://localhost:2999/remoteEntry.js'
  }
});
```

## 📚 API 参考

| 方法 | 描述 |
|------|------|
| `initGlobalStore(options?)` | 初始化全局存储 |
| `getStoreValue<T>(key)` | 获取存储值 |
| `setStoreValue(key, value)` | 设置存储值 |
| `subscribeStore(key, callback)` | 订阅数据变化 |
| `configureStoreStrategy(prefix, strategy)` | 配置存储策略 |
| `useStoreValue<T>(key)` | React Hook |
| `clearStore()` | 清空所有数据 |

## 🛠️ 技术栈

- **Module Federation 2.0** - 微前端架构
- **React 18** - UI 框架  
- **TypeScript** - 类型安全
- **Rsbuild** - 构建工具
- **Biome** - 代码检查和格式化

## 📝 开发命令

```bash
pnpm run dev          # 开发模式
pnpm run build        # 构建
pnpm run lint         # 代码检查
pnpm run format       # 格式化代码
pnpm run storybook    # 组件文档
```
