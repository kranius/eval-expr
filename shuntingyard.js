// https://en.wikipedia.org/wiki/Shunting_yard_algorithm

const associativity = {
    "^": "right",
    "*": "left",
    "/": "left",
    "+": "left",
    "-": "left"
};

const precedence = {
    "^": 4,
    "*": 3,
    "/": 3,
    "+": 2,
    "-": 2
};

const operators = {
    "(": "PARENTHESIS_OPEN",
    ")": "PARENTHESIS_CLOSE",
    "+": "OPERATOR_ADD",
    "-": "OPERATOR_SUB",
    "*": "OPERATOR_MUL",
    "/": "OPERATOR_DIV",
    "^": "OPERATOR_POW"
}


class Token {
    constructor(value, type, assoc, prec) {
        this.value = value;
        this.type = type;
        this.assoc = assoc;
        this.prec = prec;
    }
}

class AST {
    constructor(token, left, right) {
        this.token = token.value;
        this.left = left;
        this.right = right;
    }
}

// we need a basic Stack.peek
Array.prototype.peek = function () {
    return this[this.length - 1];
}

// and a convenience function
String.prototype.isWhiteSpace = function() {
    return this === " " || this === "\n" || this === "\t";
}

// cheap & dirty tokenizer
function tokenize(input) {
    let tokens = [];
    let buffer = "";

    // for now only support for literals, no variables/functions yet
    const flushBuffer = () => {
        if (0 < buffer.length) {
            tokens.push(new Token(buffer, "LITERAL", 42, 42));
            buffer = "";
        }
    }

    for (let i = 0; i < input.length; i++) {
        const symbol = input[i];
        if (symbol.isWhiteSpace())
            continue;
        else if (symbol in operators) {
            flushBuffer();
            tokens.push(new Token(symbol, operators[symbol], associativity[symbol], precedence[symbol]));
        }
        else { // we have a literal (a variable or a function)
            buffer += symbol;
            if (i == input.length - 1) { // if we are at last symbol
                flushBuffer();
            }
        }
    }

    return tokens;
}

// here I implement shunting yard as per wikipedia
function parse(input) {
    let operators_stack = [];
    let output_queue = [];

    let tokens = tokenize(input);

    if (tokens == "ERROR") // somethig went wrong in tokenization
        return tokens;

    // start of shunting yard
    tokens.forEach(token => {
        switch (token.type) {
            case "LITERAL":
                output_queue.push(token);
                break;
            case "FUNCTION":
                operators_stack.push(token);
                break;
            case "PARENTHESIS_OPEN":
                operators_stack.push(token);
                break;
            case "PARENTHESIS_CLOSE":
                {
                    let parenthesis_match = false;

                    while (0 < operators_stack.length) {
                        const op = operators_stack.pop();

                        if (op.type == "PARENTHESIS_OPEN") {
                            parenthesis_match = true;
                            break;
                        }
                        else
                            output_queue.push(op);
                    }
                    if (parenthesis_match == false) {
                        // TODO throw exception
                        console.error('missing (');
                        return "ERROR";
                    }
                    // TODO implement functions support in tokenizer
                    if (0 < operators_stack.length && operators_stack.peek().type == "FUNCTION") {
                        output_queue.push(operators_stack.pop());
                    }
                }
                break;
            default: // it's an operator
                {
                    const op1 = token;
                    while (0 < operators_stack.length) {
                        const op2 = operators_stack.peek();

                        if (op2 in operators &&
                            op1.associativity == "left" && (op1.precedence <= op2.precedence) ||
                            op1.associativity == "right" && (op1.precedence < op2.precedence)
                        )
                            output_queue.push(operators_stack.pop());
                        else
                            break;
                    }
                    operators_stack.push(op1);
                }
                break;
        }
    });

    // pop remaining operators to the output queue
    while (0 < operators_stack.length) {
        const op = operators_stack.pop();

        if (op.type === "PARENTHESIS_OPEN") {
            // TODO throw
            console.error("missing )");
            return "ERROR";
        }
        output_queue.push(op);
    }

    return output_queue.concat(operators_stack.reverse());
}

// possible to do the eval directly in shunting yard function
function evaluateRpn(expr) {
    let stack = [];

    expr.forEach(elem => {
        if (!isNaN(elem) && isFinite(elem)) {
            stack.push(elem);
        } else {
            let a = stack.pop();
            let b = stack.pop();
            if (elem === "+")
                stack.push(parseInt(a) + parseInt(b));
            else if (elem === "-")
                stack.push(parseInt(b) - parseInt(a));
            else if (elem === "*")
                stack.push(parseInt(a) * parseInt(b));
            else if (elem === "^")
                stack.push(Math.pow(parseInt(b), parseInt(a)));
            else if (elem === "/") {
                // TODO throw
                if (a == "0") {
                    console.error("cannot divide by zero !");
                    return "ERROR"
                } else 
                stack.push(parseInt(b) / parseInt(a));
            }
        }
    });

    return stack.length > 1 ? "ERROR" : stack[0];
}

function calculette(input) {
    let tokens = parse(input); // Token[]
    let rpn = tokens.map(e => e.value); // we just want the values to feed to our evaluator
    let result = evaluateRpn(rpn);

    return result;
}