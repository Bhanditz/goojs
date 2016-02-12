define([
	'goo/fsmpack/statemachine/actions/Action'
], function (
	Action
) {
	'use strict';

	function StartTimelineAction(/*id, settings*/) {
		Action.apply(this, arguments);
	}

	StartTimelineAction.prototype = Object.create(Action.prototype);
	StartTimelineAction.prototype.constructor = StartTimelineAction;

	StartTimelineAction.external = {
		name: 'Start Timeline',
		type: 'fx',
		description: 'Starts or resumes the timeline.',
		canTransition: true,
		parameters: [],
		transitions: []
	};

	StartTimelineAction.prototype.update = function (fsm) {
		var entity = fsm.getOwnerEntity();

		if (!entity.hasComponent('TimelineComponent')) { return; }

		entity.timelineComponent.start();
	};

	return StartTimelineAction;
});