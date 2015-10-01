var Tracker = require('./Tracker');
var PeerStateList = require('./PeerState');
var PeerStateList = PeerStateList.PeerStateList; // need to figure out a better way to do this...
var Message = require('./Message');
var net = require('net');
var async = require('async');

var whoHasWhichPiece = [];
var downloadedPieces = [];

Tracker.makeRequestToTracker(function (peerListObject){
    // peer object contains IP addresses as keys and ports as values
    var hostIp = '96.126.104.219'; // Tom's IP will stay constant because he is running the test tracker
    var port = peerListObject[hostIp];

    var peerStates = new PeerStateList();
    // initialize the states of the peer
    peerStates.add(
    {
        hostIp: hostIp,
        port: port,
        am_choking: 1,
        peer_choking: 1,
        am_interested: 0,
        peer_interested: 0
    }
    );
    console.log('peerStates',peerStates);

    // open up a socket with the first peer in the obj
    var client = net.connect(port, hostIp, function(){
        console.log('connected to server');
        // perform a handshake with that peer
        handshake(client);
    });

    // receive peer's handshake response
    processHandshake(client, function(){
        var peerId = hostIp;
        var peerState = peerStates.getState(hostIp);
        var waitingQueue = new Buffer(0);

        // We have finished processing the handshake        
        client.on('data', function(data){
            var keepReading = true;
            waitingQueue = Buffer.concat([waitingQueue, data]);
            // Recursively read from the waitingQueue
            waitingQueue = processBuffer(waitingQueue, peerId);

            sendMessages(peerState, client);
        });
    });

    client.on('end', function(){
        console.log('disconnected from server');
    });
});

function sendMessages(peerState, client){
    if (peerState.am_interested === 0){
        expressInterest(peerState, client);
    }
    if (whoHasWhichPiece.length > 0){
        requestPiece(client);
    }
}

function processBuffer(buffer, peerId){
    // Check to see if the buffer has a complete message
    // messages will be formatted as: <lengthHeader><id><payload>
    var lengthHeaderSize = 4;
    if (buffer.length < lengthHeaderSize){
        return buffer;
    }

    var messageContentLength = buffer.readUIntBE(0,lengthHeaderSize);
    var fullMessageLength = lengthHeaderSize + messageContentLength;

    // if the message that we think we should be processing is longer than the buffer,
    // then we must not have the whole thing yet, so return and read more data
    if (fullMessageLength > buffer.length){
        return buffer;
    }

    // if we haven't returned, we have the whole message!
    // grab the message out of the buffer for processing
    var messageToProcess = new Buffer(messageContentLength);
    buffer.copy(messageToProcess, 0, lengthHeaderSize, fullMessageLength);

    // process it
    Message.processMessage(messageToProcess, peerId);
    // then return the rest of the buffer
    return processBuffer(buffer.slice(fullMessageLength, buffer.length), peerState);
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

function expressInterest(peerId, client){
    // interested looks like this: 00012
    PeerStateList.updateState(peerId, 'meSent', 2);
    var buffer = new Buffer([0, 0, 0, 1, 2]);
    client.write(buffer);
}

function requestPiece(client){
    console.log('in request piece');
    var pieceLength = 16384 // probably the maximum piece length
    var randomPiece = Math.floor(Math.random() * whoHasWhichPiece.length);

    var buffer = new Buffer(17);
    buffer.writeUIntBE(13, 0, 4);
    buffer.writeUIntBE(6, 4, 1);
    buffer.writeUIntBE(randomPiece, 5, 4);
    buffer.writeUIntBE(0, 9, 4);
    buffer.writeUIntBE(pieceLength, 13, 4);

    client.write(buffer);
}
