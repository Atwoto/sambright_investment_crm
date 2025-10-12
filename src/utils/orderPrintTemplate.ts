// Utility to generate printable HTML for an order using a letterhead
// resembling the provided Sambright Investment Limited design.

export interface PrintableOrderItem {
  productName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PrintableOrder {
  orderNumber: string;
  type: string; // quote | sale | invoice
  clientName: string;
  clientEmail: string;
  items: PrintableOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  dateCreated: string; // ISO date
  dueDate?: string; // ISO date
  notes?: string;
}

// You can tweak these to customize the header text without touching code elsewhere
export const COMPANY = {
  name: "SAMBRIGHT INVESTMENT LIMITED",
  addressLine: "Thika Road, Ruiru, Kiambu District",
  phone: "+254 708 783 091",
  email: "sambrightlimited@gmail.com",
  watermarkText: "SIL",
};

export function createOrderLetterheadHTML(order: PrintableOrder) {
  const safe = (s: string) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const formatKsh = (amount: number) =>
    `KSh ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  const itemsRows = order.items
    .map(
      (item) => `
      <tr>
        <td>${safe(item.productName)}</td>
        <td>${safe(item.productType)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatKsh(item.unitPrice)}</td>
        <td class="num">${formatKsh(item.totalPrice)}</td>
      </tr>
  `
    )
    .join("");

  const typeTitle = order.type.charAt(0).toUpperCase() + order.type.slice(1);
  const statusTitle =
    order.status.charAt(0).toUpperCase() + order.status.slice(1);

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safe(order.orderNumber)} - ${COMPANY.name}</title>
    <style>
      :root{
        --blue: #20b6f2; /* header blue */
        --blue-dark: #12a0d8;
        --text: #222;
        --muted: #667085;
        --border: #e5e7eb;
        --bg: #ffffff;
      }
      *{ box-sizing: border-box; }
      html,body{ margin:0; padding:0; background:var(--bg); color:var(--text); font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      .page{ position:relative; padding:24px 28px 40px; min-height:100vh; }
      /* Letterhead header */
      .lh-header{ position:relative; padding-top:6px; }
      /* optional accent line (disabled to match screenshot) */
      .brand-line{ height:0; }
      .brand-row{ display:flex; align-items:center; gap:12px; }
      .logo-circle{ width:56px; height:56px; border-radius:999px; background: radial-gradient(circle at 30% 30%, #e6f7fe, #bfeeff); display:grid; place-items:center; border:2px solid var(--blue); color:var(--blue-dark); font-weight:800; font-size:20px; }
      .title{ font-weight:800; letter-spacing:.5px; color:var(--blue-dark); font-size:22px; }
      .contact{ color:#000; margin-top:2px; font-size:12px; }
      .contact .muted{ color:#111; }
      /* Watermark */
      .watermark{ position:absolute; left:0; right:0; top:55%; transform:translateY(-50%); display:grid; place-items:center; pointer-events:none; }
      .watermark span{ font-weight:900; font-size:220px; color:#0ea5e910; letter-spacing:6px; }
      /* Content */
      .section{ margin-top:22px; }
      .two-col{ display:flex; gap:24px; justify-content:space-between; }
      .col{ flex:1; }
      h3{ margin:0 0 8px; font-size:14px; color:#0f172a; }
      .box{ background:#f8fafc; border:1px solid var(--border); border-radius:8px; padding:12px; }
      table{ width:100%; border-collapse: collapse; margin-top:10px; }
      th, td{ border:1px solid var(--border); padding:10px; text-align:left; background:#fff; }
      th{ background:#f1f5f9; font-size:12px; }
      td{ font-size:12px; }
      .num{ text-align:right; white-space:nowrap; }
      .totals{ width:260px; margin-left:auto; margin-top:12px; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
      .totals-row{ display:flex; justify-content:space-between; padding:10px 12px; background:#fff; border-top:1px solid var(--border); }
      .totals-row.header{ background:#f8fafc; font-weight:600; }
      .totals-row.total{ font-weight:800; color:#15803d; }
      .notes{ margin-top:16px; }
      .footer-bar{ display:none; }
      @media print{
        .page{ padding:16mm 14mm 20mm; }
        .footer-bar{ position:fixed; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="lh-header">
        <div class="brand-row">
          <div class="logo-circle">SIL</div>
          <div>
            <div class="title">${COMPANY.name}</div>
            <div class="contact">
              ${COMPANY.addressLine}, Tel: <span class="muted">${
    COMPANY.phone
  }</span><br/>
              Email: <span class="muted">${COMPANY.email}</span>
            </div>
          </div>
        </div>
        <div class="brand-line"></div>
      </div>

      <div class="watermark"><span>${COMPANY.watermarkText}</span></div>

      <div class="section two-col">
        <div class="col box">
          <h3>Bill To</h3>
          <div><strong>${safe(order.clientName)}</strong></div>
          <div>${safe(order.clientEmail)}</div>
        </div>
        <div class="col box">
          <h3>${safe(typeTitle)} Details</h3>
          <div><strong>${safe(order.orderNumber)}</strong></div>
          <div>Date: ${new Date(order.dateCreated).toLocaleDateString()}</div>
          ${
            order.dueDate
              ? `<div>Due: ${new Date(
                  order.dueDate
                ).toLocaleDateString()}</div>`
              : ""
          }
          <div>Status: ${safe(statusTitle)}</div>
        </div>
      </div>

      <div class="section">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th class="num">Qty</th>
              <th class="num">Unit Price</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row header"><span>Summary</span><span></span></div>
          <div class="totals-row"><span>Subtotal</span><span>${formatKsh(
            order.subtotal
          )}</span></div>
          <div class="totals-row"><span>Tax</span><span>${formatKsh(
            order.tax
          )}</span></div>
          <div class="totals-row total"><span>Total</span><span>${formatKsh(
            order.total
          )}</span></div>
        </div>

        ${
          order.notes
            ? `<div class="notes box"><h3>Notes</h3><div>${safe(
                order.notes
              )}</div></div>`
            : ""
        }
      </div>

      <div class="footer-bar"></div>
    </div>
  </body>
  </html>`;
}
