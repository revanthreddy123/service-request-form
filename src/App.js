import React, { useState, useEffect } from "react";
import "./App.css";
import * as XLSX from "xlsx";
import { generateInvoicePDF } from "./pdfutilis";

import {
  fetchRatesFromDB,
  saveRateToDB,
  calculateAmount,
  saveBill,
  loadBill,
  listBills
} from "./rateUtils";


export default function App() {
  // --- Invoice No generation based on a Date object ---
  function generateInvoiceNoFromDate(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    return `GME${day}${month}`;
  }

  function formatDateDDMMYYYY(d) {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const [headerType, setHeaderType] = useState("gummam");

  const today = new Date();

  // workbook is stored so user can pick a sheet after upload
  const [workbook, setWorkbook] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [savedBills, setSavedBills] = useState({});


  const [rows, setRows] = useState([]);
  const [locationCols, setLocationCols] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  // items list (qty comes from excel; rate is editable and saved per-location)
  const [items, setItems] = useState([]);
  

  const [driveLink, setDriveLink] = useState(
  "https://docs.google.com/spreadsheets/d/16BXUubvS5PD-JWrq4I_fUxycqGpGSDiWk1QaRW5XglI/edit?usp=sharing"
);


  const [invoiceMeta, setInvoiceMeta] = useState({
    billTo: "",
    invoiceNo: generateInvoiceNoFromDate(today),
    invoiceDate: formatDateDDMMYYYY(today),
  });



useEffect(() => {
  fetchSavedBills();
}, [selectedLocation, invoiceMeta.invoiceDate]);

  // Load saved Bill To when location changes
  useEffect(() => {
    if (!selectedLocation) return;
    try {
      const mem = JSON.parse(localStorage.getItem("billToMemory") || "{}");
      if (mem && mem[selectedLocation]) {
        setInvoiceMeta((prev) => ({ ...prev, billTo: mem[selectedLocation] }));
      } else {
        // clear billTo if not saved for this location
        setInvoiceMeta((prev) => ({ ...prev, billTo: "" }));
      }
    } catch (e) {
      console.warn("failed to read billToMemory", e);
    }
  }, [selectedLocation]);

  // --- File upload: read workbook and show sheet list ---
  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: "array" });
      setWorkbook(wb);
      setSheets(wb.SheetNames || []);
      setSelectedSheet(wb.SheetNames && wb.SheetNames[0] ? wb.SheetNames[0] : "");

      // reset previous state
      setRows([]);
      setLocationCols([]);
      setSelectedLocation("");
      setItems([]);

      // auto-load first sheet
      const sheetName = wb.SheetNames && wb.SheetNames[0];
      if (sheetName) {
        const sheet = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        setRows(json);
        detectLocationsAndExtract(json);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  // --- Google Drive sheet loader ---
  async function handleDriveSheetLink(link) {
    if (!link) return;

    // extract file id and gid
    const fileMatch = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const gidMatch = link.match(/[?&]gid=(\d+)/);
    if (!fileMatch) {
      alert("Invalid Google Sheets link");
      return;
    }
    const fileId = fileMatch[1];
    const gid = gidMatch ? gidMatch[1] : "";

    const url = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx${gid ? `&gid=${gid}` : ""}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        alert("Unable to fetch sheet — make sure the sheet is public (Anyone with link can view)");
        return;
      }
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      setWorkbook(wb);
      setSheets(wb.SheetNames || []);
      setSelectedSheet(wb.SheetNames && wb.SheetNames[0] ? wb.SheetNames[0] : "");

      const sheetName = wb.SheetNames && wb.SheetNames[0];
      if (sheetName) {
        const sheet = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        setRows(json);
        detectLocationsAndExtract(json);
      }

      setDriveLink("");
    } catch (err) {
      console.error(err);
      alert("Failed to load sheet from Google Drive");
    }
  }

  async function fetchSavedBills() {
  if (!selectedLocation || !invoiceMeta.invoiceDate) return;

  const dateKey = invoiceMeta.invoiceDate.split("/").reverse().join("-");
  const data = await listBills(dateKey, selectedLocation);
  setSavedBills(data || {});
}




  function detectLocationsAndExtract(json) {
    const cols = Object.keys(json[0] || {});
    const locs = cols.filter(
      (c) =>
        c &&
        !["S.No", "S.No.", "S No", "Items", "Item", "Total", "Description"].includes(c) &&
        !c.toLowerCase().includes("unnamed")
    );

    setLocationCols(locs);
    const initialLoc = locs.includes("meil") ? "meil" : locs[0] || "";
    setSelectedLocation(initialLoc);

    if (initialLoc) extractForLocation(initialLoc, json);
  }

  // --- When user selects a sheet, parse it into rows and detect location columns ---
  function loadSheet(sheetName) {
    if (!workbook || !sheetName) return;
    setSelectedSheet(sheetName);

    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!json || json.length === 0) {
      alert("No data found in the selected sheet.");
      setRows([]);
      setLocationCols([]);
      setItems([]);
      return;
    }

    setRows(json);
    detectLocationsAndExtract(json);
  }

  // extractForLocation optionally accepts rowsToUse (avoid setState race)
async function extractForLocation(loc, rowsToUse = null) {
  if (!loc) {
    setItems([]);
    setSelectedLocation("");
    return;
  }

  const source = rowsToUse || rows || [];

  // ✅ Firebase fetch
  const saved = await fetchRatesFromDB(loc);

  const filtered = [];

  source.forEach((r) => {
    const itemName = r["Items"] || r["Item"] || Object.values(r)[1] || "";
    let qty = r[loc];
    qty = qty === "" || qty == null ? 0 : Number(qty);

    if (!isNaN(qty) && qty > 0) {
      const savedRate = saved[
  itemName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[.#$/[\]]/g, "")
];

      filtered.push({
        sno: filtered.length + 1,
        item: itemName,
        qty,
        rate: savedRate ?? "",
        amount: calculateAmount(qty, savedRate ?? 0),
      });
    }
  });

  setItems(filtered);
  setSelectedLocation(loc);
}



function handleRateChange(i, val) {
  const updated = [...items];
  const rate = Number(val) || 0;

  updated[i].rate = rate;
  updated[i].amount = calculateAmount(updated[i].qty, rate);
  setItems(updated);

  const itemName = updated[i].item?.trim();
  const location = selectedLocation;

  if (itemName && location) {
    saveRateToDB(location, itemName, rate);
  }
}


function handleQtyChange(i, val) {
  const updated = [...items];
  const qty = Number(val) || 0;

  updated[i].qty = qty;
  updated[i].amount = calculateAmount(qty, updated[i].rate);

  setItems(updated);
}


  function grandTotal() {
    return items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  }

  // --- MISSING FUNCTIONS ADDED ---
async function handleDescChange(i, val) {
  const updated = [...items];
  updated[i].item = val;
  setItems(updated);

  const location = selectedLocation;
  const rate = updated[i].rate || 0;
  const itemName = val.trim();

  if (itemName && location && rate > 0) {
    await saveRateToDB(location, itemName, rate);
  }
}

  function removeItem(i) {
    const updated = items.filter((_, idx) => idx !== i);
    setItems(updated.map((it, idx) => ({ ...it, sno: idx + 1 })));
  }

  function addExtraItem() {
    const updated = [...items];
    updated.push({ sno: updated.length + 1, item: "", qty: 0, rate: 0, amount: 0 });
    setItems(updated);
  }


function generatePDF() {
  generateInvoicePDF({
    items,
    invoiceMeta,
    selectedLocation,
    grandTotal: grandTotal(),
    headerType,
  });
}




  return (
    <div className="container" style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2>Invoice Generator — Gummam Organic Farms</h2>

      <div className="section">
        <label style={{ fontWeight: 600 }}>Upload Excel file</label>
        <div style={{ marginTop: 8 }}>
          <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ fontWeight: 600 }}>Or paste Google Sheets link</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              type="text"
              placeholder="Paste google drive link here"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
            
          </div>
          <button onClick={() => handleDriveSheetLink(driveLink)}>Load</button>
        </div>
      </div>

      {sheets.length > 0 && (
        <div className="section">
          <label style={{ fontWeight: 600, marginRight: 8 }}>Select Sheet:</label>
          <select value={selectedSheet} onChange={(e) => loadSheet(e.target.value)}>
            <option value="">-- choose sheet --</option>
            {sheets.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {locationCols.length > 0 && (
        <div className="section">
          <label style={{ fontWeight: 600, marginRight: 8 }}>Select Company:</label>
          <select
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              extractForLocation(e.target.value);
            }}
          >
            <option value="">-- choose location --</option>
            {locationCols.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {items.length > 0 && (
        <div className="section">
          {/* --- BILL TO FIELD --- */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ marginRight: 8, fontWeight: 600 }}>Bill To:</label>
            <input
              value={invoiceMeta.billTo}
              onChange={(e) => {
                // save Bill To per selected location
                const mem = JSON.parse(localStorage.getItem("billToMemory") || "{}");
                mem[selectedLocation] = e.target.value;
                localStorage.setItem("billToMemory", JSON.stringify(mem));

                setInvoiceMeta({
                  ...invoiceMeta,
                  billTo: e.target.value,
                });
              }}
              placeholder="Customer name / company"
            />
          </div>

          {/* --- INVOICE NO & DATE --- */}
          <div style={{ marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
            <div>
              <label style={{ fontWeight: 600, marginRight: 8 }}>Invoice No:</label>
              <input
                value={invoiceMeta.invoiceNo}
                onChange={(e) =>
                  setInvoiceMeta({
                    ...invoiceMeta,
                    invoiceNo: e.target.value,
                  })
                }
              />
            </div>

            {Object.keys(savedBills).length > 0 && (
  <div style={{ marginTop: 10 }}>
    <label style={{ fontWeight: 600 }}>Load Saved Bill:</label>
    <select
      onChange={async (e) => {
        const bill = await loadBill(
          invoiceMeta.invoiceDate.split("/").reverse().join("-"),
          selectedLocation,
          e.target.value
        );

        if (bill) {
          setItems(bill.items || []);
          setInvoiceMeta(bill.invoiceMeta || invoiceMeta);
        }
      }}
    >
      <option value="">-- Select Invoice --</option>
      {Object.keys(savedBills).map((inv) => (
        <option key={inv} value={inv}>
          {inv}
        </option>
      ))}
    </select>
  </div>
)}


            <div>
              <label style={{ fontWeight: 600, margin: "0 8px" }}>Date:</label>
              <input
                value={invoiceMeta.invoiceDate}
                onChange={(e) => {
                  const dateStr = e.target.value;
                  const parts = dateStr.split("/"); // dd/mm/yyyy expected
                  let newInvoiceNo = invoiceMeta.invoiceNo;

                  if (parts.length >= 2) {
                    const day = parts[0].padStart(2, "0");
                    const month = parts[1].padStart(2, "0");
                    newInvoiceNo = `GME${day}${month}`;
                  }

                  setInvoiceMeta({
                    ...invoiceMeta,
                    invoiceDate: dateStr,
                    invoiceNo: newInvoiceNo,
                  });
                }}
              />
            </div>
          </div>

          <h3>Enter Rates</h3>
          <div className="table-wrapper">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
  <thead>
    <tr>
      <th style={{ border: "1px solid #000", padding: 6 }}>S.No</th>
      <th style={{ border: "1px solid #000", padding: 6 }}>Description</th>
      <th style={{ border: "1px solid #000", padding: 6 }}>Qty</th>
      <th style={{ border: "1px solid #000", padding: 6 }}>Rate</th>
      <th style={{ border: "1px solid #000", padding: 6 }}>Amount</th>
      <th style={{ border: "1px solid #000", padding: 6 }}>Actions</th>
    </tr>
  </thead>

  <tbody>
    {items.map((it, i) => (
      <tr key={i}>
        <td style={{ border: "1px solid #000", padding: 6, width: 50 }}>{i + 1}</td>

        {/* Editable description */}
        <td style={{ border: "1px solid #000", padding: 6 }}>
          <input
            type="text"
            value={it.item}
            onChange={(e) => handleDescChange(i, e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: 4 }}
          />
        </td>

        {/* Qty editable */}
        <td style={{ border: "1px solid #000", padding: 6, width: 110 }}>
          <input
            type="number"
            value={it.qty}
            onChange={(e) => handleQtyChange(i, e.target.value)}
            style={{ width: 80 }}
            min="0"
          />
        </td>

        {/* Rate editable */}
        <td style={{ border: "1px solid #000", padding: 6, width: 130 }}>
          <input
            type="number"
            value={it.rate}
            onChange={(e) => handleRateChange(i, e.target.value)}
            style={{ width: 100 }}
            min="0"
          />
        </td>

        {/* Amount (calculated) */}
        <td style={{ border: "1px solid #000", padding: 6, textAlign: "right", width: 120 }}>
          ₹ {Number(it.amount || 0).toFixed(2)}
        </td>

        {/* Actions: delete button */}
        <td style={{ border: "1px solid #000", padding: 6, textAlign: "center", width: 100 }}>
          <button onClick={() => removeItem(i)} style={{ padding: "6px 8px" }}>
            Delete
          </button>
        </td>
      </tr>
    ))}

    {/* Full-width Add Extra Item row */}
    <tr>
      <td
        colSpan={6}
        onClick={addExtraItem}
        style={{
          border: "1px solid #000",
          padding: 10,
          textAlign: "center",
          background: "#f7f7f7",
          cursor: "pointer",
          fontWeight: "700",
          userSelect: "none",
        }}
      >
        + Add Extra Item
      </td>
    </tr>
  </tbody>
</table>

          </div>

          <div style={{ marginTop: 12, textAlign: "right" }}>
            <strong>Grand Total:</strong> ₹ {grandTotal().toFixed(2)}
          </div>

          <div style={{ marginTop: 12 }}>
            <button
                onClick={() => {
                  const anyNoRate = items.some((it) => it.rate === "" || Number(it.rate) === 0);
                  if (anyNoRate) {
                    const proceed = window.confirm("Some items have blank or zero rate. Continue?");
                    if (!proceed) return;
                  }
                  generatePDF();
                }}
              >
                Generate PDF
              </button>
<button
  onClick={async () => {
  const billData = {
  company: headerType,   // just save which header was used
  items,
  invoiceMeta,
  location: selectedLocation,
  total: grandTotal(),
};


    await saveBill(billData);
    alert("Bill saved successfully");
  }}
>
  Save Bill
</button>

<select value={headerType} onChange={(e) => setHeaderType(e.target.value)}>
  <option value="gummam">Gummam</option>
  <option value="freshbasket">Fresh Basket</option>
</select>


          </div>
        </div>
      )}

      {items.length === 0 && rows.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <em>No items for the selected location (or select a location above).</em>
        </div>
      )}

      <hr />
     
    </div>
  );
}
