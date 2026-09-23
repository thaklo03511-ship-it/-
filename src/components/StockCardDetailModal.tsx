import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  CheckCircle,
  FileSpreadsheet,
  FileDown,
  FileCheck,
  ShieldCheck,
  Layers,
  Edit3,
  Star,
  Search,
  ArrowUpDown,
  Check,
  Package,
  Building2,
  ListOrdered,
  Download
} from 'lucide-react';
import { HerbItem, StockCardLot, StockTransaction } from '../types';
import { 
  formatDateThai, 
  getExpiryStatus, 
  getLotBalance,
  exportSingleHerbStockCardCSV,
  generateSuggestedLotNo,
  getLotCalculations,
  sortLots,
  downloadStockCardPDF
} from '../utils/stockUtils';
import { downloadSingleTxRequisitionPDF } from '../utils/requisitionPdfUtils';

interface StockCardDetailModalProps {
  herb: HerbItem;
  onClose: () => void;
  onUpdateHerb: (updatedHerb: HerbItem) => void;
  onPrintCard: (herb: HerbItem, lotId?: string) => void;
  onOpenRequisitionModal?: (herb: HerbItem) => void;
  readOnly?: boolean;
  onRequireUnlock?: (actionName: string) => void;
}

export const StockCardDetailModal: React.FC<StockCardDetailModalProps> = ({
  herb,
  onClose,
  onUpdateHerb,
  onPrintCard,
  onOpenRequisitionModal,
  readOnly = false,
  onRequireUnlock,
}) => {
  // View mode: 'card' (single lot Stock Card) vs 'all-lots' (table overview of all batches)
  const [viewMode, setViewMode] = useState<'card' | 'all-lots'>('card');

  // Active Lot selection
  const [selectedLotId, setSelectedLotId] = useState<string>(
    herb.activeLotId || herb.lots[0]?.id || ''
  );

  // New transaction form state
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [txType, setTxType] = useState<'receive' | 'dispense' | 'broughtForward'>('dispense');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [txAmount, setTxAmount] = useState<string>('');
  const [txRequester, setTxRequester] = useState<string>('ห้องจ่ายยา OPD');
  const [txNote, setTxNote] = useState<string>('');
  const [txDownloadPdf, setTxDownloadPdf] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [txError, setTxError] = useState<string>('');

  // New Lot form state
  const [isAddingLot, setIsAddingLot] = useState(false);
  const [newLotNo, setNewLotNo] = useState('');
  const [newMfgDate, setNewMfgDate] = useState(new Date().toISOString().slice(0, 10));
  const [newExpDate, setNewExpDate] = useState('');
  const [newPackaging, setNewPackaging] = useState(herb.defaultPackaging);
  const [newUnitPrice, setNewUnitPrice] = useState(herb.lots[0]?.unitPrice ? String(herb.lots[0].unitPrice) : '100');
  const [newSupplier, setNewSupplier] = useState('ฝ่ายผลิตยาสมุนไพร รพ.');
  const [newInitialQty, setNewInitialQty] = useState('0');
  const [newLotNotes, setNewLotNotes] = useState('');
  const [setAsActiveImmediately, setSetAsActiveImmediately] = useState(true);

  // Edit Lot form state
  const [isEditingLot, setIsEditingLot] = useState(false);
  const [editLotNo, setEditLotNo] = useState('');
  const [editMfgDate, setEditMfgDate] = useState('');
  const [editExpDate, setEditExpDate] = useState('');
  const [editPackaging, setEditPackaging] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const [editSupplier, setEditSupplier] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // All lots search & filter in overview
  const [lotsSearch, setLotsSearch] = useState('');
  const [lotsSort, setLotsSort] = useState<'fefo' | 'newest' | 'oldest' | 'lotNo'>('fefo');
  const [lotsStatusFilter, setLotsStatusFilter] = useState<'all' | 'available' | 'depleted' | 'expired'>('all');

  const currentLot = herb.lots.find(l => l.id === selectedLotId) || herb.lots[0];
  const lotBalance = currentLot ? getLotBalance(currentLot) : 0;
  const expiry = currentLot ? getExpiryStatus(currentLot.expDate) : null;
  const currentLotIdx = herb.lots.findIndex(l => l.id === (currentLot?.id || ''));

  // Open Edit Lot modal
  const handleStartEditLot = (lot: StockCardLot) => {
    setEditLotNo(lot.lotNo);
    setEditMfgDate(lot.mfgDate || '');
    setEditExpDate(lot.expDate);
    setEditPackaging(lot.packaging || herb.defaultPackaging);
    setEditUnitPrice(lot.unitPrice !== undefined ? String(lot.unitPrice) : '0');
    setEditSupplier(lot.supplierOrManufacturer || '');
    setEditNotes(lot.notes || '');
    setIsEditingLot(true);
  };

  const handleSaveEditLot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLotNo.trim() || !editExpDate) {
      alert('กรุณากรอกเลขที่ Lot.No และวันหมดอายุ');
      return;
    }

    const updatedLots = herb.lots.map(l => {
      if (l.id === currentLot.id) {
        return {
          ...l,
          lotNo: editLotNo.trim(),
          mfgDate: editMfgDate || undefined,
          expDate: editExpDate,
          packaging: editPackaging.trim() || herb.defaultPackaging,
          unitPrice: parseFloat(editUnitPrice) || 0,
          supplierOrManufacturer: editSupplier.trim() || undefined,
          notes: editNotes.trim() || undefined,
        };
      }
      return l;
    });

    onUpdateHerb({
      ...herb,
      lots: updatedLots,
      updatedAt: Date.now(),
    });

    setIsEditingLot(false);
  };

  // Set lot as primary active lot
  const handleSetActiveLot = (lotId: string) => {
    onUpdateHerb({
      ...herb,
      activeLotId: lotId,
      updatedAt: Date.now(),
    });
    setSelectedLotId(lotId);
  };

  // Delete a lot
  const handleDeleteLot = (lotId: string) => {
    if (herb.lots.length <= 1) {
      alert('ไม่สามารถลบล็อตนี้ได้ เนื่องจากยาต้องมีอย่างน้อย 1 ล็อตในระบบ');
      return;
    }

    const targetLot = herb.lots.find(l => l.id === lotId);
    if (!confirm(`คุณต้องการลบล็อตการผลิต "${targetLot?.lotNo || lotId}" ใช่หรือไม่?\nรายการบันทึกทั้งหมดของล็อตนี้จะถูกลบ`)) {
      return;
    }

    const remainingLots = herb.lots.filter(l => l.id !== lotId);
    const newActive = herb.activeLotId === lotId ? remainingLots[0].id : herb.activeLotId;

    onUpdateHerb({
      ...herb,
      lots: remainingLots,
      activeLotId: newActive,
      updatedAt: Date.now(),
    });

    if (selectedLotId === lotId) {
      setSelectedLotId(remainingLots[0].id);
    }
  };

  // Handle adding a new transaction row to the current lot
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setTxError('');

    if (readOnly) {
      if (onRequireUnlock) {
        onRequireUnlock('บันทึก รับ-จ่าย ยาสมุนไพร');
      } else {
        setTxError('อยู่ในโหมดดูข้อมูลอย่างเดียว กรุณาปลดล็อกด้วยรหัสผ่านเจ้าหน้าที่เพื่อแก้ไข');
      }
      return;
    }

    const qty = parseFloat(txAmount);
    if (isNaN(qty) || qty <= 0) {
      setTxError('กรุณาระบุจำนวนที่ถูกต้องมากกว่า 0');
      return;
    }

    if (!txRequester.trim()) {
      setTxError('กรุณาระบุผู้เบิก / ผู้จ่าย');
      return;
    }

    if (txType === 'dispense' && qty > lotBalance) {
      setTxError(`จำนวนที่เบิกจ่าย (${qty}) มากกว่ายอดคงเหลือในล็อต (${lotBalance})`);
      return;
    }

    const previousBalance = lotBalance;
    let received = 0;
    let dispensed = 0;
    let broughtForward = 0;
    let newBalance = previousBalance;

    if (txType === 'receive') {
      received = qty;
      newBalance = previousBalance + received;
    } else if (txType === 'dispense') {
      dispensed = qty;
      newBalance = previousBalance - dispensed;
    } else if (txType === 'broughtForward') {
      broughtForward = qty;
      newBalance = qty;
    }

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: txDate,
      broughtForward: txType === 'broughtForward' ? broughtForward : previousBalance,
      received,
      dispensed,
      balance: newBalance,
      requesterOrDispenser: txRequester.trim(),
      note: txNote.trim(),
      timestamp: Date.now(),
    };

    const updatedLots = herb.lots.map(lot => {
      if (lot.id === currentLot.id) {
        return {
          ...lot,
          transactions: [...lot.transactions, newTx]
        };
      }
      return lot;
    });

    onUpdateHerb({
      ...herb,
      lots: updatedLots,
      updatedAt: Date.now(),
    });

    // If dispensing and download PDF requested, trigger PDF download
    if (txType === 'dispense' && txDownloadPdf) {
      setIsGeneratingPdf(true);
      downloadSingleTxRequisitionPDF(herb, currentLot, newTx, {
        department: txRequester.trim(),
        requesterName: txRequester.trim(),
        purpose: txNote.trim() || 'เบิกจ่ายยาตามบันทึกสต๊อกการ์ด',
      }).finally(() => {
        setIsGeneratingPdf(false);
      });
    }

    // Reset form
    setTxAmount('');
    setTxNote('');
    setIsAddingTx(false);
  };

  // Handle deleting a transaction
  const handleDeleteTransaction = (txId: string) => {
    if (!confirm('ต้องการลบรายการนี้ใช่หรือไม่? ยอดคงเหลือในแถวถัดไปจะถูกคำนวณใหม่')) return;

    const filtered = currentLot.transactions.filter(t => t.id !== txId);
    
    // Recalculate balances sequentially
    let runningBalance = 0;
    const recalculated = filtered.map((tx, idx) => {
      if (idx === 0 && tx.broughtForward > 0 && tx.received === 0 && tx.dispensed === 0) {
        runningBalance = tx.broughtForward;
        return { ...tx, balance: runningBalance };
      }
      const bFwd = runningBalance;
      runningBalance = bFwd + tx.received - tx.dispensed;
      return {
        ...tx,
        broughtForward: bFwd,
        balance: runningBalance,
      };
    });

    const updatedLots = herb.lots.map(lot => {
      if (lot.id === currentLot.id) {
        return {
          ...lot,
          transactions: recalculated,
        };
      }
      return lot;
    });

    onUpdateHerb({
      ...herb,
      lots: updatedLots,
      updatedAt: Date.now(),
    });
  };

  // Suggest a Lot.No
  const handleAutoSuggestLot = () => {
    setNewLotNo(generateSuggestedLotNo(herb));
  };

  // Handle adding a new Lot (unlimited batches)
  const handleCreateLot = (e: React.FormEvent) => {
    e.preventDefault();

    if (readOnly) {
      if (onRequireUnlock) {
        onRequireUnlock('เพิ่มล็อตการผลิตใหม่');
      } else {
        alert('อยู่ในโหมดดูข้อมูลอย่างเดียว กรุณาปลดล็อกด้วยรหัสผ่านเจ้าหน้าที่เพื่อแก้ไข');
      }
      return;
    }

    if (!newLotNo.trim()) {
      alert('กรุณากรอกเลขที่ Lot.No');
      return;
    }
    if (!newExpDate) {
      alert('กรุณาระบุวันหมดอายุ');
      return;
    }

    // Check if lotNo already exists in this herb
    const exists = herb.lots.some(l => l.lotNo.trim().toLowerCase() === newLotNo.trim().toLowerCase());
    if (exists) {
      if (!confirm(`เลขที่ Lot.No "${newLotNo}" มีอยู่แล้วในรายการยานี้ ต้องการเพิ่มซ้ำหรือไม่?`)) {
        return;
      }
    }

    const initQty = parseFloat(newInitialQty) || 0;
    const lotId = `lot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const initialTxs: StockTransaction[] = [];

    if (initQty > 0) {
      initialTxs.push({
        id: `tx-${Date.now()}`,
        date: newMfgDate || new Date().toISOString().slice(0, 10),
        broughtForward: 0,
        received: initQty,
        dispensed: 0,
        balance: initQty,
        requesterOrDispenser: newSupplier.trim() || 'รับเข้าคลังเปิดล็อตใหม่',
        note: newLotNotes.trim() || 'เปิดล็อตการผลิตใหม่',
        timestamp: Date.now(),
      });
    }

    const newLot: StockCardLot = {
      id: lotId,
      lotNo: newLotNo.trim(),
      mfgDate: newMfgDate || undefined,
      expDate: newExpDate,
      packaging: newPackaging || herb.defaultPackaging,
      unitPrice: parseFloat(newUnitPrice) || 0,
      supplierOrManufacturer: newSupplier.trim() || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
      transactions: initialTxs,
      notes: newLotNotes.trim() || undefined,
    };

    onUpdateHerb({
      ...herb,
      lots: [...herb.lots, newLot],
      activeLotId: setAsActiveImmediately ? lotId : herb.activeLotId,
      updatedAt: Date.now(),
    });

    setSelectedLotId(lotId);
    setIsAddingLot(false);
    setViewMode('card');
    setNewLotNo('');
    setNewExpDate('');
    setNewInitialQty('0');
    setNewLotNotes('');
  };

  // Open Lot creation form with pre-filled recommendations
  const handleOpenAddLotModal = () => {
    setNewLotNo(generateSuggestedLotNo(herb));
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setNewExpDate(d.toISOString().slice(0, 10));
    setNewMfgDate(new Date().toISOString().slice(0, 10));
    setNewPackaging(herb.defaultPackaging);
    setNewUnitPrice(herb.lots[0]?.unitPrice ? String(herb.lots[0].unitPrice) : '100');
    setNewSupplier('ฝ่ายผลิตยาสมุนไพร รพ.');
    setNewInitialQty('0');
    setIsAddingLot(true);
  };

  // Filtered & sorted lots for "All Lots" view
  const sortedLots = sortLots(herb.lots, lotsSort).filter(lot => {
    const calc = getLotCalculations(lot);
    if (lotsSearch) {
      const q = lotsSearch.toLowerCase();
      const matchLotNo = lot.lotNo.toLowerCase().includes(q);
      const matchSupplier = (lot.supplierOrManufacturer || '').toLowerCase().includes(q);
      if (!matchLotNo && !matchSupplier) return false;
    }
    if (lotsStatusFilter === 'available') {
      return calc.balance > 0;
    }
    if (lotsStatusFilter === 'depleted') {
      return calc.balance <= 0 && calc.transactionCount > 0;
    }
    if (lotsStatusFilter === 'expired') {
      return calc.status === 'expired';
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Top Bar */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Stock Card ยาสมุนไพร
            </span>
            {readOnly && (
              <button
                type="button"
                onClick={() => onRequireUnlock && onRequireUnlock('แก้ไขข้อมูลสต๊อกยา')}
                className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                title="คลิกเพื่อปลดล็อกสิทธิ์แก้ไขด้วยรหัสผ่านเจ้าหน้าที่"
              >
                <span>🔒 โหมดอ่านอย่างเดียว</span>
                <span className="underline ml-0.5">ปลดล็อก</span>
              </button>
            )}
            <span className="text-xs text-slate-600 hidden sm:inline-block">
              หมวดหมู่: <strong className="text-slate-800">{herb.category}</strong>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
              {herb.lots.length} ล็อตการผลิต
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenRequisitionModal && (
              <button
                type="button"
                onClick={() => onOpenRequisitionModal(herb)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="เปิดระบบสร้างใบเบิกยามาตรฐานและดาวน์โหลด PDF ป้องกันไฟล์เคลื่อน"
              >
                <FileDown className="w-3.5 h-3.5 text-teal-700" />
                <span>ใบเบิกยา (PDF)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => exportSingleHerbStockCardCSV(herb, currentLot?.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="ส่งออกประวัติสต๊อกการ์ดหน้านี้เป็นไฟล์ CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">ส่งออก CSV</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsGeneratingPdf(true);
                await downloadStockCardPDF([herb], true);
                setIsGeneratingPdf(false);
              }}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="ดาวน์โหลดบัตรสต๊อกการ์ด 4 ช่อง/หน้า เป็นไฟล์ PDF ล็อกเลย์เอาต์ ไม่เคลื่อน"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">โหลด PDF (4 ช่อง)</span>
            </button>
            <button
              type="button"
              onClick={() => onPrintCard(herb, currentLot?.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="พิมพ์บัตรสต๊อกการ์ดหน้านี้ในรูปแบบมาตรฐาน"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">หน้าต่างพิมพ์</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Mode Switcher: Stock Card vs All Lots Master Table */}
        <div className="px-4 sm:px-6 pt-3 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'card'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>บัตรสต๊อกการ์ด (Stock Card)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('all-lots')}
              className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'all-lots'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>ทุกล็อตการผลิตทั้งหมด ({herb.lots.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAddLotModal}
            className="mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="เพิ่มล็อตการผลิตใหม่ (ยา 1 ชนิดสามารถผลิตและเพิ่มล็อตได้ไม่จำกัดครั้ง)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ เพิ่มล็อตการผลิตใหม่</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">

          {/* New Lot Collapsible / Modal Form */}
          {isAddingLot && (
            <form onSubmit={handleCreateLot} className="p-4 sm:p-5 bg-emerald-50/80 rounded-2xl border-2 border-emerald-300 text-xs space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <div>
                  <h4 className="font-semibold text-emerald-950 text-sm sm:text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    เพิ่มล็อตการผลิตใหม่ (New Lot / Batch)
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    สามารถบันทึกเพิ่มล็อตการผลิตได้ไม่จำกัดจำนวนครั้ง ตามรอบการผลิตของโรงพยาบาล/โรงงาน
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingLot(false)}
                  className="p-1 text-emerald-700 hover:bg-emerald-200/60 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold">เลขที่ Lot.No *</label>
                    <button
                      type="button"
                      onClick={handleAutoSuggestLot}
                      className="text-[11px] text-emerald-700 hover:underline font-mono"
                    >
                      💡 แนะนำรหัส
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newLotNo}
                    onChange={(e) => setNewLotNo(e.target.value)}
                    placeholder="เช่น LOT-670921-01"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันหมดอายุ (Exp.date) *</label>
                  <input
                    type="date"
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันที่ผลิต (Mfg.date)</label>
                  <input
                    type="date"
                    value={newMfgDate}
                    onChange={(e) => setNewMfgDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ขนาดบรรจุ</label>
                  <input
                    type="text"
                    value={newPackaging}
                    onChange={(e) => setNewPackaging(e.target.value)}
                    placeholder="เช่น 100 เม็ด/ขวด"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ราคาต่อหน่วยบรรจุ (บาท)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">แหล่งผลิต / ผู้จัดส่ง</label>
                  <input
                    type="text"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    placeholder="เช่น ฝ่ายผลิตยาสมุนไพร รพ."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ยอดยกมา / รับเข้าครั้งแรก ({herb.defaultUnit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newInitialQty}
                    onChange={(e) => setNewInitialQty(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">หมายเหตุประจำล็อต</label>
                  <input
                    type="text"
                    value={newLotNotes}
                    onChange={(e) => setNewLotNotes(e.target.value)}
                    placeholder="เช่น วัตถุดิบขมิ้นชันเกรด A จากสวนเกษตรอินทรีย์"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={setAsActiveImmediately}
                    onChange={(e) => setSetAsActiveImmediately(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>กำหนดให้เป็นล็อตหลัก (Active Lot) ในการเบิกจ่ายทันที</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingLot(false)}
                    className="px-3.5 py-1.5 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-md font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>บันทึกและเปิดล็อตใหม่</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Edit Lot Modal/Form */}
          {isEditingLot && (
            <form onSubmit={handleSaveEditLot} className="p-4 sm:p-5 bg-amber-50/80 rounded-2xl border-2 border-amber-300 text-xs space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div>
                  <h4 className="font-semibold text-amber-950 text-sm sm:text-base flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-700" />
                    แก้ไขข้อมูลล็อตการผลิต: {currentLot?.lotNo}
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    แก้ไขข้อมูลทั่วไปของล็อต เช่น วันหมดอายุ, ขนาดบรรจุ, ราคาต่อหน่วย
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingLot(false)}
                  className="p-1 text-amber-700 hover:bg-amber-200/60 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เลขที่ Lot.No *</label>
                  <input
                    type="text"
                    value={editLotNo}
                    onChange={(e) => setEditLotNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันหมดอายุ (Exp.date) *</label>
                  <input
                    type="date"
                    value={editExpDate}
                    onChange={(e) => setEditExpDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันที่ผลิต (Mfg.date)</label>
                  <input
                    type="date"
                    value={editMfgDate}
                    onChange={(e) => setEditMfgDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ขนาดบรรจุ</label>
                  <input
                    type="text"
                    value={editPackaging}
                    onChange={(e) => setEditPackaging(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ราคาต่อหน่วยบรรจุ (บาท)</label>
                  <input
                    type="number"
                    step="any"
                    value={editUnitPrice}
                    onChange={(e) => setEditUnitPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">แหล่งผลิต / ผู้จัดส่ง</label>
                  <input
                    type="text"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setIsEditingLot(false)}
                  className="px-3.5 py-1.5 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-amber-700 hover:bg-amber-800 rounded-md font-semibold shadow-2xs"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          )}

          {/* VIEW MODE 1: STOCK CARD VIEW */}
          {viewMode === 'card' && (
            <>
              {/* Lots Quick Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    เลือกล็อตการผลิต ({herb.lots.length} ล็อต):
                  </span>

                  {herb.lots.length <= 5 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                      {herb.lots.map((lot, idx) => {
                        const bal = getLotBalance(lot);
                        const isPrimary = lot.id === herb.activeLotId;
                        return (
                          <button
                            key={lot.id}
                            type="button"
                            onClick={() => setSelectedLotId(lot.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer font-mono whitespace-nowrap flex items-center gap-1.5 ${
                              lot.id === currentLot?.id
                                ? 'bg-emerald-800 text-white shadow-xs font-bold ring-2 ring-emerald-600/30'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            <span>{lot.lotNo}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                              lot.id === currentLot?.id ? 'bg-emerald-950/60 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              คงเหลือ: {bal}
                            </span>
                            {isPrimary && (
                              <span title="ล็อตหลัก">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedLotId}
                        onChange={(e) => setSelectedLotId(e.target.value)}
                        className="px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {herb.lots.map((lot, idx) => {
                          const bal = getLotBalance(lot);
                          const isPrimary = lot.id === herb.activeLotId;
                          return (
                            <option key={lot.id} value={lot.id}>
                              {idx + 1}. {lot.lotNo || '(ยังไม่ระบุ Lot)'} — คงเหลือ {bal} {herb.defaultUnit} | {lot.expDate ? `หมดอายุ: ${formatDateThai(lot.expDate)}` : 'ยังไม่ระบุวันหมดอายุ'} {isPrimary ? '★ (ล็อตหลัก)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>

                {/* Lot Quick Tools */}
                <div className="flex items-center gap-1.5">
                  {currentLot && currentLot.id !== herb.activeLotId && (
                    <button
                      type="button"
                      onClick={() => handleSetActiveLot(currentLot.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-amber-50 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded-md transition-colors cursor-pointer"
                      title="ตั้งล็อตนี้เป็นล็อตหลักในการจ่ายยา"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>ตั้งเป็นล็อตหลัก</span>
                    </button>
                  )}

                  {currentLot && (
                    <button
                      type="button"
                      onClick={() => handleStartEditLot(currentLot)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                      title="แก้ไขข้อมูลวันหมดอายุ ขนาดบรรจุ หรือราคาของล็อตนี้"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>แก้ไขล็อต</span>
                    </button>
                  )}

                  {herb.lots.length > 1 && currentLot && (
                    <button
                      type="button"
                      onClick={() => handleDeleteLot(currentLot.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-md transition-colors cursor-pointer"
                      title="ลบล็อตนี้ออกจากระบบ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* OFFICIAL THAI STOCK CARD HEADER BOX (Fixed layout) */}
              <div className="border-2 border-slate-800 rounded-xl p-4 sm:p-5 bg-white shadow-xs">
                {/* Title: ชื่อยาสมุนไพร */}
                <div className="text-center pb-3 border-b-2 border-slate-800 relative">
                  <span className="absolute left-0 top-0 text-[11px] text-slate-500 hidden sm:inline-block">
                    ล็อตที่ {currentLotIdx + 1} จากทั้งหมด {herb.lots.length} ล็อต
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-wide">
                    {herb.name}
                  </h2>
                  {herb.indications && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      สรรพคุณ: {herb.indications}
                    </p>
                  )}
                </div>

                {/* Sub-headers: Lot.No, Exp.date, ขนาดบรรจุ, ราคาต่อหน่วยบรรจุ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 pt-3 text-sm font-medium text-slate-800">
                  <div className="flex items-center">
                    <span className="text-slate-600 w-24 shrink-0 font-normal">Lot.No:</span>
                    <span className="font-mono font-bold text-slate-900 flex-1 border-b border-dotted border-slate-400 pb-0.5 flex items-center justify-between">
                      <span>{currentLot && currentLot.lotNo ? currentLot.lotNo : '...................................................'}</span>
                      {currentLot?.id === herb.activeLotId && (
                        <span className="text-[10px] font-sans font-semibold px-2 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          ล็อตหลัก
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-slate-600 w-24 shrink-0 font-normal">Exp.date:</span>
                    <div className="flex-1 flex items-center gap-2 border-b border-dotted border-slate-400 pb-0.5">
                      <span className="font-bold text-slate-900">
                        {currentLot && currentLot.expDate ? formatDateThai(currentLot.expDate) : '...................................................'}
                      </span>
                      {expiry && currentLot?.expDate && (
                        <span className={`text-[11px] px-2 py-0.2 rounded border font-normal ${expiry.badgeClass}`}>
                          {expiry.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="text-slate-600 w-24 shrink-0 font-normal">ขนาดบรรจุ:</span>
                    <span className="text-slate-900 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                      {currentLot?.packaging || herb.defaultPackaging || '...................................................'}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-slate-600 w-36 shrink-0 font-normal">ราคาต่อหน่วยบรรจุ:</span>
                    <span className="text-slate-900 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                      {currentLot?.unitPrice && currentLot.unitPrice > 0 ? `${currentLot.unitPrice.toLocaleString()} บาท` : '.................................. บาท'}
                    </span>
                  </div>

                  {currentLot?.mfgDate && (
                    <div className="flex items-center">
                      <span className="text-slate-600 w-24 shrink-0 font-normal">Mfg.date:</span>
                      <span className="text-slate-900 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                        {formatDateThai(currentLot.mfgDate)}
                      </span>
                    </div>
                  )}

                  {currentLot?.supplierOrManufacturer && (
                    <div className="flex items-center">
                      <span className="text-slate-600 w-36 shrink-0 font-normal">แหล่งผลิต/ผู้ส่ง:</span>
                      <span className="text-slate-900 flex-1 border-b border-dotted border-slate-400 pb-0.5 truncate" title={currentLot.supplierOrManufacturer}>
                        {currentLot.supplierOrManufacturer}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Action Button to Add Transaction Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">
                    รายการบันทึก รับ-จ่าย ยา (Lot: {currentLot?.lotNo})
                  </span>
                  <span className="text-xs text-slate-500">
                    (ทั้งหมด {currentLot?.transactions.length || 0} แถว)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingTx(!isAddingTx)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มรายการ รับ / จ่าย</span>
                </button>
              </div>

              {/* Add Transaction Form Modal / Box */}
              {isAddingTx && (
                <form onSubmit={handleAddTransaction} className="p-4 bg-slate-50 rounded-xl border border-slate-300 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-600" /> 
                      ลงบันทึกใน Stock Card (Lot: {currentLot?.lotNo})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingTx(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  {txError && (
                    <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{txError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Transaction Type */}
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">ประเภทรายการ</label>
                      <select
                        value={txType}
                        onChange={(e) => setTxType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium"
                      >
                        <option value="dispense">จ่ายยาออก (Dispense)</option>
                        <option value="receive">รับยาเข้า (Receive)</option>
                        <option value="broughtForward">ยอดยกมา (Opening Balance)</option>
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">วัน เดือน ปี</label>
                      <input
                        type="date"
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                        required
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        จำนวน ({herb.defaultUnit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        placeholder="0"
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-bold"
                        required
                      />
                    </div>

                    {/* Requester */}
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">ผู้เบิก / จ่าย</label>
                      <input
                        type="text"
                        placeholder="เช่น ห้องจ่ายยา OPD"
                        value={txRequester}
                        onChange={(e) => setTxRequester(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                        required
                      />
                    </div>

                    {/* Note */}
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">หมายเหตุ</label>
                      <input
                        type="text"
                        placeholder="ระบุเพิ่มเติม..."
                        value={txNote}
                        onChange={(e) => setTxNote(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Single Transaction PDF Download Checkbox */}
                  {txType === 'dispense' && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-teal-800">
                        <input
                          type="checkbox"
                          checked={txDownloadPdf}
                          onChange={(e) => setTxDownloadPdf(e.target.checked)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="font-medium">
                          ดาวน์โหลดใบเบิกยา (PDF) มาตรฐานพร้อมกันทันที
                        </span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        รูปแบบ A4 ป้องกันข้อความเคลื่อน
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingTx(false)}
                      className="px-3 py-1.5 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-md"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isGeneratingPdf}
                      className="px-4 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-md font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingPdf ? 'กำลังสร้าง PDF...' : 'บันทึกลง Stock Card'}
                    </button>
                  </div>
                </form>
              )}

              {/* OFFICIAL THAI STOCK CARD LEDGER TABLE */}
              <div className="border-2 border-slate-800 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-800 text-slate-900 font-bold">
                        <th className="py-2.5 px-3 border-r border-slate-400 w-28">วัน เดือน ปี</th>
                        <th className="py-2.5 px-3 border-r border-slate-400 w-20">ยกมา</th>
                        <th className="py-2.5 px-3 border-r border-slate-400 w-20 bg-emerald-50 text-emerald-900">รับ</th>
                        <th className="py-2.5 px-3 border-r border-slate-400 w-20 bg-rose-50 text-rose-900">จ่าย</th>
                        <th className="py-2.5 px-3 border-r border-slate-400 w-24 bg-amber-50 text-amber-950">คงเหลือ</th>
                        <th className="py-2.5 px-3 border-r border-slate-400 text-left">ผู้เบิก / จ่าย</th>
                        <th className="py-2.5 px-3 border-r border-slate-400 text-left">หมายเหตุ</th>
                        <th className="py-2.5 px-2 w-16">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono">
                      {currentLot && currentLot.transactions.length > 0 ? (
                        currentLot.transactions.map((tx, idx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3 border-r border-slate-300 font-sans text-slate-800 whitespace-nowrap">
                              {formatDateThai(tx.date)}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-300 text-slate-600">
                              {tx.broughtForward > 0 ? tx.broughtForward : '-'}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-300 font-semibold text-emerald-700 bg-emerald-50/30">
                              {tx.received > 0 ? tx.received : '-'}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-300 font-semibold text-rose-700 bg-rose-50/30">
                              {tx.dispensed > 0 ? tx.dispensed : '-'}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-900 bg-amber-50/40">
                              {tx.balance}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-300 font-sans text-slate-800 text-left">
                              {tx.requesterOrDispenser}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-300 font-sans text-slate-500 text-left">
                              {tx.note || '-'}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {tx.dispensed > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => downloadSingleTxRequisitionPDF(herb, currentLot, tx, {
                                      department: tx.requesterOrDispenser,
                                      requesterName: tx.requesterOrDispenser,
                                      purpose: tx.note || 'เบิกจ่ายยาตามสต๊อกการ์ด'
                                    })}
                                    className="p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                                    title="พิมพ์/ดาวน์โหลดใบเบิกยามาตรฐาน (PDF)"
                                  >
                                    <FileDown className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="ลบแถวนี้"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 italic font-sans">
                            ยังไม่มีรายการบันทึกรับ-จ่ายสำหรับล็อตนี้ คลิก "เพิ่มรายการ รับ / จ่าย" เพื่อเริ่มต้น
                          </td>
                        </tr>
                      )}

                      {/* Empty rows to mimic printed card appearance */}
                      {Array.from({ length: Math.max(0, 5 - (currentLot?.transactions.length || 0)) }).map((_, i) => (
                        <tr key={`blank-${i}`} className="h-7 text-slate-300">
                          <td className="border-r border-slate-300">&nbsp;</td>
                          <td className="border-r border-slate-300">&nbsp;</td>
                          <td className="border-r border-slate-300">&nbsp;</td>
                          <td className="border-r border-slate-300">&nbsp;</td>
                          <td className="border-r border-slate-300">&nbsp;</td>
                          <td className="border-r border-slate-300">&nbsp;</td>
                          <td className="border-r border-slate-300">&nbsp;</td>
                          <td>&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Current Lot Stock Summary Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-slate-700">สรุปยอดล็อต {currentLot?.lotNo}:</span>
                  <span>คงเหลือปัจจุบัน: <strong className="text-emerald-700 text-sm">{lotBalance}</strong> {herb.defaultUnit}</span>
                  <span>|</span>
                  <span>มูลค่ารวม: <strong className="text-slate-800 text-sm">{(lotBalance * (currentLot?.unitPrice || 0)).toLocaleString()}</strong> บาท</span>
                  <span>|</span>
                  <span className="text-slate-500">
                    สต๊อกรวมทุก {herb.lots.length} ล็อต: <strong className="text-slate-900 font-bold">
                      {herb.lots.reduce((acc, l) => acc + getLotBalance(l), 0)}
                    </strong> {herb.defaultUnit}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsGeneratingPdf(true);
                      await downloadStockCardPDF([herb], true);
                      setIsGeneratingPdf(false);
                    }}
                    disabled={isGeneratingPdf}
                    className="text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded-md inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingPdf ? (
                      <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    <span>โหลด PDF (4 ช่อง)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPrintCard(herb, currentLot?.id)}
                    className="text-slate-600 hover:text-slate-800 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    หน้าต่างพิมพ์
                  </button>
                </div>
              </div>
            </>
          )}

          {/* VIEW MODE 2: ALL LOTS OVERVIEW MASTER TABLE */}
          {viewMode === 'all-lots' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">ล็อตการผลิตทั้งหมด</span>
                  <span className="text-xl font-bold font-mono text-slate-900">{herb.lots.length}</span>
                  <span className="text-[11px] text-slate-400 ml-1">ล็อต</span>
                </div>

                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <span className="text-[11px] text-emerald-700 block">สต๊อกรวมทุกล็อต</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {herb.lots.reduce((acc, l) => acc + getLotBalance(l), 0)}
                  </span>
                  <span className="text-[11px] text-emerald-600 ml-1">{herb.defaultUnit}</span>
                </div>

                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                  <span className="text-[11px] text-blue-700 block">ล็อตที่ยังมีสต๊อก</span>
                  <span className="text-xl font-bold font-mono text-blue-800">
                    {herb.lots.filter(l => getLotBalance(l) > 0).length}
                  </span>
                  <span className="text-[11px] text-blue-600 ml-1">ล็อต</span>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <span className="text-[11px] text-amber-800 block">มูลค่ารวมทุกล็อต</span>
                  <span className="text-xl font-bold font-mono text-amber-900">
                    {herb.lots.reduce((acc, l) => acc + (getLotBalance(l) * (l.unitPrice || 0)), 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-amber-700 ml-1">บาท</span>
                </div>
              </div>

              {/* Filters & Sorting */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={lotsSearch}
                    onChange={(e) => setLotsSearch(e.target.value)}
                    placeholder="ค้นหาเลขที่ Lot.No หรือผู้ผลิต..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-500">เรียงตาม:</span>
                  <select
                    value={lotsSort}
                    onChange={(e) => setLotsSort(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
                  >
                    <option value="fefo">หมดอายุเร็วสุด (FEFO แนะนำ)</option>
                    <option value="newest">ล็อตผลิตใหม่สุด (Newest)</option>
                    <option value="oldest">ล็อตผลิตเก่าสุด (Oldest)</option>
                    <option value="lotNo">เลขที่ Lot.No</option>
                  </select>

                  <select
                    value={lotsStatusFilter}
                    onChange={(e) => setLotsStatusFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
                  >
                    <option value="all">ทุกล็อต ({herb.lots.length})</option>
                    <option value="available">เฉพาะที่มีสต๊อก</option>
                    <option value="depleted">เฉพาะที่สต๊อกหมด</option>
                    <option value="expired">เฉพาะที่หมดอายุ</option>
                  </select>
                </div>
              </div>

              {/* All Lots Master Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">เลขที่ Lot.No</th>
                        <th className="py-2.5 px-3">วันผลิต (Mfg)</th>
                        <th className="py-2.5 px-3">วันหมดอายุ (Exp)</th>
                        <th className="py-2.5 px-3">ขนาดบรรจุ</th>
                        <th className="py-2.5 px-3 text-right">ราคา/หน่วย</th>
                        <th className="py-2.5 px-3 text-right bg-emerald-50/50">รับเข้าสะสม</th>
                        <th className="py-2.5 px-3 text-right bg-rose-50/50">จ่ายสะสม</th>
                        <th className="py-2.5 px-3 text-right bg-amber-50 font-bold">คงเหลือ</th>
                        <th className="py-2.5 px-3">แหล่งผลิต/ส่ง</th>
                        <th className="py-2.5 px-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {sortedLots.map((lot, idx) => {
                        const calc = getLotCalculations(lot);
                        const isPrimary = lot.id === herb.activeLotId;
                        const isSelected = lot.id === currentLot?.id;

                        return (
                          <tr 
                            key={lot.id} 
                            className={`hover:bg-slate-50 transition-colors ${
                              isSelected ? 'bg-emerald-50/30' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center text-slate-400 font-sans">
                              {idx + 1}
                            </td>

                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <span>{lot.lotNo}</span>
                                {isPrimary && (
                                  <span className="text-[10px] font-sans font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                    หลัก
                                  </span>
                                )}
                                {idx === 0 && lotsSort === 'fefo' && (
                                  <span className="text-[10px] font-sans font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    FEFO
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 font-sans text-slate-600">
                              {lot.mfgDate ? formatDateThai(lot.mfgDate) : '-'}
                            </td>

                            <td className="py-2.5 px-3 font-sans">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-800">
                                  {formatDateThai(lot.expDate)}
                                </span>
                                {calc.status === 'expired' && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-medium">
                                    หมดอายุ
                                  </span>
                                )}
                                {(calc.status === 'critical' || calc.status === 'warning') && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                                    ใกล้หมด
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 font-sans text-slate-700">
                              {lot.packaging || herb.defaultPackaging}
                            </td>

                            <td className="py-2.5 px-3 text-right text-slate-800">
                              {lot.unitPrice ? `${lot.unitPrice.toLocaleString()} ฿` : '-'}
                            </td>

                            <td className="py-2.5 px-3 text-right text-emerald-700 bg-emerald-50/20 font-semibold">
                              {calc.totalReceived.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-right text-rose-700 bg-rose-50/20 font-semibold">
                              {calc.totalDispensed.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 bg-amber-50/40">
                              <span className={calc.balance <= 0 ? 'text-slate-400' : 'text-emerald-800'}>
                                {calc.balance.toLocaleString()} {herb.defaultUnit}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 font-sans text-slate-600 max-w-[150px] truncate" title={lot.supplierOrManufacturer}>
                              {lot.supplierOrManufacturer || '-'}
                            </td>

                            <td className="py-2.5 px-3 text-center font-sans">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLotId(lot.id);
                                    setViewMode('card');
                                  }}
                                  className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                                  title="เปิดดูบัตรสต๊อกการ์ดล็อตนี้"
                                >
                                  ดูการ์ด
                                </button>

                                {lot.id !== herb.activeLotId && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetActiveLot(lot.id)}
                                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                                    title="ตั้งเป็นล็อตหลัก"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLotId(lot.id);
                                    handleStartEditLot(lot);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="แก้ไขข้อมูลล็อต"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {herb.lots.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLot(lot.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="ลบล็อต"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            ระบบรองรับการเพิ่มล็อตการผลิต (Lot.No) ได้ไม่จำกัดครั้งต่อยา 1 รายการ
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
