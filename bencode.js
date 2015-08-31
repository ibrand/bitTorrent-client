
// if startingNewDictionary
var input = '5:abcdefghijZZZZ';

function parse(input) {
    return parseByteString(input);
}

function parseInteger(input){
    // skip the 'i' at the beginning of the string
    var i = 1;
    var compiledString = '';
    while(input.charAt(i) != 'e'){
        compiledString += input.charAt(i);
        i++;
    }
    return [Number(compiledString), input.substring(i, input.length)];
}

function parseByteString(input){
    var i = 0;
    var lengthOfByteString = '';
    charToExamine = input.charAt(i);

    while (charToExamine != ':'){
        lengthOfByteString += charToExamine;
        i++;
        charToExamine = input.charAt(i);
    }
    // then skip over the ':'
    i++;
    charToExamine = input.charAt(i);

    lengthOfByteString = Number(lengthOfByteString);

    var byteStringContents = input.substring(i, i+lengthOfByteString);
    // ensure that we keep track of where we are in input
    i = i+lengthOfByteString;

    return [byteStringContents, input.substring(i, input.length)];
}

parse.parseByteString = parseByteString;
parse.parseInteger = parseInteger;
module.exports = parse;
