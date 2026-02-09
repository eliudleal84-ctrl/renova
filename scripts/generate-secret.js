const crypto = require('crypto');

console.log('\n🔐 Generando NEXTAUTH_SECRET...\n');
const secret = crypto.randomBytes(32).toString('hex');
console.log('Tu NEXTAUTH_SECRET es:\n');
console.log(secret);
console.log('\nCopia este valor en tu archivo .env.local\n');
