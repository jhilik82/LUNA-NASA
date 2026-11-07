import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('prepared offline game has valid embedded data and executable inline scripts',()=>{
  const html=fs.readFileSync(new URL('../dist/luna-playable.html',import.meta.url),'utf8');
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length,2,'data and client must be embedded without external scripts');
  for(const [,attributes,source] of scripts){assert.ok(!/\bsrc\s*=/.test(attributes));assert.doesNotThrow(()=>new vm.Script(source));}
  const context={window:{}};vm.runInNewContext(scripts[0][2],context);
  assert.equal(context.window.LUNA_DATA.tranquillitatis.heights.length,6400);
  assert.ok(context.window.LUNA_DATA.scenarios.moon&&context.window.LUNA_DATA.scenarios.mars);
  assert.ok(scripts[1][2].includes('persistent-lunar-gravel-field'));
});
