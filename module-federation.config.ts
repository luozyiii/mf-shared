import {createModuleFederationConfig} from '@module-federation/rsbuild-plugin';

export default createModuleFederationConfig({
  name: 'mfShared', // 使用有效的标识符
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
})
