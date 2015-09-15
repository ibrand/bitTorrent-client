var crypto = require('crypto');
var bencode = require('./Bencode.js');
var bencodeExternal = require('./bencoder');
var http = require('http');
var fs = require('fs');
var indexof = require('buffer-indexof');

var file = fs.readFileSync('testFile.torrent');
var infoString = new Buffer('info','utf8');
var infoValue = file.slice(indexof(file, infoString)+infoString.length, file.length-1);

var decodedFile = bencode.parse('testFile.torrent');

makeHTTPRequest();

function encodeBufferToURI(s) {
  var retval = '';
  for (var i = 0; i < s.length; i++) {
    var x = s[i].toString(16);
    retval += '%' + (x.length == 1 ? '0' + x : x);
  }
  return retval;
}


function makeHTTPRequest() {
    // var info_hash = bencodeExternal.bencode(decodedFile.info);
    // hash the info_hash
    var sha1 = crypto.createHash('sha1');
    sha1.update(infoValue);
    var hashedInfo = encodeBufferToURI(sha1.digest());

    var url = decodedFile.announce+'?';
    // request needs to me in this order:
    // uploaded, compact, info_hash, event, downloaded, peer_id, port, left
    var params = {
        uploaded: 0, // amount uploaded since the client sent the started event
        compact: 1, // 1 indicates that the client accepts a compact response
        info_hash: hashedInfo,
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
