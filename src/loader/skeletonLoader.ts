import {
    type AssetExtension,
    checkExtension,
    DOMAdapter,
    extensions,
    ExtensionType,
    LoaderParserPriority,
    ResolvedAsset,
    path,
    Assets
} from 'pixi.js';
import { SkeletonBinary, SkeletonData, SkeletonJson, TextureAtlas, AtlasAttachmentLoader } from '../core';
import { ISpineAtlasMetadata, ISpineMetadata } from './atlasLoader'

type SkeletonJsonAsset = any;
type SkeletonBinaryAsset = Uint8Array;

function isJson(resource: any): resource is SkeletonJsonAsset
{
    return Object.prototype.hasOwnProperty.call(resource, 'bones');
}

function isBuffer(resource: any): resource is SkeletonBinaryAsset
{
    return resource instanceof Uint8Array;
}

export interface ISpineResource{
    spineData: SkeletonData;
    spineAtlas: TextureAtlas;
}

const spineLoaderExtension: AssetExtension<SkeletonJsonAsset | SkeletonBinaryAsset, ISpineMetadata> = {
    extension: ExtensionType.Asset,

    loader:{
        extension: {
            type: ExtensionType.LoadParser,
            priority: LoaderParserPriority.Normal,
            name: 'spineSkeletonLoader',
        },

        test(url) {
            return checkExtension(url, '.skel');
        },

        async load(url: string): Promise<SkeletonBinaryAsset>
        {
            const response = await DOMAdapter.get().fetch(url);
            const buffer = new Uint8Array(await response.arrayBuffer());
            return buffer;
        },

        testParse(asset: unknown, options: ResolvedAsset): Promise<boolean>{
            const isJsonSpineModel = checkExtension(options.src, '.json') && isJson(asset);
            const isBinarySpineModel = checkExtension(options.src, '.skel') && isBuffer(asset);

            return Promise.resolve(isJsonSpineModel || isBinarySpineModel);
        },

        async parse(asset: SkeletonJsonAsset | SkeletonBinaryAsset, loadAsset, loader): Promise<ISpineResource> {
            const fileExt = path.extname(loadAsset.src).toLowerCase();
            const fileName = path.basename(loadAsset.src, fileExt);
            let basePath = path.dirname(loadAsset.src);

            if (basePath && basePath.lastIndexOf('/') !== basePath.length - 1) {
                basePath += '/';
            }

            const metadata = (loadAsset.data || {}) as ISpineMetadata;

            const atlasPath = `${basePath + fileName}.atlas`;
            const textureAtlas = await loader.load<TextureAtlas>({
                src : atlasPath,
                data : metadata,
                alias : metadata.spineAtlasAlias
            });

            const attachmentLoader = new AtlasAttachmentLoader(textureAtlas);
            const parser = asset instanceof Uint8Array
                ? new SkeletonBinary(attachmentLoader)
                : new SkeletonJson(attachmentLoader);
            const skeletonData = parser.readSkeletonData(asset);

            return {
                spineData: skeletonData,
                spineAtlas: textureAtlas,
            };
        },

    },
    
} as AssetExtension<SkeletonJsonAsset | SkeletonBinaryAsset, ISpineMetadata>;

extensions.add(spineLoaderExtension);