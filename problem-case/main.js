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
        gui.scale = 0.;
        gui.add(gui, 'scale', -7., 0.).name("powers of 10").step(1).onChange(function(value) {
            scene.config.global.scale = gui.scaleOutput = Math.pow(10, value);
            scene.updateConfig();
        }).listen();
        gui.scaleOutput = '1.';
        gui.add(gui, 'scaleOutput').name("computed scale").step(.000001).listen().lock();
    }

    /*** Map ***/

    var map = L.map('map', {
        "keyboardZoomOffset" : 1.,
        "minZoom" : 2,
        "maxZoom" : 21,
        }
    );

    var layer = Tangram.leafletLayer({
        scene: scene_url,
        attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
    });

    window.layer = layer;
    var scene = layer.scene;
    window.scene = scene;

    // setView expects format ([lat, long], zoom)
    map.setView(map_start_location.slice(0, 3), map_start_location[2]);

    var hash = new L.Hash(map);

    /***** Render loop *****/

    window.addEventListener('load', function () {
        // Scene initialized
        layer.on('init', function() {
            gui = new dat.GUI({ autoPlace: true, hideable: true, width: 300 });
            addGUI();
        });
        layer.addTo(map);
    });

    return map;

}());
