require("dotenv").config();
const jwt = require("jwt-simple");
const bcrypt = require("bcrypt-nodejs");

const authSecret = process.env.authSecret;
if (!authSecret || typeof authSecret !== "string" || authSecret.trim() === "") {
  throw new Error(
    "FATAL: authSecret não configurado corretamente no arquivo .env"
  );
}

module.exports = (app) => {
  const signin = async (req, res) => {
    try {
      if (!req.body.email || !req.body.senha) {
        return res
          .status(400)
          .json({ error: "E-mail e senha são necessários" });
      }

      const user = await app
        .db("users")
        .where({ email: req.body.email })
        .first();

      if (!user) {
        return res.status(401).json({ error: "Credenciais invalidas" });
      }

      bcrypt.compare(req.body.senha, user.senha, (err, isMatch) => {
        if (err) {
          console.error("BCrypt erro:", err);
          return res.status(500).json({ error: "Erro servidor interno" });
        }

        if (!isMatch) {
          return res.status(401).json({ error: "Credenciais invalida" });
        }

        const payload = { id: user.id };
        const token = jwt.encode(payload, authSecret);

        res.json({
          user: {
            id: user.id,
            name: user.nome,
            email: user.email,
            CPF: user.CPF,
          },
          token: token,
        });
      });
    } catch (error) {
      console.error("Erro login:", error);
      res.status(500).json({ error: "Erro servidor interno" });
    }
  };

  return { signin };
};
