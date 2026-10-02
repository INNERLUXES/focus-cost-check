// Exact decimal arithmetic for money. A cost is read from its text into a BigInt that counts units of 10^-18, so a sum
// of any number of rows is exact: there is no binary floating point anywhere between the text of the file and the text
// of the report. FOCUS gives no level of precision for numbers, so the tool accepts what the Numeric Format page lists
// (an integer, a decimal, or E notation) and refuses a value that needs more than 18 decimal places, instead of
// rounding it.

export const SCALE_DIGITS = 18;
export const SCALE = 10n ** BigInt(SCALE_DIGITS);

const NUMBER = /^(-?)(\d{1,30})(?:\.(\d{1,60}))?(?:[eE](-?\d{1,3}))?$/;

// Returns a BigInt in units of 10^-18, or null when the text is not a number that the Numeric Format page allows or
// needs more than 18 decimal places. A plus sign, a comma, a currency symbol, a space and a positive sign in an
// exponent are refused, as the page says.
export function parseDecimal(text) {
  const m = NUMBER.exec(text);
  if (m === null) return null;
  const [, sign, whole, fraction = '', exponent = '0'] = m;
  let digits = whole + fraction;
  let scale = fraction.length - Number(exponent);
  if (scale < 0) {
    if (digits.length - scale > 80) return null;
    digits += '0'.repeat(-scale);
    scale = 0;
  }
  while (scale > SCALE_DIGITS && digits.endsWith('0')) {
    digits = digits.slice(0, -1);
    scale -= 1;
  }
  if (scale > SCALE_DIGITS) return null;
  const value = BigInt(digits) * 10n ** BigInt(SCALE_DIGITS - scale);
  return sign === '-' ? -value : value;
}

// Text of an amount: the whole part, a point and at least two decimal places, with trailing zeros after the second
// removed. 1234500000000000000000n is "1234.50".
export function formatDecimal(value) {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / SCALE;
  let fraction = (abs % SCALE).toString().padStart(SCALE_DIGITS, '0').replace(/0+$/, '');
  if (fraction.length < 2) fraction = fraction.padEnd(2, '0');
  return `${negative && (whole !== 0n || /[1-9]/.test(fraction)) ? '-' : ''}${whole}.${fraction}`;
}

// part / total as a percentage with one decimal place, rounded half up on the exact values. total must be above zero.
export function formatPercent(part, total) {
  if (total <= 0n) return '0.0';
  const negative = part < 0n;
  const abs = negative ? -part : part;
  const tenths = (abs * 2000n + total) / (2n * total);
  const text = `${tenths / 10n}.${tenths % 10n}`;
  return negative && tenths !== 0n ? `-${text}` : text;
}

// True when part / total * 100 is above the percentage (given as an exact value from parseDecimal). total above zero.
export function exceedsPercent(part, total, percent) {
  return part * 100n * SCALE > percent * total;
}

// Parses a percentage or an amount that the user gives on the command line: digits with an optional decimal part.
export function parseOption(text, maxWhole = 30) {
  if (!new RegExp(`^\\d{1,${maxWhole}}(?:\\.\\d{1,6})?$`).test(text)) return null;
  return parseDecimal(text);
}
