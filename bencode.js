
var DICTIONARY_END = 'DICTIONARY_END';
var LIST_END = 'LIST_END';

function parse(input, currentDataStructure) {
    if (!input){
        return currentDataStructure;
    }

    else if (startingNewDictionary(input)){
        currentDataStructure = {};
        var results = parse(input.substring(1, input.length), currentDataStructure); // remove the 'd' character
        while(results.result !== 'DICTIONARY_END'){
            var key = results.result;
            results = parse(results.remainingInput, currentDataStructure);
            var value = results.result;
            currentDataStructure[key] = value;
            results = parse(results.remainingInput, currentDataStructure);
        }
        return packageResults(currentDataStructure, results.remainingInput);
    }
    else if (startingNewList(input)){
        currentDataStructure = [];
        var results = parse(input.substring(1, input.length), currentDataStructure); // remove the 'l' character
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
        console.log('INSIDE endingList');
        return packageResults(LIST_END, input.substring(1, input.length));
    }

    else if (endingDictionary(input, currentDataStructure)){
        console.log('INSIDE endingDictionary');
        console.log(input);
        return packageResults(DICTIONARY_END, input.substring(1, input.length));
    }
}

function startingNewDictionary(input) {
    return input.charAt(0) === 'd';
}

function endingDictionary(input, currentDataStructure) {
    return input.charAt(0) === 'e' && !(currentDataStructure instanceof Array);
}


function startingNewList(input) {
    return input.charAt(0) === 'l';
}

function endingList(input, currentDataStructure) {
    return input.charAt(0) === 'e' && (currentDataStructure instanceof Array);
}

function startingByteString(input) {
    return isNumber(input.charAt(0));
}

function startingInteger(input) {
    return input.charAt(0) === 'i';
}

// Avoid double negatives when figuring out if characters are numbers
function isNumber(character){
    return !isNaN(character);
}

function packageResults(result, remainingInput){
    return {result: result, remainingInput: remainingInput};
}

function parseInteger(input){
    // skip the 'i' at the beginning of the string
    var i = 1;
    var compiledString = '';
    while(input.charAt(i) != 'e'){
        compiledString += input.charAt(i);
        i++;
    }
    return packageResults(Number(compiledString), input.substring(i+1, input.length)); // skip the last 'e'
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

    return packageResults(byteStringContents, input.substring(i, input.length));
}

// var parsed = parse('di123el4:spami42eee');
// console.log("CALLING PARSE ", parsed);

module.exports = {
    parse: parse,
    parseByteString: parseByteString,
    parseInteger: parseInteger
}
