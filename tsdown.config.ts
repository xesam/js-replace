import { defineConfig } from 'tsdown';
import { writeFileSync } from 'node:fs';

// 双格式产物：dist/cjs + dist/esm。每个 pass 就近产 .d.ts，并在该目录写 package.json
// 标记模块语义（{"type":"commonjs"}/{"type":"module"}），避免 dual-package hazard。
// platform: 'neutral' —— 不引入 Node 专属全局，让产物在小程序与 Node 都能跑。
// target 显式 es2017 —— 不依赖自动推断，保证小程序引擎兼容。
// 默认 bundle：把 src/replace.ts 内联进单文件 index.js，小程序「构建 npm」无需解析依赖树。
export default defineConfig([
    {
        entry: { index: 'src/index.ts' },
        format: ['cjs'],
        target: 'es2017',
        platform: 'neutral',
        outDir: 'dist/cjs',
        outExtensions: () => ({ js: '.js' }),
        dts: { sourcemap: true },
        sourcemap: true,
        clean: false,
        onSuccess: async () => {
            writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }, null, 2) + '\n');
        }
    },
    {
        entry: { index: 'src/index.ts' },
        format: ['esm'],
        target: 'es2017',
        platform: 'neutral',
        outDir: 'dist/esm',
        outExtensions: () => ({ js: '.js' }),
        dts: { sourcemap: true },
        sourcemap: true,
        clean: false,
        onSuccess: async () => {
            writeFileSync('dist/esm/package.json', JSON.stringify({ type: 'module' }, null, 2) + '\n');
        }
    }
]);
