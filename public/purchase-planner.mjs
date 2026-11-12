import {projectPayoff, paymentForMonths} from './payoff.mjs';

const form = document.getElementById('purchase-planner');
const {amount, rate, duration} = form.elements;
const summary = form.querySelector('.purchase-cost-figures');
const status = document.getElementById('purchase-status');
const total = document.getElementById('purchase-total');
const interest = document.getElementById('purchase-interest');
const monthlyPayment = document.getElementById('purchase-payment');
const amountValue = document.getElementById('purchase-amount-value');
const durationValue = document.getElementById('purchase-duration-value');
const pounds = new Intl.NumberFormat('en-GB', {style:'currency', currency:'GBP'});

function showStatus(message) {
  summary.hidden = Boolean(message);
  status.hidden = !message;
  status.textContent = message;
}

function updateEstimate() {
  const purchaseCost = amount.valueAsNumber;
  const months = duration.valueAsNumber;
  const annualRate = rate.valueAsNumber;
  amountValue.textContent = pounds.format(purchaseCost).replace(/\.00$/, '');
  durationValue.textContent = months + (months === 1 ? ' month' : ' months');
  amount.setAttribute('aria-valuetext', amountValue.textContent);
  duration.setAttribute('aria-valuetext', durationValue.textContent);
  if (!rate.validity.valid || !Number.isFinite(annualRate)) {
    showStatus('Enter a valid annual purchase rate to see an estimate.');
    return;
  }

  const payment = paymentForMonths(purchaseCost, annualRate, months, 'effective');
  const estimate = projectPayoff(purchaseCost, annualRate, payment, 'effective');
  total.textContent = pounds.format(estimate.total);
  interest.textContent = pounds.format(estimate.interest);
  monthlyPayment.textContent = pounds.format(payment);
  showStatus('');
}

form.addEventListener('input', updateEstimate);
form.addEventListener('submit', event => event.preventDefault());
updateEstimate();
