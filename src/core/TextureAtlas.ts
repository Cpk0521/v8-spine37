import { Disposable, Map} from "./Utils";
import { TextureFilter, TextureWrap, TextureRegion, Texture } from "./Texture";

export class TextureAtlas implements Disposable {
    pages = new Array<TextureAtlasPage>();
    regions = new Array<TextureAtlasRegion>();

    constructor(atlasText?: string) {
        if (atlasText) {
            this.addSpineAtlas(atlasText);
        }
    }

	addTexture(name: string, texture: Texture){
		const pages = this.pages;
		let page: TextureAtlasPage = null;

		for (let i = 0; i < pages.length; i++) {
			if (pages[i].texture === texture) {
				page = pages[i];
				break;
			}
		}

		if (!page) {
			page = new TextureAtlasPage(name);
			const baseTexture = texture;

			page.texture = baseTexture;
			// page.width = baseTexture.resourceWidth;
			// page.height = baseTexture.resourceHeight;

			page.minFilter = page.magFilter = TextureFilter.Nearest;
			page.uWrap = TextureWrap.ClampToEdge;
			page.vWrap = TextureWrap.ClampToEdge;

			pages.push(page);
		}

		const region = new TextureAtlasRegion(page, name);
		region.texture = page.texture;
		region.index = -1;
		this.regions.push(region);

        return region;
	}

	addTextureHash(textures: Map<Texture>, stripExtension: boolean){
 		for (const key in textures) {
            if (textures.hasOwnProperty(key)) {
                this.addTexture(stripExtension && key.indexOf('.') !== -1 ? key.substring(0, key.lastIndexOf('.')) : key, textures[key]);
            }
        }
	}

	addSpineAtlas(atlasText: string){
		return this.load(atlasText);
	}

	load(atlasText: string){

		const reader = new TextureAtlasReader(atlasText);
		const entry = new Array<string>(4);
	
		const pageFields : Map<(page: TextureAtlasPage) => void> = {
			size : (page: TextureAtlasPage) => {
				page.width = parseInt(entry[1]);
				page.height = parseInt(entry[2]);
			},
			format : (page: TextureAtlasPage) => {
			    // do nothing
			},
			filter : (page: TextureAtlasPage) => {
				page.minFilter = Texture.filterFromString(entry[1]);
				page.magFilter = Texture.filterFromString(entry[2]);	
			},
			repeat : (page: TextureAtlasPage) => {
				if (entry[1].indexOf('x') != -1) page.uWrap = TextureWrap.Repeat;
				if (entry[1].indexOf('y') != -1) page.vWrap = TextureWrap.Repeat;
			},
			pma : (page: TextureAtlasPage) => {
				page.pma = entry[1] == 'true';
			},
		}

		const regionFields : Map<(region: TextureAtlasRegion) => void> = {
		    xy : (region: TextureAtlasRegion) => {
				region.x = parseInt(entry[1]);
				region.y = parseInt(entry[2]);
			},
			size : (region: TextureAtlasRegion) => {
				region.width = parseInt(entry[1]);
				region.height = parseInt(entry[2]);
			},
			bounds : (region: TextureAtlasRegion) => {
				region.x = parseInt(entry[1]);
				region.y = parseInt(entry[2]);
				region.width = parseInt(entry[3]);
				region.height = parseInt(entry[4]);
			},
			offset : (region: TextureAtlasRegion) => {
				region.offsetX = parseInt(entry[1]);
				region.offsetY = parseInt(entry[2]);
			},
			orig : (region: TextureAtlasRegion) => {
				region.originalWidth = parseInt(entry[1]);
				region.originalHeight = parseInt(entry[2]);
			},
			offsets : (region: TextureAtlasRegion) => {
				region.offsetX = parseInt(entry[1]);
				region.offsetY = parseInt(entry[2]);
				region.originalWidth = parseInt(entry[3]);
				region.originalHeight = parseInt(entry[4]);
			},
			rotate : (region: TextureAtlasRegion) => {
				const rotateValue = entry[1];
				if(rotateValue.toLocaleLowerCase() == 'true'){
					region.degrees = 90;
				}else if (rotateValue.toLocaleLowerCase() == 'false'){
					region.degrees = 0;
				}
				else{
					region.degrees = parseFloat(rotateValue);
				}
				region.rotate = region.degrees == 90;
				// let rotate = 0;
				// if (rotateValue.toLocaleLowerCase() == 'true') {
				// 	rotate = 6;
				// } else if (rotateValue.toLocaleLowerCase() == 'false') {
				// 	rotate = 0;
				// } else {
				// 	rotate = ((720 - parseFloat(rotateValue)) % 360) / 45;
				// }
				// region.degrees = rotate;
			},
			index : (region: TextureAtlasRegion) => {
				region.index = parseInt(entry[1]);
			}
		}

		let line = reader.readLine();
		// Ignore empty lines before first entry.
		while (line != null && line.trim().length == 0) {
            line = reader.readLine();
        }
		// Header entries.
		while (true){
			if (line == null || line.trim().length == 0) break;
			if (reader.readEntry(entry, line) == 0) break;
			line = reader.readLine();
		}

		// Page and region entries.
		let page: TextureAtlasPage = null;
		// let region: RegionFields = null;
		let names: string[] | null = null;
		let values: number[][] | null = null;

		while (true) {
			if (line == null) { return; }

			if (line.trim().length == 0) {
				page = null;
				line = reader.readLine();
			} 
			else if (!page) {
				page = new TextureAtlasPage(line.trim());

				while (true) {
					if (reader.readEntry(entry, (line = reader.readLine())) == 0) break;
					const field: Function = pageFields[entry[0]];
					if (field) field(page);
				}
				this.pages.push(page);
			}
			else{
				// let region = new RegionFields();
				const atlasRegion = new TextureAtlasRegion(page, line);
				while (true) {
				    let count = reader.readEntry(entry, line = reader.readLine());
					if (count == 0) break;
					let field = regionFields[entry[0]];
					if (field) {
						field(atlasRegion);
					}
					else{
						if (!names) names = [];
						if (!values) values = [];
						names.push(entry[0]);
						let entryValues: number[] = [];
						for (let i = 0; i < count; i++)
							entryValues.push(parseInt(entry[i + 1]));
						values.push(entryValues);
					}
				}

				if (atlasRegion.originalWidth == 0 && atlasRegion.originalHeight == 0) {
					atlasRegion.originalWidth = atlasRegion.width;
					atlasRegion.originalHeight = atlasRegion.height;
				}

				if (names && names.length > 0 && values && values.length > 0) {
					atlasRegion.names = names;
					atlasRegion.values = values;
					names = null;
					values = null;
				}

				atlasRegion.u = atlasRegion.x / page.width;
				atlasRegion.v = atlasRegion.y / page.height;
				if(atlasRegion.rotate){
					atlasRegion.u2 = (atlasRegion.x + atlasRegion.height) / page.width;
					atlasRegion.v2 = (atlasRegion.y + atlasRegion.width) / page.height;
				}else{
					atlasRegion.u2 = (atlasRegion.x + atlasRegion.width) / page.width;
					atlasRegion.v2 = (atlasRegion.y + atlasRegion.height) / page.height;
				}

				this.regions.push(atlasRegion);
			}
		}

	}

	findRegion(name: string): TextureAtlasRegion {
        for (let i = 0; i < this.regions.length; i++) {
            if (this.regions[i].name == name) {
                return this.regions[i];
            }
        }

        return null;
    }

    dispose() {
        for (let i = 0; i < this.pages.length; i++) {
            this.pages[i].texture.dispose();
        }
    }
}

class TextureAtlasReader {
	lines: Array<string>;
	index: number = 0;

	constructor (text: string) {
		this.lines = text.split(/\r\n|\r|\n/);
	}

	readLine (): string {
		if (this.index >= this.lines.length)
			return null;
		return this.lines[this.index++];
	}

	readEntry(entry: string[], line: string): number {
		if (line == null) return 0;
        line = line.trim();
        if (line.length == 0) return 0;

        const colon = line.indexOf(':');
        if (colon == -1) return 0;

        entry[0] = line.substring(0, colon).trim();
        for (let i = 1, lastMatch = colon + 1; ; i++) {
            const comma = line.indexOf(',', lastMatch);

            if (comma == -1) {
                entry[i] = line.substring(lastMatch).trim();
                return i;
            }

            entry[i] = line.substring(lastMatch, comma).trim();
            lastMatch = comma + 1;
            if (i == 4) return 4;
        }
	}
}

export class TextureAtlasPage {
	name: string;
	minFilter: TextureFilter = TextureFilter.Nearest;;
	magFilter: TextureFilter = TextureFilter.Nearest;;
	uWrap: TextureWrap = TextureWrap.ClampToEdge;;
	vWrap: TextureWrap = TextureWrap.ClampToEdge;;
	texture: Texture | null = null; //Texture
	width: number = 0;
	height: number = 0;
	pma : boolean = true;
	regions = new Array<TextureAtlasRegion>();

	constructor (name: string) {
		this.name = name;
	}

	setTexture(texture : Texture){
		this.texture = texture;
		texture.setFilters(this.minFilter, this.magFilter);
		texture.setWraps(this.uWrap, this.vWrap);
		for (let region of this.regions){
			region.texture = texture;
		}
	}
}

export class TextureAtlasRegion extends TextureRegion {
	page: TextureAtlasPage;
	name: string;
	x: number = 0;
	y: number = 0;
	index: number = 0;
	degrees: number = 0;
	texture: Texture | null = null; //Texture
	names: string[] | null = null;
	values: number[][] | null = null;
	rotate : boolean = false;

	constructor(page : TextureAtlasPage, name : string){
		super();
		this.page = page;
		this.name = name;
		page.regions.push(this);
	}
}

// class RegionFields {
//     x = 0;
//     y = 0;
//     width = 0;
//     height = 0;
//     offsetX = 0;
//     offsetY = 0;
//     originalWidth = 0;
//     originalHeight = 0;
//     rotate = 0;
//     index = 0;
// }