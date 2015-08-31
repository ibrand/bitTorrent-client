
// if startingNewDictionary
var input = 'i123456789ei12391581e';

function parse(input) {
    return parseInteger(input);
}

function parseInteger(input){
    // skip the 'i' at the beginning of the string
    var i = 1;
    var compiledString = '';
    while(input.charAt(i) != 'e'){
        compiledString += input.charAt(i);
        i++;
    }
    return Number(compiledString);
}

parse.parseInteger = parseInteger;
module.exports = parse;
