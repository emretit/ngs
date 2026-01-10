#!/usr/bin/env node

/**
 * Console to Logger Migration Script (Node.js Version)
 * Bu script console.log/warn/error/debug'ı logger'a migrate eder
 * 
 * Kullanım: node scripts/migrate-console-to-logger.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Renkli output için
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// İstatistikler
const stats = {
  totalFiles: 0,
  modifiedFiles: 0,
  totalReplacements: 0,
  skippedFiles: [],
  errors: [],
};

// Dry run mode
const isDryRun = process.argv.includes('--dry-run');

console.log(`${colors.cyan}🔄 Console to Logger Migration Script${colors.reset}`);
console.log('======================================');
console.log('');
if (isDryRun) {
  console.log(`${colors.yellow}⚠️  DRY RUN MODE - Dosyalar değiştirilmeyecek${colors.reset}`);
  console.log('');
}

// Yedek dizini
const backupDir = `.console-migration-backup-${Date.now()}`;

/**
 * Dosyaları recursive olarak bul
 */
function findFiles(dir, extensions = ['.ts', '.tsx']) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // node_modules, dist, build gibi dizinleri atla
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  }

  return results;
}

/**
 * Dosyada logger import var mı kontrol et
 */
function hasLoggerImport(content) {
  return content.includes("from '@/utils/logger'") || 
         content.includes('from "@/utils/logger"');
}

/**
 * Logger import ekle
 */
function addLoggerImport(content) {
  // İlk import satırını bul
  const lines = content.split('\n');
  let importIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      importIndex = i;
      break;
    }
  }
  
  if (importIndex === -1) {
    // Import yoksa dosya başına ekle
    return "import { logger } from '@/utils/logger';\n\n" + content;
  }
  
  // İlk import'tan sonra ekle
  lines.splice(importIndex + 1, 0, "import { logger } from '@/utils/logger';");
  return lines.join('\n');
}

/**
 * Console statements'ı logger'a çevir
 */
function replaceConsoleWithLogger(content) {
  let modified = content;
  let replacements = 0;
  
  // console.log -> logger.debug
  const logMatches = (modified.match(/console\.log\(/g) || []).length;
  modified = modified.replace(/console\.log\(/g, 'logger.debug(');
  replacements += logMatches;
  
  // console.warn -> logger.warn
  const warnMatches = (modified.match(/console\.warn\(/g) || []).length;
  modified = modified.replace(/console\.warn\(/g, 'logger.warn(');
  replacements += warnMatches;
  
  // console.error -> logger.error
  const errorMatches = (modified.match(/console\.error\(/g) || []).length;
  modified = modified.replace(/console\.error\(/g, 'logger.error(');
  replacements += errorMatches;
  
  // console.debug -> logger.debug
  const debugMatches = (modified.match(/console\.debug\(/g) || []).length;
  modified = modified.replace(/console\.debug\(/g, 'logger.debug(');
  replacements += debugMatches;
  
  return { modified, replacements };
}

/**
 * Dosyayı işle
 */
function processFile(filePath) {
  stats.totalFiles++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Console kullanımı var mı kontrol et
    if (!content.match(/console\.(log|warn|error|debug)\(/)) {
      return;
    }
    
    console.log(`📝 İşleniyor: ${filePath}`);
    
    let modified = content;
    
    // Logger import ekle (yoksa)
    if (!hasLoggerImport(modified)) {
      modified = addLoggerImport(modified);
      console.log('   ➕ Logger import eklendi');
    }
    
    // Console'ları değiştir
    const { modified: finalContent, replacements } = replaceConsoleWithLogger(modified);
    
    if (replacements > 0) {
      if (!isDryRun) {
        // Yedek al
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const relativePath = path.relative('src', filePath);
        const backupPath = path.join(backupDir, relativePath);
        const backupDirPath = path.dirname(backupPath);
        
        if (!fs.existsSync(backupDirPath)) {
          fs.mkdirSync(backupDirPath, { recursive: true });
        }
        
        fs.copyFileSync(filePath, backupPath);
        
        // Değişiklikleri yaz
        fs.writeFileSync(filePath, finalContent, 'utf8');
      }
      
      stats.modifiedFiles++;
      stats.totalReplacements += replacements;
      console.log(`   ✅ Tamamlandı (${replacements} değişiklik)`);
    }
  } catch (error) {
    console.error(`${colors.red}   ❌ Hata: ${error.message}${colors.reset}`);
    stats.errors.push({ file: filePath, error: error.message });
  }
}

/**
 * Ana fonksiyon
 */
async function main() {
  console.log('🔍 Dosyalar taranıyor...');
  console.log('');
  
  // src/ altındaki dosyaları bul
  const files = findFiles('src', ['.ts', '.tsx']);
  console.log(`📂 ${files.length} dosya bulundu`);
  console.log('');
  
  // Her dosyayı işle
  for (const file of files) {
    processFile(file);
  }
  
  // Özet
  console.log('');
  console.log('======================================');
  console.log('📊 Özet');
  console.log('======================================');
  console.log(`${colors.green}✅ Taranan dosya: ${stats.totalFiles}${colors.reset}`);
  console.log(`${colors.green}✅ Değiştirilen dosya: ${stats.modifiedFiles}${colors.reset}`);
  console.log(`${colors.green}✅ Toplam değişiklik: ${stats.totalReplacements}${colors.reset}`);
  
  if (stats.errors.length > 0) {
    console.log(`${colors.red}❌ Hata sayısı: ${stats.errors.length}${colors.reset}`);
    console.log('');
    console.log('Hatalar:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }
  
  if (!isDryRun) {
    console.log(`${colors.yellow}📦 Yedek dizini: ${backupDir}${colors.reset}`);
  }
  
  console.log('');
  console.log('⚠️  DİKKAT:');
  console.log('  1. Değişiklikleri kontrol edin: git diff');
  console.log('  2. Build çalıştırın: npm run build');
  console.log('  3. Testleri çalıştırın: npm test');
  console.log('');
  
  if (!isDryRun) {
    console.log(`Geri alma için: node scripts/restore-console-backup.js ${backupDir}`);
  } else {
    console.log('Gerçek migration için: node scripts/migrate-console-to-logger.js');
  }
  console.log('');
}

// Scripti çalıştır
main().catch(error => {
  console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
