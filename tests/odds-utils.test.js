const assert = require('assert');
const {
  americanToDecimal,
  sumImpliedProbabilities,
  calculateSurebet
} = require('../odds-utils.js');

function approxEqual(actual, expected, tolerance = 0.00001) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${actual} ≈ ${expected}`);
}

function testAmericanToDecimal() {
  approxEqual(americanToDecimal(120), 2.2);
  approxEqual(americanToDecimal(-110), 1 + 100 / 110);
}

function testImpliedProbabilitySum() {
  const S2 = sumImpliedProbabilities([2.1, 2.1]);
  approxEqual(S2, 1 / 2.1 + 1 / 2.1);

  const S3 = sumImpliedProbabilities([3.2, 3.4, 3.5]);
  approxEqual(S3, 1 / 3.2 + 1 / 3.4 + 1 / 3.5);
}

function testStakeSplitRoundingTotalApprox() {
  const result = calculateSurebet([2.1, 2.1], 100, 0.01);
  const roundedTotal = result.roundedStakes.reduce((sum, stake) => sum + stake, 0);
  assert.ok(Math.abs(roundedTotal - 100) <= 0.02, 'Rounded stakes should approximately sum to total stake');
}

function testArbitrageDetection() {
  const yesArb = calculateSurebet([2.2, 2.2], 100, 0.01);
  assert.strictEqual(yesArb.exists, true);
  assert.ok(yesArb.S < 1);

  const noArb = calculateSurebet([1.8, 1.9], 100, 0.01);
  assert.strictEqual(noArb.exists, false);
  assert.ok(noArb.S >= 1);
}

function runTests() {
  testAmericanToDecimal();
  testImpliedProbabilitySum();
  testStakeSplitRoundingTotalApprox();
  testArbitrageDetection();
  console.log('All odds-utils tests passed.');
}

runTests();
