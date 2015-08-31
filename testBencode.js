var bencode = require('./bencode.js');

function testParseInteger() {
    var integerInput = 'i5783247e';
    var correctResult = 5783247;
    var resultFromTest = bencode.parseInteger(integerInput)[0];
    if (correctResult !== resultFromTest){
        throw new Error('Wrong Integer!!!');
    }
}

function testParseByteString() {
    var byteStringInput = '5:abcdefghijZZZZ';
    var correctResult = 'abcde';
    var resultFromTest = bencode.parseByteString(byteStringInput)[0];
    if (correctResult !== resultFromTest){
        throw new Error('Wrong String!!!');
    }
}

testParseByteString();
testParseInteger();