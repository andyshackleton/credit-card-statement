const money = '(?:£\\s*)?((?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\(?:\.[0-9]{2})?)';
const date = '((?:[0-3]?\\d[ /.-](?:[01]?\\d|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[ /.-]20\\d{2}))';
const find = (pages, pattern, convert = value=>value) => {
  const fields = new Map();
  for (const [index, lines] of pages.entries()) {
    for (const line of lines) {
      const match = pattern.exec(line);
      if (!match) continue;
      const value = convert(match[1],match[2]);
      if (!fields.has(value)) fields.set(value,{value,page:index+1});
    }
  }
  return [...fields.values()];
};
const closingLabel = '(?:your )?new balance|statement balance|closing balance';
const groupedLabel = 'new transactions,? fees and charges';
const balanceFields = [
  ['Previous balance','previous (?:statement )?balance|opening balance',1,true],
  ['New spending','(?:total )?purchases|new purchases|total spending',1,true],
  ['Cash advances','(?:total )?cash (?:advances|withdrawals)',1,false],
  ['Balance transfers in','(?:total )?balance transfers in',1,false],
  ['Interest charged','interest charged(?: this (?:month|period))?|total interest(?: charged)?',1,false],
  ['Fees charged','fees charged(?: this (?:month|period))?|total fees(?: charged)?',1,false],
  ['Refunds','(?:total )?refunds',-1,false],
  ['Payments received','(?:total )?payments(?: received)?',-1,true],
  ['Statement balance',closingLabel,1,true]
];

function findBalanceAmounts(pages,pattern,direction) {
  const credit = direction < 0 ? '-?\\s*' : '';
  const suffix = direction < 0 ? 'CR' : 'DR';
  const linePattern = new RegExp('^(?:'+pattern+')\\s*[:–]?\\s*'+credit+money+'(?:\\s+'+suffix+')?$','i');
  return pages.flatMap((lines,index)=>lines.flatMap(line=>{
    const match = linePattern.exec(line);
    return match ? [{page:index+1,pence:direction*Math.round(Number(match[1].replaceAll(',',''))*100)}] : [];
  }));
}

function uniqueAmounts(fields) {
  return [...new Map(fields.map(field=>[field.pence,field])).values()];
}

function balanceBreakdown(pages, fields = balanceFields) {
  const rows = [];
  for (const [label,pattern,direction,required] of fields) {
    const matches = uniqueAmounts(findBalanceAmounts(pages,pattern,direction));
    if (matches.length > 1 || (required && matches.length === 0)) return null;
    if (matches.length) rows.push({label,...matches[0]});
  }
  const closing = rows.at(-1);
  const calculated = rows.slice(0,-1).reduce((total,row)=>total+row.pence,0);
  if (!Number.isSafeInteger(calculated) || !rows.every(row=>Number.isSafeInteger(row.pence)) || calculated !== closing.pence) return null;
  return rows.map(({label,page,pence})=>({label,page,value:pence/100}));
}

export function parseStatement(pages) {
  const wrappedAmount = new RegExp('^(?:'+balanceFields.map(field => field[1]).join('|')+'|'+groupedLabel+'|(?:your )?credit limit|available to spend|available credit|minimum payment(?: due|required| amount)?|next month[\x27’]s estimated interest)\\s*[:–-]?$', 'i');
  const amountOnly = new RegExp('^£\\s*'+money+'(?:\\s+(?:DR|CR))?$', 'i');
  pages = pages.map(lines => lines.flatMap((line,index) =>
    wrappedAmount.test(line) && amountOnly.test(lines[index+1] ?? '')
      ? [line,line+' '+lines[index+1]] : [line]));
  const conflicts = [];
  const unique = (key,fields) => {
    if (fields.length > 1) conflicts.push(key);
    return fields.length === 1 ? fields[0] : null;
  };
  const amount = (key,labels) => unique(key,find(pages,
    new RegExp('^(?:'+labels+')\\s*[:–-]?\\s*'+money+'(?:\\s+(DR|CR))?$','i'),
    (value,sign)=>Number(value.replaceAll(',',''))*(sign?.toUpperCase() === 'CR' ? -1 : 1)));
  const dated = (key,labels) => unique(key,find(pages,new RegExp('^(?:'+labels+')\\s*[:–-]?\\s*'+date+'$','i')));
  const metrics = {
    balance:amount('balance',closingLabel+'|total balance|outstanding balance'),
    creditLimit:amount('creditLimit','(?:your )?credit limit'),
    availableCredit:amount('availableCredit','(?:your )?available to spend|(?:your )?available credit(?: to spend)?'),
    estimatedInterest:amount('estimatedInterest',"next month['’]s estimated interest|estimated interest(?: next month)?"),
    interest:amount('interest','interest charged(?: this (?:month|period))?|total interest(?: charged)?|interest this (?:month|period)'),
    fees:amount('fees','fees charged(?: this (?:month|period))?|total fees(?: charged)?'),
    minimum:amount('minimum','minimum payment(?: due|required| amount)?'),
    due:dated('due','payment due(?: date| by)?|minimum payment due(?: date| by)?|payment to reach us by|to reach your account by'),
    statementDate:dated('statementDate','statement date|date of statement'),
    promoEnd:dated('promoEnd','(?:0%|promotional|promo)(?: interest)?(?: rate| offer)? (?:ends|end date|expiry date)')
  };
  const rateLabels = {
    Purchases:'purchase(?:s)?|(?:standard )?purchase interest rate',
    'Balance transfer':'balance transfers?(?: and money transfers)?(?: interest rate)?',
    'Cash advances':'cash(?: advances?| withdrawals?| transactions)(?: interest rate)?',
    'Default fees':'default fees',
  };
  const percentage = '(\\d{1,2}(?:\\.\\d{1,4})?)\\s*%\\s*(?:p\\.?a\\.?|per annum|annual|a year)';
  const rates = Object.entries(rateLabels).flatMap(([label,pattern])=>{
    const labelFirst = new RegExp('^(?:'+pattern+')\\s*[:–-]?\\s*'+percentage+'$', 'i');
    const rateFirst = new RegExp('^'+percentage+'(?:\\s*\\(variable\\))?\\s+for\\s+(?:'+pattern+')(?:\\s*\\((effective|simple) rate\\))?$', 'i');
    const found = new Map();
    for (const [index,lines] of pages.entries()) {
      for (const [row,line] of lines.entries()) {
        const continuation = /^\((effective|simple) rate\)$/i.test(lines[row+1] ?? '');
        const match = (continuation && rateFirst.exec(line+' '+lines[row+1])) || rateFirst.exec(line) || labelFirst.exec(line);
        if (!match) continue;
        const value = Number(match[1]);
        const basis = match[2]?.toLowerCase();
        const key = value+':'+(basis ?? '');
        if (!found.has(key)) found.set(key,{label,value,page:index+1,...(basis && {basis})});
      }
    }
    const explicit = new Set([...found.values()].filter(rate => rate.basis).map(rate => rate.value));
    const distinct = [...found.values()].filter(rate => rate.basis || !explicit.has(rate.value));
    if (distinct.length > 1 && label !== 'Default fees' && !conflicts.includes('rates')) conflicts.push('rates');
    return distinct;
  });
  const opening = uniqueAmounts(findBalanceAmounts(pages,balanceFields[0][1],1));
  if (opening.length > 1) conflicts.push('opening');
  const closing = uniqueAmounts(findBalanceAmounts(pages,balanceFields.at(-1)[1],1));
  const matchesClosing = metrics.balance && closing.length === 1 && metrics.balance.value === closing[0].pence/100;
  const balanceChange = opening.length === 1 && matchesClosing &&
    Number.isSafeInteger(opening[0].pence) && Number.isSafeInteger(closing[0].pence)
    ? (closing[0].pence-opening[0].pence)/100 : null;
  const payments = uniqueAmounts(findBalanceAmounts(pages,balanceFields.at(-2)[1],-1));
  if (payments.length > 1) conflicts.push('payment');
  const payment = payments.length === 1 && Number.isSafeInteger(payments[0].pence)
    ? {value:-payments[0].pence/100,page:payments[0].page} : null;
  metrics.previousBalance = opening.length === 1 ? {value:opening[0].pence/100,page:opening[0].page} : null;
  metrics.paymentsReceived = payment;
  metrics.groupedCharges = amount('groupedCharges',groupedLabel);
  if (!metrics.availableCredit && !conflicts.includes('availableCredit') && metrics.creditLimit?.value > 0 && metrics.balance) {
    metrics.availableCredit = {
      value:Math.round((metrics.creditLimit.value - metrics.balance.value)*100)/100,
      derived:true,
    };
  }
  return {metrics,rates,payment,conflicts,balanceChange,balanceBreakdown:matchesClosing ? balanceBreakdown(pages) ?? balanceBreakdown(pages,[
    balanceFields[0],['New transactions, fees and charges',groupedLabel,1,true],...balanceFields.slice(-2)
  ]) : null};
}
export function pageLines(items) {
  const rows = [];
  for (const item of items) {
    if (!item.str?.trim() || !item.transform) continue;
    const [, , , , x, y] = item.transform;
    const row = rows.find(candidate=>Math.abs(candidate.y-y)<2);
    if (row) row.items.push({x,width:item.width || 0,text:item.str.trim()});
    else rows.push({y,items:[{x,width:item.width || 0,text:item.str.trim()}]});
  }
  return rows.sort((a,b)=>b.y-a.y).flatMap(({items})=>{
    items.sort((a,b)=>a.x-b.x);
    const columns = [[]];
    items.forEach((item,index)=>{
      const previous = items[index-1];
      if (previous?.width && item.x-previous.x-previous.width >= 32) columns.push([]);
      columns.at(-1).push(item.text);
    });
    const clean = parts=>parts.join(' ').replace(/\s+/g,' ').trim();
    return [...new Set([clean(columns.flat()),...columns.map(clean)])];
  });
}
