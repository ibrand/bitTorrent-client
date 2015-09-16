var Tracker = require('./Tracker');
var net = require('net');

Tracker.makeRequestToTracker(function (peerObject){
    // peer object contains IP addresses as keys and ports as values
    var hostIp = '96.126.104.219'; // Tom's IP will stay constant because he is running the test tracker
    var port = peerObject[hostIp];

    // open up a socket with the first peer in the obj
    var client = net.connect(port, hostIp, function(){
        console.log('connected to server');
        handshake(client);
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

function handshake(client){
    client.write(new Buffer([19]));
    client.write('BitTorrent protocol','utf8');
    client.write(new Buffer(8).fill(0));
    client.write(Tracker.getRequestParams().info_hash);
    client.write(Tracker.getRequestParams().peer_id,'utf8');
}
