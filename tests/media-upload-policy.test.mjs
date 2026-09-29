import assert from "node:assert/strict";
import test from "node:test";
import { parseUploadPath, uploadPath, validUploadSize, MAX_MASTER_BYTES, MAX_PREVIEW_BYTES } from "../src/lib/media-upload-policy.ts";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const uploadId = "33333333-3333-4333-8333-333333333333";

test("upload path is tied to the signed-in user and a valid MP3 slot", () => {
  const path = uploadPath(owner, "master", uploadId);
  assert.deepEqual(parseUploadPath(path, owner), { id: uploadId, kind: "master" });
  assert.equal(parseUploadPath(path, other), null);
  assert.equal(parseUploadPath(path.replace(".mp3", ".html"), owner), null);
  assert.equal(parseUploadPath(path.replace("/master/", "/other/"), owner), null);
  assert.equal(parseUploadPath(path + "/extra", owner), null);
});

test("full tracks and preview clips have separate size ceilings", () => {
  assert.equal(validUploadSize("master", MAX_MASTER_BYTES), true);
  assert.equal(validUploadSize("master", MAX_MASTER_BYTES + 1), false);
  assert.equal(validUploadSize("preview", MAX_PREVIEW_BYTES), true);
  assert.equal(validUploadSize("preview", MAX_PREVIEW_BYTES + 1), false);
  assert.equal(validUploadSize("preview", NaN), false);
  assert.equal(validUploadSize("master", 0), false);
});
