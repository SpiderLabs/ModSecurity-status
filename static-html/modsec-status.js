/*
 * ModSecurity for Apache 2.x, http://www.modsecurity.org/
 * Copyright (c) 2004-2013 Trustwave Holdings, Inc. (http://www.trustwave.com/)
 *
 * You may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * If any of the files related to licensing are missing or if you have any
 * other questions related to licensing please contact Trustwave Holdings, Inc.
 * directly using the email address security@modsecurity.org.
 */


var url_base = "http://status.modsecurity.org/";
var api_path = "api/";
var api_uri = url_base + api_path;


var gradient = [
  'rgba(0, 255, 255, 0)',
  'rgba(255, 2, 2, 1)',
  'rgba(255, 91, 1, 1)',
  'rgba(255, 161, 2, 1)',
  'rgba(255, 168, 0, 1)',
  'rgba(255, 241, 0, 1)',
  'rgba(201, 253, 7, 1)',
  'rgba(129, 227, 16, 1)',
  'rgba(31, 188, 39, 1)',
  'rgba(0, 186, 89, 1)',
  'rgba(0, 211, 152, 1)',
  'rgba(0, 234, 245, 1)',
  'rgba(1, 179, 241, 1)',
  'rgba(0, 94, 194, 1)',
  'rgba(2, 22, 135, 1)',
  'rgba(7, 7, 81, 1)'
]

var lastFetchedEpoch = 0;
var map, pointarray, heatmap;
var heatmapData = [];
var redrawMapTimeout = 0;
var updateTimeOut = 0;
var preciseOnly = true;
var uniqueIds = true;
var firstItem = getEpoch();
var firstQueryEver = 1385690874 - 10 * 24 * 60 * 60;
var uiValues = [0, 0];
var balloonDate = 0;


// Detect which browser prefix to use for the specified CSS value
// (e.g., background-image: -moz-linear-gradient(...);
//        background-image:   -o-linear-gradient(...); etc).
// [from: http://stackoverflow.com/questions/15071062/using-javascript-to-edit-css-gradient]
function getCssValuePrefix(name, value)
{
  var prefixes = ['', '-o-', '-ms-', '-moz-', '-webkit-'];
  // Create a temporary DOM object for testing
  var dom = document.createElement('div');
  for (var i = 0; i < prefixes.length; i++)
  {
    // Attempt to set the style
    dom.style[name] = prefixes[i] + value;
    // Detect if the style was successfully set
    if (dom.style[name])
    {
      return prefixes[i];
    }
    dom.style[name] = ''; // Reset the style
  }
}

function processJson(json)
{
  $.each(json.results, function (i, item)
  {
    setTimeout(function ()
    {
      processItem(item);
    }, 0)
  });
  updateTimeOut = setTimeout(function ()
  {
    fetchJsonData(lastFetchedEpoch, getEpoch());
  }, 10000);
}

function showLoading()
{
  $("#consoleLoading")
    .fadeTo("slow", 0, function ()
    {
      $("#consoleLoading")
        .empty();
      $("#consoleLoading")
        .append(
          'Retrieving data... &nbsp; &nbsp;<img id="loadingGif" src="modsec-status-loading.gif">'
      );
      $("#consoleLoading")
        .fadeTo("slow", 1, function () {});
    });
}

function hideLoading()
{
  var data = new Date();
  $("#consoleLoading")
    .fadeTo("fast", 0, function ()
    {
      $("#consoleLoading")
        .empty();
      $("#consoleLoading")
        .append('Updated at ' + data.getHours() + ':' + data.getMinutes() +
          ':' + data.getSeconds());
      $("#consoleLoading")
        .fadeTo("fast", 1, function () {});
    });
  $("#legend")
    .fadeTo("slow", 1, function () {});
}

function fetchJsonData(from, to)
{
  lastFetchedEpoch = to;
  showLoading();
  var unique = "";

  //console.log("fetch: " + from + " to: " + to);
  //console.log(api_uri + "/" + from + "/" + to + "");
  if (uniqueIds == true)
  {
    unique = "/unique/";
  }
  else
  {
    unique = "/";
  }

  var apiData = $.getJSON(api_uri + unique + "/" + from + "/" + to + "", function ()
  {
    console.log("success");
  })
    .done(function (json)
    {
      processJson(json);
    })
    .fail(function (jqxhr, textStatus, error)
    {
      var err = textStatus + ", " + error;
      console.log("Request Failed: " + err);
    })
    .always(function ()
    {
      console.log("complete");
      hideLoading();
    });
}

function redrawMap()
{
  clearTimeout(redrawMapTimeout);
  redrawMapTimeout = setTimeout(function ()
  {
    redrawMapNow();
  }, 500);
}

function redrawMapNow(amount)
{
  //console.log("Paiting map.");
  var pointArray = new google.maps.MVCArray();
  if (preciseOnly)
  {
    for (var i = 0; i < heatmapData.length; i++)
      if (heatmapData[i][1] != '')
        pointArray.push(heatmapData[i][0]);
  }
  else
  {
    for (var i = 0; i < heatmapData.length; i++)
      pointArray.push(heatmapData[i][0]);
  }
  if (!heatmap)
  {
    heatmap = new google.maps.visualization.HeatmapLayer(
    {
      data: pointArray,
      map: map
    });
    changeGradient();
    changeRadius();
  }
  else
  {
    heatmap.setData(pointArray);
  }
  $("#amountOfData")
    .fadeTo("slow", 0, function ()
    {
      $("#amountOfData")
        .empty();
      $("#amountOfData")
        .append("<b>" + pointArray.getLength() +
          "</b> initialization records");
      $("#amountOfData")
        .fadeTo("slow", 1, function () {});
    });

  uiValues[0] = lastFetchedEpoch - 1 * 24 * 60 * 60;
  uiValues[1] = lastFetchedEpoch;

  $("#slider-range")
    .slider(
    {
      values: [uiValues[0], uiValues[1]]
    })
  $("#range-first-date")
    .empty();
  f = new Date((lastFetchedEpoch - 1 * 24 * 60 * 60) * 1000);
  d = f.getFullYear() + "-" + f.getMonth() + "-" + f.getDay() + "<BR>" + f.getHours() +
    ":" + f.getMinutes() + ":" + f.getSeconds();
  $("#range-first-date")
    .append("From " + d);
  balloonDate = "From " + d;
  showB(balloonDate);
  $(window)
    .resize(function ()
    {
      showB();
    });
}

function processItem(item)
{
  //    console.log('Item: ' + item.dns_server.ip);
  //    append_to_log_console(item);a
  if (item.ts < firstItem)
  {
    firstItem = item.ts;
  }
  draw_on_map(item);
  redrawMap();
}

function append_to_log_console(item)
{
  //alert(new Date(item.ts).getTime()/1000);
  $('#consoleContent')
    .append('<p>' + item.ts + ' ModSecurity version ' + item.version +
      ' started at ' + item.dns_server.country + ' using ' + item.apache)
  var elem = document.getElementById('consoleContent');
  elem.scrollTop = elem.scrollHeight;
}

function draw_on_map(item)
{
  heatmapData.push([new google.maps.LatLng(item.dns_server.latitude, item.dns_server
    .longitude), item.dns_server.city]);
}

function showB(content)
{
  if (content == null || content == '')
  {
    content = balloonDate;
  }
  $('#slider-handle')
    .showBalloon(
    {
      position: "top",
      contents: content,
      tipSize: 24
    });
}

function hideB()
{
  $('#slider-handle')
    .hideBalloon();
}

function initialize()
{
  // Style from: http://stackoverflow.com/questions/4003578/google-maps-in-grayscale
  var stylez = [
  {
    featureType: "all",
    elementType: "all",
    stylers: [
    {
      saturation: -70
    }]
  }];
  var mapOptions = {
    zoom: 2,
    minZoom: 2,
    center: new google.maps.LatLng(0, 0),
    mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'tehgrayz']
    //disableDefaultUI: true
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
    mapOptions);
  var mapType = new google.maps.StyledMapType(stylez,
  {
    name: "Grayscale"
  });
  map.mapTypes.set('tehgrayz', mapType);
  map.setMapTypeId('tehgrayz');
  $("#slider-range")
    .slider(
    {
      range: true,
      min: getEpoch() - (15 * 24 * 60 * 60),
      max: getEpoch(),
      values: [getEpoch() - (5 * 24 * 60 * 60), getEpoch()],
      step: 1,
      disabled: false,
      animate: "slow",
      start: function (event, ui)
      {
        hideB();
      },
      stop: function (event, ui)
      {
          $("#slider-range")
            .slider(
            {
              disabled: true
            });

        showB("Time selection is not implemented yet...");

        setTimeout(function ()
        {
          hideB();

          setTimeout(function () {
          var a = $("#slider-range")
            .slider(
            {
              values: [uiValues[0], uiValues[1]]
            })
              }, 500);

          setTimeout(function () {
            showB(null);
            $("#slider-range")
              .slider(
              {
                disabled: false
              });
            }, 900);
        }, 3000)
        return false;
      }
    });

  /* Legend div */
  var gradientPrefix = getCssValuePrefix('backgroundImage',
    'linear-gradient(left, #fff, #fff)');
  var back = gradientPrefix + 'linear-gradient(' + 'left';
  for (var i = 0; i < gradient.length; i++)
  {
    back = back + "," + gradient[i] + " " + (100 * (i + 1)) / gradient.length +
      "%";
  }
  back = back + ")";

  document.getElementById('colorBar')
    .style.backgroundImage = back;

  f = new Date(firstQueryEver * 1000);
  d = f.getFullYear() + "-" + f.getMonth() + "-" + f.getDay();
  $('#first-register')
    .empty();
  $('#first-register')
    .append(d);
  fetchJsonData(0, getEpoch());
  $('#max')
    .append('??');


  $('#ignore').click(function () {
      setPreciseOnly();
  });
  $('#uniq').click(function () {
      setUniqueIds();
  });

}

function getEpoch()
{
  return Math.round(new Date()
    .getTime() / 1000);
}

function setPreciseOnly()
{
  showLoading();
  preciseOnly = preciseOnly ? false : true;
  redrawMap();
}

function setUniqueIds()
{
  clearTimeout(updateTimeOut);
  showLoading();
  heatmapData = [];
  uniqueIds = uniqueIds ? false : true;
  fetchJsonData(firstQueryEver, getEpoch());
}

function toggleHeatmap()
{
  heatmap.setMap(heatmap.getMap() ? null : map);
}

function changeGradient()
{
  heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
}

function changeRadius()
{
  heatmap.set('radius', heatmap.get('radius') ? null : 10);
}

function changeOpacity()
{
  heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
}


google.maps.event.addDomListener(window, 'load', initialize);
