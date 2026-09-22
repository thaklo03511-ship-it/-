import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { HerbCategory, HerbItem, StockCardLot, StockSummaryStats, StockTransaction } from '../types';

export const STORAGE_KEY = 'thai_herb_stock_cards_v3_clean_start';

/**
 * Calculates current remaining balance for a specific lot.
 * If transactions exist, takes the balance of the latest transaction.
 */
export function getLotBalance(lot: StockCardLot): number {
  if (!lot.transactions || lot.transactions.length === 0) return 0;
  return lot.transactions[lot.transactions.length - 1].balance;
}

/**
 * Calculates total stock across all active lots of an herb.
 */
export function getHerbTotalStock(herb: HerbItem): number {
  return herb.lots.reduce((sum, lot) => {
    if (lot.isArchived) return sum;
    return sum + getLotBalance(lot);
  }, 0);
}

/**
 * Get active (or newest) lot of an herb
 */
export function getActiveLot(herb: HerbItem): StockCardLot | undefined {
  if (herb.activeLotId) {
    const found = herb.lots.find(l => l.id === herb.activeLotId);
    if (found) return found;
  }
  // Return first unarchived lot or first lot
  return herb.lots.find(l => !l.isArchived) || herb.lots[0];
}

/**
 * Expiry status helper
 */
export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'good';

export function getExpiryStatus(expDateStr: string): {
  status: ExpiryStatus;
  daysRemaining: number;
  label: string;
  badgeClass: string;
} {
  if (!expDateStr) {
    return {
      status: 'good',
      daysRemaining: 9999,
      label: 'ไม่ระบุ',
      badgeClass: 'bg-slate-100 text-slate-700',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const exp = new Date(expDateStr);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining,
      label: `หมดอายุแล้ว (${Math.abs(daysRemaining)} วัน)`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    };
  } else if (daysRemaining <= 30) {
    return {
      status: 'critical',
      daysRemaining,
      label: `ใกล้หมดอายุใน ${daysRemaining} วัน`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  } else if (daysRemaining <= 90) {
    return {
      status: 'warning',
      daysRemaining,
      label: `หมดอายุในอีก ${daysRemaining} วัน`,
      badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    };
  }

  return {
    status: 'good',
    daysRemaining,
    label: `ปกติ (${formatDateThai(expDateStr)})`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

/**
 * Format date to Thai readable format
 * e.g. "2026-09-21" -> "21/09/2569" (or Thai year +543)
 */
export function formatDateThai(dateStr: string, useThaiYear = true): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parts[1];
      const day = parts[2];
      const displayYear = useThaiYear && year < 2500 ? year + 543 : year;
      return `${day}/${month}/${displayYear}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Calculate Summary Stats
 */
export function calculateStockStats(herbs: HerbItem[]): StockSummaryStats {
  let totalLots = 0;
  let totalItemsInStock = 0;
  let lowStockCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;

  herbs.forEach(herb => {
    const totalStock = getHerbTotalStock(herb);
    totalItemsInStock += totalStock;

    if (totalStock <= herb.minStockAlert) {
      lowStockCount++;
    }

    herb.lots.forEach(lot => {
      if (!lot.isArchived) {
        totalLots++;
        const exp = getExpiryStatus(lot.expDate);
        if (exp.status === 'expired') {
          expiredCount++;
        } else if (exp.status === 'critical' || exp.status === 'warning') {
          expiringCount++;
        }
      }
    });
  });

  return {
    totalHerbs: herbs.length,
    totalLots,
    totalItemsInStock,
    lowStockCount,
    expiringCount,
    expiredCount,
  };
}

/**
 * Helper to trigger browser download
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * 1. Export current stock data as CSV file for local backup (Summary & Lot Balances)
 * Includes UTF-8 BOM (\uFEFF) so Thai text opens seamlessly in Microsoft Excel
 */
export function exportStockToCSV(herbs: HerbItem[]): void {
  exportStockSummaryCSV(herbs);
}

export function exportStockSummaryCSV(herbs: HerbItem[]): void {
  const headers = [
    'ลำดับ',
    'รหัสสมุนไพร',
    'ชื่อยาสมุนไพร',
    'ชื่อสามัญ/ชื่อทางยา',
    'หมวดหมู่',
    'ขนาดบรรจุ',
    'หน่วยนับ',
    'ราคาต่อหน่วยบรรจุ(บาท)',
    'Lot.No',
    'วันที่เปิดล็อต',
    'วันหมดอายุ (Exp.date)',
    'สถานะวันหมดอายุ',
    'ยอดยกมาล็อต',
    'ยอดรับรวม',
    'ยอดจ่ายรวม',
    'ยอดคงเหลือปัจจุบัน',
    'มูลค่าคงเหลือ(บาท)',
    'เกณฑ์เตือนสต๊อกต่ำ',
    'สถานะสต๊อก',
    'สถานที่จัดเก็บ',
    'สรรพคุณ/ข้อบ่งใช้',
    'จำนวนรายการเคลื่อนไหว'
  ];

  const rows: string[][] = [];
  let index = 1;

  herbs.forEach(herb => {
    herb.lots.forEach(lot => {
      const balance = getLotBalance(lot);
      const exp = getExpiryStatus(lot.expDate);
      const stockStatus = balance <= herb.minStockAlert ? 'สต๊อกต่ำ' : 'ปกติ';

      let totalIn = 0;
      let totalOut = 0;
      let initialBrought = 0;

      if (lot.transactions && lot.transactions.length > 0) {
        initialBrought = lot.transactions[0].broughtForward || 0;
        lot.transactions.forEach(t => {
          totalIn += (t.received || 0);
          totalOut += (t.dispensed || 0);
        });
      }

      const totalValue = balance * (lot.unitPrice || 0);

      rows.push([
        String(index++),
        `"${herb.code || '-'}"`,
        `"${(herb.name || '').replace(/"/g, '""')}"`,
        `"${(herb.commonName || '').replace(/"/g, '""')}"`,
        `"${herb.category}"`,
        `"${lot.packaging || herb.defaultPackaging}"`,
        `"${herb.defaultUnit}"`,
        `"${lot.unitPrice || 0}"`,
        `"${lot.lotNo}"`,
        `"${formatDateThai(lot.createdAt || '')}"`,
        `"${formatDateThai(lot.expDate)}"`,
        `"${exp.label}"`,
        `"${initialBrought}"`,
        `"${totalIn}"`,
        `"${totalOut}"`,
        `"${balance}"`,
        `"${totalValue.toFixed(2)}"`,
        `"${herb.minStockAlert}"`,
        `"${stockStatus}"`,
        `"${(herb.storageLocation || '-').replace(/"/g, '""')}"`,
        `"${(herb.indications || '-').replace(/"/g, '""')}"`,
        `"${lot.transactions ? lot.transactions.length : 0}"`
      ]);
    });
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `StockCard_สมุนไพร_ยอดคงเหลือ_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * 2. Export detailed stock ledger & transactions movement CSV
 * Contains all recorded receipts, dispenses, and balances for auditing & backup
 */
export function exportStockTransactionsCSV(herbs: HerbItem[]): void {
  const headers = [
    'ลำดับ',
    'วัน เดือน ปี',
    'รหัสสมุนไพร',
    'ชื่อยาสมุนไพร',
    'หมวดหมู่',
    'Lot.No',
    'วันหมดอายุล็อต',
    'ประเภทย่อย',
    'ยอดยกมา',
    'รับใหม่',
    'จ่าย',
    'ยอดคงเหลือ',
    'หน่วยนับ',
    'ผู้เบิก / ผู้จ่าย',
    'หมายเหตุ',
    'ขนาดบรรจุ',
    'ราคาต่อหน่วย(บาท)'
  ];

  const rows: string[][] = [];
  let index = 1;

  herbs.forEach(herb => {
    herb.lots.forEach(lot => {
      if (lot.transactions) {
        lot.transactions.forEach(tx => {
          let txType = 'ยอดยกมา';
          if (tx.received > 0) txType = 'รับเข้า';
          else if (tx.dispensed > 0) txType = 'เบิกจ่าย';

          rows.push([
            String(index++),
            `"${formatDateThai(tx.date)}"`,
            `"${herb.code || '-'}"`,
            `"${(herb.name || '').replace(/"/g, '""')}"`,
            `"${herb.category}"`,
            `"${lot.lotNo}"`,
            `"${formatDateThai(lot.expDate)}"`,
            `"${txType}"`,
            `"${tx.broughtForward}"`,
            `"${tx.received > 0 ? tx.received : ''}"`,
            `"${tx.dispensed > 0 ? tx.dispensed : ''}"`,
            `"${tx.balance}"`,
            `"${herb.defaultUnit}"`,
            `"${(tx.requesterOrDispenser || '').replace(/"/g, '""')}"`,
            `"${(tx.note || '').replace(/"/g, '""')}"`,
            `"${lot.packaging || herb.defaultPackaging}"`,
            `"${lot.unitPrice || 0}"`
          ]);
        });
      }
    });
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `StockCard_สมุนไพร_ประวัติรับจ่าย_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * 3. Export Single Herb Stock Card CSV
 */
export function exportSingleHerbStockCardCSV(herb: HerbItem, lotId?: string): void {
  const lot = lotId ? herb.lots.find(l => l.id === lotId) || herb.lots[0] : herb.lots[0];
  if (!lot) return;

  const headers = [
    'วัน เดือน ปี',
    'ยอดยกมา',
    'รับใหม่',
    'จ่าย',
    'คงเหลือ',
    'ผู้เบิก / ผู้จ่าย',
    'หมายเหตุ'
  ];

  const metaRows = [
    `"ชื่อยาสมุนไพร: ${herb.name}"`,
    `"Lot.No: ${lot.lotNo}"`,
    `"วันหมดอายุ (Exp.date): ${formatDateThai(lot.expDate)}"`,
    `"ขนาดบรรจุ: ${lot.packaging || herb.defaultPackaging}"`,
    `"ราคาต่อหน่วยบรรจุ: ${lot.unitPrice || 0} บาท"`,
    `"ยอดคงเหลือปัจจุบัน: ${getLotBalance(lot)} ${herb.defaultUnit}"`,
    ''
  ];

  const txRows = (lot.transactions || []).map(tx => [
    `"${formatDateThai(tx.date)}"`,
    `"${tx.broughtForward}"`,
    `"${tx.received > 0 ? tx.received : ''}"`,
    `"${tx.dispensed > 0 ? tx.dispensed : ''}"`,
    `"${tx.balance}"`,
    `"${(tx.requesterOrDispenser || '').replace(/"/g, '""')}"`,
    `"${(tx.note || '').replace(/"/g, '""')}"`
  ].join(','));

  const content = '\uFEFF' + metaRows.join('\r\n') + '\r\n' + headers.join(',') + '\r\n' + txRows.join('\r\n');
  const safeName = herb.name.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
  downloadFile(content, `StockCard_${safeName}_Lot_${lot.lotNo}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export JSON backup
 */
export function exportJSONBackup(herbs: HerbItem[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(herbs, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `herb_stock_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * =====================================================================
 * WAREHOUSE STRUCTURE & EXECUTIVE INVENTORY REPORT ANALYTICS
 * =====================================================================
 */

export interface CategoryValuation {
  category: HerbCategory;
  herbCount: number;
  lotCount: number;
  totalUnits: number;
  totalValue: number;
  percentageValue: number;
  lowStockCount: number;
  expiringCount: number;
}

export interface StorageLocationGroup {
  locationName: string;
  zone: string;
  herbCount: number;
  lotCount: number;
  totalUnits: number;
  totalValue: number;
  items: {
    herbId: string;
    code?: string;
    name: string;
    category: HerbCategory;
    packaging: string;
    unit: string;
    lotNo: string;
    expDate: string;
    balance: number;
    unitPrice: number;
    totalValue: number;
    status: 'normal' | 'low-stock' | 'expiring' | 'expired';
    indications?: string;
  }[];
}

export interface RiskAuditReport {
  expiredLots: {
    herbName: string;
    code?: string;
    lotNo: string;
    expDate: string;
    balance: number;
    unitPrice: number;
    totalValue: number;
    location: string;
    daysOverdue: number;
  }[];
  criticalLots: {
    herbName: string;
    code?: string;
    lotNo: string;
    expDate: string;
    balance: number;
    unitPrice: number;
    totalValue: number;
    location: string;
    daysRemaining: number;
  }[];
  warningLots: {
    herbName: string;
    code?: string;
    lotNo: string;
    expDate: string;
    balance: number;
    unitPrice: number;
    totalValue: number;
    location: string;
    daysRemaining: number;
  }[];
  lowStockHerbs: {
    herbName: string;
    code?: string;
    category: string;
    currentStock: number;
    minAlert: number;
    unit: string;
    location: string;
    shortage: number;
    suggestedReorder: number;
  }[];
  totalValueAtRisk: number;
}

/**
 * Calculate financial inventory valuation broken down by Category
 */
export function calculateCategoryValuations(herbs: HerbItem[]): {
  categories: CategoryValuation[];
  grandTotalValue: number;
  grandTotalUnits: number;
  grandTotalLots: number;
} {
  let grandTotalValue = 0;
  let grandTotalUnits = 0;
  let grandTotalLots = 0;

  const map = new Map<HerbCategory, {
    herbCount: number;
    lotCount: number;
    totalUnits: number;
    totalValue: number;
    lowStockCount: number;
    expiringCount: number;
  }>();

  herbs.forEach(herb => {
    const totalStock = getHerbTotalStock(herb);
    const isLowStock = totalStock <= herb.minStockAlert;
    
    let catEntry = map.get(herb.category);
    if (!catEntry) {
      catEntry = {
        herbCount: 0,
        lotCount: 0,
        totalUnits: 0,
        totalValue: 0,
        lowStockCount: 0,
        expiringCount: 0,
      };
      map.set(herb.category, catEntry);
    }

    catEntry.herbCount += 1;
    if (isLowStock) catEntry.lowStockCount += 1;

    herb.lots.forEach(lot => {
      const balance = getLotBalance(lot);
      const val = balance * (lot.unitPrice || 0);
      const exp = getExpiryStatus(lot.expDate);

      catEntry.lotCount += 1;
      catEntry.totalUnits += balance;
      catEntry.totalValue += val;

      if (exp.status === 'critical' || exp.status === 'expired' || exp.status === 'warning') {
        catEntry.expiringCount += 1;
      }

      grandTotalUnits += balance;
      grandTotalValue += val;
      grandTotalLots += 1;
    });
  });

  const categories: CategoryValuation[] = Array.from(map.entries()).map(([category, data]) => {
    return {
      category,
      herbCount: data.herbCount,
      lotCount: data.lotCount,
      totalUnits: data.totalUnits,
      totalValue: data.totalValue,
      percentageValue: grandTotalValue > 0 ? (data.totalValue / grandTotalValue) * 100 : 0,
      lowStockCount: data.lowStockCount,
      expiringCount: data.expiringCount,
    };
  }).sort((a, b) => b.totalValue - a.totalValue);

  return {
    categories,
    grandTotalValue,
    grandTotalUnits,
    grandTotalLots,
  };
}

/**
 * Determine Zone from location name for warehouse hierarchy
 */
function getZoneFromLocation(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes('a1') || loc.includes('a2') || loc.includes('a3') || loc.includes('a4') || loc.includes('a5')) {
    return 'โซน A: ตู้ยาเม็ดและแคปซูลแผนไทย';
  }
  if (loc.includes('b1') || loc.includes('b2') || loc.includes('b3') || loc.includes('ภายนอก')) {
    return 'โซน B: ชั้นเก็บยาใช้ภายนอก/น้ำมัน/ขี้ผึ้ง';
  }
  if (loc.includes('c1') || loc.includes('c2') || loc.includes('ชาชง')) {
    return 'โซน C: ชั้นเก็บชาชงสมุนไพร';
  }
  if (loc.includes('d1') || loc.includes('d2') || loc.includes('ยาน้ำ') || loc.includes('ยาผง')) {
    return 'โซน D: ตู้เก็บยาน้ำและยาผงแผนไทย';
  }
  if (loc.includes('e1') || loc.includes('ประคบ') || loc.includes('อบ')) {
    return 'โซน E: ห้องเก็บยาสมุนไพรประคบ/อบ/พอก';
  }
  return 'โซนทั่วไป: คลังเวชภัณฑ์แพทย์แผนไทย';
}

/**
 * Calculate Warehouse Storage Location Hierarchy
 */
export function calculateStorageHierarchy(herbs: HerbItem[]): StorageLocationGroup[] {
  const map = new Map<string, StorageLocationGroup>();

  herbs.forEach(herb => {
    const locName = herb.storageLocation?.trim() || 'ไม่ระบุสถานที่เก็บ';
    let group = map.get(locName);

    if (!group) {
      group = {
        locationName: locName,
        zone: getZoneFromLocation(locName),
        herbCount: 0,
        lotCount: 0,
        totalUnits: 0,
        totalValue: 0,
        items: [],
      };
      map.set(locName, group);
    }

    group.herbCount += 1;

    herb.lots.forEach(lot => {
      const balance = getLotBalance(lot);
      const val = balance * (lot.unitPrice || 0);
      const exp = getExpiryStatus(lot.expDate);
      
      let status: 'normal' | 'low-stock' | 'expiring' | 'expired' = 'normal';
      if (exp.status === 'expired') status = 'expired';
      else if (exp.status === 'critical') status = 'expiring';
      else if (balance <= herb.minStockAlert) status = 'low-stock';

      group.lotCount += 1;
      group.totalUnits += balance;
      group.totalValue += val;

      group.items.push({
        herbId: herb.id,
        code: herb.code,
        name: herb.name,
        category: herb.category,
        packaging: lot.packaging || herb.defaultPackaging,
        unit: herb.defaultUnit,
        lotNo: lot.lotNo,
        expDate: lot.expDate,
        balance,
        unitPrice: lot.unitPrice || 0,
        totalValue: val,
        status,
        indications: herb.indications,
      });
    });
  });

  return Array.from(map.values()).sort((a, b) => a.locationName.localeCompare(b.locationName, 'th'));
}

/**
 * Calculate Risk Audit & Reorder Recommendations (FEFO & Low stock)
 */
export function calculateRiskAudit(herbs: HerbItem[]): RiskAuditReport {
  const expiredLots: RiskAuditReport['expiredLots'] = [];
  const criticalLots: RiskAuditReport['criticalLots'] = [];
  const warningLots: RiskAuditReport['warningLots'] = [];
  const lowStockHerbs: RiskAuditReport['lowStockHerbs'] = [];
  let totalValueAtRisk = 0;

  herbs.forEach(herb => {
    const totalStock = getHerbTotalStock(herb);
    if (totalStock <= herb.minStockAlert) {
      const shortage = herb.minStockAlert - totalStock;
      lowStockHerbs.push({
        herbName: herb.name,
        code: herb.code,
        category: herb.category,
        currentStock: totalStock,
        minAlert: herb.minStockAlert,
        unit: herb.defaultUnit,
        location: herb.storageLocation || 'ไม่ระบุ',
        shortage,
        suggestedReorder: Math.max(herb.minStockAlert * 2, shortage + 20),
      });
    }

    herb.lots.forEach(lot => {
      const balance = getLotBalance(lot);
      if (balance <= 0) return;

      const exp = getExpiryStatus(lot.expDate);
      const val = balance * (lot.unitPrice || 0);

      if (exp.status === 'expired') {
        totalValueAtRisk += val;
        expiredLots.push({
          herbName: herb.name,
          code: herb.code,
          lotNo: lot.lotNo,
          expDate: lot.expDate,
          balance,
          unitPrice: lot.unitPrice || 0,
          totalValue: val,
          location: herb.storageLocation || 'ไม่ระบุ',
          daysOverdue: Math.abs(exp.daysRemaining),
        });
      } else if (exp.status === 'critical') {
        totalValueAtRisk += val;
        criticalLots.push({
          herbName: herb.name,
          code: herb.code,
          lotNo: lot.lotNo,
          expDate: lot.expDate,
          balance,
          unitPrice: lot.unitPrice || 0,
          totalValue: val,
          location: herb.storageLocation || 'ไม่ระบุ',
          daysRemaining: exp.daysRemaining,
        });
      } else if (exp.status === 'warning') {
        warningLots.push({
          herbName: herb.name,
          code: herb.code,
          lotNo: lot.lotNo,
          expDate: lot.expDate,
          balance,
          unitPrice: lot.unitPrice || 0,
          totalValue: val,
          location: herb.storageLocation || 'ไม่ระบุ',
          daysRemaining: exp.daysRemaining,
        });
      }
    });
  });

  return {
    expiredLots: expiredLots.sort((a, b) => b.daysOverdue - a.daysOverdue),
    criticalLots: criticalLots.sort((a, b) => a.daysRemaining - b.daysRemaining),
    warningLots: warningLots.sort((a, b) => a.daysRemaining - b.daysRemaining),
    lowStockHerbs: lowStockHerbs.sort((a, b) => a.currentStock - b.currentStock),
    totalValueAtRisk,
  };
}

/**
 * =====================================================================
 * EXPORT 4: Export Inventory Valuation & Financial Summary CSV
 * =====================================================================
 */
export function exportInventoryValuationCSV(herbs: HerbItem[]): void {
  const { categories, grandTotalValue, grandTotalUnits, grandTotalLots } = calculateCategoryValuations(herbs);
  const dateStr = new Date().toISOString().slice(0, 10);

  const lines: string[] = [
    `"รายงานสรุปมูลค่าคลังยาสมุนไพร ประจำวันที่: ${formatDateThai(dateStr)}"`,
    `"มูลค่าสินค้าคงคลังรวมทั้งสิ้น: ${grandTotalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท"`,
    `"จำนวนรายการยา: ${herbs.length} รายการ | จำนวนล็อต: ${grandTotalLots} ล็อต | ยอดหน่วยบรรจุรวม: ${grandTotalUnits.toLocaleString()} หน่วย"`,
    '',
    '"--- สรุปมูลค่าคลังแยกตามหมวดหมู่ยาสมุนไพร ---"',
    [
      'ลำดับ',
      'หมวดหมู่ยาสมุนไพร',
      'จำนวนรายการยา',
      'จำนวนล็อต',
      'ยอดคงเหลือ(หน่วย)',
      'มูลค่ารวม(บาท)',
      'สัดส่วนมูลค่า(%)',
      'รายการสต๊อกต่ำ',
      'ล็อตใกล้หมดอายุ'
    ].join(','),
  ];

  categories.forEach((cat, idx) => {
    lines.push([
      String(idx + 1),
      `"${cat.category}"`,
      String(cat.herbCount),
      String(cat.lotCount),
      String(cat.totalUnits),
      `"${cat.totalValue.toFixed(2)}"`,
      `"${cat.percentageValue.toFixed(2)}%"`,
      String(cat.lowStockCount),
      String(cat.expiringCount)
    ].join(','));
  });

  lines.push([
    'รวมทั้งสิ้น',
    'ทั้งหมด',
    String(herbs.length),
    String(grandTotalLots),
    String(grandTotalUnits),
    `"${grandTotalValue.toFixed(2)}"`,
    '"100.00%"',
    String(herbs.filter(h => getHerbTotalStock(h) <= h.minStockAlert).length),
    String(categories.reduce((acc, c) => acc + c.expiringCount, 0))
  ].join(','));

  const content = '\uFEFF' + lines.join('\r\n');
  downloadFile(content, `รายงานมูลค่าคลังยาสมุนไพร_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * =====================================================================
 * EXPORT 5: Export All Herbal Medicines Directory CSV (รายชื่อยาสมุนไพรทั้งหมด)
 * =====================================================================
 */
export function exportWarehouseStructureCSV(herbs: HerbItem[]): void {
  exportAllHerbsDirectoryCSV(herbs);
}

export function exportAllHerbsDirectoryCSV(herbs: HerbItem[]): void {
  const dateStr = new Date().toISOString().slice(0, 10);

  const lines: string[] = [
    `"ทะเบียนรายชื่อยาสมุนไพรทั้งหมดในคลัง (All Herbal Medicines Inventory Directory)"`,
    `"ข้อมูล ณ วันที่: ${formatDateThai(dateStr)} | จำนวนรายการยาสมุนไพร: ${herbs.length} รายการ"`,
    '',
    [
      'ลำดับ',
      'รหัสยา',
      'ชื่อยาสมุนไพร',
      'ชื่อสามัญ',
      'หมวดหมู่',
      'สรรพคุณ/ข้อบ่งใช้',
      'ขนาดบรรจุ',
      'หน่วยนับ',
      'ล็อตการผลิตหลัก',
      'วันหมดอายุ(ล็อตหลัก)',
      'สถานะวันหมดอายุ',
      'จำนวนล็อตทั้งหมด',
      'ยอดคงเหลือรวม',
      'ราคาต่อหน่วย(บาท)',
      'มูลค่าสต๊อกรวม(บาท)',
      'เกณฑ์เตือนสต๊อกต่ำ',
      'สถานะสินค้า'
    ].join(',')
  ];

  herbs.forEach((herb, idx) => {
    const activeLot = getActiveLot(herb);
    const balance = getHerbTotalStock(herb);
    const exp = getExpiryStatus(activeLot?.expDate || '');
    const totalVal = herb.lots.reduce((sum, l) => sum + (getLotBalance(l) * (l.unitPrice || 0)), 0);

    let statusLabel = 'ปกติ';
    if (herb.lots.some(l => getLotBalance(l) > 0 && getExpiryStatus(l.expDate).status === 'expired')) {
      statusLabel = 'มีล็อตหมดอายุ';
    } else if (herb.lots.some(l => getLotBalance(l) > 0 && getExpiryStatus(l.expDate).status === 'critical')) {
      statusLabel = 'ใกล้หมดอายุ (เร่งจ่าย FEFO)';
    } else if (balance <= herb.minStockAlert) {
      statusLabel = 'สต๊อกต่ำกว่าเกณฑ์';
    }

    lines.push([
      String(idx + 1),
      `"${herb.code || '-'}"`,
      `"${herb.name.replace(/"/g, '""')}"`,
      `"${(herb.commonName || herb.name).replace(/"/g, '""')}"`,
      `"${herb.category}"`,
      `"${(herb.indications || '-').replace(/"/g, '""')}"`,
      `"${activeLot?.packaging || herb.defaultPackaging}"`,
      `"${herb.defaultUnit}"`,
      `"${activeLot?.lotNo || '-'}"`,
      `"${activeLot?.expDate ? formatDateThai(activeLot.expDate) : '-'}"`,
      `"${exp.label}"`,
      String(herb.lots.length),
      String(balance),
      `"${activeLot?.unitPrice || 0}"`,
      `"${totalVal.toFixed(2)}"`,
      String(herb.minStockAlert),
      `"${statusLabel}"`
    ].join(','));
  });

  const content = '\uFEFF' + lines.join('\r\n');
  downloadFile(content, `รายชื่อยาสมุนไพรทั้งหมด_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * =====================================================================
 * EXPORT 6: Export Risk & Reorder Audit CSV
 * =====================================================================
 */
export function exportRiskAndReorderCSV(herbs: HerbItem[]): void {
  const risk = calculateRiskAudit(herbs);
  const dateStr = new Date().toISOString().slice(0, 10);

  const lines: string[] = [
    `"รายงานตรวจสอบความปลอดภัยด้านอายุยาและรายการสต๊อกต่ำต้องสั่งซื้อ (Risk & Re-order Audit)"`,
    `"วันที่ตรวจสอบ: ${formatDateThai(dateStr)}"`,
    `"มูลค่าสต๊อกที่มีความเสี่ยงด้านอายุยา: ${risk.totalValueAtRisk.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท"`,
    '',
    '"=== ส่วนที่ 1: รายการยาที่หมดอายุแล้ว (Expired - ต้องกักกันและจำหน่ายออก) ==="',
    ['ลำดับ', 'รหัสยา', 'ชื่อยาสมุนไพร', 'Lot.No', 'วันหมดอายุ', 'เลยกำหนด(วัน)', 'ยอดคงเหลือ', 'ราคา/หน่วย', 'มูลค่าสูญเสีย(บาท)', 'สถานที่เก็บ', 'มาตรการดำเนินการ'].join(',')
  ];

  if (risk.expiredLots.length === 0) {
    lines.push('"-", "-", "ไม่มีรายการยาที่หมดอายุ", "-", "-", "-", "-", "-", "-", "-", "-"');
  } else {
    risk.expiredLots.forEach((ex, i) => {
      lines.push([
        String(i + 1),
        `"${ex.code || '-'}"`,
        `"${ex.herbName.replace(/"/g, '""')}"`,
        `"${ex.lotNo}"`,
        `"${formatDateThai(ex.expDate)}"`,
        String(ex.daysOverdue),
        String(ex.balance),
        `"${ex.unitPrice}"`,
        `"${ex.totalValue.toFixed(2)}"`,
        `"${ex.location}"`,
        '"กักกันสินค้าทันที รอทำลายตามระเบียบพัสดุ"'
      ].join(','));
    });
  }

  lines.push('');
  lines.push('"=== ส่วนที่ 2: รายการยาใกล้หมดอายุเร่งด่วน <= 30 วัน (Critical - ต้องเร่งจ่ายตาม FEFO) ==="');
  lines.push(['ลำดับ', 'รหัสยา', 'ชื่อยาสมุนไพร', 'Lot.No', 'วันหมดอายุ', 'คงเหลืออีก(วัน)', 'ยอดคงเหลือ', 'ราคา/หน่วย', 'มูลค่าเสี่ยง(บาท)', 'สถานที่เก็บ', 'มาตรการดำเนินการ'].join(','));

  if (risk.criticalLots.length === 0) {
    lines.push('"-", "-", "ไม่มียาใกล้หมดอายุใน 30 วัน", "-", "-", "-", "-", "-", "-", "-", "-"');
  } else {
    risk.criticalLots.forEach((cr, i) => {
      lines.push([
        String(i + 1),
        `"${cr.code || '-'}"`,
        `"${cr.herbName.replace(/"/g, '""')}"`,
        `"${cr.lotNo}"`,
        `"${formatDateThai(cr.expDate)}"`,
        String(cr.daysRemaining),
        String(cr.balance),
        `"${cr.unitPrice}"`,
        `"${cr.totalValue.toFixed(2)}"`,
        `"${cr.location}"`,
        '"ติดสติกเกอร์เตือน FEFO เร่งเบิกจ่ายห้องตรวจแพทย์แผนไทยก่อน"'
      ].join(','));
    });
  }

  lines.push('');
  lines.push('"=== ส่วนที่ 3: รายการยาสต๊อกต่ำกว่าเกณฑ์ขั้นต่ำ (Low Stock - แนะนำให้ออกใบขอสั่งซื้อ) ==="');
  lines.push(['ลำดับ', 'รหัสยา', 'ชื่อยาสมุนไพร', 'หมวดหมู่', 'สต๊อกคงเหลือ', 'เกณฑ์ขั้นต่ำ', 'หน่วยนับ', 'ขาดอยู่', 'จำนวนที่ควรสั่งซื้อ', 'สถานที่เก็บ'].join(','));

  if (risk.lowStockHerbs.length === 0) {
    lines.push('"-", "-", "สต๊อกยาทุกรายการเพียงพอ", "-", "-", "-", "-", "-", "-", "-"');
  } else {
    risk.lowStockHerbs.forEach((ls, i) => {
      lines.push([
        String(i + 1),
        `"${ls.code || '-'}"`,
        `"${ls.herbName.replace(/"/g, '""')}"`,
        `"${ls.category}"`,
        String(ls.currentStock),
        String(ls.minAlert),
        `"${ls.unit}"`,
        String(ls.shortage),
        String(ls.suggestedReorder),
        `"${ls.location}"`
      ].join(','));
    });
  }

  const content = '\uFEFF' + lines.join('\r\n');
  downloadFile(content, `รายงานตรวจสอบความเสี่ยงและใบสั่งซื้อ_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * =====================================================================
 * EXPORT 7: Export All Herbs & Inventory JSON Schema
 * =====================================================================
 */
export function exportWarehouseHierarchyJSON(herbs: HerbItem[]): void {
  exportAllHerbsJSON(herbs);
}

export function exportAllHerbsJSON(herbs: HerbItem[]): void {
  const { categories, grandTotalValue, grandTotalUnits, grandTotalLots } = calculateCategoryValuations(herbs);
  const risk = calculateRiskAudit(herbs);
  const dateStr = new Date().toISOString().slice(0, 10);

  const payload = {
    metadata: {
      reportTitle: 'ฐานข้อมูลรายชื่อยาสมุนไพรทั้งหมดในคลัง (All Herbal Medicines Inventory Directory)',
      generatedAt: new Date().toISOString(),
      reportDateThai: formatDateThai(dateStr),
      totalHerbs: herbs.length,
      totalLots: grandTotalLots,
      grandTotalUnits,
      grandTotalValue,
    },
    categoriesSummary: categories,
    allHerbsDirectory: herbs.map(h => {
      const activeLot = getActiveLot(h);
      const totalBal = getHerbTotalStock(h);
      const totalVal = h.lots.reduce((sum, l) => sum + (getLotBalance(l) * (l.unitPrice || 0)), 0);
      return {
        id: h.id,
        code: h.code,
        name: h.name,
        commonName: h.commonName,
        category: h.category,
        indications: h.indications,
        defaultUnit: h.defaultUnit,
        defaultPackaging: h.defaultPackaging,
        minStockAlert: h.minStockAlert,
        totalBalance: totalBal,
        totalValue: totalVal,
        totalLots: h.lots.length,
        activeLot: activeLot ? {
          lotNo: activeLot.lotNo,
          mfgDate: activeLot.mfgDate,
          expDate: activeLot.expDate,
          packaging: activeLot.packaging,
          unitPrice: activeLot.unitPrice,
          balance: getLotBalance(activeLot),
        } : null,
        lots: h.lots.map(l => ({
          id: l.id,
          lotNo: l.lotNo,
          mfgDate: l.mfgDate,
          expDate: l.expDate,
          balance: getLotBalance(l),
          unitPrice: l.unitPrice,
          packaging: l.packaging,
        })),
      };
    }),
    riskAudit: risk,
    herbsRaw: herbs,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `herbal_medicines_directory_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * =====================================================================
 * EXPORT 8: Executive Summary Report HTML Generator & Printable View
 * =====================================================================
 */
export function generateExecutiveReportHTML(herbs: HerbItem[]): string {
  const { categories, grandTotalValue, grandTotalUnits, grandTotalLots } = calculateCategoryValuations(herbs);
  const risk = calculateRiskAudit(herbs);
  const dateStr = formatDateThai(new Date().toISOString().slice(0, 10));

  const categoryRowsHTML = categories.map((c, i) => `
    <tr>
      <td style="text-align: center;">${i + 1}</td>
      <td style="font-weight: 600; text-align: left;">${c.category}</td>
      <td style="text-align: center;">${c.herbCount}</td>
      <td style="text-align: center;">${c.lotCount}</td>
      <td style="text-align: right; font-weight: 600;">${c.totalUnits.toLocaleString()}</td>
      <td style="text-align: right; font-weight: bold; color: #047857;">${c.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</td>
      <td style="text-align: right;">${c.percentageValue.toFixed(1)}%</td>
      <td style="text-align: center; color: ${c.lowStockCount > 0 ? '#b45309' : '#64748b'}; font-weight: 600;">${c.lowStockCount > 0 ? c.lowStockCount : '-'}</td>
      <td style="text-align: center; color: ${c.expiringCount > 0 ? '#be123c' : '#64748b'}; font-weight: 600;">${c.expiringCount > 0 ? c.expiringCount : '-'}</td>
    </tr>
  `).join('');

  const allHerbsRowsHTML = herbs.map((h, i) => {
    const activeLot = getActiveLot(h);
    const balance = getHerbTotalStock(h);
    const totalVal = h.lots.reduce((sum, l) => sum + (getLotBalance(l) * (l.unitPrice || 0)), 0);
    const exp = getExpiryStatus(activeLot?.expDate || '');

    let statusBadge = '<span style="color: #047857; font-weight: 600;">ปกติ</span>';
    if (h.lots.some(l => getLotBalance(l) > 0 && getExpiryStatus(l.expDate).status === 'expired')) {
      statusBadge = '<span style="color: #dc2626; font-weight: bold;">มีล็อตหมดอายุ</span>';
    } else if (h.lots.some(l => getLotBalance(l) > 0 && getExpiryStatus(l.expDate).status === 'critical')) {
      statusBadge = '<span style="color: #d97706; font-weight: bold;">เร่งจ่าย FEFO</span>';
    } else if (balance <= h.minStockAlert) {
      statusBadge = '<span style="color: #b45309; font-weight: bold;">สต๊อกต่ำ</span>';
    }

    return `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td style="text-align: center; font-family: monospace; font-size: 11px; color: #475569;">${h.code || '-'}</td>
        <td style="text-align: left; font-weight: 600;">
          <div>${h.name}</div>
          ${h.commonName && h.commonName !== h.name ? `<div style="font-size: 11px; color: #64748b; font-weight: normal;">${h.commonName}</div>` : ''}
        </td>
        <td style="text-align: left; color: #475569;">${h.category}</td>
        <td style="text-align: left; font-size: 11px; color: #334155;">${h.indications || '-'}</td>
        <td style="text-align: center; font-family: monospace; font-size: 11px;">${activeLot?.lotNo || '-'}</td>
        <td style="text-align: center; font-size: 11px;">${activeLot?.expDate ? formatDateThai(activeLot.expDate) : '-'}</td>
        <td style="text-align: center;">${activeLot?.packaging || h.defaultPackaging}</td>
        <td style="text-align: right; font-weight: bold; color: ${balance <= h.minStockAlert ? '#dc2626' : '#0f172a'};">${balance.toLocaleString()} ${h.defaultUnit}</td>
        <td style="text-align: right;">${(activeLot?.unitPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</td>
        <td style="text-align: right; font-weight: bold; color: #047857;">${totalVal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</td>
        <td style="text-align: center;">${statusBadge}</td>
      </tr>
    `;
  }).join('');

  const lowStockRowsHTML = risk.lowStockHerbs.map((ls, i) => {
    const matchingHerb = herbs.find(h => h.name === ls.herbName);
    const packaging = matchingHerb?.defaultPackaging || '-';
    return `
    <tr>
      <td style="text-align: center;">${i + 1}</td>
      <td style="text-align: left; font-weight: 600;">${ls.herbName}</td>
      <td style="text-align: left; color: #64748b;">${ls.category}</td>
      <td style="text-align: right; font-weight: bold; color: #dc2626;">${ls.currentStock} ${ls.unit}</td>
      <td style="text-align: right;">${ls.minAlert} ${ls.unit}</td>
      <td style="text-align: right; font-weight: 600; color: #b45309;">${ls.suggestedReorder} ${ls.unit}</td>
      <td style="text-align: center;">${packaging}</td>
    </tr>
  `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานสรุปและรายชื่อยาสมุนไพรทั้งหมด - ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Prompt:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Sarabun', sans-serif; background: #f8fafc; color: #1e293b; padding: 24px; font-size: 13px; line-height: 1.5; }
    .container { max-width: 1080px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header-bar { border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-title h1 { font-family: 'Prompt', sans-serif; font-size: 22px; color: #065f46; margin-bottom: 4px; }
    .header-title p { color: #64748b; font-size: 13px; }
    .badge-date { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 12px; text-align: right; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 10px; }
    .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .kpi-val { font-size: 20px; font-weight: 700; color: #0f172a; }
    .kpi-sub { font-size: 11px; color: #10b981; margin-top: 2px; }
    h2.section-title { font-family: 'Prompt', sans-serif; font-size: 16px; color: #0f172a; margin: 24px 0 10px 0; border-left: 4px solid #059669; padding-left: 10px; display: flex; justify-content: space-between; align-items: center; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th { background: #f1f5f9; color: #334155; font-weight: 600; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; }
    td { padding: 7px 10px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .total-row td { background: #f0fdf4; font-weight: bold; border-top: 2px solid #059669; }
    .sign-section { margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .sign-box { text-align: center; padding: 16px; }
    .sign-line { border-bottom: 1px dotted #94a3b8; width: 220px; margin: 30px auto 8px auto; }
    .toolbar { position: sticky; top: 10px; z-index: 99; background: #065f46; color: #fff; padding: 12px 24px; border-radius: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .btn-print { background: #fff; color: #065f46; border: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-family: 'Sarabun', sans-serif; }
    @media print {
      body { background: #fff; padding: 0; font-size: 11pt; }
      .container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .toolbar { display: none !important; }
      th, td { border: 1px solid #000 !important; }
      .page-break { page-break-before: always; break-before: page; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <div>
      <strong>รายงานสรุปและรายชื่อยาสมุนไพรทั้งหมด (Executive Inventory Report)</strong>
      <span style="margin-left: 12px; opacity: 0.85; font-size: 12px;">รองรับการพิมพ์และบันทึกเป็น PDF</span>
    </div>
    <button class="btn-print" onclick="window.print()">สั่งพิมพ์รายงาน / บันทึก PDF</button>
  </div>

  <div class="container">
    <div class="header-bar">
      <div class="header-title">
        <h1>รายงานสรุปการบริหารคลังและรายชื่อยาสมุนไพร</h1>
        <p>กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาล / หน่วยบริการสาธารณสุข</p>
        <p style="font-size: 11px; color: #64748b; margin-top: 2px;">มาตรฐานการจัดการคลังยาตามหลัก Good Storage Practice (GSP) &amp; FEFO</p>
      </div>
      <div class="badge-date">
        <div>ข้อมูล ณ วันที่</div>
        <div style="font-size: 14px;">${dateStr}</div>
      </div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">มูลค่าคลังยาสมุนไพรรวม</div>
        <div class="kpi-val" style="color: #047857;">${grandTotalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</div>
        <div class="kpi-sub">คำนวณจากราคาต้นทุนล็อต</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">จำนวนรายการยาสมุนไพร</div>
        <div class="kpi-val">${herbs.length} รายการ</div>
        <div class="kpi-sub">${grandTotalLots} ล็อตการผลิต</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">ยอดคงเหลือรวมในคลัง</div>
        <div class="kpi-val">${grandTotalUnits.toLocaleString()} หน่วย</div>
        <div class="kpi-sub">${herbs.length} รายการยา</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">สต๊อกต่ำกว่าเกณฑ์ขั้นต่ำ</div>
        <div class="kpi-val" style="color: ${risk.lowStockHerbs.length > 0 ? '#b45309' : '#047857'};">${risk.lowStockHerbs.length} รายการ</div>
        <div class="kpi-sub">ต้องการการจัดซื้อ/เติมยา</div>
      </div>
    </div>

    <!-- Section 1: Categories Breakdown -->
    <h2 class="section-title">1. สรุปมูลค่าและปริมาณคลังแยกตามหมวดหมู่ยาสมุนไพร (Inventory Valuation by Category)</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 5%;">ลำดับ</th>
          <th style="width: 28%;">หมวดหมู่ยาสมุนไพร</th>
          <th style="width: 8%;">จำนวนยา</th>
          <th style="width: 8%;">จำนวนล็อต</th>
          <th style="width: 13%;">ยอดคงเหลือ(หน่วย)</th>
          <th style="width: 16%;">มูลค่ารวม (บาท)</th>
          <th style="width: 8%;">สัดส่วน</th>
          <th style="width: 7%;">สต๊อกต่ำ</th>
          <th style="width: 7%;">ใกล้หมดอายุ</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRowsHTML}
        <tr class="total-row">
          <td colspan="2" style="text-align: center;">รวมทั้งสิ้น</td>
          <td style="text-align: center;">${herbs.length}</td>
          <td style="text-align: center;">${grandTotalLots}</td>
          <td style="text-align: right;">${grandTotalUnits.toLocaleString()}</td>
          <td style="text-align: right; color: #047857;">${grandTotalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</td>
          <td style="text-align: right;">100%</td>
          <td style="text-align: center;">${risk.lowStockHerbs.length}</td>
          <td style="text-align: center;">${categories.reduce((a, c) => a + c.expiringCount, 0)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Section 2: All Herbs Directory -->
    <h2 class="section-title">2. รายชื่อยาสมุนไพรทั้งหมด (All Herbal Medicines Directory)</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 4%;">ลำดับ</th>
          <th style="width: 7%;">รหัสยา</th>
          <th style="width: 18%;">ชื่อยาสมุนไพร</th>
          <th style="width: 11%;">หมวดหมู่</th>
          <th style="width: 16%;">สรรพคุณ / ข้อบ่งใช้</th>
          <th style="width: 9%;">Lot หลัก</th>
          <th style="width: 9%;">วันหมดอายุ</th>
          <th style="width: 8%;">ขนาดบรรจุ</th>
          <th style="width: 9%;">คงเหลือ</th>
          <th style="width: 8%;">ราคา/หน่วย</th>
          <th style="width: 10%;">มูลค่ารวม</th>
          <th style="width: 7%;">สถานะ</th>
        </tr>
      </thead>
      <tbody>
        ${allHerbsRowsHTML}
      </tbody>
    </table>

    <!-- Section 3: Low Stock Alerts -->
    ${risk.lowStockHerbs.length > 0 ? `
      <h2 class="section-title">3. รายการยาสมุนไพรที่สต๊อกต่ำกว่าเกณฑ์ขั้นต่ำ (Re-order Alert &amp; Shortage List)</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">ลำดับ</th>
            <th style="width: 25%;">ชื่อยาสมุนไพร</th>
            <th style="width: 20%;">หมวดหมู่</th>
            <th style="width: 12%;">คงเหลือปัจจุบัน</th>
            <th style="width: 10%;">เกณฑ์เตือน</th>
            <th style="width: 13%;">แนะนำสั่งซื้อ</th>
            <th style="width: 15%;">ขนาดบรรจุ</th>
          </tr>
        </thead>
        <tbody>
          ${lowStockRowsHTML}
        </tbody>
      </table>
    ` : ''}

    <!-- Signatures Section -->
    <div class="sign-section">
      <div class="sign-box">
        <p style="color: #475569; font-weight: 500;">ผู้จัดทำรายงาน / เจ้าหน้าที่คลังยาแผนไทย</p>
        <div class="sign-line"></div>
        <p>(....................................................................)</p>
        <p style="font-size: 11px; color: #64748b; margin-top: 4px;">ตำแหน่ง: เภสัชกร / แพทย์แผนไทย</p>
      </div>
      <div class="sign-box">
        <p style="color: #475569; font-weight: 500;">ผู้ตรวจรับรอง / หัวหน้ากลุ่มงานแพทย์แผนไทย</p>
        <div class="sign-line"></div>
        <p>(....................................................................)</p>
        <p style="font-size: 11px; color: #64748b; margin-top: 4px;">ตำแหน่ง: หัวหน้ากลุ่มงานแพทย์แผนไทยฯ</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Downloads standalone HTML Executive Report
 */
export function downloadExecutiveReportHTML(herbs: HerbItem[]): void {
  const html = generateExecutiveReportHTML(herbs);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(html, `รายงานสรุปและรายชื่อยาสมุนไพรทั้งหมด_${dateStr}.html`, 'text/html;charset=utf-8;');
}

/**
 * Opens Executive Report in New Tab with Blob URL
 */
export function openExecutiveReportInNewTab(herbs: HerbItem[]): void {
  const html = generateExecutiveReportHTML(herbs);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const newWin = window.open(url, '_blank');
  if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
    downloadExecutiveReportHTML(herbs);
  }
}

/**
 * Generates an official print-ready HTML page with 4 cards per A4 sheet,
 * exactly matching the national herbal stock card standard.
 */
export function generateStockCardsHTML(herbs: HerbItem[], fillTransactions = true): string {
  const maxRows = 12; // Standard lines per stock card in PDF

  const renderCardBoxHTML = (herb: HerbItem, lot?: StockCardLot) => {
    const transactions = fillTransactions && lot ? lot.transactions : [];
    
    let tableRows = '';
    
    // Transactions
    transactions.slice(0, maxRows).forEach(tx => {
      tableRows += `
        <tr>
          <td class="col-date">${formatDateThai(tx.date, false)}</td>
          <td class="col-num">${tx.broughtForward > 0 ? tx.broughtForward : ''}</td>
          <td class="col-num font-bold">${tx.received > 0 ? tx.received : ''}</td>
          <td class="col-num font-bold">${tx.dispensed > 0 ? tx.dispensed : ''}</td>
          <td class="col-num font-bold highlight">${tx.balance}</td>
          <td class="col-text">${tx.requesterOrDispenser || ''}</td>
        </tr>
      `;
    });

    // Blank lines
    const blankCount = Math.max(0, maxRows - transactions.length);
    for (let i = 0; i < blankCount; i++) {
      tableRows += `
        <tr>
          <td class="col-date">&nbsp;</td>
          <td class="col-num">&nbsp;</td>
          <td class="col-num">&nbsp;</td>
          <td class="col-num">&nbsp;</td>
          <td class="col-num">&nbsp;</td>
          <td class="col-text">&nbsp;</td>
        </tr>
      `;
    }

    return `
      <div class="stock-box">
        <div class="box-header">
          <div class="row-meta">
            <span class="meta-item">Lot.No <strong>${lot?.lotNo || '.....................................'}</strong></span>
            <span class="meta-item">Exp.date <strong>${lot?.expDate ? formatDateThai(lot.expDate) : '.....................................'}</strong></span>
          </div>
          <div class="row-meta">
            <span class="meta-item">ขนาดบรรจุ <strong>${lot?.packaging || herb.defaultPackaging || '...............................'}</strong></span>
            <span class="meta-item">ราคาต่อหน่วยบรรจุ <strong>${lot?.unitPrice && lot.unitPrice > 0 ? lot.unitPrice : '...................'}</strong> บาท.</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="card-table">
            <thead>
              <tr>
                <th style="width: 20%;">วัน เดือน ปี</th>
                <th style="width: 14%;">ยกมา</th>
                <th style="width: 14%;">รับใหม่</th>
                <th style="width: 14%;">จ่าย</th>
                <th style="width: 14%;">คงเหลือ</th>
                <th style="width: 24%;">ผู้เบิก / ผู้จ่าย</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  const pagesHTML = herbs.map(herb => {
    const lot0 = herb.lots[0];
    const lot1 = herb.lots[1] || lot0;
    const lot2 = herb.lots[2] || lot0;
    const lot3 = herb.lots[3] || lot0;

    return `
      <div class="page-container">
        <div class="page-title">
          <h2>${herb.name}</h2>
        </div>
        <div class="grid-2x2">
          ${renderCardBoxHTML(herb, lot0)}
          ${renderCardBoxHTML(herb, lot1)}
          ${renderCardBoxHTML(herb, lot2)}
          ${renderCardBoxHTML(herb, lot3)}
        </div>
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stock Card สมุนไพร (บัตรสต๊อกยา)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@600;700&family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 landscape;
      margin: 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #e2e8f0;
      color: #000;
      font-size: 11px;
      line-height: 1.25;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* Top print toolbar for non-print view */
    .screen-toolbar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: white;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      font-family: 'Sarabun', sans-serif;
    }
    .screen-toolbar h1 {
      font-size: 15px;
      font-weight: 700;
      font-family: 'Prompt', sans-serif;
    }
    .screen-toolbar p {
      font-size: 12px;
      color: #94a3b8;
    }
    .btn-print {
      background: #059669;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .btn-print:hover {
      background: #047857;
    }
    .btn-close {
      background: transparent;
      color: #cbd5e1;
      border: 1px solid #475569;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      margin-left: 8px;
    }
    .btn-close:hover {
      background: #334155;
    }

    .main-wrap {
      max-width: 297mm;
      margin: 16px auto;
      padding: 0 10px;
    }

    /* Page container */
    .page-container {
      background: #fff;
      width: 100%;
      min-height: 195mm;
      padding: 6mm 8mm;
      margin-bottom: 20px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.1);
      page-break-after: always;
      break-after: page;
    }

    .page-title {
      text-align: center;
      margin-bottom: 8px;
      padding-bottom: 2px;
    }
    .page-title h2 {
      font-family: 'Prompt', 'Sarabun', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #000;
      letter-spacing: 0.5px;
    }

    /* 2x2 Grid */
    .grid-2x2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    /* Stock card box */
    .stock-box {
      border: 1.5px solid #000;
      padding: 6px;
      background: #fff;
      display: flex;
      flex-col;
      min-height: 84mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .box-header {
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
      margin-bottom: 4px;
      font-size: 10.5px;
    }
    .row-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .meta-item strong {
      font-weight: 700;
    }

    .table-wrap {
      flex: 1;
    }
    .card-table {
      width: 100%;
      border-collapse: collapse;
      text-align: center;
      font-size: 10px;
    }
    .card-table th {
      border: 1px solid #000;
      padding: 3px 2px;
      font-weight: 700;
      background: #fff;
      color: #000;
    }
    .card-table td {
      border: 1px solid #000;
      padding: 2px 3px;
      height: 18px;
      color: #000;
    }
    .col-date {
      font-family: monospace;
      font-size: 9.5px;
    }
    .col-num {
      font-family: monospace;
      font-size: 10px;
    }
    .col-text {
      text-align: left;
      font-size: 9.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100px;
    }
    .font-bold {
      font-weight: 700;
    }
    .highlight {
      font-weight: 700;
      background: #fafafa;
    }

    @media print {
      body {
        background: #fff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .screen-toolbar {
        display: none !important;
      }
      .main-wrap {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .page-container {
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 0 0 0 !important;
        min-height: auto !important;
      }
      .stock-box {
        border: 1.5px solid #000 !important;
      }
      .card-table th, .card-table td {
        border: 1px solid #000 !important;
      }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div>
      <h1>พิมพ์บัตรสต๊อกการ์ดยาสมุนไพร (Stock Card)</h1>
      <p>จัดพิมพ์ 4 บัตรต่อหน้า A4 แนวนอน (2x2 Grid) ตรงตามมาตรฐานแบบฟอร์มโรงพยาบาล</p>
    </div>
    <div style="display: flex; align-items: center;">
      <button class="btn-print" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        <span>สั่งพิมพ์ทันที (Print)</span>
      </button>
      <button class="btn-close" onclick="window.close()">ปิดหน้าต่าง</button>
    </div>
  </div>

  <div class="main-wrap">
    ${pagesHTML}
  </div>

  <script>
    // Auto trigger print when loaded in independent window
    window.addEventListener('load', function() {
      // Small timeout to allow styles/fonts to settle
      setTimeout(function() {
        if (window.location.protocol !== 'blob:' && window.opener) {
          window.print();
        }
      }, 500);
    });
  </script>
</body>
</html>`;
}

/**
 * Direct print executing function:
 * 1) Tries to print via a hidden iframe
 * 2) If iframe printing is blocked by sandbox policy, opens a dedicated tab/window with Blob URL
 */
export async function printStockCardsDirect(herbs: HerbItem[], fillTransactions = true): Promise<void> {
  const html = generateStockCardsHTML(herbs, fillTransactions);

  try {
    // Attempt printing via hidden iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'stock-card-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '10px';
    iframe.style.height = '10px';
    iframe.style.opacity = '0.01';
    iframe.style.border = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          // Remove iframe after print dialogue closes
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 3000);
        } catch (printErr) {
          console.warn('Iframe print failed, falling back to Blob tab/window:', printErr);
          openPrintableInNewTab(herbs, fillTransactions);
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn('Iframe setup failed, falling back to Blob tab/window:', err);
  }

  // Fallback: Open in new tab or download
  openPrintableInNewTab(herbs, fillTransactions);
}

/**
 * Opens the printable Stock Cards in a dedicated browser tab using Blob URL.
 * Works 100% reliably even when the app is running in restricted sandboxed iframes!
 */
export function openPrintableInNewTab(herbs: HerbItem[], fillTransactions = true): void {
  const html = generateStockCardsHTML(herbs, fillTransactions);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const newWin = window.open(url, '_blank');
  if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
    // Popup was blocked by browser, trigger download of HTML file
    downloadPrintableHTML(herbs, fillTransactions);
  }
}

/**
 * Downloads a standalone .html file containing the exact A4 printable Stock Cards.
 * Can be opened in any web browser and printed anytime with Ctrl+P / Cmd+P!
 */
export function downloadPrintableHTML(herbs: HerbItem[], fillTransactions = true): void {
  const html = generateStockCardsHTML(herbs, fillTransactions);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(html, `StockCard_พิมพ์สมุนไพร_${dateStr}.html`, 'text/html;charset=utf-8;');
}

/**
 * Renders HTML for a single stock card box (1 of the 4 boxes in a 2x2 grid)
 */
function renderStockCardBoxForPDF(
  herb: HerbItem,
  lot?: StockCardLot,
  fillTransactions = true,
  maxRows = 12
): string {
  const transactions = fillTransactions && lot ? (lot.transactions || []) : [];

  let tableRows = '';
  // Filled transactions
  transactions.slice(0, maxRows).forEach(tx => {
    tableRows += `
      <tr style="height: 20px;">
        <td style="border: 1px solid #000000; padding: 1px 2px; text-align: center; font-family: monospace; font-size: 9px; color: #000000;">
          ${formatDateThai(tx.date, false)}
        </td>
        <td style="border: 1px solid #000000; padding: 1px 2px; text-align: center; font-family: monospace; font-size: 9.5px; color: #000000;">
          ${tx.broughtForward > 0 ? tx.broughtForward : ''}
        </td>
        <td style="border: 1px solid #000000; padding: 1px 2px; text-align: center; font-family: monospace; font-size: 9.5px; font-weight: bold; color: #000000;">
          ${tx.received > 0 ? tx.received : ''}
        </td>
        <td style="border: 1px solid #000000; padding: 1px 2px; text-align: center; font-family: monospace; font-size: 9.5px; font-weight: bold; color: #000000;">
          ${tx.dispensed > 0 ? tx.dispensed : ''}
        </td>
        <td style="border: 1px solid #000000; padding: 1px 2px; text-align: center; font-family: monospace; font-size: 9.5px; font-weight: bold; background-color: #f8fafc; color: #000000;">
          ${tx.balance}
        </td>
        <td style="border: 1px solid #000000; padding: 1px 4px; text-align: left; font-size: 9px; color: #000000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 105px;">
          ${tx.requesterOrDispenser || ''}
        </td>
      </tr>
    `;
  });

  // Blank lines to complete maxRows
  const blankCount = Math.max(0, maxRows - transactions.length);
  for (let i = 0; i < blankCount; i++) {
    tableRows += `
      <tr style="height: 20px;">
        <td style="border: 1px solid #000000; padding: 1px 2px;">&nbsp;</td>
        <td style="border: 1px solid #000000; padding: 1px 2px;">&nbsp;</td>
        <td style="border: 1px solid #000000; padding: 1px 2px;">&nbsp;</td>
        <td style="border: 1px solid #000000; padding: 1px 2px;">&nbsp;</td>
        <td style="border: 1px solid #000000; padding: 1px 2px;">&nbsp;</td>
        <td style="border: 1px solid #000000; padding: 1px 2px;">&nbsp;</td>
      </tr>
    `;
  }

  const lotNo = lot?.lotNo || '.....................................';
  const expDate = lot?.expDate ? formatDateThai(lot.expDate) : '.....................................';
  const packaging = lot?.packaging || herb.defaultPackaging || '...............................';
  const unitPrice = lot?.unitPrice !== undefined && lot?.unitPrice > 0 ? `${lot.unitPrice}` : '...................';

  return `
    <div style="
      border: 1.5px solid #000000;
      padding: 6px 8px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 350px;
      box-sizing: border-box;
    ">
      <!-- Card Box Meta Header -->
      <div style="
        border-bottom: 1.2px solid #000000;
        padding-bottom: 3px;
        margin-bottom: 3px;
        font-size: 10.5px;
        line-height: 1.35;
        color: #000000;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span>Lot.No <strong>${lotNo}</strong></span>
          <span>Exp.date <strong>${expDate}</strong></span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>ขนาดบรรจุ <strong>${packaging}</strong></span>
          <span>ราคาต่อหน่วยบรรจุ <strong>${unitPrice}</strong> บาท.</span>
        </div>
      </div>

      <!-- 6-column Stock Card Table -->
      <div style="flex: 1;">
        <table style="
          width: 100%;
          border-collapse: collapse;
          text-align: center;
          font-size: 9.5px;
          border: 1px solid #000000;
        ">
          <thead>
            <tr style="height: 22px; background: #ffffff;">
              <th style="border: 1px solid #000000; width: 20%; padding: 2px 1px; font-weight: bold; color: #000000;">วัน เดือน ปี</th>
              <th style="border: 1px solid #000000; width: 13%; padding: 2px 1px; font-weight: bold; color: #000000;">ยกมา</th>
              <th style="border: 1px solid #000000; width: 13%; padding: 2px 1px; font-weight: bold; color: #000000;">รับใหม่</th>
              <th style="border: 1px solid #000000; width: 13%; padding: 2px 1px; font-weight: bold; color: #000000;">จ่าย</th>
              <th style="border: 1px solid #000000; width: 15%; padding: 2px 1px; font-weight: bold; color: #000000;">คงเหลือ</th>
              <th style="border: 1px solid #000000; width: 26%; padding: 2px 2px; font-weight: bold; color: #000000;">ผู้เบิก / ผู้จ่าย</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Downloads Stock Cards (4 cards per A4 sheet in 2x2 grid) directly as a PDF file
 * to guarantee 100% layout locking and eliminate any print shifting ("ป้องกันการเคลื่อนของไฟล์").
 */
export async function downloadStockCardPDF(
  herbs: HerbItem[],
  fillTransactions = true,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<boolean> {
  if (!herbs || herbs.length === 0) return false;

  // Prepare page specifications (each page has 1 herb and up to 4 lots)
  interface PageSpec {
    herb: HerbItem;
    lots: (StockCardLot | undefined)[];
    pageLabel: string;
  }

  const pageSpecs: PageSpec[] = [];

  herbs.forEach(herb => {
    if (!fillTransactions || herb.lots.length === 0) {
      // 1 Blank Page for handwriting
      pageSpecs.push({
        herb,
        lots: [undefined, undefined, undefined, undefined],
        pageLabel: '',
      });
    } else {
      // Chunk lots into groups of 4
      const activeLots = herb.lots.filter(l => !l.isArchived);
      const targetLots = activeLots.length > 0 ? activeLots : herb.lots;
      
      const totalPagesForHerb = Math.max(1, Math.ceil(targetLots.length / 4));
      for (let pIdx = 0; pIdx < totalPagesForHerb; pIdx++) {
        const chunk = targetLots.slice(pIdx * 4, (pIdx + 1) * 4);
        pageSpecs.push({
          herb,
          lots: [chunk[0], chunk[1], chunk[2], chunk[3]],
          pageLabel: totalPagesForHerb > 1 ? `หน้า ${pIdx + 1}/${totalPagesForHerb}` : '',
        });
      }
    }
  });

  const totalPages = pageSpecs.length;
  if (totalPages === 0) return false;

  let container: HTMLDivElement | null = null;
  try {
    // 1. Create hidden off-screen rendering container with fixed A4 Landscape pixel dimensions
    // Standard A4 landscape at 96 DPI: 1122.5px x 793.7px (297mm x 210mm)
    container = document.createElement('div');
    container.id = 'temp-pdf-stockcard-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '1122px';
    container.style.height = '794px';
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '-9999';
    container.style.opacity = '0.01';
    container.style.pointerEvents = 'none';
    container.style.boxSizing = 'border-box';
    document.body.appendChild(container);

    // 2. Initialize jsPDF in A4 Landscape
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 297; // mm
    const pdfHeight = 210; // mm

    // 3. Process each page sequentially
    for (let i = 0; i < totalPages; i++) {
      const spec = pageSpecs[i];
      if (onProgress) {
        onProgress(
          i + 1,
          totalPages,
          `กำลังสร้างหน้า ${i + 1} จาก ${totalPages}: ${spec.herb.name}`
        );
      }

      // Render page DOM
      const card0 = renderStockCardBoxForPDF(spec.herb, spec.lots[0], fillTransactions);
      const card1 = renderStockCardBoxForPDF(spec.herb, spec.lots[1], fillTransactions);
      const card2 = renderStockCardBoxForPDF(spec.herb, spec.lots[2], fillTransactions);
      const card3 = renderStockCardBoxForPDF(spec.herb, spec.lots[3], fillTransactions);

      container.innerHTML = `
        <div style="
          width: 1122px;
          height: 794px;
          background: #ffffff;
          padding: 16px 24px;
          box-sizing: border-box;
          font-family: 'Sarabun', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #000000;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          overflow: hidden;
        ">
          <!-- Page Header: Medicine Name -->
          <div style="text-align: center; margin-bottom: 6px; line-height: 1.2;">
            <h2 style="
              margin: 0;
              padding: 0;
              font-family: 'Prompt', 'Sarabun', sans-serif;
              font-size: 20px;
              font-weight: 700;
              color: #000000;
              letter-spacing: 0.5px;
            ">
              ${spec.herb.name} ${spec.pageLabel ? `<span style="font-size: 13px; font-weight: normal; color: #475569;">(${spec.pageLabel})</span>` : ''}
            </h2>
          </div>

          <!-- 2x2 Grid of 4 Stock Cards -->
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            width: 100%;
            box-sizing: border-box;
          ">
            ${card0}
            ${card1}
            ${card2}
            ${card3}
          </div>
        </div>
      `;

      // Allow DOM repaint
      await new Promise(resolve => setTimeout(resolve, 60));

      const pageElement = container.firstElementChild as HTMLElement || container;

      // Rasterize with scale: 2 for sharp 300 DPI output
      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1122,
        windowHeight: 794,
      });

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage('a4', 'landscape');
      }

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    // 4. Download generated PDF
    const dateStr = new Date().toISOString().slice(0, 10);
    let filename = '';
    if (herbs.length === 1) {
      const cleanName = herbs[0].name.replace(/[/\\?%*:|"<>]/g, '_');
      filename = `StockCard_${cleanName}_4ช่อง_${dateStr}.pdf`;
    } else {
      filename = `StockCard_ยาสมุนไพร_4ช่องต่อหน้า_${dateStr}.pdf`;
    }

    try {
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        if (downloadLink.parentNode) {
          downloadLink.parentNode.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobUrl);
      }, 1500);
    } catch (saveErr) {
      console.warn('Direct blob URL trigger failed, falling back to pdf.save():', saveErr);
      pdf.save(filename);
    }

    return true;
  } catch (err) {
    console.error('Failed to generate Stock Card PDF:', err);
    return false;
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Generate a recommended smart Lot.No (e.g. LOT-670921-01)
 */
export function generateSuggestedLotNo(herb?: HerbItem): string {
  const now = new Date();
  const thaiYearShort = String((now.getFullYear() + 543) % 100).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const existingCount = herb ? herb.lots.length + 1 : 1;
  const seq = String(existingCount).padStart(2, '0');
  return `LOT-${thaiYearShort}${month}${day}-${seq}`;
}

/**
 * Detailed calculations for a single lot
 */
export interface LotCalculations {
  balance: number;
  totalReceived: number;
  totalDispensed: number;
  transactionCount: number;
  status: ExpiryStatus;
  isDepleted: boolean;
}

export function getLotCalculations(lot: StockCardLot): LotCalculations {
  const balance = getLotBalance(lot);
  let totalReceived = 0;
  let totalDispensed = 0;

  if (lot.transactions) {
    lot.transactions.forEach(t => {
      totalReceived += t.received || 0;
      totalDispensed += t.dispensed || 0;
    });
  }

  const expStatus = getExpiryStatus(lot.expDate);
  const isDepleted = balance <= 0 && lot.transactions.length > 0;

  return {
    balance,
    totalReceived,
    totalDispensed,
    transactionCount: lot.transactions ? lot.transactions.length : 0,
    status: expStatus.status,
    isDepleted,
  };
}

/**
 * Sorts lots by different criteria (FEFO: First Expired First Out, Newest, Oldest, Lot Number)
 */
export function sortLots(
  lots: StockCardLot[],
  criterion: 'fefo' | 'newest' | 'oldest' | 'lotNo' = 'fefo'
): StockCardLot[] {
  const copy = [...lots];
  if (criterion === 'fefo') {
    return copy.sort((a, b) => {
      if (!a.expDate) return 1;
      if (!b.expDate) return -1;
      return new Date(a.expDate).getTime() - new Date(b.expDate).getTime();
    });
  }
  if (criterion === 'newest') {
    return copy.sort((a, b) => {
      const timeA = a.mfgDate ? new Date(a.mfgDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.mfgDate ? new Date(b.mfgDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
  }
  if (criterion === 'oldest') {
    return copy.sort((a, b) => {
      const timeA = a.mfgDate ? new Date(a.mfgDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.mfgDate ? new Date(b.mfgDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeA - timeB;
    });
  }
  if (criterion === 'lotNo') {
    return copy.sort((a, b) => a.lotNo.localeCompare(b.lotNo));
  }
  return copy;
}

/**
 * Resets all medicine transaction histories and balances across all herbs to 0,
 * and clears mock lot fields (Lot.No, Exp.date, packaging, unitPrice) to start clean for real intake.
 * Preserves the 41 standard herbal medicine definitions (names, codes, categories, indications).
 */
export function resetAllHerbsHistoryToZero(herbs: HerbItem[]): HerbItem[] {
  return herbs.map(herb => ({
    ...herb,
    updatedAt: Date.now(),
    lots: herb.lots.map(lot => ({
      ...lot,
      lotNo: '',
      expDate: '',
      packaging: '',
      unitPrice: 0,
      mfgDate: '',
      transactions: []
    }))
  }));
}

/**
 * Generates and downloads a CSV template prefilled with the 41 herbs for entering real inventory.
 */
export function downloadHerbStockImportTemplate(herbs: HerbItem[]): void {
  const headers = [
    'รหัสยา',
    'ชื่อยาสมุนไพร',
    'หมวดหมู่',
    'ขนาดบรรจุ',
    'หน่วยนับ',
    'เลขที่ Lot',
    'วันหมดอายุ (YYYY-MM-DD)',
    'วันที่ผลิต (YYYY-MM-DD)',
    'จำนวนรับเข้าจริง',
    'ราคาต่อหน่วย(บาท)',
    'สถานที่เก็บ',
    'ผู้จำหน่ายหรือผู้ส่งมอบ',
    'หมายเหตุ'
  ];

  const rows = herbs.map(herb => {
    const lot = herb.lots[0];
    return [
      `"${herb.code || ''}"`,
      `"${herb.name.replace(/"/g, '""')}"`,
      `"${herb.category}"`,
      `"${herb.defaultPackaging || lot?.packaging || ''}"`,
      `"${herb.defaultUnit || 'ขวด'}"`,
      `"${lot?.lotNo || ''}"`,
      `"${lot?.expDate || ''}"`,
      `"${lot?.mfgDate || ''}"`,
      `0`, // Default quantity is 0, user replaces with real stock
      `"${lot?.unitPrice || 0}"`,
      `"${herb.storageLocation || ''}"`,
      `"คลังรับยาเข้าจริง"`,
      `"ยอดยกมานำเข้าสต๊อกจริง"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `แบบฟอร์มนำเข้าสต๊อกยาจริง_41รายการ_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses user-uploaded CSV to import real medicine quantities into the 41 stock cards.
 */
export function parseRealStockCSV(
  csvText: string,
  currentHerbs: HerbItem[]
): { updatedHerbs: HerbItem[]; successCount: number; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return { updatedHerbs: currentHerbs, successCount: 0, errors: ['ไฟล์ไม่มีข้อมูลหรือมีเพียงบรรทัดหัวตาราง'] };
  }

  const errors: string[] = [];
  let successCount = 0;
  const herbsMap = new Map<string, HerbItem>();
  
  // Clone current herbs
  currentHerbs.forEach(h => {
    herbsMap.set(h.id, JSON.parse(JSON.stringify(h)));
  });

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser handling quotes
    const cols: string[] = [];
    let insideQuote = false;
    let currentVal = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        if (insideQuote && line[charIdx + 1] === '"') {
          currentVal += '"';
          charIdx++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        cols.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    cols.push(currentVal.trim());

    if (cols.length < 2) continue;

    const code = cols[0]?.trim();
    const name = cols[1]?.trim();
    const lotNo = cols[5]?.trim() || `LOT-${new Date().toISOString().slice(2, 7).replace('-', '')}`;
    const expDate = cols[6]?.trim() || '';
    const mfgDate = cols[7]?.trim() || '';
    const qtyStr = cols[8]?.trim() || '0';
    const unitPriceStr = cols[9]?.trim() || '0';
    const storageLocation = cols[10]?.trim() || '';
    const supplier = cols[11]?.trim() || 'รับเข้าสต๊อกยาจริง';
    const note = cols[12]?.trim() || 'นำเข้าข้อมูลยาจริงรอบแรก';

    const qty = parseFloat(qtyStr);
    const unitPrice = parseFloat(unitPriceStr) || 0;

    // Find matching herb by code or name
    let foundHerb: HerbItem | undefined;
    for (const h of herbsMap.values()) {
      if (code && h.code && h.code.toLowerCase() === code.toLowerCase()) {
        foundHerb = h;
        break;
      }
      if (name && h.name.toLowerCase().includes(name.toLowerCase())) {
        foundHerb = h;
        break;
      }
    }

    if (!foundHerb) {
      errors.push(`บรรทัดที่ ${i + 1}: ไม่พบยาสมุนไพรที่ตรงกับรหัส "${code}" หรือชื่อ "${name}"`);
      continue;
    }

    // Prepare real lot
    const lotId = `lot-real-${Date.now()}-${i}`;
    const transactionId = `tx-real-${Date.now()}-${i}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    const transactions: StockTransaction[] = [];
    if (!isNaN(qty) && qty > 0) {
      transactions.push({
        id: transactionId,
        date: todayStr,
        broughtForward: 0,
        received: qty,
        dispensed: 0,
        balance: qty,
        requesterOrDispenser: supplier,
        note: note,
        timestamp: Date.now()
      });
    }

    const newLot: StockCardLot = {
      id: lotId,
      lotNo: lotNo,
      expDate: expDate || (foundHerb.lots[0]?.expDate || `${new Date().getFullYear() + 2}-12-31`),
      mfgDate: mfgDate || foundHerb.lots[0]?.mfgDate,
      packaging: cols[3]?.trim() || foundHerb.defaultPackaging,
      unitPrice: unitPrice > 0 ? unitPrice : (foundHerb.lots[0]?.unitPrice || 0),
      supplierOrManufacturer: supplier,
      createdAt: todayStr,
      transactions: transactions
    };

    if (storageLocation) {
      foundHerb.storageLocation = storageLocation;
    }
    foundHerb.lots = [newLot];
    foundHerb.activeLotId = lotId;
    foundHerb.updatedAt = Date.now();
    successCount++;
  }

  return {
    updatedHerbs: Array.from(herbsMap.values()),
    successCount,
    errors
  };
}

