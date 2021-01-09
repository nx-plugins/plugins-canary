module.exports = {
    displayName: 'i18n-core',
    preset: './jest.preset.js',
    globals: {
      'ts-jest': {
        tsConfig: './tsconfig.spec.json',
      },
    },
    transform: {
      '^.+\\.[tj]sx?$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    coverageDirectory: '../../../coverage/packages/i18n/core',
  };
  