import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Sparkles, FileText, Settings, Copy, Check, ShieldCheck, Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Prompt {
  id: number;
  name: string;
  category: 'generation' | 'qa';
  description: string;
  instruction: string;
  version: string;
  status: 'active' | 'draft';
  author: string;
  date: string;
  defaultModel: string;
}

const defaultPrompts: Prompt[] = [
  { id: 1, name: '语块', category: 'generation', description: '生成目标词在特定义项下的核心语块（chunk）', instruction: '你是一位英语教学专家，专注于为小学至初中阶段的中国学生生成核心语块。请基于所给的目标词和义项，生成该义项下最常见、最实用的核心语块。\n\n要求：\n1. 语块应包含目标词\n2. 语块应贴合该义项的语境\n3. 语块长度为2-5个词\n4. 优先选择高频搭配\n5. 难度适合目标学段', version: 'v1.1', status: 'active', author: '学科产品', date: '2026-03-02', defaultModel: 'Gemini 2.5 Pro' },
  { id: 2, name: '助记-考试应用', category: 'generation', description: '生成基于考试应用场景的助记内容', instruction: '你是一位记忆术专家，擅长使用考试应用法帮助学生记忆英语单词。对于给定的目标词，请设计一个与真实考试场景相关的助记方案。\n\n要求：\n1. 必须包含助记公式（formula）\n2. 必须包含助记口诀（rhyme）\n3. 必须包含老师话术（teacher_script）\n4. 助记内容应自然流畅，不生硬', version: 'v1.1', status: 'active', author: '学科产品', date: '2026-03-02', defaultModel: 'Gemini 2.5 Pro' },
  { id: 3, name: '助记-词根词缀', category: 'generation', description: '基于词根词缀拆解生成助记方案', instruction: '你是一位词源学专家，擅长通过词根词缀分析帮助学生理解和记忆英语单词。\n\n要求：\n1. 分析目标词的词根和词缀组成\n2. 用公式表达拆解过程\n3. 编写朗朗上口的记忆口诀\n4. 提供老师教学话术\n5. 如果该词无明确词根词缀，请标注为不适用', version: 'v1.1', status: 'active', author: '学科产品', date: '2026-03-01', defaultModel: 'Gemini 2.5 Pro' },
  { id: 4, name: '助记-音义联想', category: 'generation', description: '通过发音与含义的联想生成助记', instruction: '你是一位创意记忆术专家，擅长利用英语单词的发音与中文谐音之间的联想来创建有趣且有效的记忆方案。\n\n要求：\n1. 找到发音与中文的巧妙联系\n2. 联想内容需与词义关联\n3. 编写有画面感的记忆口诀\n4. 提供适合课堂使用的老师话术', version: 'v1.1', status: 'active', author: '学科产品', date: '2026-03-01', defaultModel: 'Gemini 2.5 Pro' },
  { id: 5, name: '助记-词中词', category: 'generation', description: '从目标词中找出隐藏的小词辅助记忆', instruction: '你是一位英语教学专家，擅长通过"词中词"策略帮助学生记忆英语单词。在给定的目标词中找出隐藏的已知小词，建立与目标词含义的联系。\n\n要求：\n1. 找出目标词中包含的已知小词\n2. 小词需为基础词汇（学生已学）\n3. 建立小词与目标词含义的逻辑联系\n4. 编写记忆口诀和教师话术', version: 'v1.1', status: 'active', author: '学科产品', date: '2026-03-01', defaultModel: 'Gemini 2.5 Pro' },
  { id: 6, name: '例句', category: 'generation', description: '为目标词义项生成符合学段的例句和翻译', instruction: '你是一位资深英语教师，请为给定的目标词和义项生成一个英文例句及其中文翻译。\n\n要求：\n1. 例句必须使用目标词的指定义项含义\n2. 例句难度应贴合目标学段\n3. 例句应自然、地道\n4. 中文翻译应准确流畅\n5. 例句长度适中（8-15个词）', version: 'v1.1', status: 'active', author: '学科产品', date: '2026-03-02', defaultModel: 'Gemini 2.5 Pro' },
  { id: 7, name: '音节', category: 'generation', description: '对目标词进行音节划分', instruction: '你是一位语音学专家，请对给定的英语单词进行准确的音节划分。\n\n要求：\n1. 使用 · 作为音节分隔符\n2. 严格遵循英语音节划分规则\n3. 输出格式示例: ba·na·na', version: 'v1.1', status: 'active', author: 'AI产品', date: '2026-03-02', defaultModel: 'Gemini 2.5 Pro' },
  { id: 101, name: '语块质检', category: 'qa', description: '校验语块是否包含目标词、是否贴合义项语境', instruction: '你是一位严格的英语教学质检专家。请对以下语块（chunk）进行质量检查。\n\n质检维度：\n1. 语块是否包含目标词（必须包含）\n2. 语块是否贴合该义项的语境（不可偏离）\n3. 语块长度是否在2-5个词之间\n4. 是否为高频真实搭配（不可生造）\n5. 难度是否适合目标学段\n\n输出格式：\n- pass: true/false\n- issues: 如不通过，列出具体问题\n- suggestion: 修改建议', version: 'v1.0', status: 'active', author: 'AI产品', date: '2026-03-03', defaultModel: 'Gemini 2.5 Pro' },
  { id: 102, name: '例句质检', category: 'qa', description: '校验例句语法、义项匹配度、难度适配', instruction: '你是一位严格的英语教学质检专家。请对以下例句进行全面质量检查。\n\n质检维度：\n1. 语法正确性：例句是否存在语法错误\n2. 义项匹配：例句是否使用了目标词的指定义项含义\n3. 难度适配：例句难度是否贴合目标学段（小学/初中）\n4. 自然度：例句是否自然、地道，非机翻腔\n5. 长度检查：例句是否在8-15个词之间\n6. 翻译准确性：中文翻译是否准确流畅\n\n输出格式：\n- pass: true/false\n- issues: 如不通过，列出具体问题\n- suggestion: 修改建议', version: 'v1.0', status: 'active', author: 'AI产品', date: '2026-03-03', defaultModel: 'Gemini 2.5 Pro' },
  { id: 103, name: '助记质检', category: 'qa', description: '校验助记公式逻辑性、口诀可读性、话术合理性', instruction: '你是一位严格的英语教学质检专家。请对以下助记内容进行全面质量检查。\n\n质检维度：\n1. 公式逻辑性：助记公式是否逻辑通顺、拆解合理\n2. 口诀可读性：口诀是否朗朗上口、易于记忆\n3. 关联性：助记内容是否与目标词含义紧密关联\n4. 话术合理性：老师话术是否适合课堂场景\n5. 类型匹配：助记类型标注是否正确\n6. 内容完整性：formula、rhyme、teacher_script 是否齐全\n\n输出格式：\n- pass: true/false\n- issues: 如不通过，列出具体问题\n- suggestion: 修改建议', version: 'v1.0', status: 'active', author: 'AI产品', date: '2026-03-03', defaultModel: 'Gemini 2.5 Pro' },
  { id: 104, name: '释义质检', category: 'qa', description: '校验中文释义准确性、是否匹配词性', instruction: '你是一位严格的英语教学质检专家。请对以下词义释义进行质量检查。\n\n质检维度：\n1. 释义准确性：中文释义是否准确对应英文含义\n2. 词性匹配：标注的词性（pos）是否与释义一致\n3. 学段适配：释义用词是否适合目标学段学生理解\n4. 简洁性：释义是否简洁明了，不冗余\n5. 规范性：释义是否符合教学词典规范\n\n输出格式：\n- pass: true/false\n- issues: 如不通过，列出具体问题\n- suggestion: 修改建议', version: 'v1.0', status: 'active', author: 'AI产品', date: '2026-03-03', defaultModel: 'Gemini 2.5 Pro' },
  { id: 105, name: '音节质检', category: 'qa', description: '校验音节划分是否符合语音学规则', instruction: '你是一位严格的语音学质检专家。请对以下英语单词的音节划分结果进行质量检查。\n\n质检维度：\n1. 分隔符规范：是否使用 · 作为音节分隔符\n2. 音节数量：音节数量是否正确\n3. 划分规则：是否严格遵循英语音节划分规则\n4. 与权威词典对照：是否与主流词典的音节划分一致\n\n输出格式：\n- pass: true/false\n- issues: 如不通过，列出具体问题\n- correct_syllables: 正确的音节划分', version: 'v1.0', status: 'active', author: 'AI产品', date: '2026-03-03', defaultModel: 'Gemini 2.5 Pro' },
];

const modelOptions = ['Gemini 2.5 Pro', 'Gemini 2.5 Flash', 'GPT-4o', 'Claude 3.5 Sonnet'];

export default function PromptPage() {
  const [prompts, setPrompts] = useState<Prompt[]>(defaultPrompts);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Prompt | null>(null);
  const [copied, setCopied] = useState(false);
  const [categoryTab, setCategoryTab] = useState<'generation' | 'qa'>('generation');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPrompt, setNewPrompt] = useState<Prompt | null>(null);

  const filteredPrompts = prompts.filter(p => p.category === categoryTab);
  const selectedPrompt = prompts.find(p => p.id === selectedId) || null;
  const isEditing = editingId !== null && editData !== null;
  const displayData = isEditing ? editData : selectedPrompt;

  const selectPrompt = (id: number) => {
    if (editingId) return;
    setSelectedId(id);
  };

  const startEdit = () => {
    if (!selectedPrompt) return;
    setEditData({ ...selectedPrompt });
    setEditingId(selectedPrompt.id);
  };

  const saveEdit = () => {
    if (!editData || !editData.name.trim()) return;
    setPrompts(prev => prev.map(p => p.id === editData.id ? editData : p));
    setSelectedId(editData.id);
    setEditingId(null);
    setEditData(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const startCreate = () => {
    setNewPrompt({
      id: Date.now(),
      name: '',
      category: categoryTab,
      description: '',
      instruction: '',
      version: 'v1.0',
      status: 'draft',
      author: '用户',
      date: new Date().toISOString().slice(0, 10),
      defaultModel: 'Gemini 2.5 Pro',
    });
    setShowCreateModal(true);
  };

  const saveCreate = () => {
    if (!newPrompt || !newPrompt.name.trim()) return;
    setPrompts(prev => [...prev, newPrompt]);
    setCategoryTab(newPrompt.category);
    setSelectedId(newPrompt.id);
    setShowCreateModal(false);
    setNewPrompt(null);
  };

  const deletePrompt = (id: number) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) { setSelectedId(null); setEditingId(null); setEditData(null); }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">Prompt 管理</h2>
          <p className="text-sm text-white/60">管理 AI 生成逻辑与学科标准指令</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus size={16} />
          新建 Prompt
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/40 backdrop-blur-sm rounded-2xl w-fit">
        <button
          onClick={() => { setCategoryTab('generation'); setSelectedId(null); setEditingId(null); setEditData(null); }}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            categoryTab === 'generation' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/20'
          }`}
        >
          <Zap size={14} />
          内容生产
          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${categoryTab === 'generation' ? 'bg-blue-50 text-blue-600' : 'bg-white/20 text-white/60'}`}>
            {prompts.filter(p => p.category === 'generation').length}
          </span>
        </button>
        <button
          onClick={() => { setCategoryTab('qa'); setSelectedId(null); setEditingId(null); setEditData(null); }}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            categoryTab === 'qa' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/20'
          }`}
        >
          <ShieldCheck size={14} />
          质检校验
          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${categoryTab === 'qa' ? 'bg-orange-50 text-orange-600' : 'bg-white/20 text-white/60'}`}>
            {prompts.filter(p => p.category === 'qa').length}
          </span>
        </button>
      </div>

      {/* Two-pane: list on RIGHT, detail on LEFT */}
      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 260px)' }}>
        {/* LEFT: Detail / Edit pane */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {isEditing && editData ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-white shadow-lg overflow-hidden flex flex-col h-full"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-900">编辑: {editData.name}</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">取消</button>
                    <button
                      onClick={saveEdit}
                      disabled={!editData.name.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-40 shadow-sm shadow-blue-200"
                    >
                      <Save size={12} /> 保存
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">名称</label>
                    <input
                      value={editData.name}
                      onChange={e => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">描述</label>
                    <input
                      value={editData.description}
                      onChange={e => setEditData({ ...editData, description: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      指令内容 <Sparkles size={10} className="text-yellow-500" />
                    </label>
                    <textarea
                      value={editData.instruction}
                      onChange={e => setEditData({ ...editData, instruction: e.target.value })}
                      rows={12}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-y font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">默认模型</label>
                    <select
                      value={editData.defaultModel}
                      onChange={e => setEditData({ ...editData, defaultModel: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                    >
                      {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            ) : displayData ? (
              <motion.div
                key={`view-${displayData.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-white shadow-lg overflow-hidden flex flex-col h-full"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      displayData.category === 'qa' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {displayData.category === 'qa' ? <ShieldCheck size={20} /> : <FileText size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 truncate">{displayData.name}</h3>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                          displayData.category === 'qa' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                        }`}>{displayData.category === 'qa' ? '质检' : '生产'}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{displayData.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyText(displayData.instruction)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      {copied ? '已复制' : '复制'}
                    </button>
                    <button
                      onClick={startEdit}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                    >
                      <Edit2 size={12} /> 编辑
                    </button>
                    <button
                      onClick={() => deletePrompt(displayData.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      displayData.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>{displayData.status === 'active' ? '启用中' : '草稿'}</span>
                    <span>{displayData.version}</span>
                    <span>由 {displayData.author} 更新于 {displayData.date}</span>
                    <span className="flex items-center gap-1"><Settings size={11} /> {displayData.defaultModel}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={10} className="text-yellow-500" /> 指令内容
                    </p>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{displayData.instruction}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 h-full flex flex-col items-center justify-center space-y-3"
                style={{ minHeight: 400 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/80 text-slate-300 flex items-center justify-center">
                  <Sparkles size={28} />
                </div>
                <p className="text-sm text-white/50 font-medium">点击右侧列表查看详情</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Prompt list */}
        <div className="w-64 shrink-0 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {filteredPrompts.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => selectPrompt(p.id)}
              className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all ${
                selectedId === p.id
                  ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100'
                  : 'bg-white/80 border-white/60 hover:bg-white hover:border-blue-100 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  p.category === 'qa' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {p.category === 'qa' ? <ShieldCheck size={15} /> : <FileText size={15} />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-slate-900 truncate">{p.name}</h3>
                  <span className="text-[10px] text-slate-400">{p.version}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && newPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center"><Plus size={20} /></div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">新建 Prompt</h3>
                    <p className="text-xs text-slate-400">创建新的 AI 指令模板</p>
                  </div>
                </div>
                <button onClick={() => { setShowCreateModal(false); setNewPrompt(null); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">名称 *</label>
                    <input
                      value={newPrompt.name}
                      onChange={e => setNewPrompt({ ...newPrompt, name: e.target.value })}
                      placeholder="Prompt 名称"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-slate-300"
                      autoFocus
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">描述</label>
                    <input
                      value={newPrompt.description}
                      onChange={e => setNewPrompt({ ...newPrompt, description: e.target.value })}
                      placeholder="功能简述"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">指令内容 <Sparkles size={10} className="text-yellow-500" /></label>
                  <textarea
                    value={newPrompt.instruction}
                    onChange={e => setNewPrompt({ ...newPrompt, instruction: e.target.value })}
                    placeholder="输入 AI 指令..."
                    rows={8}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-y font-mono placeholder:text-slate-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">默认模型</label>
                  <select
                    value={newPrompt.defaultModel}
                    onChange={e => setNewPrompt({ ...newPrompt, defaultModel: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                  >
                    {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
                <button onClick={() => { setShowCreateModal(false); setNewPrompt(null); }} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">取消</button>
                <button
                  onClick={saveCreate}
                  disabled={!newPrompt.name.trim()}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-40 shadow-sm shadow-blue-200"
                ><Save size={14} /> 创建</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
