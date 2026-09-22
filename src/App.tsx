import React, { useState, useEffect, useMemo } from 'react';
import { 
  HerbCategory, 
  HerbItem, 
  StockCardLot,
  StockTransaction, 
  ViewFilter,
  RequisitionSlip
} from './types';
import { INITIAL_HERBS_DATA } from './data/defaultHerbs';
import { 
  STORAGE_KEY, 
  calculateStockStats, 
  getHerbTotalStock, 
  getExpiryStatus, 
  getActiveLot,
  getLotBalance,
  exportStockSummaryCSV,
  resetAllHerbsHistoryToZero
} from './utils/stockUtils';

import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { HerbCard } from './components/HerbCard';
import { HerbTableView } from './components/HerbTableView';
import { StockCardDetailModal } from './components/StockCardDetailModal';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { AddHerbModal } from './components/AddHerbModal';
import { PrintViewModal } from './components/PrintViewModal';
import { ExportBackupModal } from './components/ExportBackupModal';
import { InventoryReportModal } from './components/InventoryReportModal';
import { RequisitionModal } from './components/RequisitionModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Sidebar } from './components/Sidebar';
import { Search, PlusCircle, RotateCcw, FileSpreadsheet, HardDrive, Printer, Building2, FileDown } from 'lucide-react';

export default function App() {
  // Load herbs from localStorage or default data
  const [herbs, setHerbs] = useState<HerbItem[]>(() => {
    try {
      // Clean up previous test storage versions
      localStorage.removeItem('thai_herb_stock_cards_v1');
      localStorage.removeItem('thai_herb_stock_cards_v2');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading stock from localStorage:', err);
    }
    return INITIAL_HERBS_DATA;
  });

  // Save to localStorage when herbs change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(herbs));
    } catch (err) {
      console.error('Error saving stock to localStorage:', err);
    }
  }, [herbs]);

  // Filtering and Searching State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<ViewFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals state
  const [activeStockCardHerb, setActiveStockCardHerb] = useState<HerbItem | null>(null);
  const [isQuickTxOpen, setIsQuickTxOpen] = useState<boolean>(false);
  const [quickTxHerb, setQuickTxHerb] = useState<HerbItem | null>(null);
  const [isAddHerbOpen, setIsAddHerbOpen] = useState<boolean>(false);
  const [isPrintViewOpen, setIsPrintViewOpen] = useState<boolean>(false);
  const [isExportBackupOpen, setIsExportBackupOpen] = useState<boolean>(false);
  const [isInventoryReportOpen, setIsInventoryReportOpen] = useState<boolean>(false);
  const [isRequisitionOpen, setIsRequisitionOpen] = useState<boolean>(false);
  const [requisitionPreSelectedHerb, setRequisitionPreSelectedHerb] = useState<HerbItem | null>(null);
  const [printHerb, setPrintHerb] = useState<HerbItem | null>(null);

  // Categories list
  const categories = useMemo<HerbCategory[]>(() => {
    const set = new Set<HerbCategory>();
    herbs.forEach(h => set.add(h.category));
    return Array.from(set);
  }, [herbs]);

  // Summary statistics
  const stats = useMemo(() => calculateStockStats(herbs), [herbs]);

  // Filtered herbs calculation
  const filteredHerbs = useMemo(() => {
    return herbs.filter(herb => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = herb.name.toLowerCase().includes(q);
        const matchCode = herb.code?.toLowerCase().includes(q);
        const matchCommon = herb.commonName?.toLowerCase().includes(q);
        const matchLot = herb.lots.some(l => l.lotNo.toLowerCase().includes(q));
        const matchIndications = herb.indications?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCommon && !matchLot && !matchIndications) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && herb.category !== selectedCategory) {
        return false;
      }

      // 3. Status View Filter
      const totalStock = getHerbTotalStock(herb);
      const activeLot = getActiveLot(herb);
      const expStatus = activeLot ? getExpiryStatus(activeLot.expDate) : null;

      if (currentFilter === 'low-stock') {
        return totalStock <= herb.minStockAlert;
      }
      if (currentFilter === 'expiring') {
        return (
          expStatus?.status === 'critical' || 
          expStatus?.status === 'warning' ||
          expStatus?.status === 'expired'
        );
      }
      if (currentFilter === 'expired') {
        return expStatus?.status === 'expired';
      }

      return true;
    });
  }, [herbs, searchQuery, selectedCategory, currentFilter]);

  // Quick transaction handler (supports existing lot or adding brand new production lot)
  const handleSaveQuickTransaction = (
    herbId: string, 
    lotId: string, 
    transaction: Omit<StockTransaction, 'id' | 'timestamp'>,
    newLotData?: {
      lotNo: string;
      expDate: string;
      mfgDate?: string;
      packaging?: string;
      unitPrice?: number;
      supplierOrManufacturer?: string;
      notes?: string;
    }
  ) => {
    setHerbs(prev => {
      return prev.map(herb => {
        if (herb.id !== herbId) return herb;

        const generatedTxId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const newTransaction: StockTransaction = {
          ...transaction,
          id: generatedTxId,
          timestamp: Date.now(),
        };

        // If newLotData is provided, create and append a brand new lot
        if (newLotData) {
          const newLotId = lotId || `lot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const createdLot: StockCardLot = {
            id: newLotId,
            lotNo: newLotData.lotNo.trim(),
            mfgDate: newLotData.mfgDate,
            expDate: newLotData.expDate,
            packaging: newLotData.packaging || herb.defaultPackaging,
            unitPrice: newLotData.unitPrice !== undefined ? newLotData.unitPrice : (herb.lots[0]?.unitPrice || 0),
            supplierOrManufacturer: newLotData.supplierOrManufacturer,
            createdAt: new Date().toISOString().slice(0, 10),
            transactions: [newTransaction],
            notes: newLotData.notes,
          };

          const updatedHerb: HerbItem = {
            ...herb,
            lots: [...herb.lots, createdLot],
            activeLotId: newLotId,
            updatedAt: Date.now(),
          };

          if (activeStockCardHerb && activeStockCardHerb.id === herbId) {
            setActiveStockCardHerb(updatedHerb);
          }

          return updatedHerb;
        }

        // Otherwise, update existing lot
        const updatedLots = herb.lots.map(lot => {
          if (lot.id !== lotId) return lot;

          const newTransactions = [...lot.transactions, newTransaction];
          return {
            ...lot,
            transactions: newTransactions,
          };
        });

        const updatedHerb: HerbItem = {
          ...herb,
          lots: updatedLots,
          updatedAt: Date.now(),
        };

        if (activeStockCardHerb && activeStockCardHerb.id === herbId) {
          setActiveStockCardHerb(updatedHerb);
        }

        return updatedHerb;
      });
    });
  };

  // Direct herb update handler
  const handleUpdateHerb = (updatedHerb: HerbItem) => {
    setHerbs(prev => prev.map(h => h.id === updatedHerb.id ? updatedHerb : h));
    setActiveStockCardHerb(updatedHerb);
  };

  // Add new herb medicine handler
  const handleSaveNewHerb = (newHerb: HerbItem) => {
    setHerbs(prev => [newHerb, ...prev]);
  };

  // Reset database back to default 41 medicines
  const handleResetData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็น 41 รายการสมุนไพรเริ่มต้นใช่หรือไม่? (ข้อมูลที่บันทึกไว้จะถูกแทนที่)')) {
      setHerbs(INITIAL_HERBS_DATA);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HERBS_DATA));
    }
  };

  // Clear all transaction histories, lot numbers, exp dates, and stock counts to start real inventory intake
  const handleClearAllHistory = () => {
    if (window.confirm('คุณต้องการลบประวัติรับ-จ่าย เลขที่ Lot วันหมดอายุ ขนาดบรรจุ และราคาต่อหน่วยให้ว่างเปล่าเป็น 0 ทั้งหมดใช่หรือไม่?\n\n(รายชื่อยาสมุนไพร 41 รายการจะยังคงอยู่ครบถ้วน เพื่อให้ท่านพร้อมเริ่มบันทึกสต๊อกยาจริงใหม่ทั้งหมด)')) {
      const zeroed = resetAllHerbsHistoryToZero(herbs);
      setHerbs(zeroed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(zeroed));
      if (activeStockCardHerb) {
        const found = zeroed.find(h => h.id === activeStockCardHerb.id);
        if (found) setActiveStockCardHerb(found);
      }
    }
  };

  // Restore imported data
  const handleImportData = (importedData: HerbItem[]) => {
    setHerbs(importedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(importedData));
  };

  const handleOpenQuickTxForHerb = (herb: HerbItem) => {
    setQuickTxHerb(herb);
    setIsQuickTxOpen(true);
  };

  const handlePrintSingleHerb = (herb: HerbItem) => {
    setPrintHerb(herb);
    setIsPrintViewOpen(true);
  };

  const handleOpenRequisition = (herb?: HerbItem) => {
    setRequisitionPreSelectedHerb(herb || null);
    setIsRequisitionOpen(true);
  };

  const handleApplyStockDeduction = (slip: RequisitionSlip) => {
    const todayStr = slip.date || new Date().toISOString().slice(0, 10);
    setHerbs(prev => {
      return prev.map(herb => {
        const matchedItems = slip.items.filter(it => it.herbId === herb.id);
        if (matchedItems.length === 0) return herb;

        let updatedLots = [...herb.lots];
        matchedItems.forEach(item => {
          updatedLots = updatedLots.map(lot => {
            if (lot.id === item.lotId) {
              const currentBal = getLotBalance(lot);
              const newBal = Math.max(0, currentBal - item.requestedQty);
              const newTx: StockTransaction = {
                id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                date: todayStr,
                broughtForward: currentBal,
                received: 0,
                dispensed: item.requestedQty,
                balance: newBal,
                requesterOrDispenser: `${slip.department} (${slip.requesterName})`,
                note: `ใบเบิกเลขที่ ${slip.slipNumber || '-'}${slip.purpose ? ` : ${slip.purpose}` : ''}`,
                timestamp: Date.now(),
              };
              return {
                ...lot,
                transactions: [...lot.transactions, newTx],
              };
            }
            return lot;
          });
        });

        const updatedHerb: HerbItem = {
          ...herb,
          lots: updatedLots,
          updatedAt: Date.now(),
        };

        if (activeStockCardHerb && activeStockCardHerb.id === herb.id) {
          setActiveStockCardHerb(updatedHerb);
        }

        return updatedHerb;
      });
    });
  };



  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 lg:pb-10 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Top Navigation & App Bar */}
      <Header
        herbs={herbs}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenQuickTx={() => {
          setQuickTxHerb(null);
          setIsQuickTxOpen(true);
        }}
        onOpenAddHerb={() => setIsAddHerbOpen(true)}
        onOpenRequisitionModal={() => handleOpenRequisition()}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />

      {/* Main Layout Area: Sidebar on the left + Main Content on the right */}
      <div className="flex-1 flex max-w-(--breakpoint-2xl) w-full mx-auto">
        
        {/* Left Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenQuickTx={() => {
            setQuickTxHerb(null);
            setIsQuickTxOpen(true);
          }}
          onOpenAddHerb={() => setIsAddHerbOpen(true)}
          onOpenRequisitionModal={() => handleOpenRequisition()}
          onOpenInventoryReport={() => setIsInventoryReportOpen(true)}
          onOpenPrintView={() => {
            setPrintHerb(null);
            setIsPrintViewOpen(true);
          }}
          onOpenExportModal={() => setIsExportBackupOpen(true)}
          onExportCSV={() => exportStockSummaryCSV(herbs)}
          onResetData={handleResetData}
          onClearAllHistory={handleClearAllHistory}
          stats={stats}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

        {/* Main Content View */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
          
          {/* Metric Statistics Cards & Filter Toolbar */}
          <DashboardStats
            stats={stats}
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* List Content */}
          {filteredHerbs.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredHerbs.map(herb => (
                  <HerbCard
                    key={herb.id}
                    herb={herb}
                    onOpenCard={setActiveStockCardHerb}
                    onQuickTx={handleOpenQuickTxForHerb}
                    onPrintSingle={handlePrintSingleHerb}
                  />
                ))}
              </div>
            ) : (
              <HerbTableView
                herbs={filteredHerbs}
                onOpenCard={setActiveStockCardHerb}
                onQuickTx={handleOpenQuickTxForHerb}
                onPrintSingle={handlePrintSingleHerb}
              />
            )
          ) : (
            /* Empty State */
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 my-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-slate-800 text-lg">
                ไม่พบรายการยาสมุนไพรที่ค้นหา
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูรายการยาสมุนไพรทั้งหมด
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentFilter('all');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddHerbOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>เพิ่มยาสมุนไพรใหม่</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Footer Action strip */}
          <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 no-print">
            <div>
              <span>แสดง {filteredHerbs.length} จากทั้งหมด {herbs.length} รายการยา</span>
              <span className="mx-2">•</span>
              <span>บันทึกข้อมูลอัตโนมัติในเครื่อง (Local Storage)</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenRequisition()}
                className="inline-flex items-center gap-1.5 text-teal-800 hover:text-teal-950 font-semibold cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>สร้างใบเบิกยา (PDF)</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsInventoryReportOpen(true)}
                className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>รายงานและผังคลัง</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsExportBackupOpen(true)}
                className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ส่งออก CSV</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setPrintHerb(null);
                  setIsPrintViewOpen(true);
                }}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ Stock Card</span>
              </button>
            </div>
          </div>

        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        lowStockCount={stats.lowStockCount}
        expiringCount={stats.expiringCount + stats.expiredCount}
        onOpenQuickTx={() => {
          setQuickTxHerb(null);
          setIsQuickTxOpen(true);
        }}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onOpenRequisitionModal={() => handleOpenRequisition()}
      />

      {/* ================= MODALS ================= */}

      {/* MODAL 1: Stock Card Full Detail (Ledger / Lots) */}
      {activeStockCardHerb && (
        <StockCardDetailModal
          herb={activeStockCardHerb}
          onClose={() => setActiveStockCardHerb(null)}
          onUpdateHerb={handleUpdateHerb}
          onPrintCard={(herb) => {
            setPrintHerb(herb);
            setIsPrintViewOpen(true);
          }}
          onOpenRequisitionModal={(herb) => handleOpenRequisition(herb)}
        />
      )}

      {/* MODAL 2: Quick Transaction Modal (Receive / Dispense) */}
      {isQuickTxOpen && (
        <QuickTransactionModal
          herbs={herbs}
          preSelectedHerb={quickTxHerb}
          onClose={() => {
            setIsQuickTxOpen(false);
            setQuickTxHerb(null);
          }}
          onSaveTransaction={handleSaveQuickTransaction}
          onOpenRequisitionModal={() => handleOpenRequisition(quickTxHerb || undefined)}
        />
      )}

      {/* MODAL 3: Add New Herb Medicine */}
      {isAddHerbOpen && (
        <AddHerbModal
          categories={categories}
          onClose={() => setIsAddHerbOpen(false)}
          onSaveHerb={handleSaveNewHerb}
        />
      )}

      {/* MODAL 4: Official Stock Card Print View */}
      {isPrintViewOpen && (
        <PrintViewModal
          herbs={herbs}
          preSelectedHerb={printHerb}
          onClose={() => {
            setIsPrintViewOpen(false);
            setPrintHerb(null);
          }}
        />
      )}

      {/* MODAL 5: Export CSV & Backup Modal */}
      {isExportBackupOpen && (
        <ExportBackupModal
          herbs={herbs}
          onClose={() => setIsExportBackupOpen(false)}
          onImportData={handleImportData}
          onResetData={handleResetData}
          onClearAllHistory={handleClearAllHistory}
        />
      )}

      {/* MODAL 6: Comprehensive Inventory Valuation, All Herbs Directory & Risk Reports */}
      <InventoryReportModal
        isOpen={isInventoryReportOpen}
        onClose={() => setIsInventoryReportOpen(false)}
        herbs={herbs}
        onSelectHerb={(herbId) => {
          const found = herbs.find(h => h.id === herbId);
          if (found) {
            setActiveStockCardHerb(found);
            setIsInventoryReportOpen(false);
          }
        }}
      />

      {/* MODAL 7: Official Requisition Slip Modal (PDF Fixed Layout) */}
      <RequisitionModal
        isOpen={isRequisitionOpen}
        onClose={() => {
          setIsRequisitionOpen(false);
          setRequisitionPreSelectedHerb(null);
        }}
        herbs={herbs}
        initialSelectedHerb={requisitionPreSelectedHerb}
        onApplyStockDeduction={handleApplyStockDeduction}
      />


    </div>
  );
}
