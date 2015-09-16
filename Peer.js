var Tracker = require('./Tracker');
var net = require('net');

Tracker.makeRequestToTracker(function (peerObject){
    // peer object contains IP addresses as keys and ports as values
    var hostIp = '96.126.104.219'; // Tom's IP will stay constant because he is running the test tracker
    var port = peerObject[hostIp];

    // open up a socket with the first peer in the obj
    var client = net.connect(port, hostIp, function(){
        console.log('connected to server');
        client.write("world!");
    });
    client.on('data', function(data){
        console.log(data.toString());
        client.end();
    });
    client.on('end', function(){
        console.log('disconnected from server');
    });
    // perform a handshake with that peer
});