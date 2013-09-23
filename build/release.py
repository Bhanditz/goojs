#!/usr/bin/env python

import os
import sys
import shutil
import subprocess


def prepend(filename, to_prepend):
	"""Prepends a string to a file

	"""
	with open(filename, 'r') as stream:
		content = stream.read()
	with open(filename, 'w') as stream:
		stream.write(to_prepend)
		stream.write(content)


if len(sys.argv) != 2:
    print 'Usage: release.py version-number'
    sys.exit(1)

version = sys.argv[1]
work_dir = 'minified'
name = 'goo-' + version

print 'Creating release', name
if os.path.isdir(work_dir):
    shutil.rmtree(work_dir)

if os.name == 'nt':
    command = 'cake.cmd'
else:
    command = 'cake'
subprocess.check_call([command, 'minify'])
subprocess.check_call([command, 'jsdoc'])

goo_root = work_dir + '/goo'

prepend(goo_root + '/goo.js', '// Version ' + version + '\n')

release_dir = os.getenv('RELEASE_DIR', 'out/release/' + name)
print 'Creating release in', release_dir
if not os.path.isdir(release_dir):
	os.makedirs(release_dir)
shutil.copy('minified/goo/goo.js', release_dir)
shutil.copytree('minified/goo/lib', release_dir + '/lib')
shutil.copytree('goojs-jsdoc', release_dir + '/docs')
shutil.copy('COPYING', release_dir + '/COPYING')
