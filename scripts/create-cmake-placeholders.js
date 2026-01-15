const fs = require('fs');
const path = require('path');

const placeholders = [
  {
    dir: 'node_modules/@react-native-async-storage/async-storage/android/build/generated/source/codegen/jni',
    target: 'react_codegen_rnasyncstorage'
  },
  {
    dir: 'node_modules/@react-native-community/datetimepicker/android/build/generated/source/codegen/jni',
    target: 'react_codegen_RNDateTimePickerCGen'
  },
  {
    dir: 'node_modules/react-native-gesture-handler/android/build/generated/source/codegen/jni',
    target: 'react_codegen_rngesturehandler_codegen'
  },
  {
    dir: 'node_modules/react-native-reanimated/android/build/generated/source/codegen/jni',
    target: 'react_codegen_rnreanimated'
  },
  {
    dir: 'node_modules/react-native-worklets/android/build/generated/source/codegen/jni',
    target: 'react_codegen_rnworklets'
  },
  {
    dir: 'node_modules/@shopify/react-native-skia/android/build/generated/source/codegen/jni',
    target: 'react_codegen_rnskia'
  }
];

function ensurePlaceholder(dir, target) {
  const fullDir = path.join(process.cwd(), dir);
  try {
    fs.mkdirSync(fullDir, { recursive: true });
    const file = path.join(fullDir, 'CMakeLists.txt');
    const content = `# Auto-generated placeholder to satisfy React Native autolinking CMake\ncmake_minimum_required(VERSION 3.13)\nif(NOT TARGET ${target})\n  add_library(${target} INTERFACE)\nendif()\nset_target_properties(${target} PROPERTIES INTERFACE_LINK_LIBRARIES "")\n`;
    fs.writeFileSync(file, content, 'utf8');
    console.log(`[create-cmake-placeholders] wrote ${file}`);
  } catch (e) {
    console.error(`[create-cmake-placeholders] failed to write placeholder for ${dir}:`, e.message);
  }
}

placeholders.forEach(p => ensurePlaceholder(p.dir, p.target));

// Exit with success; postinstall should not block the install on failures here.
process.exit(0);
