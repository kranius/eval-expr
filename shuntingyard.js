// https://en.wikipedia.org/wiki/Shunting_yard_algorithm

const operators = ["+", "-", "*", "/"];

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

class Token {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    precedence = () => { return precedence[this.value]; };

    associativity = () => { return associativity[this.value]; };
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

// cheap & dirty tokenizer
function tokenize(input) {
    let tokens = [];
    let literalBuffer = "";

    const flushLiteral = () => {
        if (literalBuffer.length > 0) {
            tokens.push(new Token("LITERAL", literalBuffer));
            literalBuffer = "";
        }
    }

    for (let i = 0; i < input.length; i++) {
        if (input[i] == ' ' || input[i] == '\n' || input[i] == '\t')
            break;
        switch (input[i]) {
            case '(':
                flushLiteral();
                tokens.push(new Token("PARENTHESIS_OPEN", "("));
                break;
            case ')':
                flushLiteral();
                tokens.push(new Token("PARENTHESIS_CLOSE", ")"));
                break;
            case '+':
                flushLiteral();
                tokens.push(new Token("OPERATOR_ADD", "+"));
                break;
            case '-':
                flushLiteral();
                tokens.push(new Token("OPERATOR_SUB", "-"));
                break;
            case '*':
                flushLiteral();
                tokens.push(new Token("OPERATOR_MUL", "*"));
                break;
            case '/':
                flushLiteral();
                tokens.push(new Token("OPERATOR_DIV", "/"));
                break;
            case '^':
                flushLiteral();
                tokens.push(new Token("OPERATOR_POW", "^"));
            default:
                literalBuffer += input[i];
                if (i == input.length - 1)
                    flushLiteral();
                break;
        }
    }

    return tokens;
}

// here I implement shunting yard as per wikipedia
function parse(input) {
    let operators_stack = [];
    let output_queue = [];

    let tokens = tokenize(input);

    let i = 0;

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
                    if (0 < operators_stack.length && peek(operators_stack).type == "FUNCTION") {
                        output_queue.push(operators_stack.pop());
                    }
                }
                break;
            default: // it'a an operator
                {
                    const op1 = token;
                    while (0 < operators_stack.length) {
                        const op2 = peek(operators_stack);

                        if (op2 in operators &&
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
        i++;
    });

    // pop remaining operators to the output queue
    operators_stack.forEach(() => {
        let top = peek(operators_stack);
        if (typeof top !== "undefined" && top.type == "PARENTHESIS_OPEN") {
            console.error("missmatched parenthesis !");
            return;
        }
        output_queue.push(operators_stack.pop());
    });

    return output_queue.concat(operators_stack.reverse());
}

// possible to do the eval directly in shunting yard function
function evaluateRpn(expr) {
    let stack = [];

    for (let i = 0; i < expr.length; i++) {
        if (!isNaN(expr[i]) && isFinite(expr[i])) {
            stack.push(expr[i]);
        } else {
            let a = stack.pop();
            let b = stack.pop();
            if (expr[i] === "+") {
                stack.push(parseInt(a) + parseInt(b));
            } else if (expr[i] === "-") {
                stack.push(parseInt(b) - parseInt(a));
            } else if (expr[i] === "*") {
                stack.push(parseInt(a) * parseInt(b));
            } else if (expr[i] === "/") {
                stack.push(parseInt(b) / parseInt(a));
            } else if (expr[i] === "^") {
                stack.push(Math.pow(parseInt(b), parseInt(a)));
            }
        }
    }

    return stack.length > 1 ? "ERROR" : stack[0];
}

function calculette(input) {
    let tokens = parse(input); // Token[]
    let rpn = tokens.map(e => e.value); 
    let result = evaluateRpn(rpn);

    return result;
}