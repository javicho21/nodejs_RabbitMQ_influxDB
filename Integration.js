/**
 * Created by shailesh on 18/2/17.
 */
"use strict";

const {rabbitMq, influxDb} = require("./config"),
  RabbitMQ = require("./rabbitMq/rabbitMqService"),
  InfluxDbService = require("./influxDb/influxDbService"),
  rabbitMQObj = new RabbitMQ(rabbitMq),
  influxDbObj = new InfluxDbService(influxDb),
  {backupQueue, errorQueue} = rabbitMq;

rabbitMQObj.consume()
  .then(() => {
    console.log("RabbitMQ consumer Started");
  })
  .catch(err => {
    console.log("Error in consuming message =>>>>> ", err);
  });

rabbitMQObj.on("msgReceived", msg => {
  let msgContent = msg.content.toString();

  console.log("QUEUE MESSAGE => ", msgContent);

  influxDbObj.convertLineToJSON(msgContent)
    .then(result => {
      console.log("JSON Result => ", result);
      let {error, data, point} = result;

      if (error) {
        rabbitMQObj.publish(point, errorQueue)
      }else {
        influxDbObj.writeToDb([data]);
        rabbitMQObj.publish(point, backupQueue);
      }
    })
    .catch(err => {
      console.log("Error in convertLineToJSON() =>>>>> ", err);
    });
});

rabbitMQObj.on("error", err => {
  console.log("ERROR OCCURED IN RABBIT CONTROLLER =>>> ", err)
})

