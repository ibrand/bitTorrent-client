var bencode = require('./Bencode.js');

function testParse(){
    var decoded = bencode.parse('testFile.torrent');
    console.log(decoded);
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