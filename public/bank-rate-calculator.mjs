const form = document.querySelector('#bank-rate-form');
const {balance, rateChange, estimate} = form.elements;
const pounds = new Intl.NumberFormat('en-GB', {style:'currency', currency:'GBP'});

function calculate() {
  const change = balance.valueAsNumber * rateChange.valueAsNumber / 1200;
  const pennies = Math.round(Math.abs(change) * 100);
  if (pennies === 0) {
    estimate.textContent = 'No change to the nearest penny per month';
    return;
  }
  const direction = change < 0 ? 'less' : 'more';
  estimate.textContent = 'About ' + pounds.format(pennies / 100) + ' ' + direction + ' in interest per month';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  calculate();
});

form.addEventListener('input', () => {
  estimate.textContent = 'Calculate to update the estimate.';
});
