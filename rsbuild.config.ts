import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  html: {
    title: 'MF-Shared - 微前端共享模块',
    template: './public/index.html',
    templateParameters: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      APP_DISPLAY_NAME: 'MF-Shared',
    },
  },
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'mfShared',
      filename: 'remoteEntry.js',
      exposes: {
        '.': './src/index.tsx',
        './store': './src/store/index.ts',
      },
      shared: {
        react: {
          singleton: true,
        },
        'react-dom': {
          singleton: true,
        },
      },
    }),
  ],
  server: {
    port: 2999,
  },
  output: {
    // GitHub Pages 部署配置
    assetPrefix:
      process.env.NODE_ENV === 'production'
        ? `/${process.env.PROJECT_NAME || 'mf-shared'}/`
        : '/',
  },
  source: {
    entry: {
      index: './src/main.tsx',
    },
    // 注入环境变量到应用中
    define: {
      // 基础环境变量
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.PUBLIC_URL': JSON.stringify(process.env.BASENAME || ''),

      // 应用配置
      'process.env.MODULE_NAME': JSON.stringify(process.env.MODULE_NAME || 'mfShared'),
      'process.env.APP_DISPLAY_NAME': JSON.stringify(process.env.APP_DISPLAY_NAME || 'MF共享模块'),
      'process.env.PROJECT_NAME': JSON.stringify(process.env.PROJECT_NAME || 'mf-shared'),
      'process.env.PORT': JSON.stringify(process.env.PORT || '2999'),

      // GitHub 配置
      'process.env.GITHUB_USERNAME': JSON.stringify(process.env.GITHUB_USERNAME || 'luozyiii'),

      // 注入到 window 对象，供运行时使用
      '__NODE_ENV__': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  },
});
