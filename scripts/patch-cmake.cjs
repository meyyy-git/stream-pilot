const fs = require('fs');

const files = [
  'node_modules/react-native-worklets/android/CMakeLists.txt',
  'node_modules/react-native-reanimated/android/CMakeLists.txt'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('CONFIGURE_DEPENDS')) {
      content = content.replaceAll(' CONFIGURE_DEPENDS', '');
      fs.writeFileSync(file, content, 'utf8');
    }
  }
}