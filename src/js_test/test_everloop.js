// This is how we connect to the creator. IP and port.
// The IP is the IP I'm using and you need to edit it.
// By default, MALOS has its 0MQ ports open to the world.

// Every device is identified by a base port. Then the mapping works
// as follows:
// BasePort     => Configuration port. Used to config the device.
// BasePort + 1 => Keepalive port. Send pings to this port.
// BasePort + 2 => Error port. Receive errros from device.
// BasePort + 3 => Data port. Receive data from device.

var creator_ip = process.env.CREATOR_IP || '127.0.0.1'
var creator_everloop_base_port = 20013 + 8 // port for Everloop driver.

var zmq = require('zmq')

// Import MATRIX Proto messages
var matrix_io = require('matrix-protos').matrix_io


// To trigger an error message you can send an invalid configuration to the driver.
// For instance, set a number of leds != 35.
var errorSocket = zmq.socket('sub')
errorSocket.connect('tcp://' + creator_ip + ':' + (creator_everloop_base_port + 2))
errorSocket.subscribe('')
errorSocket.on('message', (error_message) => {
  console.log('Message received: Pressure error: ' + error_message.toString('utf8'))
});

var configSocket = zmq.socket('push')
configSocket.connect('tcp://' + creator_ip + ':' + creator_everloop_base_port /* config */)

var max_intensity = 50
var intensity_value = max_intensity

function setEverloop() {
    var image = matrix_io.malos.v1.io.EverloopImage.create()
    for (var j = 0; j < 35; ++j) {
      var ledValue = matrix_io.malos.v1.io.LedValue.create({
        red: 0,
        green: intensity_value,
        blue: 0,
        white: 0
      });
      image.led.push(ledValue)
    }
    var config = matrix_io.malos.v1.driver.DriverConfig.create({
      image: image
    })
    configSocket.send(matrix_io.malos.v1.driver.DriverConfig.encode(config).finish());
}

setEverloop(intensity_value)
setInterval(() => {
  intensity_value -= 1
  if (intensity_value < 0)
    intensity_value = max_intensity
  setEverloop()
}, 10);
