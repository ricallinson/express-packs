//    (The MIT License)
//
//    Copyright (c) 2012 Richard S Allinson <rsa@mountainmansoftware.com>
//
//    Permission is hereby granted, free of charge, to any person obtaining
//    a copy of this software and associated documentation files (the
//    "Software"), to deal in the Software without restriction, including
//    without limitation the rights to use, copy, modify, merge, publish,
//    distribute, sublicense, and/or sell copies of the Software, and to
//    permit persons to whom the Software is furnished to do so, subject to
//    the following conditions:
//
//    The above copyright notice and this permission notice shall be
//    included in all copies or substantial portions of the Software.
//
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

"use strict";

/*
    Load the modules required.
*/

var express = require("express"),
    fslib = require("fs"),
    pathlib = require("path");

/*
    exports.GET_index === GET /
    exports.GET_page === GET /page
    exports.POST_page === POST /page
    exports["GET_/admin/logon"] === GET /admin/logon
    exports["POST_/admin/logon"] === POST /admin/logon
*/

exports.parseKey = function (prefix, key) {

    var http = {};

    prefix = prefix || "/";

    http.source = key.split("_");

    if (http.source.length === 1) {
        http.source.unshift("");
    }

    if (http.source[1] === "index") {
        http.source[1] = "";
    }

    http.method = http.source[0].toLowerCase();
    http.path = pathlib.join(prefix, http.source[1]);

    return http;
};

/*
    ./ctr.js
    ./assets
    ./views

    exports.view = "html";
    exports.engine = function ();
    exports.path = "/prefix";
*/

exports.load = function (abspath, app) {

    var controller = require(abspath),
        key,
        http,
        assetsPath = pathlib.join("/", pathlib.basename(pathlib.dirname(abspath)), "assets"),
        assetsRoot = pathlib.join(pathlib.dirname(abspath), "assets");

    app.use(assetsPath, express.static(assetsRoot));

    for (key in controller) {

        if (typeof controller[key] === "function") {

            http = this.parseKey(controller.path, key);

            if (http.method) {
                app[http.method](http.path, controller[key]);
            }
        }
    }
};

/*
    Returns a list of modules which can be loaded via the "express-module-loader".
*/

exports.getModuleList = function (dir) {

    var items,
        index,
        abspath,
        list = [];

    /*
        Get a list of all the files in the given directory.
    */

    items = fslib.readdirSync(dir);

    /*
        For each item see if it is an "express-modules".
    */

    for (index in items) {

        abspath = pathlib.join(dir, items[index], "ctr.js");

        if (fslib.existsSync(abspath)) {
            list.push(abspath);
        }
    }

    return list;
};

/*
    Given an express application as "app" this function will
    attach all "express-modules" found in the given "dir" or the current
    "node_modules" folder.
*/

exports.attach = function (app) {

    var modules,
        index;

    modules = this.getModuleList(app.get("modules dir"));

    for (index in modules) {
        this.load(modules[index], app);
    }
};
