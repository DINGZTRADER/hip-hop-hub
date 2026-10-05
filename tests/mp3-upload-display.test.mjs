import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, {createRequire} from 'node:module';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const loaded = new Module(import.meta.url);
loaded.require = id => id === '@vercel/blob/client' ? {} : require(id);
loaded._compile(ts.transpileModule(fs.readFileSync('src/components/audio/Mp3Upload.tsx', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022}}).outputText, 'mp3-upload.cjs');
const {Mp3Upload} = loaded.exports;
function render(value) {return renderToStaticMarkup(React.createElement(Mp3Upload, {value, onUploaded: () => {}, onBusyChange: () => {}, onError: () => {}}));}
test('verified filename remains visible when the upload component is mounted again', () => {
  const value = {masterName: 'My song.mp3', masterUploadId: 'upload', filesizeBytes: 5000000};
  for (let mount = 0; mount < 2; mount++) {
    const html = render(value);
    assert.match(html, /Replace MP3/);
    assert.match(html, /My song\.mp3/);
    assert.match(html, /Uploaded:/);
    assert.match(html, /class="sr-only"/);
    assert.doesNotMatch(html, /No MP3 uploaded yet/);
  }
});
test('empty upload has clear choose button and empty state', () => {
  const html = render({masterName: '', masterUploadId: '', filesizeBytes: 0});
  assert.match(html, /Choose MP3/);
  assert.match(html, /No MP3 uploaded yet/);
});
