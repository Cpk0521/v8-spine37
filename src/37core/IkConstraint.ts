/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated July 28, 2023. Replaces all prior versions.
 *
 * Copyright (c) 2013-2023, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software or
 * otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE
 * SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/

import { Bone } from "./Bone";
import { IkConstraintData } from "./IkConstraintData";
import { Skeleton } from "./Skeleton";
import { MathUtils } from "./Utils";
import { Constraint } from "./ConstraintData";

export class IkConstraint implements Constraint {
	data: IkConstraintData;
	bones: Array<Bone>;
	target: Bone;
	bendDirection = 0;
	compress = false;
	stretch = false;
	mix = 1;

	constructor (data: IkConstraintData, skeleton: Skeleton) {
		if (data == null) throw new Error("data cannot be null.");
		if (skeleton == null) throw new Error("skeleton cannot be null.");
		this.data = data;
		this.mix = data.mix;
		this.bendDirection = data.bendDirection;
		this.compress = data.compress;
		this.stretch = data.stretch;

		this.bones = new Array<Bone>();
		for (let i = 0; i < data.bones.length; i++)
			this.bones.push(skeleton.findBone(data.bones[i].name));
		this.target = skeleton.findBone(data.target.name);
	}
	isActive(): boolean {
		throw new Error("Method not implemented.");
	}

	getOrder () {
		return this.data.order;
	}

	apply () {
		this.update();
	}

	update () {
		let target = this.target;
		let bones = this.bones;
		switch (bones.length) {
		case 1:
			this.apply1(bones[0], target.worldX, target.worldY, this.compress, this.stretch, this.data.uniform, this.mix);
			break;
		case 2:
			this.apply2(bones[0], bones[1], target.worldX, target.worldY, this.bendDirection, this.stretch, this.mix);
			break;
		}
	}

	/** Adjusts the bone rotation so the tip is as close to the target position as possible. The target is specified in the world
	 * coordinate system. */
	apply1 (bone: Bone, targetX: number, targetY: number, compress: boolean, stretch: boolean, uniform: boolean, alpha: number) {
		if (!bone.appliedValid) bone.updateAppliedTransform();
		let p = bone.parent;
		let id = 1 / (p.a * p.d - p.b * p.c);
		let x = targetX - p.worldX, y = targetY - p.worldY;
		let tx = (x * p.d - y * p.b) * id - bone.ax, ty = (y * p.a - x * p.c) * id - bone.ay;
		let rotationIK = Math.atan2(ty, tx) * MathUtils.radDeg - bone.ashearX - bone.arotation;
		if (bone.ascaleX < 0) rotationIK += 180;
		if (rotationIK > 180)
			rotationIK -= 360;
		else if (rotationIK < -180) rotationIK += 360;
		let sx = bone.ascaleX, sy = bone.ascaleY;
		if (compress || stretch) {
			let b = bone.data.length * sx, dd = Math.sqrt(tx * tx + ty * ty);
			if ((compress && dd < b) || (stretch && dd > b) && b > 0.0001) {
				let s = (dd / b - 1) * alpha + 1;
				sx *= s;
				if (uniform) sy *= s;
			}
		}
		bone.updateWorldTransformWith(bone.ax, bone.ay, bone.arotation + rotationIK * alpha, sx, sy, bone.ashearX,
			bone.ashearY);
	}

	/** Adjusts the parent and child bone rotations so the tip of the child is as close to the target position as possible. The
	 * target is specified in the world coordinate system.
	 * @param child A direct descendant of the parent bone. */
	apply2 (parent: Bone, child: Bone, targetX: number, targetY: number, bendDir: number, stretch: boolean, alpha: number) {
		if (alpha == 0) {
			child.updateWorldTransform();
			return;
		}
		if (!parent.appliedValid) parent.updateAppliedTransform();
		if (!child.appliedValid) child.updateAppliedTransform();
		let px = parent.ax, py = parent.ay, psx = parent.ascaleX, sx = psx, psy = parent.ascaleY, csx = child.ascaleX;
		let os1 = 0, os2 = 0, s2 = 0;
		if (psx < 0) {
			psx = -psx;
			os1 = 180;
			s2 = -1;
		} else {
			os1 = 0;
			s2 = 1;
		}
		if (psy < 0) {
			psy = -psy;
			s2 = -s2;
		}
		if (csx < 0) {
			csx = -csx;
			os2 = 180;
		} else
			os2 = 0;
		let cx = child.ax, cy = 0, cwx = 0, cwy = 0, a = parent.a, b = parent.b, c = parent.c, d = parent.d;
		let u = Math.abs(psx - psy) <= 0.0001;
		if (!u) {
			cy = 0;
			cwx = a * cx + parent.worldX;
			cwy = c * cx + parent.worldY;
		} else {
			cy = child.ay;
			cwx = a * cx + b * cy + parent.worldX;
			cwy = c * cx + d * cy + parent.worldY;
		}
		let pp = parent.parent;
		a = pp.a;
		b = pp.b;
		c = pp.c;
		d = pp.d;
		let id = 1 / (a * d - b * c), x = targetX - pp.worldX, y = targetY - pp.worldY;
		let tx = (x * d - y * b) * id - px, ty = (y * a - x * c) * id - py, dd = tx * tx + ty * ty;
		x = cwx - pp.worldX;
		y = cwy - pp.worldY;
		let dx = (x * d - y * b) * id - px, dy = (y * a - x * c) * id - py;
		let l1 = Math.sqrt(dx * dx + dy * dy), l2 = child.data.length * csx, a1 = 0, a2 = 0;
		outer:
		if (u) {
			l2 *= psx;
			let cos = (dd - l1 * l1 - l2 * l2) / (2 * l1 * l2);
			if (cos < -1)
				cos = -1;
			else if (cos > 1) {
				cos = 1;
				if (stretch && l1 + l2 > 0.0001) sx *= (Math.sqrt(dd) / (l1 + l2) - 1) * alpha + 1;
			}
			a2 = Math.acos(cos) * bendDir;
			a = l1 + l2 * cos;
			b = l2 * Math.sin(a2);
			a1 = Math.atan2(ty * a - tx * b, tx * a + ty * b);
		} else {
			a = psx * l2;
			b = psy * l2;
			let aa = a * a, bb = b * b, ta = Math.atan2(ty, tx);
			c = bb * l1 * l1 + aa * dd - aa * bb;
			let c1 = -2 * bb * l1, c2 = bb - aa;
			d = c1 * c1 - 4 * c2 * c;
			if (d >= 0) {
				let q = Math.sqrt(d);
				if (c1 < 0) q = -q;
				q = -(c1 + q) / 2;
				let r0 = q / c2, r1 = c / q;
				let r = Math.abs(r0) < Math.abs(r1) ? r0 : r1;
				if (r * r <= dd) {
					y = Math.sqrt(dd - r * r) * bendDir;
					a1 = ta - Math.atan2(y, r);
					a2 = Math.atan2(y / psy, (r - l1) / psx);
					break outer;
				}
			}
			let minAngle = MathUtils.PI, minX = l1 - a, minDist = minX * minX, minY = 0;
			let maxAngle = 0, maxX = l1 + a, maxDist = maxX * maxX, maxY = 0;
			c = -a * l1 / (aa - bb);
			if (c >= -1 && c <= 1) {
				c = Math.acos(c);
				x = a * Math.cos(c) + l1;
				y = b * Math.sin(c);
				d = x * x + y * y;
				if (d < minDist) {
					minAngle = c;
					minDist = d;
					minX = x;
					minY = y;
				}
				if (d > maxDist) {
					maxAngle = c;
					maxDist = d;
					maxX = x;
					maxY = y;
				}
			}
			if (dd <= (minDist + maxDist) / 2) {
				a1 = ta - Math.atan2(minY * bendDir, minX);
				a2 = minAngle * bendDir;
			} else {
				a1 = ta - Math.atan2(maxY * bendDir, maxX);
				a2 = maxAngle * bendDir;
			}
		}
		let os = Math.atan2(cy, cx) * s2;
		let rotation = parent.arotation;
		a1 = (a1 - os) * MathUtils.radDeg + os1 - rotation;
		if (a1 > 180)
			a1 -= 360;
		else if (a1 < -180) a1 += 360;
		parent.updateWorldTransformWith(px, py, rotation + a1 * alpha, sx, parent.ascaleY, 0, 0);
		rotation = child.arotation;
		a2 = ((a2 + os) * MathUtils.radDeg - child.ashearX) * s2 + os2 - rotation;
		if (a2 > 180)
			a2 -= 360;
		else if (a2 < -180) a2 += 360;
		child.updateWorldTransformWith(cx, cy, rotation + a2 * alpha, child.ascaleX, child.ascaleY, child.ashearX, child.ashearY);
	}
}