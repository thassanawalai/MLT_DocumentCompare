export type DiscrepancyBadgeType =
  | 'critical' // ผิดแน่นอนจากเอกสาร
  | 'incomplete_number' // ตัวเลขไม่ครบ
  | 'incomplete_data' // ข้อมูลไม่ครบ
  | 'warning'
  | 'mismatch';

export interface DiscrepancyCardItem {
  id: string;
  order: number;
  title: string;
  badgeText: string;
  badgeType: DiscrepancyBadgeType;
  // For measurement or key-value comparisons
  layoutType: 'table_metric' | 'bullet_list';
  metrics?: {
    label: string;
    value: string;
    subtext?: string;
  }[];
  diffHighlight?: string;
  subnote?: string;
  bullets?: string[];
  explanation?: string;
  // Field reference
  fieldKey?: string;
  category?: 'cargo' | 'party' | 'routing' | 'booking' | 'customs';
  reviewed?: boolean;
}
