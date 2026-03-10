// 所有 mock 数据集中在这里，Vercel 静态部署时直接使用

export const mockStats = {
  total: 2065,
  approved: 1930,
  pending: 135,
  issues: [
    { field: 'sentence', count: 80 },
    { field: 'mnemonic', count: 35 },
    { field: 'definition', count: 20 },
  ],
};

export const mockBatches = [
  { id: 'batch_020', name: '导入批次 20', total_words: 100, created_at: '2026-03-09 10:00:00' },
  { id: 'batch_019', name: '导入批次 19', total_words: 120, created_at: '2026-03-08 14:30:00' },
  { id: 'batch_018', name: '导入批次 18', total_words: 95,  created_at: '2026-03-07 09:15:00' },
  { id: 'batch_017', name: '导入批次 17', total_words: 110, created_at: '2026-03-06 16:45:00' },
  { id: 'batch_016', name: '导入批次 16', total_words: 88,  created_at: '2026-03-05 11:20:00' },
  { id: 'batch_015', name: '导入批次 15', total_words: 130, created_at: '2026-03-04 08:00:00' },
  { id: 'batch_014', name: '导入批次 14', total_words: 105, created_at: '2026-03-03 13:30:00' },
  { id: 'batch_013', name: '导入批次 13', total_words: 92,  created_at: '2026-03-02 10:00:00' },
];

export const mockWords = [
  {
    id: 1, word: 'empathy', syllables: 'em·pa·thy', ipa: '/ˈem.pə.θi/', grade_level: '九年级',
    status: 'approved', batch_id: 'batch_001', repair_attempts: 1,
    created_at: '2026-03-09 10:00:00', issue_count: 0,
    mnemonic_formula: 'em(进入) + path(感受) + y(名词后缀)',
    mnemonic_rhyme: '进入别人的感受，就是同理心',
    mnemonic: { type: '词根拆解', formula: 'em(进入) + path(感受) + y(名词后缀)', rhyme: '进入别人的感受，就是同理心', teacher_script: '同学们，empathy 就是走进别人的内心世界，感受他们的喜怒哀乐。' },
    meanings: [{ id: 1, word_id: 1, pos: 'n.', definition: '共情；同理心', sources: ['人教版九年级英语全一册'], chunk: 'show empathy for', sentence: 'A good friend always shows empathy for others.', sentence_cn: '好朋友总是对他人表现出同理心。' }],
  },
  {
    id: 2, word: 'kind', syllables: 'kind', ipa: '/kaɪnd/', grade_level: '七年级',
    status: 'approved', batch_id: 'batch_001', repair_attempts: 0,
    created_at: '2026-03-09 10:00:00', issue_count: 0,
    mnemonic_formula: 'kind = king(国王) - g + d',
    mnemonic_rhyme: '国王换一个字母就变友好',
    mnemonic: { type: '谐音联想', formula: 'kind = king(国王) - g + d', rhyme: '国王换一个字母就变友好', teacher_script: '友善的人就像国王一样受人尊敬。' },
    meanings: [
      { id: 2, word_id: 2, pos: 'adj.', definition: '友好的', sources: ['人教版七年级英语上册（衔接小学）'], chunk: 'be kind to sb.', sentence: 'The teacher is always kind to every student.', sentence_cn: '老师对每位同学总是很友好。' },
      { id: 3, word_id: 2, pos: 'n.', definition: '种类', sources: ['人教版八年级英语下册'], chunk: 'a kind of', sentence: 'There are many kinds of animals in the zoo.', sentence_cn: '动物园里有很多种动物。' },
    ],
  },
  {
    id: 3, word: 'beautiful', syllables: 'beau·ti·ful', ipa: '/ˈbjuː.tɪ.fəl/', grade_level: '七年级',
    status: 'approved', batch_id: 'batch_001', repair_attempts: 0,
    created_at: '2026-03-09 10:00:00', issue_count: 0,
    mnemonic_formula: 'beauty(美) + ful(充满...的)',
    mnemonic_rhyme: '充满美的，就是美丽的',
    mnemonic: { type: '词根拆解', formula: 'beauty(美) + ful(充满...的)', rhyme: '充满美的，就是美丽的', teacher_script: '美丽就是充满美感的状态。' },
    meanings: [{ id: 4, word_id: 3, pos: 'adj.', definition: '美丽的；漂亮的', sources: ['人教版七年级英语上册（衔接小学）', '人教版八年级英语上册'], chunk: 'a beautiful day', sentence: 'What a beautiful day it is today!', sentence_cn: '今天天气真好！' }],
  },
  {
    id: 4, word: 'run', syllables: 'run', ipa: '/rʌn/', grade_level: '七年级',
    status: 'approved', batch_id: 'batch_002', repair_attempts: 0,
    created_at: '2026-03-08 10:00:00', issue_count: 0,
    mnemonic_formula: 'run → 润(谐音)',
    mnemonic_rhyme: '润滑地跑起来，跑得快又远',
    mnemonic: { type: '谐音联想', formula: 'run → 润(谐音)', rhyme: '润滑地跑起来，跑得快又远', teacher_script: '想象润滑油让你跑得飞快。' },
    meanings: [
      { id: 5, word_id: 4, pos: 'v.', definition: '跑；奔跑', sources: ['人教版七年级英语上册（衔接小学）'], chunk: 'run fast', sentence: 'He runs to school every morning.', sentence_cn: '他每天早上跑步去学校。' },
      { id: 6, word_id: 4, pos: 'v.', definition: '经营；管理', sources: ['人教版九年级英语全一册'], chunk: 'run a business', sentence: 'She runs a small coffee shop downtown.', sentence_cn: '她在市中心经营一家小咖啡馆。' },
    ],
  },
  {
    id: 5, word: 'light', syllables: 'light', ipa: '/laɪt/', grade_level: '七年级',
    status: 'approved', batch_id: 'batch_002', repair_attempts: 0,
    created_at: '2026-03-08 10:00:00', issue_count: 0,
    mnemonic_formula: 'light = 光/轻 (多义核心)',
    mnemonic_rhyme: '光是轻的，所以light既是光又是轻',
    mnemonic: { type: '语义联想', formula: 'light = 光/轻 (多义核心)', rhyme: '光是轻的，所以light既是光又是轻', teacher_script: '光线是轻盈的，所以light既表示光，也表示轻。' },
    meanings: [
      { id: 7, word_id: 5, pos: 'n.', definition: '光；灯光', sources: ['人教版七年级英语上册（衔接小学）'], chunk: 'turn on the light', sentence: 'Please turn on the light.', sentence_cn: '请把灯打开。' },
      { id: 8, word_id: 5, pos: 'adj.', definition: '轻的；浅色的', sources: ['人教版八年级英语上册'], chunk: 'light blue', sentence: 'She wore a light blue dress.', sentence_cn: '她穿了一件浅蓝色的裙子。' },
    ],
  },
  {
    id: 6, word: 'play', syllables: 'play', ipa: '/pleɪ/', grade_level: '三年级',
    status: 'approved', batch_id: 'batch_003', repair_attempts: 0,
    created_at: '2026-03-07 10:00:00', issue_count: 0,
    mnemonic_formula: 'play ≈ 玩乐',
    mnemonic_rhyme: '玩耍弹琴看话剧，play全搞定',
    mnemonic: { type: '语义联想', formula: 'play ≈ 玩乐', rhyme: '玩耍弹琴看话剧，play全搞定', teacher_script: 'play 是个万能词，玩、弹奏、演出都是它。' },
    meanings: [
      { id: 9, word_id: 6, pos: 'v.', definition: '玩；做游戏', sources: ['人教版三年级英语上册(PEP)'], chunk: 'play with friends', sentence: 'Children love to play in the park.', sentence_cn: '孩子们喜欢在公园里玩。' },
      { id: 10, word_id: 6, pos: 'v.', definition: '演奏；弹奏', sources: ['人教版七年级英语上册（衔接小学）'], chunk: 'play the piano', sentence: 'She plays the piano beautifully.', sentence_cn: '她钢琴弹得很优美。' },
    ],
  },
  {
    id: 7, word: 'present', syllables: 'pres·ent', ipa: '/ˈprez.ənt/', grade_level: '七年级',
    status: 'approved', batch_id: 'batch_003', repair_attempts: 0,
    created_at: '2026-03-07 10:00:00', issue_count: 0,
    mnemonic_formula: 'pre(前面) + sent(送)',
    mnemonic_rhyme: '送到面前，就是礼物和展示',
    mnemonic: { type: '词根拆解', formula: 'pre(前面) + sent(送)', rhyme: '送到面前，就是礼物和展示', teacher_script: '把东西送到面前，就是礼物；把想法展示出来，就是呈现。' },
    meanings: [
      { id: 11, word_id: 7, pos: 'n.', definition: '礼物', sources: ['人教版七年级英语上册（衔接小学）'], chunk: 'a birthday present', sentence: 'She gave me a present for my birthday.', sentence_cn: '她送我一份生日礼物。' },
      { id: 12, word_id: 7, pos: 'adj.', definition: '在场的；目前的', sources: ['人教版八年级英语上册'], chunk: 'be present at', sentence: 'All students were present at the meeting.', sentence_cn: '所有学生都出席了会议。' },
      { id: 13, word_id: 7, pos: 'v.', definition: '展示；呈现', sources: ['人教版九年级英语全一册'], chunk: 'present an idea', sentence: 'He presented his project to the class.', sentence_cn: '他向全班展示了他的项目。' },
    ],
  },
  {
    id: 8, word: 'change', syllables: 'change', ipa: '/tʃeɪndʒ/', grade_level: '七年级',
    status: 'approved', batch_id: 'batch_004', repair_attempts: 0,
    created_at: '2026-03-06 10:00:00', issue_count: 0,
    mnemonic_formula: 'change = 变',
    mnemonic_rhyme: '零钱也是把大钱变小钱',
    mnemonic: { type: '语义联想', formula: 'change = 变', rhyme: '零钱也是把大钱变小钱', teacher_script: '变化和零钱都是change，因为找零就是把大钱变小钱。' },
    meanings: [
      { id: 14, word_id: 8, pos: 'v.', definition: '改变；变化', sources: ['人教版七年级英语下册'], chunk: 'change the world', sentence: 'Technology can change our lives.', sentence_cn: '科技可以改变我们的生活。' },
      { id: 15, word_id: 8, pos: 'n.', definition: '零钱；找零', sources: ['人教版八年级英语上册'], chunk: 'keep the change', sentence: 'Here is your change, sir.', sentence_cn: '这是您的找零，先生。' },
    ],
  },
  {
    id: 9, word: 'interest', syllables: 'in·ter·est', ipa: '/ˈɪn.trəst/', grade_level: '七年级',
    status: 'approved', batch_id: 'batch_004', repair_attempts: 0,
    created_at: '2026-03-06 10:00:00', issue_count: 0,
    mnemonic_formula: 'inter(之间) + est(存在)',
    mnemonic_rhyme: '存在于心中的，就是你的兴趣',
    mnemonic: { type: '词根拆解', formula: 'inter(之间) + est(存在)', rhyme: '存在于心中的，就是你的兴趣', teacher_script: '兴趣是存在于你内心深处的东西，利息是钱与钱之间产生的东西。' },
    meanings: [
      { id: 16, word_id: 9, pos: 'n.', definition: '兴趣；爱好', sources: ['人教版七年级英语下册'], chunk: 'show interest in', sentence: 'She shows great interest in music.', sentence_cn: '她对音乐很感兴趣。' },
      { id: 17, word_id: 9, pos: 'n.', definition: '利息', sources: ['人教版九年级英语全一册'], chunk: 'earn interest', sentence: 'The bank pays interest on savings.', sentence_cn: '银行对存款支付利息。' },
    ],
  },
  {
    id: 10, word: 'express', syllables: 'ex·press', ipa: '/ɪkˈspres/', grade_level: '八年级',
    status: 'approved', batch_id: 'batch_005', repair_attempts: 0,
    created_at: '2026-03-05 10:00:00', issue_count: 0,
    mnemonic_formula: 'ex(出) + press(压)',
    mnemonic_rhyme: '把内心的感觉压出来就是表达',
    mnemonic: { type: '词根拆解', formula: 'ex(出) + press(压)', rhyme: '把内心的感觉压出来就是表达', teacher_script: '把内心的想法压出来，就是表达；快递也是把东西快速压送出去。' },
    meanings: [
      { id: 18, word_id: 10, pos: 'v.', definition: '表达；表示', sources: ['人教版八年级英语下册'], chunk: 'express feelings', sentence: 'Music helps us express our feelings.', sentence_cn: '音乐帮助我们表达情感。' },
      { id: 19, word_id: 10, pos: 'adj.', definition: '快速的；特快的', sources: ['人教版九年级英语全一册'], chunk: 'express delivery', sentence: 'I sent the package by express delivery.', sentence_cn: '我通过快递寄了这个包裹。' },
    ],
  },
  {
    id: 11, word: 'fall', syllables: 'fall', ipa: '/fɔːl/', grade_level: '四年级',
    status: 'approved', batch_id: 'batch_005', repair_attempts: 0,
    created_at: '2026-03-05 10:00:00', issue_count: 0,
    mnemonic_formula: 'fall = 落',
    mnemonic_rhyme: '秋天(fall)树叶落(fall)，瀑布也在落',
    mnemonic: { type: '语义联想', formula: 'fall = 落', rhyme: '秋天(fall)树叶落(fall)，瀑布也在落', teacher_script: '秋天树叶落下，fall 既是秋天又是落下，一词双义好记忆。' },
    meanings: [
      { id: 20, word_id: 11, pos: 'v.', definition: '落下；跌倒', sources: ['人教版七年级英语上册（衔接小学）'], chunk: 'fall down', sentence: 'Leaves fall from the trees in autumn.', sentence_cn: '秋天树叶从树上落下。' },
      { id: 21, word_id: 11, pos: 'n.', definition: '秋天（美式）', sources: ['人教版四年级英语上册(PEP)'], chunk: 'in the fall', sentence: 'We go apple picking in the fall.', sentence_cn: '我们秋天去摘苹果。' },
    ],
  },
  {
    id: 12, word: 'mind', syllables: 'mind', ipa: '/maɪnd/', grade_level: '七年级',
    status: 'approved', batch_id: 'batch_006', repair_attempts: 0,
    created_at: '2026-03-04 10:00:00', issue_count: 0,
    mnemonic_formula: 'mind ≈ 脑(想)',
    mnemonic_rhyme: '用脑子想，才不会介意',
    mnemonic: { type: '谐音联想', formula: 'mind ≈ 脑(想)', rhyme: '用脑子想，才不会介意', teacher_script: '用脑子（mind）思考，才能做出不让人介意的决定。' },
    meanings: [
      { id: 22, word_id: 12, pos: 'n.', definition: '头脑；思维', sources: ['人教版七年级英语下册'], chunk: "make up one's mind", sentence: 'She has a brilliant mind.', sentence_cn: '她有聪明的头脑。' },
      { id: 23, word_id: 12, pos: 'v.', definition: '介意；在乎', sources: ['人教版八年级英语上册'], chunk: 'Do you mind?', sentence: 'Would you mind opening the window?', sentence_cn: '你介意打开窗户吗？' },
    ],
  },
  {
    id: 13, word: 'record', syllables: 'rec·ord', ipa: '/ˈrek.ɔːd/', grade_level: '八年级',
    status: 'approved', batch_id: 'batch_006', repair_attempts: 0,
    created_at: '2026-03-04 10:00:00', issue_count: 0,
    mnemonic_formula: 're(再) + cord(心)',
    mnemonic_rhyme: '再次记在心上，就是记录',
    mnemonic: { type: '词根拆解', formula: 're(再) + cord(心)', rhyme: '再次记在心上，就是记录', teacher_script: '把事情再次刻在心上，就是记录下来。' },
    meanings: [
      { id: 24, word_id: 13, pos: 'n.', definition: '记录；唱片', sources: ['人教版八年级英语上册'], chunk: 'break a record', sentence: 'She broke the world record in swimming.', sentence_cn: '她打破了游泳世界纪录。' },
      { id: 25, word_id: 13, pos: 'v.', definition: '录制；记录', sources: ['人教版八年级英语下册'], chunk: 'record a video', sentence: 'I recorded a video of the concert.', sentence_cn: '我录了一段音乐会的视频。' },
    ],
  },
  {
    id: 14, word: 'subject', syllables: 'sub·ject', ipa: '/ˈsʌb.dʒɪkt/', grade_level: '七年级',
    status: 'approved', batch_id: 'batch_007', repair_attempts: 0,
    created_at: '2026-03-03 10:00:00', issue_count: 0,
    mnemonic_formula: 'sub(下) + ject(扔)',
    mnemonic_rhyme: '扔到课堂下面学的就是科目',
    mnemonic: { type: '词根拆解', formula: 'sub(下) + ject(扔)', rhyme: '扔到课堂下面学的就是科目', teacher_script: '被扔到学生面前学习的内容，就是科目。' },
    meanings: [
      { id: 26, word_id: 14, pos: 'n.', definition: '科目；学科', sources: ['人教版七年级英语上册（衔接小学）'], chunk: 'favorite subject', sentence: 'Math is my favorite subject.', sentence_cn: '数学是我最喜欢的科目。' },
      { id: 27, word_id: 14, pos: 'n.', definition: '主题；话题', sources: ['人教版八年级英语下册'], chunk: 'change the subject', sentence: "Let's change the subject.", sentence_cn: '我们换个话题吧。' },
    ],
  },
  {
    id: 15, word: 'experience', syllables: 'ex·pe·ri·ence', ipa: '/ɪkˈspɪə.ri.əns/', grade_level: '八年级',
    status: 'approved', batch_id: 'batch_007', repair_attempts: 0,
    created_at: '2026-03-03 10:00:00', issue_count: 0,
    mnemonic_formula: 'ex(出) + peri(尝试) + ence',
    mnemonic_rhyme: '走出去尝试就是经历',
    mnemonic: { type: '词根拆解', formula: 'ex(出) + peri(尝试) + ence', rhyme: '走出去尝试就是经历', teacher_script: '走出去（ex）尝试（peri）各种事情，积累的就是经验。' },
    meanings: [
      { id: 28, word_id: 15, pos: 'n.', definition: '经验；经历', sources: ['人教版八年级英语下册'], chunk: 'work experience', sentence: 'He has rich experience in teaching.', sentence_cn: '他有丰富的教学经验。' },
      { id: 29, word_id: 15, pos: 'v.', definition: '体验；经历', sources: ['人教版九年级英语全一册'], chunk: 'experience life', sentence: 'I want to experience different cultures.', sentence_cn: '我想体验不同的文化。' },
    ],
  },
  {
    id: 16, word: 'company', syllables: 'com·pa·ny', ipa: '/ˈkʌm.pə.ni/', grade_level: '八年级',
    status: 'approved', batch_id: 'batch_008', repair_attempts: 0,
    created_at: '2026-03-02 10:00:00', issue_count: 0,
    mnemonic_formula: 'com(共同) + pan(面包) + y',
    mnemonic_rhyme: '一起分面包的同伴，组成公司',
    mnemonic: { type: '词根拆解', formula: 'com(共同) + pan(面包) + y', rhyme: '一起分面包的同伴，组成公司', teacher_script: '一起分面包的伙伴，就是同伴，也是公司的雏形。' },
    meanings: [
      { id: 30, word_id: 16, pos: 'n.', definition: '公司；企业', sources: ['人教版八年级英语上册'], chunk: 'a big company', sentence: 'He works for a tech company.', sentence_cn: '他在一家科技公司工作。' },
      { id: 31, word_id: 16, pos: 'n.', definition: '陪伴；同伴', sources: ['人教版九年级英语全一册'], chunk: 'keep sb. company', sentence: 'The dog keeps her company at home.', sentence_cn: '狗在家里陪伴她。' },
    ],
  },
  {
    id: 17, word: 'watch', syllables: 'watch', ipa: '/wɒtʃ/', grade_level: '四年级',
    status: 'approved', batch_id: 'batch_008', repair_attempts: 0,
    created_at: '2026-03-02 10:00:00', issue_count: 0,
    mnemonic_formula: 'watch → 看表',
    mnemonic_rhyme: '看(watch)手表(watch)，一词两用',
    mnemonic: { type: '语义联想', formula: 'watch → 看表', rhyme: '看(watch)手表(watch)，一词两用', teacher_script: '看手表的动作就是watch，手表本身也是watch，一词两义。' },
    meanings: [
      { id: 32, word_id: 17, pos: 'v.', definition: '观看；注视', sources: ['人教版四年级英语下册(PEP)'], chunk: 'watch TV', sentence: 'We like to watch movies together.', sentence_cn: '我们喜欢一起看电影。' },
      { id: 33, word_id: 17, pos: 'n.', definition: '手表', sources: ['人教版七年级英语上册（衔接小学）'], chunk: 'a gold watch', sentence: 'He looked at his watch nervously.', sentence_cn: '他紧张地看了看手表。' },
    ],
  },
  {
    id: 18, word: 'work', syllables: 'work', ipa: '/wɜːk/', grade_level: '四年级',
    status: 'approved', batch_id: 'batch_009', repair_attempts: 0,
    created_at: '2026-03-01 10:00:00', issue_count: 0,
    mnemonic_formula: 'work ≈ 我磕(谐音)',
    mnemonic_rhyme: '我磕头都要去工作',
    mnemonic: { type: '谐音联想', formula: 'work ≈ 我磕(谐音)', rhyme: '我磕头都要去工作', teacher_script: '想象自己磕头说"我磕"，就是拼命去工作。' },
    meanings: [
      { id: 34, word_id: 18, pos: 'v.', definition: '工作', sources: ['人教版四年级英语下册(PEP)'], chunk: 'work hard', sentence: 'She works hard every day.', sentence_cn: '她每天努力工作。' },
      { id: 35, word_id: 18, pos: 'n.', definition: '作品；著作', sources: ['人教版九年级英语全一册'], chunk: 'a work of art', sentence: 'This painting is a great work of art.', sentence_cn: '这幅画是一件伟大的艺术作品。' },
    ],
  },
  {
    id: 19, word: 'spring', syllables: 'spring', ipa: '/sprɪŋ/', grade_level: '四年级',
    status: 'approved', batch_id: 'batch_009', repair_attempts: 0,
    created_at: '2026-03-01 10:00:00', issue_count: 0,
    mnemonic_formula: 'spring = 弹(泉水涌/弹簧弹) + 春天',
    mnemonic_rhyme: '春天万物弹跳着冒出来',
    mnemonic: { type: '语义联想', formula: 'spring = 弹(泉水涌/弹簧弹) + 春天', rhyme: '春天万物弹跳着冒出来', teacher_script: '春天万物像弹簧一样弹跳着冒出来，泉水也是弹涌而出。' },
    meanings: [
      { id: 36, word_id: 19, pos: 'n.', definition: '春天', sources: ['人教版四年级英语下册(PEP)'], chunk: 'in spring', sentence: 'Flowers bloom in spring.', sentence_cn: '花朵在春天绽放。' },
      { id: 37, word_id: 19, pos: 'n.', definition: '泉水；弹簧', sources: ['人教版八年级英语下册'], chunk: 'a hot spring', sentence: 'There is a hot spring near the mountain.', sentence_cn: '山附近有一个温泉。' },
    ],
  },
  {
    id: 20, word: 'book', syllables: 'book', ipa: '/bʊk/', grade_level: '三年级',
    status: 'approved', batch_id: 'batch_010', repair_attempts: 0,
    created_at: '2026-02-28 10:00:00', issue_count: 0,
    mnemonic_formula: 'book ≈ 不可(谐音)',
    mnemonic_rhyme: '好书不可不读',
    mnemonic: { type: '谐音联想', formula: 'book ≈ 不可(谐音)', rhyme: '好书不可不读', teacher_script: '好书不可不读，book 谐音"不可"，帮你记住书和预订两个意思。' },
    meanings: [
      { id: 38, word_id: 20, pos: 'n.', definition: '书；书籍', sources: ['人教版三年级英语上册(PEP)'], chunk: 'read a book', sentence: 'I read a book every night.', sentence_cn: '我每天晚上都读一本书。' },
      { id: 39, word_id: 20, pos: 'v.', definition: '预订；预约', sources: ['人教版八年级英语下册'], chunk: 'book a ticket', sentence: 'We need to book the tickets early.', sentence_cn: '我们需要提前订票。' },
    ],
  },
];

export const mockPendingWords = [
  {
    id: 101, word: 'empathy', status: 'pending', repair_attempts: 1,
    field: 'sentence', issue: '例句字数超标 (18+ 词)', failed_step: 'Gate 3', issue_retry_count: 0,
    problematic_content: 'A good friend always shows empathy for others even when they are busy with their own problems.',
  },
  {
    id: 102, word: 'kind', status: 'pending', repair_attempts: 1,
    field: 'mnemonic', issue: '助记逻辑不通顺', failed_step: 'Gate 2', issue_retry_count: 0,
    problematic_content: 'kind = king(国王) - g + d',
  },
  {
    id: 103, word: 'beautiful', status: 'pending', repair_attempts: 1,
    field: 'mnemonic', issue: '助记公式有误', failed_step: 'Gate 2', issue_retry_count: 0,
    problematic_content: 'beauty(美) + ful(充满...的)',
  },
  {
    id: 104, word: 'good', status: 'pending', repair_attempts: 2,
    field: 'mnemonic', issue: '助记逻辑不通顺', failed_step: 'Gate 2', issue_retry_count: 0,
    problematic_content: 'good ≈ 咕嘟',
  },
  {
    id: 105, word: 'apple', status: 'pending', repair_attempts: 3,
    field: 'chunk', issue: 'AI 修复已达上限 (3次)，请人工介入修改。', failed_step: 'Gate 1', issue_retry_count: 3,
    problematic_content: 'a red apple',
  },
  {
    id: 106, word: 'run', status: 'pending', repair_attempts: 0,
    field: 'sentence', issue: '例句难度不匹配目标学段', failed_step: 'Gate 3', issue_retry_count: 0,
    problematic_content: 'He runs to school every morning.',
  },
  {
    id: 107, word: 'light', status: 'pending', repair_attempts: 1,
    field: 'definition', issue: '释义描述不准确', failed_step: 'Gate 1', issue_retry_count: 0,
    problematic_content: '轻的；浅色的',
  },
  {
    id: 108, word: 'change', status: 'pending', repair_attempts: 2,
    field: 'chunk', issue: '语块与释义不匹配', failed_step: 'Gate 1', issue_retry_count: 0,
    problematic_content: 'keep the change',
  },
  {
    id: 109, word: 'interest', status: 'pending', repair_attempts: 3,
    field: 'mnemonic', issue: 'AI 修复已达上限 (3次)，请人工介入修改。', failed_step: 'Gate 2', issue_retry_count: 3,
    problematic_content: 'inter(之间) + est(存在)',
  },
  {
    id: 110, word: 'express', status: 'pending', repair_attempts: 0,
    field: 'sentence', issue: '例句未包含目标词', failed_step: 'Gate 3', issue_retry_count: 0,
    problematic_content: 'I sent the package by special delivery.',
  },
];

export const mockBatchStats = {
  total: 100,
  approved: 85,
  pending: 12,
  processing: 3,
};
