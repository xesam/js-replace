const { replace } = require('js-replace');

App({
    onLaunch() {
        // 启动时自检：replace/restore 在小程序运行时里能否正确工作
        const host = { greet: () => 'hello' };
        const restore = replace(host, () => 'hi', 'greet');
        const replaced = host.greet();
        restore();
        const restored = host.greet();
        console.log('[sample] replace ->', replaced, 'restore ->', restored);
        if (replaced !== 'hi' || restored !== 'hello') {
            console.error('[sample] js-replace 自检失败');
        }
    }
});
