import { HerbItem } from '../types';

export const INITIAL_HERBS_DATA: HerbItem[] = [
  {
    id: 'herb-01',
    code: 'HERB-001',
    name: 'ประสะมะแว้ง 200 มิลลิกรัม/เม็ด',
    commonName: 'ประสะมะแว้ง',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'เม็ด',
    defaultPackaging: '100 เม็ด/ขวด',
    minStockAlert: 10,
    storageLocation: 'ตู้ยาแผนไทย A1',
    indications: 'บรรเทาอาการไอ ขับเสมหะ ละลายเสมหะ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-01-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-01-15',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-02',
    code: 'HERB-002',
    name: 'ขมิ้นชัน 500 มิลลิกรัม/แคปซูล',
    commonName: 'ขมิ้นชัน แคปซูล',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 15,
    storageLocation: 'ตู้ยาแผนไทย A1',
    indications: 'บรรเทาอาการท้องอืด ท้องเฟ้อ แน่น จุกเสียด',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-02-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-02-10',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-03',
    code: 'HERB-003',
    name: 'ขิง 500 มิลลิกรัม/เม็ด',
    commonName: 'ขิง เม็ด',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'เม็ด',
    defaultPackaging: '100 เม็ด/ขวด',
    minStockAlert: 10,
    storageLocation: 'ตู้ยาแผนไทย A2',
    indications: 'ป้องกันและบรรเทาอาการคลื่นไส้ อาเจียน ท้องอืด',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-03-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-03-05',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-04',
    code: 'HERB-004',
    name: 'พญายอ สารละลายสำหรับป้ายปาก',
    commonName: 'พญายอ ป้ายปาก',
    category: 'ยาน้ำ/สารละลาย',
    defaultUnit: 'ขวด',
    defaultPackaging: 'ขวด 10 มล.',
    minStockAlert: 10,
    storageLocation: 'ตู้ B1 ชั้น 2',
    indications: 'รักษาแผลในปาก แผลร้อนใน แผลจากเชื้อเริม',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-04-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2025-11-20',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-05',
    code: 'HERB-005',
    name: 'สารสกัดพญายอครีม 5 กรัม',
    commonName: 'พญายอครีม',
    category: 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)',
    defaultUnit: 'หลอด',
    defaultPackaging: 'หลอด 5 กรัม',
    minStockAlert: 15,
    storageLocation: 'ตู้ B1 ชั้น 3',
    indications: 'บรรเทาอาการของโรคเริมและงูสวัด ผื่นคันผิวหนัง',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-05-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-04-12',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-06',
    code: 'HERB-006',
    name: 'ฟ้าทะลายโจร 500 มิลลิกรัม/เม็ด',
    commonName: 'ฟ้าทะลายโจร เม็ด',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'เม็ด',
    defaultPackaging: '100 เม็ด/ขวด',
    minStockAlert: 20,
    storageLocation: 'ตู้ยาแผนไทย A1',
    indications: 'บรรเทาอาการหวัด เจ็บคอ บรรเทาอาการไข้',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-06-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-05-20',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-07',
    code: 'HERB-007',
    name: 'ธาตุอบเชย',
    commonName: 'ธาตุอบเชย ยาน้ำ',
    category: 'ยาน้ำ/สารละลาย',
    defaultUnit: 'ขวด',
    defaultPackaging: 'ขวด 180 มล.',
    minStockAlert: 8,
    storageLocation: 'ชั้นวางยาน้ำ C1',
    indications: 'ขับลมในลำไส้ แก้จุกเสียด แน่นเฟ้อ คลื่นไส้',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-07-1',
        lotNo: '',
        expDate: '', // Near expiry
        packaging: '',
        unitPrice: 0,
        createdAt: '2025-10-15',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-08',
    code: 'HERB-008',
    name: 'ยาแก้ไอมะขามป้อม',
    commonName: 'ยาน้ำแก้ไอมะขามป้อม',
    category: 'ยาน้ำ/สารละลาย',
    defaultUnit: 'ขวด',
    defaultPackaging: 'ขวด 60 มล.',
    minStockAlert: 25,
    storageLocation: 'ชั้นวางยาน้ำ C2',
    indications: 'บรรเทาอาการไอ ขับเสมหะ บรรเทาอาการระคายคอ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-08-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-06-18',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-09',
    code: 'HERB-009',
    name: 'สหัสธารา 500 มิลลิกรัม/เม็ด',
    commonName: 'สหัสธารา',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 10,
    storageLocation: 'ตู้ยาแผนไทย A2',
    indications: 'ขับลมในเส้น แก้อาการปวดเมื่อยกล้ามเนื้อ ชาตามมือเท้า',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-09-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-01-20',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-10',
    code: 'HERB-010',
    name: 'เถาวัลย์เปรียง 500 มิลลิกรัม/เม็ด',
    commonName: 'เถาวัลย์เปรียง',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 15,
    storageLocation: 'ตู้ยาแผนไทย A2',
    indications: 'บรรเทาอาการปวดกล้ามเนื้อ ลดอาการอักเสบของกล้ามเนื้อ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-10-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-04-01',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-11',
    code: 'HERB-011',
    name: 'เพชรสังฆาต',
    commonName: 'เพชรสังฆาต แคปซูล',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 12,
    storageLocation: 'ตู้ยาแผนไทย A3',
    indications: 'บรรเทาอาการริดสีดวงทวารหนัก',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-11-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-03-15',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-12',
    code: 'HERB-012',
    name: 'ยาหอมนวโกฐ',
    commonName: 'ยาหอมนวโกฐ ผง/เม็ด',
    category: 'ยาตำรับแผนไทย',
    defaultUnit: 'กระปุก',
    defaultPackaging: 'กระปุก 15 กรัม',
    minStockAlert: 10,
    storageLocation: 'ตู้ยาตำรับ D1',
    indications: 'แก้ลมวิงเวียน หน้ามืด ตาลาย คลื่นไส้ แก้ลมจุกแน่น',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-12-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-05-10',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-13',
    code: 'HERB-013',
    name: 'ยาหอมเทพจิตร',
    commonName: 'ยาหอมเทพจิตร',
    category: 'ยาตำรับแผนไทย',
    defaultUnit: 'กระปุก',
    defaultPackaging: 'กระปุก 15 กรัม',
    minStockAlert: 10,
    storageLocation: 'ตู้ยาตำรับ D1',
    indications: 'แก้ลมกองละเอียด วิงเวียน หน้ามืด บำรุงดวงจิตให้แช่มชื่น',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-13-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-02-28',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-14',
    code: 'HERB-014',
    name: 'ชาชงรางจืด',
    commonName: 'รางจืด ชาชง',
    category: 'ชาชงสมุนไพร',
    defaultUnit: 'กล่อง',
    defaultPackaging: '20 ซอง/กล่อง',
    minStockAlert: 10,
    storageLocation: 'ชั้นวางชาชง E1',
    indications: 'ถอนพิษไข้ ถอนพิษเบื่อเมา ล้างสารพิษตกค้าง',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-14-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-03-10',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-15',
    code: 'HERB-015',
    name: 'ชาชงกระเจี๊ยบแดง',
    commonName: 'กระเจี๊ยบแดง ชาชง',
    category: 'ชาชงสมุนไพร',
    defaultUnit: 'กล่อง',
    defaultPackaging: '20 ซอง/กล่อง',
    minStockAlert: 10,
    storageLocation: 'ชั้นวางชาชง E1',
    indications: 'ขับปัสสาวะ บรรเทาอาการนิ่วทางเดินปัสสาวะ ดับกระหาย',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-15-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-04-15',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-16',
    code: 'HERB-016',
    name: 'ยาจันทลีลา',
    commonName: 'จันทลีลา แคปซูล/เม็ด',
    category: 'ยาตำรับแผนไทย',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 15,
    storageLocation: 'ตู้ยาตำรับ D2',
    indications: 'บรรเทาอาการไข้ ตัวร้อน ไข้เปลี่ยนฤดู',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-16-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-05-05',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-17',
    code: 'HERB-017',
    name: 'ยาประสะไพล',
    commonName: 'ประสะไพล แคปซูล',
    category: 'ยาตำรับแผนไทย',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 12,
    storageLocation: 'ตู้ยาตำรับ D2',
    indications: 'แก้ระดูไม่สม่ำเสมอ หรือมาไม่เป็นปกติ บรรเทาอาการปวดประจำเดือน',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-17-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-04-10',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-18',
    code: 'HERB-018',
    name: 'ยาปราบชมพูทวีป',
    commonName: 'ปราบชมพูทวีป แคปซูล',
    category: 'ยาตำรับแผนไทย',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 10,
    storageLocation: 'ตู้ยาตำรับ D3',
    indications: 'บรรเทาอาการหวัด ภูมิแพ้อากาศ มีน้ำมูก คัดจมูก',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-18-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-03-20',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-19',
    code: 'HERB-019',
    name: 'ยาพอกเข่า',
    commonName: 'สมุนไพรพอกเข่า',
    category: 'ยาสมุนไพรประคบ/อบ/พอก',
    defaultUnit: 'ถุง',
    defaultPackaging: 'ถุง 500 กรัม',
    minStockAlert: 10,
    storageLocation: 'ห้องหัตถการแพทย์แผนไทย F1',
    indications: 'บรรเทาอาการปวด บวม อักเสบจากโรคข้อเข่าเสื่อม',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-19-1',
        lotNo: '',
        expDate: '', // Near expiry
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-05-15',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-20',
    code: 'HERB-020',
    name: 'น้ำมันกระดูกไก่ดำขัดมอญ',
    commonName: 'น้ำมันกระดูกไก่ดำ',
    category: 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)',
    defaultUnit: 'ขวด',
    defaultPackaging: 'ขวด 30 มล.',
    minStockAlert: 12,
    storageLocation: 'ตู้ B2 ชั้น 1',
    indications: 'ทาถูนวด บรรเทาอาการอัมพฤกษ์ ปวดเมื่อยตามร่างกาย ฟกช้ำ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-20-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-02-15',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-21',
    code: 'HERB-021',
    name: 'ยาหม่องไพล',
    commonName: 'ยาหม่องไพล',
    category: 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)',
    defaultUnit: 'ขวด',
    defaultPackaging: 'ขวด 50 กรัม',
    minStockAlert: 20,
    storageLocation: 'ตู้ B2 ชั้น 2',
    indications: 'ทาถูนวด บรรเทาอาการปวดเมื่อย เคล็ดขัดยอก แมลงสัตว์กัดต่อย',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-21-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-06-01',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-22',
    code: 'HERB-022',
    name: 'ลูกประคบสมุนไพร',
    commonName: 'ลูกประคบสมุนไพรสด/แห้ง',
    category: 'ยาสมุนไพรประคบ/อบ/พอก',
    defaultUnit: 'ลูก',
    defaultPackaging: 'ลูก (200 กรัม)',
    minStockAlert: 15,
    storageLocation: 'ห้องหัตถการแพทย์แผนไทย F2',
    indications: 'นึ่งประคบบรรเทาอาการปวดเมื่อย คลายกล้ามเนื้อ บวม ช้ำ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-22-1',
        lotNo: '',
        expDate: '', // Near expiry
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-05-10',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-23',
    code: 'HERB-023',
    name: 'ยาอบสมุนไพร',
    commonName: 'สมุนไพรสำหรับอบตัว',
    category: 'ยาสมุนไพรประคบ/อบ/พอก',
    defaultUnit: 'ถุง',
    defaultPackaging: 'ถุง 250 กรัม',
    minStockAlert: 10,
    storageLocation: 'ห้องหัตถการแพทย์แผนไทย F2',
    indications: 'อบตัวเพื่อผ่อนคลายกล้ามเนื้อ ขับเหงื่อ ช่วยการไหลเวียนเลือด',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-23-1',
        lotNo: '',
        expDate: '', // Near expiry
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-04-15',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-24',
    code: 'HERB-024',
    name: 'สเปรย์น้ำมันไพล',
    commonName: 'สเปรย์ไพล',
    category: 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)',
    defaultUnit: 'ขวด',
    defaultPackaging: 'ขวด 60 มล.',
    minStockAlert: 15,
    storageLocation: 'ตู้ B2 ชั้น 3',
    indications: 'ฉีดพ่นบรรเทาอาการปวดเมื่อยกล้ามเนื้อ เคล็ดขัดยอก',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-24-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-06-10',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-25',
    code: 'HERB-025',
    name: 'น้ำมันไพล',
    commonName: 'น้ำมันไพล นวดคลายเส้น',
    category: 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)',
    defaultUnit: 'ขวด',
    defaultPackaging: 'ขวด 60 มล.',
    minStockAlert: 15,
    storageLocation: 'ตู้ B2 ชั้น 3',
    indications: 'ทาถูนวด บรรเทาอาการเคล็ดขัดยอก ปวดฟกช้ำ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-25-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-05-18',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-26',
    code: 'HERB-026',
    name: 'เจลว่านหางจระเข้',
    commonName: 'ว่านหางจระเข้ เจล',
    category: 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)',
    defaultUnit: 'หลอด',
    defaultPackaging: 'หลอด 30 กรัม',
    minStockAlert: 12,
    storageLocation: 'ตู้ B3 ชั้น 1',
    indications: 'รักษาแผลไฟไหม้ น้ำร้อนลวก บำรุงผิวไหม้แดด',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-26-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-04-10',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-27',
    code: 'HERB-027',
    name: 'ชาชงดอกคำฝอย',
    commonName: 'คำฝอย ชาชง',
    category: 'ชาชงสมุนไพร',
    defaultUnit: 'กล่อง',
    defaultPackaging: '20 ซอง/กล่อง',
    minStockAlert: 10,
    storageLocation: 'ชั้นวางชาชง E2',
    indications: 'ลดไขมันในเลือด บำรุงโลหิต ขับเหงื่อ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-27-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-03-25',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-28',
    code: 'HERB-028',
    name: 'ชาชงหญ้าดอกขาว',
    commonName: 'หญ้าดอกขาว ชาชง',
    category: 'ชาชงสมุนไพร',
    defaultUnit: 'กล่อง',
    defaultPackaging: '20 ซอง/กล่อง',
    minStockAlert: 12,
    storageLocation: 'ชั้นวางชาชง E2',
    indications: 'ช่วยลดความอยากบุหรี่ ขับปัสสาวะ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-28-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-02-15',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-29',
    code: 'HERB-029',
    name: 'ธรณีสัณฑะฆาต',
    commonName: 'ธรณีสัณฑะฆาต แคปซูล',
    category: 'ยาตำรับแผนไทย',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 10,
    storageLocation: 'ตู้ยาตำรับ D3',
    indications: 'แก้กษัยเส้น เถาดาน ท้องผูก ขับลมในลำไส้',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-29-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-01-10',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-30',
    code: 'HERB-030',
    name: 'น้ำมันหม่อง/พิมเสนน้ำ',
    commonName: 'พิมเสนน้ำ',
    category: 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)',
    defaultUnit: 'ขวด',
    defaultPackaging: 'ขวดลูกกลิ้ง 8 มล.',
    minStockAlert: 20,
    storageLocation: 'ตู้ B3 ชั้น 2',
    indications: 'ดมทา บรรเทาอาการวิงเวียน หน้ามืด คัดจมูกเนื่องจากหวัด',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-30-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-06-05',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-31',
    code: 'HERB-031',
    name: 'ชาชงขิง',
    commonName: 'ขิง ชาชง',
    category: 'ชาชงสมุนไพร',
    defaultUnit: 'กล่อง',
    defaultPackaging: '20 ซอง/กล่อง',
    minStockAlert: 10,
    storageLocation: 'ชั้นวางชาชง E3',
    indications: 'บรรเทาอาการท้องอืด ท้องเฟ้อ ขับลม บรรเทาอาการหวัด',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-31-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-04-05',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-32',
    code: 'HERB-032',
    name: 'ยาประสะน้ำนม',
    commonName: 'ประสะน้ำนม แคปซูล',
    category: 'ยาตำรับแผนไทย',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 8,
    storageLocation: 'ตู้ยาตำรับ D4',
    indications: 'บำรุงน้ำนมมารดาหลังคลอด ช่วยเพิ่มการหลั่งน้ำนม',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-32-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-03-18',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-33',
    code: 'HERB-033',
    name: 'ชาชงชุมเห็ดเทศ',
    commonName: 'ชุมเห็ดเทศ ชาชง',
    category: 'ชาชงสมุนไพร',
    defaultUnit: 'กล่อง',
    defaultPackaging: '20 ซอง/กล่อง',
    minStockAlert: 10,
    storageLocation: 'ชั้นวางชาชง E3',
    indications: 'แก้ท้องผูก เป็นยาระบายอ่อนๆ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-33-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-02-20',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-34',
    code: 'HERB-034',
    name: 'ครีมไพล',
    commonName: 'ครีมไพล บรรเทาปวด',
    category: 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)',
    defaultUnit: 'หลอด',
    defaultPackaging: 'หลอด 30 กรัม',
    minStockAlert: 20,
    storageLocation: 'ตู้ B3 ชั้น 3',
    indications: 'ทาบรรเทาอาการปวด บวม อักเสบของกล้ามเนื้อ ข้อต่อ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-34-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-05-12',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-35',
    code: 'HERB-035',
    name: 'ยาอมประสะมะแว้ง 200 มก.',
    commonName: 'ยาอมประสะมะแว้ง',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'ซอง',
    defaultPackaging: 'ซอง 20 เม็ด',
    minStockAlert: 25,
    storageLocation: 'ตู้ยาแผนไทย A3',
    indications: 'อมแก้ไอ ขับเสมหะ บรรเทาอาการระคายคอ ชุ่มคอ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-35-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-06-15',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-36',
    code: 'HERB-036',
    name: 'ยามะระขี้นก',
    commonName: 'มะระขี้นก แคปซูล',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 10,
    storageLocation: 'ตู้ยาแผนไทย A4',
    indications: 'แก้ไข้ ร้อนใน บรรเทาอาการโรคเบาหวาน เจริญอาหาร',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-36-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-03-01',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-37',
    code: 'HERB-037',
    name: 'สมุนไพรกระเทียม แคปซูล',
    commonName: 'กระเทียม แคปซูล',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 12,
    storageLocation: 'ตู้ยาแผนไทย A4',
    indications: 'ลดระดับไขมันและคอเลสเตอรอลในเลือด บำรุงหลอดเลือด',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-37-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-04-20',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-38',
    code: 'HERB-038',
    name: 'ยาไพลเจล',
    commonName: 'ไพลเจล',
    category: 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)',
    defaultUnit: 'หลอด',
    defaultPackaging: 'หลอด 30 กรัม',
    minStockAlert: 15,
    storageLocation: 'ตู้ B3 ชั้น 3',
    indications: 'เจลสูตรเย็น ซึมเร็ว บรรเทาอาการปวดกล้ามเนื้อ ฟกช้ำ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-38-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-05-25',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-39',
    code: 'HERB-039',
    name: 'ยามะขามแขก',
    commonName: 'มะขามแขก แคปซูล/ใบต้ม',
    category: 'ยารับประทาน (เม็ด/แคปซูล)',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 15,
    storageLocation: 'ตู้ยาแผนไทย A4',
    indications: 'บรรเทาอาการท้องผูก เป็นยาระบาย',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-39-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-04-15',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-40',
    code: 'HERB-040',
    name: 'ยาบำรุงโลหิต',
    commonName: 'ยาบำรุงโลหิต ตำรับ',
    category: 'ยาตำรับแผนไทย',
    defaultUnit: 'แคปซูล',
    defaultPackaging: '100 แคปซูล/ขวด',
    minStockAlert: 10,
    storageLocation: 'ตู้ยาตำรับ D4',
    indications: 'บำรุงโลหิต บรรเทาอาการวิงเวียน อ่อนเพลีย เลือดลมไม่ปกติ',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-40-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-03-10',
        transactions: []
      }
    ]
  },
  {
    id: 'herb-41',
    code: 'HERB-041',
    name: 'ยาศุขไสยาศน์',
    commonName: 'ศุขไสยาศน์ ตำรับ',
    category: 'ยาตำรับแผนไทย',
    defaultUnit: 'ซอง',
    defaultPackaging: 'ซอง 2 กรัม (10 ซอง/กล่อง)',
    minStockAlert: 10,
    storageLocation: 'ตู้ยาควบคุมพิเศษ E4',
    indications: 'ช่วยให้นอนหลับ เจริญอาหาร ฟื้นฟูกำลัง',
    updatedAt: Date.now(),
    lots: [
      {
        id: 'lot-41-1',
        lotNo: '',
        expDate: '',
        packaging: '',
        unitPrice: 0,
        createdAt: '2026-05-15',
        transactions: []
      }
    ]
  }
];
