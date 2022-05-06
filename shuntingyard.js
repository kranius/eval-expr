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

const op_names = {
    "(": "PARENTHESIS_OPEN",
    ")": "PARENTHESIS_CLOSE",
    "+": "OPERATOR_ADD",
    "-": "OPERATOR_SUB",
    "*": "OPERATOR_MUL",
    "/": "OPERATOR_DIV",
    "^": "OPERATOR_POW"
}

class Token {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    precedence = () => { return precedence[this.value]; };

    associativity = () => { return associativity[this.value]; };

    name = () => { return names[this.value]; };
}

class AST {
    constructor(token, left, right) {
        this.token = token.value;
        this.left = left;
        this.right = right;
    }
}

// we need a basic Stack.peek
function peek(a) {
    return a[a.length - 1];
}

function isWhitespace(str) {
    return str === " " || str === "\n" || str === "\t";
}

// cheap & dirty tokenizer
function tokenize(input) {
    let tokens = [];
    let buffer = "";

    // for now only support for literals, no variables/functions yet
    const flushBuffer = () => {
        if (0 < buffer.length) {
            tokens.push(new Token("LITERAL", buffer));
            buffer = "";
        }
    }

    for (let i = 0; i < input.length; i++) {
        const symbol = input[i];
        if (isWhitespace(symbol))
            continue;
        else if (symbol in op_names) {
            flushBuffer();
            tokens.push(new Token(op_names[symbol], symbol));
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
                        return;
                    }
                    // our tokenizer doesnt understand functions yet though
                    if (0 < operators_stack.length && peek(operators_stack).type == "FUNCTION") {
                        output_queue.push(operators_stack.pop());
                    }
                }
                break;
            default: // it's an operator
                {
                    const op1 = token;
                    while (0 < operators_stack.length) {
                        const op2 = peek(operators_stack);

                        if (op2 in op_names &&
                            op1.associativity() == "left" && (op1.precedence() <= op2.precedence()) ||
                            op1.associativity() == "right" && (op1.precedence() < op2.precedence())
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
            return;
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
                console.error("cannot divide by zero !");
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