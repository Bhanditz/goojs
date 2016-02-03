define(['goo/math/Transform'], function (Transform) {
	'use strict';

	/**
	 * @class
	 * Representation of a Joint in a Skeleton. Meant to be used within a specific Skeleton object.
	 * @param {string} name Name of joint
	 */
	function Joint (name) {
		this._name = name;

		this._index = 0;
		this._parentIndex = Joint.NO_PARENT;
		this._inverseBindPose = new Transform();
	}

	Joint.NO_PARENT = -32768;

	return Joint;
});