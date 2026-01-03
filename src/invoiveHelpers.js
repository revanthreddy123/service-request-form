import * as XLSX from "xlsx";

// ---------- DATE HELPERS ----------
export function generateInvoiceNoFromDate(dateObj) {
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  return `GME${day}${month}`;
}

export function formatDateDDMMYYYY(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ---------- EXCEL HELPERS ----------
export function readWorkbookFromArrayBuffer(arrayBuffer) {
  return XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
}

export function sheetToJSON(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

// ---------- LOCATION DETECTION ----------
export function detectLocations(json) {
  const cols = Object.keys(json[0] || {});
  return cols.filter(
    (c) =>
      c &&
      !["S.No", "S.No.", "S No", "Items", "Item", "Total", "Description"].includes(c) &&
      !c.toLowerCase().includes("unnamed")
  );
}

// ---------- ITEM EXTRACTION ----------
export function extractItemsForLocation(loc, rows) {
  const mem = JSON.parse(localStorage.getItem("rateMemory") || "{}");
  const savedRates = mem[loc] || {};

  const items = [];

  rows.forEach((r) => {
    const itemName = r["Items"] || r["Item"] || Object.values(r)[1] || "";
    let qty = r[loc];
    qty = qty === "" || qty == null ? 0 : Number(qty);

    if (!isNaN(qty) && qty > 0) {
      const rate = savedRates[itemName] ?? "";
      items.push({
        sno: items.length + 1,
        item: itemName,
        qty,
        rate,
        amount: +(qty * (Number(rate) || 0)).toFixed(2),
      });
    }
  });

  return items;
}
