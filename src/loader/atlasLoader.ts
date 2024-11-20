import {
    checkExtension,
    DOMAdapter,
    extensions,
    ExtensionType,
    LoaderParserPriority,
    path,
    TextureSource,
} from "pixi.js";
import type { AssetExtension, Loader, ResolvedAsset, Texture as PIXITexture } from "pixi.js";
import { SpineTexture } from "../SpineTexture";
import { TextureAtlas } from "../core";

type RawAtlas = string;

export interface ISpineAtlasMetadata
{
    // If you are downloading an .atlas file, this metadata will go to the Texture loader
    imageMetadata?: any;
    // If you already have atlas pages loaded as pixi textures
    // and want to use that to create the atlas, you can pass them here
    images?: TextureSource | string | Record<string, TextureSource | string>;
}

export interface ISpineMetadata {
    // Passed directly to Spine's SkeletonJson/BinaryParser
    spineSkeletonScale?: number;
    // If you already have a TextureAtlas, you can pass it directly
    spineAtlas?: Partial<TextureAtlas>;
    // If you are going to download an .atlas file, you can specify an alias here for cache/future lookup
    spineAtlasAlias?: string[];
    // If you want to use a custom .atlas file, you can specify the path here. **It must be a .atlas file or you need your own parser!**
    spineAtlasFile?: string;
    // If for some reason, you have the raw text content of an .atlas file, and want to use it dump it here
    atlasRawData?: string;
    // If you are hardcore and can write your own loader function to load the textures for the atlas, you can pass it here
    imageLoader?: (loader: Loader, path: string) => (path: string, callback: (tex: TextureSource) => any) => any;
    // If you are downloading an .atlas file, this metadata will go to the Texture loader
    imageMetadata?: any;
    // If you already have atlas pages loaded as pixi textures and want to use that to create the atlas, you can pass them here
    images?: Record<string, TextureSource | string>;
    // If your spine only uses one atlas page and you have it as a pixi texture, you can pass it here
    image?: PIXITexture | TextureSource;
}

const spineTextureAtlasLoader: AssetExtension<RawAtlas | TextureAtlas, ISpineAtlasMetadata> = {
    extension: ExtensionType.Asset,

    loader: {
        extension: {
            type: ExtensionType.LoadParser,
            priority: LoaderParserPriority.Normal,
            name: 'spineTextureAtlasLoader',
        },
        test(url : string) : boolean {
            return checkExtension(url, '.atlas');
        },
        
        async load(url: string): Promise<RawAtlas>
        {
            const response = await DOMAdapter.get().fetch(url);

            const txt = await response.text();

            return txt as RawAtlas;
        },

        testParse(asset: unknown, options: ResolvedAsset): Promise<boolean>
        {
            const isExtensionRight = checkExtension(options.src as string, '.atlas');
            const isString = typeof asset === 'string';

            return Promise.resolve(isExtensionRight && isString);
        },

        async parse(asset: RawAtlas, options: ResolvedAsset, loader: Loader): Promise<TextureAtlas>{
            const metadata: ISpineMetadata = options.data || {};
            let basePath = path.dirname(options.src as string);

            if (basePath && basePath.lastIndexOf('/') !== basePath.length - 1) {
                basePath += '/';
            }
            
            // Retval is going to be a texture atlas. However, we need to wait for its callback to resolve this promise.
            let retval : TextureAtlas = new TextureAtlas(asset as RawAtlas);

            if (metadata.images instanceof TextureSource || typeof metadata.images === 'string') {
				const pixiTexture = metadata.images;

				metadata.images = {};
				metadata.images[retval.pages[0].name] = pixiTexture;
			}

            // we will wait for all promises for the textures at the same time at the end.
			const textureLoadingPromises: Promise<any>[] = [];

            // fill the pages
            for (const page of retval.pages) {
                const pageName = page.name;
				const providedPage = metadata?.images ? metadata.images[pageName] : undefined;

                // console.log(page)
                if (providedPage instanceof TextureSource) {
					page.setTexture(SpineTexture.from(providedPage));
				}
                else{
                    const url: string = providedPage ?? path.normalize([...basePath.split(path.sep), pageName].join(path.sep));
                    const pixiPromise = loader.load<PIXITexture>({
                        src : url,
                        data : {
                            ...metadata.imageMetadata,
                            alphaMode: page.pma ? 'premultiplied-alpha' : 'premultiply-alpha-on-upload'
                        }
                    }).then((texture)=>{
                        page.setTexture(SpineTexture.from(texture.source));
                    })

                    textureLoadingPromises.push(pixiPromise);
                }
            }
            
            await Promise.all(textureLoadingPromises);

            return retval;
        },

        unload(atlas: TextureAtlas)
        {
            atlas.dispose();
        },
    }
} as AssetExtension<RawAtlas | TextureAtlas, ISpineAtlasMetadata>;

extensions.add(spineTextureAtlasLoader);
