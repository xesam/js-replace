# js-replace

一个零依赖、极简的函数替换/恢复工具：把任意函数挂到宿主对象的指定 key 上，返回一个 `restore()` 函数把宿主恢复到替换前的状态。为小程序等受限运行时提供 sinon 不可用时的正确 monkey-patch 解法。

## 1. 背景

在小程序（微信、支付宝等）和其他受限的 JavaScript 运行时环境中，开发者经常需要在运行时替换宿主对象上的方法——例如 patch 原生 API、在测试中替换依赖、或在插件系统中拦截调用。

主流工具（sinon、jest.spyOn）在小程序环境中无法使用，而手写 monkey-patch 逻辑又容易出错：原始值丢失、falsy 值处理不当、全局污染等问题频发。`js-replace` 提供一个正确、最小、零依赖的解法。

### 定位与非目标

- 一个极简的函数替换/恢复工具。零运行时依赖，支持 ESM、CJS、小程序三端输出。
- **不**提供 before/after hook（拦截器模式）。
- **不**提供 spy/mock/断言功能。
- **不**替代 sinon 或 jest.spyOn。

## 2. Usage

先在项目里安装，再在小程序开发者工具中开启/构建一次 npm（各平台入口不同）：

- 微信小程序：https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html
- 支付宝小程序：https://opendocs.alipay.com/mini/ide/npm-manage
- 抖音小程序：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/framework/npm

```
npm install js-replace
```

发布产物同时支持 CommonJS 与 ES Module，按项目的构建方式任选一种写法：

```js
// CommonJS（小程序里用这种）
const { replace } = require('js-replace');

// ES Module（具名导入）
import { replace } from 'js-replace';
```

### 基本用法

```typescript
import { replace } from 'js-replace';

// 基本用法：替换后调用 restore 恢复
const obj = { greet: () => 'hello' };
const restore = replace(obj, () => 'hi', 'greet');

obj.greet(); // 'hi'
restore();
obj.greet(); // 'hello'
```

```typescript
// 省略 key 时自动使用 fn.name
function greet() {
    return 'hi';
}
const restore = replace(obj, greet);

obj.greet(); // 'hi'
restore(); // 恢复
```

```typescript
// 小程序场景：patch wx.request
const restore = replace(wx, mockRequest, 'request');
// ... 测试逻辑 ...
restore(); // 恢复原始 wx.request
```

```typescript
// symbol key
const key = Symbol('handler');
const restore = replace(host, fn, key);
restore();
```

### 错误情况

```typescript
// 匿名函数不传 key → 抛出 TypeError（而非静默失败）
replace(host, () => {});
// TypeError: replace: function has no name, pass an explicit key as the third argument
```

## 3. API

```typescript
function replace(host: object, fn: (...args: any[]) => any, key?: string | symbol): () => void;
```

| 参数   | 类型                      | 必填 | 说明                           |
| ------ | ------------------------- | ---- | ------------------------------ |
| `host` | `object`                  | 是   | 宿主对象                       |
| `fn`   | `(...args: any[]) => any` | 是   | 要替换的函数                   |
| `key`  | `string \| symbol`        | 否   | 挂载 key，省略时使用 `fn.name` |

**返回值**：`restore()` 函数，调用后将 `host` 恢复到替换前的状态。

### 正确性约定

- 原始值为 falsy（`0`、`false`、`''`、`null`）时，restore 必须正确恢复。
- 匿名函数且未指定 key 时，明确抛出 `TypeError`。
- `restore()` 多次调用幂等——首次 restore 后再次调用为真 no-op，不会覆盖期间他人对该 key 的写入。
- restore 还原**完整的原始属性描述符**（accessor / non-enumerable / readonly），而非仅还原值。
- 不依赖 `Object.hasOwn` 等 ES2022 运行时 API，保证小程序等受限环境兼容。
- `host` 为必填参数，不提供全局默认值（避免意外污染 `globalThis`）。
- **同一 `(host, key)` 不要重复 `replace`**：本库不维护替换栈，每次 `replace` 独立快照"当前描述符"作为自己的 original。若对同一 key 连续 replace，第二次会把"第一次替换进去的函数"当作原始值存下，两次 `restore()` 彼此不感知。必须嵌套时，`restore()` 须严格按 **LIFO（后进先出）** 顺序调用才能还原到真正的原始值；按调用顺序（FIFO）restore 会泄漏中间函数，且在原始属性本不存在时会**重新创建已被删除的属性**。

## 4. 平台差异

- **微信小程序**：开发者工具「详情 → 使用 npm 模块」开启后，「工具 → 构建 npm」。本库 `miniprogram` 字段指向 `dist/cjs`，构建产物取该目录的纯 CJS 单文件。
- **支付宝小程序**：在 IDE 里「npm 模块管理」中安装/构建。本库为纯 CJS/ESM 产物，无运行时依赖，可直接消费。
- **抖音小程序**：见抖音 npm 文档。消费方式同上。
- 任意标准 Node.js / 打包器环境也可直接 `require` / `import` 使用，`exports` 已提供双格式条件导出与各自 `.d.ts`。

## 5. 开发 / 构建

```
npm install
npm run build    # 产出 dist/cjs + dist/esm（双格式，依赖已内联，各自 .d.ts）
npm test         # jest + esbuild transform
npm run test:dist   # 双格式产物冒烟（node 跑 CJS 与 ESM 产物）
```

产物布局：

```
dist/
├── cjs/
│   ├── index.js          # CommonJS（自包含单文件）
│   ├── index.d.ts
│   ├── index.js.map
│   └── package.json      # {"type":"commonjs"}
└── esm/
    ├── index.js          # ES Module（自包含单文件）
    ├── index.d.ts
    ├── index.js.map
    └── package.json      # {"type":"module"}
```

`miniprogram: "dist/cjs"` 指向 CJS 产物，微信开发者工具「构建 npm」从该目录取文件。零运行时依赖，`src/replace.ts` 被内联进单文件，小程序无需解析依赖树。

## 6. 样例

见 `sample-wechat/`（微信）。在微信开发者工具里打开**仓库根目录**（不是 sample 目录）联调：

1. 库根 `npm run build` 出 `dist/cjs` + `dist/esm`。
2. `cd sample-wechat && npm install`（让 `file:..` 链接生效）。
3. 开发者工具打开仓库根目录。
4. 「工具 → 构建 npm」，成功后 `sample-wechat/` 下出现 `miniprogram_npm/`。
5. 预览/真机调试 sample 页面，验证 `replace` / `restore` 行为。

> sample 里的 `project.config.json` 默认用 `touristappid`（免 appid 体验模式）。若需要真机预览，替换为你自己的测试 appid。
