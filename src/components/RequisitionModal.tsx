import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Calendar,
  Layers,
  History,
  ShieldCheck,
  Eye,
  ArrowRight,
  Sparkles,
  Search,
  FileCheck,
  Edit3,
  ExternalLink,
  FileDown
} from 'lucide-react';
import { HerbItem, RequisitionItem, RequisitionSlip, StockTransaction } from '../types';
import { formatDateThai, getActiveLot, getLotBalance } from '../utils/stockUtils';
import {
  downloadRequisitionPDF,
  generateRequisitionSlipHTML,
  loadSavedRequisitions,
  saveRequisitions,
  numberToThaiBahtText,
  openRequisitionInNewTab,
  downloadRequisitionHTML,
} from '../utils/requisitionPdfUtils';

interface RequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  herbs: HerbItem[];
  onApplyStockDeduction: (slip: RequisitionSlip) => void;
  initialSelectedHerb?: HerbItem | null;
}

export const RequisitionModal: React.FC<RequisitionModalProps> = ({
  isOpen,
  onClose,
  herbs,
  onApplyStockDeduction,
  initialSelectedHerb,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'preview' | 'history'>('create');
  const [savedSlips, setSavedSlips] = useState<RequisitionSlip[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Hospital / Organization Name
  const [hospitalName, setHospitalName] = useState<string>(
    'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านท่าคล้อ (คลังยาสมุนไพร)'
  );

  // Form Fields
  const generateSlipNumber = () => {
    const thaiYear = new Date().getFullYear() + 543;
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900);
    return `REQ-${thaiYear}${month}-${random}`;
  };

  const [slipNumber, setSlipNumber] = useState<string>(generateSlipNumber());
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  );
  const [department, setDepartment] = useState<string>('งานบริการการแพทย์แผนไทย รพ.สต.บ้านท่าคล้อ');
  const [requesterName, setRequesterName] = useState<string>('พท.ป. ศิริพร กลิ่นมาลัย');
  const [requesterPosition, setRequesterPosition] = useState<string>('แพทย์แผนไทยปฏิบัติการ');
  const [dispenserName, setDispenserName] = useState<string>('ภญ. พิมพ์มาดา เจริญสุข');
  const [receiverName, setReceiverName] = useState<string>('พท.ป. ศิริพร กลิ่นมาลัย');
  const [approverName, setApproverName] = useState<string>('นพ. ชัยวัฒน์ วงศ์วิวัฒน์');
  const [purpose, setPurpose] = useState<string>(
    'เพื่อสำรองจ่ายผู้ป่วยนอก คลินิกการแพทย์แผนไทย ประจำสัปดาห์'
  );
  const [urgency, setUrgency] = useState<'ปกติ' | 'ด่วน' | 'ด่วนที่สุด'>('ปกติ');

  // Items in current draft slip
  const [items, setItems] = useState<RequisitionItem[]>([]);

  // Item Selector Sub-form
  const [selectedHerbId, setSelectedHerbId] = useState<string>(
    initialSelectedHerb ? initialSelectedHerb.id : (herbs.length > 0 ? herbs[0].id : '')
  );
  const currentHerb = herbs.find((h) => h.id === selectedHerbId) || herbs[0];

  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [itemQty, setItemQty] = useState<string>('10');
  const [itemNote, setItemNote] = useState<string>('');

  // Load requisitions on mount
  useEffect(() => {
    if (isOpen) {
      const slips = loadSavedRequisitions();
      setSavedSlips(slips);
    }
  }, [isOpen]);

  // Update initial selected herb if passed & auto-add to items if list is empty
  useEffect(() => {
    if (isOpen && initialSelectedHerb) {
      setSelectedHerbId(initialSelectedHerb.id);
      const active = getActiveLot(initialSelectedHerb) || initialSelectedHerb.lots[0];
      if (active) {
        setSelectedLotId(active.id);
        if (items.length === 0) {
          const bal = getLotBalance(active);
          const qty = Math.min(10, Math.max(1, bal));
          const unitPrice = active.unitPrice || 0;
          setItems([
            {
              id: `item-${Date.now()}`,
              herbId: initialSelectedHerb.id,
              herbName: initialSelectedHerb.name,
              category: initialSelectedHerb.category,
              lotId: active.id,
              lotNo: active.lotNo,
              expDate: active.expDate,
              availableStock: bal,
              requestedQty: qty,
              unit: initialSelectedHerb.defaultUnit,
              unitPrice,
              totalPrice: qty * unitPrice,
              note: 'ขอเบิกสำรองจ่ายประจำวัน',
            },
          ]);
        }
      }
    }
  }, [isOpen, initialSelectedHerb]);

  // Auto-select active lot with highest stock or FEFO
  useEffect(() => {
    if (currentHerb && currentHerb.lots.length > 0) {
      const active = getActiveLot(currentHerb);
      setSelectedLotId(active ? active.id : currentHerb.lots[0].id);
    }
  }, [selectedHerbId, currentHerb]);

  const currentLot = currentHerb?.lots.find((l) => l.id === selectedLotId) || currentHerb?.lots[0];
  const currentLotBalance = currentLot ? getLotBalance(currentLot) : 0;

  // Department quick presets
  const departmentOptions = [
    'ห้องตรวจแพทย์แผนไทยและการแพทย์ผสมผสาน',
    'ห้องจ่ายยาผู้ป่วยนอก (OPD Pharmacy)',
    'คลินิกกายภาพบำบัดและฟื้นฟู',
    'หอผู้ป่วยใน (IPD)',
    'หน่วยบริการปฐมภูมิ (PCU)',
    'คลินิกฝังเข็มและแพทย์ทางเลือก',
    'ฝ่ายคุ้มครองผู้บริโภคและเภสัชกรรมชุมชน',
  ];

  const showNotification = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(''), 4500);
  };

  // Add 3 sample items for immediate testing/preview
  const handleAddSampleItems = () => {
    const sampleItems: RequisitionItem[] = [];
    const availableHerbs = herbs.slice(0, 3);
    availableHerbs.forEach((h) => {
      const activeLot = getActiveLot(h) || h.lots[0];
      if (activeLot) {
        const bal = getLotBalance(activeLot);
        const qty = Math.min(10, Math.max(1, bal));
        const price = activeLot.unitPrice || 0;
        sampleItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          herbId: h.id,
          herbName: h.name,
          category: h.category,
          lotId: activeLot.id,
          lotNo: activeLot.lotNo,
          expDate: activeLot.expDate,
          availableStock: bal,
          requestedQty: qty,
          unit: h.defaultUnit,
          unitPrice: price,
          totalPrice: qty * price,
          note: 'เบิกสำรองจ่ายประจำวัน',
        });
      }
    });

    if (sampleItems.length > 0) {
      setItems(sampleItems);
      showNotification(`เพิ่มตัวอย่างยาสมุนไพร ${sampleItems.length} รายการลงในใบเบิกแล้ว`);
    }
  };

  // Add Item to current slip draft
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentHerb || !currentLot) {
      setErrorMessage('กรุณาเลือกยาสมุนไพรและล็อตการผลิต');
      return;
    }

    const qty = parseFloat(itemQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('กรุณาระบุจำนวนที่ต้องการเบิกมากกว่า 0');
      return;
    }

    if (qty > currentLotBalance) {
      setErrorMessage(
        `จำนวนที่ขอเบิก (${qty} ${currentHerb.defaultUnit}) เกินยอดคงเหลือในคลัง (${currentLotBalance} ${currentHerb.defaultUnit})`
      );
      return;
    }

    // Check if lot already in list
    const existingIndex = items.findIndex(
      (item) => item.herbId === currentHerb.id && item.lotId === currentLot.id
    );

    const unitPrice = currentLot.unitPrice || 0;
    const totalPrice = qty * unitPrice;

    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...items];
      const newTotalQty = updated[existingIndex].requestedQty + qty;
      if (newTotalQty > currentLotBalance) {
        setErrorMessage(`จำนวนเบิกรวมในล็อตนี้เกินยอดคงคลัง (${currentLotBalance})`);
        return;
      }
      updated[existingIndex].requestedQty = newTotalQty;
      updated[existingIndex].totalPrice = newTotalQty * unitPrice;
      if (itemNote.trim()) {
        updated[existingIndex].note = itemNote.trim();
      }
      setItems(updated);
    } else {
      const newItem: RequisitionItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        herbId: currentHerb.id,
        herbName: currentHerb.name,
        category: currentHerb.category,
        lotId: currentLot.id,
        lotNo: currentLot.lotNo,
        expDate: currentLot.expDate,
        availableStock: currentLotBalance,
        requestedQty: qty,
        unit: currentHerb.defaultUnit,
        unitPrice,
        totalPrice,
        note: itemNote.trim(),
      };
      setItems([...items, newItem]);
    }

    setItemNote('');
    showNotification(`เพิ่ม ${currentHerb.name} (${qty} ${currentHerb.defaultUnit}) ลงในใบเบิกแล้ว`);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  // Calculations
  const totalQuantity = items.reduce((sum, i) => sum + i.requestedQty, 0);
  const totalValue = items.reduce((sum, i) => sum + i.totalPrice, 0);

  // Construct slip object
  const buildCurrentSlip = (): RequisitionSlip => {
    return {
      id: `req-${Date.now()}`,
      slipNumber,
      date,
      time,
      department,
      requesterName,
      requesterPosition,
      dispenserName,
      receiverName: receiverName || requesterName,
      approverName,
      purpose,
      urgency,
      status: 'dispensed',
      items,
      totalQuantity,
      totalValue,
      createdAt: Date.now(),
    };
  };

  // Download PDF Only
  const handleDownloadPDF = async () => {
    let currentItems = items;
    // If no items added yet, auto-add selected herb with stock so user is never blocked
    if (currentItems.length === 0) {
      if (currentHerb && currentLot) {
        const qty = Math.min(10, Math.max(1, currentLotBalance));
        const unitPrice = currentLot.unitPrice || 0;
        const autoItem: RequisitionItem = {
          id: `item-${Date.now()}`,
          herbId: currentHerb.id,
          herbName: currentHerb.name,
          category: currentHerb.category,
          lotId: currentLot.id,
          lotNo: currentLot.lotNo,
          expDate: currentLot.expDate,
          availableStock: currentLotBalance,
          requestedQty: qty,
          unit: currentHerb.defaultUnit,
          unitPrice,
          totalPrice: qty * unitPrice,
          note: 'ขอเบิกสำรองจ่ายประจำวัน',
        };
        currentItems = [autoItem];
        setItems([autoItem]);
        showNotification(`เพิ่ม "${currentHerb.name}" (${qty} ${currentHerb.defaultUnit}) ลงในใบเบิกอัตโนมัติ`);
      } else {
        setErrorMessage('กรุณาเพิ่มรายการยาสมุนไพรอย่างน้อย 1 รายการก่อนดาวน์โหลด PDF');
        return;
      }
    }

    setErrorMessage('');
    setIsGeneratingPdf(true);

    const slip = {
      ...buildCurrentSlip(),
      items: currentItems,
      totalQuantity: currentItems.reduce((sum, i) => sum + i.requestedQty, 0),
      totalValue: currentItems.reduce((sum, i) => sum + i.totalPrice, 0),
    };

    const success = await downloadRequisitionPDF(slip, hospitalName);
    setIsGeneratingPdf(false);

    if (success) {
      // Save slip to history if not yet saved
      const updated = [slip, ...savedSlips.filter((s) => s.slipNumber !== slip.slipNumber)];
      setSavedSlips(updated);
      saveRequisitions(updated);
      showNotification(`ดาวน์โหลดไฟล์ PDF ใบเบิกยา "${slip.slipNumber}" เรียบร้อย (ป้องกันไฟล์เคลื่อน 100%)`);
    } else {
      setErrorMessage('เบราว์เซอร์ไม่อนุญาตให้ดาวน์โหลดไฟล์ PDF ตรง กำลังเปิดหน้าต่างสำหรับสั่งพิมพ์หรือบันทึก PDF แทน');
      openRequisitionInNewTab(slip, hospitalName);
    }
  };

  // Direct print or open in new tab
  const handlePrintSlip = (targetSlip?: RequisitionSlip) => {
    let slip = targetSlip || buildCurrentSlip();
    if (slip.items.length === 0 && currentHerb && currentLot) {
      const qty = Math.min(10, Math.max(1, currentLotBalance));
      const autoItem: RequisitionItem = {
        id: `item-${Date.now()}`,
        herbId: currentHerb.id,
        herbName: currentHerb.name,
        category: currentHerb.category,
        lotId: currentLot.id,
        lotNo: currentLot.lotNo,
        expDate: currentLot.expDate,
        availableStock: currentLotBalance,
        requestedQty: qty,
        unit: currentHerb.defaultUnit,
        unitPrice: currentLot.unitPrice || 0,
        totalPrice: (currentLot.unitPrice || 0) * qty,
        note: 'ขอเบิกสำรองจ่าย',
      };
      slip = { ...slip, items: [autoItem], totalQuantity: qty, totalValue: autoItem.totalPrice };
      setItems([autoItem]);
    }
    openRequisitionInNewTab(slip, hospitalName);
    showNotification(`เปิดหน้าต่างสำหรับสั่งพิมพ์หรือบันทึก PDF ใบเบิกยา "${slip.slipNumber}" แล้ว`);
  };

  // Direct download standalone HTML
  const handleDownloadHTML = (targetSlip?: RequisitionSlip) => {
    const slip = targetSlip || buildCurrentSlip();
    downloadRequisitionHTML(slip, hospitalName);
    showNotification(`ส่งออกไฟล์ HTML ใบเบิกยา "${slip.slipNumber}" เรียบร้อย`);
  };

  // Edit / Load historical slip back into form for editing
  const handleEditHistoricalSlip = (slip: RequisitionSlip) => {
    setSlipNumber(slip.slipNumber);
    setDate(slip.date);
    setTime(slip.time || '09:30');
    setDepartment(slip.department);
    setRequesterName(slip.requesterName);
    setRequesterPosition(slip.requesterPosition || 'เจ้าหน้าที่ผู้ขอเบิก');
    setDispenserName(slip.dispenserName || 'ภญ. ประจำคลังยาสมุนไพร');
    setReceiverName(slip.receiverName || slip.requesterName);
    setApproverName(slip.approverName || 'หัวหน้ากลุ่มงานการแพทย์แผนไทย');
    setPurpose(slip.purpose || '');
    setUrgency(slip.urgency || 'ปกติ');
    setItems([...slip.items]);
    setActiveTab('create');
    showNotification(`โหลดข้อมูลใบเบิก "${slip.slipNumber}" มายังแบบฟอร์มเพื่อแก้ไขแล้ว`);
  };

  // Save, Deduct Stock & Download PDF
  const handleApplyDeductionAndDownload = async () => {
    if (items.length === 0) {
      if (currentHerb && currentLot) {
        const qty = Math.min(10, Math.max(1, currentLotBalance));
        const unitPrice = currentLot.unitPrice || 0;
        const autoItem: RequisitionItem = {
          id: `item-${Date.now()}`,
          herbId: currentHerb.id,
          herbName: currentHerb.name,
          category: currentHerb.category,
          lotId: currentLot.id,
          lotNo: currentLot.lotNo,
          expDate: currentLot.expDate,
          availableStock: currentLotBalance,
          requestedQty: qty,
          unit: currentHerb.defaultUnit,
          unitPrice,
          totalPrice: qty * unitPrice,
          note: 'ขอเบิกสำรองจ่ายประจำวัน',
        };
        items.push(autoItem);
        setItems([autoItem]);
      } else {
        setErrorMessage('กรุณาเพิ่มรายการยาสมุนไพรอย่างน้อย 1 รายการ');
        return;
      }
    }

    setErrorMessage('');
    setIsGeneratingPdf(true);

    const slip = buildCurrentSlip();

    // 1. Deduct from stock cards
    onApplyStockDeduction(slip);

    // 2. Save slip to history
    const updated = [slip, ...savedSlips.filter((s) => s.slipNumber !== slip.slipNumber)];
    setSavedSlips(updated);
    saveRequisitions(updated);

    // 3. Download PDF
    const success = await downloadRequisitionPDF(slip, hospitalName);
    setIsGeneratingPdf(false);

    if (success) {
      showNotification(
        `บันทึกตัดสต๊อกการ์ด ${items.length} รายการ และดาวน์โหลดใบเบิกยา PDF เรียบร้อยแล้ว!`
      );
      // Reset form for next requisition
      setSlipNumber(generateSlipNumber());
      setItems([]);
    } else {
      showNotification(`ตัดสต๊อกเรียบร้อยแล้ว และกำลังเปิดหน้าพิมพ์เอกสารให้แทน`);
      openRequisitionInNewTab(slip, hospitalName);
    }
  };

  // Download PDF for an item from history
  const handleDownloadHistoricalPDF = async (slip: RequisitionSlip) => {
    setIsGeneratingPdf(true);
    const success = await downloadRequisitionPDF(slip, hospitalName);
    setIsGeneratingPdf(false);
    if (success) {
      showNotification(`ดาวน์โหลดไฟล์ PDF ใบเบิกยา "${slip.slipNumber}" สำเร็จ`);
    } else {
      showNotification(`เปิดหน้าต่างพิมพ์หรือบันทึก PDF สำหรับใบเบิก "${slip.slipNumber}" ให้แทน`);
      openRequisitionInNewTab(slip, hospitalName);
    }
  };

  // Delete historical slip
  const handleDeleteSlip = (id: string) => {
    if (window.confirm('คุณต้องการลบประวัติใบเบิกยานี้หรือไม่?')) {
      const updated = savedSlips.filter((s) => s.id !== id);
      setSavedSlips(updated);
      saveRequisitions(updated);
      showNotification('ลบประวัติใบเบิกยาเรียบร้อย');
    }
  };

  if (!isOpen) return null;

  const currentSlipDraft = buildCurrentSlip();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center text-emerald-300">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base sm:text-lg text-white">
                  ระบบใบเบิกยาสมุนไพร (Medicine Requisition &amp; PDF)
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  PDF ป้องกันไฟล์เคลื่อน 100%
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                สร้างใบขอเบิกยา ตรวจสอบสต๊อกคงคลัง ตัดสต๊อกการ์ดอัตโนมัติ และดาวน์โหลด PDF คุณภาพสูง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Status Alert */}
        <div className="bg-slate-100/80 px-4 sm:px-6 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>สร้างใบเบิกยาใหม่</span>
              {items.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
                  {items.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              <span>ดูตัวอย่างแบบฟอร์ม A4</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>ประวัติใบเบิกยา ({savedSlips.length})</span>
            </button>
          </div>

          {/* Quick PDF & Print buttons in header bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={() => handlePrintSlip()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="สั่งพิมพ์ใบเบิกทันที หรือเปิดในหน้าต่างใหม่"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">สั่งพิมพ์ / แท็บใหม่</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="ดาวน์โหลดไฟล์ PDF โดยตรง เพื่อป้องกันการเลื่อนของข้อความและตาราง"
            >
              <Download className="w-3.5 h-3.5 text-teal-200" />
              <span>{isGeneratingPdf ? 'กำลังประมวลผล PDF...' : 'ดาวน์โหลด PDF (ล็อกหน้า A4)'}</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successNotice && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ================= TAB 1: CREATE REQUISITION ================= */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              
              {/* Top Banner: Anti-Shift Explanation */}
              <div className="p-3.5 bg-gradient-to-r from-teal-50/90 to-emerald-50/90 border border-teal-200/80 rounded-xl flex items-start gap-3 text-xs text-teal-900">
                <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-teal-950">
                    ระบบดาวน์โหลดเอกสาร PDF ชนิดป้องกันไฟล์เคลื่อน (Fixed-Layout Vector A4 PDF)
                  </p>
                  <p className="text-teal-800">
                    ใบเบิกยาจะถูกเรนเดอร์ลงบนมาตรฐานหน้า A4 ล็อกพิกัดตาราง เส้นขอบ และบล็อกลายมือชื่อ 4 ฝ่าย
                    จึงมั่นใจได้ว่าตัวหนังสือไม่ทับซ้อน วรรณยุกต์ไม่ลอย และฟอร์แมตไม่ขยับเมื่อเปิดในทุกอุปกรณ์หรือส่งพิมพ์
                  </p>
                </div>
              </div>

              {/* SECTION 1: Requisition Header Info Form */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>ข้อมูลใบขอเบิกยา</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    เลขอ้างอิง: {slipNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Slip Number */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">เลขที่ใบเบิก *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={slipNumber}
                        onChange={(e) => setSlipNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setSlipNumber(generateSlipNumber())}
                        className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] shrink-0"
                        title="สร้างเลขใหม่"
                      >
                        สุ่มเลข
                      </button>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">วันที่ขอเบิก *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ความเร่งด่วน</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    >
                      <option value="ปกติ">ปกติ (Normal)</option>
                      <option value="ด่วน">ด่วน (Urgent)</option>
                      <option value="ด่วนที่สุด">ด่วนที่สุด (Critical)</option>
                    </select>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">เวลาที่ขอเบิก</label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="เช่น 09:30 น."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                </div>

                {/* Department & Purpose */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">หน่วยงาน / แผนกที่ขอเบิก *</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="ระบุแผนก เช่น ห้องตรวจแพทย์แผนไทย"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs mb-1.5"
                    />
                    <div className="flex flex-wrap gap-1">
                      {departmentOptions.slice(0, 4).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDepartment(d)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            department === d
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">วัตถุประสงค์ในการขอเบิก</label>
                    <input
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="เช่น สำรองใช้รักษาผู้ป่วยนอกประจำสัปดาห์"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                </div>

                {/* Signees Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-200/80">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">(1) ชื่อผู้ขอเบิก *</label>
                    <input
                      type="text"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ตำแหน่งผู้ขอเบิก</label>
                    <input
                      type="text"
                      value={requesterPosition}
                      onChange={(e) => setRequesterPosition(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">(2) ผู้จ่ายยา (เจ้าหน้าที่คลัง)</label>
                    <input
                      type="text"
                      value={dispenserName}
                      onChange={(e) => setDispenserName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">(4) ผู้อนุมัติ (หัวหน้ากลุ่มงาน)</label>
                    <input
                      type="text"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Add Medicine to Slip Form */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                <h4 className="font-semibold text-emerald-950 text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>เลือกยาสมุนไพรเพื่อเพิ่มลงในใบเบิก</span>
                </h4>

                <form onSubmit={handleAddItem} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                    {/* Herb Selector */}
                    <div className="md:col-span-5">
                      <label className="block text-slate-700 font-semibold mb-1">
                        ยาสมุนไพร ({herbs.length} รายการ) *
                      </label>
                      <select
                        value={selectedHerbId}
                        onChange={(e) => setSelectedHerbId(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                      >
                        {herbs.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.defaultPackaging})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lot Selector */}
                    <div className="md:col-span-4">
                      <label className="block text-slate-700 font-semibold mb-1">
                        เลือกล็อตการผลิต (FEFO) *
                      </label>
                      <select
                        value={selectedLotId}
                        onChange={(e) => setSelectedLotId(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                      >
                        {currentHerb?.lots
                          .filter((l) => !l.isArchived)
                          .map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.lotNo} (คงเหลือ: {getLotBalance(l)} {currentHerb.defaultUnit} | EXP: {formatDateThai(l.expDate)})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-semibold">
                          จำนวนที่เบิก ({currentHerb?.defaultUnit}) *
                        </label>
                        <span className="text-[11px] text-slate-500">
                          คงเหลือ: <strong>{currentLotBalance}</strong>
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={itemQty}
                        onChange={(e) => setItemQty(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-xs">
                    <div className="w-full sm:w-2/3">
                      <input
                        type="text"
                        value={itemNote}
                        onChange={(e) => setItemNote(e.target.value)}
                        placeholder="หมายเหตุรายตัวยา (เช่น ระบุห้องตรวจ หรือ ข้อบ่งใช้)"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่มรายการลงใบเบิก</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION 3: Current Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-700" />
                    <span>รายการยาในใบเบิก ({items.length} รายการ)</span>
                  </h4>
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setItems([])}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                    >
                      ล้างรายการทั้งหมด
                    </button>
                  )}
                </div>

                <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                          <th className="py-2.5 px-3 min-w-[180px]">ชื่อยาสมุนไพร / หมวดหมู่</th>
                          <th className="py-2.5 px-3 w-28">ล็อต / วันหมดอายุ</th>
                          <th className="py-2.5 px-3 text-center w-20">คงคลัง</th>
                          <th className="py-2.5 px-3 text-center w-24 bg-emerald-50 text-emerald-950 font-bold">
                            จำนวนที่เบิก
                          </th>
                          <th className="py-2.5 px-3 text-center w-16">หน่วย</th>
                          <th className="py-2.5 px-3 text-right w-24">ราคา/หน่วย</th>
                          <th className="py-2.5 px-3 text-right w-24">รวมเงิน (บาท)</th>
                          <th className="py-2.5 px-2 text-center w-12">ลบ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {items.length > 0 ? (
                          items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 text-center font-medium text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-slate-900">{item.herbName}</div>
                                {item.note && (
                                  <div className="text-[11px] text-slate-400">หมายเหตุ: {item.note}</div>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700">
                                <div>{item.lotNo}</div>
                                <div className="text-[10px] text-slate-500">EXP: {formatDateThai(item.expDate)}</div>
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-slate-600">
                                {item.availableStock}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-emerald-800 bg-emerald-50/40 text-sm">
                                {item.requestedQty}
                              </td>
                              <td className="py-2 px-3 text-center text-slate-600">
                                {item.unit}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-700">
                                {item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                                {item.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="ลบรายการนี้"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-500">
                              <div className="space-y-2">
                                <p className="italic">ยังไม่มีรายการยาในใบเบิก กรุณาเลือกยาสมุนไพรและกด "+ เพิ่มรายการลงใบเบิก"</p>
                                <div>
                                  <button
                                    type="button"
                                    onClick={handleAddSampleItems}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>คลิกเพื่อเพิ่มตัวอย่างยา 3 ชนิดทันที (สำหรับทดสอบดาวน์โหลด)</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {items.length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-100/90 font-bold border-t border-slate-300 text-slate-900">
                            <td colSpan={4} className="py-2.5 px-3 text-right">
                              รวมทั้งสิ้น ({items.length} รายการ):
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-emerald-800 text-sm bg-emerald-100/60">
                              {totalQuantity}
                            </td>
                            <td className="py-2.5 px-3 text-center">หน่วย</td>
                            <td className="py-2.5 px-3 text-right text-slate-600">มูลค่ารวม:</td>
                            <td className="py-2.5 px-3 text-right font-mono text-sm text-slate-900">
                              {totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* Baht Text Banner */}
                {items.length > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                    <div>
                      <span className="font-semibold text-emerald-900">จำนวนเงินรวมทั้งสิ้น (ตัวอักษร):</span>
                      <span className="ml-2 font-bold text-slate-900">
                        ({numberToThaiBahtText(totalValue)})
                      </span>
                    </div>
                    <div className="text-slate-600">
                      รวมยาทั้งสิ้น <strong>{totalQuantity}</strong> หน่วย
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: Action Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>ดูตัวอย่างหน้ากระดาษ A4</span>
                </button>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                  {/* Print / Open Tab Button */}
                  <button
                    type="button"
                    onClick={() => handlePrintSlip()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="สั่งพิมพ์ลงเครื่องพิมพ์ หรือเปิดหน้าต่างใหม่เพื่อบันทึกเป็น PDF"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>สั่งพิมพ์ / เปิดแท็บใหม่</span>
                  </button>

                  {/* Download PDF Only */}
                  <button
                    type="button"
                    disabled={isGeneratingPdf}
                    onClick={handleDownloadPDF}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-teal-700" />
                    <span>{isGeneratingPdf ? 'กำลังสร้างไฟล์ PDF...' : '1. ดาวน์โหลดไฟล์ PDF (ล็อกหน้า A4)'}</span>
                  </button>

                  {/* Apply Stock Deduction + Download PDF */}
                  <button
                    type="button"
                    disabled={isGeneratingPdf}
                    onClick={handleApplyDeductionAndDownload}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>2. ตัดสต๊อกการ์ด &amp; ดาวน์โหลด PDF ทันที</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 2: LIVE A4 PREVIEW ================= */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-800">
                    หน้าต่างแสดงตัวอย่างใบเบิกยามาตรฐานกระทรวงสาธารณสุข (Preview Mode)
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>กลับไปแก้ไข</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintSlip()}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 cursor-pointer"
                    title="สั่งพิมพ์ผ่านเบราว์เซอร์ หรือบันทึก PDF ทันที"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>สั่งพิมพ์ / เปิดแท็บใหม่</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadHTML()}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 cursor-pointer"
                    title="ดาวน์โหลดไฟล์เอกสาร HTML สำหรับเปิดดูหรือแก้ไข"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-600" />
                    <span>ส่งออก HTML</span>
                  </button>
                  <button
                    type="button"
                    disabled={isGeneratingPdf}
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isGeneratingPdf ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (ล็อกหน้า A4)'}</span>
                  </button>
                </div>
              </div>

              {/* Rendered HTML inside an A4 shadow card container */}
              <div className="overflow-x-auto p-4 bg-slate-200/70 rounded-xl flex justify-center">
                <div 
                  className="bg-white shadow-2xl rounded-sm text-slate-900 border border-slate-300 overflow-hidden"
                  dangerouslySetInnerHTML={{
                    __html: generateRequisitionSlipHTML(currentSlipDraft, hospitalName),
                  }}
                />
              </div>
            </div>
          )}

          {/* ================= TAB 3: REQUISITION SLIPS HISTORY ================= */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">
                    ประวัติใบเบิกยาที่บันทึกไว้ในระบบ
                  </h4>
                  <p className="text-xs text-slate-500">
                    สามารถเปิดดูหรือดาวน์โหลดไฟล์ PDF ย้อนหลังเพื่อนำไปใช้งานได้ตลอดเวลา
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>สร้างใบเบิกยาใหม่</span>
                </button>
              </div>

              {savedSlips.length > 0 ? (
                <div className="space-y-3">
                  {savedSlips.map((slip) => (
                    <div
                      key={slip.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50/10 transition-all shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                            REQ
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                {slip.slipNumber}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                                จ่ายยาแล้ว
                              </span>
                              {slip.urgency && slip.urgency !== 'ปกติ' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                                  {slip.urgency}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              แผนก: <strong>{slip.department}</strong> • ผู้ขอเบิก: <strong>{slip.requesterName}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                          <span className="text-xs text-slate-500 mr-1 hidden md:inline">
                            วันที่: <strong>{formatDateThai(slip.date)}</strong>
                          </span>
                          
                          {/* Edit / Reload Button */}
                          <button
                            type="button"
                            onClick={() => handleEditHistoricalSlip(slip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                            title="โหลดข้อมูลใบเบิกนี้กลับมาแก้ไขในแบบฟอร์ม"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>แก้ไข</span>
                          </button>

                          {/* Print / Open Tab Button */}
                          <button
                            type="button"
                            onClick={() => handlePrintSlip(slip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="เปิดหน้าต่างสำหรับสั่งพิมพ์หรือบันทึก PDF ผ่านเบราว์เซอร์"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span>สั่งพิมพ์ / แท็บใหม่</span>
                          </button>

                          {/* Download PDF Button */}
                          <button
                            type="button"
                            disabled={isGeneratingPdf}
                            onClick={() => handleDownloadHistoricalPDF(slip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                            title="ดาวน์โหลดไฟล์ PDF ป้องกันไฟล์เคลื่อน"
                          >
                            <Download className="w-3.5 h-3.5 text-teal-700" />
                            <span>ดาวน์โหลด PDF</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSlip(slip.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
                            title="ลบใบเบิกนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items Preview Chips */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {slip.items.map((item, i) => (
                          <div
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5"
                          >
                            <span className="font-semibold text-slate-900">{item.herbName}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-mono text-emerald-700 font-bold">
                              {item.requestedQty} {item.unit}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ล็อต {item.lotNo}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Financial Footer */}
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <div>
                          วัตถุประสงค์: <span className="text-slate-700">{slip.purpose || '-'}</span>
                        </div>
                        <div>
                          ยอดรวม: <strong className="text-slate-900 font-mono">{slip.totalQuantity}</strong> หน่วย 
                          (<strong className="text-slate-900 font-mono">{slip.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong> บาท)
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium text-slate-600">ยังไม่มีประวัติใบเบิกยาในระบบ</p>
                  <p className="text-xs text-slate-400 mt-1">
                    เมื่อคุณสร้างใบเบิกยาและดาวน์โหลด PDF ระบบจะจัดเก็บประวัติไว้ที่นี่โดยอัตโนมัติ
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Bar */}
        <div className="p-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>มาตรฐานงานคลังเวชภัณฑ์ยาสมุนไพร • เอกสาร PDF ล็อกขนาดกระดาษ A4 เสมอ</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
