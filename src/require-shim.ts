declare global
{
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-var
    var require: any;
    // eslint-disable-next-line no-var
    var PIXI: any;
}

if (typeof window !== 'undefined' && window.PIXI)
{
    const prevRequire = window.require;

    // eslint-disable-next-line consistent-return
    (window as any).require = (x: string) =>
    {
        if (prevRequire) return prevRequire(x);
        else if (x.startsWith('@pixi/') || x.startsWith('pixi.js')) return window.PIXI;
    };
}

export { };