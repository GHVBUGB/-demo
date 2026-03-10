import { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertCircle, Clock, ArrowRight, Database, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockStats, mockBatches } from '../mockData';

interface MonitoringPageProps {
  onGoToReview: () => void;
  batchId: string | null;
}

export default function MonitoringPage({ onGoToReview, batchId }: MonitoringPageProps) {
  const [activeWord, setActiveWord] = useState<string>('empathy');
  const [activeGate, setActiveGate] = useState<number>(2);

  const wordsPool = ['empathy', 'kind', 'beautiful', 'run', 'light', 'play', 'present', 'change', 'interest', 'express'];

  const batchInfo = batchId ? mockBatches.find(b => b.id === batchId) : null;
  const stats = {
    total: mockStats.total,
    approved: mockStats.approved,
    pending: mockStats.pending,
    processing: 0,
  };
  const progress = Math.round((stats.approved / stats.total) * 100);

  const [logs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] 启动生产批次 #${batchId || 'GLOBAL'}`,
    `[${new Date().toLocaleTimeString()}] 正在加载模型: Gemini Pro 1.5...`,
    `[${new Date().toLocaleTimeString()}] 批次策略: 每 100 个单词一组进行质检`,
    `[${new Date().toLocaleTimeString()}] 异常策略: 累计 50 个问题词进入 AI 辅助修改队列`,
    `[${new Date().toLocaleTimeString()}] Gate 1 释义校验通过: 1,850 词`,
    `[${new Date().toLocaleTimeString()}] Gate 2 助记校验通过: 1,820 词`,
    `[${new Date().toLocaleTimeString()}] Gate 3 例句校验通过: 1,930 词`,
    `[${new Date().toLocaleTimeString()}] ✅ 生产任务已完成，共入库 ${stats.approved} 词`,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWord(wordsPool[Math.floor(Math.random() * wordsPool.length)]);
      setActiveGate(Math.floor(Math.random() * 3) + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-[32px] p-12 border border-white relative overflow-hidden shadow-lg">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-slate-100" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-12">
          {/* Top Status Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Activity size={24} className={progress < 100 ? 'animate-pulse' : ''} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {progress < 100 ? '内容工厂正在运转...' : '生产任务已完成'}
                </h2>
                {batchInfo && (
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                    批次: {batchInfo.name || batchId}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-blue-600">{progress}%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Overall Progress</p>
            </div>
          </div>

          {/* Main Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Pipeline Animation */}
            <div className="lg:col-span-2 space-y-8">
              <div className="relative h-48 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  {progress < 100 ? (
                    <motion.div 
                      key={activeWord}
                      initial={{ x: -100, opacity: 0, scale: 0.8 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      exit={{ x: 100, opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="px-8 py-4 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
                        <span className="text-3xl font-black text-slate-900">{activeWord}</span>
                        <div className="h-8 w-px bg-slate-200" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Processing</span>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(g => (
                              <div 
                                key={g} 
                                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                                  activeGate >= g ? 'bg-blue-500' : 'bg-slate-200'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-widest">
                        <Loader2 size={14} className="animate-spin" />
                        Gate {activeGate} 质量校验中...
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-2"
                    >
                      <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">全量生产完毕</h3>
                      <p className="text-sm text-slate-400">所有内容已通过 Gate 1-3 质检</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pipeline Belt Decoration */}
                <div className="absolute bottom-0 left-0 w-full h-2 bg-blue-100">
                  <motion.div 
                    animate={{ x: [-20, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                    className="h-full w-[120%] bg-[repeating-linear-gradient(90deg,#3B82F6_0px,#3B82F6_2px,transparent_2px,transparent_20px)] opacity-20"
                  />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-4">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]" />
                  </motion.div>
                </div>
                <div className="flex justify-between items-center px-2">
                  <div className="flex gap-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">已入库</span>
                      <span className="text-lg font-black text-emerald-600">{stats.approved}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">待修复</span>
                      <span className="text-lg font-black text-rose-600">{stats.pending}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">预计耗时</span>
                    <p className="text-sm font-bold text-slate-500">~ {Math.ceil((stats.total - stats.approved - stats.pending) * 0.2)}s</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stats Bento */}
            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 bg-blue-50/50 rounded-[24px] border border-blue-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-blue-600/60 uppercase tracking-widest">总生产任务</span>
                <div className="flex items-end justify-between">
                  <h4 className="text-4xl font-black text-blue-700">{stats.total}</h4>
                  <div className="p-2 bg-white rounded-xl border border-blue-100">
                    <Database size={20} className="text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-emerald-50/50 rounded-[24px] border border-emerald-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">当前合格率</span>
                <div className="flex items-end justify-between">
                  <h4 className="text-4xl font-black text-emerald-600">
                    {stats.total > 0 ? Math.round((stats.approved / (stats.approved + stats.pending || 1)) * 100) : 0}%
                  </h4>
                  <div className="p-2 bg-white rounded-xl border border-emerald-100">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-rose-50/50 rounded-[24px] border border-rose-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-rose-600/60 uppercase tracking-widest">异常拦截</span>
                <div className="flex items-end justify-between">
                  <h4 className="text-4xl font-black text-rose-600">{stats.pending}</h4>
                  <div className="p-2 bg-white rounded-xl border border-rose-100">
                    <AlertCircle size={20} className="text-rose-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center gap-6 pt-4">
            <AnimatePresence>
              {stats.pending > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-2xl p-6 bg-rose-50 border border-rose-100 rounded-[32px] flex items-center justify-between gap-6 shadow-xl shadow-rose-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-900">检测到 {stats.pending} 个质量异常</h4>
                      <p className="text-xs text-rose-600/70">建议在生产结束后统一前往修复队列处理</p>
                    </div>
                  </div>
                  <button 
                    onClick={onGoToReview}
                    className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all flex items-center gap-2 shadow-lg shadow-rose-200 shrink-0"
                  >
                    前往质检审核
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {stats.pending === 0 && progress === 100 && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => window.location.hash = '#master'}
                className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
              >
                进入词汇总表
                <ArrowRight size={20} />
              </motion.button>
            )}
          </div>
        </div>
      </section>

      {/* Logs Section */}
      <section className="bg-white rounded-[32px] border border-white overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
            <Clock size={20} className="text-blue-600" />
            系统运行日志
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Stream</span>
          </div>
        </div>
        <div className="p-8 h-64 overflow-y-auto font-mono text-xs space-y-3 bg-slate-50/50">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-slate-300 shrink-0">{i + 1}.</span>
              <p className="text-slate-500">{log}</p>
            </div>
          ))}
          <div className="flex gap-4 text-blue-600">
            <span className="text-blue-300 shrink-0">{logs.length + 1}.</span>
            <p className="flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              正在执行 Gate {activeGate} 深度语义校验...
            </p>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes progress-stripe {
          from { background-position: 0 0; }
          to { background-position: 20px 0; }
        }
      `}</style>
    </div>
  );
}
