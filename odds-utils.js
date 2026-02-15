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

    if (Math.abs(value) < 100) {
      throw new Error('American odds should be at least 100 in magnitude.');
    }

    return value;
  }

  function isValidDecimalOdds(rawOdds) {
    const value = Number.parseFloat(normalizeOddsInput(rawOdds));
    return Number.isFinite(value) && value > 1;
  }

  function parseDecimalOdds(rawOdds) {
    if (!isValidDecimalOdds(rawOdds)) {
      throw new Error('Decimal odds must be a number greater than 1.00.');
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

  function toInternalOdds(rawOdds, format) {
    if (format === 'american') {
      const americanValue = parseAmericanOdds(rawOdds);
      const decimalValue = americanToDecimal(americanValue);

      return {
        american: americanValue > 0 ? `+${americanValue}` : `${americanValue}`,
        decimal: decimalValue,
        impliedProbability: decimalToImpliedProbability(decimalValue)
      };
    }

    const decimalValue = parseDecimalOdds(rawOdds);

    return {
      american: decimalToAmerican(decimalValue),
      decimal: decimalValue,
      impliedProbability: decimalToImpliedProbability(decimalValue)
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
    toInternalOdds,
    formatDecimal,
    formatImpliedProbability
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.OddsUtils = api;
})(typeof window !== 'undefined' ? window : globalThis);
