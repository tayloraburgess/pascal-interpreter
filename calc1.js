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

			this.error();
		}
		return new token("EOF", null);
	}
}

function interpreter(initLexer) {
	
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
		this.eat("INTEGER");
		return factorToken.value;
	}

	this.term = function() {
		var result = this.factor();

		while (this.currentToken.type == "MUL" || this.currentToken.type == "DIV") {
			var testToken = this.currentToken;
			if (testToken.type == "MUL") {
				this.eat("MUL");
				result *= this.factor();
			}
			else if (testToken.type == "DIV") {
				this.eat("DIV");
				result /= this.factor();
			}
		}
		return result;
	}

	this.expr = function() {
		var result = this.term();

		while (this.currentToken.type == "PLUS" || this.currentToken.type == "MINUS") {
			var testToken = this.currentToken;
			if (testToken.type = "PLUS") {
				this.eat("PLUS");
				result += this.term();
			}
			else if (testToken.type == "MINUS") {
				this.eat("MINUS");
				result -= this.term();
			}
		}

		return result;
	 }
}

var promptString = "calc> ";

var main = function(input) {

	if (input == "exit")
		rl.close();

	else {
		var currentLexer = new lexer(input);
		var currentInterpreter = new interpreter(currentLexer);
		console.log(currentInterpreter.expr());
		rl.question(promptString, main);
	}
}

rl.question(promptString, main);