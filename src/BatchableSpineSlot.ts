import { AttachmentCacheData, Spine } from './Spine';

import type { Batch, Batcher, BLEND_MODES, DefaultBatchableMeshElement, Matrix, Texture } from 'pixi.js';

export class BatchableSpineSlot implements DefaultBatchableMeshElement
{
    indexOffset = 0;
    attributeOffset = 0;

    indexSize: number;
    attributeSize: number;

    batcherName = 'darkTint';

    readonly packAsQuad = false;

    renderable: Spine;

    positions: Float32Array;
    indices: number[] | Uint16Array;
    uvs: Float32Array;

    roundPixels: 0 | 1;
    data: AttachmentCacheData;
    blendMode: BLEND_MODES;

    darkTint: number;

    texture: Texture;

    transform: Matrix;

    // used internally by batcher specific..
    // stored for efficient updating..
    _textureId: number;
    _attributeStart: number;
    _indexStart: number;
    _batcher: Batcher;
    _batch: Batch;

    get color()
    {
        const slotColor = this.data.color;

        const parentColor:number = this.renderable.groupColor;
        const parentAlpha:number = this.renderable.groupAlpha;
        let abgr:number;

        const mixedA = (slotColor.a * parentAlpha) * 255;

        if (parentColor !== 0xFFFFFF)
        {
            const parentB = (parentColor >> 16) & 0xFF;
            const parentG = (parentColor >> 8) & 0xFF;
            const parentR = parentColor & 0xFF;

            const mixedR = (slotColor.r * parentR);
            const mixedG = (slotColor.g * parentG);
            const mixedB = (slotColor.b * parentB);

            abgr = ((mixedA) << 24) | (mixedB << 16) | (mixedG << 8) | mixedR;
        }
        else
        {
            abgr = ((mixedA) << 24) | ((slotColor.b * 255) << 16) | ((slotColor.g * 255) << 8) | (slotColor.r * 255);
        }

        return abgr;
    }

    get darkColor()
    {
        const darkColor = this.data.darkColor;

        return ((darkColor.b * 255) << 16) | ((darkColor.g * 255) << 8) | (darkColor.r * 255);
    }

    get groupTransform() { return this.renderable.groupTransform; }

    setData(
        renderable:Spine,
        data:AttachmentCacheData,
        blendMode:BLEND_MODES,
        roundPixels: 0 | 1)
    {
        this.renderable = renderable;
        this.transform = renderable.groupTransform;
        this.data = data;

        if (data.clipped)
        {
            const clippedData = data.clippedData;

            this.indexSize = clippedData.indicesCount;
            this.attributeSize = clippedData.vertexCount;
            this.positions = clippedData.vertices;
            this.indices = clippedData.indices;
            this.uvs = clippedData.uvs;
        }
        else
        {
            this.indexSize = data.indices.length;
            this.attributeSize = data.vertices.length / 2;
            this.positions = data.vertices;
            this.indices = data.indices;
            this.uvs = data.uvs;
        }

        this.texture = data.texture;
        this.roundPixels = roundPixels;

        this.blendMode = blendMode;

        this.batcherName = data.darkTint ? 'darkTint' : 'default';
    }
}