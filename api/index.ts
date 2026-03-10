import type { VercelRequest, VercelResponse } from '@vercel/node';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 初始化数据库（仅在第一次运行时）
let db: Database.Database | null = null;

function getDatabase() {
  if (!db) {
    // 在 Vercel 上，数据库文件需要存储在 /tmp 目录（可写）
    const dbPath = process.env.VERCEL_ENV 
      ? '/tmp/vocab.db' 
      : path.join(__dirname, '../vocab.db');
    
    db = new Database(dbPath);
    
    // 初始化数据库结构
    db.exec(`
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
        meaning_id INTEGER,
        dimension TEXT,
        content TEXT,
        content_extra TEXT,
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

    // 检查是否需要初始化数据
    const checkData = db.prepare("SELECT COUNT(*) as count FROM words").get() as { count: number };
    if (checkData.count === 0) {
      // 初始化示例数据
      const insertWord = db.prepare("INSERT INTO words (word, syllables, ipa, grade_level, status, repair_attempts, batch_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
      const insertMeaning = db.prepare("INSERT INTO meanings (word_id, pos, definition) VALUES (?, ?, ?)");
      const insertSource = db.prepare("INSERT INTO sources (meaning_id, textbook) VALUES (?, ?)");
      const insertContent = db.prepare("INSERT INTO content_items (word_id, meaning_id, dimension, content, content_extra, status) VALUES (?, ?, ?, ?, ?, ?)");
      const insertMnemonic = db.prepare("INSERT INTO content_items (word_id, meaning_id, dimension, content, content_extra, status) VALUES (?, NULL, 'mnemonic', ?, ?, ?)");
      
      const batchId = 'batch_001';
      db.prepare("INSERT INTO batches (id, name, total_words) VALUES (?, ?, ?)").run(batchId, '示例批次', 3);
      
      // 示例1: empathy
      const w1 = insertWord.run('empathy', 'em·pa·thy', '/ˈem.pə.θi/', '九年级', 'approved', 0, batchId).lastInsertRowid;
      const m1 = insertMeaning.run(w1, 'n.', '共情；同理心').lastInsertRowid;
      insertSource.run(m1, '人教版九年级英语全一册');
      insertContent.run(w1, m1, 'chunk', 'show empathy for', null, 'approved');
      insertContent.run(w1, m1, 'sentence', 'A good friend always shows empathy for others.', '好朋友总是对他人表现出同理心。', 'approved');
      insertMnemonic.run(w1, JSON.stringify({ type: '词根词缀', formula: 'em(进入) + path(感受) + y(名词后缀)', rhyme: '进入别人的感受，就是同理心' }), '同学们看这个词：empathy...', 'approved');
      
      // 示例2: kind
      const w2 = insertWord.run('kind', 'kind', '/kaɪnd/', '七年级', 'approved', 0, batchId).lastInsertRowid;
      const m2 = insertMeaning.run(w2, 'adj.', '友好的').lastInsertRowid;
      insertSource.run(m2, '人教版七年级英语上册（衔接小学）');
      insertContent.run(w2, m2, 'chunk', 'be kind to sb.', null, 'approved');
      insertContent.run(w2, m2, 'sentence', 'The teacher is always kind to every student.', '老师对每位同学总是很友好。', 'approved');
      
      // 示例3: beautiful
      const w3 = insertWord.run('beautiful', 'beau·ti·ful', '/ˈbjuː.tɪ.fəl/', '七年级', 'approved', 0, batchId).lastInsertRowid;
      const m3 = insertMeaning.run(w3, 'adj.', '美丽的；漂亮的').lastInsertRowid;
      insertSource.run(m3, '人教版七年级英语上册（衔接小学）');
      insertContent.run(w3, m3, 'chunk', 'a beautiful day', null, 'approved');
      insertContent.run(w3, m3, 'sentence', 'What a beautiful day it is today!', '今天天气真好！', 'approved');
      insertMnemonic.run(w3, JSON.stringify({ type: '词根词缀', formula: 'beauty(美) + ful(充满...的)', rhyme: '充满美的，就是美丽的' }), '同学们，beautiful 这个词...', 'approved');
    }
  }
  return db;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDatabase();
  const { method, url } = req;
  
  // 解析路径
  const path = url?.split('?')[0] || '';
  
  try {
    // GET /api/stats
    if (method === 'GET' && path === '/api/stats') {
      const total = db.prepare("SELECT COUNT(*) as count FROM words").get() as { count: number };
      const approved = db.prepare("SELECT COUNT(*) as count FROM words WHERE status = 'approved'").get() as { count: number };
      const pending = db.prepare("SELECT COUNT(*) as count FROM words WHERE status != 'approved'").get() as { count: number };
      const issues = db.prepare("SELECT field, COUNT(*) as count FROM quality_issues GROUP BY field").all();
      
      return res.json({ total: total.count, approved: approved.count, pending: pending.count, issues });
    }
    
    // GET /api/batches
    if (method === 'GET' && path === '/api/batches') {
      const batches = db.prepare("SELECT * FROM batches ORDER BY created_at DESC").all();
      return res.json(batches);
    }
    
    // GET /api/batches/:id
    if (method === 'GET' && path.startsWith('/api/batches/')) {
      const batchId = path.split('/')[3];
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing
        FROM words 
        WHERE batch_id = ?
      `).get(batchId);
      return res.json(stats || { total: 0, approved: 0, pending: 0, processing: 0 });
    }
    
    // GET /api/words
    if (method === 'GET' && path === '/api/words') {
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
      const total = (db.prepare(countQuery).get(...params) as { total: number }).total;

      const query = `
        SELECT w.*,
               (SELECT content FROM content_items ci WHERE ci.word_id = w.id AND ci.meaning_id IS NULL AND ci.dimension = 'mnemonic' LIMIT 1) as mnemonic_json,
               (SELECT COUNT(*) FROM quality_issues qi WHERE qi.word_id = w.id) as issue_count
        FROM words w
        ${whereClause}
        ORDER BY w.word ASC
        LIMIT ? OFFSET ?
      `;

      const words = db.prepare(query).all(...params, limit, offset) as any[];

      const meaningQuery = db.prepare(`
        SELECT m.id, m.word_id, m.pos, m.definition,
               (SELECT GROUP_CONCAT(textbook, ', ') FROM sources s WHERE s.meaning_id = m.id) as sources,
               (SELECT content FROM content_items ci WHERE ci.meaning_id = m.id AND ci.dimension = 'chunk' LIMIT 1) as chunk,
               (SELECT content FROM content_items ci WHERE ci.meaning_id = m.id AND ci.dimension = 'sentence' LIMIT 1) as sentence,
               (SELECT content_extra FROM content_items ci WHERE ci.meaning_id = m.id AND ci.dimension = 'sentence' LIMIT 1) as sentence_cn
        FROM meanings m WHERE m.word_id = ?
      `);

      const processedWords = words.map((w: any) => {
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

      return res.json({ items: processedWords, total, page: parseInt(page as string) || 1, pageSize: limit });
    }
    
    // GET /api/words/:id
    if (method === 'GET' && path.startsWith('/api/words/')) {
      const wordId = path.split('/')[3];
      const word = db.prepare("SELECT * FROM words WHERE id = ?").get(wordId) as any;
      if (!word) return res.status(404).json({ error: "Word not found" });
      
      const meanings = db.prepare("SELECT * FROM meanings WHERE word_id = ?").all(wordId) as any[];
      for (const m of meanings) {
        m.sources = db.prepare("SELECT textbook FROM sources WHERE meaning_id = ?").all(m.id).map((s: any) => s.textbook);
        const chunk = db.prepare("SELECT content FROM content_items WHERE meaning_id = ? AND dimension = 'chunk'").get(m.id) as any;
        m.chunk = chunk ? chunk.content : null;
        const sentence = db.prepare("SELECT content, content_extra FROM content_items WHERE meaning_id = ? AND dimension = 'sentence'").get(m.id) as any;
        if (sentence) {
          m.sentence = sentence.content;
          m.sentence_cn = sentence.content_extra;
        }
      }
      
      const mnemonicItem = db.prepare("SELECT content, content_extra FROM content_items WHERE word_id = ? AND meaning_id IS NULL AND dimension = 'mnemonic'").get(wordId) as any;
      let mnemonic = null;
      if (mnemonicItem) {
        const parsed = JSON.parse(mnemonicItem.content);
        mnemonic = {
          ...parsed,
          teacher_script: mnemonicItem.content_extra
        };
      }

      const issues = db.prepare("SELECT * FROM quality_issues WHERE word_id = ?").all(wordId);
      
      return res.json({ ...word, meanings, mnemonic, issues });
    }
    
    // GET /api/pending-repair
    if (method === 'GET' && path === '/api/pending-repair') {
      const search = req.query.search || '';
      const filter = req.query.filter || 'all';
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

      const words = db.prepare(query).all(...params) as any[];
      
      const countParams: any[] = [];
      let countQuery = "SELECT COUNT(*) as count FROM words WHERE status = 'pending'";
      if (batchId) {
        countQuery += " AND batch_id = ?";
        countParams.push(batchId);
      }
      const totalCount = (db.prepare(countQuery).get(...countParams) as { count: number }).count;

      let canRetryQuery = "SELECT COUNT(*) as count FROM words WHERE status = 'pending' AND repair_attempts < 3";
      if (batchId) {
        canRetryQuery += " AND batch_id = ?";
      }
      const canRetryCount = (db.prepare(canRetryQuery).get(...countParams) as { count: number }).count;

      let mustManualQuery = "SELECT COUNT(*) as count FROM words WHERE status = 'pending' AND repair_attempts >= 3";
      if (batchId) {
        mustManualQuery += " AND batch_id = ?";
      }
      const mustManualCount = (db.prepare(mustManualQuery).get(...countParams) as { count: number }).count;

      return res.json({
        items: words,
        counts: {
          total: totalCount,
          can_retry: canRetryCount,
          must_manual: mustManualCount
        }
      });
    }
    
    // POST /api/import
    if (method === 'POST' && path === '/api/import') {
      const { words, batchName } = req.body;
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
      
      return res.json({ success: true, count: words.length, batchId });
    }
    
    // 其他路由可以继续添加...
    
    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
