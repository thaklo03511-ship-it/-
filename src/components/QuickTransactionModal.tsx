import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  AlertCircle, 
  Check, 
  Plus, 
  Minus, 
  Calendar, 
  Building2, 
  Package, 
  Layers, 
  FileDown, 
  FileCheck, 
  ShieldCheck,
  Sparkles,
  Clock
} from 'lucide-react';
import { HerbItem, StockCardLot, StockTransaction } from '../types';
import { getActiveLot, getLotBalance, formatDateThai, generateSuggestedLotNo, getExpiryStatus } from '../utils/stockUtils';
import { downloadSingleTxRequisitionPDF } from '../utils/requisitionPdfUtils';

interface QuickTransactionModalProps {
  herbs: HerbItem[];
  preSelectedHerb?: HerbItem | null;
  onClose: () => void;
  onSaveTransaction: (
    herbId: string, 
    lotId: string, 
    tx: Omit<StockTransaction, 'id' | 'timestamp'>,
    newLotData?: {
      lotNo: string;
      expDate: string;
      mfgDate?: string;
      packaging?: string;
      unitPrice?: number;
      supplierOrManufacturer?: string;
      notes?: string;
    }
  ) => void;
  onOpenRequisitionModal?: () => void;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  herbs,
  preSelectedHerb,
  onClose,
  onSaveTransaction,
  onOpenRequisitionModal,
}) => {
  const [selectedHerbId, setSelectedHerbId] = useState<string>(
    preSelectedHerb?.id || (herbs.length > 0 ? herbs[0].id : '')
  );

  const currentHerb = herbs.find(h => h.id === selectedHerbId) || herbs[0];

  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [actionType, setActionType] = useState<'dispense' | 'receive'>('dispense');

  // Lot mode when receiving: existing vs new batch
  const [receiveLotMode, setReceiveLotMode] = useState<'existing' | 'new'>('existing');

  // New lot fields
  const [newLotNo, setNewLotNo] = useState<string>('');
  const [newMfgDate, setNewMfgDate] = useState<string>('');
  const [newExpDate, setNewExpDate] = useState<string>('');
  const [newPackaging, setNewPackaging] = useState<string>('');
  const [newUnitPrice, setNewUnitPrice] = useState<string>('');
  const [newSupplier, setNewSupplier] = useState<string>('ฝ่ายผลิตยาสมุนไพร รพ.');

  useEffect(() => {
    if (currentHerb && currentHerb.lots.length > 0) {
      const active = getActiveLot(currentHerb);
      setSelectedLotId(active ? active.id : currentHerb.lots[0].id);
      setNewPackaging(currentHerb.defaultPackaging || '');
      const prevPrice = currentHerb.lots[0]?.unitPrice || 0;
      setNewUnitPrice(prevPrice > 0 ? String(prevPrice) : '');
    }
    // Set suggested lot no
    if (currentHerb) {
      setNewLotNo(generateSuggestedLotNo(currentHerb));
    }
    // Default expiry 1 year from now
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setNewExpDate(d.toISOString().slice(0, 10));
    setNewMfgDate(new Date().toISOString().slice(0, 10));
  }, [selectedHerbId, currentHerb]);

  const currentLot = currentHerb?.lots.find(l => l.id === selectedLotId) || currentHerb?.lots[0];
  const currentBalance = currentLot ? getLotBalance(currentLot) : 0;

  const [amount, setAmount] = useState<string>('5');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [requester, setRequester] = useState<string>('ห้องจ่ายยา OPD');
  const [note, setNote] = useState<string>('');
  const [downloadPdf, setDownloadPdf] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const numAmount = parseFloat(amount) || 0;
  const isCreatingNewLot = actionType === 'receive' && receiveLotMode === 'new';

  const newBalance = isCreatingNewLot
    ? numAmount
    : (actionType === 'receive' ? currentBalance + numAmount : currentBalance - numAmount);

  const handleQuickAddAmount = (val: number) => {
    const cur = parseFloat(amount) || 0;
    setAmount(String(cur + val));
  };

  const handleSuggestLotNo = () => {
    if (currentHerb) {
      setNewLotNo(generateSuggestedLotNo(currentHerb));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentHerb) {
      setError('กรุณาเลือกยาสมุนไพร');
      return;
    }

    if (numAmount <= 0) {
      setError('กรุณาระบุจำนวนมากกว่า 0');
      return;
    }

    if (isCreatingNewLot) {
      if (!newLotNo.trim()) {
        setError('กรุณาระบุเลขที่ Lot.No สำหรับล็อตใหม่');
        return;
      }
      if (!newExpDate) {
        setError('กรุณาระบุวันหมดอายุ (Exp.date)');
        return;
      }
    } else {
      if (!currentLot) {
        setError('กรุณาเลือกล็อตการผลิต');
        return;
      }
      if (actionType === 'dispense' && numAmount > currentBalance) {
        setError(`ไม่สามารถจ่ายยาเกินยอดคงเหลือ (${currentBalance} ${currentHerb.defaultUnit})`);
        return;
      }
    }

    if (!requester.trim()) {
      setError('กรุณาระบุผู้เบิก / ผู้จ่าย');
      return;
    }

    if (isCreatingNewLot) {
      const newLotId = `lot-${Date.now()}`;
      const txData: Omit<StockTransaction, 'id' | 'timestamp'> = {
        date,
        broughtForward: 0,
        received: numAmount,
        dispensed: 0,
        balance: numAmount,
        requesterOrDispenser: requester.trim(),
        note: note.trim() || 'รับเข้าคลังเปิดล็อตใหม่',
      };

      onSaveTransaction(currentHerb.id, newLotId, txData, {
        lotNo: newLotNo.trim(),
        mfgDate: newMfgDate || undefined,
        expDate: newExpDate,
        packaging: newPackaging.trim() || currentHerb.defaultPackaging,
        unitPrice: parseFloat(newUnitPrice) || 0,
        supplierOrManufacturer: newSupplier.trim(),
        notes: note.trim() || undefined,
      });

      onClose();
      return;
    }

    // Standard existing lot transaction
    const txData: Omit<StockTransaction, 'id' | 'timestamp'> = {
      date,
      broughtForward: currentBalance,
      received: actionType === 'receive' ? numAmount : 0,
      dispensed: actionType === 'dispense' ? numAmount : 0,
      balance: newBalance,
      requesterOrDispenser: requester.trim(),
      note: note.trim(),
    };

    onSaveTransaction(currentHerb.id, currentLot!.id, txData);

    // If dispensing and downloadPdf is checked, generate and trigger PDF download directly
    if (actionType === 'dispense' && downloadPdf && currentLot) {
      setIsGeneratingPdf(true);
      try {
        await downloadSingleTxRequisitionPDF(
          currentHerb,
          currentLot,
          {
            ...txData,
            id: `tx-${Date.now()}`,
            timestamp: Date.now(),
          },
          {
            department: requester.trim(),
            requesterName: requester.trim(),
            purpose: note.trim() || 'เบิกจ่ายยาตามบันทึกการ์ด',
          }
        );
      } catch (err) {
        console.error('Failed to generate requisition PDF:', err);
      }
      setIsGeneratingPdf(false);
    }

    onClose();
  };


  const departmentPresets = [
    'ห้องจ่ายยา OPD',
    'คลินิกแพทย์แผนไทย',
    'รับจาก อภ. (องค์การเภสัชกรรม)',
    'คลังเวชภัณฑ์กลาง',
    'ฝ่ายผลิตยาสมุนไพร',
    'หอผู้ป่วยใน (IPD)',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">
                บันทึก รับ-จ่าย ยาสมุนไพร
              </h3>
              <p className="text-xs text-slate-500">
                ลงบันทึกในบัตรสต๊อกการ์ดทันที (คำนวณยอดคงเหลืออัตโนมัติ)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Type Toggle (Receive vs Dispense) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ประเภทการทำรายการ *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionType('dispense');
                  setReceiveLotMode('existing');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${
                  actionType === 'dispense'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Minus className="w-4 h-4" />
                <span>จ่ายยาออก (Dispense)</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('receive')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${
                  actionType === 'receive'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>รับยาเข้า (Receive)</span>
              </button>
            </div>
          </div>

          {/* Herb Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                เลือกยาสมุนไพร *
              </label>
              <span className="text-[11px] text-slate-500">
                (มี {currentHerb?.lots?.length || 0} ล็อตการผลิต)
              </span>
            </div>
            <select
              value={selectedHerbId}
              onChange={(e) => setSelectedHerbId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {herbs.map((h, i) => (
                <option key={h.id} value={h.id}>
                  {i + 1}. {h.name} ({h.category}) — {h.lots.length} ล็อต
                </option>
              ))}
            </select>
          </div>

          {/* Lot Selection or New Lot Creation */}
          {actionType === 'dispense' ? (
            /* Dispense: Select from available lots */
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  เลือกล็อตการผลิตที่ต้องการจ่ายยา (Lot.No) *
                </label>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {currentHerb?.lots.length} ล็อตในระบบ
                </span>
              </div>
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {currentHerb?.lots.map((lot) => {
                  const bal = getLotBalance(lot);
                  const isFefo = currentHerb.lots[0]?.id === lot.id;
                  return (
                    <option key={lot.id} value={lot.id} disabled={bal <= 0}>
                      {lot.lotNo || '(ยังไม่ระบุ Lot)'} — {lot.expDate ? `หมดอายุ: ${formatDateThai(lot.expDate)}` : 'ยังไม่ระบุวันหมดอายุ'} | คงเหลือ: {bal} {currentHerb.defaultUnit} {isFefo ? '⭐ (FEFO)' : ''} {bal <= 0 ? '(หมด)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            /* Receive: Choose Existing Lot OR Add New Batch */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  การรับเข้าสต๊อก:
                </label>
                <span className="text-[11px] text-emerald-800 font-medium">
                  ยา 1 รายการเพิ่มล็อตได้ไม่จำกัด
                </span>
              </div>

              {/* Toggle Existing vs New Lot */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setReceiveLotMode('existing')}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    receiveLotMode === 'existing'
                      ? 'bg-white text-slate-800 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  รับเข้าในล็อตเดิมที่มี ({currentHerb?.lots.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReceiveLotMode('new')}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    receiveLotMode === 'new'
                      ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เปิดล็อตผลิตใหม่ (New Lot)</span>
                </button>
              </div>

              {receiveLotMode === 'existing' ? (
                <div>
                  <select
                    value={selectedLotId}
                    onChange={(e) => setSelectedLotId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {currentHerb?.lots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.lotNo} — หมดอายุ: {formatDateThai(lot.expDate)} (คงเหลือเดิม {getLotBalance(lot)} {currentHerb.defaultUnit})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* New Lot Form Fields */
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 text-xs animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-200/60">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> ข้อมูลล็อตการผลิตใหม่
                    </span>
                    <button
                      type="button"
                      onClick={handleSuggestLotNo}
                      className="text-[11px] text-emerald-700 hover:underline font-mono inline-flex items-center gap-1 cursor-pointer"
                      title="สร้างรหัสล็อตอัตโนมัติตามปี พ.ศ. และลำดับการผลิต"
                    >
                      💡 แนะนำรหัส Lot
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        เลขที่ Lot.No *
                      </label>
                      <input
                        type="text"
                        value={newLotNo}
                        onChange={(e) => setNewLotNo(e.target.value)}
                        placeholder="เช่น LOT-670921-02"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        วันหมดอายุ (Exp.date) *
                      </label>
                      <input
                        type="date"
                        value={newExpDate}
                        onChange={(e) => setNewExpDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        วันที่ผลิต (Mfg.date)
                      </label>
                      <input
                        type="date"
                        value={newMfgDate}
                        onChange={(e) => setNewMfgDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        ขนาดบรรจุ
                      </label>
                      <input
                        type="text"
                        value={newPackaging}
                        onChange={(e) => setNewPackaging(e.target.value)}
                        placeholder="เช่น 100 เม็ด/ขวด"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        ราคาต่อหน่วยบรรจุ (บาท)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={newUnitPrice}
                        onChange={(e) => setNewUnitPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        แหล่งผลิต / ผู้ผลิต / จัดส่ง
                      </label>
                      <input
                        type="text"
                        value={newSupplier}
                        onChange={(e) => setNewSupplier(e.target.value)}
                        placeholder="เช่น ฝ่ายผลิตยาสมุนไพร รพ."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity & Quick Increment buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                จำนวนที่{actionType === 'dispense' ? 'เบิกจ่าย' : 'รับเข้า'} ({currentHerb?.defaultUnit || 'หน่วย'}) *
              </label>
              <span className="text-xs text-slate-500">
                {isCreatingNewLot ? 'ล็อตใหม่: เริ่มต้น 0' : <>คงเหลือในล็อต: <strong>{currentBalance}</strong></>}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xl font-bold font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            {/* Quick Increment Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-400">บวกเพิ่ม:</span>
              {[1, 5, 10, 20, 50, 100].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleQuickAddAmount(step)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  +{step}
                </button>
              ))}
              {!isCreatingNewLot && (
                <button
                  type="button"
                  onClick={() => setAmount(String(currentBalance))}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="จ่ายจนหมดสต๊อก"
                >
                  ยอดคงเหลือทั้งหมด ({currentBalance})
                </button>
              )}
            </div>
          </div>

          {/* Live Balance Computation Preview Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">
                {isCreatingNewLot ? 'ยอดยกมาล็อตใหม่:' : 'ยอดก่อนทำรายการ:'}
              </span>
              <span className="font-mono font-bold text-slate-800 ml-1.5">
                {isCreatingNewLot ? '0' : currentBalance}
              </span>
            </div>
            <div className="text-slate-400">➔</div>
            <div>
              <span className="text-slate-500">ยอดคงเหลือใหม่ในล็อต:</span>
              <span className={`font-mono font-bold text-sm ml-1.5 ${
                newBalance < 0 
                  ? 'text-rose-600' 
                  : actionType === 'dispense' 
                    ? 'text-amber-700' 
                    : 'text-emerald-700'
              }`}>
                {newBalance} {currentHerb?.defaultUnit}
              </span>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              วัน เดือน ปี ที่ทำรายการ *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
              required
            />
          </div>

          {/* Requester or Dispenser */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ผู้เบิก / ผู้จ่าย *
            </label>
            <input
              type="text"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              placeholder="ระบุชื่อผู้เบิก, แผนก, หรือหน่วยงาน"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 mb-1.5"
              required
            />
            {/* Quick Department Chips */}
            <div className="flex flex-wrap gap-1">
              {departmentPresets.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setRequester(dept)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                    requester === dept
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Memo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              หมายเหตุ (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น เลขที่ใบสั่งซื้อ PO, เลขที่ใบเบิก, เพื่อใช้ในหัตถการ"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          {/* Requisition PDF Option when Dispensing */}
          {actionType === 'dispense' && (
            <div className="p-3 bg-teal-50/90 border border-teal-200/80 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-teal-950 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={downloadPdf}
                    onChange={(e) => setDownloadPdf(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span>ดาวน์โหลดใบเบิกยา (PDF) ทันที (ป้องกันไฟล์เคลื่อน)</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 bg-teal-100/80 text-teal-800 font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  A4 Locked
                </span>
              </div>
              <p className="text-[11px] text-teal-800 pl-6 leading-relaxed">
                สร้างเอกสารใบขอเบิกยามาตรฐานกระทรวงสาธารณสุข ล็อกการจัดหน้า ตาราง และช่องลงนาม 4 ฝ่าย ไม่เลื่อนหรือเพี้ยนในทุกอุปกรณ์
              </p>
            </div>
          )}

          {/* Multi-item requisition shortcut */}
          {onOpenRequisitionModal && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-500">
              <span>ต้องการเบิกยาหลายรายการในใบเดียวกัน?</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRequisitionModal();
                }}
                className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>เปิดระบบใบเบิกยาแบบหลายรายการ ➔</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isGeneratingPdf ? (
                <span>กำลังสร้าง PDF...</span>
              ) : actionType === 'dispense' && downloadPdf ? (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>บันทึก &amp; ดาวน์โหลดใบเบิกยา PDF</span>
                </>
              ) : (
                <span>บันทึกรายการ</span>
              )}
            </button>
          </div>


        </form>

      </div>
    </div>
  );
};
