import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const API_URL = 'https://api-one-wscn.awtmt.com/apiv1/search/live?channel=global-channel&limit=20&score=2';
const WEBHOOK_URL = process.env.WECHAT_WEBHOOK_URL;
const LAST_NEWS_FILE = './last-news.json';

// 读取上次发送的新闻ID
function getLastNewsId() {
  if (existsSync(LAST_NEWS_FILE)) {
    const data = JSON.parse(readFileSync(LAST_NEWS_FILE, 'utf-8'));
    return data.lastId;
  }
  return null;
}

// 保存最新的新闻ID
function saveLastNewsId(id) {
  writeFileSync(LAST_NEWS_FILE, JSON.stringify({ lastId: id, updatedAt: new Date().toISOString() }));
}

// 获取最新资讯
async function fetchLatestNews() {
  const response = await fetch(API_URL);
  const data = await response.json();
  if (data.code === 20000 && data.data?.items?.length > 0) {
    return data.data.items;
  }
  throw new Error('获取资讯失败');
}

// 发送企业微信消息
async function sendToWechat(news) {
  const title = news.title || news.highlight_title || '财经快讯';
  const content = news.content_text;
  const time = new Date(news.display_time * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const link = news.uri;

  const message = {
    msgtype: 'markdown',
    markdown: {
      content: `### ${title}\n\n${content}\n\n> ${time}\n[查看详情](${link})`
    }
  };

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });

  const result = await response.json();
  if (result.errcode !== 0) {
    throw new Error(`发送失败: ${result.errmsg}`);
  }
  return true;
}

async function main() {
  console.log('开始检查最新资讯...');

  if (!WEBHOOK_URL) {
    console.error('错误: 未设置 WECHAT_WEBHOOK_URL 环境变量');
    process.exit(1);
  }

  const lastId = getLastNewsId();
  console.log('上次发送的新闻ID:', lastId);

  const newsList = await fetchLatestNews();
  const latestNews = newsList[0];

  // 如果是第一次运行，只保存ID，不发送
  if (!lastId) {
    console.log('首次运行，保存最新新闻ID:', latestNews.id);
    saveLastNewsId(latestNews.id);
    return;
  }

  // 如果有新消息
  if (latestNews.id > lastId) {
    console.log('发现新资讯:', latestNews.id, latestNews.content_text.substring(0, 50));
    await sendToWechat(latestNews);
    console.log('发送成功!');
    saveLastNewsId(latestNews.id);
  } else {
    console.log('没有新资讯');
  }
}

main().catch(err => {
  console.error('运行出错:', err);
  process.exit(1);
});
