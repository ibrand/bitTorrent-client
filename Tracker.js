var crypto = require('crypto');
var bencode = require('./Bencode.js');
var http = require('http');
var fs = require('fs');

var decodedFile = bencode.parse('testFile.torrent');

makeHTTPRequest();

function makeHTTPRequest() {
    http.request(getRequestUrl(), function (response){
        var str = '';

        // another chunk of data has been received, append to str
        response.on('data', function (chunk){
            str += chunk;
        });

        // whole response was received
        response.on('end', function (){
            console.log('RESP',str);
        });
    }).end();
}

function getRequestUrl(){
    var url = decodedFile.announce+'?';
    // request needs to me in this order:
    // uploaded, compact, info_hash, event, downloaded, peer_id, port, left
    var params = {
        uploaded: 0, // amount uploaded since the client sent the started event
        compact: 1, // 1 indicates that the client accepts a compact response
        info_hash: createInfoHash(),
        event: 'started',
        downloaded: 0,
        peer_id: '-IB0001-123456789101', // Azureus-style encoding: '-', two characters for client id, four ascii digits for version number, '-', followed by random numbers.
        port: 6881,
        left: decodedFile.info.length
    };

    for(var key in params){
        url += key+'='+String(params[key])+'&';
    }
    // chop off the final amperstand
    // return the final url
    return url.slice(0,url.length-1);
}

function createInfoHash(){
    // read in the encoded file
    var file = fs.readFileSync('testFile.torrent');
    var theWordInfo = new Buffer('info','utf8');

    // infoValue is everything after the word 'info' in the .torrent file
    // it is used as the value for the key 'info_hash' in the request to the tracker
    var infoValue = file.slice(file.indexOf(theWordInfo)+theWordInfo.length, file.length-1);

    // hash the info_hash
    var sha1 = crypto.createHash('sha1');
    sha1.update(infoValue);
    return encodeBufferToURI(sha1.digest());
}

function encodeBufferToURI(s) {
  var retval = '';
  for (var i = 0; i < s.length; i++) {
    var hexEncodedByteChar = s[i].toString(16);
    retval += '%' + (hexEncodedByteChar.length == 1 ? '0' + hexEncodedByteChar : hexEncodedByteChar);
  }
  return retval;
}
