module.exports = function (config) {
    config.set({
        mutator: 'typescript',
        packageManager: 'yarn',
        testRunner: 'command',
        commandRunner: {
            command: "nx run i18n-core:test"
        },
        plugins: [
            "@stryker-mutator/jest-runner",
            "@stryker-mutator/html-reporter"
        ],
        coverageAnalysis: 'off',
        files: [
            './packages/i18n/core/src/**/*.ts',
            './packages/i18n/core/src/*.ts',
            './tsconfig.base.json',
            './jest.config.js',
            './jest.preset.js',
            './babel.config.json',
            './nx.json',
            './package.json',
            './workspace.json'
        ],
        mutate: [
            // './packages/i18n/core/src/**/*.ts',
            './packages/i18n/core/src/*.ts',
            '!./packages/i18n/core/src/*.spec.ts',
        ],
        fileLogLevel: "trace",
        logLevel: "debug",
        timeoutMS: 500000,
        reporters: ['html']
    });
};
