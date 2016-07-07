#!/usr/bin/env node

var readLine = require("readline");
var rl = readLine.createInterface({
	input: process.stdin,
	output: process.stdout
});

function token(initType, initValue) {
	this.type = initType;
	this.value = initValue;

	this.stringRep = function() {
		return "TOKEN(" + this.type + ", " + this.value + ")";
	}
}

function lexer(initText) {
	this.text = initText;
	this.position = 0;
	this.currentChar = this.text[this.position];

	this.error = function() {
		throw "Invalid character"
	}

	this.advance = function() {
		this.position++;
		if (this.position > this.text.length - 1)
			this.currentChar = null;
		else
			this.currentChar = this.text[this.position];							
	}

	this.skipWhiteSpace = function() {
		while (this.currentChar != null && this.currentChar == " ")
			this.advance();
	}

	this.integer = function() {
		var result = "";
		while (this.currentChar != null && !isNaN(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}
		return parseInt(result);
	}

	this.getNextToken = function() {

		while (this.currentChar != null) {

			if (this.currentChar == " ")
				this.skipWhiteSpace();	

			if (!isNaN(this.currentChar))
				return new token("INTEGER", this.integer());

			if (this.currentChar == "+") {
				this.advance();
				return new token("PLUS", "+");
			}

			if (this.currentChar == "-") {
				this.advance();
				return new token("MINUS", "-");
			}

			if (this.currentChar == "*") {
				this.advance();
				return new token("MUL", "*");
			}

			if (this.currentChar == "/") {
				this.advance();
				return new token("DIV", "/");
			}

			if (this.currentChar == "(") {
				this.advance();
				return new token("LPAREN", "(");
			}

			if (this.currentChar == ")") {
				this.advance();
				return new token("RPAREN", ")");
			}

			this.error();
		}
		return new token("EOF", null);
	}
}

function AST() {
}

function binOp(initLeft, initOp, initRight) {
	this.left = initLeft;
	this.token = initOp;
	this.op = initOp;
	this.right = initRight;
}
binOp.prototype = new AST();

function unaryOp(initOp, initExpr) {
	this.token = initOp;
	this.op = initOp;
	this.expr = initExpr;
}
unaryOp.prototype = new AST();

function num(initToken) {
	this.token = initToken;
	this.value = initToken.value;
}
num.prototype = new AST();

function parser(initLexer) {
	
	this.lexer = initLexer;
	this.currentToken = this.lexer.getNextToken();

	this.error = function() {
		throw "Invalid syntax";
	}

	this.eat = function(tokenType) {
		if (this.currentToken.type == tokenType)
			this.currentToken = this.lexer.getNextToken();
		else
			this.error();
	}

	this.factor = function() {
		var factorToken = this.currentToken;
		if (factorToken.type == "PLUS") {
			this.eat("PLUS");
			return new unaryOp(factorToken, this.factor());
		}
		else if (factorToken.type == "MINUS") {
			this.eat("MINUS");
			return new unaryOp(factorToken, this.factor());
		}
		else if (factorToken.type == "INTEGER") {
			this.eat("INTEGER");
			return new num(factorToken);
		}
		else if (factorToken.type == "LPAREN") {
			this.eat("LPAREN");
			var node = this.expr();
			this.eat("RPAREN");
			return node;
		}
	}

	this.term = function() {
		var node = this.factor();

		while (this.currentToken.type == "MUL" || this.currentToken.type == "DIV") {
			var testToken = this.currentToken;
			if (testToken.type == "MUL") {
				this.eat("MUL");
			}
			else if (testToken.type == "DIV") {
				this.eat("DIV");
			}
			node = new binOp(node, testToken, this.term());
		}
		return node;
	}

	this.expr = function() {
		var node = this.term();

		while (this.currentToken.type == "PLUS" || this.currentToken.type == "MINUS") {
			var testToken = this.currentToken;
			if (testToken.type == "PLUS") {
				this.eat("PLUS");
			}
			else if (testToken.type == "MINUS") {
				this.eat("MINUS");
			}
			node = new binOp(node, testToken, this.term());
		}
		return node;
	}

	this.parse = function() {
		return this.expr();
	}
}

function nodeVisitor() {
	this.visit = function(node) {
		if (node instanceof binOp)
			return this.visitBinOp(node);
		else if (node instanceof num)
			return this.visitNum(node);
		else if (node instanceof unaryOp)
			return this.visitUnaryOp(node);
		else
			return this.genericVisit(node);
	}

	this.genericVisit = function(node) {
		throw "No visit method for node type";
	}
}

function interpreter(initParser) {
	this.parser = initParser;

	this.visitBinOp = function(node) {
		if (node.op.type == "PLUS")
			return this.visit(node.left) + this.visit(node.right);
		else if (node.op.type == "MINUS")
			return this.visit(node.left) - this.visit(node.right);
		else if (node.op.type == "MUL")
			return this.visit(node.left) * this.visit(node.right);
		else if (node.op.type == "DIV")
			return this.visit(node.left) / this.visit(node.right);
	}

	this.visitNum = function(node) {
		return node.value;
	}

	this.visitUnaryOp = function(node) {
		var op = node.op.type;
		if (op == "PLUS") {
			return +this.visit(node.expr);
		}
		else if (op == "MINUS") {
			return -this.visit(node.expr);
		}
	}

	this.interpret = function() {
		var tree = this.parser.parse();
		return this.visit(tree);
	}
}
interpreter.prototype = new nodeVisitor();

var promptString = "spi> ";

var main = function(input) {

	if (input == "exit")
		rl.close();

	else {
		var currentLexer = new lexer(input);
		var currentParser = new parser(currentLexer);
		var currentInterpreter = new interpreter(currentParser);
		console.log(currentInterpreter.interpret());
		rl.question(promptString, main);
	}
}

rl.question(promptString, main);