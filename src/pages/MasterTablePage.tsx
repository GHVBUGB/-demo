import { useState, useMemo } from 'react';
import { Search, Download, MoreHorizontal, History, ChevronDown, ChevronLeft, ChevronRight, X, FileJson, FileCode, FileText, BookOpen, Volume2, Lightbulb, GraduationCap, Layers, Loader2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BatchHistoryModal from '../components/BatchHistoryModal';
import { mockWords, mockBatches } from '../mockData';

const PAGE_SIZE = 20;

const textbookSources = [
  '人教版三年级英语上册(PEP)',
  '人教版三年级英语下册(PEP)',
  '人教版四年级英语上册(PEP)',
  '人教版四年级英语下册(PEP)',
  '人教版七年级英语上册（衔接小学）',
  '人教版七年级英语下册',
  '人教版八年级英语上册',
  '人教版八年级英语下册',
  '人教版九年级英语全一册',
  '人教版教材',
];

export default function MasterTablePage() {
  const [page, setPage] = useState(1);
  const [filterLetter, setFilterLetter] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [detailWord, setDetailWord] = useState<any>(null);

  const openWordDetail = (wordId: number) => {
    const found = mockWords.find(w => w.id === wordId) || null;
    setDetailWord(found);
  };

  const closeDetail = () => setDetailWord(null);

  const filteredWords = useMemo(() => {
    return mockWords.filter(w => {
      if (filterLetter && !w.word.toLowerCase().startsWith(filterLetter.toLowerCase())) return false;
      if (filterSource && !w.meanings.some((m: any) => m.sources?.includes(filterSource))) return false;
      if (selectedBatchId && w.batch_id !== selectedBatchId) return false;
      return true;
    });
  }, [filterLetter, filterSource, selectedBatchId]);

  const total = filteredWords.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const words = filteredWords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isLoading = false;
  const batchInfo = selectedBatchId ? mockBatches.find(b => b.id === selectedBatchId) : null;

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          {/* 搜索 */}
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={filterLetter}
              onChange={(e) => setFilterLetter(e.target.value)}
              placeholder="搜索单词..." 
              className="w-full pl-9 pr-3 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl text-sm border border-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200/50 placeholder:text-slate-400"
            />
          </div>

          {/* 教材筛选 */}
          <div className="relative">
            <button
              onClick={() => setIsSourceOpen(!isSourceOpen)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm transition-all border shadow-sm ${
                filterSource 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' 
                  : 'bg-white/95 backdrop-blur-sm border-white/80 text-slate-500 hover:text-slate-700'
              }`}
            >
              <Filter size={13} />
              <span className="max-w-[120px] truncate">{filterSource || '教材来源'}</span>
              {filterSource ? (
                <span onClick={(e) => { e.stopPropagation(); setFilterSource(''); setIsSourceOpen(false); }} className="p-0.5 rounded hover:bg-blue-200/50">
                  <X size={11} />
                </span>
              ) : (
                <ChevronDown size={12} className={`transition-transform ${isSourceOpen ? 'rotate-180' : ''}`} />
              )}
            </button>
            {isSourceOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSourceOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                  <div className="max-h-80 overflow-y-auto py-2">
                    <button onClick={() => { setFilterSource(''); setIsSourceOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${!filterSource ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>全部教材</button>
                    {textbookSources.map((src) => (
                      <button key={src} onClick={() => { setFilterSource(src); setIsSourceOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterSource === src ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>{src}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 查看历史 */}
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 px-3 py-2.5 bg-white/95 backdrop-blur-sm border border-white/80 rounded-xl text-sm text-slate-500 hover:text-slate-700 shadow-sm transition-colors">
            <History size={14} />
            历史
          </button>
        </div>

        {/* 右侧：分页信息 + 导出 */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-white/70">{total} 条记录</span>
          
          <div className="relative">
            <button onClick={() => setIsExportOpen(!isExportOpen)} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all">
              <Download size={14} />
              导出
              <ChevronDown size={11} className={`transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            {isExportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsExportOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-1.5">
                  <button onClick={() => { setIsExportOpen(false); alert('导出成功！vocabularyData.json'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 transition-colors">
                    <FileJson size={15} className="text-blue-500" />JSON
                  </button>
                  <button onClick={() => { setIsExportOpen(false); alert('导出成功！vocabularyData.js'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 transition-colors">
                    <FileCode size={15} className="text-slate-500" />JavaScript
                  </button>
                  <button onClick={() => { setIsExportOpen(false); alert('导出成功！vocabularyData.xlsx'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 transition-colors">
                    <FileText size={15} className="text-emerald-500" />Excel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedBatchId && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <FileText size={16} className="text-blue-600" />
            <span className="text-sm font-medium">批次：<span className="font-bold">{selectedBatchId}</span></span>
            {batchInfo && <span className="text-xs text-slate-400">(共 {batchInfo.total} 词)</span>}
          </div>
          <button onClick={() => setSelectedBatchId(null)} className="text-xs text-rose-600 font-bold hover:underline">清除</button>
        </div>
      )}

      {/* 表格 */}
      <div className="bg-white rounded-2xl border border-white overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm">加载中...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1600px]">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-semibold sticky left-0 bg-slate-50 z-10">单词</th>
                  <th className="px-5 py-3 font-semibold">音标</th>
                  <th className="px-5 py-3 font-semibold">音节</th>
                  <th className="px-5 py-3 font-semibold">学段</th>
                  <th className="px-5 py-3 font-semibold">词性/释义</th>
                  <th className="px-5 py-3 font-semibold">教材来源</th>
                  <th className="px-5 py-3 font-semibold">核心语块</th>
                  <th className="px-5 py-3 font-semibold">例句</th>
                  <th className="px-5 py-3 font-semibold">例句翻译</th>
                  <th className="px-5 py-3 font-semibold">助记公式</th>
                  <th className="px-5 py-3 font-semibold">助记口诀</th>
                  <th className="px-5 py-3 font-semibold">创建时间</th>
                  <th className="px-5 py-3 font-semibold sticky right-0 bg-slate-50 z-10">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {words.map((word, i) => {
                  const meanings = word.meanings || [];
                  const rowCount = Math.max(meanings.length, 1);
                  return meanings.length > 0 ? meanings.map((m: any, mi: number) => (
                    <tr key={`${word.id}-${mi}`} className={`hover:bg-blue-50/30 transition-colors group ${mi > 0 ? 'border-t border-dashed border-slate-100' : ''}`}>
                      {mi === 0 && (
                        <>
                          <td rowSpan={rowCount} className="px-5 py-3 sticky left-0 bg-white group-hover:bg-blue-50/30 transition-colors z-10 align-top border-r border-slate-50">
                            <button onClick={() => openWordDetail(word.id)} className="font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer text-left">{word.word}</button>
                            {rowCount > 1 && <span className="block text-[9px] text-slate-400 mt-0.5">{rowCount} 个义项</span>}
                          </td>
                          <td rowSpan={rowCount} className="px-5 py-3 font-mono text-xs text-slate-400 align-top">{word.ipa}</td>
                          <td rowSpan={rowCount} className="px-5 py-3 text-xs text-slate-500 align-top">{word.syllables}</td>
                          <td rowSpan={rowCount} className="px-5 py-3 align-top">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-200 whitespace-nowrap">{word.grade_level}</span>
                          </td>
                        </>
                      )}
                      <td className="px-5 py-2">
                        <div className="flex flex-col gap-0.5 min-w-[100px]">
                          <span className="text-[10px] font-bold text-blue-600 uppercase">{m.pos}</span>
                          <span className="text-xs text-slate-700 line-clamp-1">{m.definition}</span>
                        </div>
                      </td>
                      <td className="px-5 py-2"><span className="text-xs text-slate-400 line-clamp-1 max-w-[130px]">{m.sources}</span></td>
                      <td className="px-5 py-2"><span className="text-xs text-slate-500 italic line-clamp-1 max-w-[130px]">{m.chunk}</span></td>
                      <td className="px-5 py-2"><span className="text-xs text-slate-400 line-clamp-1 max-w-[180px]">{m.sentence}</span></td>
                      <td className="px-5 py-2"><span className="text-xs text-slate-400 line-clamp-1 max-w-[180px]">{m.sentence_cn}</span></td>
                      {mi === 0 && (
                        <>
                          <td rowSpan={rowCount} className="px-5 py-3 align-top"><span className="text-xs font-mono text-blue-600 line-clamp-2 max-w-[130px]">{word.mnemonic_formula}</span></td>
                          <td rowSpan={rowCount} className="px-5 py-3 align-top"><span className="text-xs text-slate-500 line-clamp-2 max-w-[130px]">{word.mnemonic_rhyme}</span></td>
                          <td rowSpan={rowCount} className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap align-top">{new Date(word.created_at).toLocaleDateString()}</td>
                          <td rowSpan={rowCount} className="px-5 py-3 sticky right-0 bg-white group-hover:bg-blue-50/30 transition-colors z-10 align-top">
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal size={16} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  )) : (
                    <tr key={word.id || i} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-5 py-3 sticky left-0 bg-white group-hover:bg-blue-50/30 transition-colors z-10">
                        <button onClick={() => openWordDetail(word.id)} className="font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer text-left">{word.word}</button>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">{word.ipa}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{word.syllables}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-200 whitespace-nowrap">{word.grade_level}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-300 italic" colSpan={5}>暂无义项数据</td>
                      <td className="px-5 py-3"><span className="text-xs font-mono text-blue-600 line-clamp-1 max-w-[130px]">{word.mnemonic_formula}</span></td>
                      <td className="px-5 py-3"><span className="text-xs text-slate-500 line-clamp-1 max-w-[130px]">{word.mnemonic_rhyme}</span></td>
                      <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(word.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3 sticky right-0 bg-white group-hover:bg-blue-50/30 transition-colors z-10">
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {words.length === 0 && (
                  <tr><td colSpan={13} className="px-5 py-16 text-center text-sm text-slate-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-400">
              第 {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} 条，共 {total} 条
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-500"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) { p = i + 1; }
                else if (page <= 4) { p = i + 1; }
                else if (page >= totalPages - 3) { p = totalPages - 6 + i; }
                else { p = page - 3 + i; }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-colors ${
                      page === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-500"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showHistory && (
          <BatchHistoryModal 
            onClose={() => setShowHistory(false)}
            onSelectBatch={(batchId) => { setSelectedBatchId(batchId); setShowHistory(false); }}
          />
        )}
      </AnimatePresence>

      {/* 单词详情弹窗 */}
      <AnimatePresence>
        {(detailWord || detailLoading) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={closeDetail}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[28px] shadow-2xl overflow-hidden flex flex-col"
            >
              {detailLoading ? (
                <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-sm">加载中...</span>
                </div>
              ) : detailWord && (
                <>
                  {/* 头部 */}
                  <div className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{detailWord.word}</h2>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="font-mono text-sm text-blue-600">{detailWord.ipa}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-sm text-slate-500">{detailWord.syllables}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md">{detailWord.grade_level}</span>
                        </div>
                      </div>
                      <button onClick={closeDetail} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* 义项 */}
                    {detailWord.meanings?.map((m: any, idx: number) => (
                      <div key={m.id || idx} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <BookOpen size={15} className="text-blue-500" />
                          <span className="text-xs font-bold text-slate-400 uppercase">义项 {idx + 1}</span>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">{m.pos}</span>
                            <span className="text-sm font-medium text-slate-900">{m.definition}</span>
                          </div>

                          {m.sources?.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <GraduationCap size={13} className="text-slate-400 shrink-0" />
                              {m.sources.map((s: string, si: number) => (
                                <span key={si} className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-500">{s}</span>
                              ))}
                            </div>
                          )}

                          {m.chunk && (
                            <div className="flex items-start gap-2">
                              <Layers size={13} className="text-violet-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">核心语块</p>
                                <p className="text-sm text-violet-700 italic font-medium">{m.chunk}</p>
                              </div>
                            </div>
                          )}

                          {m.sentence && (
                            <div className="flex items-start gap-2">
                              <Volume2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">例句</p>
                                <p className="text-sm text-slate-800">{m.sentence}</p>
                                {m.sentence_cn && <p className="text-xs text-slate-500 mt-1">{m.sentence_cn}</p>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* 助记 */}
                    {detailWord.mnemonic && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb size={15} className="text-yellow-500" />
                          <span className="text-xs font-bold text-slate-400 uppercase">助记</span>
                          <span className="text-[10px] px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-md font-bold">{detailWord.mnemonic.type}</span>
                        </div>
                        <div className="bg-yellow-50/60 rounded-2xl p-4 space-y-2 border border-yellow-100">
                          {detailWord.mnemonic.formula && (
                            <p className="text-sm font-mono font-bold text-yellow-800">{detailWord.mnemonic.formula}</p>
                          )}
                          {detailWord.mnemonic.rhyme && (
                            <p className="text-sm text-yellow-700">{detailWord.mnemonic.rhyme}</p>
                          )}
                          {detailWord.mnemonic.teacher_script && (
                            <div className="mt-2 pt-2 border-t border-yellow-200/60">
                              <p className="text-[10px] font-bold text-yellow-600/60 uppercase mb-1">老师话术</p>
                              <p className="text-xs text-yellow-800/80 leading-relaxed">{detailWord.mnemonic.teacher_script}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 元信息 */}
                    <div className="flex items-center gap-4 pt-2 text-[10px] text-slate-400 uppercase tracking-wider">
                      <span>ID: {detailWord.id}</span>
                      <span>状态: {detailWord.status === 'approved' ? '✓ 已通过' : '待处理'}</span>
                      <span>创建: {new Date(detailWord.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
