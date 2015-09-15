var bencode = require('./Bencode.js');

function testParseFile(){
    var decoded = bencode.parseFile('testFile.torrent');
    console.log(decoded);
}

function testParseBuffer(){
    var buffer = new Buffer('64383a636f6d706c65746569316531303a646f776e6c6f6164656469366531303a696e636f6d706c657465693165383a696e74657276616c69313736346531323a6d696e20696e74657276616c6938383265353a706565727331323acffb672e1ae1607e68dbd42465','hex');
    var decoded = bencode.parseBuffer(buffer);
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

// testParseFile();
testParseBuffer();
testParseByteString();
testParseInteger();