var bencode = require('./bencode.js');

function testParse(){
    var fs = require('fs');
    var decodedFile = {};

    fs.readFile('testFile.torrent', 'utf8', function(err, data){
        if (err) {
            throw new Error('not a valid file!!!');
        }
        console.log('about to decode');
        decodedFile = bencode.parse(data).result;
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