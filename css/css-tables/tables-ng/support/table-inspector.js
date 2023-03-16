// Helper module for annotating tables with table dimensions.
// Helpful for debugging test failures.
// To use it:
// <script src="support/table-inspector.js">
// It will add information to title attribute of table cells,
// hovering over td's will provide useful information.

(function() {

if (window.testRunner)
  return;

// Table inspector. Annotates cells with table measures.
function measureCellMinMax(cell) {
  let d = document.createElement("div");
  let clone = cell.cloneNode(true);
  d.classList.add("measure");
  for (child of Array.from(clone.childNodes))
    d.appendChild(child);
  d.style.width = "min-content";
  document.body.appendChild(d);
  let min = d.offsetWidth;
  d.style.width = "max-content";
  let max = d.offsetWidth;
  d.remove();
  return {min: min, max: max};
}
function annotateTable(t) {
  let tableWidth = t.offsetWidth;
  let inlineBorderSpacing = parseInt(window.getComputedStyle(t).borderSpacing.split(' ')[0]);
  let spacing = inlineBorderSpacing;
  try {
    spacing += (t.querySelector("tr").querySelectorAll("td").length - 1)*inlineBorderSpacing;
  } catch(err) {
  };
  t.setAttribute("title", `Table: ${tableWidth.toFixed(0)} spacing: ${spacing}px`);
  let firstCell;
  let totalCellPercent = 0;
  let nonPercentCellMinWidth = 0;
  let nonPercentCellMaxWidth = 0;
  let tableMaxWidthByCellPercent = 0;
  // Spacing assumes column count specified by the 1st row. Assumption might be wrong.
  let cells = Array.from(t.querySelectorAll("td"));
  for (let cell of cells) {
    if (!firstCell)
      firstCell = cell;
    let percent = cell.offsetWidth / (tableWidth - spacing) * 100;
    let minmax = measureCellMinMax(cell);
    let title = `${cell.offsetWidth.toFixed(1)}px\nmin:${minmax.min}px max:${minmax.max}px ${percent.toFixed(1)}%`;
    let cssWidth = cell.style.width;
    let is_percent = cssWidth && cssWidth.match(/\%/);
    if (is_percent) {
      let w = parseFloat(cssWidth);
      totalCellPercent += w;
      let tableMaxWidth = minmax.max / (w / 100);
      tableMaxWidthByCellPercent = Math.max(tableMaxWidthByCellPercent, tableMaxWidth);
      title += `\nmin table: ${tableMaxWidth.toFixed(0)}px`;
    } else {
      nonPercentCellMinWidth += minmax.min;
      nonPercentCellMaxWidth += minmax.max;
    }
    title += `\nTable: ${tableWidth.toFixed(0)} spacing: ${spacing}px`;
    cell.setAttribute("title", title);
  }


  // Display table statistics in first cell.
  if (firstCell) {
    let title = firstCell.getAttribute("title");
    let ruleMatch = 0;
    if (tableMaxWidthByCellPercent != 0) {
      if ((tableMaxWidthByCellPercent + spacing) == tableWidth)
        ruleMatch += 1;
      title += `\nTable by rule 1 min : ${tableMaxWidthByCellPercent.toFixed(1)}`;
    } else {
      title += "\nTable min by single cell percent NA";
    }
    if (totalCellPercent > 0) {
      totalCellPercent = Math.min(totalCellPercent, 100);
      let minByCellPercent
    }
    if (nonPercentCellMinWidth && totalCellPercent > 0) {
      totalCellPercent = Math.min(totalCellPercent, 100);
      title += `\nsum%: ${totalCellPercent.toFixed(1)}%; non% min: ${nonPercentCellMinWidth}px; non% max ${nonPercentCellMaxWidth}px`;
      let tableMinBySum = (totalCellPercent / (100 - totalCellPercent) +1) * nonPercentCellMinWidth;
      let tableMaxBySum = (totalCellPercent / (100 - totalCellPercent) +1) * nonPercentCellMaxWidth;
      if (Math.floor((tableMinBySum + spacing)) == Math.floor(tableWidth) ||
        Math.floor((tableMaxBySum + spacing)) == Math.floor(tableWidth))
        ruleMatch += 2;
      title += `\nTable by rule 2 max:${tableMaxBySum.toFixed(1)}px;`;
    } else {
      "Table min by % sum not available";
    }
    firstCell.setAttribute("title", title);
    switch(ruleMatch) {
      case 1: t.classList.toggle('rule1'); break;
      case 2: t.classList.toggle('rule2'); break;
      case 3: t.classList.toggle('rule1and2'); break;
      default: break;
    }
  }
}


window.addEventListener("load", _ => {
  let s = document.createElement("style");
  s.setAttribute("title", "table-inpector");
  s.innerText = ".rule1 { background: #87dc8a; } .rule2 { background: #3ae4cc; } .rule1and2 { background: #fda4a4; }";
  document.querySelector("head").appendChild(s);
  for (let t of Array.from(document.querySelectorAll("table")))
    annotateTable(t);
});

})();
