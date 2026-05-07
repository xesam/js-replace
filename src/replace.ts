type AnyFn = (...args: any[]) => any;

/**
 * Replace a function on `host[key]` with `fn`, returning a `restore()` that
 * returns `host` to its exact pre-replacement state (original property
 * descriptor included, or the property removed if it never existed).
 *
 * `restore()` is truly idempotent: subsequent calls are no-ops and will not
 * clobber values written by anyone else after the first restore.
 */
export function replace(host: object, fn: AnyFn, key?: string | symbol): () => void {
    const name = key ?? fn.name;
    if (!name) {
        throw new TypeError('replace: function has no name, pass an explicit key as the third argument');
    }

    const hadOriginal = Object.prototype.hasOwnProperty.call(host, name);
    // Capture the original descriptor so accessors / non-enumerable / readonly
    // properties are restored verbatim, not flattened to a data property.
    const originalDescriptor = hadOriginal ? Object.getOwnPropertyDescriptor(host, name) : undefined;

    Object.defineProperty(host, name, {
        value: fn,
        writable: false,
        configurable: true,
        enumerable: true
    });

    let restored = false;
    return () => {
        if (restored) {
            return;
        }
        restored = true;
        if (hadOriginal && originalDescriptor) {
            Object.defineProperty(host, name, originalDescriptor);
        } else {
            delete (host as any)[name];
        }
    };
}
