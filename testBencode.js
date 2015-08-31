var bencode = require('./bencode.js');

function testParseInteger() {
    var integerInput = 'i5783247e';
    var correctResult = 5783247;
    var resultFromTest = bencode.parseInteger(integerInput);
    if (correctResult !== resultFromTest){
        throw new Error('Wrong Integer!!!');
    }
}

testParseInteger();