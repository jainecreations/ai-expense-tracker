const fs = require('fs');
const path = require('path');

const pkgDir = path.resolve(__dirname, '..');
const target = path.join(pkgDir, 'node_modules', 'react-native-android-sms-listener', 'android', 'build.gradle');

function log(...args) {
  console.log('[patch-sms-listener]', ...args);
}

try {
  if (!fs.existsSync(target)) {
    log('target not found, skipping patch:', target);
    process.exit(0);
  }

  let src = fs.readFileSync(target, 'utf8');
  let out = src;

  // replace legacy support libs with AndroidX appcompat
  out = out.replace(/com\.android\.support:appcompat-v7:[^'"\s]+/g, 'androidx.appcompat:appcompat:1.6.1');

  // replace compile(...) and compile '...' with implementation equivalents
  out = out.replace(/compile\(/g, 'implementation(');
  out = out.replace(/compile\s+'([^']+)'/g, "implementation '$1'");
  out = out.replace(/compile\s+\"([^\"]+)\"/g, 'implementation "$1"');

  // ensure react-native dependency uses implementation
  out = out.replace(/compileOnly\s+'com.facebook.react:react-native:[^'"\s]+'/g, (m) => m.replace('compileOnly', 'implementation'));

  // If compileOptions is not present, insert Java 11 compileOptions so
  // Java 9+ source compiles in EAS/local builds.
  if (!/compileOptions\s*\{/.test(out)) {
    out = out.replace(/(compileSdkVersion\s*\d+\s*)/, `$1\n\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_11\n        targetCompatibility JavaVersion.VERSION_11\n    }\n`);
  }

  if (out !== src) {
    fs.writeFileSync(target, out, 'utf8');
    log('patched', target);
  } else {
    log('no changes needed for', target);
  }
} catch (e) {
  console.error('[patch-sms-listener] failed', e);
  process.exit(1);
}
