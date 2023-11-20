/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createTable('products', (table) => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.decimal('price', 10, 2).notNullable();
        table.text('description');
        table.string('category');
        table.string('image');
        table.integer('rate').notNullable();
        table.integer('count').notNullable();
    })
};

    /**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('products');
};