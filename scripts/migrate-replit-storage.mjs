// One-time copy of every uploaded file from the Replit App Storage bucket into
// your own Google Cloud Storage bucket.
//
// RUN THIS INSIDE THE REPLIT PROJECT'S SHELL, before shutting the Replit
// project down. The Replit bucket can only be read from inside Replit, so this
// cannot run on your own computer or on the new host.
//
// Steps:
//   1. Upload this file to the root folder of the Replit project.
//   2. In Replit, add two Secrets (Tools -> Secrets):
//        NEW_BUCKET   the name of your new bucket, for example brightside-files
//        NEW_GCS_KEY  the whole service-account JSON key for the new bucket
//   3. In the Replit shell, check what would be copied, then copy it:
//        node migrate-replit-storage.mjs --dry-run
//        node migrate-replit-storage.mjs
//
// Folder layout, content types and each file's access-control metadata
// (custom:aclPolicy) are kept, so the database needs no changes. It is safe to
// run again: files already copied with the same size are skipped.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

const dryRun = process.argv.includes('--dry-run');
const CONCURRENCY = 4;

function loadStorageClass() {
  for (const from of ['artifacts/api-server/package.json', 'package.json']) {
    try {
      return createRequire(resolve(from))('@google-cloud/storage').Storage;
    } catch {
      // try the next location
    }
  }
  throw new Error(
    'Could not load @google-cloud/storage. Run this from the root of the Replit project (after `pnpm install`).',
  );
}

function bucketOf(objectPath) {
  return objectPath?.trim().replace(/^\/+/, '').split('/')[0] || undefined;
}

const Storage = loadStorageClass();

// ── Source: the Replit App Storage bucket, via Replit's credential sidecar ────
const SIDECAR = 'http://127.0.0.1:1106';
const source = new Storage({
  credentials: {
    audience: 'replit',
    subject_token_type: 'access_token',
    token_url: `${SIDECAR}/token`,
    type: 'external_account',
    credential_source: {
      url: `${SIDECAR}/credential`,
      format: { type: 'json', subject_token_field_name: 'access_token' },
    },
    universe_domain: 'googleapis.com',
  },
  projectId: '',
});
const sourceBucketName =
  process.env.SOURCE_BUCKET ||
  bucketOf(process.env.PRIVATE_OBJECT_DIR) ||
  bucketOf(process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0]);
if (!sourceBucketName) {
  throw new Error(
    'Could not find the Replit bucket. PRIVATE_OBJECT_DIR is not set; are you running this inside the Replit shell?',
  );
}

// ── Destination: your own bucket, via a service-account key ───────────────────
const destBucketName = process.env.NEW_BUCKET?.trim().replace(/^gs:\/\//, '').replace(/\/+$/, '');
if (!destBucketName) throw new Error('Set NEW_BUCKET to the name of your new bucket.');
if (destBucketName === sourceBucketName) throw new Error('NEW_BUCKET is the same as the Replit bucket.');

const keyJson =
  process.env.NEW_GCS_KEY ||
  (process.env.NEW_GCS_KEY_FILE ? readFileSync(process.env.NEW_GCS_KEY_FILE, 'utf8') : '');
if (!keyJson) throw new Error('Set NEW_GCS_KEY to the service-account JSON key for the new bucket.');
const destCredentials = JSON.parse(keyJson);
const dest = new Storage({ credentials: destCredentials, projectId: destCredentials.project_id });

const sourceBucket = source.bucket(sourceBucketName);
const destBucket = dest.bucket(destBucketName);

console.log(`From: gs://${sourceBucketName}  (Replit)`);
console.log(`To:   gs://${destBucketName}`);
if (dryRun) console.log('Dry run: nothing will be copied.');

const [files] = await sourceBucket.getFiles({ autoPaginate: true });
const realFiles = files.filter((f) => !f.name.endsWith('/'));
const totalBytes = realFiles.reduce((sum, f) => sum + Number(f.metadata.size ?? 0), 0);
console.log(`Found ${realFiles.length} file(s), ${(totalBytes / 1024 / 1024).toFixed(1)} MB.\n`);

let copied = 0;
let skipped = 0;
const failed = [];

async function copyOne(file) {
  const size = Number(file.metadata.size ?? 0);
  const target = destBucket.file(file.name);
  const [exists] = await target.exists();
  if (exists) {
    const [meta] = await target.getMetadata();
    if (Number(meta.size ?? -1) === size) {
      skipped++;
      return;
    }
  }
  if (dryRun) {
    console.log(`would copy  ${file.name}  (${size} bytes)`);
    copied++;
    return;
  }
  const { contentType, cacheControl, contentDisposition, contentEncoding, contentLanguage, metadata } =
    file.metadata;
  await pipeline(
    // decompress:false copies the stored bytes exactly, even for gzip-encoded objects.
    file.createReadStream({ decompress: false }),
    target.createWriteStream({
      resumable: size > 8 * 1024 * 1024,
      gzip: false,
      metadata: {
        contentType,
        cacheControl,
        contentDisposition,
        contentEncoding,
        contentLanguage,
        // Custom metadata, including custom:aclPolicy used for access control.
        metadata: metadata ?? {},
      },
    }),
  );
  copied++;
  console.log(`copied  ${file.name}  (${size} bytes)`);
}

const queue = [...realFiles];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      try {
        await copyOne(file);
      } catch (err) {
        failed.push(file.name);
        console.error(`FAILED  ${file.name}: ${err?.message ?? err}`);
      }
    }
  }),
);

console.log(
  `\n${dryRun ? 'Would copy' : 'Copied'} ${copied}, already there ${skipped}, failed ${failed.length}.`,
);
if (failed.length) {
  console.log('Run the script again to retry the failed files.');
  process.exitCode = 1;
} else if (!dryRun) {
  const swap = (p) => p?.trim().replace(`/${sourceBucketName}`, `/${destBucketName}`);
  console.log('\nAll files are in the new bucket. On the new host, set:');
  console.log(
    `  PUBLIC_OBJECT_SEARCH_PATHS=${
      (process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? '').split(',').map(swap).filter(Boolean).join(',') ||
      `/${destBucketName}/public`
    }`,
  );
  console.log(`  PRIVATE_OBJECT_DIR=${swap(process.env.PRIVATE_OBJECT_DIR) || `/${destBucketName}/.private`}`);
  console.log('\nThen delete the NEW_GCS_KEY secret from Replit.');
}
