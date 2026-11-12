import {projectPayoff, projectionLimit} from './payoff.mjs';

const form = document.getElementById('purchase-planner');
const {amount, rate, basis, payment} = form.elements;
const summary = form.querySelector('.purchase-cost-figures');
const status = document.getElementById('purchase-status');
const total = document.getElementById('purchase-total');
const interest = document.getElementById('purchase-interest');
const term = document.getElementById('purchase-term');
const pounds = new Intl.NumberFormat('en-GB', {style:'currency', currency:'GBP'});

function showStatus(message) {
  summary.hidden = Boolean(message);
  status.hidden = !message;
  status.textContent = message;
}

function updateEstimate() {
  if (![amount, rate, payment].every(field => field.validity.valid && Number.isFinite(field.valueAsNumber))) {
    showStatus('Enter a valid purchase cost, rate and monthly payment to see an estimate.');
    return;
  }

  const estimate = projectPayoff(amount.valueAsNumber, rate.valueAsNumber, payment.valueAsNumber, basis.value);
  if (estimate.status === 'no-progress') {
    showStatus('This monthly payment would leave the balance unchanged or growing in this estimate.');
    return;
  }
  if (estimate.status === 'beyond-limit') {
    showStatus('This payment would take longer than ' + projectionLimit / 12 + ' years in this estimate.');
    return;
  }

  total.textContent = pounds.format(estimate.total);
  interest.textContent = pounds.format(estimate.interest);
  term.textContent = estimate.months + (estimate.months === 1 ? ' month' : ' months');
  showStatus('');
}

form.addEventListener('input', updateEstimate);
form.addEventListener('submit', event => event.preventDefault());
updateEstimate();
