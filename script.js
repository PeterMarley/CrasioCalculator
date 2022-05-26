const operators = {
    exponent: '^',
    multiplication: '*',
    division: '/',
    addition: '+',
    subtraction: '-',
}
const DIVIDE_BY_ZERO_MSG = 'cannot divide by zero!';
let resultDelivered = false;

// // capture nodes
const buttonsNumpad = document.querySelectorAll('.numBtn');
const buttonsOperations = document.querySelectorAll('.opBtn');
const buttonClear = document.querySelector('.clearBtn');
const buttonEqual = document.querySelector('#equalBtn');

const displayMain = document.querySelector('.display');
const displayCalc = document.querySelector('.current-calc');

// add event listers to nodes
buttonClear.addEventListener('click', () => clear());
buttonsNumpad.forEach(btn => btn.addEventListener('click', () => clickNumber(btn)));
buttonsOperations.forEach(btn => btn.addEventListener('click', () => clickOperator(btn)));
buttonEqual.addEventListener('click', () => {
    displayMain.value = solve(displayCalc.value)
});

// functions
/**
 * Called when user clicks a number button (0-9 and '.').
 * @param {keydown event or numeric character} btn 
 */
function clickNumber(btn) {
    if (resultDelivered) {
        resultDelivered = false;
        displayCalc.value = '';
    }
    displayCalc.value = displayCalc.value + btn.textContent;
}

/**
 * Called when user clicks an operation button (^, *, /, +, -).
 * @param {HTML button node} btn 
 */
function clickOperator(btn) {
    if (resultDelivered) {
        resultDelivered = false;
        displayCalc.value = displayMain.value;
    }
    displayCalc.value = displayCalc.value + btn.textContent;
}


function collapseBrackets(equation) {
    // if no brackets, return simple arithmetic on equation
    if (equation.findIndex(element => element === '(') === -1) {
        return arithmetic(equation.join(''));
    }

    // if there are brackets, recursively solve each bracket, then return the simple arithmetic
    let parsed = false;
    while (!parsed) {
        let nestedParen = 0;
        let begin = false;
        let startIndex, endIndex;
        let equationLength = equation.length;
        for (let i = 0; i < equationLength; i++) {
            if (equation[i] === '(') {
                nestedParen++;
                startIndex = i;
                begin = true;
            } else if (equation[i] === ')') {
                nestedParen--;
            }
            if (nestedParen === 0 && begin) {
                begin = false;
                endIndex = i;
                let collapsed = collapseBrackets(equation.slice(startIndex + 1, endIndex));
                equation.splice(startIndex, endIndex - startIndex + 1, ...collapsed.toString().split(''));
                equationLength = equation.length;
                i = 0;
            }
        }
        parsed = true;
    }
    return equation;
}

/**
 * This function is called by solve(), and is used to collapse sub-problems into results, used to enforce order of operations (PEDMAS).
 * @param {String} equation 
 * @param {1-char String OR 2-length array of 1-char Strings} operators 
 * @returns an equation with the sub-problems, involving the specified operators, solved.
 */
function collapse(equation, operators) {

    // build find operators regex
    let regex;
    if (operators instanceof Array) {
        regex = new RegExp('[\\' + operators[0] + ']|[\\' + operators[1] + ']');
    } else {
        regex = new RegExp('[\\' + operators + ']');
    }
    const FIND_OPERATORS_REGEX = regex;
    const FIND_NUMBERS_REGEX = /\d*\.?\d+/;

    // establish base case for recursion
    if (equation.join('').match(FIND_OPERATORS_REGEX) === null) {
        return equation;
    }

    // find index of first operator
    let index = equation.findIndex((element) => {
        if (operators instanceof Array) {
            return (element === operators[0] || element === operators[1]);
        } else {
            return element === operators;
        }
    });

    // find start and end index of simple arithmetic and compute
    let startIndex, endIndex;
    for (let i = index - 1; i >= -1; i--) {
        if (i === -1) {
            startIndex = 0;
            break;
        } else if (equation[i].match(FIND_NUMBERS_REGEX) === null && equation[i] !== '.') {
            startIndex = i + 1;
            break;
        }
    }
    for (let i = index + 1; i <= equation.length; i++) {
        if (i === equation.length) {
            endIndex = equation.length;
            break;
        } else if (equation[i].match(FIND_NUMBERS_REGEX) === null && equation[i] !== '.') {
            endIndex = i;
            break;
        }
    }
    let slice = equation.slice(startIndex, endIndex);
    let result = arithmetic(slice.join('')); // currently causes stack overflow
    if (result === DIVIDE_BY_ZERO_MSG) {
        return DIVIDE_BY_ZERO_MSG;
    }

    // replace basic arithmetic with result
    equation.splice(startIndex, endIndex - startIndex, ...result.split(''));

    // recursive step
    return collapse(equation, operators);
}

/**
 * This function enforces order of operations on an equation. This means that first arithmetic in parenthesis are solved, then exponents, then
 * multiplication and division from left to right, then addition and subtraction from left to right.
 * @param {String} equation 
 * @returns 
 */
function solve(equation) {

    // remove whitespace & conver to array of characters
    equation = equation.split('').filter(element => element !== ' ');

    let result = null;
    let operand = null;
    let operator = null;

    /*
    order of operations
    */

    if (equation.lastIndexOf('(') != -1) {
        //recursively solve bracketed sub-problems to enforce order of operations
        equation = collapseBrackets(equation);
    }

    if (equation.lastIndexOf(operators.exponent) != -1) {
        equation = collapse(equation, operators.exponent);
    }

    if (equation.lastIndexOf(operators.multiplication) != -1 || equation.lastIndexOf(operators.division) != -1) {
        equation = collapse(equation, [operators.multiplication, operators.division]);
        if (equation === DIVIDE_BY_ZERO_MSG) {
            resultDelivered = true;
            return DIVIDE_BY_ZERO_MSG;
        }
    }

    if (equation.lastIndexOf(operators.addition) != -1 || equation.lastIndexOf(operators.subtraction) != -1) {
        equation = collapse(equation, [operators.addition, operators.subtraction]);
    }

    // delcare a result has been delivered
    resultDelivered = true;

    // 2 decimal places
    let dp = parseFloat(equation.join(''));
    dp = Math.round(dp*100)/100;

    return dp.toString();
}

/**
 * This function should only be called by solve(), which provides a simple problem that has only 2 operands and one operator. The equation must
 * not contain whitespace, which is enforced by solve().
 * 
 * This function does not respect order of operations. 
 * 
 * @param {String} equation an equation represented in string format, for example, '1+1', '10/2' or '2^3'.
 * @returns {String} the result of the equation.
 */
function arithmetic(equation) {

    // define parts of problem
    let result = null;
    let operand = null;
    let operator = null;

    // pure jank, refactor this for the love of dogs
    let equationStr = equation;
    equation = equation.split('');

    // compute result
    const FIND_OPERATORS_REGEX = /[+]|[-]|[*]|[\/]|[\^]/;
    const FIND_NUMBERS_REGEX = /\d*\.?\d+/;
    for (let i = 0; i < equation.length; i++) {
        if (equation[i].toString().match(FIND_OPERATORS_REGEX) != null) {
            operator = equation[i];
        } else {
            let num = equationStr.substring(i, equationStr.length).match(FIND_NUMBERS_REGEX)[0];
            i += num.toString().length - 1;
            if (result === null) {
                result = parseFloat(num);
            } else {
                operand = parseFloat(num);
            }
        }

        if (operand != null || operator === '=') {
            switch (operator) {
                case '+':
                    result += operand;
                    break;
                case '-':
                    result -= operand;
                    break;
                case '*':
                    result *= operand;
                    break;
                case '/':
                    if (operand === 0) {
                        return DIVIDE_BY_ZERO_MSG;
                    } else {
                        result /= operand;
                    }
                    break;
                case '^':
                    result = result ** operand;
                    break;
                case '=':
                    console.log('operation complete, result is ' + result);
                    operationComplete = true;
            }
            operator = null;
        }
        operand = null;
    }
    let returnVal = result.toString();
    return returnVal;
}

/**
 * Clears the two displays of the calculator
 */
function clear() {
    displayMain.value = ''
    displayCalc.value = '';
}