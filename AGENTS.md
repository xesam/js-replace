# AGENTS.md

## What this is

`js-replace` 是一个零依赖的极简函数替换/恢复工具：把任意函数挂到宿主对象的指定 key 上，返回一个 `restore()` 函数恢复到替换前状态。为小程序等受限运行时提供 sinon 不可用时的正确 monkey-patch 解法。

整个库的核心是 `src/replace.ts`（约 20 行），`src/index.ts` 仅做 re-export。直接读 `src/replace.ts`，没有别的实现面。

## Commands

- 测试：`npm test`（jest + esbuild transform）
- 单测：`npx jest -t "<test name>"`
- 构建：`npm run build`（`rimraf dist && tsdown`，产出 `dist/cjs` + `dist/esm`，双格式 + 各自 `.d.ts`）
- 双格式产物冒烟：`npm run test:dist`（`node scripts/smoke-cjs.cjs && node scripts/smoke-esm.mjs`）
- 清理：`npm run clean`
- 风格：无 lint/format script。TS 库沿用 `@mini-dev/unipath` 约定——只配 prettier（`.prettierrc.json`），不配 eslint（`eslint:recommended` 无法解析 `.ts`，加 `@typescript-eslint` 又违背极简定位）。直接 `npx prettier --check .`。

## Architecture

- `replace(host, fn, key?)`：用 `Object.prototype.hasOwnProperty` 判定原始属性是否存在，保存**完整属性描述符**，`Object.defineProperty` 写入新函数（`writable:false, configurable:true`），返回闭包 `restore()`。
- `restore()` 用 `restored` 标志保证真幂等：首次调用还原原始描述符（accessor / non-enumerable / readonly 完整还原）或删除原本不存在的属性；后续调用为 no-op。
- 不依赖 `Object.hasOwn` 等 ES2022 运行时 API，保证小程序等受限环境兼容。
- 不提供 before/after hook、不提供 spy/mock/断言——只做 replace/restore。

## Build / packaging

- tsdown 双格式：`dist/cjs`（`{"type":"commonjs"}`）+ `dist/esm`（`{"type":"module"}`），每 pass `platform: 'neutral'`、`target: 'es2017'`，`.d.ts` 各格式就近产出。
- `miniprogram: "dist/cjs"` —— 微信开发者工具「构建 npm」从该目录取纯 CJS 单文件产物。
- 零运行时依赖，`src/replace.ts` 被内联进单文件 `index.js`，小程序无需解析依赖树。

## 小程序联调

`sample-wechat/` + 根 `project.config.json` 用于在微信开发者工具里手测：库根 `npm run build` → `cd sample-wechat && npm install` → 开发者工具打开仓库根 → 工具「构建 npm」→ 预览 sample。详见 README「样例」一节。
