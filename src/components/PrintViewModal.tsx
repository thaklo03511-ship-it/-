import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  ExternalLink,
  Download,
  CheckSquare, 
  Square, 
  ChevronLeft,
  Info,
  AlertCircle
} from 'lucide-react';
import { HerbItem, StockCardLot } from '../types';
import { 
  formatDateThai, 
  printStockCardsDirect, 
  openPrintableInNewTab, 
  downloadPrintableHTML,
  downloadStockCardPDF
} from '../utils/stockUtils';

interface PrintViewModalProps {
  herbs: HerbItem[];
  preSelectedHerb?: HerbItem | null;
  onClose: () => void;
}

export const PrintViewModal: React.FC<PrintViewModalProps> = ({
  herbs,
  preSelectedHerb,
  onClose,
}) => {
  // Mode: 'single' | 'selected' | 'all'
  const [printMode, setPrintMode] = useState<'single' | 'selected' | 'all'>(
    preSelectedHerb ? 'single' : 'all'
  );

  const [selectedHerbIds, setSelectedHerbIds] = useState<string[]>(
    preSelectedHerb ? [preSelectedHerb.id] : herbs.slice(0, 4).map(h => h.id)
  );

  const [fillTransactions, setFillTransactions] = useState<boolean>(true);

  // Single herb selection
  const [currentSingleHerbId, setCurrentSingleHerbId] = useState<string>(
    preSelectedHerb?.id || (herbs[0]?.id || '')
  );

  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfProgressMsg, setPdfProgressMsg] = useState<string>('');
  const [printNotice, setPrintNotice] = useState<string>('');

  const handleToggleSelectAll = () => {
    if (selectedHerbIds.length === herbs.length) {
      setSelectedHerbIds([]);
    } else {
      setSelectedHerbIds(herbs.map(h => h.id));
    }
  };

  const handleToggleHerb = (id: string) => {
    if (selectedHerbIds.includes(id)) {
      setSelectedHerbIds(selectedHerbIds.filter(x => x !== id));
    } else {
      setSelectedHerbIds([...selectedHerbIds, id]);
    }
  };

  // Determine list of herbs to render in print view
  const herbsToPrint = printMode === 'single'
    ? herbs.filter(h => h.id === currentSingleHerbId)
    : printMode === 'selected'
      ? herbs.filter(h => selectedHerbIds.includes(h.id))
      : herbs;

  /**
   * Primary Action: Download Locked Vector/Image A4 Landscape PDF (4 cards per page)
   * Eliminates browser print shifting, margins and pagination problems completely.
   */
  const handleDownloadPDF = async () => {
    if (herbsToPrint.length === 0) return;
    setIsDownloadingPdf(true);
    setPdfProgressMsg('กำลังเตรียมสร้าง PDF...');
    setPrintNotice('กำลังเรนเดอร์และสร้างไฟล์ PDF ขนาด A4 แนวนอน (4 ช่อง/หน้า) เพื่อล็อกหน้ากระดาษและป้องกันไฟล์เคลื่อน...');

    try {
      const success = await downloadStockCardPDF(
        herbsToPrint,
        fillTransactions,
        (current, total, msg) => {
          setPdfProgressMsg(`กำลังสร้าง PDF (${current}/${total})...`);
          setPrintNotice(msg);
        }
      );

      if (success) {
        setPrintNotice('ดาวน์โหลดไฟล์ PDF บัตรสต๊อกการ์ด 4 ช่อง/หน้า เรียบร้อยแล้ว (ป้องกันการเคลื่อน 100%)');
      } else {
        setPrintNotice('เกิดข้อผิดพลาดในการสร้าง PDF กำลังเปิดหน้าพิมพ์ในแท็บใหม่แทน');
        openPrintableInNewTab(herbsToPrint, fillTransactions);
      }
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setPrintNotice('ไม่สามารถสร้าง PDF ได้ กำลังเปิดหน้าพิมพ์ในแท็บใหม่แทน');
      openPrintableInNewTab(herbsToPrint, fillTransactions);
    } finally {
      setIsDownloadingPdf(false);
      setTimeout(() => setPrintNotice(''), 5000);
    }
  };

  /**
   * Secondary Action: Browser Direct Print (window.print / iframe)
   */
  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintNotice('กำลังเตรียมเอกสารสำหรับพิมพ์...');

    try {
      // 1. Try direct printing engine (iframe/window)
      await printStockCardsDirect(herbsToPrint, fillTransactions);
      setPrintNotice('ส่งคำสั่งพิมพ์ไปยังเครื่องพิมพ์เรียบร้อยแล้ว');
      setTimeout(() => setPrintNotice(''), 3500);
    } catch (err) {
      console.warn('Direct print attempt threw error, falling back to new tab:', err);
      // 2. Guaranteed fallback: open printable page in new tab
      openPrintableInNewTab(herbsToPrint, fillTransactions);
      setPrintNotice('เปิดหน้าพิมพ์ในแท็บใหม่เรียบร้อยแล้ว');
      setTimeout(() => setPrintNotice(''), 3500);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleOpenNewTab = () => {
    openPrintableInNewTab(herbsToPrint, fillTransactions);
  };

  const handleDownloadHTML = () => {
    downloadPrintableHTML(herbsToPrint, fillTransactions);
  };

  // Render an individual Stock Card box (4-box layout in 2x2 grid)
  const renderCardBox = (herb: HerbItem, lot?: StockCardLot, cardIndex?: number) => {
    const transactions = fillTransactions && lot ? lot.transactions : [];
    const maxRows = 12; // Standard lines in PDF

    return (
      <div 
        key={`${herb.id}-${lot?.id || 'card'}-${cardIndex}`} 
        className="stock-card-print-box border-2 border-black p-2 bg-white flex flex-col justify-between text-black text-[11px]"
        style={{ minHeight: '340px' }}
      >
        {/* Card Header: Lot.No, Exp.date, ขนาดบรรจุ, ราคา */}
        <div className="border-b border-black pb-1 mb-1 leading-tight">
          <div className="flex justify-between items-center text-[10px] mb-0.5">
            <span className="truncate">
              Lot.No <strong>{lot?.lotNo || '.....................................'}</strong>
            </span>
            <span className="truncate">
              Exp.date <strong>{lot?.expDate ? formatDateThai(lot.expDate) : '.....................................'}</strong>
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="truncate">
              ขนาดบรรจุ <strong>{lot?.packaging || herb.defaultPackaging || '...............................'}</strong>
            </span>
            <span className="truncate">
              ราคาต่อหน่วยบรรจุ <strong>{lot?.unitPrice ? `${lot.unitPrice}` : '...................'}</strong> บาท.
            </span>
          </div>
        </div>

        {/* 6 Column Table */}
        <div className="flex-1">
          <table className="stock-card-table w-full border-collapse text-center text-[9.5px]">
            <thead>
              <tr className="border-b border-black font-semibold">
                <th className="border border-black py-0.5 px-1 w-[20%] text-center">วัน เดือน ปี</th>
                <th className="border border-black py-0.5 px-0.5 w-[14%] text-center">ยกมา</th>
                <th className="border border-black py-0.5 px-0.5 w-[14%] text-center">รับใหม่</th>
                <th className="border border-black py-0.5 px-0.5 w-[14%] text-center">จ่าย</th>
                <th className="border border-black py-0.5 px-0.5 w-[14%] text-center">คงเหลือ</th>
                <th className="border border-black py-0.5 px-1 w-[24%] text-center">ผู้เบิก / ผู้จ่าย</th>
              </tr>
            </thead>
            <tbody>
              {/* Filled transaction rows */}
              {transactions.slice(0, maxRows).map((tx, rIdx) => (
                <tr key={tx.id || rIdx} className="h-5">
                  <td className="border border-black py-0.2 px-0.5 text-center font-mono">
                    {formatDateThai(tx.date, false)}
                  </td>
                  <td className="border border-black py-0.2 px-0.5 text-center font-mono">
                    {tx.broughtForward > 0 ? tx.broughtForward : ''}
                  </td>
                  <td className="border border-black py-0.2 px-0.5 text-center font-mono font-semibold">
                    {tx.received > 0 ? tx.received : ''}
                  </td>
                  <td className="border border-black py-0.2 px-0.5 text-center font-mono font-semibold">
                    {tx.dispensed > 0 ? tx.dispensed : ''}
                  </td>
                  <td className="border border-black py-0.2 px-0.5 text-center font-mono font-bold">
                    {tx.balance}
                  </td>
                  <td className="border border-black py-0.2 px-1 text-left truncate max-w-[85px]">
                    {tx.requesterOrDispenser}
                  </td>
                </tr>
              ))}

              {/* Blank lines to fill up to maxRows like the template */}
              {Array.from({ length: Math.max(0, maxRows - transactions.length) }).map((_, bIdx) => (
                <tr key={`blank-${bIdx}`} className="h-5">
                  <td className="border border-black py-0.2">&nbsp;</td>
                  <td className="border border-black py-0.2">&nbsp;</td>
                  <td className="border border-black py-0.2">&nbsp;</td>
                  <td className="border border-black py-0.2">&nbsp;</td>
                  <td className="border border-black py-0.2">&nbsp;</td>
                  <td className="border border-black py-0.2">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print-container-modal">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[96vh] print-modal-content">
        
        {/* Modal Top Control Bar (Hidden when printing via .no-print) */}
        <div className="no-print p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                <span>พิมพ์บัตรสต๊อกการ์ด (Stock Card) 4 ช่อง/หน้า</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-normal">
                  {herbsToPrint.length} หน้า A4
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                คลังยาสมุนไพร รพ.สต.บ้านท่าคล้อ • จัดรูปแบบ 2x2 ต่อหน้า A4 แนวนอน ตรงตามแบบฟอร์มเอกสารยาสมุนไพร
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Selector */}
            <div className="flex items-center p-0.5 bg-slate-200 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setPrintMode('single')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  printMode === 'single' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ยาเฉพาะรายการ
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('selected')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  printMode === 'selected' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เลือกตามต้องการ ({selectedHerbIds.length})
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('all')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  printMode === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                พิมพ์ทั้งหมด ({herbs.length})
              </button>
            </div>

            {/* Checkbox: Fill with data vs Blank */}
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={fillTransactions}
                onChange={(e) => setFillTransactions(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>ใส่ข้อมูลรับ-จ่ายจริง</span>
            </label>

            {/* Primary Action Button: Download Locked PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf || herbsToPrint.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="ดาวน์โหลดเป็นไฟล์ PDF ขนาด A4 แนวนอน (4 ช่อง/หน้า) ป้องกันการเคลื่อน 100%"
            >
              {isDownloadingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{pdfProgressMsg || 'กำลังสร้าง PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ PDF (4 ช่อง/หน้า)</span>
                </>
              )}
            </button>

            {/* Secondary Button: Browser Print */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || isDownloadingPdf || herbsToPrint.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="สั่งพิมพ์ผ่านเบราว์เซอร์ทันที"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isPrinting ? 'กำลังเตรียม...' : 'พิมพ์ผ่านเบราว์เซอร์'}</span>
            </button>

            {/* Guaranteed Fallback 1: Open in New Tab */}
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="เปิดหน้าสำหรับพิมพ์ในแท็บใหม่"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">เปิดในแท็บใหม่</span>
            </button>

            {/* Guaranteed Fallback 2: Download HTML */}
            <button
              type="button"
              onClick={handleDownloadHTML}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
              title="ดาวน์โหลดเป็นไฟล์ HTML ไว้เปิดดูภายหลัง"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Notice alert banner */}
        {printNotice && (
          <div className="no-print mx-4 sm:mx-6 mt-3 p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
            <span className="font-medium flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              {printNotice}
            </span>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="underline font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer ml-2 shrink-0"
            >
              ดาวน์โหลด PDF
            </button>
          </div>
        )}

        {/* Secondary options toolbar when in 'single' or 'selected' mode */}
        {printMode === 'single' && (
          <div className="no-print px-6 py-2.5 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">เลือกยาสมุนไพรที่ต้องการพิมพ์:</span>
            <select
              value={currentSingleHerbId}
              onChange={(e) => setCurrentSingleHerbId(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 font-medium"
            >
              {herbs.map((h, idx) => (
                <option key={h.id} value={h.id}>
                  {idx + 1}. {h.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {printMode === 'selected' && (
          <div className="no-print px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-emerald-700 hover:underline font-medium cursor-pointer"
              >
                {selectedHerbIds.length === herbs.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">เลือกแล้ว {selectedHerbIds.length} รายการ</span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto max-w-xl pb-1">
              {herbs.slice(0, 15).map(h => {
                const isSelected = selectedHerbIds.includes(h.id);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleToggleHerb(h.id)}
                    className={`px-2 py-0.5 rounded text-[11px] border whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {h.name.split(' ')[0]}
                  </button>
                );
              })}
              {herbs.length > 15 && <span className="text-slate-400 text-xs">...</span>}
            </div>
          </div>
        )}

        {/* Printable Paper Canvas Area (Supports Screen Preview & Real Print) */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-200/60 print:bg-white print:p-0 print-scroll-area">
          <div className="max-w-[297mm] mx-auto space-y-8 print:space-y-0">
            {herbsToPrint.map((herb) => {
              const lot0 = herb.lots[0];
              const lot1 = herb.lots[1] || (herb.lots.length === 1 ? undefined : lot0);
              const lot2 = herb.lots[2] || (herb.lots.length <= 2 ? undefined : lot0);
              const lot3 = herb.lots[3] || (herb.lots.length <= 3 ? undefined : lot0);

              return (
                <div 
                  key={herb.id} 
                  className="bg-white p-6 sm:p-8 shadow-md rounded-lg print:shadow-none print:p-2 print-page-break print:m-0 border border-slate-300 print:border-none"
                  style={{ minHeight: '190mm' }}
                >
                  {/* Page Title: Medicine Name (Centered bold font as in PDF) */}
                  <div className="text-center pb-3">
                    <h2 className="text-xl sm:text-2xl font-bold font-heading text-black tracking-wide">
                      {herb.name}
                    </h2>
                  </div>

                  {/* 2x2 Stock Card Grid (Exact reproduction of the PDF page layout) */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 print:gap-2">
                    {/* Card 1: Top Left */}
                    {renderCardBox(herb, lot0, 1)}

                    {/* Card 2: Top Right */}
                    {renderCardBox(herb, lot1, 2)}

                    {/* Card 3: Bottom Left */}
                    {renderCardBox(herb, lot2, 3)}

                    {/* Card 4: Bottom Right */}
                    {renderCardBox(herb, lot3, 4)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="no-print p-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              💡 <strong>แนะนำ:</strong> ดาวน์โหลดเป็นไฟล์ PDF (A4 แนวนอน 4 ช่อง/หน้า) จะล็อกตำแหน่งเส้นตารางและขนาดอักษร ไม่เลื่อน ไม่ตกขอบกระดาษ
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf || herbsToPrint.length === 0}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg inline-flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>ดาวน์โหลดไฟล์ PDF</span>
            </button>
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
            >
              เปิดในแท็บใหม่
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
