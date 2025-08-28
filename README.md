# MF-Shared

[![Deploy to GitHub Pages](https://github.com/luozyiii/micro-frontend-app/actions/workflows/deploy-mf-shared.yml/badge.svg)](https://github.com/luozyiii/micro-frontend-app/actions/workflows/deploy-mf-shared.yml)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://luozyiii.github.io/mf-shared/)

> 🚀 现代化微前端共享状态管理模块，基于 Module Federation 2.0 实现跨应用数据共享与同步

## ✨ 核心特性

- 🔄 **跨应用状态同步** - 基于 BroadcastChannel 实现实时数据同步
- 🔐 **数据加密存储** - 支持 XOR 加密的安全数据存储  
- 📦 **多存储策略** - localStorage / sessionStorage / 内存存储
- 🎯 **细粒度控制** - 按 key 前缀配置不同存储策略
- ⚛️ **React 集成** - 提供响应式 React Hooks
- 🏗️ **模块化架构** - 职责分离的清晰代码结构
- 🔧 **TypeScript 支持** - 完整的类型定义和智能提示

## 🏗️ 架构设计

### 核心组件

```
mf-shared/
├── src/
│   ├── store/
│   │   ├── GlobalStore.ts      # 主存储协调器
│   │   ├── index.ts           # 统一API接口
│   │   ├── hooks.ts           # React Hooks
│   │   └── types.ts           # 类型定义
│   ├── utils/
│   │   └── encryption.ts      # 加密工具
│   └── index.tsx              # 模块入口
└── dist/                      # 构建输出
```

### 存储系统架构

- **StorageCore** - 内存数据管理和嵌套路径操作
- **PersistenceManager** - 数据持久化存储管理
- **SubscriptionManager** - 事件订阅和通知系统
- **SyncManager** - 跨Tab同步通信管理
- **GlobalStore** - 统一协调各个管理器

## 🚀 快速开始

### 安装与运行

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建
pnpm run build

# 组件文档
pnpm run storybook
```

### 基本使用

#### 1. 初始化存储（主应用）

```typescript
import { initGlobalStore } from 'mfShared/store';

// 在主应用中初始化
initGlobalStore({
  enablePersistence: true,
  enableEncryption: true,
  storageKey: 'my-app-store'
});
```

#### 2. 基础数据操作

```typescript
import { getStoreValue, setStoreValue } from 'mfShared/store';

// 存储数据（支持嵌套路径）
setStoreValue('user.profile.name', 'John Doe');
setStoreValue('app.theme', 'dark');

// 读取数据
const userName = getStoreValue('user.profile.name');
const theme = getStoreValue('app.theme');
```

#### 3. React Hooks 集成

```typescript
import { useStoreValue, useStoreSubscription } from 'mfShared/store';

function UserProfile() {
  // 响应式数据绑定
  const [userName, setUserName] = useStoreValue<string>('user.profile.name');
  
  return (
    <input 
      value={userName || ''} 
      onChange={(e) => setUserName(e.target.value)} 
    />
  );
}

function ThemeProvider() {
  // 订阅数据变化
  useStoreSubscription('app.theme', (key, newValue) => {
    console.log(`Theme changed to: ${newValue}`);
    document.body.className = `theme-${newValue}`;
  });
  
  return <div>Theme Provider</div>;
}
```

#### 4. 数据订阅

```typescript
import { subscribeStore } from 'mfShared/store';

// 订阅特定数据变化
const unsubscribe = subscribeStore('user.profile', (key, newValue, oldValue) => {
  console.log(`User profile updated:`, { key, newValue, oldValue });
});

// 取消订阅
unsubscribe();
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

// 缓存数据：仅内存
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

### 跨应用数据同步

```typescript
// 主应用设置语言
setStoreValue('app.language', 'en-US');

// 子应用自动同步
const language = getStoreValue('app.language'); // 'en-US'

// 实时监听变化
subscribeStore('app.language', (key, newLang) => {
  i18n.changeLanguage(newLang);
});
```

## 📚 API 参考

### 核心 API

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `initGlobalStore(options?)` | 初始化全局存储 | `StoreOptions` | `void` |
| `getStoreValue<T>(key)` | 获取存储值 | `string` | `T \| undefined` |
| `setStoreValue(key, value, callback?)` | 设置存储值 | `string, any, StoreSubscriber?` | `void` |
| `subscribeStore(key, callback)` | 订阅数据变化 | `string, StoreSubscriber` | `() => void` |
| `unsubscribeStore(key, callback)` | 取消订阅 | `string, StoreSubscriber` | `void` |
| `configureStoreStrategy(prefix, strategy)` | 配置存储策略 | `string, StorageStrategy` | `void` |
| `clearStore()` | 清空所有数据 | - | `void` |
| `clearAppData(appKey)` | 清理特定应用数据 | `string` | `void` |

### React Hooks

| Hook | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `useStoreValue<T>(key)` | 响应式存储值 | `string` | `[T \| undefined, (value: T) => void]` |
| `useStoreSubscription(key, callback)` | 订阅数据变化 | `string, StoreSubscriber` | `void` |

### 类型定义

```typescript
interface StoreOptions {
  enablePersistence?: boolean;  // 启用持久化
  enableEncryption?: boolean;   // 启用加密
  storageKey?: string;         // 存储键名
}

interface StorageStrategy {
  medium: 'memory' | 'local' | 'session';  // 存储介质
  encrypted?: boolean;                     // 是否加密
}

type StoreSubscriber = (
  key: string,
  newValue: any,
  oldValue: any
) => void;
```

## 🛠️ 技术栈

- **Module Federation 2.0** - 微前端架构
- **React 19** - UI 框架  
- **TypeScript 5.9** - 类型安全
- **Rsbuild 1.4** - 现代构建工具
- **Biome 1.9** - 代码检查和格式化
- **Storybook 8.6** - 组件文档

## 📝 开发命令

```bash
# 开发相关
pnpm run dev              # 开发模式 (端口 2999)
pnpm run build            # 构建生产版本
pnpm run storybook        # 启动组件文档 (端口 6006)

# 代码质量
pnpm run lint             # 代码检查
pnpm run lint:fix         # 自动修复代码问题
pnpm run format           # 格式化代码
pnpm run format:check     # 检查代码格式
pnpm run type-check       # TypeScript 类型检查
pnpm run code-quality     # 完整代码质量检查

# 构建相关
pnpm run build:storybook  # 构建 Storybook 文档
```

## 🔧 配置文件

- `rsbuild.config.ts` - Rsbuild 构建配置
- `rslib.config.ts` - 库构建配置
- `module-federation.config.ts` - Module Federation 配置
- `biome.jsonc` - 代码质量配置
- `tsconfig.json` - TypeScript 配置

## 🌟 最佳实践

### 1. 数据结构设计

```typescript
// 推荐的数据结构
setStoreValue('app.config', {
  theme: 'dark',
  language: 'zh-CN',
  layout: 'sidebar'
});

setStoreValue('user.profile', {
  id: '123',
  name: 'John Doe',
  avatar: 'https://...'
});
```

### 2. 存储策略规划

```typescript
// 应用配置：本地持久化
configureStoreStrategy('app.', {
  medium: 'local',
  encrypted: false
});

// 用户敏感数据：加密存储
configureStoreStrategy('user.', {
  medium: 'local', 
  encrypted: true
});

// 临时状态：会话存储
configureStoreStrategy('temp.', {
  medium: 'session'
});
```

### 3. 性能优化

- 使用具体的订阅路径，避免订阅根路径
- 合理使用存储策略，避免不必要的持久化
- 在组件卸载时及时取消订阅

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Made with ❤️ for Micro Frontend Architecture**
