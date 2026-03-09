import { useState, useEffect } from 'react';
import { LayoutDashboard, CheckCircle2, AlertCircle, Clock, Activity, TrendingUp, PieChart, Loader2, ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardPageProps {
  onViewBatch: (batchId: string, view: 'monitoring' | 'review') => void;
}

export default function DashboardPage({ onViewBatch }: DashboardPageProps) {
  const [data, setData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeDim, setActiveDim] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(res => res.json()),
      fetch('/api/batches').then(res => res.json())
    ]).then(([stats, batches]) => {
      setData(stats);
      setBatches(batches);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-white" size={48} /></div>;

  const stats = [
    { label: '总词数', value: data.total.toLocaleString(), icon: LayoutDashboard, iconBg: 'bg-blue-50 text-blue-600', valueColor: 'text-blue-700' },
    { label: '已入库', value: data.approved.toLocaleString(), icon: CheckCircle2, iconBg: 'bg-emerald-50 text-emerald-600', valueColor: 'text-emerald-700' },
    { label: '待处理', value: data.pending.toLocaleString(), icon: AlertCircle, iconBg: 'bg-rose-50 text-rose-600', valueColor: 'text-rose-700' },
    { label: '整体合格率', value: `${((data.approved / data.total) * 100).toFixed(1)}%`, icon: TrendingUp, iconBg: 'bg-yellow-50 text-yellow-600', valueColor: 'text-yellow-700' },
  ];

  const dimensionMapping: Record<string, string> = {
    ipa: '语音 Sound',
    ipa_format: '语音 Sound',
    definition: '语义 Meaning',
    pos: '语义 Meaning',
    duplicate_meaning: '语义 Meaning',
    syllables: '音节 Syllables',
    chunk: '语境 Context',
    chunk_length: '语境 Context',
    sentence: '语境 Context',
    sentence_length: '语境 Context',
    sentence_contain: '语境 Context',
    sentence_translation: '语境 Context',
    mnemonic: '助记 Mnemonic',
    mnemonic_empty: '助记 Mnemonic',
    mnemonic_formula: '助记 Mnemonic',
    mnemonic_rhyme: '助记 Mnemonic',
  };

  const fieldLabels: Record<string, string> = {
    ipa: '音标格式错误（非 /.../ 格式）',
    ipa_format: '音标与音节分隔不一致',
    definition: '释义描述不准确',
    pos: '词性标注错误',
    duplicate_meaning: '重复义项（同释义文本）',
    syllables: '音节切分逻辑错误',
    chunk: '语块与释义不匹配',
    chunk_length: '语块长度不在 2-5 词',
    sentence: '例句语法或语义问题',
    sentence_length: '例句字数不在 5-18 词',
    sentence_contain: '例句未包含目标词',
    sentence_translation: '例句翻译缺失或不匹配',
    mnemonic: '助记有效性不足',
    mnemonic_empty: '助记内容缺失',
    mnemonic_formula: '助记公式缺少中文标注',
    mnemonic_rhyme: '助记口诀超出字数限制',
  };

  const dimensionColors: Record<string, { bar: string; bg: string; text: string }> = {
    '语音 Sound': { bar: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-600' },
    '语义 Meaning': { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    '音节 Syllables': { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
    '语境 Context': { bar: 'bg-blue-600', bg: 'bg-blue-50', text: 'text-blue-700' },
    '助记 Mnemonic': { bar: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  };

  const allDimensions = [
    '语音 Sound', '语义 Meaning', '音节 Syllables', '语境 Context', '助记 Mnemonic'
  ];

  const dimensionAtomicStandards: Record<string, string[]> = {
    '语音 Sound': ['ipa', 'ipa_format'],
    '语义 Meaning': ['definition', 'pos', 'duplicate_meaning'],
    '音节 Syllables': ['syllables'],
    '语境 Context': ['chunk', 'chunk_length', 'sentence', 'sentence_length', 'sentence_contain', 'sentence_translation'],
    '助记 Mnemonic': ['mnemonic', 'mnemonic_empty', 'mnemonic_formula', 'mnemonic_rhyme'],
  };

  const dimensionData = data.issues.reduce((acc: any, issue: any) => {
    const dim = dimensionMapping[issue.field] || '其他';
    if (!acc[dim]) acc[dim] = { label: dim, value: 0, fields: [] };
    acc[dim].value += issue.count;
    acc[dim].fields.push({
      field: issue.field,
      label: fieldLabels[issue.field] || issue.field,
      count: issue.count
    });
    return acc;
  }, {});

  const badCases = allDimensions.map(dim => {
    const existing = dimensionData[dim];
    const allFields = (dimensionAtomicStandards[dim] || []).map(fieldKey => {
      const found = existing?.fields?.find((f: any) => f.field === fieldKey);
      return {
        field: fieldKey,
        label: fieldLabels[fieldKey] || fieldKey,
        count: found ? found.count : 0
      };
    });
    return {
      label: dim,
      value: existing?.value || 0,
      fields: allFields,
      color: dimensionColors[dim]?.bar || 'bg-blue-400',
      colors: dimensionColors[dim] || dimensionColors['语音 Sound'],
    };
  });

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[32px] shadow-sm border border-white space-y-4 module-hover relative overflow-hidden group"
          >
            <div className="absolute inset-0 card-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.iconBg}`}>
                  <stat.icon size={24} />
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-blue-600 hover:text-white transition-all text-slate-400">
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <h3 className={`text-4xl font-black tracking-tight ${stat.valueColor}`}>{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Batch History + Bad Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-white space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              批次生产历史
            </h3>
          </div>
          <div className="space-y-4">
            {batches.map((batch) => (
              <div 
                key={batch.id} 
                onClick={() => onViewBatch(batch.id, 'monitoring')}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm group-hover:text-blue-600 transition-colors">{batch.name}</h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{new Date(batch.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-bold">{batch.total_words}</p>
                    <p className="text-[10px] text-slate-400 uppercase">总词数</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onViewBatch(batch.id, 'review'); }}
                      className="px-3 py-1 bg-white rounded-lg border border-slate-100 text-[10px] font-bold text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all"
                    >
                      质检
                    </button>
                    <button className="p-2 bg-white rounded-lg border border-slate-100 text-slate-300 group-hover:text-blue-600 transition-colors">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {batches.length === 0 && (
              <div className="text-center py-10 text-slate-400 italic text-sm">
                暂无生产批次记录
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-[32px] shadow-sm border border-white overflow-hidden relative" style={{ minHeight: 420 }}>
          <AnimatePresence mode="wait">
            {!activeDim ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-8 space-y-5"
              >
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <PieChart size={20} className="text-blue-600" />
                  Bad Case 分类
                </h3>
                <div className="space-y-3">
                  {badCases.map((item: any, i) => {
                    const maxValue = Math.max(...badCases.map((b: any) => b.value), 1);
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveDim(item)}
                        className="w-full p-3 flex items-center gap-3 rounded-2xl hover:bg-slate-50 transition-all group text-left"
                      >
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
                            <span className="text-sm font-black text-slate-900">{item.value}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.value / maxValue) * 100}%` }}
                              transition={{ delay: i * 0.1 + 0.5, duration: 0.8 }}
                              className={`h-full rounded-full ${item.color}`}
                            />
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 shrink-0 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Detail header */}
                <div className={`px-6 py-5 flex items-center gap-3 ${activeDim.colors.bg}`}>
                  <button
                    onClick={() => setActiveDim(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/60 transition-colors text-slate-500"
                  >
                    <ArrowRight className="rotate-180" size={16} />
                  </button>
                  <div className={`w-3 h-3 rounded-full ${activeDim.color}`} />
                  <div className="flex-1">
                    <h3 className={`text-sm font-bold ${activeDim.colors.text}`}>{activeDim.label}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">原子标准明细</p>
                  </div>
                  <span className={`text-2xl font-black ${activeDim.colors.text}`}>{activeDim.value}</span>
                </div>

                {/* Atomic standards list */}
                <div className="flex-1 p-5 space-y-2 overflow-y-auto">
                  {activeDim.fields.map((field: any, j: number) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: j * 0.04 }}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-1.5 h-6 rounded-full shrink-0 ${field.count > 0 ? activeDim.color : 'bg-slate-200'}`} />
                        <div className="min-w-0">
                          <p className={`text-xs leading-snug ${field.count > 0 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                            {field.label}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{field.field}</p>
                        </div>
                      </div>
                      <div className={`text-right shrink-0 ml-3 px-2.5 py-1 rounded-lg ${
                        field.count > 0 ? `${activeDim.colors.bg} ${activeDim.colors.text}` : 'bg-slate-100 text-slate-300'
                      }`}>
                        <span className="text-sm font-black">{field.count}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Back button */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => setActiveDim(null)}
                    className="w-full py-3 bg-slate-50 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="rotate-180" size={14} />
                    返回维度总览
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
