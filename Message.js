var PeerStateList = require('./PeerState');

function processMessage(messageToProcess, peerId, peerStates, whoHasWhichPiece){
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

    if (id < 4){
        console.log('ID < 4', id);
        peerStates.updateState(peerId, 'peerSent', id);
    }
    else if (id === 4 || id === 5){
        whoHasWhichPiece = updateWhoHasWhichPiece(id, messageToProcess, peerId, whoHasWhichPiece);
    }
    else if (id === 7){
        console.log('GOT A PIECE');
        processPiece(messageToProcess);
    }
    else {
        console.log('ID = ', id, 'msg: ', messageToProcess);
        throw new Error('ID is not accounted for yet in if statements');
    }
}

function parseHave(messageToProcess, peerId, whoHasWhichPiece){
    console.log('in parseHave');
    var pieceIndex = messageToProcess.readUIntBE(0,messageToProcess.length);
    whoHasWhichPiece[pieceIndex] = peerId;
    return whoHasWhichPiece;
}

function parseBitfield(messageToProcess, peerId, whoHasWhichPiece){
    console.log('in parseBitfield');
    // The bitfield message is variable length, where X is the length of the bitfield.
    // The bitfield is a a bunch of bit flags set to 1 if the peer has the piece and 0 if they don't
    var bitFlagString = '';
    // build a string of each bitflag
    for(var i = 0; i < messageToProcess.length; i++){
        bitFlagString += messageToProcess[i].toString(2);
    }
    // change state based off the bitflags
    for(var i = 0; i < bitFlagString.length; i++){
        var flag = bitFlagString[i];
        if (flag === '1'){
            whoHasWhichPiece[i] = peerId;
        }
    }
    return whoHasWhichPiece;
}

function processPiece(messageToProcess){
    // payload with a 4-byte piece index,
    // 4-byte block offset within the piece in bytes
    // then a variable length block containing the raw bytes for the requested piece.
    // The length of this should be the same as the length requested.
    console.log('in process piece!', messageToProcess);
    var pieceIndex = messageToProcess.readUIntBE(0,4);
    var blockOffset = messageToProcess.readUIntBE(4,8);
    downloadedPieces[pieceIndex] = messageToProcess.slice(8, messageToProcess.length);
    console.log('downloadedPieces', downloadedPieces);
}

function updateWhoHasWhichPiece(id, messageToProcess, peerId, whoHasWhichPiece){
    if (id === 4){
        whoHasWhichPiece = parseHave(messageToProcess, peerId, whoHasWhichPiece);
    }
    if (id === 5){
        whoHasWhichPiece = parseBitfield(messageToProcess, peerId, whoHasWhichPiece);
    }
    return whoHasWhichPiece;
}

module.exports = {
    processMessage,
    parseHave,
    parseBitfield,
    processPiece,
    updateWhoHasWhichPiece
}
