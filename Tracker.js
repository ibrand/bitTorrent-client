var crypto = require('crypto');
var bencode = require('./Bencode.js');
var bencodeExternal = require('./bencoder');
var http = require('http');
var fs = require('fs');


var decodedFile = bencode.parse('testFile.torrent');

makeHTTPRequest();

function makeHTTPRequest() {
    var info_hash = bencodeExternal.bencode(decodedFile.info);
    // hash the info_hash
    var sha1 = crypto.createHash('sha1');
    sha1.update(String(info_hash));
    info_hash = sha1.digest('hex');
    console.log('INFO STRING', encodeURIComponent(info_hash));

    var url = decodedFile.announce+'?';
    // request needs to me in this order:
    // uploaded, compact, info_hash, event, downloaded, peer_id, port, left
    var params = {
        uploaded: 0, // amount uploaded since the client sent the started event
        compact: 1, // 1 indicates that the client accepts a compact response
        info_hash: info_hash,
        event: 'started',
        downloaded: 0,
        peer_id: '-IB0001-123456789101', // Azureus-style encoding: '-', two characters for client id, four ascii digits for version number, '-', followed by random numbers.
        port: 6881,
        left: decodedFile.info.length
    };
    console.log(params['left']);

    for(var key in params){
        url += key+'='+String(params[key])+'&';
    }
    // chop off the final amperstand
    url = url.slice(0,url.length-1);

    console.log(url);
}
