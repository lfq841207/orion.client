/*global module require*/
/*jslint regexp:false*/
var path = require('path');

module.exports = function(grunt) {
    function mixin(target/*, source..*/) {
        Array.prototype.forEach.call(arguments, function(source) {
            Object.keys(source).forEach(function(key) {
                target[key] = source[key];
            });
        });
        return target;
    }

    var src = './';
    var dest = 'umd/';

    var umdConfigs = {};
    mixin(umdConfigs, {
        // ********************************************************
        // JSON
        // ********************************************************
        'conf/environments.js': {
            src: src + '/conf/environments.js',
            dest: dest + '/conf/environments.js', // note .js
            globalAlias: 'conf.environments',
            objectToExport: 'module.exports', // not used
            template: 'unit'
        },
        // ********************************************************
        // JS
        // ********************************************************
        'lib/eslint.js': {
            src: src + 'lib/eslint.js',
            dest: dest + '/lib/eslint.js',
            deps: {
                amd: 'esprima/esprima estraverse/estraverse escope/escope eslint/conf/environments ./rules ./util ./rule-context ./events'.split(/\s+/)
            },
            globalAlias: 'eslint',
            objectToExport: 'module.exports',
            template: 'unit'
        },
        'lib/rule-context.js': {
            src: src + 'lib/rule-context.js',
            dest: dest + 'lib/rule-context.js',
            deps: {},
            globalAlias: 'ruleContext',
            objectToExport: 'module.exports',
            template: 'unit'
        },
        // We will have to repliment this
        'lib/load-rules.js': {
            src: src + 'lib/rules.js',
            dest: dest + 'lib/rules.js',
            deps: {},
            globalAlias: 'Rules',
            objectToExport: 'module.exports',
            template: 'unit'
        },
        'lib/rules.js': {
            src: src + 'lib/rules.js',
            dest: dest + 'lib/rules.js',
            deps: {
                amd: './load-rules'
            },
            globalAlias: 'Rules',
            objectToExport: 'module.exports',
            template: 'unit'
        },
        'lib/util.js': {
            src: src + 'lib/util.js',
            dest: dest + 'lib/util.js',
            deps: {},
            globalAlias: 'util',
            objectToExport: 'module.exports',
            template: 'unit'
        }
    });
    // ********************************************************
    // RULES
    // ********************************************************
    mixin(umdConfigs, (function() {
        var c = {}, mappings = grunt.file.expandMapping(src + '/lib/rules/*.js', dest);
        mappings.forEach(function(mapping) {
            var noext = path.basename(mapping.src, path.extname(mapping.src));
            var bogusname = noext.replace(/[^A-Za-z0-9$_]/g, '');
            c[mapping.src] = {
                src: mapping.src,
                dest: mapping.dest,
                deps: {},
                globalAlias: 'rules.' + bogusname,
                objectToExport: 'module.exports',
                template: 'unit'
            };
        });
        return c;
    }()));

    grunt.initConfig({
        umd: umdConfigs,
        copy: {
//            conf: {
//                files: [{ src: src + 'conf/environments.js', dest: dest }]
//            },
            tests: {
                files: [{ src: [src + 'tests/**'], dest: dest }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-umd');

    grunt.registerTask('default', ['umd', 'copy']);
};
