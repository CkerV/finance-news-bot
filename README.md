# Finance News Bot

7x24 小时财经资讯播报机器人，通过企业微信推送华尔街见闻快讯。

## 功能

- 定时获取华尔街见闻 7x24 快讯
- 每次只推送最新的一条消息
- 通过企业微信机器人通知

## 部署步骤

### 1. 创建企业微信机器人

1. 在企业微信群里，点击群设置 → 群机器人 → 添加机器人
2. 复制 Webhook 地址（格式：`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`）

### 2. Fork 或创建仓库

将此项目推送到你的 GitHub 仓库。

### 3. 设置 GitHub Secrets

在仓库设置中添加 Secret：
- `WECHAT_WEBHOOK_URL`: 你的企业微信机器人 Webhook 地址

### 4. 启用 GitHub Actions

1. 进入仓库的 Actions 页面
2. 启用 workflow
3. 可以手动触发测试，或等待定时任务自动运行

## 本地测试

```bash
# 安装依赖
npm install

# 设置环境变量
export WECHAT_WEBHOOK_URL="你的webhook地址"

# 运行
npm start
```

## 自定义

修改 `.github/workflows/news.yml` 中的 cron 表达式可以调整检查频率：

```yaml
schedule:
  - cron: '*/5 * * * *'  # 每5分钟
```
