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

	this.error = function() {
		throw "Error parsing input";
	}

	this.getNextToken = function() {
		var lexText = this.text;

		if (this.position > lexText.length - 1)
			return new token("EOF", null)

		var currentChar = lexText[this.position];

		if (!isNaN(currentChar)) {
			var returnToken = new token("INTEGER", parseInt(currentChar));
			this.position++;
			return returnToken;
		}
		if (currentChar == "+") {
			var returnToken = new token("PLUS", currentChar);
			this.position++;
			return returnToken;
		}

		this.error();
	}

	this.eat = function(tokenType) {
		if (this.currentToken.type == tokenType)
			this.currentToken = this.getNextToken();
		else
			this.error();
	}

	this.expr = function() {
		this.currentToken = this.getNextToken();

		var left = this.currentToken;
		this.eat("INTEGER");

		var op = this.currentToken;
		this.eat("PLUS");

		var right = this.currentToken;
		this.eat("INTEGER");

		return left.value + right.value;
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