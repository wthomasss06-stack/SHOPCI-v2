const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Chargement local uniquement : les secrets restent dans .env.local / .env et ne sont
// jamais écrits dans le manifeste ni dans les logs.
const envPaths = [
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '.env'),
];

for (const envPath of envPaths) {
  if (!fs.existsSync(envPath)) continue;
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const equalsIdx = trimmed.indexOf('=');
    if (equalsIdx === -1) return;
    process.env[trimmed.slice(0, equalsIdx).trim()] = trimmed.slice(equalsIdx + 1).trim();
  });
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'gks3f2st';
const apiKey = process.env.CLOUDINARY_API_KEY || '674331848559466';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'V8-tl1howLhCFFPDNcdwS4XjB64';

const BASE_FOLDER = 'images';
const candidateDirs = [
  path.join(__dirname, 'shopci-web', 'public', 'images'),
  path.join(__dirname, 'public', 'images'),
  path.join(__dirname, 'ecommerce_backend', 'media'),
  path.join(__dirname, 'ecomm'),
].filter(d => fs.existsSync(d));

const manifestPath = path.join(__dirname, '.cloudinary-manifest.json');
const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');
const VIDEO_EXTENSIONS = new Set(['.webm', '.mp4', '.mov', '.m4v', '.avi']);

function loadManifest() {
  if (FORCE) return {};
  try { return JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return {}; }
}

function fileHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function getFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const filePath = path.join(dir, entry.name);
    return entry.isDirectory() ? getFilesRecursively(filePath) : [filePath];
  });
}

/**
 * Identifiant Cloudinary déterministe : le nom logique du média est son chemin
 * public sans extension. Ainsi, un nouveau WebP remplace le média précédent
 * portant le même nom de projet, même si son extension change.
 */
function publicIdFor(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/').normalize('NFC');
  const extension = path.posix.extname(normalized);
  return `${BASE_FOLDER}/${extension ? normalized.slice(0, -extension.length) : normalized}`;
}

function resourceTypeFor(relativePath) {
  return VIDEO_EXTENSIONS.has(path.extname(relativePath).toLowerCase()) ? 'video' : 'image';
}

function generateSignature(params, secret) {
  const payload = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHash('sha1').update(payload + secret).digest('hex');
}

async function uploadFile(filePath, relativePath) {
  const publicId = publicIdFor(relativePath);
  const resourceType = resourceTypeFor(relativePath);
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp,
    unique_filename: 'false',
    use_filename: 'false',
  };
  const signature = generateSignature(paramsToSign, apiSecret);
  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync(filePath)]), path.basename(filePath));
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('public_id', publicId);
  formData.append('overwrite', 'true');
  formData.append('invalidate', 'true');
  formData.append('unique_filename', 'false');
  formData.append('use_filename', 'false');
  formData.append('signature', signature);

  if (DRY_RUN) return { secure_url: '[dry-run]', public_id: publicId, resource_type: resourceType };

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || JSON.stringify(data));
  return data;
}

async function uploadAll() {
  if (candidateDirs.length === 0) {
    throw new Error(`Aucun dossier d'images source n'a été trouvé.`);
  }

  const fileEntries = [];
  const addedRelativePaths = new Set();

  for (const baseDir of candidateDirs) {
    const files = getFilesRecursively(baseDir);
    for (const filePath of files) {
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
      if (!addedRelativePaths.has(relativePath)) {
        addedRelativePaths.add(relativePath);
        fileEntries.push({ filePath, relativePath });
      }
    }
  }

  const manifest = loadManifest();
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const seenPaths = new Set();

  console.log(`🚀 Synchronisation de ${fileEntries.length} médias depuis [${candidateDirs.map(d => path.basename(d)).join(', ')}] vers Cloudinary${DRY_RUN ? ' (dry-run)' : ''}${FORCE ? ' (force)' : ''}`);

  for (const { filePath, relativePath } of fileEntries) {
    const publicId = publicIdFor(relativePath);
    const hash = fileHash(filePath);
    seenPaths.add(relativePath);
    const previous = manifest[relativePath];
    const previousHash = typeof previous === 'string' ? previous : previous?.hash;

    if (!FORCE && previousHash === hash) {
      skipped++;
      continue;
    }

    try {
      console.log(`⏳ ${relativePath} → ${publicId}`);
      const result = await uploadFile(filePath, relativePath);
      manifest[relativePath] = {
        hash,
        publicId,
        resourceType: resourceTypeFor(relativePath),
        updatedAt: new Date().toISOString(),
      };
      console.log(`  ✅ ${result.secure_url}`);
      uploaded++;
    } catch (error) {
      console.error(`  ❌ ${relativePath}: ${error.message}`);
      failed++;
    }
  }

  for (const knownPath of Object.keys(manifest)) {
    if (!seenPaths.has(knownPath)) delete manifest[knownPath];
  }
  if (!DRY_RUN) fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nTerminé — envoyés: ${uploaded}, inchangés: ${skipped}, échecs: ${failed}`);
  if (failed) process.exitCode = 1;
}

uploadAll().catch(error => { console.error(`❌ ${error.message}`); process.exitCode = 1; });
