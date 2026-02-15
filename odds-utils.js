(function (globalScope) {
  function normalizeOddsInput(rawOdds) {
    return String(rawOdds || '').trim();
  }

  function isValidAmericanOdds(rawOdds) {
    return /^[+-]\d+$/.test(normalizeOddsInput(rawOdds));
  }

  function parseAmericanOdds(rawOdds) {
    if (!isValidAmericanOdds(rawOdds)) {
      throw new Error('American odds must look like +120 or -110.');
    }

    const value = Number.parseInt(normalizeOddsInput(rawOdds), 10);

    if (value > -100 && value < 100 && value !== -100 && value !== 100) {
      throw new Error('American odds must be <= -100 or >= +100.');
    }

    return value;
  }

  function isValidDecimalOdds(rawOdds) {
    const value = Number.parseFloat(normalizeOddsInput(rawOdds));
    return Number.isFinite(value) && value > 1.01;
  }

  function parseDecimalOdds(rawOdds) {
    if (!isValidDecimalOdds(rawOdds)) {
      throw new Error('Decimal odds must be numeric and greater than 1.01.');
    }

    return Number.parseFloat(normalizeOddsInput(rawOdds));
  }

  function americanToDecimal(americanOdds) {
    if (americanOdds > 0) {
      return 1 + americanOdds / 100;
    }

    return 1 + 100 / Math.abs(americanOdds);
  }

  function decimalToAmerican(decimalOdds) {
    if (decimalOdds >= 2) {
      return `+${Math.round((decimalOdds - 1) * 100)}`;
    }

    return `${Math.round(-100 / (decimalOdds - 1))}`;
  }

  function decimalToImpliedProbability(decimalOdds) {
    return 1 / decimalOdds;
  }

  function sumImpliedProbabilities(decimalOddsArray) {
    return decimalOddsArray.reduce((sum, odd) => sum + decimalToImpliedProbability(odd), 0);
  }

  function toInternalOdds(rawOdds, format) {
    if (format === 'american') {
      const americanValue = parseAmericanOdds(rawOdds);
      const decimalValue = americanToDecimal(americanValue);

      return {
        original: americanValue > 0 ? `+${americanValue}` : `${americanValue}`,
        american: americanValue > 0 ? `+${americanValue}` : `${americanValue}`,
        decimal: decimalValue,
        impliedProbability: decimalToImpliedProbability(decimalValue)
      };
    }

    const decimalValue = parseDecimalOdds(rawOdds);
    return {
      original: normalizeOddsInput(rawOdds),
      american: decimalToAmerican(decimalValue),
      decimal: decimalValue,
      impliedProbability: decimalToImpliedProbability(decimalValue)
    };
  }

  function roundToIncrement(value, increment) {
    return Math.round(value / increment) * increment;
  }

  function calculateSurebet(decimalOddsArray, totalStake, roundingIncrement) {
    if (!Array.isArray(decimalOddsArray) || decimalOddsArray.length < 2 || decimalOddsArray.length > 3) {
      throw new Error('Use 2-way or 3-way arbitrage inputs.');
    }

    const decimals = decimalOddsArray.map((odd) => Number(odd));
    const stake = Number(totalStake);
    const increment = Number(roundingIncrement || 0.01);

    if (!decimals.every((odd) => odd > 1.01)) {
      throw new Error('Decimal odds must be greater than 1.01.');
    }
    if (!(stake > 0)) {
      throw new Error('Total stake must be greater than 0.');
    }
    if (!(increment > 0)) {
      throw new Error('Rounding increment must be greater than 0.');
    }

    const S = sumImpliedProbabilities(decimals);
    const exists = S < 1;

    const theoreticalStakes = decimals.map((odd) => stake * ((1 / odd) / S));
    const roundedStakes = theoreticalStakes.map((s) => roundToIncrement(s, increment));
    const payoutsAfterRounding = roundedStakes.map((s, idx) => s * decimals[idx]);

    const theoreticalProfit = stake / S - stake;
    const theoreticalProfitPct = ((1 / S) - 1) * 100;
    const minPayout = Math.min(...payoutsAfterRounding);
    const profitRounded = minPayout - stake;
    const profitRoundedPct = (profitRounded / stake) * 100;

    return {
      S,
      exists,
      theoreticalStakes,
      roundedStakes,
      payoutsAfterRounding,
      theoreticalProfit,
      theoreticalProfitPct,
      minPayout,
      profitRounded,
      profitRoundedPct
    };
  }

  function formatDecimal(decimalOdds) {
    return Number(decimalOdds).toFixed(2);
  }

  function formatImpliedProbability(probability) {
    return `${(Number(probability) * 100).toFixed(2)}%`;
  }

  const api = {
    isValidAmericanOdds,
    parseAmericanOdds,
    isValidDecimalOdds,
    parseDecimalOdds,
    americanToDecimal,
    decimalToAmerican,
    decimalToImpliedProbability,
    sumImpliedProbabilities,
    toInternalOdds,
    calculateSurebet,
    formatDecimal,
    formatImpliedProbability
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.OddsUtils = api;
})(typeof window !== 'undefined' ? window : globalThis);
