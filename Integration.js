/**
 * Created by shailesh on 18/2/17.
 */
"use strict";

const {rabbitMq, influxDb} = require("./config"),
  RabbitMQ = require("./rabbitMq/rabbitMqService"),
  InfluxDbService = require("./influxDb/influxDbService"),
  rabbitMQObj = new RabbitMQ(rabbitMq),
  influxDbObj = new InfluxDbService(influxDb),
  {backupQueue, errorQueue, needBackup} = rabbitMq;

rabbitMQObj.consume()
  .then(() => {
    console.log("RabbitMQ consumer Started");
  })
  .catch(err => {
    console.log("Error in consuming message =>>>>> ", err);
  });

rabbitMQObj.on("msgReceived", msg => {
  let msgContent = JSON.parse(msg.content.toString());

  console.log("QUEUE MESSAGE => ", msgContent);

  influxDbObj.writeToDb(msgContent)
    .then(result => {
      console.log('Insert Success', result);
      if (needBackup) {
        rabbitMQObj.publish(msgContent, backupQueue);
      }
    })
    .catch(err => {
      console.log('Failed to insert: ', err);
      rabbitMQObj.publish(JSON.stringify(err), errorQueue);
    });
});

rabbitMQObj.on("error", err => {
  console.log("ERROR OCCURED IN RABBIT CONTROLLER =>>> ", err)
});

process.on('unhandledRejection', (err, p) => {
});
