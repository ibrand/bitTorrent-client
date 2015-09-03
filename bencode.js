
var DICTIONARY_END = 'DICTIONARY_END';
var LIST_END = 'LIST_END';

function parse(input, currentDataStructure) {
    if (input.length === 0){
        return currentDataStructure;
    }

    else if (startingNewDictionary(input)){
        currentDataStructure = {};
        var results = parse(input.slice(1), currentDataStructure); // remove the 'd' character
        while(results.result !== 'DICTIONARY_END'){
            // all keys must be Strings
            // so convert the byte array into a string
            var key = byteBufferToString(results.result);
            results = parse(results.remainingInput, currentDataStructure);
            var value = results.result; // value stays a byte buffer

            currentDataStructure[key] = value;
            results = parse(results.remainingInput, currentDataStructure);
        }
        return packageResults(currentDataStructure, results.remainingInput);
    }
    else if (startingNewList(input)){
        currentDataStructure = [];
        var results = parse(input.slice(1), currentDataStructure); // remove the 'l' character
        while(results.result !== 'LIST_END'){
            currentDataStructure.push(results.result);
            var results = parse(results.remainingInput, currentDataStructure);
        }
        return packageResults(currentDataStructure, results.remainingInput);
    }

    else if (startingByteString(input)){
        return parseByteString(input);
    }
    else if (startingInteger(input)){
        return parseInteger(input);
    }

    else if (endingList(input, currentDataStructure)){
        return packageResults(LIST_END, input.slice(1));
    }

    else if (endingDictionary(input, currentDataStructure)){
        return packageResults(DICTIONARY_END, input.slice(1));
    }
}

function startingNewDictionary(input) {
    return String.fromCharCode(input[0]) === 'd';
}

function endingDictionary(input, currentDataStructure) {
    return String.fromCharCode(input[0]) === 'e' && !(currentDataStructure instanceof Array);
}


function startingNewList(input) {
    return String.fromCharCode(input[0]) === 'l';
}

function endingList(input, currentDataStructure) {
    return String.fromCharCode(input[0]) === 'e' && (currentDataStructure instanceof Array);
}

function startingByteString(input) {
    return isNumber(String.fromCharCode(input[0]));
}

function startingInteger(input) {
    return String.fromCharCode(input[0]) === 'i';
}

// Avoid double negatives when figuring out if characters are numbers
function isNumber(character){
    return !isNaN(character);
}

function byteBufferToString(byteBuffer){
    return byteBuffer.toString();
}

function packageResults(result, remainingInput){
    return {result: result, remainingInput: remainingInput};
}

function parseInteger(input){
    // skip the 'i' at the beginning of the string
    var i = 1;
    var compiledString = '';
    while(String.fromCharCode(input[i]) !== 'e'){
        compiledString += String.fromCharCode(input[i]);
        i++;
    }
    return packageResults(Number(compiledString), input.slice(i+1)); // skip the last 'e'
}

function parseByteString(input){
    var i = 0;
    var lengthOfByteString = '';

    // parse the number that determines the length of the byte string
    digitToExamine = String.fromCharCode(input[i]);
    while (digitToExamine !== ':'){
        lengthOfByteString += digitToExamine;
        i++;
        digitToExamine = String.fromCharCode(input[i]);
    }
    // then skip over the ':'
    i++;
    digitToExamine = String.fromCharCode(input[i]);

    lengthOfByteString = Number(lengthOfByteString);

    var byteStringContents = input.slice(i, i+lengthOfByteString);
    // ensure that we keep track of where we are in input
    i = i+lengthOfByteString;

    return packageResults(byteStringContents, input.slice(i));
}

module.exports = {
    parse: parse,
    parseByteString: parseByteString,
    parseInteger: parseInteger
}
