console.log("Javascript läuft neu")


mapboxgl.accessToken = 'pk.eyJ1IjoiZmVsaXhpbXBhcmsiLCJhIjoiY2ozbHV6ZWNhMDA2ejJxcG9uNmRkczA5dCJ9.hXh8mXZGzAA9IzodBdYf0Q';

const center_zoom = [13.738112, 51.056853];
//Zoomlevel für Startzoom und Zoom nach Klick in Suchfeld
const zoomlevel = 11;
const zoom_level = 11;
// Zoomlevel für ZoomIn
const zoomInLevel = 15;

// Variable allButton zeigt an, ob der "Alle Branchen"-Button innerhalb der letzten 500 ms geklickt wurde. In diesem Fall greift die Variable moveout nicth auf die sichtbaren Features, sondern auf alle Features des Datensatzes zu, um die Liste mit den Suchergebnissen anzusteuern.
// Variable wird auch beim Klick auf Zurück-Button neben der Suchleiste für 500 ms auf True gestellt.
let allButton = false;

var map = new mapboxgl.Map({
    container: 'map', // container id
    //style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
    style: 'mapbox://styles/mapbox/streets-v9',
    center: center_zoom, // starting position [lng, lat]
    zoom: zoom_level,  // starting zoom
    fadeDuration: 0,
    attributionControl:false
 })

// hier werden später alle sichtbaren Marker gesammelt
var business =[];
// zeigt an, ob gerade in die Karte gezoomt wurde
var flyer = 0;
var zoomIn = false;
// zeigt an, ob ein Zoom durch das Anklicken eines Icons ausgelöst wurde
var flyerClick = 0
// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
    closeButton: true
});



var filterEl = document.getElementById('feat-filter');
var listingEl = document.getElementById('feature-listing');
var mapHtml = document.getElementById("map");
var backbutton = document.getElementById("back-button");
var searchbutton = document.getElementById("search-button");
var icons = document.getElementById("filter-group")
var iconContainer = document.getElementsByClassName("iconcontainer");
var bbutton = document.getElementsByClassName("bbutton");
var alleButton = document.getElementById("alleButton");
var hideOnBigScreen = document.getElementsByClassName("hideOnBig");
var showOnBigScreen = document.getElementsByClassName("showOnBig");
var showOnSmallScreen = document.getElementsByClassName("showOnSmall");
var hideOnSmallScreen = document.getElementsByClassName("hideOnSmall");


console.log(alleButton);
// media-queries
function detectScreenSize(x){
  var flexfill = document.getElementById("search");
  console.log (x);
  if (x.matches){

    // flexfill.classList.remove("flex-fill")
    listingEl.classList.add("small");




  }else{

    if (listingEl.classList.contains("small")){
      listingEl.classList.remove("small");


    }
  }
}

var mediaquery = window.matchMedia("(max-width:768px")
detectScreenSize(mediaquery)
mediaquery.addListener(detectScreenSize)


function renderListings(features) {
    // Clear any existing listings
    console.log("renderListings gefeuert")
    listingEl.innerHTML = '';
    if (features.length) {
        features.forEach(function(feature) {
            var prop = feature.properties;
            var item = document.createElement('a');
            item.id = prop.Name
            item.innerHTML = "<div class='list-entry'><b>"+prop.Name+"</b>"+"<p>"+ prop.Straße  + "<br>" + prop.Postleitzahl + " " + prop.Ort +"<br>Tel.: " + prop.Telefon + "<br><a href='http://" + prop.Webseite + "' target='_blank'>Homepage: "+prop.Webseite+"</a><br><br><small>Stichworte: "+ prop.Info +", "+prop.Ort +", "+prop.Rubrik+", "+prop.Stichworte+"</small></p></div>"


            item.setAttribute('class', 'side_entry')
            // item.href = prop.Webseite;

            item.target = '_blank';
            // hier wird der Name in der Suchleiste festgelegt
            // item.textContent = prop.Name + ' (' + prop.Straße + ')';
            item.addEventListener('mouseover', function() {
                filterEl.setAttribute("placeholder", prop.Name)
                // Highlight corresponding feature on the map
                createPopUp(feature)
            });
            item.addEventListener('mouseleave', function() {
              console.log("Mouseout Sucheregebnisse gezündet");
              // wenn mit Klick auf Listeneintrag in Karte gezoomt wird,
              // bleibt das Popup offen
              filterEl.setAttribute("placeholder", "Was suchen Sie?")
              if (zoomIn){
                return;
              }
              map.getCanvas().style.cursor = '';
              var popUps = document.getElementsByClassName('mapboxgl-popup');
              // // Check if there is already a popup on the map and if so, remove it
              // if (popUps[0]) popUps[0].remove();
              // //class ändern, hover-Effekt ausblenden
              // var hover = document.getElementsByClassName("hover");
              // for (var i=0; i<hover.length; i++){
              //   hover[i].classList.remove("hover");
              // };
              popup.remove();
              removePopup();
            });
            item.addEventListener("click", function(){
              console.log("klick");
              console.log(listingEl)
              if (listingEl.classList.contains("small")){
                mapHtml.classList.remove("d-none");
                listingEl.classList.add("d-none");
                icons.classList.add("d-none");
              }
              flyToStore(feature);


            });

            listingEl.appendChild(item);
        });

        // Show the filter input
        // filterEl.parentNode.style.display = 'block';
    } else {
        var item = document.createElement('a');
        item.innerHTML="<br><br><h4>Kein Eintrag gefunden</h4>";
        listingEl.appendChild(item);
        // var empty = document.createElement('p');
        // empty.textContent = 'Drag the map to populate results';
        // listingEl.appendChild(empty);

        // // Hide the filter input
        // filterEl.parentNode.style.display = 'none';

        // remove features filter
        //map.setFilter('auto', ['has', 'Name']);
    }
}


function normalize(string) {
    return string.trim().toLowerCase();
}


function getUniqueFeatures(array, comparatorProperty) {
    var existingFeatureKeys = {};
    // Because features come from tiled vector data, feature geometries may be split
    // or duplicated across tile boundaries and, as a result, features may appear
    // multiple times in query results.
    var uniqueFeatures = array.filter(function(el) {
        if (existingFeatureKeys[el.properties[comparatorProperty]]) {
            return false;
        } else {
            existingFeatureKeys[el.properties[comparatorProperty]] = true;
            return true;
        }
    });

    return uniqueFeatures;
}

// bei Klick auf die Seitenelemente - Karte wird auf Store zentriert
function flyToStore(currentFeature) {
  map.flyTo({
    center: currentFeature.geometry.coordinates,
    zoom: zoomInLevel,
    speed: 3.5
  });
  flyer = 1;
  zoomIn = true;
  bbutton[0].style.display = "block";
  map.fire("flystart");
}


function zoomOut(){
  map.flyTo({
    center: center_zoom,
    zoom: zoomlevel,
    speed: 3.5
  });
  // let allButton auf true - moveout-Funktion nimmt dann den gesamten Datensatz für die Suchliste links, nicht nur die auf der Karte angezeigten Einträge.
  allButton = true;
};

// Popups definieren
function createPopUp(currentFeature) {
  console.log(currentFeature);
  let popUps = document.getElementsByClassName('mapboxgl-popup');
  // Check if there is already a popup on the map and if so, remove it
  if (popUps[0]) popUps[0].remove();
  let actualClass = currentFeature.properties.Rubrik;
  var popup = new mapboxgl.Popup({ closeOnClick: false, className:actualClass})
    .setLngLat(currentFeature.geometry.coordinates)
    .setHTML('<h4 class="'+currentFeature.properties.Rubrik+'">'+ currentFeature.properties.Info + '</h4>' +
      '<h5><b>' + currentFeature.properties.Name + '</b></h5><h6>'+currentFeature.properties.Straße + ', ' + currentFeature.properties.Ort + '</h6><h6>'+currentFeature.properties.Telefon+'</h6><h6 class="hide"><a href ="'+ currentFeature.properties.Webseite +'"><small >Homepage: ' + currentFeature.properties.Webseite + '</small></a></h6>')
    .addTo(map);
}

function removePopup(){
  var popUps = document.getElementsByClassName('mapboxgl-popup');
        // Check if there is already a popup on the map and if so, remove it
        if (popUps[0]) popUps[0].remove();
        //class ändern, hover-Effekt ausblenden
        var hover = document.getElementsByClassName("hover");
        for (var i=0; i<hover.length; i++){
          hover[i].classList.remove("hover");
        };
}
console.log()
// Identifikation der vorhandenen Themenwelten
//let shoparray = shops.features;
//let unique_rubrics = [...new Set(shoparray.map(item => item.properties.Rubrik))];

// eventuell besser: Shopwelten händisch festlegen, ansonsten werden nämlich keine
// Map-Layer für die Elemente erzeugt, die nicht vorhanden sind. Das gibt später
// Probleme.
const unique_rubrics = ["Autos", "Bauen", "Dienstleistung", "Elektrik", "Gesundheit", "Wohnen", "Bildung"]

//console.log(points)
map.on("load", function(){

    map.addSource("shops", {
        "type":"geojson",
        "data": shops
    });

    map.addControl(new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: "by Christoph Knoop, Die Mehrwertmacher | Icons: icon8.com"
      }))


    // Hier werden die Layer mit den verschiedenen Themenwelten angelegt
    // Mit if-Loop über Themenwelten iterieren, dann jeweils eine Layer anlegen
    var counter = 0;

    unique_rubrics.forEach(function(rubrik){

      // picture-url vergeben
      let picture = "../icons/" + rubrik + ".png"

      map.loadImage(picture, function(error, image){
          if(error) throw error;
          map.addImage(rubrik, image);
          map.addLayer({
              "id": rubrik,
              "source": "shops",
              "type": "symbol",


              "layout": {
                    "icon-image": rubrik,
                    "icon-padding": 1,
                    "icon-size": 0.6,
                    "icon-allow-overlap":true},
              "filter": ["==", "Rubrik", rubrik]
            });
          console.log("Layer... " + rubrik +" ....gesetzt via map.onload");

      });

    }) // Ende der forEach-Schleife zur Erstellung der Map-Layer.








    map.on('moveend', function() {
        console.log("moveend gefeuert")
        if (map.getZoom()<zoomInLevel){
          bbutton[0].style.display = "none";
        }

        setTimeout(function(){
          console.log("timeout gefeuert");
        //var features = map.queryRenderedFeatures({layers:['Mode', 'Autos']});
        console.log("AllButton ist" + allButton)
        if (allButton){
            console.log("allButton wohl true")
            var features = map.querySourceFeatures("shops");
        }else{
            console.log("no allbutton");
            var features = map.queryRenderedFeatures({layers:unique_rubrics});
        }
        console.log(features)
        if (features) {

            var uniqueFeatures = getUniqueFeatures(features, "Name");
            // Populate features for the listing overlay.
            renderListings(uniqueFeatures);
            // Clear the input container
            filterEl.value = '';

            // Store the current features in sn `airports` variable to
            // later use for filtering on `keyup`.
            business = uniqueFeatures;
            var zoom = map.getZoom()
            if (zoom == 12 && listingEl.classList.contains("small")){
              filterEl.value="Was suchen Sie?"
            }
        }
        }, 150)

        if (flyer == 1){
          setTimeout(function(){
            map.fire("flyend")
          }, 50)

        }



        if (flyer == 0){
          removePopup ();

        }
        //allButton wird wieder auf False gesetzt, damit bei Move-end wieder nur die Daten angezeigt werden, die auch auf der Karte zu sehen sind.
        setTimeout(function(){
          allButton = false;
        }, 151);



    });

    map.on("flystart", function(){
      console.log("Hier ist flystart");
      flyer = 1;
    })

    map.on("flyend", function(){
      console.log("Hier ist flyend");
      flyer = 0;
    })



    // durch Verknüpfung des Eventhandlers mit dem Namen unserer Datenlayer
    // zündet er nur, wenn er auf ein Element dieser Layer trifft.
    map.on('mousemove', 'shops', function(e) {

        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';
        // Populate the popup and set its coordinates based on the feature.
        var feature = e.features[0];
        var element = document.getElementById(feature.properties.Name)
        //checken ob gerade ein anderer Schriftzug hervorgehoben wird
        // bei eng zusammenliegenden Icons kann es passieren, dass der
        // Class-Wechsel durch das Mouseout nicht funktioniert.
        var hover = document.getElementsByClassName("hover");
        for (var i=0; i<hover.length; i++){
           hover[i].classList.remove("hover");
        };

        element.classList.add("hover")
        createPopUp(feature)
        // popup.setLngLat(feature.geometry.coordinates)
        //     .setText(feature.properties.Name + ' (<h1>' + feature.properties.Name + ')</h1>')
        //     .addTo(map);
    });

    // Eventhandlers für die Map, muss mit loop über unique_rubrics gebaut
    // werden, mapbox unterstützt kein Layer-Array als Parameter in den
    // map.Eventhandlers.
    // Eventhandler für die Icons in der Map
    unique_rubrics.forEach(function(rubrik){
      map.on('click', rubrik, function(e){
        console.log(e);
        var feature = e.features[0];
        flyToStore(feature);
        console.log("BButton gezündet");

        setTimeout(function(){
            createPopUp(feature);

          }, 200)
      });


      map.on('mouseover', rubrik, function(e){
        var feature = e.features[0];
        var popUps = document.getElementsByClassName('mapboxgl-popup');
        if (popUps.length == 0){
          createPopUp(feature);
          popup_time = new Date()
        }
      })


      map.on('mouseout', rubrik, function() {
        console.log("wo kommt dieses Mouseleave her?")
        map.getCanvas().style.cursor = '';
        var popUps = document.getElementsByClassName('mapboxgl-popup');
        // Check if there is already a popup on the map and if so, remove it
        popup_time2 = new Date();
        if (popup_time2 - popup_time > 12){

          if (popUps[0]) popUps[0].remove();

        }

        //class ändern, hover-Effekt ausblenden
        var hover = document.getElementsByClassName("hover");
        for (var i=0; i<hover.length; i++){
          hover[i].classList.remove("hover");
        };
      });


// Workarround für ersten Aufruf:
// PROBLEM: Source wir asynchron geladen.
// Das kann man entweder mit einem setTimeOut machen
// oder, besser, mit map.on render.
// Dadurch wird die Funktion nach jedem Rendern aufgerufen... also ständig.
// Gestoppt wird es,wenn map.off render gesetzt wird.
// Das passiert, wenn die Source-Liste komplett geladen ist, sie also genauso
// lang ist wie der Ausgangsdatensatz.

    map.on('render', afterChangeComplete); // warning: this fires many times per second!

    function afterChangeComplete () {

        var testLayer = map.getLayer(rubrik)
        //wartet bis Layer geladen ist
        if(typeof testLayer ==="undefined"){
          return
        }
        //wartet bis sämtliche Daten geladen sind

        // TODO querySourceFeatures ausprobieren... ansonsten lädt die Karte
        // nur bei weit entferntem Zoom richtig durch
        // var feat = map.queryRenderedFeatures({layers:unique_rubrics})
        var feat = map.querySourceFeatures("shops");

        if (feat.length<shops.features.length) {
            return } // still not loaded; bail out.

  // now that the map is loaded, it's safe to query the features:
        console.log("Layers geladen")
        //var features = map.queryRenderedFeatures({layers:unique_rubrics});
        // erstes Laden soll alle Einträge des Datensatzes anzeigen, daher querySourceFeatures
        let features = map.querySourceFeatures("shops");
        let uniqueFeatures = getUniqueFeatures(features, "Name");
            // Populate features for the listing overlay.

        renderListings(uniqueFeatures);

            // Clear the input container
        filterEl.value = '';

            // Store the current features in sn `airports` variable to
            // later use for filtering on `keyup`.
        business = uniqueFeatures;


        map.off('render', afterChangeComplete); // remove this handler now that we're done.
     }

   }) //Ende forEach-Schleife


      filterEl.addEventListener("click", function(){
        // map.setZoom(zoomlevel)
        zoomOut()
        if (listingEl.classList.contains("small") && listingEl.classList.contains("d-none")){

        // var features = map.querySourceFeatures("autos");
        // console.log(features);
        // renderListings(features);
        listingEl.classList.remove("d-none");
        icons.classList.remove("d-none")
        mapHtml.classList.add("d-none", "d-md-flex");


      // listingEl.classList.contains("")
        }
      })



      filterEl.addEventListener('keyup', function(e) {
          // in e findet sich unter target.value immer alle Buchstaben,
          // die in der Suchmaske stehen
          var value = normalize(e.target.value);
          console.log(value)
          // Filter visible features that don't match the input value.
          var filtered = business.filter(function(feature) {
              var name = normalize(feature.properties.Name);
              var street = normalize(feature.properties.Straße);
              var rubrik = normalize(feature.properties.Rubrik);
              var info = normalize(feature.properties.Info);
              var stichworte = normalize(feature.properties.Stichworte);

              return name.indexOf(value) > -1 || street.indexOf(value) > -1 || rubrik.indexOf(value) > -1 || info.indexOf(value) > -1 || stichworte.indexOf(value) > -1;
          });
        console.log(filtered);
        let uniqueFiltered = getUniqueFeatures(filtered, "Name");
        // Populate the sidebar with filtered results


        renderListings(uniqueFiltered);

        // Set the filter to populate features into the layer.
        // hier nehme ich mir ein Merkmal der Daten heraus (in diesem Fall
        // den Namen) und lege damit fest, welche Daten in der Layer erscheinen
        // sollen
        if (filtered.length >0){

          //prüfen, ob die Layer ausgeblendet ist
          var checkLayer = map.getLayoutProperty(rubrik, 'visibility');
          if (checkLayer !== "visible"){
            map.setLayoutProperty(rubrik, 'visibility', 'visible')
          }


          map.setFilter(rubrik, ['match', ['get', 'Name'], filtered.map(function(feature) {
             return feature.properties.Name;
        }), true, false]);
        }else{
            map.setLayoutProperty(rubrik, 'visibility', 'none');
            return ("Hallo")
        }

      });

    // // Call this function on initialization
    // // passing an empty array to render an empty state





  // Eventhandler für den "Zurück"-Button neben dem Suchfeld
  searchbutton.addEventListener("click", function(){
      console.log("Searchbutton gedrückt")
      //markiert auswahbutton "alle Branchen"
      iconArray.forEach(function(elem){
        elem.classList.remove("focus")
      })
      alleButton.classList.add("focus");

        filterEl.value="";
        if (listingEl.classList.contains("small") && listingEl.classList.contains("d-none")==false){
          listingEl.classList.add("d-none");
          mapHtml.classList.remove("d-none");
          filterEl.value="Was suchen Sie?"
        }
        unique_rubrics.forEach(function(layer){
        let visibility = map.getLayoutProperty(layer, 'visibility');
          if (visibility != 'visible'){
          map.setLayoutProperty(layer, 'visibility', 'visible')
          }
        })


        zoomOut();

      })

  // Eventhandler für Zurück-Bbutton
  bbutton[0].addEventListener("click", function(){

    unique_rubrics.forEach(function(layer){
          let visibility = map.getLayoutProperty(layer, 'visibility');
            if (visibility != 'visible'){
            map.setLayoutProperty(layer, 'visibility', 'visible')
            }
          })
        //var allFeatures = map.querySourceFeatures("shops", {sourceLayer: [""]);
        zoomOut();
        //var allFeatures = map.queryRenderedFeatures({layers:unique_rubrics})
        // allFeatures mit querySourceFeatures holen, da sonst trotz Klick auf "Alle"
        // nur Shops im Zoombereich angezeigt werden.
        var allFeatures = map.querySourceFeatures("shops")
    // Eventhandler für die Auswahl-Buttons
  })

  clickedIcon = document.getElementsByClassName("filter-group");
  iconArray = Array.from(clickedIcon);
  iconArray.forEach(function(e){
    e.addEventListener("click", function(){
      console.log
      if (map.getZoom()==zoomInLevel){
        zoomOut();
      }
      layerId = e.getAttribute("data-value");
      iconArray.forEach(function(elem){
        elem.classList.remove("focus")
      })

      e.classList.add("focus");





      if (layerId == "Alle"){
      unique_rubrics.forEach(function(layer){
        let visibility = map.getLayoutProperty(layer, 'visibility');
          if (visibility != 'visible'){
          map.setLayoutProperty(layer, 'visibility', 'visible')
          }
        })
      //var allFeatures = map.querySourceFeatures("shops", {sourceLayer: [""]);
      zoomOut();
      //var allFeatures = map.queryRenderedFeatures({layers:unique_rubrics})
      // allFeatures mit querySourceFeatures holen, da sonst trotz Klick auf "Alle"
      // nur Shops im Zoombereich angezeigt werden.
      var allFeatures = map.querySourceFeatures("shops")
      }
      else{
      toRemove = unique_rubrics.filter(elem => elem != layerId)
      let visibility = map.getLayoutProperty(layerId, 'visibility');
      allButton = false;
      if (visibility != 'visible'){
        map.setLayoutProperty(layerId, 'visibility', 'visible')
      }
      toRemove.forEach(function(layer){
        map.setLayoutProperty(layer, 'visibility', 'none')
      });
      var allFeatures = map.querySourceFeatures("shops", {sourceLayer: layerId, filter:["==", "Rubrik", layerId]});
      var uniqueFeatures = getUniqueFeatures(allFeatures, "Name");
      console.log(uniqueFeatures);
      renderListings(uniqueFeatures);
      }


      console.log("Jetzt müsste gerendert werden....")

    })
  })



// Copyright-Hinweise



}) // Ende der map.on.load-Function

