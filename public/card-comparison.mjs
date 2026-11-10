import {projectionLimit,monthlyInterestRate} from './payoff.mjs';

const cardNames = [
  [/\b(?:amex|american express)\b/i, 'American Express'],
  [/\bbarclaycard\b/i, 'Barclaycard'],
  [/\b(?:hsbc|first direct|lloyds|halifax|natwest|rbs|santander|nationwide|tesco bank|virgin money|capital one|mbna|aqua|marbles|zopa|monzo|vanquis|bank of scotland|john lewis|newday|pulse|asda money)\b/i, null],
];
const pence = amount => Math.round(amount * 100);

export async function statementHash(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function comparisonDetails(pages) {
  const header = pages[0].slice(0, 16);
  let name = '';
  for (const line of header) {
    // Skip transaction rows and use only recognised names from the statement header.
    if (/£|\d{4,}/.test(line)) continue;
    for (const [pattern, canonical] of cardNames) {
      const match = pattern.exec(line);
      if (!match) continue;
      name = canonical ?? match[0].toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()).replace(/^(Hsbc|Rbs|Mbna)$/, word => word.toUpperCase());
      break;
    }
    if (name) break;
  }
  const normalized = pages.flat().join(' ').normalize('NFKC').toLowerCase().replace(/\s/g, '');
  return {
    name,
    textHash: await statementHash(normalized),
    promotional: pages.some(lines => lines.some(line => /\b(?:0\s*%\s*(?:p\.?a\.?|interest|offer|rate)|(?:promotional|introductory)\s+(?:interest|rate|offer|balance))\b/i.test(line))),
  };
}

export function comparisonCard(report, number) {
  const {metrics, rates, conflicts, comparison} = report;
  const {balance, minimum, statementDate, promoEnd} = metrics;
  const borrowingRates = rates.filter(rate => rate.label !== 'Default fees');
  const rate = borrowingRates[0];
  const label = comparison?.name ? `${comparison.name} · Card ${number}` : `Card ${number}`;
  let reason = '';
  if (!balance || !minimum || !rate || conflicts.some(key => ['balance','minimum','rates'].includes(key))) {
    reason = 'We need a clear balance, minimum payment and annual interest rate.';
  } else if (balance.value <= 0 || minimum.value <= 0) {
    reason = 'The statement needs a positive balance and minimum payment.';
  } else if (promoEnd || comparison?.promotional || rate.value === 0 || borrowingRates.some(item => monthlyInterestRate(item.value,item.basis) !== monthlyInterestRate(rate.value,rate.basis))) {
    reason = 'This statement shows promotional or different rates. This comparison uses one confirmed, fixed rate per card.';
  }
  return {label, balance, minimum, statementDate, rate, reason};
}

export function compareRepayments(cards, budget, method) {
  const monthlyBudget = pence(budget);
  const debts = cards.map(card => ({
    balance: pence(card.balance.value), minimum: pence(card.minimum.value), rate: monthlyInterestRate(card.rate.value,card.rate.basis),
    label: card.label, cleared: 0, firstPayment: 0,
  }));
  const minimum = debts.reduce((sum, debt) => sum + debt.minimum, 0);
  if (monthlyBudget < minimum) return {shortfall: (minimum - monthlyBudget) / 100};
  let interest = 0;
  for (let month = 1; month <= projectionLimit; month++) {
    let available = monthlyBudget;
    const active = debts.filter(debt => debt.balance > 0);
    for (const debt of active) {
      const charge = Math.round(debt.balance * debt.rate);
      debt.balance += charge;
      interest += charge;
    }
    active.sort(method === 'avalanche'
      ? (a,b) => b.rate - a.rate || a.balance - b.balance
      : (a,b) => a.balance - b.balance || b.rate - a.rate);
    for (const debt of active) {
      const payment = Math.min(debt.balance, debt.minimum);
      debt.balance -= payment;
      available -= payment;
      if (month === 1) debt.firstPayment = payment;
    }
    for (const debt of active) {
      const extra = Math.min(debt.balance, available);
      debt.balance -= extra;
      available -= extra;
      if (month === 1) debt.firstPayment += extra;
      if (debt.balance === 0) debt.cleared = month;
    }
    if (debts.every(debt => debt.cleared)) return {months: month, interest: interest / 100, debts};
  }
  return {months: null};
}
