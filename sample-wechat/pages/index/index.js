const { replace } = require('js-replace');

Page({
    data: {
        rows: []
    },

    onRunLocal() {
        // 演示：替换本地对象的方法，再 restore
        const host = { greet: () => 'hello' };
        const before = host.greet();
        const restore = replace(host, () => 'hi', 'greet');
        const replaced = host.greet();
        restore();
        const after = host.greet();

        this.setData({
            rows: [
                { label: '替换前 host.greet()', value: String(before) },
                { label: '替换后 host.greet()', value: String(replaced) },
                { label: 'restore 后 host.greet()', value: String(after) }
            ]
        });
    },

    onRunWx() {
        // 演示：临时 patch 一个 wx 方法并立即 restore（小程序场景的核心用法）
        const original = wx.getSystemInfoSync;
        const restore = replace(wx, () => ({ mocked: true }), 'getSystemInfoSync');
        const replaced = wx.getSystemInfoSync();
        restore();
        const after = wx.getSystemInfoSync();

        this.setData({
            rows: [
                { label: '替换 wx.getSystemInfoSync()', value: JSON.stringify(replaced) },
                { label: 'restore 后 wx.getSystemInfoSync()', value: '已恢复（含 platform 等真实字段）' },
                { label: 'restore 是否还原原函数', value: String(wx.getSystemInfoSync === original) }
            ]
        });
    },

    onRunFalsy() {
        // 演示：falsy 原始值（0）也能正确恢复
        const host = { count: 0 };
        const restore = replace(host, () => 99, 'count');
        const replaced = host.count;
        restore();
        const after = host.count;

        this.setData({
            rows: [
                { label: '原始 host.count', value: '0' },
                { label: '替换后 host.count', value: String(replaced) },
                { label: 'restore 后 host.count', value: String(after) }
            ]
        });
    }
});
