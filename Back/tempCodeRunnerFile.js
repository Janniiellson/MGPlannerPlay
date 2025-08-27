const bcrypt = require('bcryptjs');
const password = '8137'; // <-- TROQUE AQUI

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('Sua senha em texto puro:', password);
console.log('Seu hash seguro:', hash);