
Array.from(document.querySelectorAll('table.ipseity-data-table'))
  .forEach(table => {
    Array.from(table.querySelectorAll('thead th')).forEach((th, idx) => {
      th.addEventListener('click', makeTableSorter(table, th, idx));
    });
  })
;

function makeTableSorter (table, th, idx) {
  let sortDirection = 1;
  // parseInt() without radix is on purpose, we get 0x prefixes
  const sortFunctionsByType = {
    string: (a, b) => sortDirection * (a || '').localeCompare(b),
    int: (a, b) => {
      if (parseInt(a) < parseInt(b)) return sortDirection * -1;
      if (parseInt(a) > parseInt(b)) return sortDirection * 1;
      return 0;
    },
  };
  const sort = sortFunctionsByType[th.getAttribute('data-ipseity-sort')] || sortFunctionsByType.string;
  return () => {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'))
      .sort((a, b) => {
        const valA = a.querySelector(`td:nth-of-type(${idx + 1})`).textContent;
        const valB = b.querySelector(`td:nth-of-type(${idx + 1})`).textContent;
        return sort(valA, valB);
      })
    ;
    tbody.replaceChildren(...rows);
    sortDirection *= -1;
    console.warn(sortDirection);
  };
}
