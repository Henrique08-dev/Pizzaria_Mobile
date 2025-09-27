// migrations/XXXXXX_rename_userId_to_user_id.js
exports.up = function (knex) {
  return knex.schema.table("pedidos", function (table) {
    table.renameColumn("userId", "user_id");
  });
};

exports.down = function (knex) {
  return knex.schema.table("pedidos", function (table) {
    table.renameColumn("user_id", "userId");
  });
};
