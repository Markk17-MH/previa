// Turns index.html into web/previa.html for publishing as a claude.ai Artifact.
// The Artifact host adds its own <html>/<head>/<body> skeleton, charset/viewport meta
// and top/bottom safe-area padding, so those are stripped here.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const head = src.split('<head>')[1].split('</head>')[0]
  .replace(/\s*<meta charset[^>]*>/, '')
  .replace(/\s*<meta name="viewport"[^>]*>/, '');
const body = src.split(/<body[^>]*>/)[1].split('</body>')[0];

const title = head.match(/<title>.*?<\/title>/)[0];
const out = [
  title,
  '<meta name="claude:viewport-fit-sides" content="cover">',
  head.replace(title, '').trim(),
  body.trim()
].join('\n')
  .replace('calc(env(safe-area-inset-top, 0px) + 10px)', '10px')
  .replace('calc(env(safe-area-inset-bottom, 0px) + 28px)', '28px');

fs.mkdirSync(path.join(__dirname, 'web'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'web', 'previa.html'), out);
console.log('web/previa.html', out.length, 'bytes');
