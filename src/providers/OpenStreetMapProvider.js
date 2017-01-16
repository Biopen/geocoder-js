if (typeof GeocoderJS === "undefined" && typeof require === "function") {
  var GeocoderJS = require("../GeocoderJS.js");
  require("../Geocoded.js");
  require("../ExternalURILoader.js");
  require("../providers/ProviderBase.js");
}

;(function (GeocoderJS) {
  "use strict";
  
  var useSSL;
  var email;
  var countrycodes;

  GeocoderJS.OpenStreetMapProvider = function(_externalLoader, options) {
    if (_externalLoader === undefined) {
      throw "No external loader defined.";
    }
    this.externalLoader = _externalLoader;

    options = (options) ? options : {};

    countrycodes = (options.countrycodes) ? options.countrycodes : null;
    useSSL = (options.useSSL) ? options.useSSL : false;
    email = (options.email) ? options.email : null;
  };

  GeocoderJS.OpenStreetMapProvider.prototype = new GeocoderJS.ProviderBase();
  GeocoderJS.OpenStreetMapProvider.prototype.constructor = GeocoderJS.OpenStreetMapProvider;

  GeocoderJS.OpenStreetMapProvider.prototype.geocode = function(searchString, callback) {
    this.externalLoader.setOptions({
      protocol: (useSSL) ? 'https' : 'http',
      host: 'nominatim.openstreetmap.org',
      pathname: 'search'
    });

    var params = {
      format: 'json',
      q: searchString,
      addressdetails: 1
    };

    if (email) { params.email = email; }
    if (countrycodes) { params.coutrycodes = countrycodes; }

    this.executeRequest(params, callback);
  };

  GeocoderJS.OpenStreetMapProvider.prototype.geodecode = function(latitude, longitude, callback) {
    this.externalLoader.setOptions({
      protocol: (useSSL) ? 'https' : 'http',
      host: 'nominatim.openstreetmap.org',
      pathname: 'reverse'
    });

    var params = {
      format: 'json',
      lat: latitude,
      lon: longitude,
      addressdetails: 1,
      zoom: 18
    };

    if (email) { params.email = email; }
    if (countrycodes) { params.countrycodes = countrycodes; }

    var _this = this;

    this.executeRequest(params, callback);
  };



  GeocoderJS.OpenStreetMapProvider.prototype.executeRequest = function(params, callback) {
    var _this = this;

    this.externalLoader.executeRequest(params, function(data) {
      var results = [];
      if (data.length) {
        for (var i in data) {
          results.push(_this.mapToGeocoded(data[i]));
        }
      } else {
        results = null;
      }

      callback(results);
    });
  };

  GeocoderJS.OpenStreetMapProvider.prototype.mapToGeocoded = function(result) {
    var geocoded = new GeocoderJS.Geocoded();

    if (result.length === 0) return null;

    geocoded.latitude = result.lat * 1;
    geocoded.longitude = result.lon * 1;
    //geocoded.formattedAddress = result.display_name;
    
    geocoded.bounds = [
      parseFloat(result.boundingbox[0]),
      parseFloat(result.boundingbox[2]),
      parseFloat(result.boundingbox[1]),                        
      parseFloat(result.boundingbox[3])
    ];     
    geocoded.streetNumber = (result.address.house_number !== undefined) ? result.address.house_number : undefined;
    geocoded.streetName = result.address.road;
    geocoded.city = result.address.city;
    geocoded.region = result.address.state;
    geocoded.postal_code = result.address.postcode;

    if (geocoded.streetNumber)
    {
      geocoded.formattedAddress = geocoded.streetNumber + ' ' + geocoded.streetName + ', ' + geocoded.city;
    }
    else if (geocoded.streetName)
    {
      geocoded.formattedAddress = geocoded.streetName + ', ' + geocoded.city;
    }
    else if (geocoded.city)
    {
      geocoded.formattedAddress = geocoded.city + ' ' + geocoded.postal_code;
    }
    else if (geocoded.county)
    {
      geocoded.formattedAddress = geocoded.county + ', ' + geocoded.region;
    }
    else if (geocoded.region)
    {
      geocoded.formattedAddress = geocoded.region;
    }
    else
    {
      geocoded.formattedAddress = geocoded.state;
    }

    return geocoded;
  };
  
})(GeocoderJS);
