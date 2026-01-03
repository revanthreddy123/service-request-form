import { ref, get, set } from "firebase/database";
import { db } from "./firebase";

/* ================= KEY SANITIZER ================= */
function keyify(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[.#$/[\]]/g, "");
}

/* ================= REMOVE UNDEFINED ================= */
function removeUndefined(obj) {
  if (Array.isArray(obj)) return obj.map(removeUndefined);

  if (obj && typeof obj === "object") {
    const clean = {};
    Object.keys(obj).forEach((k) => {
      if (obj[k] !== undefined) clean[k] = removeUndefined(obj[k]);
    });
    return clean;
  }

  return obj;
}

/* ================= FETCH SAVED RATES ================= */
export async function fetchRatesFromDB(location) {
  if (!location) return {};

  try {
    const locKey = keyify(location);
    const snap = await get(ref(db, `rates/${locKey}`));
    return snap.exists() ? snap.val() : {};
  } catch (err) {
    console.error("Fetch rates error:", err);
    return {};
  }
}

/* ================= SAVE / UPDATE RATE ================= */
export async function saveRateToDB(location, item, rate) {
  if (!location || !item) return;

  try {
    const locKey = keyify(location);
    const itemKey = keyify(item);

    await set(ref(db, `rates/${locKey}/${itemKey}`), Number(rate));
    console.log("Rate saved:", locKey, itemKey, rate);
  } catch (err) {
    console.error("Save rate error:", err);
  }
}

/* ================= HELPER ================= */
export function calculateAmount(qty, rate) {
  return +(Number(qty || 0) * Number(rate || 0)).toFixed(2);
}

/* ================= SAVE BILL ================= */
export async function saveBill(bill) {
  if (!bill || !bill.invoiceMeta || !bill.location) {
    throw new Error("Missing bill data");
  }

  const dateKey = bill.invoiceMeta.invoiceDate
    .split("/")
    .reverse()
    .join("-");

  const locKey = keyify(bill.location);
  const billKey = bill.invoiceMeta.invoiceNo;

  const cleanBill = removeUndefined({
    company: bill.company || "",
    items: bill.items || [],
    invoiceMeta: bill.invoiceMeta,
    location: bill.location,
    total: Number(bill.total || 0),
    createdAt: Date.now(),
  });

  console.log("Saving bill:", `bills/${dateKey}/${locKey}/${billKey}`, cleanBill);

  await set(ref(db, `bills/${dateKey}/${locKey}/${billKey}`), cleanBill);

  console.log("Bill saved successfully");
}

/* ================= LOAD SINGLE BILL ================= */
export async function loadBill(date, location, invoiceNo) {
  const locKey = keyify(location);
  const path = `bills/${date}/${locKey}/${invoiceNo}`;

  try {
    const snap = await get(ref(db, path));
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    console.error("Load bill error:", err);
    return null;
  }
}

/* ================= LIST BILLS ================= */
export async function listBills(date, location) {
  const locKey = keyify(location);

  try {
    const snap = await get(ref(db, `bills/${date}/${locKey}`));
    return snap.exists() ? snap.val() : {};
  } catch (err) {
    console.error("List bills error:", err);
    return {};
  }
}
