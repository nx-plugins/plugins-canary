/**
* @type {import('@stryker-mutator/api/core').StrykerOptions}
*/
module.exports =  {
        packageManager: 'yarn',
        testRunner: 'command',
        commandRunner: {
            command: "npm run nx run i18n-core:test"
        },
        coverageAnalysis: 'off',
        disableTypeChecks: "{packages,src,lib}/**/**/**/*.{js,ts,jsx,tsx,html,vue}",
        mutate: [
            './packages/i18n/core/src/*.ts',
            '!./packages/i18n/core/src/*.d.ts',
            '!./packages/i18n/core/src/*.spec.ts',
        ],
        // fileLogLevel: "trace",
        // logLevel: "debug",
        // timeoutMS: 500000,
        reporters: ['html','clear-text', 'progress']
};
