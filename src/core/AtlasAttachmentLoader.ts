import { AttachmentLoader } from "./attachments/AttachmentLoader";
import { BoundingBoxAttachment } from "./attachments/BoundingBoxAttachment";
import { ClippingAttachment } from "./attachments/ClippingAttachment";
import { MeshAttachment } from "./attachments/MeshAttachment";
import { PathAttachment } from "./attachments/PathAttachment";
import { PointAttachment } from "./attachments/PointAttachment";
import { RegionAttachment } from "./attachments/RegionAttachment";
import { Skin } from "./Skin";
import { TextureAtlas } from "./TextureAtlas";

/** An {@link AttachmentLoader} that configures attachments using texture regions from an {@link TextureAtlas}.
 *
 * See [Loading skeleton data](http://esotericsoftware.com/spine-loading-skeleton-data#JSON-and-binary-data) in the
 * Spine Runtimes Guide. */
export class AtlasAttachmentLoader implements AttachmentLoader {
	atlas: TextureAtlas;

	constructor (atlas: TextureAtlas) {
		this.atlas = atlas;
	}

	newRegionAttachment (skin: Skin, name: string, path: string): RegionAttachment {
		let region = this.atlas.findRegion(path);
		if (region == null) throw new Error("Region not found in atlas: " + path + " (region attachment: " + name + ")");
		region.renderObject = region;
		let attachment = new RegionAttachment(name);
		attachment.setRegion(region);
		return attachment;
	}

	newMeshAttachment (skin: Skin, name: string, path: string) : MeshAttachment {
		let region = this.atlas.findRegion(path);
		if (region == null) throw new Error("Region not found in atlas: " + path + " (mesh attachment: " + name + ")");
		region.renderObject = region;
		let attachment = new MeshAttachment(name);
		attachment.region = region;
		return attachment;
	}

	newBoundingBoxAttachment (skin: Skin, name: string) : BoundingBoxAttachment {
		return new BoundingBoxAttachment(name);
	}

	newPathAttachment (skin: Skin, name: string): PathAttachment {
		return new PathAttachment(name);
	}

	newPointAttachment(skin: Skin, name: string): PointAttachment {
		return new PointAttachment(name);
	}

	newClippingAttachment(skin: Skin, name: string): ClippingAttachment {
		return new ClippingAttachment(name);
	}
}