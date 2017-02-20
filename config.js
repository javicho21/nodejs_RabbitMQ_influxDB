/**
 * Created by shailesh on 18/2/17.
 */
"use strict";
const config = {
  "rabbitMq": {
    "url": process.env.AMQP_URL || 'amqp://w1:dNrUHMn97DNN@data.jarova.com:5672',
    "queueName": process.env.QUEUE_NAME || "HarpkeFamilyFarm",
    "prefetchCount": 10000,
    "backupQueue": process.env.BACKUP_QUEUE || "InfluxDB-backup",
    "errorQueue": process.env.ERROR_QUEUE || "InfluxDB-error"
  },
  "influxDb": {
    // "url": process.env.INFLUX_URL || "http://w1:dNrUHMn97DNN@104.196.214.226:8083/queue1"
    "database": "queue1",
    "username": "w1",
    "password": "dNrUHMn97DNN",
    "host": "104.196.214.226",
    "port": 8086,
    "protocol": "http"
  }
};

module.exports = config;
