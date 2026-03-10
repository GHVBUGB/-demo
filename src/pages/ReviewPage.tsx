import { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Info,
  Clock,
  Eye,
  UserCog,
  X,
  Search,
  Save,
  ArrowLeft,
  History,
  Lightbulb,
  FileText,
  Filter,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockPendingWords, mockWords, mockBatches } from '../mockData';

export default function ReviewPage({ onBack }: { onBack: () => void }) {
  const [localWords, setLocalWords] = useState<any[]>(mockPendingWords);
  const [repairingId, setRepairingId] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'can_retry' | 'must_manual'>('all');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [jobProgress, setJobProgress] = useState<any>(null);
  const [jobResult, setJobResult] = useState<any>(null);
  const [showResultCard, setShowResultCard] = useState(false);
  const [repairHistory, setRepairHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const batchInfo = selectedBatchId ? mockBatches.find(b => b.id === selectedBatchId) : null;
  const isLoading = false;

  const words = useMemo(() => {
    return localWords.filter(w => {
      if (searchQuery && !w.word.includes(searchQuery) && !w.issue.includes(searchQuery)) return false;
      if (filterField && w.field !== filterField) return false;
      if (selectedBatchId) return false; // mock 数据不按批次过滤
      if (activeTab === 'can_retry' && w.repair_attempts >= 3) return false;
      if (activeTab === 'must_manual' && w.repair_attempts < 3) return false;
      return true;
    });
  }, [localWords, searchQuery, filterField, activeTab, selectedBatchId]);

  const counts = useMemo(() => ({
    total: localWords.length,
    can_retry: localWords.filter(w => w.repair_attempts < 3).length,
    must_manual: localWords.filter(w => w.repair_attempts >= 3).length,
  }), [localWords]);

  const dimensionStandards = [
    { group: '语音 Sound', items: [
      { value: 'ipa', label: '音标格式错误' },
    ]},
    { group: '语义 Meaning', items: [
      { value: 'definition', label: '释义描述不准确' },
      { value: 'pos', label: '词性标注错误' },
    ]},
    { group: '音节 Syllables', items: [
      { value: 'syllables', label: '音节切分错误' },
    ]},
    { group: '语境 Context', items: [
      { value: 'chunk', label: '语块与释义不匹配' },
      { value: 'sentence', label: '例句质量问题' },
      { value: 'sentence_length', label: '例句字数超标' },
      { value: 'sentence_contain', label: '例句未包含目标词' },
      { value: 'sentence_translation', label: '例句翻译缺失' },
    ]},
    { group: '助记 Mnemonic', items: [
      { value: 'mnemonic', label: '助记有效性不足' },
      { value: 'mnemonic_formula', label: '助记公式缺少中文标注' },
      { value: 'mnemonic_rhyme', label: '助记口诀超字数' },
    ]},
  ];

  const handleRepair = (wordId: number) => {
    setRepairingId(wordId);
    setTimeout(() => {
      const success = Math.random() > 0.4;
      if (success) {
        setLocalWords(prev => prev.filter(w => w.id !== wordId));
      } else {
        setLocalWords(prev => prev.map(w => w.id === wordId ? { ...w, repair_attempts: w.repair_attempts + 1, issue: w.repair_attempts + 1 >= 3 ? 'AI 修复已达上限 (3次)，请人工介入修改。' : w.issue } : w));
      }
      setRepairingId(null);
    }, 1200);
  };

  const handleRepairAll = () => {
    setIsRegenerating(true);
    setJobResult(null);
    setShowResultCard(false);
    const canRetry = localWords.filter(w => w.repair_attempts < 3);
    let completed = 0;
    const interval = setInterval(() => {
      completed++;
      setJobProgress({ total: canRetry.length, completed, succeeded: Math.floor(completed * 0.6), failed: completed - Math.floor(completed * 0.6), current_word: canRetry[completed - 1]?.word || '', current_dimension: '例句', done: completed >= canRetry.length });
      if (completed >= canRetry.length) {
        clearInterval(interval);
        const succeeded = Math.floor(canRetry.length * 0.6);
        const failed = canRetry.length - succeeded;
        setLocalWords(prev => {
          const toFix = new Set(canRetry.slice(0, succeeded).map(w => w.id));
          return prev.filter(w => !toFix.has(w.id));
        });
        setJobResult({ succeeded, failed, can_ai_retry: Math.floor(failed * 0.5), must_manual: Math.ceil(failed * 0.5) });
        setShowResultCard(true);
        setIsRegenerating(false);
        setRepairHistory(prev => [{ time: new Date().toLocaleTimeString(), succeeded, failed }, ...prev]);
      }
    }, 300);
  };

  const openDetail = (wordId: number) => {
    const full = mockWords.find(w => w.id === wordId);
    const pending = localWords.find(w => w.id === wordId);
    if (full) {
      setSelectedWord({ ...full, issues: pending ? [{ field: pending.field, issue: pending.issue, failed_step: pending.failed_step, retry_count: pending.issue_retry_count }] : [] });
    } else if (pending) {
      setSelectedWord({ id: pending.id, word: pending.word, syllables: '', ipa: '', grade_level: '', status: 'pending', meanings: [], mnemonic: null, issues: [{ field: pending.field, issue: pending.issue, failed_step: pending.failed_step, retry_count: pending.issue_retry_count }] });
    }
  };

  const handleSaveWord = async () => {
    if (!selectedWord) return;
    setIsSaving(true);
    try {
      // mock: 直接标记为已修复
      await new Promise(r => setTimeout(r, 800));
      setLocalWords(prev => prev.filter(w => w.id !== selectedWord.id));
      setSelectedWord(null);
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };


  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/30 rounded-xl transition-colors text-white/60 shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">质检修复</h2>
            <p className="text-sm text-white/70">{counts.total} 个异常项待处理</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* 搜索框 */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索单词..."
              className="w-48 pl-9 pr-3 py-2 bg-white/95 backdrop-blur-sm rounded-xl text-sm border border-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200/50 placeholder:text-slate-400"
            />
          </div>

          {/* 错误类型筛选 */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all border shadow-sm ${
                filterField 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' 
                  : 'bg-white/95 backdrop-blur-sm border-white/80 text-slate-500 hover:text-slate-700'
              }`}
            >
              <Filter size={13} />
              <span className="max-w-[100px] truncate">
                {filterField 
                  ? dimensionStandards.flatMap(g => g.items).find(i => i.value === filterField)?.label
                  : '错误类型'
                }
              </span>
              {filterField ? (
                <span
                  onClick={(e) => { e.stopPropagation(); setFilterField(''); setIsFilterOpen(false); }}
                  className="p-0.5 rounded hover:bg-blue-200/50 transition-colors"
                >
                  <X size={11} />
                </span>
              ) : (
                <ChevronDown size={12} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                  <div className="max-h-80 overflow-y-auto py-2">
                    <button
                      onClick={() => { setFilterField(''); setIsFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        !filterField ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      全部错误类型
                    </button>
                    {dimensionStandards.map((group) => (
                      <div key={group.group}>
                        <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {group.group}
                        </div>
                        {group.items.map((item) => (
                          <button
                            key={item.value}
                            onClick={() => { setFilterField(item.value); setIsFilterOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                              filterField === item.value 
                                ? 'bg-blue-50 text-blue-700 font-medium' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* AI 修复按钮 */}
          <button 
            onClick={handleRepairAll}
            disabled={isRegenerating || counts.can_retry === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-40 shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 active:scale-95"
          >
            {isRegenerating ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            AI 修复 ({counts.can_retry})
          </button>
        </div>
      </div>

      {selectedBatchId && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-200">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-blue-600" />
            <span className="text-sm font-medium">当前查看批次：<span className="font-bold">{selectedBatchId}</span></span>
            {batchInfo && (
              <span className="text-xs text-slate-400 ml-2">
                (总计 {batchInfo.total_words} 词)
              </span>
            )}
          </div>
          <button 
            onClick={() => setSelectedBatchId(null)}
            className="text-xs text-rose-600 font-bold hover:underline"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* Repair Progress */}
      <AnimatePresence>
        {isRegenerating && jobProgress && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[32px] border border-blue-200 p-8 shadow-xl shadow-blue-100/50 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Loader2 className="animate-spin" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">【修复中】</h3>
                  <p className="text-sm text-slate-400">正在优化内容质量...</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-blue-600">{Math.round((jobProgress.completed / jobProgress.total) * 100)}%</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest">{jobProgress.completed} / {jobProgress.total}</p>
              </div>
            </div>

            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                animate={{ width: `${(jobProgress.completed / jobProgress.total) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">当前处理</p>
                <p className="font-bold text-blue-600">{jobProgress.current_word} - {jobProgress.current_dimension}</p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                <p className="text-[10px] font-bold text-emerald-600/60 uppercase mb-1">已成功</p>
                <p className="font-bold text-emerald-600">{jobProgress.succeeded}</p>
              </div>
              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                <p className="text-[10px] font-bold text-rose-600/60 uppercase mb-1">已失败</p>
                <p className="font-bold text-rose-600">{jobProgress.failed}</p>
              </div>
              <div className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100/50">
                <p className="text-[10px] font-bold text-yellow-600/60 uppercase mb-1">预计剩余</p>
                <p className="font-bold text-yellow-600">{Math.ceil((jobProgress.total - jobProgress.completed) * 0.5)} 秒</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {showResultCard && jobResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-200 rounded-[32px] p-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle2 size={24} />
                <h3 className="text-xl font-bold">修复完成</h3>
              </div>
              <button 
                onClick={() => setShowResultCard(false)}
                className="text-emerald-700/40 hover:text-emerald-700 flex items-center gap-1 text-sm font-bold"
              >
                折叠 <ChevronUp size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-emerald-200/50">
                  <span className="text-sm font-medium text-emerald-800">成功修复（已自动入库）</span>
                  <span className="text-xl font-black text-emerald-600">{jobResult.succeeded} 个</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-rose-200/50">
                  <span className="text-sm font-medium text-rose-800">仍需处理</span>
                  <span className="text-xl font-black text-rose-600">{jobResult.failed} 个</span>
                </div>
              </div>
              <div className="p-6 bg-emerald-600/5 rounded-2xl border border-emerald-600/10 flex gap-4">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0">
                  <Lightbulb size={20} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-emerald-900">建议</p>
                  <p className="text-sm text-emerald-800/70 leading-relaxed">
                    {jobResult.failed} 个失败项中，{jobResult.must_manual} 个已达上限，建议人工修改。其余 {jobResult.can_ai_retry} 个可尝试再次 AI 修复。
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Section */}
      <div className="bg-white rounded-2xl border border-white overflow-hidden shadow-sm">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-500">
            <History size={18} />
            <span className="text-sm font-bold">修复历史</span>
          </div>
          {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="px-6 pb-4 space-y-2"
            >
              {repairHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400">{h.time}</span>
                  <div className="flex gap-4">
                    <span className="text-emerald-600 font-bold">成功: {h.succeeded}</span>
                    <span className="text-rose-600 font-bold">失败: {h.failed}</span>
                  </div>
                </div>
              ))}
              {repairHistory.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400 italic">暂无历史记录</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-[32px] w-fit shadow-sm border border-white">
        {[
          { id: 'all', label: '全部', count: counts.total },
          { id: 'can_retry', label: '可 AI 修复', count: counts.can_retry },
          { id: 'must_manual', label: '已达上限', count: counts.must_manual },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2 rounded-2xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label} {tab.count}
          </button>
        ))}
      </div>

      {/* Word List */}
      <div className="space-y-8">
        {(() => {
          const filtered = filterField 
            ? words.filter(w => w.field === filterField) 
            : words;
          const canRetry = filtered.filter(w => w.repair_attempts < 3);
          const mustManual = filtered.filter(w => w.repair_attempts >= 3);

          return (
            <>
              {(activeTab === 'all' || activeTab === 'can_retry') && canRetry.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
                    待修复（可 AI 修复）（{canRetry.length} 个）
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {canRetry.map((word) => (
                      <WordCard 
                        key={word.id} 
                        word={word} 
                        repairingId={repairingId} 
                        isRegenerating={isRegenerating}
                        onRepair={handleRepair} 
                        onEdit={openDetail} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'must_manual') && mustManual.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-rose-300 uppercase tracking-widest flex items-center gap-2">
                    已达上限（必须人工修改）（{mustManual.length} 个）
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {mustManual.map((word) => (
                      <WordCard 
                        key={word.id} 
                        word={word} 
                        repairingId={repairingId} 
                        isRegenerating={isRegenerating}
                        onRepair={handleRepair} 
                        onEdit={openDetail} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {filtered.length === 0 && !isLoading && (
                <div className="text-center py-20 space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {filterField ? '该类型下暂无待修复项' : '暂无待修复项'}
                  </h3>
                  <p className="text-white/60">
                    {filterField ? '尝试切换其他错误类型查看' : '所有单词已通过质检并入库。'}
                  </p>
                  {filterField && (
                    <button 
                      onClick={() => setFilterField('')}
                      className="px-4 py-2 bg-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-all"
                    >
                      清除筛选
                    </button>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedWord && (
          <DetailModal 
            word={selectedWord} 
            isSaving={isSaving} 
            onClose={() => setSelectedWord(null)} 
            onSave={handleSaveWord} 
            setWord={setSelectedWord}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

function WordCard({ word, repairingId, isRegenerating, onRepair, onEdit }: any) {
  const fieldNames: Record<string, string> = {
    'sentence': '例句',
    'mnemonic': '助记',
    'chunk': '语块',
    'definition': '释义'
  };

  return (
    <motion.div 
      layout
      className={`bg-white rounded-[24px] border p-5 space-y-4 transition-all module-hover ${
        repairingId === word.id ? 'border-blue-400 shadow-md ring-1 ring-blue-200' : 'border-white shadow-sm hover:border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">{word.word}</h3>
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tight flex items-center gap-1">
            <AlertCircle size={10} />
            {fieldNames[word.field] || word.field || '内容'} - {word.issue_retry_count > 0 ? '修复失败' : '质检异常'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-bold ${word.repair_attempts >= 3 ? 'text-rose-600' : 'text-slate-400'}`}>
            retry_count: {word.repair_attempts}/3 {word.repair_attempts >= 3 && '已达上限'}
          </span>
        </div>
      </div>

      <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/50">
        <p className="text-xs text-rose-700/80 leading-relaxed line-clamp-2" title={word.issue}>
          {word.issue}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase">当前内容预览</p>
        <p className="text-xs text-slate-500 line-clamp-2 italic">
          {word.problematic_content || '暂无预览内容'}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        {word.repair_attempts >= 3 ? (
          <button 
            onClick={() => onEdit(word.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
          >
            <UserCog size={14} />
            人工修改
          </button>
        ) : (
          <>
            <button 
              onClick={() => onRepair(word.id)}
              disabled={repairingId === word.id || isRegenerating}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm shadow-blue-200"
            >
              {repairingId === word.id ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  修复中...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  AI 修复
                </>
              )}
            </button>
            <button 
              onClick={() => onEdit(word.id)}
              className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              人工修改
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function DetailModal({ word, isSaving, onClose, onSave, setWord }: any) {
  const getFieldError = (field: string) => {
    return word.issues?.find((i: any) => i.field === field)?.issue;
  };

  const isEmpty = (val: any) => !val || (typeof val === 'string' && val.trim() === '');

  const fieldWrap = (field: string, children: React.ReactNode) => {
    const err = getFieldError(field);
    const hasError = !!err;
    return (
      <div className={`relative rounded-xl p-3 transition-all ${hasError ? 'bg-rose-50 border-2 border-rose-300 ring-1 ring-rose-200' : 'bg-white/50'}`}>
        {hasError && (
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <AlertCircle size={12} className="text-rose-500 shrink-0" />
            <span className="text-[10px] font-bold text-rose-600">{err}</span>
          </div>
        )}
        {children}
      </div>
    );
  };

  const issueCount = word.issues?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <input 
                className="text-4xl font-black bg-transparent border-none focus:ring-0 p-0 w-full text-slate-900"
                value={word.word}
                onChange={(e) => setWord({...word, word: e.target.value})}
              />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    className={`text-sm font-mono bg-transparent border-b focus:border-blue-400 focus:ring-0 p-0 w-32 ${isEmpty(word.ipa) ? 'border-rose-300 placeholder:text-rose-300' : 'border-transparent text-slate-500'}`}
                    placeholder="音标（缺失）"
                    value={word.ipa || ''}
                    onChange={(e) => setWord({...word, ipa: e.target.value})}
                  />
                  <span className="text-slate-200">/</span>
                  <input 
                    className={`text-sm font-mono bg-transparent border-b focus:border-blue-400 focus:ring-0 p-0 w-32 ${isEmpty(word.syllables) ? 'border-rose-300 placeholder:text-rose-300' : 'border-transparent text-slate-500'}`}
                    placeholder="音节（缺失）"
                    value={word.syllables || ''}
                    onChange={(e) => setWord({...word, syllables: e.target.value})}
                  />
                </div>
                {issueCount > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg">
                    <AlertCircle size={11} />
                    {issueCount} 项异常
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Meanings */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">义项与语境</h4>
            {word.meanings?.map((m: any, idx: number) => (
              <div key={m.id} className="p-5 bg-slate-50 rounded-[20px] border border-slate-100 space-y-4">
                {/* 词性 + 释义 */}
                {fieldWrap('definition', (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">词性 / 释义</p>
                    <div className="flex items-center gap-2">
                      <input 
                        className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded uppercase w-12 text-center shrink-0"
                        value={m.pos}
                        onChange={(e) => {
                          const newMeanings = [...word.meanings];
                          newMeanings[idx].pos = e.target.value;
                          setWord({...word, meanings: newMeanings});
                        }}
                      />
                      <input 
                        className={`font-medium text-lg bg-transparent border-b focus:border-blue-400 focus:ring-0 w-full ${isEmpty(m.definition) ? 'border-rose-300 placeholder:text-rose-400' : 'border-transparent'} ${getFieldError('definition') ? 'text-rose-700' : ''}`}
                        placeholder="释义为空，请填写"
                        value={m.definition}
                        onChange={(e) => {
                          const newMeanings = [...word.meanings];
                          newMeanings[idx].definition = e.target.value;
                          setWord({...word, meanings: newMeanings});
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 语块 */}
                  {fieldWrap('chunk', (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">核心语块</p>
                      <input 
                        className={`font-bold text-lg bg-transparent border-b focus:border-blue-400 focus:ring-0 w-full ${isEmpty(m.chunk) ? 'border-rose-300 text-rose-400 placeholder:text-rose-400' : 'border-transparent text-blue-600'} ${getFieldError('chunk') ? 'text-rose-700' : ''}`}
                        placeholder="语块为空，请填写"
                        value={m.chunk || ''}
                        onChange={(e) => {
                          const newMeanings = [...word.meanings];
                          newMeanings[idx].chunk = e.target.value;
                          setWord({...word, meanings: newMeanings});
                        }}
                      />
                    </div>
                  ))}

                  {/* 来源 */}
                  <div className="rounded-xl p-3 bg-white/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">教材来源</p>
                    <p className={`text-xs italic ${isEmpty(m.sources?.join('')) ? 'text-rose-400' : 'text-slate-500'}`}>
                      {m.sources?.join('; ') || '⚠ 暂无来源'}
                    </p>
                  </div>
                </div>

                {/* 例句 */}
                {fieldWrap('sentence', (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">例句</p>
                    <textarea 
                      className={`italic text-lg leading-relaxed bg-transparent border-b focus:border-blue-400 focus:ring-0 w-full resize-none ${isEmpty(m.sentence) ? 'border-rose-300 placeholder:text-rose-400' : 'border-transparent'} ${getFieldError('sentence') ? 'text-rose-700' : ''}`}
                      placeholder="例句为空，请填写"
                      value={m.sentence || ''}
                      rows={2}
                      onChange={(e) => {
                        const newMeanings = [...word.meanings];
                        newMeanings[idx].sentence = e.target.value;
                        setWord({...word, meanings: newMeanings});
                      }}
                    />
                    <input 
                      className={`text-sm bg-transparent border-b focus:border-blue-400 focus:ring-0 w-full ${isEmpty(m.sentence_cn) ? 'border-rose-300 text-rose-400 placeholder:text-rose-400' : 'border-transparent text-slate-500'}`}
                      placeholder="中文翻译为空"
                      value={m.sentence_cn || ''}
                      onChange={(e) => {
                        const newMeanings = [...word.meanings];
                        newMeanings[idx].sentence_cn = e.target.value;
                        setWord({...word, meanings: newMeanings});
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Mnemonic */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">助记系统</h4>
            {word.mnemonic ? (
              <div className={`p-6 rounded-[20px] grid grid-cols-1 lg:grid-cols-2 gap-6 ${getFieldError('mnemonic') ? 'bg-rose-50/70 border-2 border-rose-300 ring-1 ring-rose-200' : 'bg-blue-50/50 border border-blue-100'}`}>
                <div className="space-y-4">
                  {getFieldError('mnemonic') && (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-rose-100 rounded-lg w-fit">
                      <AlertCircle size={12} className="text-rose-500" />
                      <span className="text-[10px] font-bold text-rose-600">{getFieldError('mnemonic')}</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input 
                        className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-20 text-center shrink-0"
                        value={word.mnemonic.type}
                        onChange={(e) => setWord({...word, mnemonic: {...word.mnemonic, type: e.target.value}})}
                      />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">助记公式</p>
                    </div>
                    <textarea 
                      className={`text-xl font-black bg-transparent border-b focus:border-blue-400 focus:ring-0 w-full resize-none ${isEmpty(word.mnemonic.formula) ? 'border-rose-300 placeholder:text-rose-400' : 'border-transparent'} ${getFieldError('mnemonic') ? 'text-rose-700' : ''}`}
                      placeholder="助记公式为空，请填写"
                      value={word.mnemonic.formula || ''}
                      rows={2}
                      onChange={(e) => setWord({...word, mnemonic: {...word.mnemonic, formula: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">助记口诀</p>
                    <input 
                      className={`text-lg font-medium bg-transparent border-b focus:border-blue-400 focus:ring-0 w-full ${isEmpty(word.mnemonic.rhyme) ? 'border-rose-300 text-rose-400 placeholder:text-rose-400' : 'border-transparent text-blue-600'} ${getFieldError('mnemonic') ? 'text-rose-700' : ''}`}
                      placeholder="口诀为空"
                      value={word.mnemonic.rhyme || ''}
                      onChange={(e) => setWord({...word, mnemonic: {...word.mnemonic, rhyme: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">老师话术</p>
                  <textarea 
                    className={`text-sm leading-relaxed italic bg-transparent border-none focus:ring-0 w-full resize-none ${isEmpty(word.mnemonic.teacher_script) ? 'text-rose-400 placeholder:text-rose-400' : 'text-slate-500'}`}
                    placeholder="老师话术为空"
                    value={word.mnemonic.teacher_script || ''}
                    rows={4}
                    onChange={(e) => setWord({...word, mnemonic: {...word.mnemonic, teacher_script: e.target.value}})}
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 bg-rose-50 rounded-[20px] border-2 border-dashed border-rose-300 text-center space-y-2">
                <AlertCircle size={24} className="text-rose-400 mx-auto" />
                <p className="text-sm font-bold text-rose-600">该词项缺少助记内容</p>
                <p className="text-xs text-rose-400">请手动添加助记公式和口诀</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {issueCount > 0 ? (
              <span className="flex items-center gap-1 text-rose-500 font-bold">
                <AlertCircle size={14} />
                {issueCount} 项需要修复，红色标注区域需要修改
              </span>
            ) : (
              <span className="flex items-center gap-1"><Info size={14} /> 修改后点击保存即可入库</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={onSave}
              disabled={isSaving}
              className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-95"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              保存并入库
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
