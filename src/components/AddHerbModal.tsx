import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Leaf, 
  AlertCircle,
  Package,
  Layers
} from 'lucide-react';
import { HerbCategory, HerbItem, StockCardLot, StockTransaction } from '../types';

interface AddHerbModalProps {
  onClose: () => void;
  onSaveHerb: (newHerb: HerbItem) => void;
  categories: HerbCategory[];
}

export const AddHerbModal: React.FC<AddHerbModalProps> = ({
  onClose,
  onSaveHerb,
  categories,
}) => {
  const [name, setName] = useState('');
  const [commonName, setCommonName] = useState('');
  const [category, setCategory] = useState<HerbCategory>(categories[0] || 'ยารับประทาน (เม็ด/แคปซูล)');
  const [defaultUnit, setDefaultUnit] = useState('เม็ด');
  const [defaultPackaging, setDefaultPackaging] = useState('100 เม็ด/ขวด');
  const [minStockAlert, setMinStockAlert] = useState('10');
  const [indications, setIndications] = useState('');

  // Initial Lot
  const [lotNo, setLotNo] = useState(`LOT-${String((new Date().getFullYear() + 543) % 100).padStart(2, '0')}${String(new Date().getMonth() + 1).padStart(2, '0')}01`);
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().slice(0, 10));
  const [expDate, setExpDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [unitPrice, setUnitPrice] = useState('90');
  const [initialQuantity, setInitialQuantity] = useState('50');
  const [supplierOrManufacturer, setSupplierOrManufacturer] = useState('ฝ่ายผลิตยาสมุนไพร รพ.');

  const [error, setError] = useState('');

  const handleSuggestLot = () => {
    const now = new Date();
    const thaiYearShort = String((now.getFullYear() + 543) % 100).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setLotNo(`LOT-${thaiYearShort}${month}${day}-01`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('กรุณาระบุชื่อยาสมุนไพร');
      return;
    }

    if (!lotNo.trim()) {
      setError('กรุณาระบุเลขที่ Lot.No เริ่มต้น');
      return;
    }

    if (!expDate) {
      setError('กรุณาระบุวันหมดอายุ (Exp.date)');
      return;
    }

    const herbId = `herb-${Date.now()}`;
    const lotId = `lot-${Date.now()}`;
    const initQty = parseFloat(initialQuantity) || 0;

    const initialTransactions: StockTransaction[] = [];
    if (initQty > 0) {
      initialTransactions.push({
        id: `tx-${Date.now()}`,
        date: mfgDate || new Date().toISOString().slice(0, 10),
        broughtForward: 0,
        received: initQty,
        dispensed: 0,
        balance: initQty,
        requesterOrDispenser: supplierOrManufacturer.trim() || 'รับเข้าคลังครั้งแรก',
        note: 'เปิดสต๊อกเริ่มต้น (ล็อตแรก)',
        timestamp: Date.now(),
      });
    }

    const initialLot: StockCardLot = {
      id: lotId,
      lotNo: lotNo.trim(),
      mfgDate: mfgDate || undefined,
      expDate,
      packaging: defaultPackaging.trim(),
      unitPrice: parseFloat(unitPrice) || 0,
      supplierOrManufacturer: supplierOrManufacturer.trim() || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
      transactions: initialTransactions,
    };

    const newHerb: HerbItem = {
      id: herbId,
      code: `HERB-${String(Math.floor(Math.random() * 900) + 100)}`,
      name: name.trim(),
      commonName: commonName.trim() || name.trim(),
      category,
      defaultUnit: defaultUnit.trim() || 'หน่วย',
      defaultPackaging: defaultPackaging.trim() || '1 หน่วย',
      minStockAlert: parseFloat(minStockAlert) || 10,
      indications: indications.trim(),
      lots: [initialLot],
      activeLotId: lotId,
      updatedAt: Date.now(),
    };

    onSaveHerb(newHerb);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">
                เพิ่มรายการยาสมุนไพรใหม่
              </h3>
              <p className="text-xs text-slate-500">
                เพิ่มเข้าสู่ระบบและสร้างบัตร Stock Card ล็อตแรกอัตโนมัติ
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-1.5 border-b pb-1">
              <Package className="w-4 h-4 text-emerald-600" />
              1. ข้อมูลยาสมุนไพร
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อยาสมุนไพร (ตามที่พิมพ์บน Stock Card) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ประสะมะแว้ง 200 มิลลิกรัม/เม็ด"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่ยา *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HerbCategory)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ขนาดบรรจุ (เช่น 100 เม็ด/ขวด, หลอด 30 กรัม) *
                </label>
                <input
                  type="text"
                  value={defaultPackaging}
                  onChange={(e) => setDefaultPackaging(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หน่วยนับ (เม็ด, แคปซูล, ขวด, ซอง, หลอด) *
                </label>
                <input
                  type="text"
                  value={defaultUnit}
                  onChange={(e) => setDefaultUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เกณฑ์แจ้งเตือนสต๊อกต่ำ (หน่วยบรรจุ) *
                </label>
                <input
                  type="number"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สรรพคุณ / ข้อบ่งใช้ย่อ
                </label>
                <input
                  type="text"
                  value={indications}
                  onChange={(e) => setIndications(e.target.value)}
                  placeholder="เช่น บรรเทาอาการไอ ขับเสมหะ"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Initial Lot Information */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b pb-1">
              <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                2. ข้อมูลล็อตการผลิตเริ่มต้น (Initial Lot.No)
              </h4>
              <span className="text-[11px] text-slate-500">
                (สามารถเพิ่มล็อตการผลิตใหม่ได้ไม่จำกัดในภายหลัง)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    เลขที่ Lot.No เริ่มต้น *
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestLot}
                    className="text-[11px] text-emerald-700 hover:underline font-mono"
                  >
                    💡 แนะนำรหัส
                  </button>
                </div>
                <input
                  type="text"
                  value={lotNo}
                  onChange={(e) => setLotNo(e.target.value)}
                  placeholder="เช่น LOT-670921-01"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันหมดอายุ (Exp.date) *
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่ผลิต (Mfg.date)
                </label>
                <input
                  type="date"
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  แหล่งผลิต / ผู้จัดส่ง
                </label>
                <input
                  type="text"
                  value={supplierOrManufacturer}
                  onChange={(e) => setSupplierOrManufacturer(e.target.value)}
                  placeholder="เช่น ฝ่ายผลิตยาสมุนไพร รพ."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ราคาต่อหน่วยบรรจุ (บาท)
                </label>
                <input
                  type="number"
                  step="any"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนรับเข้าเริ่มต้น ({defaultUnit || 'หน่วยบรรจุ'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              บันทึกยาสมุนไพร
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
