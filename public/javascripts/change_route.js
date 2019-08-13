var mymap = L.map("mapid").locate({ setView: true, maxZoom: 16 });
var formDiv;
var DriverForm;
var PassengerForm;
var control;
var table_row;
var driver_th;
var passenger_th;
var nearby_th;
var pisocode;
var socket_coordinate;
var is_Info_Btn = false;
var nearby_obj;
var time_zone;

var current_uid = [];
var proute;
var datetime

var carIcon = L.icon({
  iconUrl: "images/5a29651f4ce777.541770901512662303315.png",
  iconSize: [30, 30]
});

L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: ["a", "b", "c"]
}).addTo(mymap);

function getIsocode() {
  $.getJSON("https://ipapi.co/json/", function(data) {
    pisocode = data.country;
    time_zone = data.timezone
  });
}

/* function getTimeZone(){
  $.getJSON(`http://worldtimeapi.org/api/timezone/${time_zone}`, function(data) {
    datetime = data.datetime;
    console.log('datetime',datetime)
  });
}
 */
getIsocode();

table_body = document.getElementById("table-body");
driver_table = document.getElementsByClassName("table table-striped")[0];

onClickDriver();
// Driver Tab
function onClickDriver() {
  window.location.hash = "driver";
/*   getTimeZone() */
  table_row = document.getElementById("table_tr");

  var index;
  var coordinatePair = [];
  var distance = [];
  var TotalDistance;
  var TotalTime;
  var CoordinatePair = [];
  var routeString = "";
  var current_plat;
  var current_dlat;
  var tableId;
  var _response;
  var driver_message;
  var pickup_latitude;
  var pickup_longitude;
  var driver_columns = [
    "Driver Code",
    "Stimulation",
    "Pickup Lat&Lon",
    "Dropoff Lat&Lon",
    "Control",
    "Last Publish Time",
    "No passenger Nearby"
  ];
  if ($(".nearby-column")) {
    $(".nearby-column").remove();
  }

  if (passenger_th == undefined && !document.getElementById("driverForm")) {
    driver_columns.forEach(col => {
      driver_th = document.createElement("th");
      driver_th.append(col);
      table_row.appendChild(driver_th);
    });
  } else {
    for (i = 0; i < table_row.children.length; i++) {
      driver_th = document.createElement("th");
      driver_th.append(driver_columns[i]);
      table_row.replaceChild(driver_th, table_row.children[i]);
    }
  }

  var leafletForm = document.getElementsByClassName(
    "leaflet-routing-geocoders"
  );
  leafletForm.id = "leaflet-form";
  if (document.getElementById("nearby_form")) {
    document
      .getElementsByClassName("leaflet-routing-geocoders")[0]
      .removeChild(document.getElementById("nearby_form"));
  }
  control = L.Routing.control({
    waypoints: [L.latLng(), L.latLng()],
    routeWhileDragging: true,
    geocoder: L.Control.Geocoder.nominatim()
  })
    .on("routeselected", function(e) {
      formDiv = document.getElementsByClassName("leaflet-routing-geocoders")[0];
      formDiv.firstChild.firstChild.id = "start";
      formDiv.children[1].firstChild.id = "end";
      CoordinatePair.length = 0;
      distance.length = 0;

      for (j = 0; j < e.route.waypoints.length; j++) {
        if (
          coordinatePair[j] &&
          coordinatePair[j].lat !== e.route.waypoints[j].latLng.lat
        ) {
          coordinatePair.push(e.route.waypoints[j].latLng);
        } else if (!coordinatePair[j]) {
          coordinatePair.push(e.route.waypoints[j].latLng);
        }
      }
console.log('waypoints',e.route.waypoints)
 pickup_latitude = e.route.waypoints[0].latLng.lat
pickup_longitude = e.route.waypoints[0].latLng.lng 
console.log('pickup_latitude',pickup_latitude)
console.log('pickup_longitude',pickup_longitude)

      TotalDistance = e.route.summary.totalDistance / 1000;
      TotalTime = e.route.summary.totalTime / 60;
      document.getElementById("speed").value = Math.round(
        e.route.summary.totalDistance / e.route.summary.totalTime
      );

      for (i = 0; i < e.route.instructions.length; i++) {
        index = e.route.instructions[i].index;
        CoordinatePair.push(e.route.coordinates[index]);
        distance.push(e.route.instructions[i].distance);
      }
    })
    .addTo(mymap);

  formDiv = document.getElementsByClassName("leaflet-routing-geocoders")[0];

  if (formDiv.children.length > 1) {
    formDiv.firstChild.firstChild.id = "start";
    formDiv.children[1].firstChild.id = "end";
  }

  DriverForm = document.createElement("form");
  DriverForm.onsubmit = function(e) {
    e.preventDefault();
    sendData();
  };
  DriverForm.id = "driverForm";
  DriverForm.setAttribute("method", "POST");
  DriverForm.innerHTML = `<input id='speed' type='number' placeholder='speed(m/s)' name='speed'>
    <input type="text" id='stimulation-name' placeholder='stimulation-name' list="datalist" autocomplete="off" />
    <datalist id="datalist"> 
    </datalist>
    <input type='number' id='uid' placeholder='uid'>
    <button id='load' type='button'>load</button>
    <button type='submit' class='btn' style='margin-top:10px'>Save</button>`;

  if (formDiv.children.length == 1) {
    formDiv.appendChild(DriverForm);
  }
  if (document.getElementById("PassengerForm")) {
    formDiv.replaceChild(DriverForm, PassengerForm);
  } else if (!document.getElementById("driverForm")) {
    formDiv.appendChild(DriverForm);
  }
  if (
    document.getElementsByClassName("leaflet-control-container")[0]
      .childNodes[1].children.length > 1
  ) {
    document
      .getElementsByClassName("leaflet-control-container")[0]
      .childNodes[1].removeChild(
        document.getElementsByClassName("leaflet-control-container")[0]
          .childNodes[1].children[1]
      );
  }

  document.getElementById("stimulation-name").onkeyup = function() {
    load_stimulations();
  };

 async function sendData() {
    let address = await $.ajax({
     url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pickup_latitude
     }&lon=${pickup_longitude}&zoom=27&addressdetails=1`,
     type: 'GET'
    }).done(function(result) {
  return result
  });
  console.log('address',address.address)

    var formdata = {
      speed: $("input[name=speed]").val(),
      instructions: JSON.stringify(CoordinatePair),
      distance: JSON.stringify(distance)
    };
    var response = driver_route(formdata);
    console.log(response);
    routeString = "";
    for (i = 0; i < response.mapRoute.length; i++) {
      routeString =
        routeString + `${response.mapRoute[i][0]},${response.mapRoute[i][1]}|`;
    }
    console.log("routeString", routeString);
 
      var formData = {
      pisocode: pisocode,
      pusertype: "D",
      uid: document.getElementById("uid").value,
      pname: document.getElementById("stimulation-name").value,
      ppickup: document.getElementById("start").value,
      pdestination: document.getElementById("end").value,
      pplatitude: CoordinatePair[0].lat,
      pplongitude: CoordinatePair[0].lng,
      pdlatitude: CoordinatePair[CoordinatePair.length - 1].lat,
      pdlongitude: CoordinatePair[CoordinatePair.length - 1].lng,
      pcountry: address.address.country,
      pprovince: address.address.state,
      pstate: address.address.state,
      pcity: (!address.address.city ? (address.address.state_district) : address.address.city) || (address.address.city_district ? address.address.city_district : address.address.city),
      pzipcode: address.address.postcode,
      ptimezone: time_zone,
      pdistance: TotalDistance,
      ptotaltime: TotalTime,
      pdistancetime: document.getElementById("speed").value,
      proute: routeString,
    }; 

      $.ajax({
      type: "POST",
      url: "http://www.onlinetaxi.co.za/api/www_create_stimulation.php",
      contentType: "application/json",
      data: JSON.stringify(formData),
      dataType: "json",
      encode: true
    }).done(function(data) {
      console.log("driver Record submitted: ", data);
      if (data.drivercode == "0") {
        alert_message(data.message);
      }
      if (!data.message) {
        driver_data_table(data.stimulation);
      }
    });   
  }

  document.getElementById("load").onclick = function() {
    var data = {
      pisocode: pisocode,
      pname: document.getElementById("stimulation-name").value,
      pusertype: "D",
      uid: document.getElementById("uid").value
    };
    $.ajax({
      type: "POST",
      url: "http://www.onlinetaxi.co.za/api/www_load_stimulation.php",
      data: JSON.stringify(data),
      dataType: "json",
      encode: true
    }).done(function(result) {
      console.log("drivers list is", result);
      localStorage.clear();
      localStorage.setItem("drivers", JSON.stringify(result.stimulation));
      play_stimulation(result, data.pusertype);
    });
  }; 
}

// Passenger Tab
function onClickPassenger() {
  window.location.hash = "Passengers";

  var pickup_lat;
  var pickup_lon;
  var coordinatePair = [];
  var distance = [];
  var CoordinatePair = [];
  var TotalDistance;
  var TotalTime;
  var routeString = "";
  var formDiv;
  var driver_message;
  var proute;
  var passenger_columns = [
    "passenger Code",
    "passenger Name",
    "Pickup Lat&Lon",
    "Dropoff Lat&Lon",
    "Control",
    "Last Publish Time",
    "No passenger Nearby"
  ];

  var theads = document.getElementById("table_tr");

  for (i = 0; i < theads.children.length; i++) {
    passenger_th = document.createElement("th");
    passenger_th.append(passenger_columns[i]);
    theads.replaceChild(passenger_th, theads.children[i]);
  }

  if (table_body.children.length >= 1) {
    for (j = 0; j <= table_body.children.length; j++) {
      table_body.removeChild(table_body.children[0]);
    }
  }

  control
    .on("routeselected", function(e) {
      formDiv = document.getElementsByClassName("leaflet-routing-geocoders")[0];
      formDiv.firstChild.firstChild.id = "start";
      formDiv.children[1].firstChild.id = "end";
      CoordinatePair.length = 0;
      distance.length = 0;

      for (j = 0; j < e.route.waypoints.length; j++) {
        if (
          coordinatePair[j] &&
          coordinatePair[j].lat !== e.route.waypoints[j].latLng.lat
        ) {
          coordinatePair.push(e.route.waypoints[j].latLng);
        } else if (!coordinatePair[j]) {
          coordinatePair.push(e.route.waypoints[j].latLng);
        }
      }
      pickup_lat = e.route.waypoints[0].latLng.lat
      pickup_lon = e.route.waypoints[0].latLng.lng 

      TotalDistance = e.route.summary.totalDistance / 1000;
      TotalTime = e.route.summary.totalTime / 60;
      document.getElementById("speed").value = Math.round(
        e.route.summary.totalDistance / e.route.summary.totalTime
      );
      for (i = 0; i < e.route.instructions.length; i++) {
        index = e.route.instructions[i].index;
        CoordinatePair.push(e.route.coordinates[index]);
        distance.push(e.route.instructions[i].distance);
      }
    })
    .addTo(mymap);

  formDiv = document.getElementsByClassName("leaflet-routing-geocoders")[0];

  formDiv.firstChild.firstChild.id = "start";
  formDiv.children[1].firstChild.id = "end";

  PassengerForm = document.createElement("form");
  PassengerForm.onsubmit = function(e) {
    e.preventDefault();
    sendData();
  };
  PassengerForm.id = "PassengerForm";
  PassengerForm.setAttribute("method", "POST");
  PassengerForm.innerHTML = `<input id='speed' type='number' placeholder='speed(m/s)' name='speed'>
    <input type="text" id='stimulation-name' placeholder='stimulation-name' list="datalist" autocomplete="off" />
    <datalist id="datalist"> 
    </datalist>
    <input type='number' id='uid' placeholder='uid'>
    <button id='load' type='button'>load</button>
    <button type='submit' class='btn' style='margin-top:10px'>Save</button>`;
  if (!document.getElementById("PassengerForm")) {
    formDiv.appendChild(PassengerForm);
  }
  if (
    document.getElementsByClassName("leaflet-control-container")[0]
      .childNodes[1].children.length > 1
  ) {
    document
      .getElementsByClassName("leaflet-control-container")[0]
      .childNodes[1].removeChild(
        document.getElementsByClassName("leaflet-control-container")[0]
          .childNodes[1].children[1]
      );
    if (document.getElementById("driverForm")) {
      formDiv.removeChild(document.getElementById("driverForm"));
    }
    if (document.getElementById("nearby_form")) {
      formDiv.removeChild(document.getElementById("nearby_form"));
    }
  }

 async function sendData() {
  
    let address = await $.ajax({
      url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pickup_lat}&lon=${pickup_lon}&zoom=27&addressdetails=1`,
      type: 'GET'
     }).done(function(result) {
   return result
   });
   console.log('address',address)

    var formdata = {
      speed: $("input[name=speed]").val(),
      instructions: JSON.stringify(CoordinatePair),
      distance: JSON.stringify(distance)
    };
    var response = driver_route(formdata);
    console.log(response);
    routeString = "";
    for (i = 0; i < response.mapRoute.length; i++) {
      routeString =
        routeString + `${response.mapRoute[i][0]},${response.mapRoute[i][1]}|`;
    }
    console.log("routeString", routeString);

    var formData = {
      pisocode: pisocode,
      pusertype: "P",
      uid: document.getElementById("uid").value,
      pname: document.getElementById("stimulation-name").value,
      ppickup: document.getElementById("start").value,
      pdestination: document.getElementById("end").value,
      pplatitude: CoordinatePair[0].lat,
      pplongitude: CoordinatePair[0].lng,
      pdlatitude: CoordinatePair[CoordinatePair.length - 1].lat,
      pdlongitude: CoordinatePair[CoordinatePair.length - 1].lng,
      pcountry: address.address.country,
      pprovince:  address.address.state,
      pstate:  address.address.state,
      pcity: (!address.address.city ? (address.address.state_district) : address.address.city) || (address.address.city_district ? address.address.city_district : address.address.city),
      pzipcode:  address.address.postcode,
      ptimezone: time_zone,
      pdistance: TotalDistance,
      ptotaltime: TotalTime,
      pdistancetime: document.getElementById("speed").value,
      proute: routeString
    };

    $.ajax({
      type: "POST",
      url: "http://www.onlinetaxi.co.za/api/www_create_stimulation.php",
      contentType: "application/json",
      data: JSON.stringify(formData),
      dataType: "json",
      encode: true
    }).done(function(data) {
      console.log("Passenger Record submitted: ", data);
      if (data.drivercode == "0") {
        alert_message(data.message);
      }
      if (!data.message) {
        passenger_table(data.stimulation);
      }
    });
  }

  document.getElementById("load").onclick = function() {
    var data = {
      pisocode: pisocode,
      pname: document.getElementById("stimulation-name").value,
      pusertype: "P",
      uid: document.getElementById("uid").value
    };
    $.ajax({
      type: "POST",
      url: "http://www.onlinetaxi.co.za/api/www_load_stimulation.php",
      data: JSON.stringify(data),
      dataType: "json",
      encode: true
    }).done(function(passenger_result) {
      console.log("passengers list is", passenger_result);
      localStorage.setItem(
        "passenger",
        JSON.stringify(passenger_result.stimulation)
      );
      if (passenger_result.message) {
        alert_message(passenger_result.message);
      } else {
        passenger_table(passenger_result.stimulation);
      }
    });
  };

  document.getElementById("stimulation-name").onkeyup = function() {
    load_stimulations();
  };

  function driver_route(formData) {
    $.ajax({
      type: "POST",
      url: "/driver_route",
      data: formData,
      dataType: "json",
      encode: true,
      async: false
    }).done(function(response) {
      proute = response;
      console.log("coordinates array", proute);
    });
    return proute;
  }
}

// NearBy tab
var drivers;
var passengers;
var distanceFromDriverToPassenger;
var interval = 10;
var nearby_form;

function onClickNearby() {
  window.location.hash = "Nearby";

  if (document.getElementById("driverForm")) {
    document
      .getElementsByClassName("leaflet-routing-geocoders")[0]
      .removeChild(DriverForm);
  }

  if (document.getElementById("PassengerForm")) {
    document
      .getElementsByClassName("leaflet-routing-geocoders")[0]
      .removeChild(document.getElementById("PassengerForm"));
  }

  nearby_form = document.createElement("form");
  nearby_form.id = "nearby_form";
  nearby_form.onsubmit = function(e) {
    e.preventDefault();
    saveData();
  };

  nearby_form.innerHTML = `
    <input id='driver-limit' type='number' placeholder='drivers' name='drivers'>
    <input id='time' type='number' placeholder='time' name='time'>
    <input id='radius' type='number' placeholder='radius' name='radius'>
    <input id='speed' type='number' placeholder='speed(m/s)' name='speed'>
    <input type="text" id='stimulation-name' placeholder='stimulation-name' list="datalist" autocomplete="off" style='margin-left: '10px''/>
    <datalist id="datalist"> 
    </datalist>
    <input type='number' id='uid' placeholder='uid'>
    <button id='load' type='button'>load</button>
    <button type='submit' class='btn' style='margin-top:10px'>Save</button>`;

  document
    .getElementsByClassName("leaflet-routing-geocoders")[0]
    .appendChild(nearby_form);
  document.getElementById("stimulation-name").onkeyup = function() {
    load_stimulations();
  };

  var nearby_columns = [
    "passenger Name",
    "Drivers Name",
    "Lat&Lon",
    "Distance and time to passenger(m)",
    "",
    "",
    ""
  ];
  var theads = document.getElementById("table_tr");

  for (i = 0; i < theads.children.length; i++) {
    nearby_th = document.createElement("th");
    nearby_th.id = "nearby-" + i;
    nearby_th.className = "nearby-column";
    nearby_th.append(nearby_columns[i]);
    theads.replaceChild(nearby_th, theads.children[i]);
  }
  if (table_body.children.length >= 1) {
    for (j = 0; j <= table_body.children.length; j++) {
      table_body.removeChild(table_body.children[0]);
    }
  }
  calulcate_max_distance = [];

  document.getElementById("load").onclick = function() {
    var data = {
      pisocode: pisocode,
      pname: document.getElementById("stimulation-name").value,
      pusertype: "",
      uid: document.getElementById("uid").value
    };
    $.ajax({
      type: "POST",
      url: "http://www.onlinetaxi.co.za/api/www_load_stimulation.php",
      data: JSON.stringify(data),
      dataType: "json",
      encode: true
    }).done(function(result) {
      console.log("onClickLoad", result);
      var drivers = [];
      var passengers = [];
      var distance_radius;
      var haversine_time;
      var driver_limit;
      var stimulation_id

      distance_radius = result.radius;
      haversine_time = result.haversinetime;
      driver_limit = result.nodriver;
      stimulation_id = result.id
      result.stimulation.forEach(simulation => {
        if (simulation.usertype == "D") {
          drivers.push(simulation);
        } else {
          passengers.push(simulation);
        }
      });

      drivers.forEach(driver => {
        passengers.forEach(async passenger => {      
          calculate_dist = {
            driver_platitude: driver.platitude,
            driver_plongitude: driver.plongitude,
            passenger_platitude: passenger.platitude,
            passenger_plongitude: passenger.plongitude,
            distance_radius: distance_radius,
            driver_id: driver.userid,
            passenger_id: passenger.userid,
            haversine_time: haversine_time,
            pasenger_name: passenger.firstname + passenger.lastname,
            driver_name: driver.firstname + driver.lastname,
            driver_limit: driver_limit,
            route: driver.route,
            uid: passenger.userid,
            stimulation: stimulation_id, 
            id: passenger.id
          };

          socket = io.connect(`http://localhost:9000/`);
          socket.emit("calculate_total_distance", calculate_dist);
        });
      });

      socket.on("osrm", function(osm_distance) {
        let response = osm_distance;
        if (response) {
          socket.emit("osm_distance", osm_distance);
        }
      });

      socket.on("coordinates", function(coordinate) {
        console.log(coordinate);
        nearby_table(coordinate);
      });
      get_distance_and_time(socket);
    });
  };
}

var get_nearby_object = [];
var distance__time;

function get_distance_and_time(socket) {
  socket.on("distance_and_time", function(distancetime) {
    console.log("dist", distancetime);
  });
}

function alert_message(message) {
  toast = document.createElement("div");
  toast.innerHTML = `<div class="alert alert-danger" role="alert" style='position:relative;top:10px'>${message}</div>`;
  formDiv.appendChild(toast);
  $(".alert").alert();
  setTimeout(function() {
    $(".alert").alert("close");
  }, 6000);
}

var socket;

function socket_simulation(table_id, start_coord) {
  socket = io.connect(`http://localhost:9000/${table_id}`);
  var carMarker = new L.marker(start_coord, { icon: carIcon });
  tableId = table_id;

  socket.on("coordinates", coordinate => {
    console.log("coordinates", coordinate);
    socket_coordinate = coordinate;
    if (is_Info_Btn && coordinate.table_id == tableId) {
      carMarker.setLatLng(coordinate.el);
      mymap.addLayer(carMarker);
    } else {
      mymap.removeLayer(carMarker);
    }
    if (is_Info_Btn && current_dlat == coordinate.el[0]) {
      mymap.removeLayer(carMarker);
    }
  });
}

function driver_data_table(data) {
  data.forEach(dataObject => {
    var row = document.createElement("tr");
    row.id = "table_row";
    var td1 = document.createElement("td");
    var td2 = document.createElement("td");
    var td3 = document.createElement("td");
    var td4 = document.createElement("td");
    var td5 = document.createElement("td");
    var td6 = document.createElement("td");
    var td7 = document.createElement("td");
    td1.append(dataObject.userid);
    td2.append(dataObject.firstname + dataObject.lastname);
    td3.append(dataObject.platitude + ",");
    td3.append(dataObject.plongitude);
    td3.className = "td3";
    td4.className = "td4";
    td5.className = "Control";

    var play_button = document.createElement("button");
    var play_i = document.createElement("i");

    play_i.className = "fas fa-play";
    play_button.setAttribute("id", "button");

    var info_button = document.createElement("button");
    var info_i = document.createElement("i");
    info_i.className = "fas fa-info";
    info_button.setAttribute("id", "button");
    info_button.setAttribute("style", "margin-left:6px");

    var pause_button = document.createElement("button");
    var pause_i = document.createElement("i");
    pause_i.className = "fas fa-pause";
    pause_button.setAttribute("id", "button");
    pause_i.setAttribute("style", "margin-left:6px");
    info_i.setAttribute("style", "position:relative;left: -7px");
    play_i.setAttribute("style", "position:relative;left: -2px");
    pause_i.setAttribute("style", "position:relative;left: -4px");
    pause_button.setAttribute("style", "margin-left:6px");
    play_button.append(play_i);
    info_button.append(info_i);
    pause_button.append(pause_i);
    play_button.onclick = function(e) {
      onClickPlayButton(e.path[2].childNodes[0].innerHTML);
    };
    info_button.onclick = function(e) {
      onClickInfoButton(e, e.path[2].childNodes[0].innerHTML);
    };
    pause_button.onclick = function(e) {
      onClickPauseButton(e.path[2].childNodes[0].innerHTML);
    };
    td5.append(play_button, info_button, pause_button);
    row.append(td1, td2, td3, td4, td5, td6, td7);
    td3.onclick = function(e) {
      onclickCoordinates(e);
    };
    td4.onclick = function(e) {
      onclickCoordinates(e);
    };

    td4.append(dataObject.dlatitude + ",");
    td4.append(dataObject.dlongitude);
    td6.append(dataObject.lastPublishTime);
    row.append(td1, td2, td3, td4, td5, td6, td7);

    table_body.append(row);
  });
}

function onClickInfoButton(e, tId) {
  is_Info_Btn = true;
  tableId = tId;
  (current_plat = e.path[2].childNodes[2].innerHTML.split(",")[0]),
    (current_dlat = e.path[2].childNodes[3].innerHTML.split(",")[0]),
    console.log(current_plat, current_dlat);
  showRoute(
    e.path[2].childNodes[2].innerText,
    e.path[2].childNodes[3].innerText
  );
}

function onClickPlayButton(table_id) {
  var formData = {
    speed: $("input[name=speed]").val(),
    instructions: JSON.stringify(CoordinatePair),
    distance: JSON.stringify(distance),
    table_id: table_id
  };

  var data = driver_route(formData);
  console.log(data);
  document.getElementById("speed").value = data.speed;
  socket_simulation(table_id, data.mapRoute[0]);
}

function onClickPauseButton(tableId) {
  console.log(tableId);
  $.ajax({
    type: "POST",
    url: "/pauseStimulation",
    data: { tableId: tableId },
    encode: true
  }).done(function(result) {});
}

function onclickCoordinates(e) {
  showRoute(
    e.path[1].childNodes[2].innerText,
    e.path[1].childNodes[3].innerText
  );
}

function passenger_table(data) {
  data.forEach(dataObject => {
    var row = document.createElement("tr");
    row.id = "table_row";
    var td1 = document.createElement("td");
    var td2 = document.createElement("td");
    var td3 = document.createElement("td");
    var td4 = document.createElement("td");
    var td5 = document.createElement("td");
    var td6 = document.createElement("td");
    var td7 = document.createElement("td");
    td1.append(dataObject.userid);
    td2.append(dataObject.firstname + dataObject.lastname);
    td3.append(dataObject.platitude + ",");
    td3.append(dataObject.plongitude);
    td3.className = "td3";
    td4.className = "td4";
    td5.className = "Control";
    td4.append(dataObject.dlatitude + ",");
    td4.append(dataObject.dlongitude);
    td6.append(dataObject.lastPublishTime);
    row.append(td1, td2, td3, td4, td5, td6, td7);
    table_body.append(row);
  });
}

tr_array = [];
td_pass_array = [];
var time;
var max_distance;
var sort_table = [];

function nearby_table(data) {
  var table_data = document.getElementById("table-body").children;
  console.log("distance calculated", data.distance);
  if (table_data.length == 0 && data.haversine_distance <= data.radius) {
    var row = document.createElement("tr");
    row.id = data.userid + data.passenger_id;

    var td1 = document.createElement("td");
    var td2 = document.createElement("td");
    var td3 = document.createElement("td");
    var td_dist = document.createElement("td");
    td_dist.id = `td_distance${data.userid + data.passenger_id}`;

    td1.append(data.passenger_name);
    td2.append(data.driver_name);
    var Booking_button = document.createElement("button");
    Booking_button.className = 'btn-default'
    Booking_button.id = 'book_stimulation'
    Booking_button.innerText = "book";
    td2.append(Booking_button);
    Booking_button.onclick = function() {
    let create_stimulation_detail = {
      pisocode: pisocode,
      uid: data.passenger_id,
      stimulation: data.stimulation,
      pdrivercode: data.userid,
      ppickup_km: data.distance,
      ppickup_time: data.time,
    }
       create_booking(create_stimulation_detail); 
    };
    td3.append(data.latitude + ",");
    td3.append(data.longitude);
    td_dist.append(data.distance+',');
    td_dist.append(data.time)
    row.append(td1, td2, td3, td_dist);
    table_body.appendChild(row);
  } else {
    for (tr = 0; tr < table_data.length; tr++) {
      var new_tr = table_data[tr].id;
      if (tr_array.length == 0 || !tr_array.includes(new_tr)) {
        tr_array.push(new_tr);
      }
      if (
        !tr_array.includes(data.userid + data.passenger_id) &&
        parseInt(data.haversine_distance) <= parseInt(data.radius)
      ) {
        {
          var row = document.createElement("tr");
          row.id = data.userid + data.passenger_id;
          var td1 = document.createElement("td");
          var td2 = document.createElement("td");
          var td3 = document.createElement("td");
          var td_dist = document.createElement("td");
          td_dist.id = `td_distance${data.userid + data.passenger_id}`;
          td1.append(data.passenger_name);
          td2.append(data.driver_name);

          var Booking_button = document.createElement("button");
          Booking_button.className='btn-default'
          Booking_button.id = 'book_stimulation'
          Booking_button.innerText = "book";
          td2.append(Booking_button);
          Booking_button.onclick = function() {
            let create_stimulation_detail = {
              pisocode: pisocode,
              uid: data.passenger_id,
              stimulation: data.stimulation,
              pdrivercode: data.userid,
              ppickup_km: data.distance,
              ppickup_time: data.time,
            }
            create_booking(create_stimulation_detail);
          };
          td3.append(data.latitude + ",");
          td3.append(data.longitude);
          td_dist.append(data.distance+',');
          td_dist.append(data.time)
          row.append(td1, td2, td3, td_dist);
          table_body.appendChild(row);
          if (!tr_array.includes(row.id)) {
            tr_array.push(row.id);
          }
        }
      } else if (tr_array.includes(data.userid + data.passenger_id)) {
        if (table_data[tr].id == data.userid + data.passenger_id) {
          table_data[tr].children[2].innerHTML =
            data.latitude + "," + data.longitude;
          table_data[tr].children[3].innerHTML = data.distance+','+data.time;
          if (parseInt(data.haversine_distance) > parseInt(data.radius)) {
            let index = tr_array.indexOf(table_data[tr].id);
            tr_array.splice(index, 1);
            table_body.removeChild(table_data[tr]);
          }
        }
      }
    }
  }
}

function load_stimulations() {
  var postData = { pisocode: pisocode };
  var searchText = $.trim($("#stimulation-name").val());

  if (searchText.length >= 2) {
    $.ajax({
      type: "POST",
      url: "http://www.onlinetaxi.co.za/api/www_show_stimulation.php",
      contentType: "application/json",
      data: JSON.stringify(postData),
      dataType: "json",
      encode: true
    }).done(function(response) {
      console.log("stimulations list is:", response.data);

      if (document.getElementById("datalist").options.length == 0) {
        for (i in response.data) {
          var option = document.createElement("option");
          option.innerText = response.data[i].stimulation;
          option.setAttribute("style", "font-size:2px");
          var datalist = document.getElementById("datalist");
          datalist.setAttribute("autocomplete", "off");
          datalist.appendChild(option);
        }
      }
    });
  }
}

function driver_route(formData) {
  $.ajax({
    type: "POST",
    url: "/driver_route",
    data: formData,
    dataType: "json",
    encode: true,
    async: false
  }).done(function(response) {
    console.log(formData);
    if (formData.play == "play") {
      console.log("stimulation", response);
      _response = response;
    } else {
      proute = response;
      console.log("coordinates array", proute);
    }
  });
  if (proute) {
    return proute;
  } else {
    return _response;
  }
}

function saveData() {
  var postdata = {
    pisocode: pisocode,
    pdriver: document.getElementById("driver-limit").value,
    pname: document.getElementById("stimulation-name").value,
    pradius: document.getElementById("radius").value,
    ptime: document.getElementById("time").value,
    uid: document.getElementById("uid").value
  };

  $.ajax({
    type: "POST",
    url: "http://www.onlinetaxi.co.za/api/www_change_stimulation.php",
    contentType: "application/json",
    data: JSON.stringify(postdata),
    dataType: "json",
    encode: true
  }).done(function(data) {
    console.log("change submitted: ", data);
  });
}

function play_stimulation(result, pusertype, limits) {
  if (result.message) {
    alert_message(result.message);
  } else {
    result.stimulation.forEach(stimulation => {
      current_uid.push(stimulation.userid);
    });
    result.stimulation.forEach(stimulation => {
      postData = {
        play: "play",
        mapRoute: JSON.stringify(stimulation.route),
        table_id: stimulation.userid,
        sid: stimulation.id,
        uid_data: current_uid
      };

      var response = driver_route(postData);
      driver_message = response.messageCode;
      if (response.messageCode != "0" && stimulation.usertype == "D") {
        socket_simulation(
          stimulation.userid,
          {
            latitude: stimulation.platitude,
            longitude: stimulation.plongitude
          },
          limits
        );
      }
    });
    current_uid.length = 0;
    if (driver_message != "0" && !result.message && pusertype == "D") {
      driver_data_table(result.stimulation);
    }
    if (driver_message == "0") {
      var message = "This stimulation is already running";
      alert_message(message);
    }
  }
}

function keypress(input) {
  e = new Event("keypress");
  e.keyCode = 13;
  e.target = input;
  input.dispatchEvent(e);

  e = document.createEvent("HTMLEvents");
  e.initEvent("keypress", true, true);
  e.keyCode = 13;
  e.target = input;
  input.dispatchEvent(e);
}

function create_booking(stimulation_details) {
  $.ajax({
    type: "POST",
    url: "https://www.onlinetaxi.co.za/api/www_stimulation_booking.php",
   /*  contentType: "application/json", */
    data: JSON.stringify(stimulation_details),
    dataType: "json",
    /* encode: true */
  }).done(function(data) {
    console.log("stimulation created: ", data);
  });
}
