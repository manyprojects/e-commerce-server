const express = require('express');
const knex = require("knex")(require("./knexfile"));
require('dotenv').config();
const app = express();
const PORT =  process.env.PORT ?? 8080;
const cors = require('cors');
const axios = require('axios');


app.use(cors({
    origin: process.env.CLIENT_URL
}));

app.use(express.json());

app.get("/", async (req, res) => {
    try {
      const data = await knex("products");
    //   console.log(data);
  
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json(`Error retreieving Products: ${err}`);
    }
})

app.post("/", async (req, res) => {
      try {
        const data = await knex.insert(req.body).into("products");
        console.log(data);
        return res.status(201).send("Product added!");
  
      } catch (err) {
        res
          .status(500)
          .json({ message: `Unable to create new product: ${err}` });
      }
    
  });
  






app.listen(PORT, () => {
    console.log(`Server Started on ${PORT}`);
    console.log('Press CTRL + C to stop server');
});

