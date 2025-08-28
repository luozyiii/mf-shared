import { createModuleFederationConfig } from '@module-federation/rsbuild-plugin';
import pkg from './package.json';

// 统一的 Module Federation 配置
const baseConfig = {
  name: 'mfShared',
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
};

// 为不同构建目标创建配置
export const createMfConfig = (options: {
  filename?: string;
  assetPrefix?: string;
} = {}) => {
  return createModuleFederationConfig({
    ...baseConfig,
    filename: options.filename || 'remoteEntry.js',
    ...(options.assetPrefix && {
      // 仅在提供 assetPrefix 时添加
      library: { type: 'var', name: baseConfig.name },
    }),
  });
};

// 默认导出（向后兼容）
export default createMfConfig();
