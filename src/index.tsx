import React from 'react';
import './index.css';

// 导出存储系统
export * from './store';
export { default as GlobalStore } from './store';

const Provider: React.FC = () => {
  return (
    <div className="container">
      <div className="icon-container">
        <img src="https://module-federation.io/svg.svg" alt="logo" className="logo-image" />
      </div>
      <h1 className="title">MF-Shared 共享模块</h1>
      <div className="description">
        <p>这是一个微前端共享模块，提供以下功能：</p>
        <ul>
          <li>🗄️ 全局状态管理</li>
          <li>🔐 数据加密存储</li>
          <li>💾 本地持久化</li>
          <li>🔄 跨应用数据同步</li>
          <li>📡 事件订阅机制</li>
        </ul>
        <p>此模块通过 Module Federation 2.0 技术， 可以被其他微前端应用动态加载和使用。</p>
        <div className="links">
          <a
            href="https://github.com/luozyiii/micro-frontend-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            📚 查看源码
          </a>
          <a href="https://luozyiii.github.io/mf-shell/" target="_blank" rel="noopener noreferrer">
            🚀 主应用演示
          </a>
        </div>
      </div>
    </div>
  );
};

export default Provider;
