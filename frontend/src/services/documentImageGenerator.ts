/**
 * High-Fidelity Authentic Shipping Document Image Generator
 * Produces crisp, authentic visual renderings of original Shipping Instructions (SI)
 * and Carrier Bills of Lading (B/L) with genuine typography, carrier stamps, and watermarks.
 */

import { FieldItem } from '../types/shipping';

export function generateAuthenticDocumentSvg(
  type: 'SI' | 'BL',
  company: string,
  data: Record<string, FieldItem>,
  width = 595,
  height = 842
): string {
  const isBL = type === 'BL';
  const carrierName = company || (isBL ? 'OOCL' : 'POLYPLEX');
  
  const getVal = (key: string, def = '') => data[key]?.value || def;

  const bookingNo = getVal('booking_no', '2648719001');
  const shipper = getVal('shipper', 'POLYPLEX (THAILAND) PUBLIC COMPANY LIMITED\n75/26 OCEAN TOWER II 18TH FL. SOI SUKHUMVIT 19\nBANGKOK 10110 THAILAND');
  const consignee = getVal('consignee', 'PACKAGING ADVANCED SOLUTIONS SDN. BHD.\nLOT 4521 JALAN PERSIARAN INDUSTRI\n42000 PORT KLANG SELANGOR MALAYSIA');
  const notifyParty = getVal('notify_party', 'SAME AS CONSIGNEE');
  const preCarriage = getVal('pre_carriage_by', 'WAN HAI 271 V.024E');
  const vessel = getVal('vessel', 'OOCL ROTTERDAM V.128W');
  const pol = getVal('port_of_loading', 'LAEM CHABANG, THAILAND');
  const pod = getVal('port_of_discharge', 'PORT KLANG, MALAYSIA');
  const podel = getVal('place_of_delivery', 'PORT KLANG, MALAYSIA');
  const por = getVal('place_of_receipt', 'LAEM CHABANG PORT');
  const marks = getVal('mark', 'OOLU8492015 / SEAL: OOC883921\nOOLU9104822 / SEAL: OOC883922');
  const desc = getVal('description', '2X40HQ CONTAINER SAID TO CONTAIN:\nBIAXIALLY ORIENTED POLYESTER FILM (BOPET)\nHS CODE: 3920.62.10\nFREIGHT PREPAID AS ARRANGED');
  const packages = getVal('quantity', '36 PALLETS (1,440 ROLLS)');
  const grossWeight = getVal('gross_weight', '21,450.00 KGS');
  const measurement = getVal('measurement', '58.420 CBM');

  // Format multiline text for SVG <tspan>
  const formatTspans = (text: string, x: number, startY: number, lineHeight = 13, fontSize = 9.5) => {
    const lines = text.split('\n');
    return lines
      .map(
        (line, idx) =>
          `<tspan x="${x}" y="${startY + idx * lineHeight}" font-size="${fontSize}">${escapeXml(
            line
          )}</tspan>`
      )
      .join('');
  };

  const escapeXml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const carrierBrandColor = isBL ? '#0f4c81' : '#047857';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #ffffff; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <defs>
    <style>
      .label { font-size: 6.5px; font-weight: 700; fill: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
      .val { font-size: 9px; font-weight: 600; fill: #0f172a; font-family: 'Courier New', Courier, monospace; }
      .val-bold { font-size: 9.5px; font-weight: 700; fill: #0f172a; }
      .border-line { stroke: #cbd5e1; stroke-width: 0.75; fill: none; }
      .heavy-border { stroke: #334155; stroke-width: 1.2; fill: none; }
      .watermark { font-size: 42px; font-weight: 900; fill: rgba(148, 163, 184, 0.08); letter-spacing: 6px; transform: rotate(-30deg); transform-origin: center; }
    </style>
  </defs>

  <!-- Background paper texture -->
  <rect width="${width}" height="${height}" fill="#ffffff" />
  
  <!-- Subtle Watermark -->
  <text x="297" y="450" text-anchor="middle" class="watermark">${isBL ? 'BILL OF LADING - DRAFT' : 'SHIPPING INSTRUCTION'}</text>

  <!-- Outer document border -->
  <rect x="35" y="35" width="525" height="772" class="heavy-border" />

  <!-- HEADER SECTION -->
  <rect x="35" y="35" width="525" height="55" fill="${isBL ? '#f8fafc' : '#f0fdf4'}" />
  <line x1="35" y1="90" x2="560" y2="90" class="heavy-border" />

  <!-- Header Title & Branding -->
  <text x="45" y="58" font-size="14" font-weight="900" fill="${carrierBrandColor}" letter-spacing="0.5">
    ${isBL ? `${carrierName} CONTAINER LINE` : 'MARITIME SHIPPING INSTRUCTION'}
  </text>
  <text x="45" y="74" font-size="8" font-weight="700" fill="#475569" letter-spacing="0.8">
    ${isBL ? 'NEGOTIABLE MULTIMODAL TRANSPORT BILL OF LADING' : 'EXPORT SHIPPING INSTRUCTION FORM (S.I.)'}
  </text>

  <!-- B/L or Booking Reference Box -->
  <line x1="410" y1="35" x2="410" y2="90" class="border-line" />
  <text x="418" y="50" class="label">${isBL ? 'B/L &amp; BOOKING NO.' : 'BOOKING NO.'}</text>
  <text x="418" y="70" font-size="11" font-weight="800" font-family="'Courier New', monospace" fill="#0f172a">${escapeXml(bookingNo)}</text>
  <text x="418" y="82" font-size="6.5" font-weight="600" fill="#64748b">PAGE 1 OF 1 // ORIGINAL</text>

  <!-- SHIPPER BOX (y: 90 -> 175) -->
  <rect x="35" y="90" width="280" height="85" class="border-line" />
  <text x="42" y="102" class="label">1. SHIPPER (NAME AND FULL ADDRESS)</text>
  <text class="val">${formatTspans(shipper, 42, 116, 12, 8.5)}</text>

  <!-- CONSIGNEE BOX (y: 175 -> 255) -->
  <rect x="35" y="175" width="280" height="80" class="border-line" />
  <text x="42" y="187" class="label">2. CONSIGNEE (NAME AND ADDRESS / TO ORDER)</text>
  <text class="val">${formatTspans(consignee, 42, 201, 12, 8.5)}</text>

  <!-- NOTIFY PARTY BOX (y: 255 -> 320) -->
  <rect x="35" y="255" width="280" height="65" class="border-line" />
  <text x="42" y="267" class="label">3. NOTIFY PARTY (CARRIER NOT RESPONSIBLE FOR FAILURE)</text>
  <text class="val">${formatTspans(notifyParty, 42, 281, 12, 8.5)}</text>

  <!-- RIGHT SIDE UPPER DETAILS (y: 90 -> 320) -->
  <rect x="315" y="90" width="245" height="230" fill="#fafafa" class="border-line" />
  
  <text x="325" y="105" class="label">DOCUMENTARY INSTRUCTIONS &amp; CARRIER NOTICES</text>
  <text x="325" y="120" font-size="7.5" fill="#64748b">Carrier Ref: MLT-TH-BKK-${bookingNo.slice(-6)}</text>
  <text x="325" y="133" font-size="7.5" fill="#64748b">Service Type: FCL / FCL (CY to CY)</text>
  <text x="325" y="146" font-size="7.5" fill="#64748b">Shipper Declared Value: NVD (No Value Declared)</text>

  <line x1="315" y1="160" x2="560" y2="160" class="border-line" />
  <text x="325" y="175" class="label">SPECIAL INSTRUCTIONS / CLAUSES</text>
  <text x="325" y="190" font-size="7.5" fill="#334155">• CARGO TO BE STOWED AWAY FROM HEAT</text>
  <text x="325" y="203" font-size="7.5" fill="#334155">• CLEAN ON BOARD / SHIPPED ON BOARD VESSEL</text>
  <text x="325" y="216" font-size="7.5" fill="#334155">• 14 DAYS COMBINED DETENTION / DEMURRAGE</text>
  <text x="325" y="229" font-size="7.5" fill="#334155">• SUBJECT TO CARRIER STANDARD BILL OF LADING CLAUSES</text>

  <line x1="315" y1="245" x2="560" y2="245" class="border-line" />
  <text x="325" y="260" class="label">EXPORT REFERENCES &amp; FORWARDING AGENT</text>
  <text x="325" y="275" font-size="8" font-weight="700" fill="#0f172a">MARITIME ALLIANCES CO., LTD.</text>
  <text x="325" y="287" font-size="7" fill="#64748b">BANGKOK PORT OFFICE, THAILAND</text>
  <text x="325" y="299" font-size="7" fill="#64748b">TEL: +66 2 712 9000 // EMAIL: OPS@MARITIME.CO.TH</text>

  <!-- TRANSPORT DETAILS GRID (y: 320 -> 390) -->
  <line x1="35" y1="320" x2="560" y2="320" class="heavy-border" />
  
  <!-- Row 1: Pre-carriage & Place of Receipt -->
  <line x1="210" y1="320" x2="210" y2="390" class="border-line" />
  <line x1="390" y1="320" x2="390" y2="390" class="border-line" />

  <text x="42" y="332" class="label">4. PRE-CARRIAGE BY</text>
  <text x="42" y="347" class="val-bold">${escapeXml(preCarriage)}</text>

  <text x="218" y="332" class="label">5. PLACE OF RECEIPT</text>
  <text x="218" y="347" class="val-bold">${escapeXml(por)}</text>

  <text x="398" y="332" class="label">6. OCEAN VESSEL &amp; VOYAGE</text>
  <text x="398" y="347" class="val-bold">${escapeXml(vessel)}</text>

  <!-- Row 2: Port of Loading, Discharge, Place of Delivery (y: 355 -> 390) -->
  <line x1="35" y1="355" x2="560" y2="355" class="border-line" />

  <text x="42" y="367" class="label">7. PORT OF LOADING</text>
  <text x="42" y="381" class="val-bold">${escapeXml(pol)}</text>

  <text x="218" y="367" class="label">8. PORT OF DISCHARGE</text>
  <text x="218" y="381" class="val-bold">${escapeXml(pod)}</text>

  <text x="398" y="367" class="label">9. PLACE OF DELIVERY</text>
  <text x="398" y="381" class="val-bold">${escapeXml(podel)}</text>

  <!-- PARTICULARS OF GOODS (y: 390 -> 580) -->
  <line x1="35" y1="390" x2="560" y2="390" class="heavy-border" />
  <rect x="35" y="390" width="525" height="18" fill="#f1f5f9" />
  <line x1="35" y1="408" x2="560" y2="408" class="border-line" />

  <!-- Column Dividers for Cargo Grid -->
  <line x1="175" y1="390" x2="175" y2="580" class="border-line" />
  <line x1="260" y1="390" x2="260" y2="580" class="border-line" />
  <line x1="440" y1="390" x2="440" y2="580" class="border-line" />
  <line x1="500" y1="390" x2="500" y2="580" class="border-line" />

  <!-- Cargo Table Headers -->
  <text x="42" y="402" class="label">MARKS &amp; NUMBERS / SEALS</text>
  <text x="182" y="402" class="label">PACKAGES</text>
  <text x="268" y="402" class="label">DESCRIPTION OF GOODS &amp; PACKAGES</text>
  <text x="445" y="402" class="label">GROSS WT.</text>
  <text x="506" y="402" class="label">MEASURE</text>

  <!-- Cargo Table Values -->
  <text class="val">${formatTspans(marks, 42, 425, 13, 8)}</text>
  <text class="val-bold">${formatTspans(packages, 182, 425, 13, 8)}</text>
  <text class="val">${formatTspans(desc, 268, 425, 13, 8)}</text>
  
  <text x="445" y="425" class="val-bold" font-size="8.5">${escapeXml(grossWeight)}</text>
  <text x="506" y="425" class="val-bold" font-size="8.5">${escapeXml(measurement)}</text>

  <!-- FOOTER / FREIGHT SECTION (y: 580 -> 807) -->
  <line x1="35" y1="580" x2="560" y2="580" class="heavy-border" />

  <!-- Freight Details -->
  <line x1="35" y1="620" x2="560" y2="620" class="border-line" />
  <text x="42" y="594" class="label">FREIGHT &amp; CHARGES</text>
  <text x="42" y="610" class="val-bold">FREIGHT PREPAID AS ARRANGED // OCEAN FREIGHT PAID AT ORIGIN</text>

  <line x1="270" y1="580" x2="270" y2="620" class="border-line" />
  <text x="278" y="594" class="label">TOTAL NUMBER OF CONTAINERS</text>
  <text x="278" y="610" class="val-bold">2 X 40' HIGH CUBE CONTAINERS</text>

  <line x1="430" y1="580" x2="430" y2="620" class="border-line" />
  <text x="438" y="594" class="label">MOVEMENT</text>
  <text x="438" y="610" class="val-bold">FCL / FCL</text>

  <!-- Legal & Execution Clause -->
  <text x="42" y="635" font-size="6.5" fill="#64748b">
    RECEIVED by the Carrier the Goods as specified above in apparent good order and condition unless otherwise stated.
  </text>
  <text x="42" y="645" font-size="6.5" fill="#64748b">
    One of the Bills of Lading must be surrendered duly endorsed in exchange for the Goods or delivery order.
  </text>

  <!-- Stamp & Signature Box -->
  <line x1="360" y1="655" x2="560" y2="655" class="border-line" />
  <line x1="360" y1="655" x2="360" y2="807" class="border-line" />

  <text x="42" y="675" class="label">PLACE AND DATE OF ISSUE</text>
  <text x="42" y="690" class="val-bold">BANGKOK, THAILAND // ${new Date().toLocaleDateString('en-GB')}</text>

  <text x="42" y="715" class="label">NUMBER OF ORIGINAL BS/L</text>
  <text x="42" y="730" class="val-bold">THREE (3) ORIGINALS</text>

  <!-- Carrier Official Signature & Stamp -->
  <text x="370" y="672" class="label">SIGNED FOR THE CARRIER / AGENT</text>
  <circle cx="460" cy="735" r="32" stroke="${carrierBrandColor}" stroke-width="1.5" stroke-dasharray="3,2" fill="none" opacity="0.8" />
  <text x="460" y="730" text-anchor="middle" font-size="7" font-weight="800" fill="${carrierBrandColor}">${escapeXml(carrierName)}</text>
  <text x="460" y="742" text-anchor="middle" font-size="6" font-weight="700" fill="${carrierBrandColor}">DOCUMENTATION DEPT.</text>
  <text x="460" y="752" text-anchor="middle" font-size="5.5" fill="${carrierBrandColor}">AUTHORISED SIGNATORY</text>
</svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
