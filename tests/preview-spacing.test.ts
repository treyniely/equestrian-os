import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('calendar preview spacing applies within a single offering picker dialog', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const rule = css.match(/(?:^|\n)\.offering-color-picker \.offering-color-preview\s*\{([^}]+)\}/)?.[1];
  assert.ok(rule, 'The preview selector must match a picker without nested dialogs');
  for (const declaration of ['display:flex', 'flex-wrap:wrap', 'gap:var(--space-3)', 'margin-top:var(--space-4)', 'padding-top:var(--space-4)']) {
    assert.ok(rule.includes(declaration), declaration);
  }
  assert.match(css, /\.offering-color-preview \.pill\.category-label\{padding:var\(--space-1\) var\(--space-3\)\}/);
});
