/**
 * Registry of Carrier & Shipper Templates and Field Definitions
 * Extracted and enhanced from MLT_DocumentCompare/backend/app/templates
 */

export interface FieldDefinition {
  key: string;
  labelEn: string;
  labelTh: string;
  category: 'party' | 'routing' | 'cargo' | 'booking' | 'customs';
  severity: 'critical' | 'warning' | 'info';
  descriptionTh: string;
}

export const SHIPPING_FIELDS: Record<string, FieldDefinition> = {
  booking_no: {
    key: 'booking_no',
    labelEn: 'Booking No.',
    labelTh: 'เลขที่บุ๊กกิ้ง (Booking No.)',
    category: 'booking',
    severity: 'critical',
    descriptionTh: 'หมายเลขการจองระวางเรือ ต้องตรงกัน 100% มิฉะนั้นสายเรือจะไม่ปล่อยตู้หรือไม่ออก B/L',
  },
  shipper: {
    key: 'shipper',
    labelEn: 'Shipper / Exporter',
    labelTh: 'ผู้ส่งออก (Shipper/Exporter)',
    category: 'party',
    severity: 'critical',
    descriptionTh: 'ชื่อและที่อยู่ผู้ส่งออกตามหนังสือจดทะเบียนและใบกำกับสินค้า',
  },
  consignee: {
    key: 'consignee',
    labelEn: 'Consignee',
    labelTh: 'ผู้รับสินค้าปลายทาง (Consignee)',
    category: 'party',
    severity: 'critical',
    descriptionTh: 'ชื่อ ที่อยู่ผู้รับสินค้าปลายทาง หากผิดปลายทางจะไม่สามารถทำพิธีการศุลกากรปล่อยของได้',
  },
  notify_party: {
    key: 'notify_party',
    labelEn: 'Notify Party',
    labelTh: 'ผู้รับแจ้งเมื่อสินค้าถึง (Notify Party)',
    category: 'party',
    severity: 'warning',
    descriptionTh: 'บริษัทหรือตัวแทนที่ต้องได้รับแจ้งเมื่อเรือเทียบท่า (มักระบุ SAME AS CONSIGNEE)',
  },
  pre_carriage_by: {
    key: 'pre_carriage_by',
    labelEn: 'Pre-Carriage / Feeder',
    labelTh: 'เรือฟีดเดอร์รับช่วงต้น (Feeder Vessel)',
    category: 'routing',
    severity: 'warning',
    descriptionTh: 'ชื่อเรือฟีดเดอร์และเที่ยวเรือ (Voyage) จากท่าต้นทางไปยังท่าเรือเปลี่ยนถ่าย (Transshipment)',
  },
  vessel: {
    key: 'vessel',
    labelEn: 'Ocean Vessel & Voyage',
    labelTh: 'เรือใหญ่และเที่ยวเรือ (Mother Vessel & Voyage)',
    category: 'routing',
    severity: 'critical',
    descriptionTh: 'ชื่อเรือแม่และหมายเลขเที่ยวเรือที่ขนส่งข้ามมหาสมุทร',
  },
  port_of_loading: {
    key: 'port_of_loading',
    labelEn: 'Port of Loading (POL)',
    labelTh: 'ท่าเรือต้นทาง (POL)',
    category: 'routing',
    severity: 'critical',
    descriptionTh: 'ท่าเรือที่นำตู้สินค้าขึ้นเรือ (เช่น LAEM CHABANG, BANGKOK PAT, LAT KRABANG)',
  },
  port_of_discharge: {
    key: 'port_of_discharge',
    labelEn: 'Port of Discharge (POD)',
    labelTh: 'ท่าเรือปลายทาง (POD)',
    category: 'routing',
    severity: 'critical',
    descriptionTh: 'ท่าเรือปลายทางที่สินค้าถูกยกขึ้นจากเรือ',
  },
  place_of_delivery: {
    key: 'place_of_delivery',
    labelEn: 'Place of Delivery',
    labelTh: 'สถานที่ส่งมอบปลายทาง (Place of Delivery)',
    category: 'routing',
    severity: 'critical',
    descriptionTh: 'จุดหมายปลายทางสุดท้ายตามสัญญาการขนส่ง (CFS/CY หรือเมืองปลายทาง)',
  },
  place_of_receipt: {
    key: 'place_of_receipt',
    labelEn: 'Place of Receipt',
    labelTh: 'สถานที่รับมอบต้นทาง (Place of Receipt)',
    category: 'routing',
    severity: 'info',
    descriptionTh: 'จุดรับมอบตู้สินค้าจากผู้ส่ง (ICD Lat Krabang หรือ Factory)',
  },
  mark: {
    key: 'mark',
    labelEn: 'Marks & Numbers / Container No.',
    labelTh: 'เครื่องหมายหีบห่อและเบอร์ตู้/ซีล (Marks & Seal)',
    category: 'cargo',
    severity: 'critical',
    descriptionTh: 'หมายเลขตู้คอนเทนเนอร์ 4 ตัวอักษร + 7 หลัก และหมายเลขเบอร์ซีล (Seal No.)',
  },
  description: {
    key: 'description',
    labelEn: 'Description of Goods',
    labelTh: 'รายละเอียดสินค้า (Description of Goods)',
    category: 'cargo',
    severity: 'critical',
    descriptionTh: 'คำอธิบายสินค้าตรงตาม L/C, Packing List, Invoice และสเปกสินค้า',
  },
  quantity: {
    key: 'quantity',
    labelEn: 'Quantity & Packages',
    labelTh: 'จำนวนและประเภทหีบห่อ (Qty & Kind of Pkgs)',
    category: 'cargo',
    severity: 'critical',
    descriptionTh: 'จำนวนหีบห่อ เช่น 800 CARTONS, 20 PALLETS, 1,200 BAGS',
  },
  gross_weight: {
    key: 'gross_weight',
    labelEn: 'Gross Weight (KGS)',
    labelTh: 'น้ำหนักรวม (Gross Weight KGS)',
    category: 'cargo',
    severity: 'critical',
    descriptionTh: 'น้ำหนักรวมสินค้าและบรรจุภัณฑ์ (KGS) ต้องตรงกับใบชั่ง VGM และเอกสารส่งออก',
  },
  measurement: {
    key: 'measurement',
    labelEn: 'Measurement (CBM)',
    labelTh: 'ปริมาตรสินค้า (Measurement CBM)',
    category: 'cargo',
    severity: 'warning',
    descriptionTh: 'ปริมาตรรวมลูกบาศก์เมตร (CBM / M3)',
  },
  freight_term: {
    key: 'freight_term',
    labelEn: 'Freight Term',
    labelTh: 'เงื่อนไขค่าระวาง (Freight Term)',
    category: 'booking',
    severity: 'critical',
    descriptionTh: 'เงื่อนไขการชำระค่าระวางเรือ: FREIGHT PREPAID (ต้นทางจ่าย) หรือ FREIGHT COLLECT (ปลายทางจ่าย)',
  },
};

export interface CarrierTemplateInfo {
  code: string;
  name: string;
  fullName: string;
  color: string;
  logoText: string;
}

export const CARRIER_LIST: CarrierTemplateInfo[] = [
  { code: 'OOCL', name: 'OOCL', fullName: 'Orient Overseas Container Line', color: '#B91C1C', logoText: 'OOCL' },
  { code: 'ONE', name: 'ONE', fullName: 'Ocean Network Express (Magenta)', color: '#DB2777', logoText: 'ONE' },
  { code: 'WANHAI', name: 'Wan Hai', fullName: 'Wan Hai Lines Ltd.', color: '#0369A1', logoText: 'WHL' },
  { code: 'HAPAG', name: 'Hapag-Lloyd', fullName: 'Hapag-Lloyd AG', color: '#D97706', logoText: 'HL' },
  { code: 'SHANGHAI', name: 'Shanghai Jinjiang', fullName: 'Shanghai Jinjiang Shipping (SJJ)', color: '#047857', logoText: 'SJJ' },
  { code: 'YANGMING', name: 'Yang Ming', fullName: 'Yang Ming Marine Transport', color: '#4F46E5', logoText: 'YML' },
];

export interface ShipperTemplateInfo {
  code: string;
  name: string;
  fullName: string;
  commodityType: string;
}

export const SHIPPER_LIST: ShipperTemplateInfo[] = [
  { code: 'POLYPLEX', name: 'Polyplex (Thailand)', fullName: 'Polyplex (Thailand) Public Co., Ltd.', commodityType: 'Polyester Films' },
  { code: 'BETAGRO', name: 'Betagro', fullName: 'Betagro Public Company Limited', commodityType: 'Frozen Poultry & Meat' },
  { code: 'MCKEY', name: 'McKey Food Services', fullName: 'McKey Food Services (Thailand) Ltd.', commodityType: 'Processed Food & Patties' },
  { code: 'FORTUNE', name: 'Fortune Frozen', fullName: 'Fortune Frozen Foods (Thailand) Co., Ltd.', commodityType: 'Frozen Seafood' },
  { code: 'GC-M', name: 'GC Marketing', fullName: 'GC Marketing Solutions (PTT Group)', commodityType: 'Polymer Resins' },
  { code: 'MITSUI', name: 'Mitsui & Co.', fullName: 'Mitsui & Co. (Thailand) Ltd.', commodityType: 'Chemicals & Minerals' },
  { code: 'BFOODS_1', name: 'Better Foods (BFOODS 1)', fullName: 'Better Foods Co., Ltd. (Betagro Group)', commodityType: 'Agro-industry & Food' },
  { code: 'AJIMOMOTO', name: 'Ajinomoto', fullName: 'Ajinomoto (Thailand) Co., Ltd.', commodityType: 'Food Seasoning & Amino acids' },
  { code: 'SIAMCHAI', name: 'Siam Chai', fullName: 'Siam Chai Steel Co., Ltd.', commodityType: 'Steel & Construction' },
  { code: 'SURAPON', name: 'Surapon Foods', fullName: 'Surapon Foods Public Co., Ltd.', commodityType: 'Frozen Foods' },
  { code: 'PPI', name: 'Pacific Pipe (PPI)', fullName: 'Pacific Pipe Public Co., Ltd.', commodityType: 'Structural Steel Pipes' },
  { code: 'SUPER_SIERRA', name: 'Super Sierra', fullName: 'Super Sierra Marine Co., Ltd.', commodityType: 'Agricultural Products' },
];
