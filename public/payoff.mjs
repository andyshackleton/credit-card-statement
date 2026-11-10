export const projectionLimit = 600;

export function monthlyInterestRate(annualRate, basis) {
  return basis === 'effective' ? Math.pow(1 + annualRate / 100, 1 / 12) - 1 : annualRate / 1200;
}

export function projectPayoff(balance, annualRate, payment, basis) {
  let remaining = Math.round(balance * 100);
  const monthlyPayment = Math.round(payment * 100);
  const monthlyRate = monthlyInterestRate(annualRate,basis);
  const balances = [remaining / 100];
  let interest = 0;
  if (monthlyPayment <= 0 || monthlyPayment <= Math.round(remaining * monthlyRate)) {
    return {status:'no-progress'};
  }
  for (let month = 0; remaining > 0 && month < projectionLimit; month++) {
    const charge = Math.round(remaining * monthlyRate);
    interest += charge;
    remaining = Math.max(0,remaining + charge - monthlyPayment);
    balances.push(remaining / 100);
  }
  if (remaining > 0) return {status:'beyond-limit'};
  return {status:'complete',balances,months:balances.length-1,interest:interest/100,
    total:(Math.round(balance*100)+interest)/100};
}

export function statementDay(value) {
  const match = /^(\d{1,2})[ /.-]([a-z]+|\d{1,2})[ /.-](20\d{2})$/i.exec(value ?? '');
  if (!match) return null;
  const names = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const month = /^\d+$/.test(match[2]) ? Number(match[2])-1 : names.indexOf(match[2].slice(0,3).toLowerCase());
  if (month < 0 || month > 11) return null;
  const day = Number(match[1]);
  const date = new Date(Number(match[3]),month,day);
  return date.getMonth() === month && date.getDate() === day ? date : null;
}

export function paymentForMonths(balance, annualRate, months, basis) {
  const principal = Math.round(balance * 100);
  let low = 1;
  let high = principal + Math.round(principal * monthlyInterestRate(annualRate,basis));
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const projection = projectPayoff(balance,annualRate,middle/100,basis);
    if (projection.status === 'complete' && projection.months <= months) high = middle;
    else low = middle + 1;
  }
  return low/100;
}
