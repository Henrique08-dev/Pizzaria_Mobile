const bcrypt = require("bcrypt-nodejs");
const senhaTextoPlano = "123456";
const senhaCriptografada = bcrypt.hashSync(senhaTextoPlano);

console.log("Senha em texto plano:", senhaTextoPlano);
console.log("Hash bcrypt gerado:", senhaCriptografada);
