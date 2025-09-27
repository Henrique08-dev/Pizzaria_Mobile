const config = require("../knexfile").development;
const knex = require("knex")(config);

knex
  .raw("SELECT 1")
  .then(() => {
    console.log("Conexão com PostgreSQL estabelecida!");
    return knex.migrate.latest();
  })
  .then(() => console.log("Migrations executadas com sucesso!"))
  .catch((err) => {
    console.error("Erro na conexão ou migrations:", err);
    process.exit(1);
  });

module.exports = knex;
