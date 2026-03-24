import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const API_URL = 'https://api-one-wscn.awtmt.com/apiv1/search/live?channel=global-channel&limit=20&score=2';
const PUSHPLUS_TOKEN = process.env.PUSHPLUS_TOKEN;
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

// 发送 PushPlus 消息到微信
async function sendToWechat(news) {
  const title = news.title || news.highlight_title || '财经快讯';
  const content = news.content_text;
  const time = new Date(news.display_time * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const link = news.uri;

  const message = {
    token: PUSHPLUS_TOKEN,
    title: title,
    content: `${content}<br><br><small>${time}</small><br><a href="${link}">查看详情</a>`,
    template: 'html'
  };

  const response = await fetch('http://www.pushplus.plus/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });

  const result = await response.json();
  if (result.code !== 200) {
    throw new Error(`发送失败: ${result.msg}`);
  }
  return result;
}

// 发送测试消息
async function sendTestMessage() {
  const testNews = {
    title: '财经快讯测试消息',
    content_text: '这是一条测试消息，如果你收到这条消息，说明推送配置成功！',
    display_time: Math.floor(Date.now() / 1000),
    uri: 'https://wallstreetcn.com/'
  };

  console.log('发送测试消息...');
  const result = await sendToWechat(testNews);
  console.log('测试消息发送成功! 流水号:', result.data);
}

async function main() {
  const isTestMode = process.argv.includes('--test');

  if (!PUSHPLUS_TOKEN) {
    console.error('错误: 未设置 PUSHPLUS_TOKEN 环境变量');
    process.exit(1);
  }

  // 测试模式
  if (isTestMode) {
    await sendTestMessage();
    return;
  }

  console.log('开始检查最新资讯...');

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
