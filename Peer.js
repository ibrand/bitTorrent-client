var Tracker = require('./Tracker');
var net = require('net');
var async = require('async');

Tracker.makeRequestToTracker(function (peerObject){
    // peer object contains IP addresses as keys and ports as values
    var hostIp = '96.126.104.219'; // Tom's IP will stay constant because he is running the test tracker
    var port = peerObject[hostIp];

    // open up a socket with the first peer in the obj
    var client = net.connect(port, hostIp, function(){
        console.log('connected to server');
        // perform a handshake with that peer
        handshake(client);
    });

    // receive peer's handshake response
    processHandshake(client, function(){
        // We have finished processing the handshake
        // 4 how many bytes are in the length header 
        readChunk(client, 4, function(error, buffer){
            var lengthHeader = buffer.readUIntBE(0,buffer.length);
            readChunk(client, lengthHeader, function(error, buffer){
                console.log('rest of message', buffer);
            });
        });
    });

    client.on('end', function(){
        console.log('disconnected from server');
    });
});

function readChunk(client, lengthToRead, acquireBuffer){
    var buffer = client.read(lengthToRead);
    if (buffer){
        return acquireBuffer(null, buffer);
    }
    client.once('readable', function(){
        readChunk(client, lengthToRead, acquireBuffer);
    });
}

function handshake(client){
    client.write(new Buffer([19]));
    client.write('BitTorrent protocol','utf8');
    client.write(new Buffer(8).fill(0));
    client.write(Tracker.getRequestParams().info_hash);
    client.write(Tracker.getRequestParams().peer_id,'utf8');
}

function processHandshake(client, finishedHandshake){
    async.waterfall([
        function(callback) {
            readChunk(client, 1, callback);
        }, function(buffer, callback) {
            console.log('single byte',buffer.toString());
            readChunk(client, 19, callback);
        }, function(buffer, callback) {
            console.log('protocol',buffer.toString());
            readChunk(client, 8, callback);
        }, function(buffer, callback) {
            console.log('reserve bytes',buffer.toString());
            readChunk(client, 20, callback);
        }, function(buffer, callback) {
            console.log('sha1',buffer.toString());
            readChunk(client, 20, callback);
        }, function(buffer, callback) {
            console.log('peer_id',buffer.toString());
            callback();
        },
    ], finishedHandshake);
}

