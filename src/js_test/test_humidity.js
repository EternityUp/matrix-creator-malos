// Warning! This is returning 0's.
// Missing low level logic. We're on it.

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
var creator_humidity_base_port = 20013 + 4 // port for Humidity driver.

var zmq = require('zmq')

// Import MATRIX Proto messages
var matrix_io = require('matrix-protos').matrix_io


// ********** Start error management.
var errorSocket = zmq.socket('sub')
errorSocket.connect('tcp://' + creator_ip + ':' + (creator_humidity_base_port + 2))
errorSocket.subscribe('')
errorSocket.on('message', (error_message) => {
  console.log('Message received: Humidity error: ' + error_message.toString('utf8'))
});
// ********** End error management.


// ********** Start configuration.
var configSocket = zmq.socket('push')
configSocket.connect('tcp://' + creator_ip + ':' + creator_humidity_base_port)

var config = matrix_io.malos.v1.driver.DriverConfig.create({
  delayBetweenUpdates: 2.0,  // 2 seconds between updates
  timeoutAfterLastPing: 6.0, // Stop sending updates 6 seconds after pings.
  humidity: matrix_io.malos.v1.sense.HumidityParams.create({
    currentTemperature: 23   // Real current temperature [Celsius] for calibration 
  })
})

// Send driver configuration.
configSocket.send(matrix_io.malos.v1.driver.DriverConfig.encode(config).finish())

// ********** End configuration.

// ********** Start updates - Here is where they are received.
var updateSocket = zmq.socket('sub')
updateSocket.connect('tcp://' + creator_ip + ':' + (creator_humidity_base_port + 3))
updateSocket.subscribe('')
updateSocket.on('message', (buffer) => {
  var data = matrix_io.malos.v1.sense.Humidity.decode(buffer)
  console.log(data)
});
// ********** End updates

// ********** Ping the driver
var pingSocket = zmq.socket('push')
pingSocket.connect('tcp://' + creator_ip + ':' + (creator_humidity_base_port + 1))
process.stdout.write("Sending pings every 5 seconds");
pingSocket.send(''); // Ping the first time.
setInterval(() => {
  pingSocket.send('');
}, 5000);
// ********** Ping the driver ends
