/* Map of GeoJSON data from MidWest.geojson */

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('map', {
        center: [40.00, -91.20],
        zoom: 5
    
    });
    

//searchLayer is a L.LayerGroup contains searched markers
//add tile layer...replace project id and accessToken with your own
    //add OSM base tilelayer
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox.outdoors',
            accessToken: 'pk.eyJ1IjoiZGZpZWxkMjMiLCJhIjoiY2p4NThuaGYxMDB3bDQ4cXd0eWJiOGJoeSJ9.T94xCeDwJ268CmzfMPXdmw'
            }).addTo(map);
    //call getData function
    getData(map);
}

//Step 2: Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/MidWest.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);
            //call function to create proportional symbols
            createPropSymbols(response, map,attributes);
            //call funtion to create slider
            createSequenceControls(map, attributes);
        }
    });
}
//Above Example 3.8...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take the year attributes.
        
            if (attribute.indexOf("0")>=0){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};
    
function pointToLayer(feature, latlng, attributes){
    //Step 4: Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    //check
    console.log(attribute);
    
    var options = {
    fillColor: "#00BFFF",
    color: "#000",
    weight: 1.5,
    opacity: 1,
    fillOpacity: 0.8
};
    
    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    var year = attribute.split("_")[0]+"s";
    //build popup content string
    var popupContent = "<p><b>State:</b> " + feature.properties.State + "</p><p><b>" + "Total # of Disaster Declarations in the " + year + ":</b> " + feature.properties[attribute];
    
    //bind the popup to the circle marker
    layer.bindPopup(popupContent);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

function calcPropRadius(attributeValue){
        var scaleFactor = 20;
        var area = attributeValue * scaleFactor;
        var radius = Math.sqrt(area/Math.PI)*2;
        return radius;        
};

//Create new sequence controls
function createSequenceControls(map, attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            
            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');
            
            //add skip buttons
            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');
            
            
            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
                map.dragging.disable();
            });
            
            return container;
        }
    });

    map.addControl(new SequenceControl());


	//set slider attributes
	$('.range-slider').attr({
		max: 6,
		min: 0,
		value: 0,
		step: 1
	});

	// create slider event handler
	$('.range-slider').on('input', function () {
		var index = $(this).val();
		$('#year').html(attributes[index]);
		updatePropSymbols(map, attributes[index]);
	});


	//create button event handler
	$('.skip').click(function () {
		var index = $('.range-slider').val();
		if ($(this).attr('id') == 'forward') {
			index++;
			index = index > 6 ? 0 : index;
		} else if ($(this).attr('id') == 'reverse') {
			index--;
			index = index < 0 ? 6 : index;
		}
		$('.range-slider').val(index);
        console.log(index);
		updatePropSymbols(map, attributes[index]);
	});
}


//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;
            
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            
            //add States Name to popup content string
            var popupContent = "<p><b>State:</b> " + props.State + "</p>";

            //add formatted attribute to panel content string
            var year = attribute.split("_")[0]+"s";
            popupContent += "<p><b> Total # of Disaster Declarations in the " + year + ":</b> " + props[attribute];

            //replace the layer popup
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
        });
    };
});
    
    function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            return container;
        }
    });

    map.addControl(new LegendControl());
};
/*  //Example 2.7 line 1...function to create the legend
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')
            
            
            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="180px" height="180px">';

            //add attribute legend svg to container
            $(container).append(svg);
            
/*            <svg id="Layer_1" width="180px" height="180px">
            <circle fill = "#00BFFF" fill-opacity="0.8" stroke="#000000" stroke-miterlimit="10" cx="561" cy="321" r="89.5"/> 
        </svg>*/
/*            
            return container;
        }
    });
    map.addControl(createLegend);
    map.addControl(new LegendControl());

    updateLegend(map, attributes[0]);
};  */
};
$(document).ready(createMap);