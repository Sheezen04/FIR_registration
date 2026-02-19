import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronRight, ChevronLeft, PlayCircle, 
  CheckCircle2, LayoutGrid, MousePointer2, 
  Search, FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TourProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Visual Simulations for the Guide ---

// 1. Simulates Drag and Drop Animation
const DragDropSimulation = () => {
  return (
    <div className="relative w-full h-48 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center gap-8 p-4">
      {/* Column 1 */}
      <div className="w-1/3 h-full bg-slate-200/50 rounded border border-dashed border-slate-300 p-2 flex flex-col gap-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase">Pending</div>
        <div className="h-2 w-full bg-white rounded opacity-50"></div>
      </div>
      
      {/* Column 2 */}
      <div className="w-1/3 h-full bg-indigo-50/50 rounded border border-dashed border-indigo-200 p-2 flex flex-col gap-2">
        <div className="text-[10px] font-bold text-indigo-400 uppercase">In Progress</div>
      </div>

      {/* The Moving Card */}
      <motion.div
        className="absolute z-10 w-24 h-16 bg-white rounded shadow-lg border-l-4 border-amber-400 p-2 flex flex-col justify-center"
        initial={{ x: -60, y: 10, rotate: 0 }}
        animate={{ 
          x: [ -60, -60, 60, 60, -60 ], // Move right then reset
          y: [ 10, -5, -5, 10, 10 ],   // Lift up then drop
          scale: [1, 1.05, 1.05, 1, 1],
          boxShadow: ["0px 2px 5px rgba(0,0,0,0.1)", "0px 10px 20px rgba(0,0,0,0.15)", "0px 10px 20px rgba(0,0,0,0.15)", "0px 2px 5px rgba(0,0,0,0.1)", "0px 2px 5px rgba(0,0,0,0.1)"]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-2 w-16 bg-slate-200 rounded mb-1"></div>
        <div className="h-1.5 w-10 bg-slate-100 rounded"></div>
        
        {/* The Cursor */}
        <motion.div 
          className="absolute -bottom-4 -right-4 text-slate-800"
          animate={{ scale: [1, 0.9, 0.9, 1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <MousePointer2 className="fill-slate-800 text-white h-6 w-6" />
        </motion.div>
      </motion.div>
    </div>
  );
};

// 2. Simulates Filter Animation
const FilterSimulation = () => {
  return (
    <div className="w-full h-48 bg-slate-900 rounded-lg flex items-center justify-center p-6 relative overflow-hidden">
       <motion.div 
         initial={{ y: 20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ duration: 0.5 }}
         className="w-full max-w-sm bg-white rounded-md p-2 flex items-center gap-2 shadow-xl"
       >
         <Search className="h-4 w-4 text-slate-400" />
         <div className="h-2 w-24 bg-slate-200 rounded animate-pulse"></div>
         <div className="ml-auto bg-indigo-600 h-6 w-12 rounded text-[10px] text-white flex items-center justify-center">Find</div>
       </motion.div>
       <div className="absolute top-4 left-4 flex gap-2">
          {["All", "Pending", "Closed"].map((t, i) => (
            <motion.div 
              key={t}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="px-2 py-1 bg-slate-800 text-slate-300 text-[10px] rounded-full border border-slate-700"
            >
              {t}
            </motion.div>
          ))}
       </div>
    </div>
  );
};

export default function PoliceOnboardingTour({ isOpen, onClose }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to the Dashboard",
      desc: "This is your central command center for managing First Information Reports (FIRs). This guide will briefly show you how to manage status, review evidence, and organize cases.",
      icon: <LayoutGrid className="h-5 w-5" />,
      visual: <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">Police Portal v2.0</div>
    },
    {
      title: "Kanban Board & Status",
      desc: "Efficiently manage case lifecycles. Drag and drop FIR cards between columns (e.g., from 'Pending' to 'In Progress') to instantly update their status. The database updates automatically.",
      icon: <MousePointer2 className="h-5 w-5" />,
      visual: <DragDropSimulation /> 
    },
    {
      title: "Right-Click Context Menu",
      desc: "Right-click on any FIR card to access quick actions. You can Pin important cases to the top of your list or jump straight into Review Mode without opening the full details.",
      icon: <FileText className="h-5 w-5" />,
      visual: (
        <div className="relative w-full h-48 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
            <div className="bg-white p-4 rounded shadow-sm border border-slate-200 w-40">
                <div className="h-2 bg-slate-200 w-full mb-2"></div>
                <div className="h-2 bg-slate-200 w-2/3"></div>
            </div>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="absolute top-1/2 left-1/2 ml-4 bg-slate-800 text-white p-2 rounded shadow-xl text-xs w-32"
            >
                <div className="p-1 hover:bg-slate-700 rounded cursor-pointer">📌 Pin to Top</div>
                <div className="p-1 hover:bg-slate-700 rounded cursor-pointer">👁️ Review FIR</div>
            </motion.div>
        </div>
      )
    },
    {
      title: "Advanced Filtering",
      desc: "Use the filter bar to search by FIR ID, Complainant Name, or Date. You can also filter by Priority (Emergency, High) to focus on what matters most right now.",
      icon: <Search className="h-5 w-5" />,
      visual: <FilterSimulation />
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        >
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                Quick Guide
              </h2>
              <p className="text-xs text-slate-500 mt-1">4 steps to mastery</p>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto">
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all text-sm ${
                    currentStep === idx 
                      ? "bg-white shadow-sm ring-1 ring-indigo-200 text-indigo-700 font-medium" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                >
                  <div className={`shrink-0 ${currentStep === idx ? "text-indigo-600" : "text-slate-400"}`}>
                    {step.icon}
                  </div>
                  <span>{idx + 1}. {step.title.split(" ")[0]}...</span>
                  {currentStep > idx && <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-green-500" />}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
               <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Rules & Laws</div>
               <div className="bg-indigo-50 rounded p-3 text-xs text-indigo-800 leading-relaxed border border-indigo-100">
                  Always verify evidence before changing status to <strong>Approved</strong>.
               </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{steps[currentStep].title}</h1>
                <p className="text-slate-600 text-sm leading-relaxed max-w-lg">{steps[currentStep].desc}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>

            {/* Visual Box (Video Placeholder) */}
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center p-4 mb-6 relative overflow-hidden group">
              {steps[currentStep].visual}
              
              <div className="absolute bottom-3 right-3 flex gap-1">
                 <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                 <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse"></div>
                 <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === i ? "w-6 bg-indigo-600" : "w-1.5 bg-slate-200"}`} 
                  />
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handlePrev} 
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2 min-w-[100px]"
                >
                  {currentStep === steps.length - 1 ? "Finish" : "Next"}
                  {currentStep !== steps.length - 1 && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}