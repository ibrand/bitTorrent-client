var Tracker = require('./Tracker');
var net = require('net');
var async = require('async');

var whoHasWhichPiece = [];

Tracker.makeRequestToTracker(function (peerListObject){
    // peer object contains IP addresses as keys and ports as values
    var hostIp = '96.126.104.219'; // Tom's IP will stay constant because he is running the test tracker
    var port = peerListObject[hostIp];

    // initialize the states of the peer
    var peerState = {
        hostIp: hostIp,
        port: port,
        am_choking: 1,
        peer_choking: 1,
        am_interested: 0,
        peer_interested: 0
    };

    console.log('peerState', peerState);

    // open up a socket with the first peer in the obj
    var client = net.connect(port, hostIp, function(){
        console.log('connected to server');
        // perform a handshake with that peer
        handshake(client);
    });

    // receive peer's handshake response
    processHandshake(client, function(){
        var waitingBuffer = new Buffer(0);

        // We have finished processing the handshake        
        client.on('data', function(data){
            waitingBuffer = Buffer.concat([waitingBuffer, data]);
            processBuffer(waitingBuffer);
        });
    });

    client.on('end', function(){
        console.log('disconnected from server');
    });
});

function processBuffer(buffer, peerState){
    // Check to see if the buffer has a complete message
    // messages will be formatted as: <lengthHeader><id><payload>

    var lengthHeader = buffer.readUIntBE(0,4); // 4 is the length of the lengthHeader
    console.log('lengthHeader', lengthHeader);

    // Then read that number of bytes and see if they're in the buffer
    for (var i = 0; i < lengthHeader; i++){
        if (buffer[i] === undefined){
            return; // escape out of the function if the buffer does not have a full msg
        }
    }
    // if we haven't escaped, grab the message out of the buffer
    var messageToProcess = new Buffer(lengthHeader);
    buffer.copy(messageToProcess, 0, 0, lengthHeader);

    // process it
    processMessage(messageToProcess, peerState);
    // then clear the buffer
    buffer = buffer.slice(lengthHeader, buffer.length);
}

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

function processMessage(buffer, peerState){
    // messages will be formatted as: <lengthHeader><id><payload>

    // first process the length header
    readChunk(client, 4, function(error, buffer){
        var lengthHeader = buffer.readUIntBE(0,buffer.length);
        console.log('lengthHeader',lengthHeader);

        if (lengthHeader === null){
            finishedMessage();
            throw new Error('No length header!');
        }
        if (lengthHeader === 0){
            // then the msg is keepalive so keep connection open
            console.log('in keepalive');
            finishedMessage();
        }

        // then read one more bit to determine the id of the message
        readChunk(client, 1, function(error, buffer){
            var id = buffer.readUIntBE(0,buffer.length);
            console.log('read chunk');
            if (id < 4 && lengthHeader === 1){
                console.log('ID', id);
                updateState(peerState, 'peerSent', id, function(){
                     processMessage(peerState, client, finishedMessage);
                });
            }
            if (id === 4 || id === 5){
                updateWhoHasWhatTable(id, peerState, client, lengthHeader);
                processMessage(peerState, client, finishedMessage);
            }

        });
    });
    finishedMessage();
}

function expressInterest(peerState, client, finishedWrite){
    // interested looks like this: 00012
    updateState(peerState, 'meSent', 2);
    var b = new Buffer([0, 0, 0, 1, 2]);
    client.write(b, function(){
        finishedWrite();
    });
}

function updateState(peerState, whoSentMessage, id, callback){
    if (whoSentMessage === 'peerSent'){
        if (id === 0){
            console.log('THEY choke');
            peerState.peer_choking = 1;
        } else if (id === 1){
            console.log('THEY unchoked');
            peerState.peer_choking = 0;
        } else if (id === 2){
            console.log('THEY are interested');
            peerState.peer_interested = 1;
        } else if (id === 3){
            console.log('THEY are uninterested');
            peerState.peer_interested = 0;
        }
    } else if (whoSentMessage === 'meSent'){
        if (whoSentMessage = 'meSent'){
            if (id === 0){
                console.log('I SENT choke');
                peerState.am_choking = 1;
            } else if (id === 1){
                console.log('I SENT unchoke');
                peerState.am_choking = 0;
            } else if (id === 2){
                console.log('I SENT interested');
                peerState.am_interested = 1;
            } else if (id === 3){
                console.log('I SENT uninterested');
                peerState.am_interested = 0;
            }
        }
    }
    callback();
    console.log('updatedState',peerState);
}

function updateWhoHasWhatTable(id, peerState, client, lengthHeader){
    if (id === 5){
        parseBitfield(peerState, client, lengthHeader);
    }
}

function parseBitfield(peerState, client, lengthHeader){
    console.log('in parseBitfield',peerState);
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
                    whoHasWhichPiece[i] = peerState.hostIp;
                }
            }
        }
    });
}
