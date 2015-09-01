
function parse(input, currentDataStructure) {
    if (startingNewDictionary(input)){
        currentDataStructure = {};
        return parse(input.substring(1, input.length), currentDataStructure); // remove the 'd' character
    } else {
        console.log('input '+input);
        var results = parseByteString(input);
        // console.log('array '+array);
        return packageResults(currentDataStructure, results.remainingInput);
    }
}

function startingNewDictionary(input) {
    if (input.charAt(0) === 'd'){
        return true;
    }
    return false;
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
    return packageResults(Number(compiledString), input.substring(i, input.length));
    // return [Number(compiledString), input.substring(i, input.length)];
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

var parsed = parse('d5:84322eee');
console.log("CALLING PARSE ", parsed);

parse.parseByteString = parseByteString;
parse.parseInteger = parseInteger;
module.exports = parse;
