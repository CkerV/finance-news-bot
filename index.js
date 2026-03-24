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
async function sendToWechat(newsList) {
  const count = newsList.length;
  const title = `财经快讯 (${count}条)`;

  // 按时间正序排列（旧的在前）
  const sortedNews = [...newsList].reverse();

  const content = sortedNews.map((news, index) => {
    const newsTitle = news.title || news.highlight_title || '';
    const newsContent = news.content_text;
    const time = new Date(news.display_time * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const link = news.uri;

    return `
<div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #eee;">
  <div style="color: #666; font-size: 12px;">${time}</div>
  ${newsTitle ? `<div style="font-weight: bold; margin: 4px 0;">${newsTitle}</div>` : ''}
  <div style="color: #333;">${newsContent}</div>
  <a href="${link}" style="color: #1890ff; font-size: 12px;">查看详情</a>
</div>`;
  }).join('');

  const message = {
    token: PUSHPLUS_TOKEN,
    title: title,
    content: `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
<h3 style="margin: 0 0 16px 0;">📢 财经快讯</h3>
<p style="color: #999; font-size: 12px;">共 ${count} 条资讯</p>
${content}
</div>`,
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
  const testNewsList = [{
    title: '财经快讯测试消息',
    content_text: '这是一条测试消息，如果你收到这条消息，说明推送配置成功！',
    display_time: Math.floor(Date.now() / 1000),
    uri: 'https://wallstreetcn.com/'
  }];

  console.log('发送测试消息...');
  const result = await sendToWechat(testNewsList);
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

  // 获取所有比 lastId 更新的新闻
  const newNewsList = newsList.filter(news => news.id > lastId);

  if (newNewsList.length > 0) {
    console.log(`发现 ${newNewsList.length} 条新资讯`);
    newNewsList.forEach((news, i) => {
      console.log(`  ${i + 1}. [${news.id}] ${news.content_text.substring(0, 30)}...`);
    });

    await sendToWechat(newNewsList);
    console.log('发送成功!');

    // 保存最新一条的 ID
    saveLastNewsId(latestNews.id);
  } else {
    console.log('没有新资讯');
  }
}

main().catch(err => {
  console.error('运行出错:', err);
  process.exit(1);
});
