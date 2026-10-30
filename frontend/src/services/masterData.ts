/**
 * Master Data Loader and Search Engine
 * Handles HS Code Master, Port Freetime Records, and Customer Profiles
 */

import { CustomerRecord, FreetimeRecord, HSCodeRecord } from '../types/shipping';

let hsCodeCache: HSCodeRecord[] | null = null;
let freetimeCache: FreetimeRecord[] | null = null;

/**
 * Load HS Code database from public/HS_Master.csv
 */
export async function loadHSCodes(): Promise<HSCodeRecord[]> {
  if (hsCodeCache) return hsCodeCache;

  try {
    const res = await fetch('/HS_Master.csv');
    if (!res.ok) throw new Error('Failed to load HS_Master.csv');
    const text = await res.text();
    const lines = text.split('\n');
    const records: HSCodeRecord[] = [];

    // Header: Sales,Customer Name,Commodity,HS Code
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV with commas inside quotes
      const row = parseCsvRow(line);
      if (row.length >= 4) {
        const sales = row[0]?.trim();
        const customerName = row[1]?.trim();
        const commodity = row[2]?.trim();
        const hsCode = row[3]?.trim();

        if (customerName || commodity || hsCode) {
          records.push({
            id: i,
            sales: sales || 'OPS',
            customerName: customerName || '-',
            commodity: commodity || '-',
            hsCode: hsCode || '-',
          });
        }
      }
    }

    hsCodeCache = records;
    return records;
  } catch (err) {
    console.warn('Falling back to default HS codes:', err);
    return DEFAULT_HS_CODES;
  }
}

/**
 * Load Freetime records from public/freetime_data.csv
 */
export async function loadFreetimeData(): Promise<FreetimeRecord[]> {
  if (freetimeCache) return freetimeCache;

  try {
    const res = await fetch('/freetime_data.csv');
    if (!res.ok) throw new Error('Failed to load freetime_data.csv');
    const text = await res.text();
    const lines = text.split('\n');
    const records: FreetimeRecord[] = [];

    let currentCarrier = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row = parseCsvRow(line);
      const rawCarrier = row[0]?.trim();

      if (rawCarrier) {
        currentCarrier = rawCarrier;
      }

      const record: FreetimeRecord = {
        id: i,
        carrier: currentCarrier || 'ALL CARRIERS',
        latKrabang: row[1]?.trim() || '-',
        laemChabang: row[2]?.trim() || '-',
        patBangkok: row[3]?.trim() || '-',
        songkla: row[4]?.trim() || '-',
        reefer: row[5]?.trim() || '-',
        remark: row[6]?.trim() || '-',
        freeTimePlug: row[7]?.trim() || '-',
        dem2040: row[8]?.trim() || '-',
        dt2040: row[9]?.trim() || '-',
        demReefer: row[10]?.trim() || '-',
        detReefer: row[11]?.trim() || '-',
      };

      // Only add if there is carrier or port info
      if (
        record.carrier &&
        (record.latKrabang !== '-' ||
          record.laemChabang !== '-' ||
          record.patBangkok !== '-' ||
          record.remark !== '-' ||
          record.dem2040 !== '-')
      ) {
        records.push(record);
      }
    }

    freetimeCache = records;
    return records;
  } catch (err) {
    console.warn('Falling back to default freetime records:', err);
    return DEFAULT_FREETIME_RECORDS;
  }
}

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export const DEFAULT_CUSTOMERS: CustomerRecord[] = [
  {
    id: 101,
    name: 'POLYPLEX (THAILAND) PUBLIC COMPANY LIMITED',
    country: 'THAILAND',
    status: 'ACTIVE',
    addresses: [
      {
        type: 'HEAD OFFICE',
        raw: '75/26 Ocean Tower II, 18th Floor, Soi Sukhumvit 19, North Klongtoey, Wattana, Bangkok 10110',
        city: 'Bangkok',
        country: 'THAILAND',
        isPrimary: true,
      },
      {
        type: 'FACTORY',
        raw: 'Siam Eastern Industrial Park, 60/24 Moo 3, Mabyangporn, Pluakdaeng, Rayong 21140',
        city: 'Rayong',
        country: 'THAILAND',
        isPrimary: false,
      },
    ],
    contacts: [
      {
        name: 'Ms. Supaporn S.',
        title: 'Export Shipping Specialist',
        email: 'export.docs@polyplex.com',
        phone: '+66-2-665-2700',
        isPrimary: true,
      },
    ],
    banks: [
      {
        name: 'Bangkok Bank PCL',
        branch: 'Asoke Branch',
        accountNo: '101-9-882736',
        swift: 'BKKBTHTH',
      },
    ],
    identifiers: [
      { type: 'TAX ID', value: '0107547000611' },
      { type: 'BIN', value: 'TH9092817260' },
    ],
  },
  {
    id: 102,
    name: 'BETAGRO PUBLIC COMPANY LIMITED',
    country: 'THAILAND',
    status: 'ACTIVE',
    addresses: [
      {
        type: 'HEAD OFFICE',
        raw: 'Betagro Tower (North Park), 323 Vibhavadi Rangsit Rd, Laksi, Bangkok 10210',
        city: 'Bangkok',
        country: 'THAILAND',
        isPrimary: true,
      },
      {
        type: 'PROCESSING PLANT',
        raw: 'Nong Khae Industrial Estate, 323 Moo 6, Nong Khae, Saraburi 18140',
        city: 'Saraburi',
        country: 'THAILAND',
        isPrimary: false,
      },
    ],
    contacts: [
      {
        name: 'Mr. Thanawat K.',
        title: 'Overseas Logistics Manager',
        email: 'logistics.export@betagro.com',
        phone: '+66-2-833-8000',
        isPrimary: true,
      },
    ],
    banks: [
      {
        name: 'Kasikornbank PCL',
        branch: 'Phaholyothin Main Office',
        accountNo: '003-2-998124',
        swift: 'KASITHBK',
      },
    ],
    identifiers: [
      { type: 'TAX ID', value: '0107538000201' },
      { type: 'BIN', value: 'TH1102938475' },
    ],
  },
  {
    id: 103,
    name: 'MCKEY FOOD SERVICES (THAILAND) LTD.',
    country: 'THAILAND',
    status: 'ACTIVE',
    addresses: [
      {
        type: 'FACTORY & OFFICE',
        raw: '210 Moo 1, Theparak Road Km.21, Tambon Bang Saothong, Amphoe Bang Saothong, Samut Prakan 10540',
        city: 'Samut Prakan',
        country: 'THAILAND',
        isPrimary: true,
      },
    ],
    contacts: [
      {
        name: 'Ms. Nattaya P.',
        title: 'Senior Shipping Coordinator',
        email: 'shipping@mckey.co.th',
        phone: '+66-2-315-9000',
        isPrimary: true,
      },
    ],
    banks: [
      {
        name: 'Siam Commercial Bank PCL',
        branch: 'Bangna-Trad Km.18',
        accountNo: '402-1-883719',
        swift: 'SICOTHBK',
      },
    ],
    identifiers: [{ type: 'TAX ID', value: '0115535002019' }],
  },
  {
    id: 104,
    name: 'FORTUNE FROZEN FOODS (THAILAND) CO., LTD.',
    country: 'THAILAND',
    status: 'ACTIVE',
    addresses: [
      {
        type: 'SEAFOOD PLANT',
        raw: '88 Moo 2, Tambon Tachin, Mueang Samut Sakhon, Samut Sakhon 74000',
        city: 'Samut Sakhon',
        country: 'THAILAND',
        isPrimary: true,
      },
    ],
    contacts: [
      {
        name: 'Mr. Chaiwat R.',
        title: 'Export Documentation Officer',
        email: 'export.docs@fortunefrozen.com',
        phone: '+66-34-490-120',
        isPrimary: true,
      },
    ],
    banks: [
      {
        name: 'Krungthai Bank PCL',
        branch: 'Samut Sakhon',
        accountNo: '712-0-482910',
        swift: 'KRBKTHTH',
      },
    ],
    identifiers: [{ type: 'TAX ID', value: '0745542000881' }],
  },
  {
    id: 105,
    name: 'GC MARKETING SOLUTIONS COMPANY LIMITED',
    country: 'THAILAND',
    status: 'ACTIVE',
    addresses: [
      {
        type: 'HEADQUARTERS',
        raw: 'Energy Complex Building A, 555/1 Vibhavadi Rangsit Rd, Chatuchak, Bangkok 10900',
        city: 'Bangkok',
        country: 'THAILAND',
        isPrimary: true,
      },
    ],
    contacts: [
      {
        name: 'Mr. Pradit V.',
        title: 'Polymers Marine Trade Specialist',
        email: 'polymer.export@gc-marketing.com',
        phone: '+66-2-140-4488',
        isPrimary: true,
      },
    ],
    banks: [
      {
        name: 'Bangkok Bank PCL',
        branch: 'Energy Complex',
        accountNo: '931-0-128475',
        swift: 'BKKBTHTH',
      },
    ],
    identifiers: [{ type: 'TAX ID', value: '0105551061921' }],
  },
];

const DEFAULT_HS_CODES: HSCodeRecord[] = [
  { id: 1, sales: "P'POK", customerName: 'MITSUBISHI HEAVY INDUSTRIES', commodity: 'AIR CONDITIONER PARTS', hsCode: '841510' },
  { id: 2, sales: "P'POK", customerName: 'SUMITOMO RUBBER', commodity: 'NEW TYRES', hsCode: '401111' },
  { id: 3, sales: 'NUNG', customerName: 'ASAHI-THAI ALLOY', commodity: 'STEEL/IRON/STAINLESS/METAL PRODUCTS', hsCode: '848180' },
  { id: 4, sales: 'NUNG', customerName: 'POLYPLEX (THAILAND) PCL', commodity: 'BOPET FILM (POLYESTER FILMS)', hsCode: '392062' },
  { id: 5, sales: 'NUNG', customerName: 'BETAGRO PUBLIC CO., LTD.', commodity: 'FROZEN COOKED POULTRY', hsCode: '160232' },
  { id: 6, sales: 'NUNG', customerName: 'DOUBLE A', commodity: 'PRINTED MATERIAL & PAPER PRODUCT', hsCode: '480256' },
  { id: 7, sales: 'NUNG', customerName: 'PTT PHENOL COMPANY LIMITED', commodity: 'BISPHENOL-A', hsCode: '29072300' },
  { id: 8, sales: 'NUNG', customerName: 'SCG International', commodity: 'COIL BOARD', hsCode: '4859390' },
  { id: 9, sales: 'NUNG', customerName: 'MCKEY FOOD SERVICES', commodity: 'FROZEN MEAT PATTIES', hsCode: '160250' },
];

const DEFAULT_FREETIME_RECORDS: FreetimeRecord[] = [
  {
    id: 1,
    carrier: 'OOCL',
    latKrabang: '6 DAYS FROM ETD',
    laemChabang: '6 DAYS FROM ETD',
    patBangkok: '3 DAYS FROM ETD',
    songkla: '-',
    reefer: '6 DAYS FROM ETD',
    remark: 'Standard Dry 20/40',
    freeTimePlug: '3 DAYS',
    dem2040: '6 DAYS',
    dt2040: '7 DAYS',
    demReefer: '4 DAYS',
    detReefer: '3 DAYS',
  },
  {
    id: 2,
    carrier: 'ONE',
    latKrabang: '7 DAYS FROM ETD',
    laemChabang: '7 DAYS FROM ETD',
    patBangkok: '7 DAYS FROM ETD',
    songkla: '-',
    reefer: '5 DAYS FROM ETD',
    remark: 'Japan / Singapore / Manila routes',
    freeTimePlug: '3 DAYS (LCH/LKB)',
    dem2040: '7 DAYS',
    dt2040: '7 DAYS',
    demReefer: '5 DAYS',
    detReefer: '4 DAYS',
  },
  {
    id: 3,
    carrier: 'WANHAI',
    latKrabang: '3 DAYS FROM CLOSING',
    laemChabang: '3 DAYS FROM CLOSING',
    patBangkok: '3 DAYS FROM CLOSING',
    songkla: '-',
    reefer: '5 DAYS FROM ETD',
    remark: 'Taiwan & Intra-Asia special terms',
    freeTimePlug: '3 DAYS',
    dem2040: '5 DAYS',
    dt2040: '7 DAYS',
    demReefer: '3 DAYS',
    detReefer: '3 DAYS',
  },
  {
    id: 4,
    carrier: 'HAPAG-LLOYD',
    latKrabang: '6 DAYS FROM ETD',
    laemChabang: '6 DAYS FROM ETD',
    patBangkok: '6 DAYS FROM ETD',
    songkla: '-',
    reefer: '3 DAYS FROM CLOSING',
    remark: 'DRY CNTR. FT (EXC. HOLIDAY & SUN)',
    freeTimePlug: '3 DAYS',
    dem2040: '7 DAYS',
    dt2040: '7 DAYS',
    demReefer: '3 DAYS',
    detReefer: '3 DAYS',
  },
  {
    id: 5,
    carrier: 'MAERSK',
    latKrabang: '6 DAYS FROM ETD',
    laemChabang: '6 DAYS FROM ETD',
    patBangkok: '6 DAYS FROM ETD',
    songkla: '-',
    reefer: '6 DAYS FROM ETD',
    remark: 'Combined Demurrage & Detention available',
    freeTimePlug: '4 DAYS',
    dem2040: '7 DAYS',
    dt2040: '7 DAYS',
    demReefer: '4 DAYS',
    detReefer: '4 DAYS',
  },
];
