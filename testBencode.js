var bencode = require('./bencode.js');

function testParse(){
    var toDecode = new Buffer(12);
    toDecode.write('d4:spam2:hie');
    var decodedFile = {};
    decodedFile = bencode.parse(toDecode);
    console.log(decodedFile);
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