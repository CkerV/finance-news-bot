# Finance News Bot

7x24 小时财经资讯播报机器人，通过 PushPlus 推送华尔街见闻快讯到微信。

## 功能

- 定时获取华尔街见闻 7x24 快讯
- 每次只推送最新的一条消息
- 通过 PushPlus 推送到个人微信

## 部署步骤

### 1. 获取 PushPlus Token

1. 微信扫码关注公众号「PushPlus推送加」
2. 关注后，在公众号菜单点击「功能」→「Token」获取你的 token

### 2. Fork 或创建仓库

将此项目推送到你的 GitHub 仓库。

### 3. 设置 GitHub Secrets

在仓库 Settings → Secrets and variables → Actions 中添加：
- `PUSHPLUS_TOKEN`: 你的 PushPlus token

### 4. 启用 GitHub Actions

1. 进入仓库的 Actions 页面
2. 启用 workflow
3. 手动触发一次测试

## 本地测试

```bash
# 安装依赖
npm install

# 设置环境变量
export PUSHPLUS_TOKEN="你的token"

# 运行
npm start
```

## 自定义

修改 `.github/workflows/news.yml` 中的 cron 表达式可以调整检查频率：

```yaml
schedule:
  - cron: '*/5 * * * *'  # 每5分钟
```
