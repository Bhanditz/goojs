define([
	'goo/statemachine/actions/Action',
	'goo/statemachine/FSMUtil'
],
/** @lends */

function(
	Action,
	FSMUtil
) {
	"use strict";

	function TweenPositionAction(settings) {
		settings = settings || {};
		this.everyFrame = settings.everyFrame || true;

		this.entity = settings.entity || null;
		this.time = settings.time || 2000;
		this.event = settings.event || 'dummy';
		this.from = settings.from || {
			x: -5,
			y: 0,
			z: 0
		};
		this.to = settings.to || {
			x: 5,
			y: 0,
			z: 0
		};
		this.easing = settings.easing || window.TWEEN.Easing.Elastic.InOut;
		this.tween = new window.TWEEN.Tween();
	}

	TweenPositionAction.prototype = Object.create(Action.prototype);

	TweenPositionAction.external = [{
			entity: ['entity', 'Entity'],
			time: ['int', 'Time'],
			event: ['string', 'Send event'],
			from: ['json', 'From'],
			to: ['json', 'To'],
			easing: ['function', 'Easing']
		}];

	TweenPositionAction.prototype.onCreate = function(fsm) {
		var that = this;
		this.tween.from(FSMUtil.clone(this.from)).to(this.to, this.time).easing(this.easing).onUpdate(function() {
			if (that.entity !== null) {
				that.entity.transformComponent.transform.translation.setd(this.x, this.y, this.z);
				that.entity.transformComponent.setUpdated();
			}
		}).onComplete(function() {
			fsm.handle(this.event);
			console.log('complete:', this.event);
		}.bind(this)).start();
	};

	TweenPositionAction.prototype.onDestroy = function() {
		this.tween.stop();
	};

	return TweenPositionAction;
});