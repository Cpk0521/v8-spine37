import { Texture as PixiTexture } from 'pixi.js';
import { BlendMode, Texture, TextureFilter, TextureWrap } from './core';

import type { BLEND_MODES, SCALE_MODE, TextureSource, WRAP_MODE } from 'pixi.js';

export class SpineTexture extends Texture {

    private static readonly textureMap: Map<TextureSource, SpineTexture> = new Map<TextureSource, SpineTexture>();

    public static from(texture: TextureSource): SpineTexture
    {
        if (SpineTexture.textureMap.has(texture))
        {
            return SpineTexture.textureMap.get(texture) as SpineTexture;
        }

        return new SpineTexture(texture);
    }

    public readonly texture: PixiTexture;

    private constructor(image: TextureSource)
    {
        // Todo: maybe add error handling if you feed a video texture to spine?
        super(image.resource);
        this.texture = PixiTexture.from(image);
    }

    public setFilters(minFilter: TextureFilter, magFilter: TextureFilter): void
    {
        const style = this.texture.source.style;

        style.minFilter = SpineTexture.toPixiTextureFilter(minFilter);
        style.magFilter = SpineTexture.toPixiTextureFilter(magFilter);
        this.texture.source.autoGenerateMipmaps = SpineTexture.toPixiMipMap(minFilter);
        this.texture.source.updateMipmaps();
    }

    public setWraps(uWrap: TextureWrap, vWrap: TextureWrap): void
    {
        const style = this.texture.source.style;

        style.addressModeU = SpineTexture.toPixiTextureWrap(uWrap);
        style.addressModeV = SpineTexture.toPixiTextureWrap(vWrap);
    }

    public dispose(): void
    {
        // I am not entirely sure about this...
        this.texture.destroy();
    }

    private static toPixiMipMap(filter: TextureFilter): boolean
    {
        switch (filter)
        {
            case TextureFilter.Nearest:
            case TextureFilter.Linear:
                return false;

            case TextureFilter.MipMapNearestLinear:
            case TextureFilter.MipMapNearestNearest:
            case TextureFilter.MipMapLinearLinear: // TextureFilter.MipMapLinearLinear == TextureFilter.MipMap
            case TextureFilter.MipMapLinearNearest:
                return true;

            default:
                throw new Error(`Unknown texture filter: ${String(filter)}`);
        }
    }

    private static toPixiTextureFilter(filter: TextureFilter): SCALE_MODE
    {
        switch (filter)
        {
            case TextureFilter.Nearest:
            case TextureFilter.MipMapNearestLinear:
            case TextureFilter.MipMapNearestNearest:
                return 'nearest';

            case TextureFilter.Linear:
            case TextureFilter.MipMapLinearLinear: // TextureFilter.MipMapLinearLinear == TextureFilter.MipMap
            case TextureFilter.MipMapLinearNearest:
                return 'linear';

            default:
                throw new Error(`Unknown texture filter: ${String(filter)}`);
        }
    }

    private static toPixiTextureWrap(wrap: TextureWrap): WRAP_MODE
    {
        switch (wrap)
        {
            case TextureWrap.ClampToEdge:
                return 'clamp-to-edge';

            case TextureWrap.MirroredRepeat:
                return 'mirror-repeat';

            case TextureWrap.Repeat:
                return 'repeat';

            default:
                throw new Error(`Unknown texture wrap: ${String(wrap)}`);
        }
    }

    // Nothing to do
    public static toPixiBlending(blend: BlendMode): BLEND_MODES
    {
        switch (blend)
        {
            case BlendMode.Normal:
                return 'normal';

            case BlendMode.Additive:
                return 'add';

            case BlendMode.Multiply:
                return 'multiply';

            case BlendMode.Screen:
                return 'screen';

            default:
                throw new Error(`Unknown blendMode: ${String(blend)}`);
        }
    }
    
}