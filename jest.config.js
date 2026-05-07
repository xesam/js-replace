module.exports = {
    transform: {
        '^.+\\.tsx?$': '<rootDir>/jest.transform.js'
    },
    roots: ['<rootDir>/src', '<rootDir>/test'],
    testMatch: ['**/?(*.)+(spec|test).ts'],
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html']
};
