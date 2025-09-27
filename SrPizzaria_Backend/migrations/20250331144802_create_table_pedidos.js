/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('pedidos', table => {
        table.increments('id').primary();
        table.integer('userId').notNull().references('id').inTable('users').notNull();
        table.string('item').notNull();
        table.decimal('valor', 10, 2).notNull(); 
        table.integer('quantidade').notNull();
        table.dateTime('data_pedido').defaultTo(knex.fn.now());
    });
};


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('pedidos');
  
};
