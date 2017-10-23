/*jslint browser: true*/
/*global Tangram, gui */

function parseQuery (qstr) {
    var query = {};
    var a = qstr.split('&');
    for (var i in a) {
        var b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
    }
    return query;
}

map = (function () {
    'use strict';

    var map_start_location = [37.8090, -122.2220, 12]; // Oakland

    /*** URL parsing ***/

    // leaflet-style URL hash pattern:
    // #[zoom],[lat],[lng]
    var url_hash = window.location.hash.slice(1, window.location.hash.length).split('/');

    if (url_hash.length == 3) {
        map_start_location = [url_hash[1],url_hash[2], url_hash[0]];
        // convert from strings
        map_start_location = map_start_location.map(Number);
    }

    // determine the scene url and content to load during start-up
    var scene_url = 'scene.yaml';

    // If there is a query, use it as the scene_url
    var query = parseQuery(window.location.search.slice(1));
    if (query.url) {
        scene_url = query.url;
    }

    // Create dat GUI
    var gui;
    function addGUI () {
        gui.domElement.parentNode.style.zIndex = 1000; // make sure GUI is on top of map
        window.gui = gui;
        gui.color = "#ffae23"; // CSS string
        gui.addColor(gui, 'color').onChange(function(value) {

            function hexToRgb(hex) {
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? [parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255] : null;
            }
            // scene.config.layers.places.draw.points.color = value;
            console.log(hexToRgb(value));
            scene.styles.blend_points.shaders.uniforms.u_color = hexToRgb(value);
            scene.requestRedraw();
            // scene.updateConfig();
        });
        gui.blend = "multiply";
        var blend_options = ["none", "add", "multiply", "overlay", "screen"];
        gui.add(gui, 'blend', blend_options).listen().onChange(function(value) {
            for (var x in blend_options) {
                var u = "u_"+blend_options[x];
                scene.styles.blend_points.shaders.uniforms[u] = (value == blend_options[x]) ? 1. : 0.;
            }
            scene.requestRedraw();
            // scene.updateConfig();
        });
    };

    /*** Map ***/

    var map = L.map('map', {
        "keyboardZoomOffset" : 1.,
        "minZoom" : 2,
        "maxZoom" : 20,
        }
    );

    var layer = Tangram.leafletLayer({
        scene: scene_url,
        attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
    });

    if (query.quiet) {
        layer.options.attribution = "";
        map.attributionControl.setPrefix('');
        window.addEventListener("load", function() {
            var div = document.getElementById("mz-bug");
            if (div != null) {div.style.display = "none";}
            div = document.getElementById("mz-citysearch");
            if (div != null) {div.style.display = "none";}
            div = document.getElementById("mz-geolocator");
            if (div != null) {div.style.display = "none";}
        });
    }

    if (query.noscroll) {
        map.scrollWheelZoom.disable();
    }

    window.layer = layer;
    var scene = layer.scene;
    window.scene = scene;

    // setView expects format ([lat, long], zoom)
    map.setView(map_start_location.slice(0, 3), map_start_location[2]);

    var hash = new L.Hash(map);

    window.addEventListener('load', function () {
        // Scene initialized
        layer.on('init', function() {
            gui = new dat.GUI({ autoPlace: true, hideable: true, width: 300 });
            addGUI();
            // console.log('main test:', testcolor)
        });
        layer.addTo(map);
    });

    return map;

}());
