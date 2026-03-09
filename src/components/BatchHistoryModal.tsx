import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Clock, ChevronRight, FileText, CheckCircle2, Loader2, Hash, Calendar } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  total_words: number;
  created_at: string;
  approved?: number;
  pending?: number;
  processing?: number;
}

interface BatchHistoryModalProps {
  onClose: () => void;
  onSelectBatch: (batchId: string) => void;
}

export default function BatchHistoryModal({ onClose, onSelectBatch }: BatchHistoryModalProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches');
      const data = await res.json();
      setBatches(data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-3xl max-h-[80vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-900">查看历史</h3>
              <p className="text-xs text-slate-400">历史上传的词表批次记录</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm text-slate-400">正在加载历史记录...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                <FileText size={32} />
              </div>
              <p className="text-slate-400">暂无上传历史</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 表头 */}
              <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="col-span-4">批次名称</div>
                <div className="col-span-3">上传时间</div>
                <div className="col-span-2 text-center">单词数</div>
                <div className="col-span-2 text-center">状态</div>
                <div className="col-span-1" />
              </div>
              {batches.map((batch) => (
                <button
                  key={batch.id}
                  onClick={() => onSelectBatch(batch.id)}
                  className="w-full grid grid-cols-12 gap-3 items-center p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group"
                >
                  <div className="col-span-4 flex items-center gap-3 text-left min-w-0">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">{batch.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{batch.id}</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-left">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400 shrink-0" />
                      {formatDate(batch.created_at)}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">
                      <Hash size={11} />
                      {batch.total_words} 词
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg">
                      <CheckCircle2 size={11} />
                      已完成
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all inline-block" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
