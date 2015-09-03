var bencode = require('./bencode.js');

function testParse(){
    var fs = require('fs');
    var decodedFile = {};

    fs.readFile('testFile.torrent', function(err, buffer){
        if (err) {
            throw new Error('not a valid file!!!');
        }
        // pass the byte array into bencode's parse for decoding
        var decodedFile = bencode.parse(buffer).result;
        if (typeof decodedFile !== 'object'){
            console.log('typeof decodedFile', typeof decodedFile);
            throw new Error('parse is not returning an object!');
        }
        console.log('decodedFile',decodedFile);
    });
}

function testParseInteger() {
    var toDecode = new Buffer(9);
    var integerInput = 'i5783247e';
    toDecode.write(integerInput);
    var correctResult = 5783247;
    var resultFromTest = bencode.parseInteger(toDecode).result;
    if (correctResult !== resultFromTest){
        throw new Error('Wrong Integer!!!');
    }
}

function testParseByteString() {
    var toDecode = new Buffer(16);
    var byteStringInput = '5:abcdefghijZZZZ';
    toDecode.write(byteStringInput);
    var correctResult = new Buffer(5);
    correctResult.write('abcde');
    var resultFromTest = bencode.parseByteString(toDecode).result;
    if (correctResult.compare(resultFromTest)){
        throw new Error('Wrong Buffer!!!');
    }
}

testParse();
testParseByteString();
testParseInteger();