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


// cheap tokenizer
// assumes valid expression
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
// https://en.wikipedia.org/wiki/Shunting_yard_algorithm
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
                    while (peek(operators_stack).type != "PARENTHESIS_OPEN") {
                        if (operators_stack.length == 0) {
                            console.error("missing symbol : (");
                            return;
                        } else {
                            output_queue.push(operators_stack.pop())
                        }
                    }
                    // remove matching '('
                    operators_stack.pop();
                    let top = peek(operators_stack);
                    if (typeof top !== "undefined" && top.type == "FUNCTION")
                        output_queue.push(operators_stack.pop());
                }
                break;
            default: // it'a an operator
                {
                    console.log("Found operator : " + token.value);
                    let top = peek(operators_stack);
                    //console.log("top : " + top.value);
                    while (typeof top !== "undefined" && top.type != "PARENTHESIS_OPEN" && (token.precedence() < top.precedence() || (token.precedence() == top.precedence()) && token.associativity() == "left")) {
                        output_queue.push(operators_stack.pop());
                    }
                    operators_stack.push(token);
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
    let rpn = parse(input);
    let result = evaluateRpn(rpn.map(e => e.value));

    return result;
}

function compute() {
    let expr = document.getElementById("expression").value;
    let result = calculette(expr);

    paragraph = document.createElement("p");
    paragraph.innerHTML = expr + " = " + result;
    document.getElementById("results").appendChild(paragraph);
}