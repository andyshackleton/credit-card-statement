import {parseStatement,pageLines} from './parser.mjs';
import {projectPayoff,statementDay,paymentForMonths,projectionLimit} from './payoff.mjs';

const $ = id=>document.getElementById(id);
const pounds = new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'});
const wholePounds = new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0});
const paymentStep = 5;
const labels = {balance:'Statement balance',interest:'Interest charged',fees:'Fees charged',minimum:'Minimum payment',due:'Payment due date',statementDate:'Statement date',promoEnd:'Promotional rate ends'};
const example = parseStatement([
  ['Statement date 1 November 2026','Previous balance £2,150.00','Total purchases £595.60','Refunds £25.00 CR','Payments received £350.00 CR','Statement balance £2,400.00','Interest charged £29.40','Fees charged £0.00','Minimum payment £62.00','Payment due date 25 November 2026'],
  ['Purchases 24.9% p.a.','Balance transfer 0% p.a.','0% rate ends 31 March 2027']
]);
let current = null;
let generation = 0;
function node(tag, text, cls) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (cls) el.className = cls;
  return el;
}
function format(field) {
  return typeof field.value === 'number' ? pounds.format(field.value) : field.value;
}
function reportHeading(number,title) {
  const heading = node('h3','','report-section-heading');
  const step = node('span',number,'report-section-number');
  step.setAttribute('aria-hidden','true');
  heading.append(step,node('span',title));
  return heading;
}
function renderBalance(container,data) {
  container.replaceChildren();
  const {balanceChange:change,balanceBreakdown:rows} = data;
  container.append(reportHeading('01','Balance and next payment'));
  const panel = node('div','','statement-position');
  const balance = data.metrics.balance;
  const position = node('div','','statement-position-main');
  position.append(node('span','Statement balance','statement-position-label'),
    node('p',balance ? (balance.value < 0 ? format({value:-balance.value})+' credit' : format(balance)) : 'Balance unavailable','statement-position-amount'));
  if (change !== null) {
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    const comparison = node('div','','statement-position-comparison');
    const badge = node('span','','statement-movement statement-movement-'+direction);
    const arrow = node('span',{up:'↑',down:'↓',flat:'→'}[direction]);
    arrow.setAttribute('aria-hidden','true');
    badge.append(arrow,change === 0 ? 'No change' :
      pounds.format(Math.abs(change))+(change > 0 ? ' higher' : ' lower'));
    comparison.append(badge,node('span','vs last statement'));
    position.append(comparison);
  }
  panel.append(position);
  const due = data.metrics.due;
  const minimum = data.metrics.minimum;
  if (due || minimum) {
    const payment = node('div','','statement-position-due');
    const heading = node('div','','statement-position-due-heading');
    heading.append(payoffIcon('calendar'),node('span',minimum ? 'Minimum payment' : 'Payment due'));
    payment.append(heading);
    if (minimum) payment.append(node('strong',format(minimum),'statement-position-minimum'));
    if (due) payment.append(node(minimum ? 'span' : 'strong',
      (minimum ? 'Due ' : '')+format(due),'statement-position-date'));
    panel.append(payment);
  }
  container.append(panel);
  const costFigures = [['Interest charged',data.metrics.interest],['Fees charged',data.metrics.fees]];
  const costs = node('dl','','statement-costs');
  for (const [label,field] of costFigures) {
    if (!field) continue;
    const figure = payoffMetric(label,format(field));
    figure.querySelector('dd').append(node('small','PDF page '+field.page));
    costs.append(figure);
  }
  if (costs.childElementCount) container.append(costs);
  container.append(reportHeading('02','How your balance changed'));
  if (!rows) {
    const known = [['Payments received',data.payment]];
    const figures = node('dl','','payoff-figures report-known');
    for (const [label,field] of known) if (field) figures.append(payoffMetric(label,format(field)));
    if (figures.childElementCount) container.append(figures);
    container.append(node('p','A full breakdown was unavailable.','quiet'));
    return;
  }
  const breakdown = node('div','','statement-breakdown');
  const flow = node('div','','breakdown-flow');
  const arrow = node('span','','breakdown-flow-arrow');
  arrow.append(payoffIcon('arrow'));
  arrow.setAttribute('aria-hidden','true');
  for (const [index,row] of [rows[0],rows.at(-1)].entries()) {
    const balance = node('dl','','breakdown-balance');
    const figure = payoffMetric(index ? 'This statement' : 'Last statement',format(row));
    figure.querySelector('dd').append(node('small','PDF page '+row.page));
    balance.append(figure);
    if (index) flow.append(arrow);
    flow.append(balance);
  }
  const movements = rows.slice(1,-1);
  const groups = node('div','','breakdown-groups');
  const signed = new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',signDisplay:'exceptZero'});
  for (const [kind,label,icon,items] of [
    ['added','Added to your balance','increase',movements.filter(row=>row.value >= 0)],
    ['deducted','Taken off your balance','decrease',movements.filter(row=>row.value < 0)]
  ]) {
    const group = node('div','','breakdown-group breakdown-group-'+kind);
    const heading = node('div','','breakdown-group-heading');
    const symbol = node('span','','breakdown-symbol');
    symbol.append(payoffIcon(icon));
    symbol.setAttribute('aria-hidden','true');
    const total = items.reduce((sum,row)=>sum+Math.round(row.value*100),0)/100;
    const summary = node('div','','breakdown-group-summary');
    summary.append(node('h4',label),node('strong',signed.format(total)));
    heading.append(symbol,summary);
    group.append(heading);
    const list = node('dl','','breakdown-items');
    for (const row of items) {
      const item = payoffMetric(row.label,pounds.format(Math.abs(row.value)));
      item.querySelector('dt').append(node('small','PDF page '+row.page));
      list.append(item);
    }
    if (list.childElementCount) group.append(list);
    groups.append(group);
  }
  breakdown.append(flow,groups);
  container.append(breakdown);
}

function payoffIcon(name) {
  const paths = {
    arrow:'M4 12h15m-6-6 6 6-6 6',
    transfer:'M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4',

    payment:'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM3 10h18m-14 5h4',
    increase:'M4 17l6-6 4 4 6-8m-6 0h6v6',
    decrease:'M4 7l6 6 4-4 6 8m-6 0h6v-6',
    settings:'M4 7h16M4 17h16M8 4v6m8 4v6',

    calendar:'M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
    clock:'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    interest:'M5 19 19 5M9 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm10 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z'
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('aria-hidden','true');
  svg.classList.add('payoff-icon');
  const path = document.createElementNS(svg.namespaceURI,'path');
  path.setAttribute('d',paths[name]);
  svg.append(path);
  return svg;
}

function payoffMetric(label,value) {
  const metric = node('div','');
  metric.append(node('dt',label),node('dd',value));
  return metric;
}

function renderInsights(container,data) {
  container.replaceChildren();
  const {balanceChange:change,balanceBreakdown:rows,metrics} = data;
  const list = node('ul','','statement-insight-list');
  if (change !== null && rows) {
    const payment = rows.find(row=>row.label === 'Payments received');
    if (payment && payment.value < 0 && change > 0) {
      list.append(node('li','You paid '+pounds.format(-payment.value)+', but your balance still rose by '+pounds.format(change)+'.'));
    }
  }
  if (metrics.interest && metrics.fees) {
    const cost = (Math.round(metrics.interest.value*100)+Math.round(metrics.fees.value*100))/100;
    list.append(node('li',cost === 0 ? 'The statement shows no interest or fees this period.'
      : 'Interest and fees added '+pounds.format(cost)+' to your balance this period.'));
  }
  if (metrics.promoEnd) {
    list.append(node('li','Your statement lists '+format(metrics.promoEnd)+' as the promotional rate end date.'));
  }
  if (list.childElementCount) container.append(node('h3','Statement insights','report-section-heading'),list);
}

function renderPayoff(container,data,sample) {
  const panel = node('section','','payoff');
  panel.append(reportHeading('03','Compare repayment plans'));
  container.replaceChildren(panel);
  const {balance,minimum,due,statementDate,promoEnd} = data.metrics;
  const today = new Date();
  today.setHours(0,0,0,0);
  const dueDay = statementDay(due?.value);
  const statementDayFound = statementDay(statementDate?.value);
  const oldest = new Date(today);
  oldest.setDate(oldest.getDate()-45);
  const stale = !sample && ((dueDay && dueDay < today) || (statementDayFound && statementDayFound < oldest));
  if (balance && balance.value <= 0 && !stale) {
    panel.append(node('p','There is no balance to repay on this statement.'));
    return;
  }
  panel.append(node('p','See how a different monthly payment could change your payoff date and total interest.','report-section-intro'));
  const recentPayment = data.payment?.value > 0 ? data.payment.value : undefined;
  const singleRate = data.rates.length === 1 && !promoEnd && !data.conflicts.includes('promoEnd') ? data.rates[0] : null;
  const rate = sample ? 24.9 : stale ? undefined : singleRate?.value;
  const monthValue = day=>day.getFullYear()+'-'+String(day.getMonth()+1).padStart(2,'0');
  const currentMonth = monthValue(today);
  const suggestedMonth = dueDay && !stale ? monthValue(dueDay) : '';
  const monthFormat = new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric'});
  let confirmed = sample;
  const settings = node('details','','report-details payoff-settings');
  const settingsLabel = node('summary','');
  settingsLabel.append(payoffIcon('settings'),'Set up your repayment estimate');
  settings.append(settingsLabel);
  settings.open = !sample;
  settings.hidden = sample;
  const controls = node('div','','balance-inputs payoff-inputs');
  function numberField(title,value,min,max) {
    const label = node('label',title);
    const input = node('input','');
    Object.assign(input,{type:'number',inputMode:'decimal',min:String(min),max:String(max),step:'any',required:true});
    if (value !== undefined) input.value = value;
    label.append(input);
    controls.append(label);
    return input;
  }
  const balanceInput = numberField('Balance to repay (£)',stale ? undefined : balance?.value,.01,1000000000);
  const baselineInput = numberField('Planned monthly payment (£)',recentPayment,.01,1000000000);
  const rateInput = numberField('Annual interest rate (%)',rate,0,100);
  balanceInput.readOnly = !stale && balance?.value > 0 && balance.value <= 1000000000;
  rateInput.readOnly = rate !== undefined && rate >= 0 && rate <= 100;
  if (balanceInput.readOnly) balanceInput.parentElement.append(node('small','From your statement'));
  if (rateInput.readOnly) rateInput.parentElement.append(node('small',sample ? 'Fictional estimate assumption' : 'From your statement'));
  const monthLabel = node('label','First payment month (YYYY-MM)');
  const monthInput = node('input','');
  Object.assign(monthInput,{type:'month',value:suggestedMonth,required:true});
  if (!sample) monthInput.min = currentMonth;
  monthLabel.append(monthInput);
  controls.append(monthLabel);
  const confirm = node('button','Use these figures','report-button');
  confirm.type = 'button';
  const note = sample ? 'Fictional inputs for the sample estimate.'
    : stale ? 'This statement may be out of date. Enter your latest balance and rate, then choose a first payment month.'
    : 'Figures taken from your statement are read-only. Fill in any missing figures and confirm what you plan to pay each month. Any payment prefilled here is from your statement.';
  settings.append(node('p',note,'quiet'),controls,confirm);
  const planner = node('fieldset','','payoff-planner');
  planner.append(node('legend','Try a different plan'));
  const choices = node('div','','payoff-choices');
  const ranges = {};
  for (const [mode,title] of [['payment','Monthly payment'],['time','Time to clear']]) {
    const choice = node('label','');
    const radio = node('input','');
    Object.assign(radio,{type:'radio',name:'payoff-mode',value:mode,checked:mode === 'payment'});
    const option = node('span','','payoff-mode');
    option.append(payoffIcon(mode === 'payment' ? 'payment' : 'clock'),title);
    choice.append(radio,option);
    choices.append(choice);
    const label = node('label','','payoff-range');
    const value = node('span','','payoff-range-value');
    const input = node('input','');
    Object.assign(input,{type:'range',step:mode === 'payment' ? paymentStep : 1});
    input.setAttribute('aria-label',title);
    const bounds = node('span','','payoff-range-bounds');
    bounds.setAttribute('aria-hidden','true');
    const low = node('span','');
    const high = node('span','');
    bounds.append(low,high);
    label.append(node('span',mode === 'payment' ? 'Pay each month' : 'Clear in'),value,input,bounds);
    ranges[mode] = {radio,label,value,input,low,high};
  }
  planner.append(choices,ranges.payment.label,ranges.time.label);
  let comparisonPayment;
  let targetMonths;
  const monthsText = months=>months+' month'+(months === 1 ? '' : 's');
  const summary = node('div','','payoff-summary');
  summary.setAttribute('aria-live','polite');
  const graph = node('div','','payoff-graph');
  const assumptions = node('p','','payoff-assumptions');
  panel.append(settings,assumptions,planner,summary,graph,
    node('p','Estimate assumes one fixed rate and no new spending or fees. Mixed rates and promotions may give different results.','quiet payoff-note'));

  function finishDate(months) {
    const [year,month] = monthInput.value.split('-').map(Number);
    return new Date(year,month+months-2,1);
  }
  function update() {
    graph.replaceChildren();
    assumptions.hidden = !confirmed;
    planner.hidden = !confirmed;
    if (!confirmed) {
      summary.textContent = 'Confirm your payoff inputs to see an estimate.';
      return;
    }
    const annualRate = rateInput.valueAsNumber;
    const balanceAmount = Math.round(balanceInput.valueAsNumber*100)/100;
    const usual = Math.round(baselineInput.valueAsNumber*100)/100;
    assumptions.textContent = [
      pounds.format(balanceAmount)+' balance',annualRate+'% annual rate',
      pounds.format(usual)+' planned monthly payment','Starts '+monthFormat.format(finishDate(1))
    ].join(' · ');
    const baseline = projectPayoff(balanceAmount,annualRate,usual);
    const maxPayment = paymentForMonths(balanceAmount,annualRate,1);
    const minPayment = Math.min(maxPayment,Math.max(stale ? 0 : minimum?.value ?? 0,paymentForMonths(balanceAmount,annualRate,projectionLimit)));
    const minSliderPayment = Math.ceil(minPayment/paymentStep)*paymentStep;
    const maxSliderPayment = Math.ceil(maxPayment/paymentStep)*paymentStep;
    const longest = projectPayoff(balanceAmount,annualRate,minPayment).months;
    const timeMode = ranges.time.radio.checked;
    if (timeMode && targetMonths !== undefined) {
      targetMonths = Math.min(longest,Math.max(1,targetMonths));
      comparisonPayment = Math.max(minPayment,paymentForMonths(balanceAmount,annualRate,targetMonths));
    } else if (timeMode) {
      comparisonPayment = Math.min(maxSliderPayment,Math.max(minPayment,comparisonPayment ?? usual+25));
    } else {
      const roundedPayment = Math.round((comparisonPayment ?? usual+25)/paymentStep)*paymentStep;
      comparisonPayment = Math.min(maxSliderPayment,Math.max(minSliderPayment,roundedPayment));
    }
    const comparison = projectPayoff(balanceAmount,annualRate,comparisonPayment);
    targetMonths = undefined;
    const payments = [usual,comparisonPayment];
    const results = [baseline,comparison];
    for (const [mode,range] of Object.entries(ranges)) {
      const isTime = mode === 'time';
      range.label.hidden = isTime !== timeMode;
      range.input.min = isTime ? 1 : minSliderPayment;
      range.input.max = isTime ? longest : maxSliderPayment;
      range.input.value = isTime ? comparison.months : comparisonPayment;
      range.input.disabled = range.input.min === range.input.max;
      const span = Number(range.input.max)-Number(range.input.min);
      const progress = span ? (range.input.valueAsNumber-Number(range.input.min))/span : 1;
      range.input.style.setProperty('--slider-progress',progress*100+'%');
      range.low.textContent = isTime ? monthsText(1) : wholePounds.format(minSliderPayment);
      range.high.textContent = isTime ? monthsText(longest) : wholePounds.format(maxSliderPayment);
      range.value.textContent = isTime ? monthsText(comparison.months) : wholePounds.format(comparisonPayment);
      range.input.setAttribute('aria-valuetext',range.value.textContent);
    }
    const cards = results.map((result,index)=>{
      const card = node('div','','payoff-option payoff-option-'+index);
      const heading = node('div','','payoff-option-heading');
      const title = node('h4','');
      title.append(payoffIcon(index ? 'transfer' : 'payment'),index ? 'Adjusted payment' : 'Starting payment');
      const payment = node('div','','payoff-payment');
      payment.append(node('strong',pounds.format(payments[index])),node('span','per month'));
      heading.append(title,payment);
      card.append(heading);
      if (result.status !== 'complete') {
        card.append(node('p',result.status === 'no-progress' ? 'This payment would leave the balance unchanged or growing.' : 'Payoff is beyond the 50-year projection.'));
        return card;
      }
      const duration = monthsText(result.months);
      const finish = finishDate(result.months);
      const payoff = node('div','','payoff-date');
      const date = node('div','');
      date.append(node('span','Estimated payoff','payoff-caption'),
        node('strong',finish ? monthFormat.format(finish) : duration));
      payoff.append(payoffIcon('calendar'),date);
      if (finish) payoff.append(node('span',duration,'payoff-duration'));
      const metrics = node('dl','','payoff-figures');
      metrics.append(payoffMetric('Estimated total',pounds.format(result.total)),
        payoffMetric('Estimated interest',pounds.format(result.interest)));
      card.append(payoff,metrics);
      return card;
    });
    summary.replaceChildren(...cards);
    if (baseline.status === 'complete' && comparison.status === 'complete' && baseline.interest >= comparison.interest && baseline.months >= comparison.months && (baseline.interest > comparison.interest || baseline.months > comparison.months)) {
      const monthsSaved = baseline.months-comparison.months;
      const interestSaved = Math.round(baseline.interest*100)-Math.round(comparison.interest*100);
      const savings = node('div','','payoff-saving');
      savings.append(node('h4','What the adjusted payment could save you'));
      const items = [
        ['clock',monthsSaved,monthsSaved+' month'+(monthsSaved === 1 ? '' : 's'),'sooner'],
        ['interest',interestSaved,pounds.format(interestSaved/100),'interest saved']
      ];
      for (const [icon,value,amount,label] of items) {
        if (!value) continue;
        const item = node('div','','payoff-saving-item');
        const figure = node('span','');
        figure.append(node('strong',amount),' '+label);
        item.append(payoffIcon(icon),figure);
        savings.append(item);
      }
      summary.append(savings);
    }
    drawPayoff(graph,results,balanceAmount,finishDate);
  }
  for (const range of Object.values(ranges)) range.radio.addEventListener('change',update);
  ranges.payment.input.addEventListener('input',()=>{
    comparisonPayment = ranges.payment.input.valueAsNumber;
    update();
  });
  ranges.time.input.addEventListener('input',()=>{
    targetMonths = ranges.time.input.valueAsNumber;
    update();
  });
  const inputs = [balanceInput,baselineInput,rateInput,monthInput];
  for (const input of inputs) input.addEventListener('input',()=>{
    confirmed = false;
    update();
  });
  confirm.addEventListener('click',()=>{
    const invalid = inputs.find(input=>!input.validity.valid);
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthInput.value) || (!sample && monthInput.value < currentMonth)) {
      summary.textContent = 'Choose this month or a future month using YYYY-MM.';
      monthInput.focus();
      return;
    }
    const required = stale ? 0 : Math.min(minimum?.value ?? 0,balanceInput.valueAsNumber);
    if (baselineInput.valueAsNumber < required) {
      summary.textContent = 'Enter a monthly payment of at least '+pounds.format(required)+'.';
      baselineInput.focus();
      return;
    }
    confirmed = true;
    comparisonPayment = undefined;
    targetMonths = undefined;
    settings.open = false;
    update();
    (ranges.time.radio.checked ? ranges.time.radio : ranges.payment.radio).focus();
  });
  update();
}

function drawPayoff(container,results,balance,finishDate) {
  const completed = results.filter(result=>result.status === 'complete');
  if (!completed.length) return;
  const horizon = Math.max(...completed.map(result=>result.months));
  const x = month=>2+month/horizon*96;
  const y = amount=>2+(1-amount/balance)*46;
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 100 50');
  svg.setAttribute('preserveAspectRatio','none');
  svg.setAttribute('aria-hidden','true');
  function mark(tag,attributes) {
    const element = document.createElementNS(svg.namespaceURI,tag);
    for (const [key,value] of Object.entries(attributes)) element.setAttribute(key,value);
    svg.append(element);
  }
  for (const value of [2,25,48]) mark('line',{x1:2,x2:98,y1:value,y2:value,class:'payoff-gridline'});
  results.forEach((result,index)=>{
    if (result.status !== 'complete') return;
    mark('polyline',{points:result.balances.map((amount,month)=>x(month)+','+y(amount)).join(' '),
      class:'payoff-line payoff-line-'+index,'vector-effect':'non-scaling-stroke'});
    mark('line',{x1:x(result.months),x2:x(result.months),y1:45,y2:48,
      class:'payoff-line payoff-line-'+index,'vector-effect':'non-scaling-stroke'});
  });
  container.append(node('p','Remaining balance (£)','payoff-axis'),
    node('div',pounds.format(balance),'payoff-axis'),svg);
  const axis = node('div','','payoff-time payoff-axis');
  axis.append(node('span','£0 · Start'),node('span',horizon+' month'+(horizon === 1 ? '' : 's')));
  container.append(axis);
  const shortDate = new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric'});
  results.forEach((result,index)=>{
    if (result.status !== 'complete') return;
    const finish = finishDate(result.months);
    const row = node('div','','payoff-endpoint-row');
    const endpoint = node('span',(index ? 'Adjusted payment' : 'Starting payment')+' · '+
      (finish ? shortDate.format(finish) : result.months+' mo'),'payoff-endpoint payoff-endpoint-'+index);
    endpoint.style.setProperty('--endpoint',x(result.months)+'%');
    row.append(endpoint);
    container.append(row);
  });
}

function renderRates(container,data) {
  const heading = node('h3','Annual rates','statement-rates-title');
  container.replaceChildren(heading);
  const list = node('dl','','statement-rates');
  for (const rate of data.rates) {
    const card = node('div','','statement-rate');
    const label = node('dt','');
    const icon = rate.label === 'Purchases' ? 'payment' : rate.label === 'Balance transfer' ? 'transfer' : 'interest';
    label.append(payoffIcon(icon),rate.label);
    const value = node('dd','');
    value.append(node('strong',rate.value+'%'),node('span','per year'));
    card.append(label,value,node('dd','PDF page '+rate.page,'statement-rate-source'));
    list.append(card);
  }
  if (list.childElementCount) container.append(list);
  else container.append(node('p','Annual rates unavailable in this PDF.','quiet'));
  const expiry = data.metrics.promoEnd;
  if (expiry) {
    const notice = node('p','','statement-rate-expiry');
    const text = node('span','');
    text.append('Promotion ends ',node('strong',format(expiry)));
    notice.append(payoffIcon('calendar'),text,node('small','PDF page '+expiry.page));
    container.append(notice);
  }
}

function show(data, sample = false, scroll = true) {
  current = {sample,...data};
  $('result-type').textContent = sample ? 'Fictional sample' : 'Statement report';
  const statementDate = data.metrics.statementDate;
  $('report-date').hidden = !statementDate;
  $('report-date').textContent = statementDate ? 'Statement dated '+format(statementDate) : '';
  $('result-title').textContent = sample ? 'Sample statement report' : 'Your statement, explained';
  $('sample-note').hidden = !sample;
  $('clear').textContent = sample ? 'Close sample' : 'Close report';
  const issues = $('statement-issues');
  issues.hidden = data.conflicts.length === 0;
  issues.textContent = data.conflicts.length ? 'Check your statement. Different values were found for '+data.conflicts.map(key=>({
    rates:'annual rates',payment:'payments received',opening:'previous balance',...labels
  }[key].toLowerCase())).join(', ')+'.' : '';
  $('report-details').open = false;
  $('metrics').replaceChildren(...Object.entries(labels).map(([key,label])=>{
    const field = data.metrics[key];
    const metric = node('div','','metric');
    metric.append(node('div',label),node('strong',field ? format(field) : data.conflicts.includes(key) ? 'Conflicting values' : 'Not identified'));
    if (field) metric.append(node('small','PDF page '+field.page));
    return metric;
  }));
  renderRates($('rates'),data);
  renderBalance($('balance-breakdown'),data);
  renderInsights($('statement-insights'),data);
  renderPayoff($('payoff'),data,sample);
  $('result').hidden = false;
  if (scroll) {
    $('result-title').focus({preventScroll:true});
    $('result').scrollIntoView({block:'start',behavior:'instant'});
  }
}
const sampleDialog = $('sample-dialog');
let sampleOpener = null;
let previousReport = null;
function reset() {
  sampleOpener = null;
  previousReport = null;
  generation++;
  current = null;
  $('result').hidden = true;
  for (const id of ['metrics','rates','balance-breakdown','statement-insights','payoff']) $(id).replaceChildren();
  $('status').textContent = '';
  $('file').value = '';
}
async function readPageItems(page) {
  // Safari may support stream readers without supporting async iteration of streams.
  const reader = page.streamTextContent().getReader();
  const items = [];
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) return items;
      items.push(...value.items);
    }
  } finally {
    reader.releaseLock();
  }
}

$('file').addEventListener('change',async event=>{
  const file = event.target.files[0];
  if (!file) return;
  reset();
  const attempt = generation;
  if (file.size > 15*1024*1024) {
    $('status').textContent = 'Choose a PDF no larger than 15 MB.';
    return;
  }
  $('status').textContent = 'Opening your PDF on this device…';
  let stage = 'FILE';
  async function readPages(pdfjs,bytes,compatibility = false) {
    stage = 'OPEN';
    const task = pdfjs.getDocument({
      data:bytes,isEvalSupported:false,useWorkerFetch:false,
      ...(compatibility ? {isOffscreenCanvasSupported:false,isImageDecoderSupported:false,useWasm:false} : {})
    });
    try {
      const pdf = await task.promise;
      if (attempt !== generation) return [];
      if (pdf.numPages > 30) throw new Error('limit');
      stage = 'TEXT';
      const pages = [];
      for (let page = 1; page <= pdf.numPages && attempt === generation; page++) {
        $('status').textContent = 'Reading page '+page+' of '+pdf.numPages+'…';
        const pdfPage = await pdf.getPage(page);
        const items = pdf.isPureXfa ? (await pdfPage.getTextContent()).items : await readPageItems(pdfPage);
        pages.push(pageLines(items));
      }
      return pages;
    } finally {
      await task.destroy().catch(()=>{});
    }
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (attempt !== generation) return;
    stage = 'ENGINE';
    const pdfjs = await import('./pdf.min.mjs');
    if (attempt !== generation) return;
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.min.mjs',import.meta.url).href;

    let pages;
    try {
      pages = await readPages(pdfjs,bytes.slice());
    } catch (error) {
      if (attempt !== generation) return;
      if (error.message === 'limit' || ['PasswordException','InvalidPDFException'].includes(error.name)) throw error;
      $('status').textContent = 'Trying the PDF reader in compatibility mode…';
      stage = 'ENGINE';
      // Loading the worker module here lets PDF.js use its same-thread fallback.
      await import('./pdf.worker.min.mjs');
      if (attempt !== generation) return;
      pages = await readPages(pdfjs,bytes,true);
    }
    if (attempt !== generation) return;
    if (!pages.some(lines=>lines.length)) {
      $('status').textContent = 'No readable text was found. If this is a scan, choose the original text-based PDF from your card provider.';
      return;
    }
    stage = 'REPORT';
    const result = parseStatement(pages);
    if (!Object.values(result.metrics).some(Boolean) && !result.rates.length && !result.conflicts.length) {
      $('status').textContent = 'The PDF opened, but no supported statement fields were found. This statement layout may not be supported yet.';
      return;
    }
    show(result);
    $('status').textContent = 'PDF read. Your report is ready below.';
  } catch (error) {
    if (attempt !== generation) return;
    const failure = {
      FILE:'Your browser could not open that file. Save a copy to your device and select it again.',
      ENGINE:'The PDF reader could not start in this browser. Try opening Statement Check directly in Safari or Chrome.',
      OPEN:'The reader could not open this PDF.',
      TEXT:'The PDF opened, but the reader could not extract its text.',
      REPORT:'The PDF opened, but Statement Check could not build the report.'
    };
    $('status').textContent = error.message === 'limit'
      ? 'Choose a statement with 30 pages or fewer.'
      : error.name === 'PasswordException' ? 'This PDF is password protected. Choose an unlocked copy.'
        : error.name === 'InvalidPDFException' ? 'This file is not a readable PDF. Choose the original PDF from your card provider.'
          : failure[stage]+' (PDF-'+stage+')';
  }
});
for (const trigger of document.querySelectorAll('[data-open-sample]')) {
  trigger.addEventListener('click',event=>{
    if (trigger.matches('a') && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    event.preventDefault();
    if (sampleDialog.open) return;
    const report = current?.sample ? previousReport : current;
    reset();
    sampleOpener = trigger;
    previousReport = report;
    sampleDialog.append($('result'));
    show(example,true,false);
    sampleDialog.showModal();
    sampleDialog.scrollTop = 0;
    $('result-title').focus({preventScroll:true});
  });
}
sampleDialog.addEventListener('close',()=>{
  const opener = sampleOpener;
  const report = previousReport;
  sampleDialog.before($('result'));
  reset();
  if (report) show(report,false,false);
  // The mobile menu may have closed when its sample link was selected.
  const target = opener?.getClientRects().length ? opener
    : opener?.closest('nav')?.id === 'marketing-navigation' ? document.querySelector('.marketing-menu-toggle') : $('choose-file');
  target.focus({preventScroll:true});
});
$('clear').onclick = ()=>{
  if (sampleDialog.open) {
    sampleDialog.close();
    return;
  }
  reset();
  $('choose-file').focus();
};
$('print').onclick = ()=>window.print();
let detailsWereOpen = false;
window.addEventListener('beforeprint',()=>{
  detailsWereOpen = $('report-details').open;
  $('report-details').open = true;
});
window.addEventListener('afterprint',()=>$('report-details').open = detailsWereOpen);
function download(value,type,extension) {
  const url = URL.createObjectURL(new Blob([value],{type}));
  const link = node('a','');
  link.href = url;
  link.download = 'statement-'+(current.sample ? 'sample' : 'summary')+'.'+extension;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('json').onclick = ()=>download(JSON.stringify(current,null,2),'application/json','json');
$('csv').onclick = ()=>{
  const rows = [['Field','Value','Unit','PDF page']];
  for (const [key,field] of Object.entries(current.metrics)) {
    if (field) rows.push([labels[key],field.value,typeof field.value === 'number' ? 'GBP' : '',field.page]);
  }
  for (const row of current.balanceBreakdown ?? []) rows.push(['Balance breakdown — '+row.label,row.value,'GBP',row.page]);
  for (const rate of current.rates) rows.push([rate.label,rate.value,'% per year',rate.page]);
  download(rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n'),'text/csv;charset=utf-8','csv');
};
