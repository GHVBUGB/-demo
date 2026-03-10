# Vercel 部署问题解决方案

## 问题描述
GitHub 和 Vercel 上的版本不同，打开后没有看板、总表、提示词这些内容。

## 原因分析

1. **缺少 Vercel 配置文件**：项目之前没有 `vercel.json`，导致 Vercel 无法正确识别项目类型和构建配置。

2. **Express + React SPA 混合架构**：项目使用 Express 作为后端 API，React 作为前端 SPA，需要特殊配置才能在 Vercel 上正确部署。

3. **路由配置问题**：SPA 路由需要配置重写规则，确保所有非 API 路由都指向 `index.html`。

## 解决方案

### 1. 已创建的配置文件

**`vercel.json`** - Vercel 部署配置：
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. 需要执行的步骤

#### 步骤 1：提交所有更改到 GitHub
```bash
git add .
git commit -m "fix: 添加 Vercel 部署配置，修复页面路由问题"
git push origin main
```

#### 步骤 2：在 Vercel 中重新部署

1. 登录 Vercel 控制台
2. 找到你的项目
3. 进入项目设置（Settings）
4. 检查以下配置：
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - **Framework Preset**: 选择 "Vite" 或 "Other"

5. 点击 "Redeploy" 重新部署

#### 步骤 3：验证部署

部署完成后，访问你的 Vercel URL，应该能看到：
- ✅ 数据看板（Dashboard）
- ✅ 词表导入（Import）
- ✅ 生产监控（Monitoring）
- ✅ 质检审核（Review）
- ✅ 总表管理（Master Table）
- ✅ Prompt 管理（Prompt）

### 3. 注意事项

⚠️ **重要**：当前配置假设 API 路由会通过其他方式处理（例如单独的 API 服务或 serverless 函数）。如果你的 Express API 也需要在 Vercel 上运行，需要：

1. 将 `server.ts` 转换为 Vercel serverless 函数
2. 或者使用 Vercel 的 Node.js 运行时
3. 或者将 API 部署到单独的服务器

### 4. 如果 API 不工作

如果你的 API 路由（`/api/*`）在 Vercel 上不工作，需要：

1. 创建 `api/` 目录
2. 将 Express 路由转换为 serverless 函数
3. 或者使用 Vercel 的 Node.js runtime

可以参考 Vercel 文档：https://vercel.com/docs/functions/serverless-functions

## 验证清单

- [ ] `vercel.json` 已创建并提交
- [ ] 所有代码已推送到 GitHub
- [ ] Vercel 项目设置已更新
- [ ] 已触发重新部署
- [ ] 前端页面可以正常访问
- [ ] 侧边栏导航正常显示
- [ ] 所有页面（看板、总表、提示词等）都能正常打开

## 如果问题仍然存在

1. 检查 Vercel 构建日志，查看是否有错误
2. 检查浏览器控制台，查看是否有 JavaScript 错误
3. 确认 `dist` 目录中的文件是否正确生成
4. 检查网络请求，确认 API 调用是否正常
