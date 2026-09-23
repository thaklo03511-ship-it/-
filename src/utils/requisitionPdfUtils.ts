import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { HerbItem, StockCardLot, StockTransaction, RequisitionSlip, RequisitionItem } from '../types';
import { formatDateThai } from './stockUtils';

export const REQUISITIONS_STORAGE_KEY = 'thai_herb_requisitions_v1';

/**
 * Converts numeric amount to Thai Baht text format
 * e.g. 1520 -> "หนึ่งพันห้าร้อยยี่สิบบาทถ้วน"
 */
export function numberToThaiBahtText(number: number): string {
  if (isNaN(number)) return 'ศูนย์บาทถ้วน';
  const num = Math.round(Number(number) * 100) / 100;
  if (num === 0) return 'ศูนย์บาทถ้วน';

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function convertGroup(nStr: string): string {
    let res = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr.charAt(i), 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1 && nStr.charAt(len - 2) !== '0') {
          res += 'เอ็ด';
        } else if (pos === 1 && digit === 1) {
          res += '';
        } else if (pos === 1 && digit === 2) {
          res += 'ยี่';
        } else {
          res += numbers[digit];
        }
        res += units[pos];
      }
    }
    return res;
  }

  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let bahtStr = '';
  if (integerPart.length > 6) {
    const millionPart = integerPart.slice(0, integerPart.length - 6);
    const lowerPart = integerPart.slice(integerPart.length - 6);
    bahtStr = convertGroup(millionPart) + 'ล้าน' + convertGroup(lowerPart);
  } else {
    bahtStr = convertGroup(integerPart);
  }
  bahtStr += 'บาท';

  if (decimalPart === '00') {
    bahtStr += 'ถ้วน';
  } else {
    let satangStr = '';
    const d1 = parseInt(decimalPart.charAt(0), 10);
    const d2 = parseInt(decimalPart.charAt(1), 10);
    if (d1 === 1) satangStr += 'สิบ';
    else if (d1 === 2) satangStr += 'ยี่สิบ';
    else if (d1 > 2) satangStr += numbers[d1] + 'สิบ';

    if (d2 === 1 && d1 > 0) satangStr += 'เอ็ด';
    else if (d2 > 0) satangStr += numbers[d2];
    satangStr += 'สตางค์';
    bahtStr += satangStr;
  }

  return bahtStr;
}

/**
 * Load saved requisition slips from localStorage
 */
export function loadSavedRequisitions(): RequisitionSlip[] {
  try {
    const data = localStorage.getItem(REQUISITIONS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load requisitions:', e);
  }

  // Default initial demo requisition slips
  const defaults: RequisitionSlip[] = [
    {
      id: 'req-demo-001',
      slipNumber: 'REQ-2569-0901',
      date: new Date().toISOString().slice(0, 10),
      time: '09:30',
      department: 'ห้องตรวจแพทย์แผนไทยและการแพทย์ผสมผสาน',
      requesterName: 'พท.ป. ศิริพร กลิ่นมาลัย',
      requesterPosition: 'แพทย์แผนไทยชำนาญการ',
      dispenserName: 'ภญ. พิมพ์มาดา เจริญสุข',
      receiverName: 'พท.ป. ศิริพร กลิ่นมาลัย',
      approverName: 'นพ. ชัยวัฒน์ วงศ์วิวัฒน์',
      purpose: 'สำรองยาสำหรับจ่ายผู้ป่วยนอก คลินิกแพทย์แผนไทย ประจำสัปดาห์',
      urgency: 'ปกติ',
      status: 'dispensed',
      items: [
        {
          id: 'item-1',
          herbId: 'herb-01',
          herbName: 'ฟ้าทะลายโจร (Andrographis paniculata)',
          category: 'ยารับประทาน (เม็ด/แคปซูล)',
          lotId: 'lot-01-02',
          lotNo: 'LOT-670315',
          expDate: '2026-10-15',
          availableStock: 25,
          requestedQty: 10,
          unit: 'ขวด',
          unitPrice: 85,
          totalPrice: 850,
          note: 'ใช้ในคลินิกทางเดินหายใจ',
        },
        {
          id: 'item-2',
          herbId: 'herb-02',
          herbName: 'ขมิ้นชัน (Curcuma longa)',
          category: 'ยารับประทาน (เม็ด/แคปซูล)',
          lotId: 'lot-02-01',
          lotNo: 'LOT-670201',
          expDate: '2027-02-28',
          availableStock: 50,
          requestedQty: 15,
          unit: 'ขวด',
          unitPrice: 70,
          totalPrice: 1050,
          note: 'จ่ายกลุ่มโรคทางเดินอาหาร/กรดไหลย้อน',
        },
        {
          id: 'item-3',
          herbId: 'herb-04',
          herbName: 'ยาหม่องไพล (Zingiber cassumunar Balm)',
          category: 'ยาใช้ภายนอก (ครีม/เจล/ขี้ผึ้ง/น้ำมัน)',
          lotId: 'lot-04-01',
          lotNo: 'LOT-670110',
          expDate: '2027-01-10',
          availableStock: 25,
          requestedQty: 5,
          unit: 'ตลับ',
          unitPrice: 45,
          totalPrice: 225,
          note: 'บริการหัตถการนวดประคบสมุนไพร',
        },
      ],
      totalQuantity: 30,
      totalValue: 2125,
      createdAt: Date.now() - 86400000 * 2,
    },
  ];

  try {
    localStorage.setItem(REQUISITIONS_STORAGE_KEY, JSON.stringify(defaults));
  } catch (err) {
    console.error('Failed to store default requisitions:', err);
  }

  return defaults;
}

/**
 * Save requisition slips back to localStorage
 */
export function saveRequisitions(slips: RequisitionSlip[]): void {
  try {
    localStorage.setItem(REQUISITIONS_STORAGE_KEY, JSON.stringify(slips));
  } catch (e) {
    console.error('Failed to save requisitions:', e);
  }
}

/**
 * Generates an official, fixed-layout HTML for the medicine requisition slip (ใบขอเบิกยาสมุนไพร)
 * Formatted strictly for A4 print and PDF conversion with no shifting elements ("ป้องกันไฟล์เคลื่อน")
 */
export function generateRequisitionSlipHTML(
  slip: RequisitionSlip,
  hospitalName: string = 'คลังยาสมุนไพร รพ.สต.บ้านท่าคล้อ'
): string {
  const formattedDate = formatDateThai(slip.date);
  const totalBahtText = numberToThaiBahtText(slip.totalValue);

  // Pad items up to at least 6 rows for standard official document look
  const minRows = 6;
  const dummyRowsCount = Math.max(0, minRows - slip.items.length);

  const rowsHTML = slip.items
    .map((item, idx) => `
      <tr style="border-bottom: 1px solid #334155; font-size: 13px;">
        <td style="padding: 7px 6px; text-align: center; border-right: 1px solid #334155;">${idx + 1}</td>
        <td style="padding: 7px 8px; text-align: left; border-right: 1px solid #334155;">
          <div style="font-weight: bold; color: #0f172a;">${item.herbName}</div>
          <div style="font-size: 11px; color: #475569;">
            ${item.category ? item.category + ' | ' : ''}ล็อต: <span style="font-family: monospace; font-weight: 600;">${item.lotNo}</span> (หมดอายุ: ${formatDateThai(item.expDate)})
          </div>
        </td>
        <td style="padding: 7px 8px; text-align: center; border-right: 1px solid #334155; font-family: monospace;">
          ${item.availableStock}
        </td>
        <td style="padding: 7px 8px; text-align: center; border-right: 1px solid #334155; font-weight: bold; font-family: monospace; color: #0f172a; font-size: 14px;">
          ${item.requestedQty}
        </td>
        <td style="padding: 7px 8px; text-align: center; border-right: 1px solid #334155; color: #334155;">
          ${item.unit}
        </td>
        <td style="padding: 7px 8px; text-align: right; border-right: 1px solid #334155; font-family: monospace;">
          ${item.unitPrice ? item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
        </td>
        <td style="padding: 7px 8px; text-align: right; border-right: 1px solid #334155; font-family: monospace; font-weight: bold;">
          ${item.totalPrice ? item.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
        </td>
        <td style="padding: 7px 8px; text-align: left; color: #475569; font-size: 11px;">
          ${item.note || '-'}
        </td>
      </tr>
    `)
    .join('');

  const dummyRowsHTML = Array.from({ length: dummyRowsCount })
    .map(
      (_, i) => `
      <tr style="border-bottom: 1px dashed #cbd5e1; height: 28px; font-size: 12px; color: #94a3b8;">
        <td style="padding: 4px; text-align: center; border-right: 1px solid #cbd5e1;">${slip.items.length + i + 1}</td>
        <td style="padding: 4px; border-right: 1px solid #cbd5e1;">&nbsp;</td>
        <td style="padding: 4px; border-right: 1px solid #cbd5e1;">&nbsp;</td>
        <td style="padding: 4px; border-right: 1px solid #cbd5e1;">&nbsp;</td>
        <td style="padding: 4px; border-right: 1px solid #cbd5e1;">&nbsp;</td>
        <td style="padding: 4px; border-right: 1px solid #cbd5e1;">&nbsp;</td>
        <td style="padding: 4px; border-right: 1px solid #cbd5e1;">&nbsp;</td>
        <td style="padding: 4px;">&nbsp;</td>
      </tr>
    `
    )
    .join('');

  return `
    <div id="requisition-print-slip" style="
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      padding: 36px 40px;
      background-color: #ffffff;
      color: #0f172a;
      box-sizing: border-box;
      font-family: 'Sarabun', 'Noto Sans Thai', 'TH Sarabun New', sans-serif;
      line-height: 1.4;
      position: relative;
    ">
      
      <!-- Top Department Header & Logo placeholder -->
      <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #047857; padding-bottom: 14px; margin-bottom: 18px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="
            width: 52px; 
            height: 52px; 
            border-radius: 50%; 
            background: #047857; 
            color: #ffffff; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 26px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          ">
            🌿
          </div>
          <div>
            <div style="font-size: 13px; color: #047857; font-weight: bold; letter-spacing: 0.5px;">
              งานการแพทย์แผนไทยและแพทย์ทางเลือก • ระบบจัดการคลังและเวชภัณฑ์สมุนไพร
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">
              ${hospitalName}
            </div>
            <div style="font-size: 11px; color: #64748b;">
              เอกสารควบคุมตามมาตรฐานการจัดเก็บและเบิกจ่ายเวชภัณฑ์ยาสมุนไพร (FEFO Protocol)
            </div>
          </div>
        </div>

        <div style="text-align: right;">
          <div style="
            display: inline-block; 
            background: #f0fdf4; 
            border: 1px solid #86efac; 
            padding: 4px 12px; 
            border-radius: 6px; 
            font-size: 12px; 
            font-weight: bold; 
            color: #166534;
          ">
            ใบสำคัญการเบิกจ่าย
          </div>
          <div style="font-size: 12px; color: #334155; margin-top: 6px;">
            ความเร่งด่วน: <strong style="color: ${slip.urgency === 'ด่วนที่สุด' ? '#b91c1c' : slip.urgency === 'ด่วน' ? '#c2410c' : '#047857'};">${slip.urgency || 'ปกติ'}</strong>
          </div>
        </div>
      </div>

      <!-- Document Title -->
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">
          ใบขอเบิกยาและเวชภัณฑ์สมุนไพร
        </div>
        <div style="font-size: 13px; color: #475569; margin-top: 2px;">
          HERBAL MEDICINE REQUISITION &amp; DISPENSING SLIP
        </div>
      </div>

      <!-- Info Box (Grid Layout) -->
      <div style="
        background: #f8fafc; 
        border: 1px solid #cbd5e1; 
        border-radius: 8px; 
        padding: 14px 18px; 
        margin-bottom: 18px;
        font-size: 13px;
      ">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div style="flex: 1;">
            <span style="color: #64748b;">เลขที่ใบเบิก:</span> 
            <strong style="font-family: monospace; font-size: 14px; color: #0f172a; margin-left: 6px; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">
              ${slip.slipNumber}
            </strong>
          </div>
          <div style="flex: 1; text-align: right;">
            <span style="color: #64748b;">วันที่ขอเบิก:</span> 
            <strong style="color: #0f172a; margin-left: 6px;">${formattedDate}</strong>
            ${slip.time ? `<span style="color: #64748b; font-size: 12px; margin-left: 6px;">(${slip.time} น.)</span>` : ''}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div style="flex: 1.2;">
            <span style="color: #64748b;">หน่วยงาน/แผนกที่ขอเบิก:</span> 
            <strong style="color: #0f172a; margin-left: 6px;">${slip.department}</strong>
          </div>
          <div style="flex: 0.8; text-align: right;">
            <span style="color: #64748b;">ผู้ขอเบิก:</span> 
            <strong style="color: #0f172a; margin-left: 6px;">${slip.requesterName}</strong>
            ${slip.requesterPosition ? `<span style="color: #64748b; font-size: 12px;"> (${slip.requesterPosition})</span>` : ''}
          </div>
        </div>

        <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 6px; display: flex; justify-content: space-between;">
          <div>
            <span style="color: #64748b;">วัตถุประสงค์การเบิก:</span> 
            <span style="color: #0f172a; margin-left: 6px;">${slip.purpose || 'เพื่อสำรองให้บริการรักษาผู้ป่วยตามแนวทางเวชปฏิบัติแพทย์แผนไทย'}</span>
          </div>
          <div style="color: #64748b; font-size: 12px;">
            สถานะ: <strong style="color: #047857;">จ่ายยาเรียบร้อย (Dispensed)</strong>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table style="
        width: 100%; 
        border-collapse: collapse; 
        border: 1.5px solid #0f172a; 
        margin-bottom: 12px;
      ">
        <thead>
          <tr style="background: #e2e8f0; color: #0f172a; font-size: 12.5px; border-bottom: 1.5px solid #0f172a;">
            <th style="padding: 8px 4px; width: 36px; text-align: center; border-right: 1px solid #0f172a;">ลำดับ</th>
            <th style="padding: 8px 8px; text-align: left; border-right: 1px solid #0f172a;">รายการยาสมุนไพร / ขนาดบรรจุ / ล็อตผลิต</th>
            <th style="padding: 8px 6px; width: 65px; text-align: center; border-right: 1px solid #0f172a;">คงคลัง</th>
            <th style="padding: 8px 6px; width: 75px; text-align: center; border-right: 1px solid #0f172a; background: #dcfce7; color: #14532d;">จำนวนเบิก</th>
            <th style="padding: 8px 6px; width: 55px; text-align: center; border-right: 1px solid #0f172a;">หน่วย</th>
            <th style="padding: 8px 6px; width: 75px; text-align: right; border-right: 1px solid #0f172a;">ราคา/หน่วย</th>
            <th style="padding: 8px 6px; width: 85px; text-align: right; border-right: 1px solid #0f172a;">รวมเงิน (บาท)</th>
            <th style="padding: 8px 6px; width: 110px; text-align: left;">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
          ${dummyRowsHTML}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; border-top: 1.5px solid #0f172a; font-weight: bold; font-size: 13px;">
            <td colspan="3" style="padding: 8px 12px; text-align: right; border-right: 1px solid #334155;">
              รวมทั้งสิ้น (${slip.items.length} รายการ):
            </td>
            <td style="padding: 8px 6px; text-align: center; border-right: 1px solid #334155; font-family: monospace; font-size: 14px; color: #047857;">
              ${slip.totalQuantity}
            </td>
            <td style="padding: 8px 6px; text-align: center; border-right: 1px solid #334155;">หน่วย</td>
            <td style="padding: 8px 6px; text-align: right; border-right: 1px solid #334155;">มูลค่ารวม:</td>
            <td style="padding: 8px 6px; text-align: right; border-right: 1px solid #334155; font-family: monospace; font-size: 14px; color: #0f172a;">
              ${slip.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </td>
            <td style="padding: 8px 6px; font-size: 11px; color: #475569;">บาท</td>
          </tr>
        </tfoot>
      </table>

      <!-- Baht Text Banner -->
      <div style="
        background: #f0fdf4; 
        border: 1px solid #bbf7d0; 
        padding: 8px 14px; 
        border-radius: 6px; 
        font-size: 13px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        margin-bottom: 24px;
      ">
        <div>
          <span style="color: #166534; font-weight: bold;">จำนวนเงินรวมทั้งสิ้น (ตัวอักษร):</span>
          <span style="color: #0f172a; font-weight: bold; margin-left: 8px;">(${totalBahtText})</span>
        </div>
        <div style="color: #166534; font-size: 12px;">
          จำนวนยาทั้งหมด <strong>${slip.totalQuantity}</strong> หน่วยบรรจุ
        </div>
      </div>

      <!-- Official Signatures Box (4 standard columns) -->
      <div style="
        border: 1px solid #94a3b8; 
        border-radius: 8px; 
        padding: 16px 12px; 
        background: #ffffff;
      ">
        <div style="font-size: 12px; font-weight: bold; color: #475569; text-align: center; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          หลักฐานการเบิก-จ่ายและอนุมัติเวชภัณฑ์ยา (Official Authorization &amp; Signatures)
        </div>

        <div style="display: flex; justify-content: space-between; gap: 10px;">
          
          <!-- Column 1: ผู้ขอเบิก -->
          <div style="flex: 1; text-align: center; border-right: 1px dashed #cbd5e1; padding-right: 8px;">
            <div style="font-size: 12px; color: #475569; margin-bottom: 30px;">
              (1) ผู้ขอเบิก
            </div>
            <div style="border-bottom: 1px dotted #64748b; width: 85%; margin: 0 auto 6px auto;"></div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a;">
              (${slip.requesterName || '...................................................'})
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ตำแหน่ง: ${slip.requesterPosition || '...........................................'}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              วันที่: ....../....../............
            </div>
          </div>

          <!-- Column 2: ผู้จ่ายยา -->
          <div style="flex: 1; text-align: center; border-right: 1px dashed #cbd5e1; padding-right: 8px;">
            <div style="font-size: 12px; color: #475569; margin-bottom: 30px;">
              (2) ผู้จ่ายยา (คลังยา)
            </div>
            <div style="border-bottom: 1px dotted #64748b; width: 85%; margin: 0 auto 6px auto;"></div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a;">
              (${slip.dispenserName || '...................................................'})
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ตำแหน่ง: เภสัชกร / เจ้าหน้าที่คลัง
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              วันที่: ....../....../............
            </div>
          </div>

          <!-- Column 3: ผู้รับยา -->
          <div style="flex: 1; text-align: center; border-right: 1px dashed #cbd5e1; padding-right: 8px;">
            <div style="font-size: 12px; color: #475569; margin-bottom: 30px;">
              (3) ผู้รับยา
            </div>
            <div style="border-bottom: 1px dotted #64748b; width: 85%; margin: 0 auto 6px auto;"></div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a;">
              (${slip.receiverName || slip.requesterName || '...................................................'})
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ตำแหน่ง: ผู้รับมอบเวชภัณฑ์
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              วันที่: ....../....../............
            </div>
          </div>

          <!-- Column 4: ผู้อนุมัติ -->
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 12px; color: #475569; margin-bottom: 30px;">
              (4) ผู้อนุมัติ
            </div>
            <div style="border-bottom: 1px dotted #64748b; width: 85%; margin: 0 auto 6px auto;"></div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a;">
              (${slip.approverName || '...................................................'})
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ตำแหน่ง: หัวหน้ากลุ่มงาน / ผู้อำนวยการ
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              วันที่: ....../....../............
            </div>
          </div>

        </div>
      </div>

      <!-- Footer Note & Anti-tampering metadata -->
      <div style="
        margin-top: 22px; 
        padding-top: 10px; 
        border-top: 1px solid #e2e8f0; 
        display: flex; 
        justify-content: space-between; 
        font-size: 10.5px; 
        color: #94a3b8;
      ">
        <div>
          * หมายเหตุ: ใบเบิกยานี้ได้รับการสร้างและบันทึกตัดยอดสต๊อกการ์ดอัตโนมัติ ห้ามแก้ไขข้อความ
        </div>
        <div style="font-family: monospace;">
          เอกสารรหัส: ${slip.slipNumber} • พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}
        </div>
      </div>

    </div>
  `;
}

/**
 * Generates a complete standalone HTML document for printing or opening in a new tab
 */
export function generateStandaloneRequisitionHTML(
  slip: RequisitionSlip,
  hospitalName: string = 'คลังยาสมุนไพร รพ.สต.บ้านท่าคล้อ'
): string {
  const slipInner = generateRequisitionSlipHTML(slip, hospitalName);
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ใบเบิกยาสมุนไพร_${slip.slipNumber || 'REQ'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Prompt:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f1f5f9;
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 24px 12px;
      color: #0f172a;
    }
    .print-bar {
      max-width: 794px;
      margin: 0 auto 16px auto;
      background: #0f172a;
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-action {
      background: #059669;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .btn-action:hover { background: #047857; }
    .btn-close {
      background: transparent;
      color: #cbd5e1;
      border: 1px solid #475569;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      margin-left: 8px;
    }
    .btn-close:hover { background: #1e293b; }
    .paper-sheet {
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border-radius: 4px;
      overflow: hidden;
    }
    @media print {
      body { background: white; padding: 0; }
      .print-bar { display: none !important; }
      .paper-sheet { box-shadow: none; margin: 0; width: 100%; min-height: auto; border-radius: 0; }
      @page { size: A4 portrait; margin: 8mm 10mm; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <div>
      <div style="font-weight: 700; font-size: 14px;">ใบขอเบิกยาและเวชภัณฑ์สมุนไพร (${slip.slipNumber})</div>
      <div style="font-size: 11px; color: #94a3b8;">มาตรฐาน A4 แนวตั้ง • ข้อความและตารางล็อกตำแหน่ง 4 ฝ่าย</div>
    </div>
    <div>
      <button class="btn-action" onclick="window.print()">สั่งพิมพ์ทันที (Print / Save as PDF)</button>
      <button class="btn-close" onclick="window.close()">ปิดหน้าต่าง</button>
    </div>
  </div>
  <div class="paper-sheet">
    ${slipInner}
  </div>
</body>
</html>`;
}

/**
 * Opens the requisition slip in a new browser window for direct printing or browser-native PDF export
 */
export function openRequisitionInNewTab(
  slip: RequisitionSlip,
  hospitalName?: string
): void {
  const html = generateStandaloneRequisitionHTML(slip, hospitalName);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const newWin = window.open(url, '_blank');
  if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
    // Popup blocked: fallback to direct HTML file download
    downloadRequisitionHTML(slip, hospitalName);
  }
}

/**
 * Direct download of the requisition slip as a standalone printable HTML document
 */
export function downloadRequisitionHTML(
  slip: RequisitionSlip,
  hospitalName?: string
): void {
  const html = generateStandaloneRequisitionHTML(slip, hospitalName);
  const cleanNumber = (slip.slipNumber || 'REQ').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `ใบเบิกยา_${cleanNumber}_${slip.date || new Date().toISOString().slice(0, 10)}.html`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Downloads a RequisitionSlip directly as a locked, non-shifting PDF file ("ป้องกันไฟล์เคลื่อน")
 * Uses high-resolution html2canvas rasterization into a fixed vector A4 jsPDF container.
 */
export async function downloadRequisitionPDF(
  slip: RequisitionSlip,
  hospitalName: string = 'คลังยาสมุนไพร รพ.สต.บ้านท่าคล้อ'
): Promise<boolean> {
  let container: HTMLDivElement | null = null;
  try {
    // 1. Create off-screen container in normal screen coordinates (0, 0) with zIndex -9999
    // This avoids html2canvas negative coordinate clipping errors that occur with top: -99999px
    container = document.createElement('div');
    container.id = 'temp-pdf-requisition-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '794px';
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '-9999';
    container.style.opacity = '0.01';
    container.style.pointerEvents = 'none';
    container.style.boxSizing = 'border-box';
    container.innerHTML = generateRequisitionSlipHTML(slip, hospitalName);

    document.body.appendChild(container);

    // Give DOM time to calculate layout & font rendering
    await new Promise((resolve) => setTimeout(resolve, 150));

    const targetElement = (container.firstElementChild as HTMLElement) || container;

    // 2. High-resolution canvas rendering (scale: 2 for 300dpi equivalent sharp text and borders)
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: 794,
      windowWidth: 794,
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas rendering produced zero dimensions');
    }

    const imgData = canvas.toDataURL('image/png');

    // 3. Create A4 jsPDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210; // A4 mm
    const pageHeight = 297; // A4 mm
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Multi-page handling if requisition has numerous items
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // 4. Save and trigger direct download with reliable Blob URL fallback
    const cleanNumber = (slip.slipNumber || 'REQ').replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `ใบเบิกยา_${cleanNumber}_${slip.date || new Date().toISOString().slice(0, 10)}.pdf`;

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
  } catch (error) {
    console.error('Error generating requisition PDF:', error);
    // Automatic fallback: Try downloading standalone HTML if canvas fails so user is never blocked
    try {
      downloadRequisitionHTML(slip, hospitalName);
      return true;
    } catch (fallbackErr) {
      console.error('HTML fallback also failed:', fallbackErr);
      return false;
    }
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Convenience helper to download a single transaction as an official requisition slip PDF
 */
export async function downloadSingleTxRequisitionPDF(
  herb: HerbItem,
  lot: StockCardLot,
  tx: StockTransaction,
  options?: {
    slipNumber?: string;
    department?: string;
    requesterName?: string;
    purpose?: string;
    hospitalName?: string;
  }
): Promise<boolean> {
  const reqNumber = options?.slipNumber || `REQ-${new Date().getFullYear() + 543}-${String(Date.now()).slice(-4)}`;
  const qty = tx.dispensed > 0 ? tx.dispensed : (tx.received > 0 ? tx.received : tx.balance);
  const unitPrice = lot.unitPrice || 0;
  const totalPrice = qty * unitPrice;

  const slip: RequisitionSlip = {
    id: `req-${Date.now()}`,
    slipNumber: reqNumber,
    date: tx.date.includes('/') ? tx.date.split('/').reverse().join('-') : tx.date,
    time: '10:00',
    department: options?.department || tx.requesterOrDispenser || 'ห้องจ่ายยา OPD',
    requesterName: options?.requesterName || tx.requesterOrDispenser || 'เจ้าหน้าที่ผู้เบิก',
    requesterPosition: 'ผู้ขอเบิกยา',
    dispenserName: 'ภญ. ประจำคลังยาสมุนไพร',
    receiverName: tx.requesterOrDispenser || 'ผู้รับมอบยา',
    approverName: 'หัวหน้ากลุ่มงานการแพทย์แผนไทย',
    purpose: options?.purpose || tx.note || 'เบิกจ่ายยาตามบันทึกสต๊อกการ์ด',
    urgency: 'ปกติ',
    status: 'dispensed',
    items: [
      {
        id: `item-${Date.now()}`,
        herbId: herb.id,
        herbName: herb.name,
        category: herb.category,
        lotId: lot.id,
        lotNo: lot.lotNo,
        expDate: lot.expDate,
        availableStock: tx.broughtForward,
        requestedQty: qty,
        unit: herb.defaultUnit,
        unitPrice,
        totalPrice,
        note: tx.note || 'เบิกจ่ายประจำวัน',
      },
    ],
    totalQuantity: qty,
    totalValue: totalPrice,
    createdAt: tx.timestamp || Date.now(),
  };

  return await downloadRequisitionPDF(slip, options?.hospitalName);
}
