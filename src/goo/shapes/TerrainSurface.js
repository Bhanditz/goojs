define([
	'goo/renderer/MeshData',
	'goo/math/MathUtils'],
	/** @lends */
		function (
		MeshData,
		MathUtils) {
		"use strict";

		/**
		 * @class A grid-like surface shape
		 * @param {array} heightMatrix The height data by x and z axis.
		 * @param {number} xWidth x axis size in units
         * @param {number} yHeight y axis size in units
         * @param {number} zWidth z axis size in units
		 */
		function TerrainSurface(heightMatrix, xWidth, yHeight, zWidth) {

            var verts = [];
            for (var i = 0; i < heightMatrix.length; i++) {
                for (var j = 0; j < heightMatrix[i].length; j++) {
                    verts.push(i * xWidth / (heightMatrix.length-1), heightMatrix[i][j]*yHeight, j * zWidth / (heightMatrix.length-1));
                }
            }
			this.verts = verts;
			this.vertsPerLine = heightMatrix[0].length;

			var attributeMap = MeshData.defaultMap([MeshData.POSITION, MeshData.NORMAL, MeshData.TEXCOORD0]);

			var nVerts = this.verts.length / 3;
			var nLines = nVerts / this.vertsPerLine;
			MeshData.call(this, attributeMap, nVerts, (nLines - 1) * (this.vertsPerLine - 1) * 6);

			this.rebuild();
		}

		TerrainSurface.prototype = Object.create(MeshData.prototype);

		/**
		 * @description Builds or rebuilds the mesh data
		 * @returns {Surface} Self for chaining
		 */
		TerrainSurface.prototype.rebuild = function () {
			this.getAttributeBuffer(MeshData.POSITION).set(this.verts);

			var indices = [];

			var norms = [];
			var normals = [];

			var nVerts = this.verts.length / 3;
			var nLines = nVerts / this.vertsPerLine;

			for (var i = 0; i < nLines - 1; i++) {
				for (var j = 0; j < this.vertsPerLine - 1; j++) {
					var upLeft = (i + 0) * this.vertsPerLine + (j + 0);
					var downLeft = (i + 1) * this.vertsPerLine + (j + 0);
					var downRight = (i + 1) * this.vertsPerLine + (j + 1);
					var upRight = (i + 0) * this.vertsPerLine + (j + 1);

					indices.push(upLeft, downLeft, upRight, upRight, downLeft, downRight);

					normals = MathUtils.getTriangleNormal(
						this.verts[upLeft * 3 + 0],
						this.verts[upLeft * 3 + 1],
						this.verts[upLeft * 3 + 2],

                        this.verts[upRight * 3 + 0],
                        this.verts[upRight * 3 + 1],
                        this.verts[upRight * 3 + 2],

						this.verts[downLeft * 3 + 0],
						this.verts[downLeft * 3 + 1],
						this.verts[downLeft * 3 + 2]


                    );

					norms.push(normals[0], normals[1], normals[2]);
				}
				norms.push(normals[0], normals[1], normals[2]);
			}

			i--;
			for (var j = 0; j < this.vertsPerLine - 1; j++) {
				var upLeft = (i + 0) * this.vertsPerLine + (j + 0);
				var downLeft = (i + 1) * this.vertsPerLine + (j + 0);
				var upRight = (i + 0) * this.vertsPerLine + (j + 1);

				normals = MathUtils.getTriangleNormal(
					this.verts[upLeft * 3 + 0],
					this.verts[upLeft * 3 + 1],
					this.verts[upLeft * 3 + 2],

                    this.verts[upRight * 3 + 0],
                    this.verts[upRight * 3 + 1],
                    this.verts[upRight * 3 + 2],

					this.verts[downLeft * 3 + 0],
					this.verts[downLeft * 3 + 1],
					this.verts[downLeft * 3 + 2]
                );


				norms.push(normals[0], normals[1], normals[2]);
			}

			norms.push(normals[0], normals[1], normals[2]);

			this.getAttributeBuffer(MeshData.NORMAL).set(norms);
			this.getIndexBuffer().set(indices);

			// compute texture coordinates
			var tex = [];
			var bounds = getBounds(this.verts);
			var extentX = bounds.maxX - bounds.minX;
			var extentZ = bounds.maxZ - bounds.minZ;

			for (var i = 0; i < this.verts.length; i += 3) {
				var x = (bounds.minY - this.verts[i + 0]) / extentX;
				var z = (bounds.minZ - this.verts[i + 1]) / extentZ;
				tex.push(x, z);
			}

			this.getAttributeBuffer(MeshData.TEXCOORD0).set(tex);

			return this;
		};

		function getBounds(verts) {
			var minX = verts[0];
			var maxX = verts[0];
			var minZ = verts[2];
			var maxZ = verts[2];

			for (var i = 3; i < verts.length; i += 3) {
				minX = minX < verts[i + 0] ? minX : verts[i + 0];
				maxX = maxX > verts[i + 0] ? maxX : verts[i + 0];
                minZ = minZ < verts[i + 2] ? minZ : verts[i + 2];
                maxZ = maxZ > verts[i + 2] ? maxZ : verts[i + 2];
			}

			return {
				minX: minX,
				maxX: maxX,
                minZ: minZ,
                maxZ: maxZ};
		}

		return TerrainSurface;
	});