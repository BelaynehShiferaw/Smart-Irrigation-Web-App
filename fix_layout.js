const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/components/Layout.jsx');
let content = fs.readFileSync(file, 'utf8');

// Remove billing from owner
content = content.replace("{ path:'/billing',           icon:'🧾', label:'Billing & Subscriptions' },", "");
content = content.replace("{ path:'/billing',           icon:'🧾', label:'ክፍያ' },", ""); // owner Amharic

// Remove billing from admin
content = content.replace("{ path:'/billing',          icon:'🧾', label:'Billing Management' },", "");
content = content.replace("{ path:'/billing',          icon:'🧾', label:'ክፍያ' },", ""); // admin Amharic

fs.writeFileSync(file, content);
console.log("Layout updated.");
