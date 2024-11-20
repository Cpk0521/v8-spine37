import {
    collectAllRenderables,
    extensions, ExtensionType,
    InstructionSet,
    type BLEND_MODES,
	type Container,
	type Renderer,
	type RenderPipe,
} from 'pixi.js';

import { BatchableSpineSlot } from './BatchableSpineSlot';
import { Spine } from './Spine';
import { MeshAttachment, RegionAttachment } from './core';

// const clipper = new SkeletonClipping();

const spineBlendModeMap: Record<number, BLEND_MODES> = {
	0: 'normal',
	1: 'add',
	2: 'multiply',
	3: 'screen'
};

type GpuSpineDataElement = { slotBatches: Record<string, BatchableSpineSlot> };

export class SpinePipe implements RenderPipe<Spine> {
	/** @ignore */
	static extension = {
		type: [
			ExtensionType.WebGLPipes,
			ExtensionType.WebGPUPipes,
			ExtensionType.CanvasPipes,
		],
		name: 'spine',
	} as const;

	renderer: Renderer;

	private gpuSpineData: Record<string, GpuSpineDataElement> = {};
	private readonly _destroyRenderableBound = this.destroyRenderable.bind(this) as (renderable: Container) => void;

	constructor (renderer: Renderer) {
		this.renderer = renderer;
	}

	validateRenderable (spine: Spine): boolean {
		spine._validateAndTransformAttachments();

		// if spine attachments have changed or destroyed, we need to rebuild the batch!
		if (spine.spineAttachmentsDirty) {
			return true;
		}

		// if the textures have changed, we need to rebuild the batch, but only if the texture is not already in the batch
		else if (spine.spineTexturesDirty) {
			// loop through and see if the textures have changed..
			const drawOrder = spine.skeleton.drawOrder;
			const gpuSpine = this.gpuSpineData[spine.uid];

			for (let i = 0, n = drawOrder.length; i < n; i++) {
				const slot = drawOrder[i];
				const attachment = slot.getAttachment();

				if (attachment instanceof RegionAttachment || attachment instanceof MeshAttachment) {
					const cacheData = spine._getCachedData(slot, attachment);
					const batchableSpineSlot = gpuSpine.slotBatches[cacheData.id];

					const texture = cacheData.texture;

                    console.log(texture)

					if (texture !== batchableSpineSlot.texture) {
						if (!batchableSpineSlot._batcher.checkAndUpdateTexture(batchableSpineSlot, texture)) {
							return true;
						}
					}
				}
			}
		}

		return false;
	}

	addRenderable (spine: Spine, instructionSet: InstructionSet) {
		const gpuSpine = this._getSpineData(spine);

		const batcher = this.renderer.renderPipes.batch;

		const drawOrder = spine.skeleton.drawOrder;

		const roundPixels = (this.renderer._roundPixels | spine._roundPixels) as 0 | 1;

		spine._validateAndTransformAttachments();

		for (let i = 0, n = drawOrder.length; i < n; i++) {
			const slot = drawOrder[i];
			const attachment = slot.getAttachment();
			const blendMode = spineBlendModeMap[slot.data.blendMode];

			if (attachment instanceof RegionAttachment || attachment instanceof MeshAttachment) {
				const cacheData = spine._getCachedData(slot, attachment);
				const batchableSpineSlot = gpuSpine.slotBatches[cacheData.id] ||= new BatchableSpineSlot();

                // console.log(cacheData)
                
				batchableSpineSlot.setData(
					spine,
					cacheData,
					blendMode,
					roundPixels
				);

				if (!cacheData.skipRender) {
					batcher.addToBatch(batchableSpineSlot, instructionSet);
				}
			}

			const containerAttachment = spine._slotsObject[slot.data.name];

			if (containerAttachment) {
				const container = containerAttachment.container;

				container.includeInBuild = true;
				collectAllRenderables(container, instructionSet, this.renderer);
				container.includeInBuild = false;
			}
		}
	}

	updateRenderable (spine: Spine) {
		const gpuSpine = this.gpuSpineData[spine.uid];

		spine._validateAndTransformAttachments();

		const drawOrder = spine.skeleton.drawOrder;

		for (let i = 0, n = drawOrder.length; i < n; i++) {
			const slot = drawOrder[i];
			const attachment = slot.getAttachment();

			if (attachment instanceof RegionAttachment || attachment instanceof MeshAttachment) {
				const cacheData = spine._getCachedData(slot, attachment);

				if (!cacheData.skipRender) {
					const batchableSpineSlot = gpuSpine.slotBatches[spine._getCachedData(slot, attachment).id];

					batchableSpineSlot._batcher?.updateElement(batchableSpineSlot);
				}
			}
		}
	}

	destroyRenderable (spine: Spine) {
		this.gpuSpineData[spine.uid] = null as any;
		spine.off('destroyed', this._destroyRenderableBound);
	}

	destroy () {
		this.gpuSpineData = null as any;
		this.renderer = null as any;
	}

	private _getSpineData (spine: Spine): GpuSpineDataElement {
		return this.gpuSpineData[spine.uid] || this._initMeshData(spine);
	}

	private _initMeshData (spine: Spine): GpuSpineDataElement {
		this.gpuSpineData[spine.uid] = { slotBatches: {} };
		spine.on('destroyed', this._destroyRenderableBound);
		return this.gpuSpineData[spine.uid];
	}
}

extensions.add(SpinePipe);