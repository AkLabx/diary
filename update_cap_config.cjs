const fs = require('fs');

let configStr = fs.readFileSync('capacitor.config.ts', 'utf8');

configStr = configStr.replace(
  /plugins:\s*\{\s*GoogleAuth:\s*\{[\s\S]*?\}\s*\}/,
  `plugins: {
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      }
    }
  }`
);

fs.writeFileSync('capacitor.config.ts', configStr);
