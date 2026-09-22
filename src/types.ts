export interface StockTransaction {
  id: string;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  broughtForward: number; // ยกมา
  received: number; // รับใหม่
  dispensed: number; // จ่าย
  balance: number; // คงเหลือ
  requesterOrDispenser: string; // ผู้เบิก / ผู้จ่าย
  note?: string;
  timestamp: number;
}

export interface StockCardLot {
  id: string;
  lotNo: string; // e.g. "LOT-670102"
  mfgDate?: string; // วันที่ผลิต (YYYY-MM-DD)
  expDate: string; // วันหมดอายุ (YYYY-MM-DD)
  packaging: string; // ขนาดบรรจุ เช่น "100 เม็ด/ขวด", "60 แคปซูล/ขวด", "1 หลอด (5 กรัม)"
  unitPrice: number; // ราคาต่อหน่วยบรรจุ (บาท)
  supplierOrManufacturer?: string; // แหล่งผลิต / ผู้ผลิต / ผู้จัดส่ง เช่น "ฝ่ายผลิตยาสมุนไพร รพ.", "องค์การเภสัชกรรม (อภ.)"
  createdAt: string;
  transactions: StockTransaction[];
  isArchived?: boolean;
  notes?: string;
}

export type HerbCategory = 
  | 'ยารับประทาน (เม็ด/แคปซูล)'
  | 'ยาน้ำ/สารละลาย'
  | 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)'
  | 'ชาชงสมุนไพร'
  | 'ยาสมุนไพรประคบ/อบ/พอก'
  | 'ยาตำรับแผนไทย';

export interface HerbItem {
  id: string;
  code?: string;
  name: string; // ชื่อสมุนไพร เช่น "ประสะมะแว้ง 200 มิลลิกรัม/เม็ด"
  commonName?: string; // ชื่อสามัญ เช่น "ประสะมะแว้ง"
  category: HerbCategory;
  defaultUnit: string; // เม็ด, แคปซูล, ขวด, ซอง, หลอด, กระปุก, ลูก
  defaultPackaging: string; // เช่น "100 เม็ด/ขวด"
  minStockAlert: number; // เตือนเมื่อสต๊อกต่ำกว่า (หน่วยบรรจุ)
  storageLocation?: string; // สถานที่เก็บ เช่น "ตู้ A1", "ห้องเก็บยาอุณหภูมิห้อง"
  indications?: string; // สรรพคุณ / ข้อบ่งใช้
  lots: StockCardLot[];
  activeLotId?: string;
  updatedAt: number;
}

export interface StockSummaryStats {
  totalHerbs: number;
  totalLots: number;
  totalItemsInStock: number;
  lowStockCount: number;
  expiringCount: number;
  expiredCount: number;
}

export type ViewFilter = 'all' | 'low-stock' | 'expiring' | 'expired';

export interface RequisitionItem {
  id: string;
  herbId: string;
  herbName: string;
  category?: string;
  lotId: string;
  lotNo: string;
  expDate: string;
  availableStock: number;
  requestedQty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  note?: string;
}

export interface RequisitionSlip {
  id: string;
  slipNumber: string; // e.g. "REQ-2569-001"
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  department: string; // หน่วยงาน/แผนกที่ขอเบิก
  requesterName: string; // ผู้ขอเบิก
  requesterPosition?: string; // ตำแหน่ง
  dispenserName: string; // ผู้จ่ายยา (เภสัชกร/เจ้าหน้าที่คลัง)
  receiverName: string; // ผู้รับยา
  approverName: string; // ผู้อนุมัติ (หัวหน้ากลุ่มงาน)
  purpose: string; // วัตถุประสงค์
  urgency?: 'ปกติ' | 'ด่วน' | 'ด่วนที่สุด';
  status: 'draft' | 'approved' | 'dispensed';
  items: RequisitionItem[];
  totalQuantity: number;
  totalValue: number;
  createdAt: number;
}

