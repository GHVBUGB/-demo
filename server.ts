import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "vocab.db");
const db = new Database(dbPath);

// Initialize Database
db.exec(`
  DROP TABLE IF EXISTS quality_issues;
  DROP TABLE IF EXISTS content_items;
  DROP TABLE IF EXISTS sources;
  DROP TABLE IF EXISTS meanings;
  DROP TABLE IF EXISTS mnemonics;
  DROP TABLE IF EXISTS words;

  CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    name TEXT,
    total_words INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    syllables TEXT,
    ipa TEXT,
    grade_level TEXT,
    status TEXT DEFAULT 'pending',
    batch_id TEXT,
    repair_attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(batch_id) REFERENCES batches(id)
  );

  CREATE TABLE IF NOT EXISTS meanings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER,
    pos TEXT,
    definition TEXT,
    content_status TEXT DEFAULT 'pending',
    FOREIGN KEY(word_id) REFERENCES words(id)
  );

  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meaning_id INTEGER,
    textbook TEXT,
    FOREIGN KEY(meaning_id) REFERENCES meanings(id)
  );

  CREATE TABLE IF NOT EXISTS content_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER,
    meaning_id INTEGER, -- NULL for word-level content like mnemonics
    dimension TEXT, -- 'chunk', 'sentence', 'mnemonic'
    content TEXT, -- The main content (or JSON for mnemonic)
    content_extra TEXT, -- Translation or teacher_script
    prompt_version_id INTEGER,
    retry_count INTEGER DEFAULT 0,
    confidence REAL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(word_id) REFERENCES words(id),
    FOREIGN KEY(meaning_id) REFERENCES meanings(id)
  );

  CREATE TABLE IF NOT EXISTS quality_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER,
    field TEXT,
    failed_step TEXT,
    issue TEXT,
    retry_count INTEGER DEFAULT 0,
    FOREIGN KEY(word_id) REFERENCES words(id)
  );

  CREATE INDEX IF NOT EXISTS idx_words_status ON words(status);
  CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
  CREATE INDEX IF NOT EXISTS idx_words_batch ON words(batch_id);
  CREATE INDEX IF NOT EXISTS idx_meanings_word ON meanings(word_id);
  CREATE INDEX IF NOT EXISTS idx_sources_meaning ON sources(meaning_id);
  CREATE INDEX IF NOT EXISTS idx_content_word ON content_items(word_id, dimension);
  CREATE INDEX IF NOT EXISTS idx_content_meaning ON content_items(meaning_id, dimension);
  CREATE INDEX IF NOT EXISTS idx_issues_word ON quality_issues(word_id);
`);

// Initial Data Seed
const checkData = db.prepare("SELECT COUNT(*) as count FROM words").get();
if (checkData.count === 0) {
  const insertWord = db.prepare("INSERT INTO words (word, syllables, ipa, grade_level, status, repair_attempts) VALUES (?, ?, ?, ?, ?, ?)");
  const insertMeaning = db.prepare("INSERT INTO meanings (word_id, pos, definition) VALUES (?, ?, ?)");
  const insertSource = db.prepare("INSERT INTO sources (meaning_id, textbook) VALUES (?, ?)");
  const insertContent = db.prepare("INSERT INTO content_items (word_id, meaning_id, dimension, content, content_extra, status) VALUES (?, ?, ?, ?, ?, ?)");
  const insertIssue = db.prepare("INSERT INTO quality_issues (word_id, field, failed_step, issue) VALUES (?, ?, ?, ?)");

  db.transaction(() => {
    // 示例 1: empathy
    const empathyId = insertWord.run('empathy', 'em·pa·thy', '/ˈem.pə.θi/', '九年级', 'pending', 1).lastInsertRowid;
    const m1 = insertMeaning.run(empathyId, 'n.', '共情；同理心').lastInsertRowid;
    insertSource.run(m1, '人教版九年级英语全一册');
    insertContent.run(empathyId, m1, 'chunk', 'show empathy for', null, 'approved');
    insertContent.run(empathyId, m1, 'sentence', 'A good friend always shows empathy for others even when they are busy with their own problems.', '好朋友总是对他人表现出同理心，即使他们正忙于自己的问题。', 'pending');
    insertContent.run(empathyId, null, 'mnemonic', JSON.stringify({
      type: '词根词缀',
      formula: 'em(进入) + path(感受) + y(名词后缀)',
      rhyme: '进入别人的感受，就是同理心'
    }), '同学们看这个词：empathy...', 'approved');
    insertIssue.run(empathyId, 'sentence', 'Gate 3', '例句字数超标 (18+ 词)');

    // 示例 2: kind (两个义项：adj. 友好的 + n. 种类，词中词助记)
    const kindId = insertWord.run('kind', 'kind', '/kaɪnd/', '七年级', 'pending', 1).lastInsertRowid;
    const m2_1 = insertMeaning.run(kindId, 'adj.', '友好的').lastInsertRowid;
    insertSource.run(m2_1, '人教版七年级英语上册（衔接小学）');
    insertContent.run(kindId, m2_1, 'chunk', 'be kind to sb.', null, 'approved');
    insertContent.run(kindId, m2_1, 'sentence', 'The teacher is always kind to every student.', '老师对每位同学总是很友好。', 'approved');
    
    const m2_2 = insertMeaning.run(kindId, 'n.', '种类').lastInsertRowid;
    insertSource.run(m2_2, '人教版八年级英语下册');
    insertContent.run(kindId, m2_2, 'chunk', 'a kind of', null, 'approved');
    insertContent.run(kindId, m2_2, 'sentence', 'There are many kinds of animals in the zoo.', '动物园里有很多种动物。', 'approved');
    
    insertContent.run(kindId, null, 'mnemonic', JSON.stringify({
      type: '词中词',
      formula: 'kind = king(国王) - g + d',
      rhyme: '国王换一个字母就变友好'
    }), '同学们，kind 这个词你们都认识...', 'pending');
    insertIssue.run(kindId, 'mnemonic', 'Gate 2', '助记逻辑不通顺');

    // 示例 3: beautiful (多来源合并，词根词缀助记)
    const beauId = insertWord.run('beautiful', 'beau·ti·ful', '/ˈbjuː.tɪ.fəl/', '七年级', 'pending', 1).lastInsertRowid;
    const m3 = insertMeaning.run(beauId, 'adj.', '美丽的；漂亮的').lastInsertRowid;
    insertSource.run(m3, '人教版七年级英语上册（衔接小学）');
    insertSource.run(m3, '人教版八年级英语上册');
    insertContent.run(beauId, m3, 'chunk', 'a beautiful day', null, 'approved');
    insertContent.run(beauId, m3, 'sentence', 'What a beautiful day it is today!', '今天天气真好！', 'approved');
    insertContent.run(beauId, null, 'mnemonic', JSON.stringify({
      type: '词根词缀',
      formula: 'beauty(美) + ful(充满...的)',
      rhyme: '充满美的，就是美丽的'
    }), '同学们，beautiful 这个词...', 'pending');
    insertIssue.run(beauId, 'mnemonic', 'Gate 2', '助记公式有误');

    // 示例 4: a (极短基础词，助记留空)
    const aId = insertWord.run('a', 'a', '/eɪ/', '三年级', 'pending', 1).lastInsertRowid;
    const m4 = insertMeaning.run(aId, 'art.', '一个（用于辅音音素开头的单词前）').lastInsertRowid;
    insertSource.run(m4, '人教版三年级英语上册(PEP)');
    insertContent.run(aId, m4, 'chunk', 'a book', null, 'approved');
    insertContent.run(aId, m4, 'sentence', 'I have a cat at home.', '我家里有一只猫。', 'approved');
    insertIssue.run(aId, 'definition', 'Gate 1', '释义描述不准确');
    // Mnemonic is null for 'a'

    // 示例 5: good
    const goodId = insertWord.run('good', 'good', '/ɡʊd/', '三年级', 'pending', 2).lastInsertRowid;
    const m5_1 = insertMeaning.run(goodId, 'adj.', '好的').lastInsertRowid;
    insertSource.run(m5_1, '人教版三年级英语上册(PEP)');
    insertSource.run(m5_1, '人教版七年级英语上册（衔接小学）');
    insertContent.run(goodId, m5_1, 'chunk', 'be good at', null, 'approved');
    insertContent.run(goodId, m5_1, 'sentence', 'She is good at math and science.', '她擅长数学和科学。', 'approved');
    
    const m5_2 = insertMeaning.run(goodId, 'n.', '货物；商品').lastInsertRowid;
    insertSource.run(m5_2, '人教版八年级英语下册');
    insertContent.run(goodId, m5_2, 'chunk', 'a piece of goods', null, 'approved');
    insertContent.run(goodId, m5_2, 'sentence', 'The shop sells all kinds of goods.', '这家商店出售各种商品。', 'approved');
    
    insertContent.run(goodId, null, 'mnemonic', JSON.stringify({
      type: '谐音',
      formula: 'good ≈ 咕嘟',
      rhyme: '肚子咕嘟咕嘟，吃饱了感觉很好'
    }), '同学们，good 这个词...', 'pending');
    insertIssue.run(goodId, 'mnemonic', 'Gate 2', '助记逻辑不通顺');

    // 示例 6: apple (must manual)
    const appleId = insertWord.run('apple', 'ap·ple', '/ˈæp.əl/', '三年级', 'pending', 3).lastInsertRowid;
    const m6 = insertMeaning.run(appleId, 'n.', '苹果').lastInsertRowid;
    insertContent.run(appleId, m6, 'chunk', 'a red apple', null, 'pending');
    insertContent.run(appleId, m6, 'sentence', 'I like eating apples.', '我喜欢吃苹果。', 'approved');
    insertIssue.run(appleId, 'chunk', 'Gate 1', '语块过于简单，建议增加修饰词');

    // Realistic vocabulary pool with multi-meaning support
    const vocabPool = [
      { word: 'run', syllables: 'run', ipa: '/rʌn/', grade: '七年级', meanings: [
        { pos: 'v.', def: '跑；奔跑', source: '人教版七年级英语上册（衔接小学）', chunk: 'run fast', sentence: 'He runs to school every morning.', sentence_cn: '他每天早上跑步去学校。' },
        { pos: 'v.', def: '经营；管理', source: '人教版九年级英语全一册', chunk: 'run a business', sentence: 'She runs a small coffee shop downtown.', sentence_cn: '她在市中心经营一家小咖啡馆。' },
        { pos: 'n.', def: '奔跑；一段路程', source: '人教版八年级英语上册', chunk: 'go for a run', sentence: 'I went for a run in the park.', sentence_cn: '我去公园跑了一圈。' },
      ], mnemonic: { type: '联想', formula: 'run → 润(谐音)', rhyme: '润滑地跑起来，跑得快又远' } },
      { word: 'light', syllables: 'light', ipa: '/laɪt/', grade: '七年级', meanings: [
        { pos: 'n.', def: '光；灯光', source: '人教版七年级英语上册（衔接小学）', chunk: 'turn on the light', sentence: 'Please turn on the light.', sentence_cn: '请把灯打开。' },
        { pos: 'adj.', def: '轻的；浅色的', source: '人教版八年级英语上册', chunk: 'light blue', sentence: 'She wore a light blue dress.', sentence_cn: '她穿了一件浅蓝色的裙子。' },
        { pos: 'v.', def: '点燃；照亮', source: '人教版九年级英语全一册', chunk: 'light a candle', sentence: 'He lit a candle in the dark room.', sentence_cn: '他在黑暗的房间里点了一支蜡烛。' },
      ], mnemonic: { type: '词根', formula: 'light = 光/轻 (多义核心)', rhyme: '光是轻的，所以light既是光又是轻' } },
      { word: 'play', syllables: 'play', ipa: '/pleɪ/', grade: '三年级', meanings: [
        { pos: 'v.', def: '玩；做游戏', source: '人教版三年级英语上册(PEP)', chunk: 'play with friends', sentence: 'Children love to play in the park.', sentence_cn: '孩子们喜欢在公园里玩。' },
        { pos: 'v.', def: '演奏；弹奏', source: '人教版七年级英语上册（衔接小学）', chunk: 'play the piano', sentence: 'She plays the piano beautifully.', sentence_cn: '她钢琴弹得很优美。' },
        { pos: 'n.', def: '戏剧；话剧', source: '人教版九年级英语全一册', chunk: 'put on a play', sentence: 'We watched a play at the theater.', sentence_cn: '我们在剧院看了一出话剧。' },
      ], mnemonic: { type: '联想', formula: 'play ≈ 玩乐', rhyme: '玩耍弹琴看话剧，play全搞定' } },
      { word: 'book', syllables: 'book', ipa: '/bʊk/', grade: '三年级', meanings: [
        { pos: 'n.', def: '书；书籍', source: '人教版三年级英语上册(PEP)', chunk: 'read a book', sentence: 'I read a book every night.', sentence_cn: '我每天晚上都读一本书。' },
        { pos: 'v.', def: '预订；预约', source: '人教版八年级英语下册', chunk: 'book a ticket', sentence: 'We need to book the tickets early.', sentence_cn: '我们需要提前订票。' },
      ], mnemonic: { type: '谐音', formula: 'book ≈ 不可(谐音)', rhyme: '好书不可不读' } },
      { word: 'change', syllables: 'change', ipa: '/tʃeɪndʒ/', grade: '七年级', meanings: [
        { pos: 'v.', def: '改变；变化', source: '人教版七年级英语下册', chunk: 'change the world', sentence: 'Technology can change our lives.', sentence_cn: '科技可以改变我们的生活。' },
        { pos: 'n.', def: '零钱；找零', source: '人教版八年级英语上册', chunk: 'keep the change', sentence: 'Here is your change, sir.', sentence_cn: '这是您的找零，先生。' },
      ], mnemonic: { type: '词根', formula: 'change = 变', rhyme: '零钱也是把大钱变小钱' } },
      { word: 'watch', syllables: 'watch', ipa: '/wɒtʃ/', grade: '四年级', meanings: [
        { pos: 'v.', def: '观看；注视', source: '人教版四年级英语下册(PEP)', chunk: 'watch TV', sentence: 'We like to watch movies together.', sentence_cn: '我们喜欢一起看电影。' },
        { pos: 'n.', def: '手表', source: '人教版七年级英语上册（衔接小学）', chunk: 'a gold watch', sentence: 'He looked at his watch nervously.', sentence_cn: '他紧张地看了看手表。' },
      ], mnemonic: { type: '联想', formula: 'watch → 看表', rhyme: '看(watch)手表(watch)，一词两用' } },
      { word: 'spring', syllables: 'spring', ipa: '/sprɪŋ/', grade: '四年级', meanings: [
        { pos: 'n.', def: '春天', source: '人教版四年级英语下册(PEP)', chunk: 'in spring', sentence: 'Flowers bloom in spring.', sentence_cn: '花朵在春天绽放。' },
        { pos: 'n.', def: '泉水；弹簧', source: '人教版八年级英语下册', chunk: 'a hot spring', sentence: 'There is a hot spring near the mountain.', sentence_cn: '山附近有一个温泉。' },
        { pos: 'v.', def: '跳；弹起', source: '人教版九年级英语全一册', chunk: 'spring up', sentence: 'The cat sprang up onto the table.', sentence_cn: '猫跳上了桌子。' },
      ], mnemonic: { type: '联想', formula: 'spring = 弹(泉水涌/弹簧弹) + 春天', rhyme: '春天万物弹跳着冒出来' } },
      { word: 'present', syllables: 'pres·ent', ipa: '/ˈprez.ənt/', grade: '七年级', meanings: [
        { pos: 'n.', def: '礼物', source: '人教版七年级英语上册（衔接小学）', chunk: 'a birthday present', sentence: 'She gave me a present for my birthday.', sentence_cn: '她送我一份生日礼物。' },
        { pos: 'adj.', def: '在场的；目前的', source: '人教版八年级英语上册', chunk: 'be present at', sentence: 'All students were present at the meeting.', sentence_cn: '所有学生都出席了会议。' },
        { pos: 'v.', def: '展示；呈现', source: '人教版九年级英语全一册', chunk: 'present an idea', sentence: 'He presented his project to the class.', sentence_cn: '他向全班展示了他的项目。' },
      ], mnemonic: { type: '词根', formula: 'pre(前面) + sent(送)', rhyme: '送到面前，就是礼物和展示' } },
      { word: 'train', syllables: 'train', ipa: '/treɪn/', grade: '四年级', meanings: [
        { pos: 'n.', def: '火车', source: '人教版四年级英语上册(PEP)', chunk: 'by train', sentence: 'We traveled to Beijing by train.', sentence_cn: '我们坐火车去了北京。' },
        { pos: 'v.', def: '训练；培训', source: '人教版八年级英语上册', chunk: 'train hard', sentence: 'Athletes train hard every day.', sentence_cn: '运动员每天刻苦训练。' },
      ], mnemonic: { type: '联想', formula: 'train ≈ 拽(谐音)', rhyme: '火车拽着车厢跑，运动员被教练拽着练' } },
      { word: 'match', syllables: 'match', ipa: '/mætʃ/', grade: '七年级', meanings: [
        { pos: 'n.', def: '比赛；竞赛', source: '人教版七年级英语下册', chunk: 'a football match', sentence: 'We won the football match yesterday.', sentence_cn: '我们昨天赢了足球比赛。' },
        { pos: 'n.', def: '火柴', source: '人教版八年级英语上册', chunk: 'strike a match', sentence: 'He struck a match to see in the dark.', sentence_cn: '他在黑暗中划了一根火柴。' },
        { pos: 'v.', def: '匹配；搭配', source: '人教版八年级英语下册', chunk: 'match with', sentence: 'This tie matches your shirt perfectly.', sentence_cn: '这条领带和你的衬衫很搭配。' },
      ], mnemonic: { type: '联想', formula: 'match = 比赛/火柴/匹配', rhyme: '比赛点火柴，看谁更匹配' } },
      { word: 'interest', syllables: 'in·ter·est', ipa: '/ˈɪn.trəst/', grade: '七年级', meanings: [
        { pos: 'n.', def: '兴趣；爱好', source: '人教版七年级英语下册', chunk: 'show interest in', sentence: 'She shows great interest in music.', sentence_cn: '她对音乐很感兴趣。' },
        { pos: 'n.', def: '利息', source: '人教版九年级英语全一册', chunk: 'earn interest', sentence: 'The bank pays interest on savings.', sentence_cn: '银行对存款支付利息。' },
        { pos: 'v.', def: '使感兴趣', source: '人教版八年级英语上册', chunk: 'interest sb. in sth.', sentence: 'The topic interested everyone in class.', sentence_cn: '这个话题引起了全班的兴趣。' },
      ], mnemonic: { type: '词根', formula: 'inter(之间) + est(存在)', rhyme: '存在于心中的，就是你的兴趣' } },
      { word: 'cool', syllables: 'cool', ipa: '/kuːl/', grade: '四年级', meanings: [
        { pos: 'adj.', def: '凉爽的', source: '人教版四年级英语上册(PEP)', chunk: 'cool weather', sentence: 'It is cool in autumn.', sentence_cn: '秋天天气凉爽。' },
        { pos: 'adj.', def: '酷的；很棒的', source: '人教版七年级英语上册（衔接小学）', chunk: "That's cool!", sentence: 'Your new jacket is so cool!', sentence_cn: '你的新夹克太酷了！' },
      ], mnemonic: { type: '谐音', formula: 'cool ≈ 酷', rhyme: '凉爽才酷，酷就是cool' } },
      { word: 'right', syllables: 'right', ipa: '/raɪt/', grade: '四年级', meanings: [
        { pos: 'adj.', def: '正确的', source: '人教版四年级英语下册(PEP)', chunk: "That's right", sentence: "You are right about the answer.", sentence_cn: '你的答案是正确的。' },
        { pos: 'n.', def: '右边', source: '人教版四年级英语上册(PEP)', chunk: 'on the right', sentence: 'Turn right at the corner.', sentence_cn: '在拐角处右转。' },
        { pos: 'n.', def: '权利', source: '人教版九年级英语全一册', chunk: 'human rights', sentence: 'Everyone has the right to education.', sentence_cn: '每个人都有受教育的权利。' },
      ], mnemonic: { type: '联想', formula: 'right = 右/对/权利', rhyme: '右手写对字，争取权利' } },
      { word: 'leave', syllables: 'leave', ipa: '/liːv/', grade: '七年级', meanings: [
        { pos: 'v.', def: '离开；出发', source: '人教版七年级英语下册', chunk: 'leave for', sentence: 'He will leave for London tomorrow.', sentence_cn: '他明天出发去伦敦。' },
        { pos: 'v.', def: '留下；遗留', source: '人教版八年级英语上册', chunk: 'leave a message', sentence: 'Please leave a message after the beep.', sentence_cn: '请在嘀声后留言。' },
        { pos: 'n.', def: '假期；休假', source: '人教版九年级英语全一册', chunk: 'on leave', sentence: 'The soldier is on leave this week.', sentence_cn: '那个士兵这周在休假。' },
      ], mnemonic: { type: '联想', formula: 'leave ≈ 离(谐音)', rhyme: '离开去休假，留下一封信' } },
      { word: 'mean', syllables: 'mean', ipa: '/miːn/', grade: '七年级', meanings: [
        { pos: 'v.', def: '意思是；意味着', source: '人教版七年级英语上册（衔接小学）', chunk: 'What does it mean?', sentence: 'What does this word mean?', sentence_cn: '这个单词是什么意思？' },
        { pos: 'adj.', def: '吝啬的；刻薄的', source: '人教版八年级英语下册', chunk: 'be mean to sb.', sentence: "Don't be so mean to your sister.", sentence_cn: '不要对你妹妹那么刻薄。' },
      ], mnemonic: { type: '谐音', formula: 'mean ≈ 闷(谐音)', rhyme: '闷闷不乐地想意思，太吝啬' } },
      { word: 'point', syllables: 'point', ipa: '/pɔɪnt/', grade: '七年级', meanings: [
        { pos: 'n.', def: '要点；观点', source: '人教版八年级英语上册', chunk: 'make a point', sentence: 'She made an excellent point in the debate.', sentence_cn: '她在辩论中提出了一个很好的观点。' },
        { pos: 'v.', def: '指向；指出', source: '人教版七年级英语下册', chunk: 'point at', sentence: 'He pointed at the map and explained.', sentence_cn: '他指着地图解释。' },
        { pos: 'n.', def: '分数；得分', source: '人教版八年级英语下册', chunk: 'score points', sentence: 'Our team scored 3 points in the game.', sentence_cn: '我们队在比赛中得了3分。' },
      ], mnemonic: { type: '联想', formula: 'point = 点', rhyme: '用手指点出要点，得到分数' } },
      { word: 'drive', syllables: 'drive', ipa: '/draɪv/', grade: '七年级', meanings: [
        { pos: 'v.', def: '驾驶；开车', source: '人教版七年级英语下册', chunk: 'drive a car', sentence: 'My father drives to work every day.', sentence_cn: '我爸爸每天开车上班。' },
        { pos: 'n.', def: '驱动器；硬盘', source: '人教版九年级英语全一册', chunk: 'a hard drive', sentence: 'Save the file to the hard drive.', sentence_cn: '把文件保存到硬盘上。' },
        { pos: 'v.', def: '驱使；迫使', source: '人教版九年级英语全一册', chunk: 'drive sb. crazy', sentence: 'The loud noise drove me crazy.', sentence_cn: '噪音快把我逼疯了。' },
      ], mnemonic: { type: '联想', formula: 'drive ≈ 拽(发力)', rhyme: '用力拽方向盘就是开车' } },
      { word: 'fall', syllables: 'fall', ipa: '/fɔːl/', grade: '四年级', meanings: [
        { pos: 'v.', def: '落下；跌倒', source: '人教版七年级英语上册（衔接小学）', chunk: 'fall down', sentence: 'Leaves fall from the trees in autumn.', sentence_cn: '秋天树叶从树上落下。' },
        { pos: 'n.', def: '秋天（美式）', source: '人教版四年级英语上册(PEP)', chunk: 'in the fall', sentence: 'We go apple picking in the fall.', sentence_cn: '我们秋天去摘苹果。' },
        { pos: 'n.', def: '瀑布', source: '人教版八年级英语下册', chunk: 'Niagara Falls', sentence: 'We visited Niagara Falls last summer.', sentence_cn: '我们去年夏天参观了尼亚加拉瀑布。' },
      ], mnemonic: { type: '联想', formula: 'fall = 落', rhyme: '秋天(fall)树叶落(fall)，瀑布也在落' } },
      { word: 'work', syllables: 'work', ipa: '/wɜːk/', grade: '四年级', meanings: [
        { pos: 'v.', def: '工作', source: '人教版四年级英语下册(PEP)', chunk: 'work hard', sentence: 'She works hard every day.', sentence_cn: '她每天努力工作。' },
        { pos: 'n.', def: '作品；著作', source: '人教版九年级英语全一册', chunk: 'a work of art', sentence: 'This painting is a great work of art.', sentence_cn: '这幅画是一件伟大的艺术作品。' },
        { pos: 'v.', def: '起作用；有效', source: '人教版八年级英语上册', chunk: 'It works!', sentence: 'The medicine works quickly.', sentence_cn: '这种药见效很快。' },
      ], mnemonic: { type: '谐音', formula: 'work ≈ 我磕(谐音)', rhyme: '我磕头都要去工作' } },
      { word: 'mind', syllables: 'mind', ipa: '/maɪnd/', grade: '七年级', meanings: [
        { pos: 'n.', def: '头脑；思维', source: '人教版七年级英语下册', chunk: 'make up one\'s mind', sentence: 'She has a brilliant mind.', sentence_cn: '她有聪明的头脑。' },
        { pos: 'v.', def: '介意；在乎', source: '人教版八年级英语上册', chunk: 'Do you mind?', sentence: 'Would you mind opening the window?', sentence_cn: '你介意打开窗户吗？' },
      ], mnemonic: { type: '联想', formula: 'mind ≈ 脑(想)', rhyme: '用脑子想，才不会介意' } },
      { word: 'miss', syllables: 'miss', ipa: '/mɪs/', grade: '四年级', meanings: [
        { pos: 'v.', def: '想念；思念', source: '人教版七年级英语上册（衔接小学）', chunk: 'miss sb.', sentence: 'I miss my grandparents very much.', sentence_cn: '我非常想念我的祖父母。' },
        { pos: 'v.', def: '错过；未赶上', source: '人教版八年级英语上册', chunk: 'miss the bus', sentence: 'I missed the bus this morning.', sentence_cn: '我今天早上错过了公交车。' },
        { pos: 'n.', def: '女士（称呼）', source: '人教版四年级英语上册(PEP)', chunk: 'Miss Wang', sentence: 'Miss Wang is our English teacher.', sentence_cn: '王老师是我们的英语老师。' },
      ], mnemonic: { type: '联想', formula: 'miss = 想/错过/小姐', rhyme: '想念小姐姐，错过了就后悔' } },
      { word: 'close', syllables: 'close', ipa: '/kləʊz/', grade: '四年级', meanings: [
        { pos: 'v.', def: '关闭', source: '人教版四年级英语上册(PEP)', chunk: 'close the door', sentence: 'Please close the door when you leave.', sentence_cn: '离开时请关上门。' },
        { pos: 'adj.', def: '亲密的；近的', source: '人教版八年级英语上册', chunk: 'a close friend', sentence: 'Tom is my closest friend.', sentence_cn: '汤姆是我最亲密的朋友。' },
      ], mnemonic: { type: '联想', formula: 'close = 关/近', rhyme: '关上门才能和亲密的人说悄悄话' } },
      { word: 'express', syllables: 'ex·press', ipa: '/ɪkˈspres/', grade: '八年级', meanings: [
        { pos: 'v.', def: '表达；表示', source: '人教版八年级英语下册', chunk: 'express feelings', sentence: 'Music helps us express our feelings.', sentence_cn: '音乐帮助我们表达情感。' },
        { pos: 'adj.', def: '快速的；特快的', source: '人教版九年级英语全一册', chunk: 'express delivery', sentence: 'I sent the package by express delivery.', sentence_cn: '我通过快递寄了这个包裹。' },
        { pos: 'n.', def: '快车；快递', source: '人教版九年级英语全一册', chunk: 'the express', sentence: 'Take the express to get there faster.', sentence_cn: '坐快车能更快到达那里。' },
      ], mnemonic: { type: '词根', formula: 'ex(出) + press(压)', rhyme: '把内心的感觉压出来就是表达' } },
      { word: 'object', syllables: 'ob·ject', ipa: '/ˈɒb.dʒɪkt/', grade: '八年级', meanings: [
        { pos: 'n.', def: '物体；对象', source: '人教版八年级英语上册', chunk: 'a flying object', sentence: 'The telescope can detect distant objects.', sentence_cn: '望远镜可以探测到遥远的物体。' },
        { pos: 'v.', def: '反对；抗议', source: '人教版九年级英语全一册', chunk: 'object to', sentence: 'Many people objected to the new plan.', sentence_cn: '很多人反对这个新计划。' },
      ], mnemonic: { type: '词根', formula: 'ob(朝向) + ject(扔)', rhyme: '朝着你扔东西，就是反对你' } },
      { word: 'record', syllables: 'rec·ord', ipa: '/ˈrek.ɔːd/', grade: '八年级', meanings: [
        { pos: 'n.', def: '记录；唱片', source: '人教版八年级英语上册', chunk: 'break a record', sentence: 'She broke the world record in swimming.', sentence_cn: '她打破了游泳世界纪录。' },
        { pos: 'v.', def: '录制；记录', source: '人教版八年级英语下册', chunk: 'record a video', sentence: 'I recorded a video of the concert.', sentence_cn: '我录了一段音乐会的视频。' },
      ], mnemonic: { type: '词根', formula: 're(再) + cord(心)', rhyme: '再次记在心上，就是记录' } },
      { word: 'cross', syllables: 'cross', ipa: '/krɒs/', grade: '七年级', meanings: [
        { pos: 'v.', def: '穿过；横过', source: '人教版七年级英语下册', chunk: 'cross the road', sentence: 'Look both ways before you cross the road.', sentence_cn: '过马路前要左右看。' },
        { pos: 'n.', def: '十字形；叉号', source: '人教版八年级英语上册', chunk: 'the Red Cross', sentence: 'The Red Cross helps people in need.', sentence_cn: '红十字会帮助有需要的人。' },
        { pos: 'adj.', def: '生气的', source: '人教版八年级英语下册', chunk: 'be cross with', sentence: "Don't be cross with me.", sentence_cn: '别生我的气。' },
      ], mnemonic: { type: '联想', formula: 'cross = 交叉', rhyme: '交叉过马路时别生气' } },
      { word: 'bear', syllables: 'bear', ipa: '/beər/', grade: '四年级', meanings: [
        { pos: 'n.', def: '熊', source: '人教版四年级英语上册(PEP)', chunk: 'a polar bear', sentence: 'The bear is sleeping in the cave.', sentence_cn: '熊在洞穴里睡觉。' },
        { pos: 'v.', def: '承受；忍受', source: '人教版九年级英语全一册', chunk: "can't bear", sentence: "I can't bear the cold weather.", sentence_cn: '我受不了寒冷的天气。' },
      ], mnemonic: { type: '联想', formula: 'bear = 熊/忍受', rhyme: '像熊一样强壮才能忍受一切' } },
      { word: 'content', syllables: 'con·tent', ipa: '/ˈkɒn.tent/', grade: '八年级', meanings: [
        { pos: 'n.', def: '内容；目录', source: '人教版八年级英语上册', chunk: 'table of contents', sentence: 'Check the contents of the book.', sentence_cn: '查看这本书的目录。' },
        { pos: 'adj.', def: '满意的；满足的', source: '人教版九年级英语全一册', chunk: 'be content with', sentence: 'She is content with her simple life.', sentence_cn: '她满足于自己简单的生活。' },
      ], mnemonic: { type: '词根', formula: 'con(共同) + tent(包含)', rhyme: '共同包含的东西就是内容，有内容就满足' } },
      { word: 'subject', syllables: 'sub·ject', ipa: '/ˈsʌb.dʒɪkt/', grade: '七年级', meanings: [
        { pos: 'n.', def: '科目；学科', source: '人教版七年级英语上册（衔接小学）', chunk: 'favorite subject', sentence: 'Math is my favorite subject.', sentence_cn: '数学是我最喜欢的科目。' },
        { pos: 'n.', def: '主题；话题', source: '人教版八年级英语下册', chunk: 'change the subject', sentence: "Let's change the subject.", sentence_cn: '我们换个话题吧。' },
      ], mnemonic: { type: '词根', formula: 'sub(下) + ject(扔)', rhyme: '扔到课堂下面学的就是科目' } },
      { word: 'pick', syllables: 'pick', ipa: '/pɪk/', grade: '七年级', meanings: [
        { pos: 'v.', def: '采摘；挑选', source: '人教版七年级英语下册', chunk: 'pick flowers', sentence: 'We picked strawberries at the farm.', sentence_cn: '我们在农场摘了草莓。' },
        { pos: 'v.', def: '接人', source: '人教版八年级英语上册', chunk: 'pick sb. up', sentence: 'Mom will pick me up after school.', sentence_cn: '妈妈放学后会来接我。' },
      ], mnemonic: { type: '谐音', formula: 'pick ≈ 劈开(挑选)', rhyme: '劈开一堆里挑选最好的' } },
      { word: 'rest', syllables: 'rest', ipa: '/rest/', grade: '七年级', meanings: [
        { pos: 'v.', def: '休息', source: '人教版七年级英语下册', chunk: 'have a rest', sentence: 'You should rest after a long day.', sentence_cn: '忙了一天你应该休息一下。' },
        { pos: 'n.', def: '其余的；剩余部分', source: '人教版八年级英语上册', chunk: 'the rest of', sentence: 'I ate some and saved the rest for later.', sentence_cn: '我吃了一些，剩下的留着以后吃。' },
      ], mnemonic: { type: '联想', formula: 'rest = 休息/剩余', rhyme: '做完剩余的事就可以休息了' } },
      { word: 'well', syllables: 'well', ipa: '/wel/', grade: '三年级', meanings: [
        { pos: 'adv.', def: '好地；令人满意地', source: '人教版三年级英语上册(PEP)', chunk: 'do well', sentence: 'She sings very well.', sentence_cn: '她唱歌唱得很好。' },
        { pos: 'n.', def: '井；水井', source: '人教版八年级英语下册', chunk: 'a deep well', sentence: 'The village has an old stone well.', sentence_cn: '村子里有一口古老的石井。' },
        { pos: 'adj.', def: '健康的', source: '人教版七年级英语上册（衔接小学）', chunk: 'get well soon', sentence: 'I hope you get well soon.', sentence_cn: '希望你早日康复。' },
      ], mnemonic: { type: '联想', formula: 'well = 好/井/健康', rhyme: '喝井水喝好了，身体就健康' } },
      { word: 'company', syllables: 'com·pa·ny', ipa: '/ˈkʌm.pə.ni/', grade: '八年级', meanings: [
        { pos: 'n.', def: '公司；企业', source: '人教版八年级英语上册', chunk: 'a big company', sentence: 'He works for a tech company.', sentence_cn: '他在一家科技公司工作。' },
        { pos: 'n.', def: '陪伴；同伴', source: '人教版九年级英语全一册', chunk: 'keep sb. company', sentence: 'The dog keeps her company at home.', sentence_cn: '狗在家里陪伴她。' },
      ], mnemonic: { type: '词根', formula: 'com(共同) + pan(面包) + y', rhyme: '一起分面包的同伴，组成公司' } },
      { word: 'park', syllables: 'park', ipa: '/pɑːk/', grade: '三年级', meanings: [
        { pos: 'n.', def: '公园', source: '人教版三年级英语上册(PEP)', chunk: 'in the park', sentence: 'We play in the park every weekend.', sentence_cn: '我们每个周末在公园里玩。' },
        { pos: 'v.', def: '停车', source: '人教版八年级英语上册', chunk: 'park the car', sentence: 'You can park your car over there.', sentence_cn: '你可以把车停在那边。' },
      ], mnemonic: { type: '联想', formula: 'park = 公园/停车', rhyme: '把车停(park)在公园(park)里' } },
      { word: 'deal', syllables: 'deal', ipa: '/diːl/', grade: '八年级', meanings: [
        { pos: 'v.', def: '处理；应对', source: '人教版八年级英语下册', chunk: 'deal with', sentence: 'We need to deal with this problem.', sentence_cn: '我们需要处理这个问题。' },
        { pos: 'n.', def: '交易；协议', source: '人教版九年级英语全一册', chunk: 'make a deal', sentence: "It's a deal!", sentence_cn: '一言为定！' },
      ], mnemonic: { type: '谐音', formula: 'deal ≈ 抵了(谐音)', rhyme: '处理完就抵了一笔交易' } },
      { word: 'flat', syllables: 'flat', ipa: '/flæt/', grade: '八年级', meanings: [
        { pos: 'adj.', def: '平的；平坦的', source: '人教版八年级英语上册', chunk: 'a flat surface', sentence: 'The road here is very flat.', sentence_cn: '这里的路非常平坦。' },
        { pos: 'n.', def: '公寓（英式）', source: '人教版八年级英语下册', chunk: 'a small flat', sentence: 'They live in a flat near the school.', sentence_cn: '他们住在学校附近的一套公寓。' },
      ], mnemonic: { type: '联想', formula: 'flat = 平的/公寓', rhyme: '公寓的地板是平的' } },
      { word: 'stick', syllables: 'stick', ipa: '/stɪk/', grade: '七年级', meanings: [
        { pos: 'n.', def: '棍子；棒', source: '人教版七年级英语下册', chunk: 'a walking stick', sentence: 'The old man walks with a stick.', sentence_cn: '老人拄着拐杖走路。' },
        { pos: 'v.', def: '粘贴；坚持', source: '人教版八年级英语上册', chunk: 'stick to', sentence: 'Stick to your plan and never give up.', sentence_cn: '坚持你的计划，永不放弃。' },
      ], mnemonic: { type: '联想', formula: 'stick = 棍/粘/坚持', rhyme: '用棍子粘住目标就是坚持' } },
      { word: 'address', syllables: 'ad·dress', ipa: '/əˈdres/', grade: '七年级', meanings: [
        { pos: 'n.', def: '地址', source: '人教版七年级英语上册（衔接小学）', chunk: 'home address', sentence: "What's your home address?", sentence_cn: '你的家庭住址是什么？' },
        { pos: 'v.', def: '处理；解决', source: '人教版九年级英语全一册', chunk: 'address a problem', sentence: 'The teacher addressed the issue carefully.', sentence_cn: '老师认真处理了这个问题。' },
      ], mnemonic: { type: '词根', formula: 'ad(朝向) + dress(穿戴)', rhyme: '穿戴整齐地去到一个地址' } },
      { word: 'live', syllables: 'live', ipa: '/lɪv/', grade: '三年级', meanings: [
        { pos: 'v.', def: '居住；生活', source: '人教版三年级英语上册(PEP)', chunk: 'live in', sentence: 'I live in a small town.', sentence_cn: '我住在一个小镇上。' },
        { pos: 'adj.', def: '现场的；直播的', source: '人教版九年级英语全一册', chunk: 'a live concert', sentence: 'We watched a live concert online.', sentence_cn: '我们在网上看了一场直播音乐会。' },
      ], mnemonic: { type: '联想', formula: 'live = 住/活/现场', rhyme: '活着住在现场看直播' } },
      { word: 'figure', syllables: 'fig·ure', ipa: '/ˈfɪɡ.ər/', grade: '八年级', meanings: [
        { pos: 'n.', def: '人物；身材', source: '人教版八年级英语下册', chunk: 'a public figure', sentence: 'She is an important figure in history.', sentence_cn: '她是历史上一个重要人物。' },
        { pos: 'n.', def: '数字；图表', source: '人教版九年级英语全一册', chunk: 'figure out', sentence: 'Look at the figures in the chart.', sentence_cn: '看看图表中的数字。' },
        { pos: 'v.', def: '想出；弄明白', source: '人教版九年级英语全一册', chunk: 'figure out', sentence: "I can't figure out this math problem.", sentence_cn: '我想不出这道数学题。' },
      ], mnemonic: { type: '联想', formula: 'figure = 人形/数字/想', rhyme: '人物看着数字在想' } },
      { word: 'last', syllables: 'last', ipa: '/lɑːst/', grade: '四年级', meanings: [
        { pos: 'adj.', def: '最后的；上一个的', source: '人教版四年级英语下册(PEP)', chunk: 'last week', sentence: 'I visited my uncle last weekend.', sentence_cn: '我上个周末去看望了叔叔。' },
        { pos: 'v.', def: '持续；维持', source: '人教版八年级英语上册', chunk: 'last for', sentence: 'The meeting lasted for two hours.', sentence_cn: '会议持续了两个小时。' },
      ], mnemonic: { type: '联想', formula: 'last = 最后/持续', rhyme: '坚持到最后' } },
      { word: 'block', syllables: 'block', ipa: '/blɒk/', grade: '八年级', meanings: [
        { pos: 'n.', def: '街区；大楼', source: '人教版八年级英语上册', chunk: 'walk two blocks', sentence: 'The store is two blocks away.', sentence_cn: '商店在两个街区之外。' },
        { pos: 'v.', def: '阻挡；堵塞', source: '人教版八年级英语下册', chunk: 'block the way', sentence: 'A big truck blocked the road.', sentence_cn: '一辆大卡车堵住了路。' },
      ], mnemonic: { type: '谐音', formula: 'block ≈ 不落(谐音)', rhyme: '不让你落脚，堵住街区' } },
      { word: 'experience', syllables: 'ex·pe·ri·ence', ipa: '/ɪkˈspɪə.ri.əns/', grade: '八年级', meanings: [
        { pos: 'n.', def: '经验；经历', source: '人教版八年级英语下册', chunk: 'work experience', sentence: 'He has rich experience in teaching.', sentence_cn: '他有丰富的教学经验。' },
        { pos: 'v.', def: '体验；经历', source: '人教版九年级英语全一册', chunk: 'experience life', sentence: 'I want to experience different cultures.', sentence_cn: '我想体验不同的文化。' },
      ], mnemonic: { type: '词根', formula: 'ex(出) + peri(尝试) + ence', rhyme: '走出去尝试就是经历' } },
      { word: 'land', syllables: 'land', ipa: '/lænd/', grade: '七年级', meanings: [
        { pos: 'n.', def: '陆地；土地', source: '人教版七年级英语下册', chunk: 'on land', sentence: 'Farmers work on the land.', sentence_cn: '农民在土地上劳作。' },
        { pos: 'v.', def: '着陆；降落', source: '人教版八年级英语上册', chunk: 'land safely', sentence: 'The plane landed safely at the airport.', sentence_cn: '飞机安全降落在机场。' },
      ], mnemonic: { type: '联想', formula: 'land = 陆地/降落', rhyme: '飞机降落在陆地上' } },
      { word: 'second', syllables: 'sec·ond', ipa: '/ˈsek.ənd/', grade: '四年级', meanings: [
        { pos: 'num.', def: '第二的', source: '人教版四年级英语上册(PEP)', chunk: 'the second floor', sentence: 'My classroom is on the second floor.', sentence_cn: '我的教室在二楼。' },
        { pos: 'n.', def: '秒', source: '人教版七年级英语下册', chunk: 'wait a second', sentence: 'Please wait a second.', sentence_cn: '请等一下。' },
      ], mnemonic: { type: '联想', formula: 'second = 第二/秒', rhyme: '第二名只差一秒' } },
      { word: 'cover', syllables: 'cov·er', ipa: '/ˈkʌv.ər/', grade: '七年级', meanings: [
        { pos: 'v.', def: '覆盖；遮盖', source: '人教版七年级英语下册', chunk: 'cover with', sentence: 'Snow covered the ground in winter.', sentence_cn: '冬天雪覆盖了地面。' },
        { pos: 'n.', def: '封面；盖子', source: '人教版八年级英语上册', chunk: 'book cover', sentence: 'I like the cover of this book.', sentence_cn: '我喜欢这本书的封面。' },
      ], mnemonic: { type: '联想', formula: 'cover = 盖/封面', rhyme: '把封面盖上' } },
    ];

    const grades = ['三年级', '四年级', '七年级', '八年级', '九年级'];
    const textbooks: Record<string, string[]> = {
      '三年级': ['人教版三年级英语上册(PEP)', '人教版三年级英语下册(PEP)'],
      '四年级': ['人教版四年级英语上册(PEP)', '人教版四年级英语下册(PEP)'],
      '七年级': ['人教版七年级英语上册（衔接小学）', '人教版七年级英语下册'],
      '八年级': ['人教版八年级英语上册', '人教版八年级英语下册'],
      '九年级': ['人教版九年级英语全一册'],
    };
    const mnemonicTypes = ['词根词缀', '谐音', '联想', '词中词', '故事'];

    for (const v of vocabPool) {
      const status = Math.random() < 0.1 ? 'pending' : 'approved';
      const wId = insertWord.run(v.word, v.syllables, v.ipa, v.grade, status, Math.floor(Math.random() * 3)).lastInsertRowid;
      for (const m of v.meanings) {
        const mId = insertMeaning.run(wId, m.pos, m.def).lastInsertRowid;
        insertSource.run(mId, m.source);
        insertContent.run(wId, mId, 'chunk', m.chunk, null, 'approved');
        insertContent.run(wId, mId, 'sentence', m.sentence, m.sentence_cn, 'approved');
      }
      if (v.mnemonic) {
        insertContent.run(wId, null, 'mnemonic', JSON.stringify(v.mnemonic), null, 'approved');
      }
      if (status === 'pending') {
        insertIssue.run(wId, 'sentence', 'Gate 3', '例句质量待提升');
      }
    }

    // Fill remaining ~1600 words with varied realistic data
    const extraWords = [
      { w: 'happy', s: 'hap·py', ipa: '/ˈhæp.i/', pos: 'adj.', def: '快乐的；幸福的', chunk: 'feel happy', sent: 'I feel happy today.', sent_cn: '我今天感到很快乐。', mn: { formula: 'hap(运气) + py', rhyme: '运气好就快乐' } },
      { w: 'sad', s: 'sad', ipa: '/sæd/', pos: 'adj.', def: '悲伤的', chunk: 'feel sad', sent: 'She felt sad when she heard the news.', sent_cn: '她听到这个消息时很难过。', mn: null },
      { w: 'big', s: 'big', ipa: '/bɪɡ/', pos: 'adj.', def: '大的', chunk: 'a big house', sent: 'They live in a big house.', sent_cn: '他们住在一栋大房子里。', mn: { formula: 'big ≈ 比格(谐音)', rhyme: '比格犬很大只' } },
      { w: 'small', s: 'small', ipa: '/smɔːl/', pos: 'adj.', def: '小的', chunk: 'a small room', sent: 'The room is very small.', sent_cn: '这个房间非常小。', mn: null },
      { w: 'eat', s: 'eat', ipa: '/iːt/', pos: 'v.', def: '吃', chunk: 'eat lunch', sent: "It's time to eat lunch.", sent_cn: '该吃午饭了。', mn: { formula: 'eat ≈ 一吃', rhyme: '一吃就停不下来' } },
      { w: 'drink', s: 'drink', ipa: '/drɪŋk/', pos: 'v.', def: '喝', chunk: 'drink water', sent: 'Please drink more water.', sent_cn: '请多喝水。', mn: null },
      { w: 'sleep', s: 'sleep', ipa: '/sliːp/', pos: 'v.', def: '睡觉', chunk: 'go to sleep', sent: 'I usually go to sleep at ten.', sent_cn: '我通常十点睡觉。', mn: { formula: 'sleep ≈ 死里扑(谐音)', rhyme: '困得扑到床上就睡了' } },
      { w: 'walk', s: 'walk', ipa: '/wɔːk/', pos: 'v.', def: '步行；散步', chunk: 'walk to school', sent: 'I walk to school every day.', sent_cn: '我每天步行去学校。', mn: null },
      { w: 'read', s: 'read', ipa: '/riːd/', pos: 'v.', def: '阅读；读', chunk: 'read books', sent: 'She likes to read books.', sent_cn: '她喜欢读书。', mn: { formula: 'read ≈ 入的', rhyme: '读进去的知识' } },
      { w: 'write', s: 'write', ipa: '/raɪt/', pos: 'v.', def: '写；书写', chunk: 'write a letter', sent: 'He wrote a letter to his friend.', sent_cn: '他给朋友写了一封信。', mn: null },
      { w: 'speak', s: 'speak', ipa: '/spiːk/', pos: 'v.', def: '说话；讲', chunk: 'speak English', sent: 'Can you speak English?', sent_cn: '你会说英语吗？', mn: { formula: 'speak ≈ 死扑一刻', rhyme: '扑过来的那一刻开口说话' } },
      { w: 'listen', s: 'lis·ten', ipa: '/ˈlɪs.ən/', pos: 'v.', def: '听；倾听', chunk: 'listen to music', sent: 'She likes to listen to music.', sent_cn: '她喜欢听音乐。', mn: null },
      { w: 'think', s: 'think', ipa: '/θɪŋk/', pos: 'v.', def: '想；思考', chunk: 'think about', sent: 'Let me think about it.', sent_cn: '让我想想。', mn: { formula: 'think ≈ 深刻(谐音)', rhyme: '深刻地思考' } },
      { w: 'know', s: 'know', ipa: '/nəʊ/', pos: 'v.', def: '知道；了解', chunk: 'I know', sent: 'I know the answer.', sent_cn: '我知道答案。', mn: null },
      { w: 'learn', s: 'learn', ipa: '/lɜːn/', pos: 'v.', def: '学习；学会', chunk: 'learn from', sent: 'We can learn from our mistakes.', sent_cn: '我们可以从错误中学习。', mn: { formula: 'learn ≈ 乐恩', rhyme: '乐于学习的恩赐' } },
      { w: 'teach', s: 'teach', ipa: '/tiːtʃ/', pos: 'v.', def: '教；教授', chunk: 'teach students', sent: 'She teaches English at our school.', sent_cn: '她在我们学校教英语。', mn: null },
      { w: 'help', s: 'help', ipa: '/help/', pos: 'v.', def: '帮助', chunk: 'help each other', sent: 'We should help each other.', sent_cn: '我们应该互相帮助。', mn: { formula: 'help ≈ 好扑', rhyme: '好人扑过来帮忙' } },
      { w: 'give', s: 'give', ipa: '/ɡɪv/', pos: 'v.', def: '给；赠予', chunk: 'give a gift', sent: 'She gave me a nice gift.', sent_cn: '她给了我一份漂亮的礼物。', mn: null },
      { w: 'take', s: 'take', ipa: '/teɪk/', pos: 'v.', def: '拿；带走', chunk: 'take a bus', sent: 'I take the bus to school.', sent_cn: '我乘公交车去学校。', mn: { formula: 'take ≈ 拿客', rhyme: '拿着东西做客人' } },
      { w: 'come', s: 'come', ipa: '/kʌm/', pos: 'v.', def: '来', chunk: 'come here', sent: 'Please come here.', sent_cn: '请到这里来。', mn: null },
      { w: 'go', s: 'go', ipa: '/ɡəʊ/', pos: 'v.', def: '去', chunk: 'go home', sent: "Let's go home.", sent_cn: '我们回家吧。', mn: null },
      { w: 'look', s: 'look', ipa: '/lʊk/', pos: 'v.', def: '看；注视', chunk: 'look at', sent: 'Look at the beautiful flowers!', sent_cn: '看那些美丽的花！', mn: { formula: 'look ≈ 路客', rhyme: '路上的客人看风景' } },
      { w: 'see', s: 'see', ipa: '/siː/', pos: 'v.', def: '看见', chunk: 'see a movie', sent: 'I can see the mountains from here.', sent_cn: '我从这里可以看见群山。', mn: null },
      { w: 'find', s: 'find', ipa: '/faɪnd/', pos: 'v.', def: '找到；发现', chunk: 'find out', sent: 'I found my lost key under the sofa.', sent_cn: '我在沙发下找到了丢失的钥匙。', mn: { formula: 'find ≈ 发现的', rhyme: '终于发现的那一刻' } },
      { w: 'use', s: 'use', ipa: '/juːz/', pos: 'v.', def: '使用；利用', chunk: 'use a computer', sent: 'Do you know how to use this tool?', sent_cn: '你知道怎么用这个工具吗？', mn: null },
      { w: 'try', s: 'try', ipa: '/traɪ/', pos: 'v.', def: '尝试；试', chunk: 'try again', sent: "Don't give up. Try again!", sent_cn: '不要放弃，再试一次！', mn: { formula: 'try ≈ 踹', rhyme: '踹一脚试试能不能打开' } },
      { w: 'want', s: 'want', ipa: '/wɒnt/', pos: 'v.', def: '想要；要', chunk: 'want to', sent: 'I want to be a teacher.', sent_cn: '我想当一名老师。', mn: null },
      { w: 'need', s: 'need', ipa: '/niːd/', pos: 'v.', def: '需要', chunk: 'need help', sent: 'I need your help with this task.', sent_cn: '这个任务我需要你的帮助。', mn: null },
      { w: 'like', s: 'like', ipa: '/laɪk/', pos: 'v.', def: '喜欢', chunk: 'like doing sth.', sent: 'I like reading books.', sent_cn: '我喜欢读书。', mn: { formula: 'like ≈ 来客', rhyme: '来的客人都喜欢' } },
      { w: 'love', s: 'love', ipa: '/lʌv/', pos: 'v.', def: '爱；热爱', chunk: 'love life', sent: 'I love my family.', sent_cn: '我爱我的家人。', mn: null },
      { w: 'begin', s: 'be·gin', ipa: '/bɪˈɡɪn/', pos: 'v.', def: '开始', chunk: 'begin to', sent: 'The show will begin at 8 PM.', sent_cn: '演出将在晚上8点开始。', mn: { formula: 'be + gin(开始)', rhyme: '存在的开始' } },
      { w: 'stop', s: 'stop', ipa: '/stɒp/', pos: 'v.', def: '停止', chunk: 'stop doing', sent: 'Please stop talking in class.', sent_cn: '请不要在课上讲话。', mn: null },
      { w: 'move', s: 'move', ipa: '/muːv/', pos: 'v.', def: '移动；搬家', chunk: 'move to', sent: 'They moved to a new city.', sent_cn: '他们搬到了一座新城市。', mn: { formula: 'move ≈ 木(谐音)', rhyme: '挪动木头搬家' } },
      { w: 'open', s: 'o·pen', ipa: '/ˈəʊ.pən/', pos: 'v.', def: '打开', chunk: 'open the door', sent: 'Please open the window.', sent_cn: '请打开窗户。', mn: null },
      { w: 'turn', s: 'turn', ipa: '/tɜːn/', pos: 'v.', def: '转动；转弯', chunk: 'turn left', sent: 'Turn left at the traffic light.', sent_cn: '在红绿灯处左转。', mn: { formula: 'turn ≈ 转', rhyme: '转弯转弯再转弯' } },
      { w: 'build', s: 'build', ipa: '/bɪld/', pos: 'v.', def: '建造；建设', chunk: 'build a house', sent: 'They are building a new school.', sent_cn: '他们正在建一所新学校。', mn: null },
      { w: 'grow', s: 'grow', ipa: '/ɡrəʊ/', pos: 'v.', def: '生长；成长', chunk: 'grow up', sent: 'I want to be a doctor when I grow up.', sent_cn: '我长大后想当医生。', mn: { formula: 'grow ≈ 阁楼', rhyme: '在阁楼上慢慢长大' } },
      { w: 'keep', s: 'keep', ipa: '/kiːp/', pos: 'v.', def: '保持；保留', chunk: 'keep quiet', sent: 'Please keep quiet in the library.', sent_cn: '请在图书馆保持安静。', mn: null },
      { w: 'hold', s: 'hold', ipa: '/həʊld/', pos: 'v.', def: '拿着；举办', chunk: 'hold a meeting', sent: 'The school will hold a sports meet.', sent_cn: '学校将举办一场运动会。', mn: null },
      { w: 'bring', s: 'bring', ipa: '/brɪŋ/', pos: 'v.', def: '带来', chunk: 'bring sth.', sent: 'Please bring your notebook tomorrow.', sent_cn: '请明天带上你的笔记本。', mn: { formula: 'bring ≈ 不扔', rhyme: '不扔掉，带过来' } },
      { w: 'sit', s: 'sit', ipa: '/sɪt/', pos: 'v.', def: '坐', chunk: 'sit down', sent: 'Please sit down.', sent_cn: '请坐下。', mn: null },
      { w: 'stand', s: 'stand', ipa: '/stænd/', pos: 'v.', def: '站立', chunk: 'stand up', sent: 'Please stand up and answer.', sent_cn: '请站起来回答。', mn: null },
      { w: 'spend', s: 'spend', ipa: '/spend/', pos: 'v.', def: '花费（时间/金钱）', chunk: 'spend time', sent: 'She spends two hours reading every day.', sent_cn: '她每天花两个小时阅读。', mn: { formula: 'spend ≈ 死拼的', rhyme: '死拼的花费精力' } },
      { w: 'win', s: 'win', ipa: '/wɪn/', pos: 'v.', def: '赢得；获胜', chunk: 'win the game', sent: 'Our team won the championship.', sent_cn: '我们队赢得了冠军。', mn: null },
      { w: 'lose', s: 'lose', ipa: '/luːz/', pos: 'v.', def: '丢失；失败', chunk: 'lose a game', sent: 'I lost my pen yesterday.', sent_cn: '我昨天丢了钢笔。', mn: { formula: 'lose ≈ 路丝', rhyme: '丝线在路上丢了' } },
      { w: 'fly', s: 'fly', ipa: '/flaɪ/', pos: 'v.', def: '飞', chunk: 'fly a kite', sent: 'Birds can fly high in the sky.', sent_cn: '鸟可以在天空中高飞。', mn: null },
      { w: 'swim', s: 'swim', ipa: '/swɪm/', pos: 'v.', def: '游泳', chunk: 'go swimming', sent: 'I like to swim in summer.', sent_cn: '我喜欢夏天游泳。', mn: null },
      { w: 'sing', s: 'sing', ipa: '/sɪŋ/', pos: 'v.', def: '唱歌', chunk: 'sing a song', sent: 'She sings a song every morning.', sent_cn: '她每天早上唱一首歌。', mn: { formula: 'sing ≈ 声', rhyme: '用声音唱歌' } },
      { w: 'dance', s: 'dance', ipa: '/dɑːns/', pos: 'v.', def: '跳舞', chunk: 'dance with', sent: 'They danced happily at the party.', sent_cn: '他们在派对上快乐地跳舞。', mn: null },
      { w: 'draw', s: 'draw', ipa: '/drɔː/', pos: 'v.', def: '画画；绘制', chunk: 'draw a picture', sent: 'She likes to draw animals.', sent_cn: '她喜欢画动物。', mn: null },
      { w: 'cook', s: 'cook', ipa: '/kʊk/', pos: 'v.', def: '做饭；烹饪', chunk: 'cook dinner', sent: 'My mom cooks dinner every evening.', sent_cn: '我妈妈每天晚上做晚饭。', mn: { formula: 'cook ≈ 酷客', rhyme: '酷酷的客人在做饭' } },
      { w: 'clean', s: 'clean', ipa: '/kliːn/', pos: 'adj.', def: '干净的', chunk: 'keep clean', sent: 'Please keep your room clean.', sent_cn: '请保持你的房间干净。', mn: null },
      { w: 'hard', s: 'hard', ipa: '/hɑːd/', pos: 'adj.', def: '困难的；硬的', chunk: 'work hard', sent: 'This math problem is really hard.', sent_cn: '这道数学题真的很难。', mn: { formula: 'hard ≈ 哈的', rhyme: '太难了哈哈笑不出来' } },
      { w: 'easy', s: 'ea·sy', ipa: '/ˈiː.zi/', pos: 'adj.', def: '容易的', chunk: 'take it easy', sent: 'This question is easy to answer.', sent_cn: '这个问题很容易回答。', mn: null },
      { w: 'fast', s: 'fast', ipa: '/fɑːst/', pos: 'adj.', def: '快的', chunk: 'run fast', sent: 'He runs very fast.', sent_cn: '他跑得非常快。', mn: null },
      { w: 'slow', s: 'slow', ipa: '/sləʊ/', pos: 'adj.', def: '慢的', chunk: 'slow down', sent: 'The car moved slowly in traffic.', sent_cn: '汽车在交通中缓慢行驶。', mn: null },
      { w: 'strong', s: 'strong', ipa: '/strɒŋ/', pos: 'adj.', def: '强壮的', chunk: 'be strong', sent: 'He is strong enough to carry the box.', sent_cn: '他足够强壮来搬这个箱子。', mn: { formula: 'strong ≈ 死壮', rhyme: '壮得要死就是强壮' } },
      { w: 'weak', s: 'weak', ipa: '/wiːk/', pos: 'adj.', def: '虚弱的', chunk: 'feel weak', sent: 'She felt weak after the illness.', sent_cn: '她生病后感到虚弱。', mn: null },
      { w: 'important', s: 'im·por·tant', ipa: '/ɪmˈpɔː.tənt/', pos: 'adj.', def: '重要的', chunk: 'be important', sent: 'Health is very important.', sent_cn: '健康非常重要。', mn: { formula: 'im + port(港口) + ant', rhyme: '进入港口的蚂蚁很重要' } },
      { w: 'different', s: 'dif·fer·ent', ipa: '/ˈdɪf.ər.ənt/', pos: 'adj.', def: '不同的', chunk: 'be different from', sent: 'This book is different from that one.', sent_cn: '这本书和那本不同。', mn: null },
      { w: 'same', s: 'same', ipa: '/seɪm/', pos: 'adj.', def: '相同的', chunk: 'the same as', sent: 'We are in the same class.', sent_cn: '我们在同一个班。', mn: null },
      { w: 'new', s: 'new', ipa: '/njuː/', pos: 'adj.', def: '新的', chunk: 'a new student', sent: 'There is a new student in our class.', sent_cn: '我们班来了一个新同学。', mn: null },
      { w: 'old', s: 'old', ipa: '/əʊld/', pos: 'adj.', def: '老的；旧的', chunk: 'grow old', sent: 'The building is very old.', sent_cn: '这栋建筑非常古老。', mn: { formula: 'old ≈ 熬的', rhyme: '熬过岁月就老了' } },
      { w: 'young', s: 'young', ipa: '/jʌŋ/', pos: 'adj.', def: '年轻的', chunk: 'young people', sent: 'Young people like new things.', sent_cn: '年轻人喜欢新事物。', mn: null },
      { w: 'long', s: 'long', ipa: '/lɒŋ/', pos: 'adj.', def: '长的', chunk: 'a long time', sent: 'We waited for a long time.', sent_cn: '我们等了很长时间。', mn: null },
      { w: 'short', s: 'short', ipa: '/ʃɔːt/', pos: 'adj.', def: '短的；矮的', chunk: 'in short', sent: 'The movie was quite short.', sent_cn: '这部电影很短。', mn: null },
      { w: 'hot', s: 'hot', ipa: '/hɒt/', pos: 'adj.', def: '热的', chunk: 'a hot day', sent: 'It is very hot today.', sent_cn: '今天非常热。', mn: null },
      { w: 'cold', s: 'cold', ipa: '/kəʊld/', pos: 'adj.', def: '冷的', chunk: 'feel cold', sent: 'I feel cold in winter.', sent_cn: '冬天我感到很冷。', mn: { formula: 'cold ≈ 寇的', rhyme: '寇了一下冻得发抖' } },
    ];

    for (const e of extraWords) {
      const grade = grades[Math.floor(Math.random() * grades.length)];
      const status = Math.random() < 0.08 ? 'pending' : 'approved';
      const wId = insertWord.run(e.w, e.s, e.ipa, grade, status, 0).lastInsertRowid;
      const mId = insertMeaning.run(wId, e.pos, e.def).lastInsertRowid;
      insertSource.run(mId, textbooks[grade][0]);
      insertContent.run(wId, mId, 'chunk', e.chunk, null, 'approved');
      insertContent.run(wId, mId, 'sentence', e.sent, e.sent_cn, 'approved');
      if (e.mn) {
        insertContent.run(wId, null, 'mnemonic', JSON.stringify({ type: mnemonicTypes[Math.floor(Math.random() * mnemonicTypes.length)], formula: e.mn.formula, rhyme: e.mn.rhyme }), null, 'approved');
      }
      if (status === 'pending') {
        insertIssue.run(wId, 'sentence', 'Gate 3', '例句质量待提升');
      }
    }

    // Pre-create batches
    const insertBatch = db.prepare("INSERT OR IGNORE INTO batches (id, name, total_words) VALUES (?, ?, ?)");
    const totalBatches = 20;
    for (let b = 1; b <= totalBatches; b++) {
      const bId = `batch_${String(b).padStart(3, '0')}`;
      insertBatch.run(bId, `导入批次 ${b}`, 100);
    }

    // Repeat pool to reach ~2000 total
    let repeatCount = 0;
    while (repeatCount < 1900) {
      const v = vocabPool[repeatCount % vocabPool.length];
      const grade = grades[repeatCount % grades.length];
      const status = repeatCount % 15 === 0 ? 'pending' : 'approved';
      const batchId = `batch_${String(Math.floor(repeatCount / 100) + 1).padStart(3, '0')}`;
      const wId = insertWord.run(v.word, v.syllables, v.ipa, grade, status, Math.floor(Math.random() * 2)).lastInsertRowid;
      db.prepare("UPDATE words SET batch_id = ? WHERE id = ?").run(batchId, wId);
      const pickMeanings = v.meanings.slice(0, 1 + Math.floor(Math.random() * v.meanings.length));
      for (const m of pickMeanings) {
        const mId = insertMeaning.run(wId, m.pos, m.def).lastInsertRowid;
        insertSource.run(mId, textbooks[grade][Math.floor(Math.random() * textbooks[grade].length)]);
        insertContent.run(wId, mId, 'chunk', m.chunk, null, 'approved');
        insertContent.run(wId, mId, 'sentence', m.sentence, m.sentence_cn, 'approved');
      }
      if (v.mnemonic && Math.random() > 0.2) {
        insertContent.run(wId, null, 'mnemonic', JSON.stringify(v.mnemonic), null, 'approved');
      }
      if (status === 'pending') {
        insertIssue.run(wId, 'sentence', 'Gate 3', '例句质量待提升');
      }
      repeatCount++;
    }
  })();
  console.log("Seeded 2000 words with multi-meaning structure.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/words", (req, res) => {
    const { letter, source, batchId, page, pageSize } = req.query;
    const limit = parseInt(pageSize as string) || 50;
    const offset = ((parseInt(page as string) || 1) - 1) * limit;

    let whereClause = `WHERE w.status = 'approved'`;
    const params: any[] = [];

    if (letter) {
      whereClause += ` AND w.word LIKE ?`;
      params.push(`${letter}%`);
    }

    if (source) {
      whereClause += ` AND EXISTS (SELECT 1 FROM sources s JOIN meanings m2 ON s.meaning_id = m2.id WHERE m2.word_id = w.id AND s.textbook LIKE ?)`;
      params.push(`%${source}%`);
    }

    if (batchId) {
      whereClause += ` AND w.batch_id = ?`;
      params.push(batchId);
    }

    const countQuery = `SELECT COUNT(*) as total FROM words w ${whereClause}`;
    const total = db.prepare(countQuery).get(...params).total;

    const query = `
      SELECT w.*,
             (SELECT content FROM content_items ci WHERE ci.word_id = w.id AND ci.meaning_id IS NULL AND ci.dimension = 'mnemonic' LIMIT 1) as mnemonic_json,
             (SELECT COUNT(*) FROM quality_issues qi WHERE qi.word_id = w.id) as issue_count
      FROM words w
      ${whereClause}
      ORDER BY w.word ASC
      LIMIT ? OFFSET ?
    `;

    const words = db.prepare(query).all(...params, limit, offset);

    const meaningQuery = db.prepare(`
      SELECT m.id, m.word_id, m.pos, m.definition,
             (SELECT GROUP_CONCAT(textbook, ', ') FROM sources s WHERE s.meaning_id = m.id) as sources,
             (SELECT content FROM content_items ci WHERE ci.meaning_id = m.id AND ci.dimension = 'chunk' LIMIT 1) as chunk,
             (SELECT content FROM content_items ci WHERE ci.meaning_id = m.id AND ci.dimension = 'sentence' LIMIT 1) as sentence,
             (SELECT content_extra FROM content_items ci WHERE ci.meaning_id = m.id AND ci.dimension = 'sentence' LIMIT 1) as sentence_cn
      FROM meanings m WHERE m.word_id = ?
    `);

    const processedWords = words.map(w => {
      let mnemonic = null;
      if (w.mnemonic_json) {
        try { mnemonic = JSON.parse(w.mnemonic_json); } catch (e) {}
      }
      const meanings = meaningQuery.all(w.id);
      return {
        ...w,
        meanings,
        mnemonic_formula: mnemonic?.formula || null,
        mnemonic_rhyme: mnemonic?.rhyme || null,
      };
    });

    res.json({ items: processedWords, total, page: parseInt(page as string) || 1, pageSize: limit });
  });

  app.get("/api/words/:id", (req, res) => {
    const word = db.prepare("SELECT * FROM words WHERE id = ?").get(req.params.id);
    if (!word) return res.status(404).json({ error: "Word not found" });
    
    // Fetch meanings
    const meanings = db.prepare("SELECT * FROM meanings WHERE word_id = ?").all(req.params.id);
    
    // For each meaning, fetch sources and content items (chunk, sentence)
    for (const m of meanings) {
      m.sources = db.prepare("SELECT textbook FROM sources WHERE meaning_id = ?").all(m.id).map(s => s.textbook);
      
      const chunk = db.prepare("SELECT content FROM content_items WHERE meaning_id = ? AND dimension = 'chunk'").get(m.id);
      m.chunk = chunk ? chunk.content : null;
      
      const sentence = db.prepare("SELECT content, content_extra FROM content_items WHERE meaning_id = ? AND dimension = 'sentence'").get(m.id);
      if (sentence) {
        m.sentence = sentence.content;
        m.sentence_cn = sentence.content_extra;
      }
    }
    
    // Fetch word-level mnemonic
    const mnemonicItem = db.prepare("SELECT content, content_extra FROM content_items WHERE word_id = ? AND meaning_id IS NULL AND dimension = 'mnemonic'").get(req.params.id);
    let mnemonic = null;
    if (mnemonicItem) {
      const parsed = JSON.parse(mnemonicItem.content);
      mnemonic = {
        ...parsed,
        teacher_script: mnemonicItem.content_extra
      };
    }

    const issues = db.prepare("SELECT * FROM quality_issues WHERE word_id = ?").all(req.params.id);
    
    res.json({ ...word, meanings, mnemonic, issues });
  });

  app.get("/api/batches", (req, res) => {
    const batches = db.prepare("SELECT * FROM batches ORDER BY created_at DESC").all();
    res.json(batches);
  });

  app.get("/api/batches/:id/words", (req, res) => {
    const words = db.prepare("SELECT * FROM words WHERE batch_id = ?").all(req.params.id);
    res.json(words);
  });

  app.post("/api/import", (req, res) => {
    const { words, batchName } = req.body; // Array of { word, pos, definition, source }
    const batchId = `batch_${Date.now()}`;
    
    db.transaction(() => {
      db.prepare("INSERT INTO batches (id, name, total_words) VALUES (?, ?, ?)").run(
        batchId, 
        batchName || `批次 ${new Date().toLocaleString()}`, 
        words.length
      );

      const insertWord = db.prepare("INSERT INTO words (word, status, batch_id) VALUES (?, 'processing', ?)");
      const insertMeaning = db.prepare("INSERT INTO meanings (word_id, pos, definition) VALUES (?, ?, ?)");
      const insertSource = db.prepare("INSERT INTO sources (meaning_id, textbook) VALUES (?, ?)");
      
      for (const item of words) {
        const result = insertWord.run(item.word, batchId);
        const m = insertMeaning.run(result.lastInsertRowid, item.pos, item.definition);
        insertSource.run(m.lastInsertRowid, item.source);
      }
    })();
    
    res.json({ success: true, count: words.length, batchId });
  });

  app.get("/api/batches/:id", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing
      FROM words 
      WHERE batch_id = ?
    `).get(req.params.id);
    res.json(stats);
  });

  // Job simulation state
  const jobs = new Map<string, any>();

  app.post("/api/repair-all", (req, res) => {
    const pending = db.prepare("SELECT id FROM words WHERE status = 'pending'").all();
    const jobId = `JOB-${Date.now()}`;
    
    const job = {
      id: jobId,
      total: pending.length,
      completed: 0,
      succeeded: 0,
      failed: 0,
      current_word: '',
      current_dimension: '',
      done: false,
      result: null
    };
    
    jobs.set(jobId, job);

    // Simulate background processing
    let index = 0;
    const interval = setInterval(() => {
      if (index >= pending.length) {
        job.done = true;
        job.result = {
          succeeded: job.succeeded,
          failed: job.failed,
          can_ai_retry: db.prepare("SELECT COUNT(*) as count FROM words WHERE status = 'pending' AND repair_attempts < 3").get().count,
          must_manual: db.prepare("SELECT COUNT(*) as count FROM words WHERE status = 'pending' AND repair_attempts >= 3").get().count
        };
        clearInterval(interval);
        return;
      }

      const wordId = pending[index].id;
      const word = db.prepare("SELECT word FROM words WHERE id = ?").get(wordId);
      job.current_word = word.word;
      
      const dimensions = [
        { name: '语块', issue: '语块搭配不自然' },
        { name: '例句', issue: '例句难度不匹配' },
        { name: '助记', issue: '助记逻辑不连贯' },
        { name: '音节', issue: '音节切分错误' }
      ];
      const dim = dimensions[Math.floor(Math.random() * dimensions.length)];
      job.current_dimension = dim.name;
      
      // Simulate repair logic
      db.prepare("UPDATE words SET repair_attempts = repair_attempts + 1 WHERE id = ?").run(wordId);
      const success = Math.random() > 0.4;
      if (success) {
        db.prepare("UPDATE words SET status = 'approved' WHERE id = ?").run(wordId);
        db.prepare("DELETE FROM quality_issues WHERE word_id = ?").run(wordId);
        job.succeeded++;
      } else {
        job.failed++;
        const wordData = db.prepare("SELECT repair_attempts FROM words WHERE id = ?").get(wordId);
        if (wordData.repair_attempts >= 3) {
          db.prepare("UPDATE quality_issues SET issue = 'AI 修复已达上限 (3次)，请人工介入修改。' WHERE word_id = ?").run(wordId);
        } else {
          db.prepare("UPDATE quality_issues SET issue = ? WHERE word_id = ?").run(dim.issue, wordId);
        }
      }

      job.completed++;
      index++;
    }, 500); // Process one word every 500ms

    res.json({ job_id: jobId, total: pending.length, estimated_time: `${Math.ceil(pending.length * 0.5 / 60)} 分钟` });
  });

  app.get("/api/jobs/:id", (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  });

  app.get("/api/pending-repair", (req, res) => {
    const search = req.query.search || '';
    const filter = req.query.filter || 'all'; // 'all', 'can_retry', 'must_manual'
    const batchId = req.query.batchId;
    
    let query = `
      SELECT w.*, 
             qi.field, qi.issue, qi.failed_step, qi.retry_count as issue_retry_count,
             COALESCE(
               (SELECT content FROM content_items ci WHERE ci.word_id = w.id AND ci.dimension = qi.field LIMIT 1),
               (SELECT definition FROM meanings m WHERE m.word_id = w.id LIMIT 1)
             ) as problematic_content
      FROM words w
      JOIN quality_issues qi ON w.id = qi.word_id
      WHERE w.status = 'pending' AND (w.word LIKE ? OR qi.issue LIKE ?)
    `;
    const params: any[] = [`%${search}%`, `%${search}%`];

    if (filter === 'can_retry') {
      query += " AND w.repair_attempts < 3";
    } else if (filter === 'must_manual') {
      query += " AND w.repair_attempts >= 3";
    }

    if (batchId) {
      query += " AND w.batch_id = ?";
      params.push(batchId);
    }

    query += " ORDER BY w.updated_at DESC";

    const words = db.prepare(query).all(...params);
    
    // Get counts for tabs
    const countParams: any[] = [];
    let countQuery = "SELECT COUNT(*) as count FROM words WHERE status = 'pending'";
    if (batchId) {
      countQuery += " AND batch_id = ?";
      countParams.push(batchId);
    }
    const totalCount = db.prepare(countQuery).get(...countParams).count;

    let canRetryQuery = "SELECT COUNT(*) as count FROM words WHERE status = 'pending' AND repair_attempts < 3";
    if (batchId) {
      canRetryQuery += " AND batch_id = ?";
    }
    const canRetryCount = db.prepare(canRetryQuery).get(...countParams).count;

    let mustManualQuery = "SELECT COUNT(*) as count FROM words WHERE status = 'pending' AND repair_attempts >= 3";
    if (batchId) {
      mustManualQuery += " AND batch_id = ?";
    }
    const mustManualCount = db.prepare(mustManualQuery).get(...countParams).count;

    const counts = {
      total: totalCount,
      can_retry: canRetryCount,
      must_manual: mustManualCount
    };

    res.json({ items: words, counts });
  });

  app.post("/api/words/:id/retry", (req, res) => {
    const wordId = req.params.id;
    
    db.transaction(() => {
      // Increment repair attempts in words table
      db.prepare("UPDATE words SET repair_attempts = repair_attempts + 1 WHERE id = ?").run(wordId);
      
      const word = db.prepare("SELECT repair_attempts FROM words WHERE id = ?").get(wordId);
      
      // Simulate repair: 60% chance to fix
      const success = Math.random() > 0.4;
      
      if (success) {
        db.prepare("UPDATE words SET status = 'approved' WHERE id = ?").run(wordId);
        db.prepare("DELETE FROM quality_issues WHERE word_id = ?").run(wordId);
        res.json({ success: true, status: 'approved' });
      } else {
        if (word.repair_attempts >= 3) {
          db.prepare("UPDATE quality_issues SET issue = 'AI 修复已达上限 (3次)，请人工介入修改。' WHERE word_id = ?").run(wordId);
        }
        res.json({ success: false, status: 'pending', repair_attempts: word.repair_attempts });
      }
    })();
  });

  app.patch("/api/words/:id", (req, res) => {
    const { word, syllables, ipa, meanings, mnemonic, grade } = req.body;
    const wordId = req.params.id;
    
    db.transaction(() => {
      // Update basic info
      db.prepare("UPDATE words SET word = ?, syllables = ?, ipa = ?, grade = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(word, syllables, ipa, grade, wordId);
      
      if (meanings) {
        for (const m of meanings) {
          const existing = db.prepare("SELECT id FROM meanings WHERE id = ?").get(m.id);
          if (existing) {
            db.prepare("UPDATE meanings SET pos = ?, definition = ? WHERE id = ?").run(m.pos, m.definition, m.id);
            db.prepare("UPDATE content_items SET content = ? WHERE word_id = ? AND meaning_id = ? AND dimension = 'chunk'").run(m.chunk, wordId, m.id);
            db.prepare("UPDATE content_items SET content = ?, content_extra = ? WHERE word_id = ? AND meaning_id = ? AND dimension = 'sentence'").run(m.sentence, m.sentence_cn, wordId, m.id);
          }
        }
      }
      
      if (mnemonic) {
        const mnemonicJson = JSON.stringify({
          type: mnemonic.type,
          formula: mnemonic.formula,
          rhyme: mnemonic.rhyme
        });
        const existing = db.prepare("SELECT id FROM content_items WHERE word_id = ? AND dimension = 'mnemonic'").get(wordId);
        if (existing) {
          db.prepare("UPDATE content_items SET content = ?, content_extra = ? WHERE id = ?").run(mnemonicJson, mnemonic.teacher_script, existing.id);
        } else {
          db.prepare("INSERT INTO content_items (word_id, dimension, content, content_extra) VALUES (?, 'mnemonic', ?, ?)").run(wordId, mnemonicJson, mnemonic.teacher_script);
        }
      }

      // Re-run machine validation
      db.prepare("DELETE FROM quality_issues WHERE word_id = ?").run(wordId);
      
      const issues: any[] = [];
      
      // Gate 1: Definition check
      if (meanings && meanings.some((m: any) => !m.definition || m.definition.length < 2)) {
        issues.push({ field: 'definition', step: 'Gate 1', issue: '释义描述不准确或过于简略' });
      }
      
      // Gate 2: Mnemonic check
      if (mnemonic && (!mnemonic.formula || mnemonic.formula.length < 5)) {
        issues.push({ field: 'mnemonic', step: 'Gate 2', issue: '助记逻辑不通顺或公式缺失' });
      }
      
      // Gate 3: Sentence check
      if (meanings && meanings.some((m: any) => m.sentence && m.sentence.split(' ').length > 20)) {
        issues.push({ field: 'sentence', step: 'Gate 3', issue: '例句字数超标 (建议 20 词以内)' });
      }

      if (issues.length > 0) {
        db.prepare("UPDATE words SET status = 'pending' WHERE id = ?").run(wordId);
        const insertIssue = db.prepare("INSERT INTO quality_issues (word_id, field, failed_step, issue) VALUES (?, ?, ?, ?)");
        for (const issue of issues) {
          insertIssue.run(wordId, issue.field, issue.step, issue.issue);
        }
        res.json({ success: true, status: 'pending', issues });
      } else {
        db.prepare("UPDATE words SET status = 'approved' WHERE id = ?").run(wordId);
        res.json({ success: true, status: 'approved' });
      }
    })();
  });

  app.get("/api/stats", (req, res) => {
    const total = db.prepare("SELECT COUNT(*) as count FROM words").get().count;
    const approved = db.prepare("SELECT COUNT(*) as count FROM words WHERE status = 'approved'").get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM words WHERE status != 'approved'").get().count;
    
    const issues = db.prepare(`
      SELECT field, COUNT(*) as count 
      FROM quality_issues 
      GROUP BY field
    `).all();

    res.json({ total, approved, pending, issues });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
