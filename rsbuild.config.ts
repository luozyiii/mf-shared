import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { createMfConfig } from './module-federation.config';

export default defineConfig({
  html: {
    title: 'MF-Shared - 微前端共享模块',
    template: './public/index.html',
  },
  plugins: [
    pluginReact(),
    pluginModuleFederation(createMfConfig({
      filename: 'remoteEntry.js',
    })),
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
  },
});
