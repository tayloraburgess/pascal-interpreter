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

	this.reservedKeywords = {
		BEGIN: new token("BEGIN", "BEGIN"),
		END: new token("END", "END")
	}

	this.id = function()  {
		var result = "";
		while (this.currentChar != null && /[a-z]/i.test(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}
		if (result in this.reservedKeywords)
			return this.reservedKeywords[result];
		else
			return new token("ID", result);
	}

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

	this.peek = function() {
		var peekPos = this.position + 1;
		if (peekPos > this.text.length - 1)
			return null;
		else
			return this.text[peekPos];
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

			if (/[a-z]/i.test(this.currentChar))
				return this.id();

			if (this.currentChar == ":" && this.peek() == "=") {
				this.advance();
				this.advance();
				return new token("ASSIGN", ":=");
			}

			if (this.currentChar == ";") {
				this.advance();
				return new token("SEMI", ";");
			}

			if (this.currentChar == ".") {
				this.advance();
				return new token("DOT", ".");
			}

			this.error();
		}
		return new token("EOF", null);
	}
}

//function AST() {
//}

function binOp(initLeft, initOp, initRight) {
	this.left = initLeft;
	this.token = initOp;
	this.op = initOp;
	this.right = initRight;
}
//binOp.prototype = new AST();

function unaryOp(initOp, initExpr) {
	this.token = initOp;
	this.op = initOp;
	this.expr = initExpr;
}
//unaryOp.prototype = new AST();

function num(initToken) {
	this.token = initToken;
	this.value = initToken.value;
}
//num.prototype = new AST();

function compound() {
	this.children = [];
}
//compound.prototype = new AST();

function assign(initLeft, initOp, initRight) {
	this.left = initLeft;
	this.token = initOp;
	this.op = initOp;
	this.right = initRight;
}
//assign.prototype = new AST();

function nVar(initToken) {
	this.token = initToken;
	this.value = initToken.value;
}
//nVar.prototype = new AST();

function noOp() {
}
//noOp.prototype = new AST();

function parser(initLexer) {
	
	this.lexer = initLexer;
	this.currentToken = this.lexer.getNextToken();

	this.error = function() {
		throw "Invalid syntax";
	}

	this.eat = function(tokenType) {
		//console.log(this.currentToken);
		if (this.currentToken.type == tokenType)
			this.currentToken = this.lexer.getNextToken();
		else
			this.error();
	}

	this.factor = function() {
		//console.log("'factor' rule called.");
		var factorToken = this.currentToken;
		if (factorToken.type == "PLUS") {
			this.eat("PLUS");
			var node = new unaryOp(factorToken, this.factor());
			//console.log(node);
			return node;
			//console.log("'factor' returned.");
		}
		else if (factorToken.type == "MINUS") {
			this.eat("MINUS");
			var node = new unaryOp(factorToken, this.factor());
			//console.log(node);
			return node;
			//console.log("'factor' returned.");
		}
		else if (factorToken.type == "INTEGER") {
			this.eat("INTEGER");
			var node = new num(factorToken);
			//console.log(node);
			return node;
		}
		else if (factorToken.type == "LPAREN") {
			this.eat("LPAREN");
			var node = this.expr();
			//console.log("'expr' returned.");
			this.eat("RPAREN");
			//console.log(node);
			return node;
		}
		else
			var node = this.variable();
			//console.log(node);
			return node;
	}

	this.term = function() {
		//console.log("'term' rule called.");
		var node = this.factor();
		//console.log("'factor' returned.");

		while (this.currentToken.type == "MUL" || this.currentToken.type == "DIV") {
			var testToken = this.currentToken;
			if (testToken.type == "MUL") {
				this.eat("MUL");
			}
			else if (testToken.type == "DIV") {
				this.eat("DIV");
			}
			node = new binOp(node, testToken, this.term());
			//console.log("'term' returned.");
		}
		//console.log(node);
		return node;
	}

	this.expr = function() {
		//console.log("'expr' rule called.");
		var node = this.term();
		//console.log("'term' returned.");

		while (this.currentToken.type == "PLUS" || this.currentToken.type == "MINUS") {
			var testToken = this.currentToken;
			if (testToken.type == "PLUS") {
				this.eat("PLUS");
			}
			else if (testToken.type == "MINUS") {
				this.eat("MINUS");
			}
			node = new binOp(node, testToken, this.term());
			//console.log("'term' returned.");
		}
		//console.log(node);
		return node;
	}

	this.program = function() {
		//console.log("'program' rule called.");
		var node = this.compoundStatement();
		//console.log("'compoundStatement' returned.");
		this.eat("DOT");
		//console.log(node);
		return node;
	}

	this.compoundStatement = function() {
		//console.log("'compoundStatement' rule called.");
		this.eat("BEGIN");
		var nodes = this.statementList();
		//console.log("'statementList' returned.");
		this.eat("END");

		var tRoot = new compound();
		for (var i = 0; i < nodes.length; i++)
			tRoot.children.push(nodes[i]);

		//console.log(tRoot);
		return tRoot;
	}

	this.statementList = function() {
		//console.log("'statementList' rule called.");
		var node = this.statement();
		//console.log("'statement' returned.");
		var results = [];
		results.push(node);

		while (this.currentToken.type == "SEMI") {
			this.eat("SEMI");
			results.push(this.statement());
			//console.log("'statement' returned.");
		}

		if (this.currentToken.type == "ID")
			this.error();

		//console.log(results);
		return results;
	}

	this.statement = function() {
		//console.log("'statement' rule called.");
		var node;
		if (this.currentToken.type == "BEGIN") {
			node = this.compoundStatement();
			//console.log("'compoundStatement' returned.");
		}
		else if (this.currentToken.type == "ID") {
			node = this.assignmentStatement();
			//console.log("'assignmentStatement' returned.");
		}
		else {
			node = this.empty();
			//console.log("'empty' returned.");
		}

		//console.log(node);
		return node;
	}

	this.assignmentStatement = function() {
		//console.log("'assignmentStatement' rule called.");
		var left = this.variable();
		//console.log("'variable' returned.");
		var token = this.currentToken;
		this.eat("ASSIGN");
		var right = this.expr();
		//console.log("'expr' returned.");
		var node = new assign(left, token, right);

		//console.log(node);
		return node;
	}

	this.variable = function() {
		//console.log("'variable' rule called.");
		var node = new nVar(this.currentToken);
		this.eat("ID");

		//console.log(node);
		return node;
	}

	this.empty = function() {
		//console.log("'empty' rule called.");
		var node = new noOp();
		//console.log(node);
		return node;
		//console.log("'noOp' returned.");
	}

	this.parse = function() {
		var node = this.program();
		//console.log("'program' returned.");
		if (this.currentToken.type != "EOF")
			this.error();

		//console.log(node);
		return node;
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
		else if (node instanceof compound)
			return this.visitCompound(node);
		else if (node instanceof assign)
			return this.visitAssign(node);
		else if (node instanceof nVar)
			return this.visitVar(node);
		else if (node instanceof noOp)
			return this.visitNoOp(node);
		else
			return this.genericVisit(node);
	}

	this.genericVisit = function(node) {
		throw "No visit method for node type";
	}
}

function interpreter(initParser) {
	this.parser = initParser;
	this.globalScope = {};

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
	
	this.visitCompound = function(node) {
		for (var i = 0; i < node.children.length; i++)
			//console.log(node.children[i]);
			this.visit(node.children[i]);
	}

	this.visitAssign = function(node) {
		var varName = node.left.value;
		this.globalScope[varName] = this.visit(node.right);
	}

	this.visitVar = function(node) {
		var varName = node.value;
		//console.log(varName);
		if (varName in this.globalScope)
			return this.globalScope[varName];	
		else
			throw varName + " is not a variable"
	}	

	this.visitNoOp = function(node) {
	}

	this.interpret = function() {
		var tree = this.parser.parse();
		//console.log(tree);
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
		currentInterpreter.interpret();
		console.log("Variables: ");
		console.log(currentInterpreter.globalScope);
		rl.question(promptString, main);
	}
}

rl.question(promptString, main);