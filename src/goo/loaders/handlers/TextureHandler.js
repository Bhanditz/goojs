define([
	'goo/loaders/handlers/ConfigHandler',
	'goo/renderer/TextureCreator',
	'goo/renderer/Texture',
	'goo/loaders/dds/DdsLoader',
	'goo/loaders/tga/TgaLoader',
	'goo/util/rsvp',
	'goo/util/PromiseUtil',
	'goo/renderer/Util',
	'goo/util/ObjectUtil'
], function(
	ConfigHandler,
	TextureCreator,
	Texture,
	DdsLoader,
	TgaLoader,
	RSVP,
	pu,
	ru,
	_
) {
	/*jshint eqeqeq: false, -W041 */
	/*
	 Options:
	 {bool} dontWaitForTextures if true, return promise that resolves once the texture object is created, don't wait
	 for the image to load. Defaults to false.
	 */
	function TextureHandler() {
		ConfigHandler.apply(this, arguments);
		this._objects = {};
	}

	TextureHandler.prototype = Object.create(ConfigHandler.prototype);
	ConfigHandler._registerClass('texture', TextureHandler);

	TextureHandler.loaders = {
		dds: DdsLoader,
		tga: TgaLoader
	};

	TextureHandler.prototype._prepare = function(config) {
		_.defaults(config, {
			wrapU: 'Repeat',
			wrapV: 'Repeat',
			magFilter: 'Bilinear',
			minFilter: 'Trilinear',
			anisotropy: 1,
			offset: [0, 0],
			repeat: [1, 1],
			flipY: true
		});
	};

	TextureHandler.prototype._create = function(ref) {
		var texture = this._objects[ref] = new Texture(ru.clone(TextureCreator.DEFAULT_TEXTURE_2D.image));
		texture.image.dataReady = false;

		return texture;
	};

	TextureHandler.prototype.update = function(ref, config) {
		//var imgRef, loadedPromise, tc, texture, textureLoader, type, _ref,

		var imgRef = config.url;
		var type = imgRef ? imgRef.split('.').pop().toLowerCase() : void 0;

		var texture, loadedPromise;
		if (type === 'mp4') {
			loadedPromise = new RSVP.Promise();
			var tc = new TextureCreator();
			texture = tc.loadTextureVideo(config.url, true);

			return pu.createDummyPromise(texture);
		} else {
			texture = this._objects[ref] || this._create(ref);
			this._prepare(config);

			texture.wrapS = config.wrapU;
			texture.wrapT = config.wrapV;
			texture.magFilter = config.magFilter;
			texture.minFilter = config.minFilter;
			texture.anisotropy = config.anisotropy;

			texture.offset.set(config.offset);
			texture.repeat.set(config.offset);

			texture.flipY = config.flipY;

			texture.setNeedsUpdate();
			if (!config.url) {
				console.log("Texture " + ref + " has no url");

				return pu.createDummyPromise(texture);
			} else if (config.url !== texture.a && config.url !== texture.image.src) {
				if (type in TextureHandler.loaders) {
					var textureLoader = new TextureHandler.loaders[type]();
					texture.a = imgRef;
					loadedPromise = this.getConfig(imgRef).then(function(data) {
						if (data && data.preloaded) {
							_.extend(texture.image, data.image);
							texture.format = data.format;
							texture.needsUpdate = true;
						}
						else if (textureLoader.load) {
							textureLoader.load(data, texture, config.flipY, 0, data.byteLength);
						}
						else {
							throw new Error("Loader for type " + type + " has no load() function");
						}
						return texture;
					}).then(null, function(e) {
						console.error("Error loading texture: ", e);
					});
				} else if (type === 'jpg' || type === 'jpeg' || type === 'png' || type === 'gif') {
					loadedPromise = this.getConfig(imgRef).then(function(data) {
						texture.setImage(data);
						return texture;
					}).then(null, function(e) {
						console.error("Error loading texture: ", e);
					});
				}
				else {
					throw new Error("Unknown texture type " + type);
				}
			} else {
				loadedPromise.resolve(texture);
			}

		}
		if (this.options && this.options.dontWaitForTextures) {
			// We don't wait for images to load
			return pu.createDummyPromise(texture);
		} else {
			return loadedPromise;
		}
	};

	TextureHandler.prototype.remove = function(ref) {
		console.log("Deleting texture " + ref);
		return delete this._objects[ref];
	};

	return TextureHandler;
});
