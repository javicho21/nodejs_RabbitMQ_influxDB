/**
 * Created by shailesh on 18/2/17.
 */
"use strict";

const amqp = require("amqplib"),
  EventEmitter = require('events').EventEmitter;

class RabbitMQ extends EventEmitter {
  constructor(rabbitConfig) {
    super();

    if (!rabbitConfig || !rabbitConfig.url) {
      throw new Error("Missing RabbitMQ dependencies");
    }
    this.rabbitConfig_ = rabbitConfig;
    this.connectionUrl_ = rabbitConfig.url;
    this.connection_ = null;
    this.channel_ = null;
    this.connectionOptions_ = rabbitConfig.options || {};
    this.queueOptions_ = {
      "durable": true,
      "autoDelete": false,
      // "arguments": {
      //   "x-message-ttl": 24 * 60 * 60 * 1000,
      //   "maxLength": 1000
      // }
    };

    /*this.exchangeOptions_ = {
      "durable": true,
      "autoDelete": false,
      "alternateExchange": "",
      "arguments": {}
    }*/
  }

  connect() {
    if (!this.connection_) {
      console.log(`${RabbitMQ.name}.connect(), Creating New Connection ===> `);
    }
    this.connection_ = this.connection_ || amqp.connect(this.connectionUrl_, this.connectionOptions_);
    return this.connection_;
  }

  createChannel() {
    this.channel_ = this.channel_ ||
      this.connect()
        .then(conn => {
          console.log(`${RabbitMQ.name}.createChannel(), Creating New Channel ==> `);
          return conn.createConfirmChannel();
        })
        .catch(err => {
          console.log("Error in creating RabbitMQ Channel ", err);
        });

    return this.channel_;
  }

  publish(message, queue = null) {

    let {queueName} = this.rabbitConfig_,
      queueOptions = Object.assign({}, this.queueOptions_);

    queueName = queue || queueName;

    return this.createChannel()
      .then(channel => {
        console.log(`${RabbitMQ.name}.publish(): Publishing the message in queue: ${queueName} `);
        channel.assertQueue(queue, this.queueOptions_);

        // let bufferMsg = typeof message === "string" ? Buffer.from(message) : Buffer.from(JSON.stringify(message));

        channel.sendToQueue(queue, Buffer.from(String(message)), (err, result) => {
          if (!err) {
            console.log(" [x] Sent %s", result);
          }else {
            console.log("Error Occured => ", err);
          }
        });
      })
      .catch(err => {
        console.log("Error in publishing the message", err);
        this.connection_ = null;
        this.channel_ = null;
        this.emit("error", err);
      });
  }

  consume(queue = null) {

    let {queueName} = this.rabbitConfig_,
      queueOptions = Object.assign({}, this.queueOptions_);

    queueName = queue || queueName;

    return this.createChannel()
      .then(channel => {

        console.log(`${RabbitMQ.name}.consume(): Consuming the message from queue: ${queueName} `);

        console.log(`${RabbitMQ.name}.setChannelPrefetch(): Initializing channel prefetch ==> `);
        channel.prefetch(this.rabbitConfig_.prefetchCount, false);
        console.log("Prefetch count: %s successfully set for channel: ", this.rabbitConfig_.prefetchCount);

        // channel.assertExchange(exchangeName, exchangeType, this.exchangeOptions_);

        return channel.assertQueue(queueName, queueOptions)
          .then(queueRes => {

            channel.consume(queueRes.queue, msg => {
              console.log("Consuming Message...", msg.content.toString());

              this.emit("msgReceived", msg);

              channel.ack(msg);

            }, {"noAck": false});

          });
      })
      .catch(err => {
        console.log("Error in consuming the message", err);
        this.connection_ = null;
        this.channel_ = null;
        this.emit("error", err);
      });
  }
}

module.exports = RabbitMQ;
