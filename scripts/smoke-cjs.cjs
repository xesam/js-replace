const { replace } = require('../dist/cjs/index.js');

const host = { greet: () => 'hello' };
const restore = replace(host, () => 'hi', 'greet');
const replaced = host.greet();
restore();
const restored = host.greet();
if (replaced !== 'hi' || restored !== 'hello') {
    console.error(`CJS smoke failed: replaced=${replaced}, restored=${restored}`);
    process.exit(1);
}
console.log('CJS OK:', replaced, '->', restored);
