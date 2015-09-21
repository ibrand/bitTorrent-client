var Tracker = require('./Tracker');
var net = require('net');
var async = require('async');

var whoHasWhichPiece = [];

Tracker.makeRequestToTracker(function (peerListObject){
    // peer object contains IP addresses as keys and ports as values
    var hostIp = '96.126.104.219'; // Tom's IP will stay constant because he is running the test tracker
    var port = peerListObject[hostIp];

    // initialize the states of the peer
    var peerObject = {
        hostIp: hostIp,
        port: port,
        am_choking: 1,
        peer_choking: 1,
        am_interested: 0,
        peer_interested: 0
    };

    console.log('peerObject', peerObject);

    // open up a socket with the first peer in the obj
    var client = net.connect(port, hostIp, function(){
        console.log('connected to server');
        // perform a handshake with that peer
        handshake(client);
    });

    // receive peer's handshake response
    processHandshake(client, function(){
    
    // We have finished processing the handshake        
    processMessage(peerObject, client);

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

function processMessage(peerObject, client){
    // messages will be formatted as: <lengthHeader><id><payload>
    // lengthHeader tells how long the message will be
    // id tells what type of message you're dealing with
    // payload is the rest of the body of the message

    // first process the length header
    readChunk(client, 4, function(error, buffer){
        console.log('the length flag', buffer);
        var lengthHeader = buffer.readUIntBE(0,buffer.length);

        if (lengthHeader === 0){
            // then the msg is keepalive so keep connection open
            // no id
            // no payload
            console.log('in keepalive');
        }

        // then read one more bit to determine the id of the message
        readChunk(client, 1, function(error, buffer){
            var id = buffer.readUIntBE(0,buffer.length);
            console.log('read chunk');
            if (id === 0){
                // choke
                choke(peerObject, client, lengthHeader);
            }
            if (id === 1){
                // unchoke
                unchoke(peerObject, client, lengthHeader);
            }
            if (id === 2){
                // interested
                interested(peerObject, client, lengthHeader);
            }
            if (id === 3){
                // uninterested
                uninterested(peerObject, client, lengthHeader);
            }
            if (id === 4){
                // have
                have(peerObject, client, lengthHeader);
            }
            if (id === 5){
                // bitfield
                bitfield(peerObject, client, lengthHeader);
            }
            if (id === 6){
                // request
                request(peerObject, client, lengthHeader);
            }
            if (id === 7){
                // piece
                piece(peerObject, client, lengthHeader);
            }
            if (id === 8){
                // cancel
                cancel(peerObject, client, lengthHeader);
            }
            if (id === 9){
                // port
                port(peerObject, client, lengthHeader);
            }
            console.log('id',id);
        });
    });
}

function choke(peerObject, client, lengthHeader){
    peerObject.peer_choking = 1;
    console.log('in choke',peerObject);
}

function unchoke(peerObject, client, lengthHeader){
    peerObject.peer_choking = 0;
    console.log('in unchoke',peerObject);
}

function interested(peerObject, client, lengthHeader){
    peerObject.peer_interested = 1;
    console.log('in interested',peerObject);
}

function uninterested(peerObject, client, lengthHeader){
    peerObject.peer_interested = 0;
    console.log('in uninterested',peerObject);
}

function have(peerObject, client, lengthHeader){
    console.log('in have',peerObject);
}

function bitfield(peerObject, client, lengthHeader){
    console.log('in bitfield',peerObject);
    // The bitfield message is variable length, where X is the length of the bitfield.
    // The bitfield is a a bunch of bit flags set to 1 if the peer has the piece and 0 if they don't
    readChunk(client, lengthHeader, function(error, bitfield){
        if(bitfield.length !== lengthHeader){
            // TODO: throw an error here
            client.end();
        } else {
            var bitFlagString = '';
            // build a string of each bitflag
            for(var i = 0; i < lengthHeader; i++){
                bitFlagString += bitfield[i].toString(2);
            }
            // change state based off the bitflags
            for(var i = 0; i < bitFlagString.length; i++){
                var flag = bitFlagString[i];
                if (flag === '1'){
                    whoHasWhichPiece[i] = peerObject.hostIp;
                }
            }
        }
    });
}

function request(peerObject, client, lengthHeader){
    console.log('in request',peerObject);
}

function piece(peerObject, client, lengthHeader){
    console.log('in piece',peerObject);
}

function cancel(peerObject, client, lengthHeader){
    console.log('in cancel',peerObject);
}

function port(peerObject, client, lengthHeader){
    console.log('in port',peerObject);
}
