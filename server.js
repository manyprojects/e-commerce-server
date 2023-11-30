const express = require('express');
const knex = require("knex")(require("./knexfile"));
require('dotenv').config();
const app = express();
const PORT =  process.env.PORT ?? 8080;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


app.use(cors({
    origin: process.env.CLIENT_URL
}));

app.use(express.json());

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

app.post('/checkout', async (req, res) => {
  const items = req.body.items;
  let lineItems = [];
  items.forEach((item) => {
    lineItems.push(
      {
        price: item.id,
        quantity: 1
      }
    )
  });

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/success`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`
  });

  res.send(JSON.stringify({
    url: session.url
  }));
});

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

// for phase 2: updates an item
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

// for phase 2: adds a single item to database
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
  
// chatGPT 
app.post('/completions', async (req, res) => {

  setting = `You are a language model assistant. Your responses should be based only on the shopping site data
  provided in the conversation. Do not use external sources or information beyond the given context. If the given quest
  requires you using external resource, you should respond as: "Sorry, I can't provide you with a response right now 
  because the question requires external resource." as the only sentence. Else if the response only requires using 
  provided data in this conversation, your response should be based on the questions and data below in the 
  object (key-value pairs) or in an array. Your response should be a summarized sentence plus list format. If there're lists 
  in your response, use bullet points or index numbers:

  { shopping-site-name: E-COMMERCE, num-of-products: 20, functionality: allows users to purchase with AI experience }

`
  const prompt = setting + JSON.stringify(req.body);
  const options = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GPT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
          // model: "text-davinci-003",
          model: "gpt-3.5-turbo-instruct",
          // prompt: "who is george washington?",
          prompt: prompt,
          max_tokens: 200
      })
  }
  try {
      const response = await fetch('https://api.openai.com/v1/completions', options);
      const data = await response.json();
      res.status(200).send(data);
  } catch (error) {
      res.status(500).json({ message: `Unable to generate a response: ${err}` });
  }
});

app.listen(PORT, () => {
    console.log(`Server Started on ${PORT}`);
    console.log('Press CTRL + C to stop server');
});

