const { table } = require("../config/db");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('produtos', table => {
        table.increments('id').primary(); // ID único
        table.string('nome').notNull(); // Nome do produto
        table.decimal('preco', 10, 2).notNull(); // Preço do produto
        table.string('categoria').notNull(); // Categoria (pizzas, bebidas, etc.)
        table.string('descricao').notNull(); // Descrição do produto
        table.string('imagem').notNull(); // Caminho da imagem (se necessário)
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('produtos');
};
