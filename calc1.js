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

function interpreter(initText) {
	this.text = initText;
	this.position = 0;
	this.currentToken = null;
	this.currentChar = this.text[this.position];

	this.error = function() {
		throw "Error parsing input";
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
				return new token("PLUS", this.currentChar);
			}

			if (this.currentChar == "-") {
				this.advance();
				return new token("MINUS", this.currentChar);
			}

			this.error();
		}

		return new token("EOF", null);
	}

	this.eat = function(tokenType) {
		if (this.currentToken.type == tokenType)
			this.currentToken = this.getNextToken();
		else
			this.error();
	}

	this.term = function() {
		var termToken = this.currentToken;
		this.eat("INTEGER");
		return termToken.value;
	}

	this.expr = function() {
		this.currentToken = this.getNextToken();

		var result = this.term();

		while (this.currentToken.type == "PLUS" || this.currentToken.type == "MINUS") {
			var testToken = this.currentToken;
			if (testToken.type == "PLUS") {
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
		var currentInterpreter = new interpreter(input);
		console.log(currentInterpreter.expr());
		rl.question(promptString, main);
	}

}

rl.question(promptString, main);