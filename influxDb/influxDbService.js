/**
 * Created by shailesh on 18/2/17.
 */
"use strict";
const Influx = require('influx'),
  Q = require("q");

class InfluxDbService {
  constructor(influxConfig) {
    if (!influxConfig ) {
      throw new Error("Missing InfluxDb dependencies");
    }
    this.influxConfig_ = influxConfig;
    this.influxConnectionUrl_ = influxConfig.url;
    this.connection_ = null;
  }

  connectToDb() {
    if (!this.connection_) {
      console.log(`${InfluxDbService.name}.connect(), Creating New Connection ===> `);
    }
    this.connection_ = this.connection_ || new Influx.InfluxDB(this.influxConfig_);
    return Q(this.connection_);
  }

  writeToDb(data) {
    // this.connection_ = this.connection_ ? this.connection_.writePoints(data) :
        return this.connectToDb()
          .then(conn => {
            return conn.writePoints([data], (errmsg, returnValue) => {
              if (errmsg) {
                console.log("Error Occured in writePoints =>> ", errmsg);
                throw err;
              }
              return returnValue;
            });
          })
          .catch(err => {
            console.log("Error in writeToDb() =>>>>> ");
            data.error = err.message ? err.message : 'Unknown';
            throw data;
          });

    // return this.connection_;
  }

  convertLineToJSON(line) {
    try {
      let parts = line.split(" "),
        tagsObj = {},
        fieldsObj = {},
        measurement,
        tags = parts[0] || '',
        fields = parts.length > 1 ? parts[1] : '',
        timestamp = parts[2];

      tags = this.splitColon(tags);

      measurement = tags.shift();

      if (measurement.indexOf("=") > -1 || timestamp && isNaN(timestamp)) {
        console.log("***** INVALID PAYLOAD *****");
        return Q({"error": true, "data": null, "point": line});
      }

      fields = this.splitColon(fields);

      if (tags && tags.length) {
        tags.forEach(val => {
          let key = val.split('=')[0],
            value = val.split('=')[1];
          tagsObj[key] = value;
        });
      }

      if (fields && fields.length) {
        fields.forEach(val => {
          let key = val.split('=')[0],
            value = val.split('=')[1],
            castedValue = this.cast(value);
          fieldsObj[key] = typeof castedValue !== "undefined" ? castedValue : value;
        });
      }

      if(timestamp){
        timestamp = parseInt(timestamp);
      }

      let out = {
        timestamp: timestamp,
        measurement: measurement,
        fields: fieldsObj,
        tags: tagsObj
      };

      console.log("***** Fields object *******", fieldsObj);
      console.log("***** Fields value type ***** ", typeof fieldsObj.value);

      if(!timestamp) delete out.timestamp;

      return Q({"error": false, "data": out, "point": line});
    }catch (e) {
      console.log(`${InfluxDbService.name} Error Thrown =>> `, e);
    }

  }

  splitColon(str) {
    str = str || '';
    str = str.replace(/\\/m, '#c#');
    str = str.split(',');
    str.map(function(s){
      return s.replace(/#c#/gm, ',');
    });
    return str;
  }

  cast(value) {
    if(value === undefined) return undefined;
    /*
     * Integers: 344i
     */
    if(value.match(/^\d+i$/m)){
      value = value.slice(0, -1);
      return parseInt(value);
    }

    /* boolean true
     * t, T, true, True, or TRUE
     */
    if(value.match(/^t$|^true$/im)){
      return true;
    }

    /* boolean false
     * f, F, false, False, or FALSE
     */
    if(value.match(/^f$|^false$/im)){
      return false;
    }

    /*
     * match strings
     */
    if(value.match(/^"(.*)"$/)){
      value = value.match(/^"(.*)"$/);
      if(value.length === 2){
        return value[1];
      }
    }

    if(!isNaN(value)) return parseFloat(value);

    return undefined;
  }

}

module.exports = InfluxDbService;
