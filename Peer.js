var Tracker = require('./Tracker');
var net = require('net');
var async = require('async');
var flags = require('./flags');

var whoHasWhichPiece = [];
var downloadedPieces = [];

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
        var waitingQueue = new Buffer(0);

        // We have finished processing the handshake
        client.on('data', function(data){
            waitingQueue = Buffer.concat([waitingQueue, data]);
            // Recursively read from the waitingQueue
            waitingQueue = processBuffer(waitingQueue, peerState);

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
    if (whoHasWhichPiece.length > 0 && downloadedPieces.length !== whoHasWhichPiece.length){
        requestPiece(client);
    }
}

function updateDownloadedPieces(messageToProcess){
    // payload with a 4-byte piece index,
    // 4-byte block offset within the piece in bytes
    // then a variable length block containing the raw bytes for the requested piece.
    // The length of this should be the same as the length requested.
    var pieceIndex = messageToProcess.readUIntBE(0,4);
    var blockOffset = messageToProcess.readUIntBE(4,8);
    downloadedPieces[pieceIndex] = messageToProcess.slice(8, messageToProcess.length);
    return downloadedPieces;
}

function processBuffer(buffer, peerState){
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
    processMessage(messageToProcess, peerState);
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
        }
    ], finishedHandshake);
}

function processMessage(messageToProcess, peerState){
    // first process the length header
    var lengthHeader = messageToProcess.length;
    if (lengthHeader === null){
        throw new Error('No length header!');
    }
    if (lengthHeader === 0){
        // then the msg is keepalive so keep connection open
        console.log('in keepalive');
        return;
    }
    // get the id and slice it off the message
    var id = messageToProcess[0];
    messageToProcess = messageToProcess.slice(1, messageToProcess.length);
    console.log('id',id);

    switch(id){
        case flags.CHOKE_MESSAGE:
            updateState(peerState, 'peerSent', id);
            break;
        case flags.UNCHOKE_MESSAGE:
            updateState(peerState, 'peerSent', id);
            break;
        case flags.INTERESTED_MESSAGE:
            updateState(peerState, 'peerSent', id);
            break;
        case flags.UNINTERESTED_MESSAGE:
            updateState(peerState, 'peerSent', id);
            break;
        case flags.HAVE_MESSAGE:
            var pieceIndex = messageToProcess.readUIntBE(0,messageToProcess.length);
            whoHasWhichPiece = updateWhoHasWhichPiece(peerState.hostIp, pieceIndex);
            break;
        case flags.BITFIELD_MESSAGE:
            var bitFlagString = parseBitfield(messageToProcess);
            // change state based off the bitflags
            whoHasWhichPiece = updateWhoHasWhichPiece(peerState.hostIp, bitFlagString);
            break;
        case flags.PIECE_MESSAGE:
            console.log('GOT A PIECE');
            downloadedPieces = updateDownloadedPieces(messageToProcess);
            console.log('downloadedPieces', downloadedPieces);
            break;
        default:
            throw new Error('Cant yet handle that kind of message');
    }
}

function expressInterest(peerState, client){
    // interested looks like this: 00012
    updateState(peerState, 'meSent', 2);
    var buffer = new Buffer([0, 0, 0, 1, 2]);
    client.write(buffer);
}

function requestPiece(client){
    console.log('in request piece');
    var pieceLength = 16384; // probably the maximum piece length
    var randomPiece = Math.floor(Math.random() * whoHasWhichPiece.length);
    while (downloadedPieces[randomPiece] !== undefined){
        randomPiece = Math.floor(Math.random() * whoHasWhichPiece.length);
    }
    var buffer = new Buffer(17);
    buffer.writeUIntBE(13, 0, 4);
    buffer.writeUIntBE(6, 4, 1);
    buffer.writeUIntBE(randomPiece, 5, 4);
    buffer.writeUIntBE(0, 9, 4);
    buffer.writeUIntBE(pieceLength, 13, 4);

    client.write(buffer);
}

function updateState(peerState, whoSentMessage, id){
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
        if (whoSentMessage === 'meSent'){
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
    console.log('updatedState',peerState);
}

function updateWhoHasWhichPiece(hostIp, indexesToAddTo){
    if (typeof indexesToAddTo === 'number'){
        console.log('indexesToAddTo in Have', indexesToAddTo);
        whoHasWhichPiece[indexesToAddTo] = hostIp;
    }
    else if (typeof indexesToAddTo === 'string'){
        // change state based off the bitflags
        console.log('indexesToAddTo in Bitfield', indexesToAddTo);
        for(var i = 0; i < indexesToAddTo.length; i++){
            var flag = indexesToAddTo[i];
            if (flag === '1'){
                whoHasWhichPiece[i] = hostIp;
            }
        }
    }
    return whoHasWhichPiece;
}

function parseBitfield(messageToProcess){
    console.log('in parseBitfield');
    // The bitfield is a a bunch of bit flags set to 1 if the peer has the piece and 0 if they don't
    var bitFlagString = '';
    // build a string of each bitflag
    for(var i = 0; i < messageToProcess.length; i++){
        bitFlagString += messageToProcess[i].toString(2);
    }
    return bitFlagString;
}
