/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var SERVICE_API_URL = "http://alessio.cc:5000";

var user = {
    position: {
        lat: null,
        lon: null,
        dir: null,
        spd: null
    },
    updateGeo: function(position) {
        try {
            this.position.lat = position.coords.latitude || this.position.lat;
            this.position.lon = position.coords.longitude || this.position.lon;
            this.position.dir = position.coords.heading || this.position.dir;
            this.position.spd = position.coords.speed || this.position.spd;
        } catch (e) {
            console.log(e.message);
        }
    }
};

var GMaps = {
    currLat: 0,
    currLon: 0,
    map: null,
    marker: null,
    loading: false,
    timeout: null,
    initMap: function() {
        var latLong = new google.maps.LatLng(0, 0);
        var mapOptions = {
            center: latLong,
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        GMaps.map = new google.maps.Map(document.getElementById("map"), mapOptions);
        GMaps.map.addListener('zoom_changed', GMaps.updateHeatmap);
        GMaps.map.addListener('dragend', GMaps.updateHeatmap);
        GMaps.marker = new google.maps.Marker({
            position: latLong,
            map: GMaps.map
        });
    },
    getMap: function(latitude, longitude) {
        if (GMaps.map == null) {
            GMaps.initMap();
        }

        var latLong = new google.maps.LatLng(latitude, longitude);

        GMaps.marker.setPosition(latLong);
        GMaps.map.setCenter(GMaps.marker.getPosition());
    },
    updateMap: function(position) {
        var updatedLatitude = position.coords.latitude;
        var updatedLongitude = position.coords.longitude;

        if (updatedLatitude != GMaps.currLat && updatedLongitude != GMaps.currLon) {
            console.log(updatedLatitude, GMaps.currLat);
            console.log(updatedLongitude, GMaps.currLon);
            console.log("map new position");

            GMaps.currLat = updatedLatitude;
            GMaps.currLon = updatedLongitude;

            GMaps.getMap(updatedLatitude, updatedLongitude);
            GMaps.updateHeatmap();
        }
    },
    updateHeatmap: function() {
        if (GMaps.loading) return;
        GMaps.loading = true;
        $.getJSON(SERVICE_API_URL, GMaps.map.getBounds().toJSON(), GMaps.getHeatmap);
        GMaps.timeout = setTimeout(function(){GMaps.loading = false;}, 10000);
    },
    getHeatmap: function(results) {
        clearTimeout(GMaps.timeout);
        GMaps.loading = false;
        console.log("heatmap loading");
        var heatmapData = [];
        for (var i = 0; i < results.length; i += 3) {
            var lon = results[i];
            var lat = results[i + 1];
            var value = results[i + 2];
            var latLng = new google.maps.LatLng(lat, lon);
            value = 15 - value
            if (value < 0) {
                value = 0;
            }
            var weightedLoc = {
                location: latLng,
                weight: value
            };
            heatmapData.push(weightedLoc);
        }
        console.log(heatmapData.length);
        if (heatmapData.length == 0) return;
        if (GMaps.heatmap == null) {
            GMaps.heatmap = new google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                dissipating: true,
                map: GMaps.map,
                maxIntensity: 15,
                radius: 75
            });
        } else {
            GMaps.heatmap.setData(heatmapData);
        }
    }
}

var App = {
    // Application Constructor
    initialize: function() {
        console.log('initialize');
        GMaps.initMap();
        App.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        console.log('bindEvents');
        document.addEventListener('deviceready', App.onDeviceReady, false);
    },
    onGeoSuccess: function(position) {
        try {
        user.updateGeo(position);
        GMaps.updateMap(position);
        } catch (e) {
            console.log(e.message);
        }
    },
    onGeoError: function(error) {
        var parentElement = document.getElementById('geomsg');
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.contet = '' + error.code + ': ' + error.message;
        receivedElement.setAttribute('style', 'display:none;');
        listeningElement.setAttribute('style', 'display:block;');
        console.log('position error');
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'App.receivedEvent(...);'
    onDeviceReady: function() {
        console.log('onDeviceReady');
        App.receivedEvent('deviceready');

        geoOptions = { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true };
        navigator.geolocation.watchPosition(App.onGeoSuccess, App.onGeoError, geoOptions);
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        var loader = document.getElementById('loading');
        var map = document.getElementById('map');
        loader.style.display = 'none';
        map.style.display = 'block';
        mapHeight = viewportHeight - map.offsetTop;
        map.style.height = '' + mapHeight + 'px';

        console.log('Received Event: ' + id);
    }
};
