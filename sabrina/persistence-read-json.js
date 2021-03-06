"use strict";

var fs = require("fs");
var path = require("path");

var waterfall = require("./waterfall");
var jsonParse = require("./json-parse");

module.exports = function (jsonpath, jsondir, callback) {
    function onComplete (err, json) {
        if (err) {
            return callback(err);
        }
        return jsonParse(json, callback);
    }

    if (jsonpath) {
        return fs.readFile(jsonpath, "utf8", onComplete);
    }

    return waterfall.escapeWaterfall([
        function (value, cb, end, escape) {
            return fs.readdir(jsondir, escape);
        },
        function (value, cb, end, escape) {
            var file = (function (files) {
                var result = null;
                var prev = 0;
                for (var i = 0, len = files.length; i < len; i++) {
                    var exec = /fql_([0-9]+).json/.exec(files[i]);
                    if (exec) {
                        var timestamp = parseInt(exec[1], 10); // long !(| 0)
                        if (timestamp >= prev) {
                            prev = timestamp;
                            result = exec[0];
                        }
                    }
                }
                return result;
            })(value);
            
            if (file) {
                return cb(null, file);
            }
            return escape(new Error("file not found"));
        },
        function (value, cb, end, escape) {
            return fs.readFile(path.join(jsondir, value), "utf8", escape);
        }
    ], onComplete);
};
