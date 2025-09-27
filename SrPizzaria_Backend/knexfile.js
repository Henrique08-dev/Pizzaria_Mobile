module.exports = {
  development: {
    client: "pg",
    connection: {
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "teste",
      database: "pizzaria",
    },
    migrations: {
      directory: "./migrations",
    },
  },
};
