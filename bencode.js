
// if startingNewDictionary
var input = 'd5:abcdefghijZZZZ';
var currentDataStructure = {};

function parse(currentDataStructure, input) {
    if (startingNewDictionary(input)){
        currentDataStructure = {};
        parse(currentDataStructure, input.substring(1, input.length)); // remove the 'd' character
    } else {
        console.log('input '+input);
        var array = parseByteString(input);
        // console.log('array '+array);
        return [currentDataStructure, array[0]];
    }
}

function startingNewDictionary(input) {
    if (input.charAt(0) === 'd'){
        return true;
    }
    return false;
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

var parsed = parse(currentDataStructure, input);
console.log("CALLING PARSE "+parsed);

parse.parseByteString = parseByteString;
parse.parseInteger = parseInteger;
module.exports = parse;
