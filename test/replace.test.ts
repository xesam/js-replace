import { replace } from '../src';

describe('replace', () => {
    let host: Record<string | symbol, any>;

    beforeEach(() => {
        host = {};
    });

    it('uses fn.name as key when key is omitted', () => {
        function greet() {
            return 'hi';
        }
        replace(host, greet);
        expect(host.greet()).toBe('hi');
    });

    it('uses custom key when provided', () => {
        replace(host, () => 42, 'getValue');
        expect(host.getValue()).toBe(42);
    });

    it('restores original value', () => {
        host.greet = () => 'hello';
        const restore = replace(host, () => 'hi', 'greet');
        expect(host.greet()).toBe('hi');
        restore();
        expect(host.greet()).toBe('hello');
    });

    it('restores falsy original value 0', () => {
        host.count = 0;
        const restore = replace(host, () => 99, 'count');
        restore();
        expect(host.count).toBe(0);
    });

    it('restores falsy original value false', () => {
        host.flag = false;
        const restore = replace(host, () => true, 'flag');
        restore();
        expect(host.flag).toBe(false);
    });

    it('restores falsy original value empty string', () => {
        host.label = '';
        const restore = replace(host, () => 'filled', 'label');
        restore();
        expect(host.label).toBe('');
    });

    it('deletes property when original did not exist', () => {
        const restore = replace(host, () => 'hi', 'greet');
        restore();
        expect('greet' in host).toBe(false);
    });

    it('works with symbol key', () => {
        const sym = Symbol('handler');
        const restore = replace(host, () => 'sym', sym);
        expect(host[sym]()).toBe('sym');
        restore();
        expect(host[sym]).toBeUndefined();
    });

    it('throws TypeError for anonymous function without key', () => {
        expect(() => replace(host, () => {})).toThrow(TypeError);
    });

    it('restore is idempotent', () => {
        const restore = replace(host, () => 'hi', 'greet');
        restore();
        expect(() => restore()).not.toThrow();
        expect('greet' in host).toBe(false);
    });

    it('restore is a true no-op on second call (does not clobber later writes)', () => {
        const restore = replace(host, () => 'hi', 'greet');
        restore();
        host.greet = () => 'later';
        restore(); // must be a no-op, leaving the later write intact
        expect(host.greet()).toBe('later');
    });

    it('restores the original descriptor (accessor property)', () => {
        let backing = 'original';
        Object.defineProperty(host, 'greet', {
            get() {
                return backing;
            },
            set(v) {
                backing = v;
            },
            enumerable: false,
            configurable: true
        });
        const restore = replace(host, () => 'hi', 'greet');
        expect(host.greet()).toBe('hi');

        restore();
        const desc = Object.getOwnPropertyDescriptor(host, 'greet')!;
        expect(typeof desc.get).toBe('function');
        expect(typeof desc.set).toBe('function');
        expect(desc.enumerable).toBe(false);
        expect(host.greet).toBe('original');
        host.greet = 'changed';
        expect(backing).toBe('changed');
        expect(host.greet).toBe('changed');
    });

    it('restores the original descriptor (non-enumerable data property)', () => {
        Object.defineProperty(host, 'hidden', {
            value: 42,
            writable: false,
            enumerable: false,
            configurable: true
        });
        const restore = replace(host, () => 99, 'hidden');
        expect(host.hidden()).toBe(99);

        restore();
        const desc = Object.getOwnPropertyDescriptor(host, 'hidden')!;
        expect(desc.value).toBe(42);
        expect(desc.writable).toBe(false);
        expect(desc.enumerable).toBe(false);
    });
});
