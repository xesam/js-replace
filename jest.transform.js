const { transformSync } = require('esbuild');
const path = require('path');

module.exports = {
    process(sourceText, sourcePath) {
        const loader = path.extname(sourcePath) === '.ts' ? 'ts' : 'js';
        const { code, map } = transformSync(sourceText, {
            loader,
            format: 'cjs',
            target: 'node16',
            sourcefile: sourcePath,
            sourcemap: true
        });
        return { code, map };
    }
};
