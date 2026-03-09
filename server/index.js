const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 存储词汇数据
let vocabularyData = [
  {
    id: 1,
    word: "algorithm",
    translation: "算法",
    category: "计算机科学",
    difficulty: "中级",
    example: "The sorting algorithm is very efficient.",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    word: "photosynthesis",
    translation: "光合作用",
    category: "生物学",
    difficulty: "中级",
    example: "Plants use photosynthesis to convert sunlight into energy.",
    createdAt: new Date().toISOString()
  }
];

// API 路由
app.get('/api/vocabulary', (req, res) => {
  res.json(vocabularyData);
});

app.get('/api/vocabulary/:id', (req, res) => {
  const vocab = vocabularyData.find(v => v.id === parseInt(req.params.id));
  if (vocab) {
    res.json(vocab);
  } else {
    res.status(404).json({ message: '词汇未找到' });
  }
});

app.post('/api/vocabulary', (req, res) => {
  const newVocab = {
    id: vocabularyData.length > 0 ? Math.max(...vocabularyData.map(v => v.id)) + 1 : 1,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  vocabularyData.push(newVocab);
  res.status(201).json(newVocab);
});

app.put('/api/vocabulary/:id', (req, res) => {
  const index = vocabularyData.findIndex(v => v.id === parseInt(req.params.id));
  if (index !== -1) {
    vocabularyData[index] = {
      ...vocabularyData[index],
      ...req.body,
      id: parseInt(req.params.id)
    };
    res.json(vocabularyData[index]);
  } else {
    res.status(404).json({ message: '词汇未找到' });
  }
});

app.delete('/api/vocabulary/:id', (req, res) => {
  const index = vocabularyData.findIndex(v => v.id === parseInt(req.params.id));
  if (index !== -1) {
    vocabularyData.splice(index, 1);
    res.json({ message: '删除成功' });
  } else {
    res.status(404).json({ message: '词汇未找到' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
