const fs = require('fs');
const path = require('path');
const sm = require('source-map-js');
const SourceMapConsumer = sm.SourceMapConsumer || sm.default;

const mapPath = path.join(__dirname, 'dist/assets/index-ON40W9Nv.js.map');
const raw = fs.readFileSync(mapPath, 'utf8');
const map = JSON.parse(raw);

const consumer = new SourceMapConsumer(map);
const pos = consumer.originalPositionFor({ line: 849, column: 177289 });
console.log('ORIGINAL POSITION:', JSON.stringify(pos));
if (pos.source) {
  const content = consumer.sourceContentFor(pos.source, true);
  if (content) {
    const lines = content.split('\n');
    const ln = pos.line;
    for (let i = Math.max(0, ln - 8); i < Math.min(lines.length, ln + 4); i++) {
      console.log((i + 1) + ': ' + lines[i]);
    }
  } else {
    console.log('no content for', pos.source);
  }
}
