// jshint node:true
'use strict';

var Dependency = require('./dependency').Dependency;
var topoSort = require('./topo-sort');
var derequire = require('./derequire-module');
var fs = require('fs');
var esprima = require('esprima');
var escodegen = require('escodegen');
var uglify = require('uglify-js');



function stripJS(string) {
	return string.slice(0, -3);
}

function graphise(dependencies) {
	var graph = {};
	Object.keys(dependencies).forEach(function (key) {
		graph[stripJS(key)] = dependencies[key];
	});

	return graph;
}

function filterObj(obj, predicate) {
	var filtered = {};
	Object.keys(obj).forEach(function (key) {
		if (predicate(obj[key], key)) {
			filtered[key] = obj[key];
		}
	});

	return filtered;
}

function mapObj(obj, fun) {
	var newObj = {};
	Object.keys(obj).forEach(function (key) {
		newObj[key] = fun(obj[key], key);
	});

	return newObj;
}

function getProgram(body) {
	return {
		"type": "Program",
		"body": [{
			"type": "ExpressionStatement",
			"expression": body
		}]
	};
}

function minify(source, options) {
	if (!options.minifyLevel) {
		return source;
	} else if (options.minifyLevel === 'light') {
		return uglify.minify(source, {
			fromString: true,
			mangle: false,
			compress: false
		}).code;
	} else if (options.minifyLevel === 'full') {
		return uglify.minify(source, {
			fromString: true
		}).code;
	}
}

function afterLastSlash(string) {
	return string.match(/\/([\w+]+)$/)[1];
}

function wrapPack(source, modules) {
	var ret = source + '\n';

	ret += 'if (typeof require === "function") {\n';
	ret += modules.map(function (module) {
		return 'define("' + module + '", [], function () { return goo.' +
			derequire.safenIdentifier(afterLastSlash(module)) + '; });';
	}).join('\n') + '\n';
	ret += '}\n';

	return ret;
}

function wrapMain(source, modules) {
	return 'window.goo = {};\n' + wrapPack(source, modules);
}

var ROOT_PATH = 'src-preprocessed/';

/**
 * @param {string} [packPath] Only specify if minifying a pack
 * @param {string} [outFile]
 * @param {Object} [options]
 * @param {string} [options.minifyLevel=null] Can be null (no minification), 'light' (compacting only) and 'full'
 * @param {function} [callback]
 */
function run(packPath, outFile, options, callback) {
	// optional parameters
	if (!outFile) {
		if (!packPath) {
			outFile = 'out/goo.js';
		} else {
			outFile = 'out/' + afterLastSlash(packPath) + '.js';
		}
	}

	options = options || {};

	callback = callback || function () {};

	// build dependency tree
	Dependency.getTree(ROOT_PATH, function (dependencies) {
		var graph = graphise(dependencies);

		if (packPath) {
			// filter dependencies outside of the pack
			graph = filterObj(graph, function (obj, key) {
				return key.indexOf(packPath) !== -1 && key !== '';
			});

			graph = mapObj(graph, function (obj, key) {
				return obj.filter(function (dependency) {
					return dependency.indexOf(packPath) !== -1;
				});
			});
		} else {
			// filter the packs out
			graph = filterObj(graph, function (obj, key) {
				return key.indexOf('pack') === -1 && key !== 'goo';
			});
		}

		// sort in a way to allow dependencies to be satisfied
		var sortedModules = topoSort.sort(graph);

		var processedModules = sortedModules.map(function (modulePath) {
			var source = fs.readFileSync(ROOT_PATH + modulePath + '.js', 'utf8');

			var tree = esprima.parse(source);
			var strippedModule = derequire.transform(modulePath, tree.body[0].expression);

			var program = getProgram(strippedModule);

			return escodegen.generate(program);
		});

		var concatenatedModules = processedModules.join('\n');

		// wrap the source
		var wrappedSource = (packPath ? wrapPack : wrapMain)(concatenatedModules, sortedModules);

		// optionally uglify the code
		var minifiedSource = minify(wrappedSource, options);

		// and finally write the result
		fs.writeFileSync(outFile, minifiedSource);

		callback();
	});
}

exports.run = run;