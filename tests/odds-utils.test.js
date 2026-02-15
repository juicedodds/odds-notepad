const assert = require('assert');
const {
  isValidAmericanOdds,
  parseAmericanOdds,
  isValidDecimalOdds,
  americanToDecimal,
  decimalToAmerican,
  decimalToImpliedProbability,
  toInternalOdds
} = require('../odds-utils.js');

function approxEqual(actual, expected, tolerance = 0.00001) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${actual} to be within ${tolerance} of ${expected}`);
}

function testAmericanValidation() {
  assert.strictEqual(isValidAmericanOdds('+120'), true);
  assert.strictEqual(isValidAmericanOdds('-110'), true);
  assert.strictEqual(isValidAmericanOdds('120'), false);
  assert.throws(() => parseAmericanOdds('+90'));
}

function testDecimalValidation() {
  assert.strictEqual(isValidDecimalOdds('2.10'), true);
  assert.strictEqual(isValidDecimalOdds('1.00'), false);
}

function testConversions() {
  approxEqual(americanToDecimal(150), 2.5);
  approxEqual(americanToDecimal(-110), 1.9090909, 0.0001);
  assert.strictEqual(decimalToAmerican(2.5), '+150');
  assert.strictEqual(decimalToAmerican(1.91), '-110');
  approxEqual(decimalToImpliedProbability(2.0), 0.5);
}

function testInternalFormat() {
  const fromAmerican = toInternalOdds('+120', 'american');
  assert.strictEqual(fromAmerican.american, '+120');
  approxEqual(fromAmerican.decimal, 2.2);

  const fromDecimal = toInternalOdds('2.20', 'decimal');
  assert.strictEqual(fromDecimal.american, '+120');
  approxEqual(fromDecimal.impliedProbability, 1 / 2.2);
}

function runTests() {
  testAmericanValidation();
  testDecimalValidation();
  testConversions();
  testInternalFormat();
  console.log('All odds-utils tests passed.');
}

runTests();
