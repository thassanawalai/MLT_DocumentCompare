/**
 * Realistic Pre-loaded Comparison Scenarios for Maritime Logistics
 * Modeled directly on the authentic shipping instructions and carrier B/Ls
 */

import { ComparisonScenario } from '../types/shipping';
import { DiscrepancyCardItem } from '../types/discrepancyCard';

export const DEFAULT_DISCREPANCY_CARDS: DiscrepancyCardItem[] = [
  {
    id: 'disc-1',
    order: 1,
    title: '1. ปริมาตรสินค้า (Measurement / CBM)',
    badgeText: 'ผิดแน่นอนจากเอกสาร',
    badgeType: 'critical',
    layoutType: 'table_metric',
    metrics: [
      {
        label: 'Shipping Particular',
        value: '215.541 CBM',
        subtext: 'หน้า 1',
      },
      {
        label: 'Draft B/L',
        value: '150.00 M³',
        subtext: 'หน้า 1 และหน้า 2',
      },
    ],
    diffHighlight: 'ผลต่าง 65.541 CBM',
    subnote: 'รายละเอียดต่อหนึ่งตู้ก็ไม่ตรงกันด้วย',
    bullets: [
      'SI: 71.847 CBM/ตู้',
      'B/L: 50.00 M³/ตู้',
    ],
    fieldKey: 'measurement',
    category: 'cargo',
  },
  {
    id: 'disc-2',
    order: 2,
    title: '2. เลขประจำตัวผู้เสียภาษี Shipper',
    badgeText: 'ตัวเลขไม่ครบ',
    badgeType: 'incomplete_number',
    layoutType: 'bullet_list',
    bullets: [
      'SI หน้า 1: 0105525022493',
      'Draft B/L หน้า 1: 010552502249',
    ],
    explanation: 'Draft B/L ขาดเลขท้าย 3 เมื่อเทียบกับ SI',
    fieldKey: 'shipper',
    category: 'party',
  },
  {
    id: 'disc-3',
    order: 3,
    title: '3. เลขประจำตัวผู้เสียภาษี Consignee / Notify Party',
    badgeText: 'ข้อมูลไม่ครบ',
    badgeType: 'incomplete_data',
    layoutType: 'bullet_list',
    bullets: [
      'SI หน้า 1: 913101150820306590',
      'Draft B/L หน้า 1: แสดง TAX ID NO.: # โดยไม่มีเลขตามหลัง ทั้งในส่วน Consignee และ Notify Party',
      'Draft B/L หน้า 2: มีเลข #913101150820306590 แต่ขึ้นต้นด้วยเครื่องหมาย #',
    ],
    fieldKey: 'consignee',
    category: 'party',
  },
];

export const COMPARISON_SCENARIOS: ComparisonScenario[] = [
  {
    id: 'si_vs_draft_bl_audit',
    title: 'Shipping Particular vs Draft B/L (ตามรูปตัวอย่าง)',
    titleTh: 'ชุดตรวจจริง: Shipping Particular (SI) เทียบกับ Draft B/L (ตามรูปตัวอย่าง)',
    description: 'กรณีศึกษาจริงตามรูปตัวอย่าง: ตรวจพบปริมาตรสินค้า CBM ไม่ตรงกัน (ผลต่าง 65.541 CBM), เลขผู้เสียภาษี Shipper ขาดเลข 3 ท้าย, และ TAX ID Consignee/Notify ข้อมูลไม่ครบ',
    shipperCompany: 'EXPORTER CO., LTD.',
    carrierCompany: 'SHIPPING LINE',
    mode: 'MAIN',
    siData: {
      booking_no: {
        value: 'BKK9028194',
        bbox: { x: 420, y: 70, width: 140, height: 18, page: 1 },
      },
      shipper: {
        value: 'SIAM EXPORT TRADING CO., LTD.\nTAX ID: 0105525022493\n123/45 SATHORN ROAD, YAN NAWA\nBANGKOK 10120 THAILAND',
        bbox: { x: 50, y: 110, width: 260, height: 60, page: 1 },
      },
      consignee: {
        value: 'GLOBAL IMPORTERS LTD.\nTAX ID NO.: 913101150820306590\nBUILDING 4, PU DONG NEW AREA\nSHANGHAI 200120 CHINA',
        bbox: { x: 50, y: 185, width: 260, height: 60, page: 1 },
      },
      notify_party: {
        value: 'GLOBAL IMPORTERS LTD.\nTAX ID NO.: 913101150820306590\nSAME AS CONSIGNEE',
        bbox: { x: 50, y: 260, width: 260, height: 40, page: 1 },
      },
      pre_carriage_by: {
        value: 'FEEDER CHANA BHUM V.019N',
        bbox: { x: 50, y: 320, width: 150, height: 20, page: 1 },
      },
      vessel: {
        value: 'EVER GIVEN V.0382E',
        bbox: { x: 220, y: 320, width: 170, height: 20, page: 1 },
      },
      port_of_loading: {
        value: 'LAEM CHABANG, THAILAND',
        bbox: { x: 50, y: 355, width: 160, height: 25, page: 1 },
      },
      port_of_discharge: {
        value: 'SHANGHAI, CHINA',
        bbox: { x: 220, y: 355, width: 160, height: 25, page: 1 },
      },
      place_of_delivery: {
        value: 'SHANGHAI PORT, CHINA',
        bbox: { x: 400, y: 355, width: 160, height: 25, page: 1 },
      },
      place_of_receipt: {
        value: 'LAEM CHABANG, THAILAND',
        bbox: { x: 400, y: 320, width: 150, height: 20, page: 1 },
      },
      mark: {
        value: 'EMCU9201821 / SEAL: EM88192\nEMCU9201832 / SEAL: EM88193\nEMCU9201843 / SEAL: EM88194',
        bbox: { x: 50, y: 410, width: 180, height: 60, page: 1 },
      },
      description: {
        value: '3X40HQ CONTAINER SAID TO CONTAIN:\nINDUSTRIAL CERAMIC TILES\nHS CODE: 6907.21.00\nFREIGHT PREPAID',
        bbox: { x: 240, y: 410, width: 200, height: 75, page: 1 },
      },
      quantity: {
        value: '3 CONTAINERS (3 UNITS)',
        bbox: { x: 50, y: 485, width: 160, height: 25, page: 1 },
      },
      gross_weight: {
        value: '62,400.00 KGS',
        bbox: { x: 450, y: 410, width: 100, height: 25, page: 1 },
      },
      measurement: {
        value: '215.541 CBM (71.847 CBM/ตู้)',
        bbox: { x: 450, y: 450, width: 120, height: 25, page: 1 },
      },
      freight_term: {
        value: 'FREIGHT PREPAID',
        bbox: { x: 450, y: 490, width: 110, height: 20, page: 1 },
      },
    },
    blData: {
      booking_no: {
        value: 'BKK9028194',
        bbox: { x: 420, y: 70, width: 140, height: 18, page: 1 },
      },
      shipper: {
        value: 'SIAM EXPORT TRADING CO., LTD.\nTAX ID: 010552502249\n123/45 SATHORN ROAD, YAN NAWA\nBANGKOK 10120 THAILAND',
        bbox: { x: 50, y: 110, width: 260, height: 60, page: 1 },
      },
      consignee: {
        value: 'GLOBAL IMPORTERS LTD.\nTAX ID NO.: #\nBUILDING 4, PU DONG NEW AREA\nSHANGHAI 200120 CHINA',
        bbox: { x: 50, y: 185, width: 260, height: 60, page: 1 },
      },
      notify_party: {
        value: 'GLOBAL IMPORTERS LTD.\nTAX ID NO.: #\nSAME AS CONSIGNEE',
        bbox: { x: 50, y: 260, width: 260, height: 40, page: 1 },
      },
      pre_carriage_by: {
        value: 'FEEDER CHANA BHUM V.019N',
        bbox: { x: 50, y: 320, width: 150, height: 20, page: 1 },
      },
      vessel: {
        value: 'EVER GIVEN V.0382E',
        bbox: { x: 220, y: 320, width: 170, height: 20, page: 1 },
      },
      port_of_loading: {
        value: 'LAEM CHABANG, THAILAND',
        bbox: { x: 50, y: 355, width: 160, height: 25, page: 1 },
      },
      port_of_discharge: {
        value: 'SHANGHAI, CHINA',
        bbox: { x: 220, y: 355, width: 160, height: 25, page: 1 },
      },
      place_of_delivery: {
        value: 'SHANGHAI PORT, CHINA',
        bbox: { x: 400, y: 355, width: 160, height: 25, page: 1 },
      },
      place_of_receipt: {
        value: 'LAEM CHABANG, THAILAND',
        bbox: { x: 400, y: 320, width: 150, height: 20, page: 1 },
      },
      mark: {
        value: 'EMCU9201821 / SEAL: EM88192\nEMCU9201832 / SEAL: EM88193\nEMCU9201843 / SEAL: EM88194',
        bbox: { x: 50, y: 410, width: 180, height: 60, page: 1 },
      },
      description: {
        value: '3X40HQ CONTAINER SAID TO CONTAIN:\nINDUSTRIAL CERAMIC TILES\nHS CODE: 6907.21.00\nFREIGHT PREPAID',
        bbox: { x: 240, y: 410, width: 200, height: 75, page: 1 },
      },
      quantity: {
        value: '3 CONTAINERS (3 UNITS)',
        bbox: { x: 50, y: 485, width: 160, height: 25, page: 1 },
      },
      gross_weight: {
        value: '62,400.00 KGS',
        bbox: { x: 450, y: 410, width: 100, height: 25, page: 1 },
      },
      measurement: {
        value: '150.00 M³ (50.00 M³/ตู้)',
        bbox: { x: 450, y: 450, width: 120, height: 25, page: 1 },
      },
      freight_term: {
        value: 'FREIGHT PREPAID',
        bbox: { x: 450, y: 490, width: 110, height: 20, page: 1 },
      },
    },
  },
  {
    id: 'polyplex_oocl',
    title: 'Polyplex (SI) vs OOCL (B/L Draft)',
    titleTh: 'ชุดทดสอบที่ 1: Polyplex (SI) เทียบกับ OOCL B/L Draft',
    description: 'การส่งออกฟิล์มโพลีเอสเตอร์ไป Port Klang ตรวจพบข้อผิดพลาดรหัสไปรษณีย์ของผู้รับสินค้า (Consignee) และรูปแบบน้ำหนักรวม',
    shipperCompany: 'POLYPLEX',
    carrierCompany: 'OOCL',
    mode: 'MAIN',
    siData: {
      booking_no: {
        value: '2648719001',
        bbox: { x: 420, y: 70, width: 140, height: 18, page: 1 },
      },
      shipper: {
        value: 'POLYPLEX (THAILAND) PUBLIC COMPANY LIMITED\n75/26 OCEAN TOWER II 18TH FL. SOI SUKHUMVIT 19\nBANGKOK 10110 THAILAND',
        bbox: { x: 50, y: 110, width: 260, height: 60, page: 1 },
      },
      consignee: {
        value: 'PACKAGING ADVANCED SOLUTIONS SDN. BHD.\nLOT 4521 JALAN PERSIARAN INDUSTRI\n42000 PORT KLANG SELANGOR MALAYSIA',
        bbox: { x: 50, y: 185, width: 260, height: 60, page: 1 },
      },
      notify_party: {
        value: 'SAME AS CONSIGNEE',
        bbox: { x: 50, y: 260, width: 260, height: 40, page: 1 },
      },
      pre_carriage_by: {
        value: 'WAN HAI 271 V.024E',
        bbox: { x: 50, y: 320, width: 150, height: 20, page: 1 },
      },
      vessel: {
        value: 'OOCL ROTTERDAM V.128W',
        bbox: { x: 220, y: 320, width: 170, height: 20, page: 1 },
      },
      port_of_loading: {
        value: 'LAEM CHABANG, THAILAND',
        bbox: { x: 50, y: 355, width: 160, height: 25, page: 1 },
      },
      port_of_discharge: {
        value: 'PORT KLANG, MALAYSIA',
        bbox: { x: 220, y: 355, width: 160, height: 25, page: 1 },
      },
      place_of_delivery: {
        value: 'PORT KLANG, MALAYSIA',
        bbox: { x: 400, y: 355, width: 160, height: 25, page: 1 },
      },
      place_of_receipt: {
        value: 'LAEM CHABANG PORT',
        bbox: { x: 400, y: 320, width: 150, height: 20, page: 1 },
      },
      mark: {
        value: 'OOLU8492015 / SEAL: OOC883921\nOOLU9104822 / SEAL: OOC883922',
        bbox: { x: 50, y: 410, width: 180, height: 60, page: 1 },
      },
      description: {
        value: '2X40HQ CONTAINER SAID TO CONTAIN:\nBIAXIALLY ORIENTED POLYESTER FILM (BOPET)\nHS CODE: 3920.62.10\nFREIGHT PREPAID AS ARRANGED',
        bbox: { x: 240, y: 410, width: 200, height: 75, page: 1 },
      },
      quantity: {
        value: '36 PALLETS (1,440 ROLLS)',
        bbox: { x: 50, y: 485, width: 160, height: 25, page: 1 },
      },
      gross_weight: {
        value: '21,450.00 KGS',
        bbox: { x: 450, y: 410, width: 100, height: 25, page: 1 },
      },
      measurement: {
        value: '58.420 CBM',
        bbox: { x: 450, y: 450, width: 90, height: 25, page: 1 },
      },
      freight_term: {
        value: 'FREIGHT PREPAID',
        bbox: { x: 450, y: 490, width: 110, height: 20, page: 1 },
      },
    },
    blData: {
      booking_no: {
        value: '2648719001',
        bbox: { x: 430, y: 65, width: 140, height: 18, page: 1 },
      },
      shipper: {
        value: 'POLYPLEX (THAILAND) PUBLIC COMPANY LIMITED\n75/26 OCEAN TOWER II 18TH FL. SOI SUKHUMVIT 19\nBANGKOK 10110 THAILAND',
        bbox: { x: 45, y: 105, width: 260, height: 60, page: 1 },
      },
      consignee: {
        // Discrepancy: Postcode 42001 instead of 42000
        value: 'PACKAGING ADVANCED SOLUTIONS SDN. BHD.\nLOT 4521 JALAN PERSIARAN INDUSTRI\n42001 PORT KLANG SELANGOR MALAYSIA',
        bbox: { x: 45, y: 180, width: 260, height: 60, page: 1 },
      },
      notify_party: {
        value: 'SAME AS CONSIGNEE',
        bbox: { x: 45, y: 255, width: 260, height: 40, page: 1 },
      },
      pre_carriage_by: {
        // Discrepancy: Voyage 024W instead of 024E
        value: 'WAN HAI 271 V.024W',
        bbox: { x: 45, y: 315, width: 150, height: 20, page: 1 },
      },
      vessel: {
        value: 'OOCL ROTTERDAM V.128W',
        bbox: { x: 215, y: 315, width: 170, height: 20, page: 1 },
      },
      port_of_loading: {
        value: 'LAEM CHABANG, THAILAND',
        bbox: { x: 45, y: 350, width: 160, height: 25, page: 1 },
      },
      port_of_discharge: {
        value: 'PORT KLANG, MALAYSIA',
        bbox: { x: 215, y: 350, width: 160, height: 25, page: 1 },
      },
      place_of_delivery: {
        value: 'PORT KLANG, MALAYSIA',
        bbox: { x: 395, y: 350, width: 160, height: 25, page: 1 },
      },
      place_of_receipt: {
        value: 'LAEM CHABANG PORT',
        bbox: { x: 395, y: 315, width: 150, height: 20, page: 1 },
      },
      mark: {
        value: 'OOLU8492015 / SEAL: OOC883921\nOOLU9104822 / SEAL: OOC883922',
        bbox: { x: 45, y: 405, width: 180, height: 60, page: 1 },
      },
      description: {
        // Carrier omitted HS code line
        value: '2X40HQ CONTAINER SAID TO CONTAIN:\nBIAXIALLY ORIENTED POLYESTER FILM (BOPET)\nFREIGHT PREPAID AS ARRANGED',
        bbox: { x: 235, y: 405, width: 200, height: 75, page: 1 },
      },
      quantity: {
        value: '36 PALLETS (1,440 ROLLS)',
        bbox: { x: 45, y: 480, width: 160, height: 25, page: 1 },
      },
      gross_weight: {
        // Discrepancy: 21,450 KGS (without decimals)
        value: '21,450 KGS',
        bbox: { x: 445, y: 405, width: 100, height: 25, page: 1 },
      },
      measurement: {
        value: '58.420 CBM',
        bbox: { x: 445, y: 445, width: 90, height: 25, page: 1 },
      },
      freight_term: {
        value: 'FREIGHT PREPAID',
        bbox: { x: 445, y: 485, width: 110, height: 20, page: 1 },
      },
    },
  },
  {
    id: 'betagro_one',
    title: 'Betagro (SI) vs ONE (Master B/L - MBL)',
    titleTh: 'ชุดทดสอบที่ 2: Betagro (SI) เทียบกับ ONE Master B/L (Set 2 MBL)',
    description: 'การส่งออกเนื้อไก่แช่แข็งไปยังโตเกียว ประเทศญี่ปุ่น ตรวจพบการตกหล่นของอุณหภูมิควบคุม Reefer (-18°C) และชื่อผู้รับแจ้ง',
    shipperCompany: 'BETAGRO',
    carrierCompany: 'ONE',
    mode: 'MBL',
    siData: {
      booking_no: {
        value: 'ONEBKK9827361',
        bbox: { x: 410, y: 70, width: 150, height: 20, page: 1 },
      },
      shipper: {
        value: 'BETAGRO PUBLIC COMPANY LIMITED\n323 MOO 6 NONG KHAE INDUSTRIAL ESTATE\nSARABURI 18140 THAILAND',
        bbox: { x: 50, y: 110, width: 280, height: 60, page: 1 },
      },
      consignee: {
        value: 'MARUBENI FOODS CORPORATION\n4-2 NIHONBASHI-MUROMACHI 2-CHOME\nCHUO-KU TOKYO 103-0022 JAPAN',
        bbox: { x: 50, y: 180, width: 280, height: 60, page: 1 },
      },
      notify_party: {
        value: 'MARUBENI LOGISTICS CORPORATION\nTOKYO LOGISTICS CENTER 1-1-1 HEIWAJIMA\nOTA-KU TOKYO JAPAN',
        bbox: { x: 50, y: 250, width: 280, height: 55, page: 1 },
      },
      pre_carriage_by: {
        value: 'FEEDER NYK FUSHIMI V.0112N',
        bbox: { x: 50, y: 315, width: 170, height: 20, page: 1 },
      },
      vessel: {
        value: 'ONE OLYMPUS V.024N',
        bbox: { x: 230, y: 315, width: 160, height: 20, page: 1 },
      },
      port_of_loading: {
        value: 'LAEM CHABANG, THAILAND',
        bbox: { x: 50, y: 345, width: 160, height: 25, page: 1 },
      },
      port_of_discharge: {
        value: 'TOKYO, JAPAN',
        bbox: { x: 230, y: 345, width: 150, height: 25, page: 1 },
      },
      place_of_delivery: {
        value: 'TOKYO PORT (OI CFS)',
        bbox: { x: 395, y: 345, width: 160, height: 25, page: 1 },
      },
      place_of_receipt: {
        value: 'SARABURI FACTORY',
        bbox: { x: 395, y: 315, width: 160, height: 20, page: 1 },
      },
      mark: {
        value: 'TGHU9283710 / SEAL: ONE772183\nTEMP SET AT -18.0 DEGREE CELSIUS',
        bbox: { x: 50, y: 400, width: 190, height: 65, page: 1 },
      },
      description: {
        value: 'FROZEN COOKED CHICKEN MEAT (YAKITORI SKEWER)\nEST NO. 129\nSTORE AT -18 DEG CELSIUS OR BELOW\nFREIGHT PREPAID',
        bbox: { x: 250, y: 400, width: 220, height: 75, page: 1 },
      },
      quantity: {
        value: '1,800 CARTONS',
        bbox: { x: 50, y: 475, width: 140, height: 25, page: 1 },
      },
      gross_weight: {
        value: '24,650.00 KGS',
        bbox: { x: 460, y: 400, width: 100, height: 25, page: 1 },
      },
      measurement: {
        value: '64.500 CBM',
        bbox: { x: 460, y: 435, width: 90, height: 25, page: 1 },
      },
      freight_term: {
        value: 'FREIGHT PREPAID',
        bbox: { x: 460, y: 470, width: 100, height: 20, page: 1 },
      },
    },
    blData: {
      booking_no: {
        value: 'ONEBKK9827361',
        bbox: { x: 410, y: 70, width: 150, height: 20, page: 1 },
      },
      shipper: {
        value: 'BETAGRO PUBLIC COMPANY LIMITED\n323 MOO 6 NONG KHAE INDUSTRIAL ESTATE\nSARABURI 18140 THAILAND',
        bbox: { x: 50, y: 110, width: 280, height: 60, page: 1 },
      },
      consignee: {
        value: 'MARUBENI FOODS CORPORATION\n4-2 NIHONBASHI-MUROMACHI 2-CHOME\nCHUO-KU TOKYO 103-0022 JAPAN',
        bbox: { x: 50, y: 180, width: 280, height: 60, page: 1 },
      },
      notify_party: {
        // Discrepancy: Missing OTA-KU in Tokyo address
        value: 'MARUBENI LOGISTICS CORPORATION\nTOKYO LOGISTICS CENTER 1-1-1 HEIWAJIMA\nTOKYO JAPAN',
        bbox: { x: 50, y: 250, width: 280, height: 55, page: 1 },
      },
      pre_carriage_by: {
        value: 'FEEDER NYK FUSHIMI V.0112N',
        bbox: { x: 50, y: 315, width: 170, height: 20, page: 1 },
      },
      vessel: {
        value: 'ONE OLYMPUS V.024N',
        bbox: { x: 230, y: 315, width: 160, height: 20, page: 1 },
      },
      port_of_loading: {
        value: 'LAEM CHABANG, THAILAND',
        bbox: { x: 50, y: 345, width: 160, height: 25, page: 1 },
      },
      port_of_discharge: {
        value: 'TOKYO, JAPAN',
        bbox: { x: 230, y: 345, width: 150, height: 25, page: 1 },
      },
      place_of_delivery: {
        value: 'TOKYO PORT (OI CFS)',
        bbox: { x: 395, y: 345, width: 160, height: 25, page: 1 },
      },
      place_of_receipt: {
        value: 'SARABURI FACTORY',
        bbox: { x: 395, y: 315, width: 160, height: 20, page: 1 },
      },
      mark: {
        // Discrepancy: Carrier missed temperature instruction in marks
        value: 'TGHU9283710 / SEAL: ONE772183',
        bbox: { x: 50, y: 400, width: 190, height: 65, page: 1 },
      },
      description: {
        // Discrepancy: Carrier omitted EST NO. 129 (vital for Japan quarantine)
        value: 'FROZEN COOKED CHICKEN MEAT (YAKITORI SKEWER)\nSTORE AT -18 DEG CELSIUS OR BELOW\nFREIGHT PREPAID',
        bbox: { x: 250, y: 400, width: 220, height: 75, page: 1 },
      },
      quantity: {
        value: '1,800 CARTONS',
        bbox: { x: 50, y: 475, width: 140, height: 25, page: 1 },
      },
      gross_weight: {
        value: '24,650.00 KGS',
        bbox: { x: 460, y: 400, width: 100, height: 25, page: 1 },
      },
      measurement: {
        value: '64.500 CBM',
        bbox: { x: 460, y: 435, width: 90, height: 25, page: 1 },
      },
      freight_term: {
        value: 'FREIGHT PREPAID',
        bbox: { x: 460, y: 470, width: 100, height: 20, page: 1 },
      },
    },
  },
  {
    id: 'mckey_wanhai',
    title: 'McKey Food (SI) vs Wan Hai Lines (B/L)',
    titleTh: 'ชุดทดสอบที่ 3: McKey Food (SI) เทียบกับ Wan Hai Lines (B/L)',
    description: 'การส่งออกเบอร์เกอร์แช่แข็งไปยัง Keelung ตรวจพบข้อผิดพลาดรหัสเที่ยวเรือ และเลขที่เบอร์ซีล (Seal Number)',
    shipperCompany: 'MCKEY',
    carrierCompany: 'WANHAI',
    mode: 'MAIN',
    siData: {
      booking_no: {
        value: 'WHLBKK409921',
        bbox: { x: 400, y: 70, width: 140, height: 18, page: 1 },
      },
      shipper: {
        value: 'MCKEY FOOD SERVICES (THAILAND) LTD.\n210 MOO 1 THEPARAK ROAD, BANG SAOTHONG\nSAMUT PRAKAN 10540 THAILAND',
        bbox: { x: 50, y: 110, width: 280, height: 55, page: 1 },
      },
      consignee: {
        value: 'TAIWAN FAST FOOD SUPPLIES CORP.\nNO. 88 JIAN GUO NORTH ROAD, SECTION 2\nZHONGSHAN DISTRICT, TAIPEI 104, TAIWAN',
        bbox: { x: 50, y: 175, width: 280, height: 60, page: 1 },
      },
      notify_party: {
        value: 'SAME AS CONSIGNEE',
        bbox: { x: 50, y: 245, width: 240, height: 35, page: 1 },
      },
      pre_carriage_by: {
        value: 'WAN HAI 172 V.S348',
        bbox: { x: 50, y: 310, width: 150, height: 20, page: 1 },
      },
      vessel: {
        value: 'WAN HAI 315 V.019W',
        bbox: { x: 220, y: 310, width: 160, height: 20, page: 1 },
      },
      port_of_loading: {
        value: 'BANGKOK (PAT), THAILAND',
        bbox: { x: 50, y: 340, width: 160, height: 25, page: 1 },
      },
      port_of_discharge: {
        value: 'KEELUNG, TAIWAN',
        bbox: { x: 220, y: 340, width: 150, height: 25, page: 1 },
      },
      place_of_delivery: {
        value: 'KEELUNG, TAIWAN',
        bbox: { x: 390, y: 340, width: 150, height: 25, page: 1 },
      },
      place_of_receipt: {
        value: 'BANGKOK PORT (PAT)',
        bbox: { x: 390, y: 310, width: 150, height: 20, page: 1 },
      },
      mark: {
        value: 'WHLU5928104 / SEAL: SL99281',
        bbox: { x: 50, y: 395, width: 170, height: 50, page: 1 },
      },
      description: {
        value: '1X40RF REEFER CONTAINER:\nFROZEN BEEF PATTIES (HALAL CERTIFIED)\nNET WEIGHT: 22,000.00 KGS\nKEEP FROZEN AT -20 DEGREES C',
        bbox: { x: 230, y: 395, width: 210, height: 75, page: 1 },
      },
      quantity: {
        value: '2,200 CARTONS',
        bbox: { x: 50, y: 460, width: 130, height: 25, page: 1 },
      },
      gross_weight: {
        value: '23,800.00 KGS',
        bbox: { x: 450, y: 395, width: 100, height: 25, page: 1 },
      },
      measurement: {
        value: '52.100 CBM',
        bbox: { x: 450, y: 430, width: 90, height: 25, page: 1 },
      },
      freight_term: {
        value: 'FREIGHT COLLECT',
        bbox: { x: 450, y: 465, width: 110, height: 20, page: 1 },
      },
    },
    blData: {
      booking_no: {
        value: 'WHLBKK409921',
        bbox: { x: 400, y: 70, width: 140, height: 18, page: 1 },
      },
      shipper: {
        value: 'MCKEY FOOD SERVICES (THAILAND) LTD.\n210 MOO 1 THEPARAK ROAD, BANG SAOTHONG\nSAMUT PRAKAN 10540 THAILAND',
        bbox: { x: 50, y: 110, width: 280, height: 55, page: 1 },
      },
      consignee: {
        value: 'TAIWAN FAST FOOD SUPPLIES CORP.\nNO. 88 JIAN GUO NORTH ROAD, SECTION 2\nZHONGSHAN DISTRICT, TAIPEI 104, TAIWAN',
        bbox: { x: 50, y: 175, width: 280, height: 60, page: 1 },
      },
      notify_party: {
        value: 'SAME AS CONSIGNEE',
        bbox: { x: 50, y: 245, width: 240, height: 35, page: 1 },
      },
      pre_carriage_by: {
        value: 'WAN HAI 172 V.S348',
        bbox: { x: 50, y: 310, width: 150, height: 20, page: 1 },
      },
      vessel: {
        // Discrepancy: Voyage format "W019" instead of "019W"
        value: 'WAN HAI 315 V.W019',
        bbox: { x: 220, y: 310, width: 160, height: 20, page: 1 },
      },
      port_of_loading: {
        value: 'BANGKOK (PAT), THAILAND',
        bbox: { x: 50, y: 340, width: 160, height: 25, page: 1 },
      },
      port_of_discharge: {
        value: 'KEELUNG, TAIWAN',
        bbox: { x: 220, y: 340, width: 150, height: 25, page: 1 },
      },
      place_of_delivery: {
        value: 'KEELUNG, TAIWAN',
        bbox: { x: 390, y: 340, width: 150, height: 25, page: 1 },
      },
      place_of_receipt: {
        value: 'BANGKOK PORT (PAT)',
        bbox: { x: 390, y: 310, width: 150, height: 20, page: 1 },
      },
      mark: {
        // Discrepancy: Seal SL99287 instead of SL99281 (CRITICAL customs error)
        value: 'WHLU5928104 / SEAL: SL99287',
        bbox: { x: 50, y: 395, width: 170, height: 50, page: 1 },
      },
      description: {
        value: '1X40RF REEFER CONTAINER:\nFROZEN BEEF PATTIES (HALAL CERTIFIED)\nNET WEIGHT: 22,000.00 KGS\nKEEP FROZEN AT -20 DEGREES C',
        bbox: { x: 230, y: 395, width: 210, height: 75, page: 1 },
      },
      quantity: {
        value: '2,200 CARTONS',
        bbox: { x: 50, y: 460, width: 130, height: 25, page: 1 },
      },
      gross_weight: {
        value: '23,800.00 KGS',
        bbox: { x: 450, y: 395, width: 100, height: 25, page: 1 },
      },
      measurement: {
        value: '52.100 CBM',
        bbox: { x: 450, y: 430, width: 90, height: 25, page: 1 },
      },
      freight_term: {
        // Discrepancy: Carrier billed FREIGHT PREPAID instead of COLLECT
        value: 'FREIGHT PREPAID',
        bbox: { x: 450, y: 465, width: 110, height: 20, page: 1 },
      },
    },
  },
  {
    id: 'fortune_hapag',
    title: 'Fortune Frozen (SI) vs Hapag-Lloyd (B/L)',
    titleTh: 'ชุดทดสอบที่ 4: Fortune Frozen (SI) เทียบกับ Hapag-Lloyd (B/L)',
    description: 'การส่งออกกุ้งแช่แข็งไปยังฮัมบูร์ก ประเทศเยอรมนี ตรวจพบชื่อท่าเรือปลายทางย่อ (DEHAM) และการระบุเงื่อนไขการส่งมอบ',
    shipperCompany: 'FORTUNE',
    carrierCompany: 'HAPAG',
    mode: 'MAIN',
    siData: {
      booking_no: {
        value: 'HLD9817260',
        bbox: { x: 420, y: 70, width: 140, height: 18, page: 1 },
      },
      shipper: {
        value: 'FORTUNE FROZEN FOODS (THAILAND) CO., LTD.\n88 MOO 2, TAMBON TACHIN, MUEANG SAMUT SAKHON\nSAMUT SAKHON 74000 THAILAND',
        bbox: { x: 50, y: 110, width: 280, height: 55, page: 1 },
      },
      consignee: {
        value: 'HAMBURG SEAFOOD IMPORT GMBH\nGROSSE ELBSTRASSE 145B\n22767 HAMBURG, GERMANY',
        bbox: { x: 50, y: 175, width: 280, height: 60, page: 1 },
      },
      notify_party: {
        value: 'EUROPEAN LOGISTICS PARTNERS GMBH\nAM SANDTORKAI 37\n20457 HAMBURG, GERMANY',
        bbox: { x: 50, y: 245, width: 280, height: 55, page: 1 },
      },
      pre_carriage_by: {
        value: 'FEEDER VESSEL CAPE FORBY V.049W',
        bbox: { x: 50, y: 310, width: 170, height: 20, page: 1 },
      },
      vessel: {
        value: 'HAPAG AL DAHNA EXPRESS V.021E',
        bbox: { x: 230, y: 310, width: 170, height: 20, page: 1 },
      },
      port_of_loading: {
        value: 'LAEM CHABANG, THAILAND',
        bbox: { x: 50, y: 340, width: 160, height: 25, page: 1 },
      },
      port_of_discharge: {
        value: 'HAMBURG, GERMANY',
        bbox: { x: 230, y: 340, width: 160, height: 25, page: 1 },
      },
      place_of_delivery: {
        value: 'HAMBURG, GERMANY',
        bbox: { x: 400, y: 340, width: 150, height: 25, page: 1 },
      },
      place_of_receipt: {
        value: 'LAEM CHABANG CFS',
        bbox: { x: 400, y: 310, width: 150, height: 20, page: 1 },
      },
      mark: {
        value: 'HLXU8190283 / SEAL: HLG449102',
        bbox: { x: 50, y: 395, width: 180, height: 50, page: 1 },
      },
      description: {
        value: 'FROZEN BLACK TIGER SHRIMP (PND IQF)\nSIZE: 16/20 PCS/LB\nNET WT: 18,000.00 KGS\nSTORE AT -18C / FREIGHT PREPAID',
        bbox: { x: 240, y: 395, width: 200, height: 75, page: 1 },
      },
      quantity: {
        value: '1,800 MASTER CARTONS',
        bbox: { x: 50, y: 460, width: 150, height: 25, page: 1 },
      },
      gross_weight: {
        value: '19,850.00 KGS',
        bbox: { x: 450, y: 395, width: 100, height: 25, page: 1 },
      },
      measurement: {
        value: '44.800 CBM',
        bbox: { x: 450, y: 430, width: 90, height: 25, page: 1 },
      },
      freight_term: {
        value: 'FREIGHT PREPAID',
        bbox: { x: 450, y: 465, width: 110, height: 20, page: 1 },
      },
    },
    blData: {
      booking_no: {
        value: 'HLD9817260',
        bbox: { x: 420, y: 70, width: 140, height: 18, page: 1 },
      },
      shipper: {
        value: 'FORTUNE FROZEN FOODS (THAILAND) CO., LTD.\n88 MOO 2, TAMBON TACHIN, MUEANG SAMUT SAKHON\nSAMUT SAKHON 74000 THAILAND',
        bbox: { x: 50, y: 110, width: 280, height: 55, page: 1 },
      },
      consignee: {
        // Discrepancy: street number typo 145 instead of 145B
        value: 'HAMBURG SEAFOOD IMPORT GMBH\nGROSSE ELBSTRASSE 145\n22767 HAMBURG, GERMANY',
        bbox: { x: 50, y: 175, width: 280, height: 60, page: 1 },
      },
      notify_party: {
        value: 'EUROPEAN LOGISTICS PARTNERS GMBH\nAM SANDTORKAI 37\n20457 HAMBURG, GERMANY',
        bbox: { x: 50, y: 245, width: 280, height: 55, page: 1 },
      },
      pre_carriage_by: {
        value: 'FEEDER VESSEL CAPE FORBY V.049W',
        bbox: { x: 50, y: 310, width: 170, height: 20, page: 1 },
      },
      vessel: {
        value: 'HAPAG AL DAHNA EXPRESS V.021E',
        bbox: { x: 230, y: 310, width: 170, height: 20, page: 1 },
      },
      port_of_loading: {
        value: 'LAEM CHABANG, THAILAND',
        bbox: { x: 50, y: 340, width: 160, height: 25, page: 1 },
      },
      port_of_discharge: {
        // Discrepancy: Port UN/LOCODE code instead of full name
        value: 'HAMBURG (DEHAM)',
        bbox: { x: 230, y: 340, width: 160, height: 25, page: 1 },
      },
      place_of_delivery: {
        value: 'HAMBURG (DEHAM)',
        bbox: { x: 400, y: 340, width: 150, height: 25, page: 1 },
      },
      place_of_receipt: {
        value: 'LAEM CHABANG CFS',
        bbox: { x: 400, y: 310, width: 150, height: 20, page: 1 },
      },
      mark: {
        value: 'HLXU8190283 / SEAL: HLG449102',
        bbox: { x: 50, y: 395, width: 180, height: 50, page: 1 },
      },
      description: {
        value: 'FROZEN BLACK TIGER SHRIMP (PND IQF)\nSIZE: 16/20 PCS/LB\nNET WT: 18,000.00 KGS\nSTORE AT -18C / FREIGHT PREPAID',
        bbox: { x: 240, y: 395, width: 200, height: 75, page: 1 },
      },
      quantity: {
        value: '1,800 MASTER CARTONS',
        bbox: { x: 50, y: 460, width: 150, height: 25, page: 1 },
      },
      gross_weight: {
        value: '19,850.00 KGS',
        bbox: { x: 450, y: 395, width: 100, height: 25, page: 1 },
      },
      measurement: {
        // Discrepancy: 44.8 CBM vs 44.800 CBM
        value: '44.80 CBM',
        bbox: { x: 450, y: 430, width: 90, height: 25, page: 1 },
      },
      freight_term: {
        value: 'FREIGHT PREPAID',
        bbox: { x: 450, y: 465, width: 110, height: 20, page: 1 },
      },
    },
  },
];
