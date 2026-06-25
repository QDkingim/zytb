require('dotenv').config();

const express = require('express');
const compression = require('compression');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = (process.env.SITE_URL || 'https://www.renxiangsan.com').replace(/\/$/, '');
const ROOT = __dirname;

const criticalCss = fs.readFileSync(path.join(ROOT, 'css/critical.css'), 'utf8');
const indexTemplate = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const indexHtml = indexTemplate
  .replace('<!--CRITICAL_CSS-->', criticalCss)
  .replaceAll('<!--SITE_URL-->', SITE_URL);

app.set('trust proxy', 1);
app.use(compression());
app.use(express.json());

const ONE_WEEK = 604800;

app.use(express.static(ROOT, {
  index: false,
  setHeaders(res, filePath) {
    if (/\.(css|js|svg|ico|png|jpg|jpeg|webp|woff2?)$/.test(filePath)) {
      res.setHeader('Cache-Control', `public, max-age=${ONE_WEEK}, immutable`);
    }
  },
}));

app.get('/', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300, must-revalidate');
  res.set('Link', '</css/style.css>; rel=preload; as=style');
  res.type('html').send(indexHtml);
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: Googlebot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);
});

app.get('/sitemap.xml', (_req, res) => {
  const lastmod = new Date().toISOString().slice(0, 10);
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`);
});

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('缺少 SMTP 配置，请检查 .env 文件');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: Number(SMTP_PORT) !== 587,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function validatePayload(body) {
  const { name, phone, wechat, province, score } = body;

  if (!name?.trim() || !phone?.trim() || !wechat?.trim() || !province || !score) {
    return '请填写所有必填项（姓名、电话、微信号、省份、分数）';
  }

  if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
    return '请输入正确的手机号码';
  }

  const scoreNum = Number(score);
  if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 750) {
    return '请输入有效的高考分数（0-750）';
  }

  return null;
}

app.post('/api/submit', async (req, res) => {
  const error = validatePayload(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const {
    name,
    phone,
    wechat,
    province,
    score,
    rank = '',
    subject = '',
    interest = '',
    remark = '',
  } = req.body;

  const mailTo = process.env.MAIL_TO || 'renxiangsan666@163.com';
  const submittedAt = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  const text = [
    '【智愿填报】新的咨询表单提交',
    '',
    `提交时间：${submittedAt}`,
    `姓名：${name.trim()}`,
    `联系电话：${phone.trim()}`,
    `微信号：${wechat.trim()}`,
    `所在省份：${province}`,
    `高考分数：${score}`,
    `全省位次：${rank || '未填写'}`,
    `选科组合：${subject || '未填写'}`,
    `专业兴趣：${interest || '未填写'}`,
    `其他说明：${remark || '未填写'}`,
  ].join('\n');

  const html = `
    <h2>【智愿填报】新的咨询表单提交</h2>
    <table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td style="color:#666;">提交时间</td><td>${submittedAt}</td></tr>
      <tr><td style="color:#666;">姓名</td><td>${name.trim()}</td></tr>
      <tr><td style="color:#666;">联系电话</td><td>${phone.trim()}</td></tr>
      <tr><td style="color:#666;">微信号</td><td>${wechat.trim()}</td></tr>
      <tr><td style="color:#666;">所在省份</td><td>${province}</td></tr>
      <tr><td style="color:#666;">高考分数</td><td>${score}</td></tr>
      <tr><td style="color:#666;">全省位次</td><td>${rank || '未填写'}</td></tr>
      <tr><td style="color:#666;">选科组合</td><td>${subject || '未填写'}</td></tr>
      <tr><td style="color:#666;">专业兴趣</td><td>${interest || '未填写'}</td></tr>
      <tr><td style="color:#666;">其他说明</td><td>${remark || '未填写'}</td></tr>
    </table>
  `;

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"智愿填报" <${process.env.SMTP_USER}>`,
      to: mailTo,
      subject: `【智愿填报】新咨询 - ${name.trim()} / ${province} / ${score}分`,
      text,
      html,
    });

    res.json({ success: true, message: '提交成功，稍后联系您' });
  } catch (err) {
    console.error('邮件发送失败:', err.message);
    res.status(500).json({ success: false, message: '提交失败，请稍后重试或直接添加微信咨询' });
  }
});

app.listen(PORT, () => {
  console.log(`服务已启动: http://localhost:${PORT}`);
});
