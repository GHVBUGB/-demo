import { useState, ChangeEvent } from 'react';
import { FileUp, CheckCircle2, AlertCircle, ArrowRight, Loader2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BatchHistoryModal from '../components/BatchHistoryModal';

interface ImportPageProps {
  onStartProduction: (batchId: string) => void;
}

export default function ImportPage({ onStartProduction }: ImportPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [batchName, setBatchName] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      setPreviewData([
        { word: 'empathy', pos: 'n.', definition: '共情；同理心', source: '人教版九年级' },
        { word: 'kind', pos: 'adj.', definition: '友好的', source: '人教版七年级' },
        { word: 'kind', pos: 'n.', definition: '种类', source: '人教版八年级' },
        { word: 'good', pos: 'adj.', definition: '好的', source: '人教版三年级' },
        { word: 'PE', pos: 'n.', definition: '体育课', source: '人教版七年级' },
      ]);
    }
  };

  const handleStart = async () => {
    setIsUploading(true);
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        words: previewData,
        batchName: batchName || (file ? file.name.split('.')[0] : `批次 ${new Date().toLocaleString()}`)
      })
    });
    const data = await res.json();
    
    setTimeout(() => {
      setIsUploading(false);
      onStartProduction(data.batchId);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-[32px] p-12 border border-white text-center space-y-6 shadow-sm">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
          <FileUp size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">上传教材词表</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            支持 Excel 格式，系统将自动进行义项合并与五维内容生产。
          </p>
        </div>
        
        <div className="max-w-md mx-auto space-y-4">
          <label className="block w-full cursor-pointer">
            <input type="file" className="hidden" onChange={handleFileChange} accept=".xlsx,.xls,.csv" />
            <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 hover:border-blue-400 hover:bg-blue-50/50 transition-all">
              <span className="text-sm font-medium text-slate-400">
                {file ? file.name : '点击或拖拽文件至此'}
              </span>
            </div>
          </label>
          <input 
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="为本次生产批次命名 (可选)..."
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>

        <div className="flex items-center justify-center gap-4">
          <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
            <option>选择模型：Gemini Pro 1.5</option>
            <option>选择模型：GPT-4o</option>
            <option>选择模型：豆包-Pro</option>
          </select>
          <button 
            disabled={!file || isUploading}
            onClick={handleStart}
            className="bg-blue-600 text-white px-8 py-2 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:scale-95"
          >
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
            开始生产
          </button>
          <button 
            onClick={() => setShowHistory(true)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <History size={18} />
            导入历史
          </button>
        </div>
      </section>

      <AnimatePresence>
        {showHistory && (
          <BatchHistoryModal 
            onClose={() => setShowHistory(false)}
            onSelectBatch={(batchId) => {
              setShowHistory(false);
              onStartProduction(batchId);
            }}
          />
        )}
      </AnimatePresence>

      {previewData.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] border border-white overflow-hidden shadow-sm"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xl text-slate-900">上传预览 (前5条)</h3>
            <span className="text-sm text-slate-400">共检测到 {previewData.length} 条词项</span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">单词</th>
                <th className="px-6 py-4 font-semibold">词性</th>
                <th className="px-6 py-4 font-semibold">中文释义</th>
                <th className="px-6 py-4 font-semibold">教材来源</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewData.map((item, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{item.word}</td>
                  <td className="px-6 py-4 text-slate-500">{item.pos}</td>
                  <td className="px-6 py-4 text-slate-700">{item.definition}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-200">
                      {item.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.section>
      )}
    </div>
  );
}
