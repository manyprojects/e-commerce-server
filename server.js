const express = require('express');
const knex = require("knex")(require("./knexfile"));
require('dotenv').config();
const app = express();
const PORT =  process.env.PORT ?? 8080;
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


app.use(cors({
    origin: process.env.CLIENT_URL
}));

app.use(express.json());


// gets all the products
app.get('/', async (_req, res) => {
    try {
      const data = await knex('products'); 
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json(`Error retreieving Products: ${err}`);
    }
});

// gets a selected product
app.get('/products/:id', async (req, res) => {
  try {
    const data = await knex('products')
    .select('*')
    .where({
      id: req.params.id
    });
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json(`Error retreieving Products: ${err}`);
  }
});

// for phase 2
app.put('/products/:id', async (req, res) => {
  const updates = req.body;
  try {
    const number = await knex('products')
    .where({ id: req.params.id })
    .update(updates);

  } catch (err) {
    res
    .status(500)
    .json({ message: `Product ID: ${req.params.id} doesn't exist!` });
  }
});


app.post('/', async (req, res) => {
    try {
      const data = await knex.insert(req.body).into("products");
      return res.status(201).send("Product added!");
    } catch (err) {
      res
        .status(500)
        .json({ message: `Unable to create new product: ${err}` });
    }
});

// Creates a new user
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if ( !username || !email || !password ) {
    return res.status(400).json({ message: 'Please enter the required fields' });
  }
  const hashedPassword = bcrypt.hashSync(password);
  
  const newUser = {
    username,
    email,
    password_hash: hashedPassword
  };

  try {
    const data = await knex.insert(newUser).into("users");
    return res.status(201).send("Signed up successful!");

  } catch (err) {
    res
      .status(500)
      .json({ message: `Unable to create new user: ${err}` });
  }
});


// Login a user
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if ( !email || !password ) {
    return res.status(400).json({ message: 'Please enter the required fields' });
  }

  // find the user
  const user = await knex('users').where({ email: email }).first();
  if( !user ) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  // validate the password
  const isPasswordCorrect = bcrypt.compareSync(password, user.password_hash);
  if( !isPasswordCorrect ) {
    return res.status(400).json({ message: "Invalid password" });
  }

  // generates the token as a response
  const token = jwt.sign(
    { user_id: user.user_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  )

  res.status(200).json({ token: token });
});

// insert shpooing cart items to database
app.post('/insertItems', async (req, res) => {
  const items = req.body;
  try {
    await knex('cart').insert(items);
    res.status(200).json({ message: 'Items inserted in cart table' });
  } catch(err) {
    res.status(500).json({ message: 'Can not insert items' });
  }
});

// fetch all items from database in cart after users signed in
app.get('/getItems', async (_req, res) => {
  try {
    const data = await knex('cart');
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json(`Error retreieving Products: ${err}`);
  }
});

// fetch user by email
app.get('/:email', async (req, res) => {
  try {
    const data = await knex('users')
    .select('*')
    .where({
      email: req.params.email
    });
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json(`Error retreieving user: ${err}`);
  }
});

// get cart items after user signed in (tables joined)
app.get('/cart/:email', async (req, res) => {
  try {
    const data = await knex('cart')
    .select(
      'cart.*',
      'users.*',
      'products.*'
    )
    .join('users', 'cart.user_id','=', 'users.user_id')
    .join('products', 'cart.id', '=', 'products.id')
    .where({ 'users.email': req.params.email });
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json( `Error retreieving products: ${err}` );
  }
});

// delet item from cart after user signed in
app.delete('/cart/:userId/:id', async (req, res) => {
  try{
    const itemDelete = await knex('cart')
    .where({ id: req.params.id, user_id: req.params.userId }).first()
    .delete();
    if (itemDelete === 0) {
      return res
        .status(404)
        .json({ message: `item ID ${req.params.id} not found` });
    }
    res.status(204).json(itemDelete);
  } catch(err) {
    res.status(500).json({ message: `Unable to delete item: ${err}` });
  }
});
  

app.listen(PORT, () => {
    console.log(`Server Started on ${PORT}`);
    console.log('Press CTRL + C to stop server');
});

