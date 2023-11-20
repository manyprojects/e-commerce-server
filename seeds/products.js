/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
// import seed data files, arrays of objects
const productData = require('../seed-data/products');

exports.seed = async function(knex) {
  await knex('products').del();
  await knex('products').insert(productData);
};
