import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "./gummam_logo.png";
import signature from "./sign.png";
import freshLogo from "./fresh_logo.png";

/* ================= HEADERS ================= */
const headers = {
  gummam: {
    logo: logo,
    name: "Gummam Organic Farms",
    address1: "Beside Cyber Towers, Opp Trident Hyderabad, T.G-500081",
    address2: "Branches: Hitech City, Bowenpally Market",
    phones: "+91 8919921561, +91 9949517613",
  },
  freshbasket: {
    logo: freshLogo,
    name: "Fresh Basket",
    address1: "Branches: Venkatgiri Jubilee Hills, Bowenpally Market",
    address2: "Fresh Vegetables & Fruits Supplier",
    phones: "+91 95424 41510",
  },
};

/* ================= PDF GENERATOR ================= */
export function generateInvoicePDF({
  items,
  invoiceMeta,
  selectedLocation,
  grandTotal,
  headerType = "gummam",
}) {
  if (!items || items.length === 0) {
    alert("No items to generate invoice.");
    return;
  }

  const selectedHeader = headers[headerType] || headers.gummam;

  const doc = new jsPDF("p", "mm", "a4");

  const pageW = 210;
  const pageH = 297;
  const paddingX = 15;
  const paddingY = 6;
  const usableW = pageW - paddingX * 2;

  const headerH = 24;
  const metaH = 12;
  const signH = 18;

  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);

  function drawStaticSections() {
    doc.rect(paddingX, paddingY, usableW, pageH - paddingY * 2);
    doc.rect(paddingX, paddingY, usableW, headerH);

    const logoW = 22;
    const logoH = 16;
    const gap = 5;
    const textBlockW = 95;

    const groupW = logoW + gap + textBlockW;
    const startX = paddingX + (usableW - groupW) / 2;
    const textX = startX + logoW + gap;

    try {
      doc.addImage(
        selectedHeader.logo,
        "PNG",
        startX,
        paddingY + (headerH - logoH) / 2,
        logoW,
        logoH
      );
    } catch {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(selectedHeader.name, textX, paddingY + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(selectedHeader.address1, textX, paddingY + 13);
    doc.text(selectedHeader.address2, textX, paddingY + 17);
    doc.text(selectedHeader.phones, textX, paddingY + 20);

    const metaTop = paddingY + headerH;
    doc.rect(paddingX, metaTop, usableW, metaH);

    const midX = paddingX + usableW / 2;
    doc.line(midX, metaTop, midX, metaTop + metaH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Bill To:", paddingX + 4, metaTop + 5);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceMeta.billTo || "", paddingX + 4, metaTop + 9);

    doc.setFont("helvetica", "bold");
    doc.text("Invoice No:", midX + 4, metaTop + 5);
    doc.setTextColor(255, 0, 0);
    doc.text(invoiceMeta.invoiceNo, midX + 28, metaTop + 5);
    doc.setTextColor(0);

    doc.text("Date:", midX + 4, metaTop + 9);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceMeta.invoiceDate, midX + 28, metaTop + 9);

    const signTop = pageH - paddingY - signH;
    doc.rect(paddingX, signTop, usableW, signH);

    const signMidX = paddingX + usableW / 2;
    doc.line(signMidX, signTop, signMidX, signTop + signH);

    doc.setFontSize(8.5);
    doc.text("Receiver Stamp & Signature", paddingX + 4, signTop + 12);

    try {
      doc.addImage(
        signature,
        "PNG",
        paddingX + usableW - 44,
        signTop + 3,
        36,
        12
      );
    } catch {}

    doc.text("Authorised Signatory", paddingX + usableW - 4, signTop + 14, {
      align: "right",
    });

    return {
      bodyStartY: metaTop + metaH,
      bodyEndY: signTop - 2,
    };
  }

  // First page
  const bodyLimits = drawStaticSections();

 const snoW = 15;
const rightColsW = 90; // 15mm × 3 (Qty, Rate, Amount)
const itemsW = usableW - snoW - rightColsW;

autoTable(doc, {
  startY: bodyLimits.bodyStartY,

 margin: {
  left: paddingX,
  right: paddingX,
  top: paddingY,
  bottom: pageH - bodyLimits.bodyEndY,
},


  head: [["S.No", "Items", "Qty", "Rate", "Amount"]],

  body: items.map((it, i) => {
    const rate = Number(it.rate) || 0;
    const amount = Number(it.amount) || 0;
    return [
      i + 1,
      it.item,
      it.qty,
      rate.toFixed(2),
      amount.toFixed(2),
    ];
  }),

  theme: "grid",

  styles: {
    fontSize: 9,
    cellPadding: 1,
    lineWidth: 0.2,
    lineColor: [180, 180, 180], // light border
    textColor: 0,
  },

  headStyles: {
    fillColor: [240, 240, 240],
    textColor: 0,
    fontStyle: "bold",
  },

  columnStyles: {
    0: { cellWidth: snoW, halign: "center" }, // S.No
    1: { cellWidth: itemsW },                 // Items
    2: { cellWidth: 30, halign: "right" },    // Qty
    3: { cellWidth: 30, halign: "right" },    // Rate
    4: { cellWidth: 30, halign: "right" },    // Amount
  },

willDrawPage: (data) => {
  // Only set cursor position
  data.cursor.y = bodyLimits.bodyStartY;
},

didDrawPage: () => {
  // 🔑 Draw ALL borders, header, bill-to, signature ON TOP
  drawStaticSections();
},

});

  // ===== GRAND TOTAL =====
  const finalY = doc.lastAutoTable.finalY + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(
    `Grand Total: Rs. ${grandTotal.toFixed(2)}`,
    paddingX + usableW - 4,
    finalY,
    { align: "right" }
  );

  // ===== SAVE =====
  const safeDate = invoiceMeta.invoiceDate.replace(/\//g, "-");
  const safeLoc = (selectedLocation || "loc").toLowerCase();
  doc.save(`Bill_${safeLoc}_${safeDate}.pdf`);
}
