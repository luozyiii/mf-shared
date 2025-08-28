import React from 'react';
import ReactDOM from 'react-dom/client';
import Provider from './index';

// 创建根元素并渲染应用
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <Provider />
  </React.StrictMode>
);
