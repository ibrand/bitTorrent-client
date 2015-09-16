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

    processHandshake(client);

    // client.on('data', function(data){
    //     console.log('LENGTH in bytes', data.length);
    //     console.log(data.toString(),'\n');
    //     client.end();
    // });
    client.on('end', function(){
        console.log('disconnected from server');
    });
    // perform a handshake with that peer
});

function readChunk(client, lengthToRead, acquireBuffer){
    var buffer = client.read(lengthToRead);
    if (buffer){
        return acquireBuffer(buffer);
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

function processHandshake(client){
    console.log('IN PROCESS HANDSHAKE');
    readChunk(client, 1, function(buffer){
        console.log('Inside first read chunk');
        console.log('single byte',buffer.toString());
        readChunk(client, 19, function(buffer){
            console.log('protocol',buffer.toString());
            readChunk(client, 8, function(buffer){
                console.log('reserve bytes',buffer.toString());
                readChunk(client, 20, function(buffer){
                    console.log('sha1',buffer.toString());
                    readChunk(client, 20, function(buffer){
                        console.log('peer_id',buffer.toString());
                        client.end();
                    });
                });
             });
        });
    });
}
