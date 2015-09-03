var bencode = require('./bencode.js');

function testParse(){
    var fs = require('fs');
    var decodedFile = {};

    // read file in as a buffer
    fs.readFile('testFile.torrent', function(err, buffer){
        if (err) {
            throw new Error('not a valid file!!!');
        }
        console.log('about to decode');
        // pass the byte array into bencode's parse for decoding
        decodedFile = bencode.parse(buffer).result;
        console.log(typeof decodedFile);
        console.log('decodedFile',decodedFile);
    });
}

function testParseInteger() {
    var integerInput = 'i5783247e';
    var correctResult = 5783247;
    var resultFromTest = bencode.parseInteger(integerInput).result;
    if (correctResult !== resultFromTest){
        throw new Error('Wrong Integer!!!');
    }
}

function testParseByteString() {
    var byteStringInput = '5:abcdefghijZZZZ';
    var correctResult = 'abcde';
    var resultFromTest = bencode.parseByteString(byteStringInput).result;
    if (correctResult !== resultFromTest){
        throw new Error('Wrong String!!!');
    }
}

testParse();
testParseByteString();
testParseInteger();