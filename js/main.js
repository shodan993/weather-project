//global containers for weather data
var weatherArray = [];
var forecastArray = [];
var defaultLocation;
var positionResult;
var latLng;

//on page load, check for default location
//since introducing "find my location", i had to make this run 100% with coordinates instead of $search result
//localstorage gets a string, but that won't work with the query building functions, so i split it
if (localStorage.location != null) {
  console.log("at page load, local default was: " + localStorage.location);
  defaultLocation = localStorage.getItem('location');
  var formattingArray = defaultLocation.split(','); //split at the comma
  var formattedPosition = ("lat=" + formattingArray[0] + "&lon=" + formattingArray[1]);
  console.log("formatted coordinate lookup being sent to fetchDataCoords is: " + formattedPosition);
  setTimeout(function(){fetchDataCoords(formattedPosition);}, 50); //the delay lets the compiler define fetchData before it gets invoked
} else {
    console.log("There is no default location in localStorage");
};

//click handler
$('#location-submit').on('click', function () {
  weatherArray.length = 0;  //empties the array
  forecastArray.length = 0;
  console.log("clicked the submit button")
  var $search = $('#location-input').val();
  defaultLocation = $search;
  console.log("search input was: " + $search);
  $('#location-input').val('');
  fetchData($search);
});

$('#location-find').on('click', function getLocation() {
  console.log("clicked the location button");
  weatherArray.length = 0;  //empties the array
  forecastArray.length = 0;
  navigator.geolocation.getCurrentPosition(function (position) {
    defaultLocation = position;
    positionResult = position;
    console.log("the position lookup returned: " + positionResult);
    console.log("positionResult.coords.latitude: " + positionResult.coords.latitude);
    console.log("positionResult.coords.longitude: " + positionResult.coords.longitude);
    var formattedPosition = ("lat=" + positionResult.coords.latitude + "&lon=" + positionResult.coords.longitude)
    console.log("formatted for fetchDataCoords: " + formattedPosition);
    console.log("sending formattedPosition to fetchDataCoords");
    fetchDataCoords(formattedPosition);
  });
});

//functions
var fetchData = function ($search) {
  //URL components
  var baseUrl = "http://api.openweathermap.org/data/2.5/";
  var current = "weather?q=";
  var forecast = "forecast?q=";
  var cityName = $search;
  var country = ",us"
  var apiKey = "&APPID=94e4fb6ff9320109825dcbc988e23b69";
  var units = "&units=imperial"
  //concatenated URLs
  var currentQuery = baseUrl + current + cityName + country + apiKey + units;
  var forecastQuery = baseUrl + forecast + cityName + country + apiKey + units;
  //log the URLs for testing/viewing data
  console.log("concatenated URL for current weather request: " + currentQuery);
  console.log("concatenated URL for forecast weather request: " + forecastQuery);
  //make the ajax calls separately, push to arrays, push to html
  ajaxFunc(currentQuery, weatherArray, addWeather);
  console.log("ajax call for current weather complete");
  ajaxFunc(forecastQuery, forecastArray, addForecast);
  console.log("ajax call for forecast weather complete");
};

//this is a tweaked version of fetchData that concats appropriately for using geolocation and coordinates
var fetchDataCoords = function (coords) {
  //URL components
  var baseUrl = "http://api.openweathermap.org/data/2.5/";
  var current = "weather?";
  var forecast = "forecast?";
  var coords = coords;
  var apiKey = "&APPID=94e4fb6ff9320109825dcbc988e23b69";
  var units = "&units=imperial"
  //concatenated URLs
  var currentQuery = baseUrl + current + coords + apiKey + units;
  var forecastQuery = baseUrl + forecast + coords + apiKey + units;
  //log the URLs for testing/viewing data
  console.log("concatenated URL for current weather request: " + currentQuery);
  console.log("concatenated URL for forecast weather request: " + forecastQuery);
  //make the ajax calls separately, push to arrays, push to html
  ajaxFunc(currentQuery, weatherArray, addWeather);
  console.log("ajax call for current weather complete");
  ajaxFunc(forecastQuery, forecastArray, addForecast);
  console.log("ajax call for forecast weather complete");
}

//ajax function.  accepts a source URL, target array, and target function.
var ajaxFunc = function (url, arr, func) {
  $.ajax({
    method: "GET",
    url: url,
    dataType: "json",
    success: function(data) {
      arr.push(data);
      func(data);
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(textStatus);
    }
});
};

var addWeather = function (data) {
  $('.weather-main').empty();
    weatherArray.push(data);
    console.log("weatherArray has been updated");
};

var addForecast = function (data) {
  $('.forecast-main').empty();
    forecastArray.push(data);
    console.log("forecastArray has been updated");
    setTimeout(function(){findState(data);}, 250);
};

//uses googleapi to find city/state from coords
var findState = function ($search) {
  latLng = (weatherArray[0].coord.lat + ',' + weatherArray[0].coord.lon);
  var Url = ("https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latLng +
    "&sensor=true&result_type=locality&key=AIzaSyCIF-nV9qLeAriwePo8cTdgHGEuH_VAno0");
  console.log("the latLng value is: " + latLng);
  console.log("the concat latLng URL is: " + Url);
  $.ajax({
    url: Url,
    success: function (data) {
      var cityState = (data.results[0].formatted_address);
      console.log("The result of the state lookup function is: " + cityState);
      renderWeather(cityState);
    }
  });
};

var renderWeather = function (cityState) {
  console.log("renderWeather has been invoked");

  var temperature = weatherArray[0].main.temp;
  var tempRounded = temperature.toFixed(1);
  var description = weatherArray[0].weather[0].main;
  var icon = weatherArray[0].weather[0].icon;
  console.log("the icon is: " + icon);

  var source = $('#weather-handlebars').html();
  var weatherMainDisplayTemplate = Handlebars.compile(source);
  var newHTML = weatherMainDisplayTemplate(
    {
    temp: (tempRounded + "° F"),
    location: cityState,
    description: description,
    image: ("http://openweathermap.org/img/w/" + icon + ".png")
    }
  );

  $('.weather-main').append(newHTML);
  changeBackground(icon);
  console.log("renderWeather completed, starting renderForecast")
  $('#set-default').on('click', setDefault);
  renderForecast();
};


var renderForecast = function () {
  console.log("renderForecast has started");
  console.log("contents of the forecastArray are on the next line:")
  console.log(forecastArray);
  var forecasts = forecastArray[0].list;
  var numberForecasts = forecasts.length;
  console.log("There are " + numberForecasts + " forecasts in 3hr increments");

  console.log("now looping through the forecast object");
  for (var i=6; i<numberForecasts; i+=8) {
    console.log("This is index: " + i)

    var temperature = forecastArray[0].list[i].main.temp;
    var tempRounded = temperature.toFixed(0);
    console.log("Temp for this index: " + tempRounded);

    var timestamp = forecastArray[0].list[i].dt;
    console.log("Unix timestamp for this index: " + timestamp);
    var timestampConverted = moment.unix(timestamp).format('MMMM Do YYYY, h:mm:ss a');
    console.log("Converted timestamp for this index: " + timestampConverted);
    var dayConverted = moment.unix(timestamp).format('dddd');
    console.log("Day for this index: " + dayConverted);

    var source = $('#forecast-handlebars').html();
    var weatherForecastTemplate = Handlebars.compile(source);
    var newHTML = weatherForecastTemplate(
      {
      description: forecastArray[0].list[i].weather[0].main,
      image: ("http://openweathermap.org/img/w/" + forecastArray[0].list[i].weather[0].icon + ".png"),
      temp: (tempRounded + "° F"),
      day: dayConverted
      }
    );
    $('.forecast-main').append(newHTML);
  }
  console.log("Forecast loop complete");
};

var setDefault = function () {
  console.log("clicked the set default button")
  localStorage.setItem('location', latLng); //it stores coordinates, not city name
  console.log("localstored default: " + localStorage.location);
};

var changeBackground = function (icon) {
  if (icon === "03d" |
    icon === "03n" |
    icon === "04d" |
    icon === "04n" |
    icon === "09d" |
    icon === "09n" |
    icon === "10d" |
    icon === "10n" |
    icon === "11d" |
    icon === "11n") {
    document.body.style.backgroundColor = "#EAEDED";
  } else if (icon === "01d" | icon === "02d" ) {
    document.body.style.backgroundColor = "#F9E79F";
  } else if (icon === "01n" | icon === "02n" ) {
    document.body.style.backgroundColor = "#808080";
  }
};
