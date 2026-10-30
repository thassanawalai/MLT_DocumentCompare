/**
 * Types for MLT Maritime Document Compare System
 * (SI vs B/L Verification)
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
}

export interface FieldItem {
  value: string;
  bbox?: BoundingBox | BoundingBox[];
  clean_value?: string;
  char_bboxes?: any[];
}

export interface DiffChunk {
  tag: 'equal' | 'delete' | 'insert';
  value: string;
}

export interface DiscrepancyItem {
  field: string;
  fieldNameTh: string;
  fieldNameEn: string;
  category: 'party' | 'routing' | 'cargo' | 'booking' | 'customs';
  severity: 'critical' | 'warning' | 'info';
  isMatch: boolean;
  original_value: {
    value: string;
    clean_value: string;
    diff: DiffChunk[];
    bbox?: BoundingBox | BoundingBox[];
  };
  program_value: {
    value: string;
    clean_value: string;
    diff: DiffChunk[];
    bbox?: BoundingBox | BoundingBox[];
  };
  customNote?: string;
  reviewed?: boolean;
}

export interface ShippingTemplateField {
  anchor_text: string;
  anchor_point: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  offset_x: number;
  offset_y: number;
  width: number;
  height: number;
  page?: number;
}

export interface ShippingTemplate {
  id: string;
  name: string;
  type: 'carrier' | 'shipper';
  fields: Record<string, ShippingTemplateField>;
}

export interface ComparisonScenario {
  id: string;
  title: string;
  titleTh: string;
  description: string;
  shipperCompany: string;
  carrierCompany: string;
  mode: 'MAIN' | 'HBL' | 'MBL';
  siData: Record<string, FieldItem>;
  blData: Record<string, FieldItem>;
  imageSi?: string;
  imageBl?: string;
}

export interface MarkupAnnotation {
  id: string;
  type: 'line' | 'text' | 'stamp';
  xRatio: number;
  yRatio: number;
  text?: string;
  lineWidth?: number;
  color?: string;
}

export interface HSCodeRecord {
  id: number;
  sales: string;
  customerName: string;
  commodity: string;
  hsCode: string;
}

export interface FreetimeRecord {
  id: number;
  carrier: string;
  latKrabang: string;
  laemChabang: string;
  patBangkok: string;
  songkla: string;
  reefer: string;
  remark: string;
  freeTimePlug: string;
  dem2040: string;
  dt2040: string;
  demReefer: string;
  detReefer: string;
}

export interface CustomerRecord {
  id: number;
  name: string;
  country: string;
  status: 'ACTIVE' | 'INACTIVE';
  addresses: {
    type: string;
    raw: string;
    city: string;
    country: string;
    isPrimary: boolean;
  }[];
  contacts: {
    name: string;
    title: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }[];
  banks: {
    name: string;
    branch: string;
    accountNo: string;
    swift: string;
  }[];
  identifiers: {
    type: 'TAX ID' | 'NTN' | 'GSTIN' | 'IEC' | 'BIN' | 'PAN';
    value: string;
  }[];
}
