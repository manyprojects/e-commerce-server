/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createTable('cart', (table) => {
        table.increments('cart_id').primary();
        table.integer('user_id').unsigned();
        table.foreign('user_id')
        .references('users.user_id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
        table.integer('id').unsigned();
        table.foreign('id')
        .references('products.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
        table.integer('quantity').notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('cart');
};