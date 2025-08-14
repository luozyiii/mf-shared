# MF-Shared - 微前端共享模块

[![Deploy to GitHub Pages](https://github.com/luozyiii/micro-frontend-app/actions/workflows/deploy-mf-shared.yml/badge.svg)](https://github.com/luozyiii/micro-frontend-app/actions/workflows/deploy-mf-shared.yml)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://luozyiii.github.io/mf-shared/)

一个基于 Module Federation 2.0 的微前端共享模块，提供全局状态管理、数据加密存储、跨应用数据同步等功能。

## ✨ 功能特性

- 🗄️ **全局状态管理** - 跨微前端应用的统一状态管理
- 🔐 **数据加密存储** - 支持敏感数据的加密存储
- 💾 **本地持久化** - 自动保存状态到本地存储
- 🔄 **跨应用数据同步** - 实时同步不同应用间的数据变化
- 📡 **事件订阅机制** - 灵活的数据变化监听和响应
- 🚀 **Module Federation 2.0** - 基于最新的模块联邦技术

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm run dev
```

访问 http://localhost:2999 查看演示页面

### 构建生产版本

```bash
pnpm run build
```

### 代码检查和格式化

```bash
# 检查代码
pnpm run check

# 自动修复
pnpm run check:fix

# 格式化代码
pnpm run format:fix
```

## 📦 模块暴露

该共享模块通过 Module Federation 暴露以下模块：

- `mf-shared` - 主模块，包含 React 组件
- `mf-shared/store` - 全局状态管理模块

## 🔧 使用方式

### 在其他微前端应用中使用

```typescript
// 动态导入存储模块
const { initGlobalStore, setStoreValue, getStoreValue, subscribeStore } = await import('mf-shared/store');

// 初始化全局存储
initGlobalStore({
  enablePersistence: true,
  enableEncryption: true,
  storageKey: 'my-app-store'
});

// 设置数据
setStoreValue('userInfo', { name: '张三', role: 'admin' });

// 获取数据
const userInfo = getStoreValue('userInfo');

// 订阅数据变化
const unsubscribe = subscribeStore('userInfo', (key, newVal, oldVal) => {
  console.log(`${key} 数据变化:`, { newVal, oldVal });
});
```

## 🏗️ 技术栈

- **React 18** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript
- **Rsbuild** - 现代化的构建工具
- **Module Federation 2.0** - 微前端架构
- **Biome** - 代码检查和格式化

## 📚 相关项目

- [MF-Shell](https://github.com/luozyiii/micro-frontend-app/tree/main/mf-shell) - 主应用
- [MF-Template](https://github.com/luozyiii/micro-frontend-app/tree/main/mf-template) - 子应用模板

## 🌐 在线演示

- [MF-Shared 演示](https://luozyiii.github.io/mf-shared/) - 共享模块演示
- [主应用演示](https://luozyiii.github.io/mf-shell/) - 完整的微前端应用

## 📄 许可证

MIT License

### Command

Build package

```
pnpm build
```

Dev package

1. 

```
pnpm mf-dev
```

2.

```
pnpm storybook
```

visit http://localhost:6006
