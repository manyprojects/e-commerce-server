const express = require('express');
require('dotenv').config();
const app = express();
const PORT =  process.env.PORT ?? 8080;
const cors = require('cors');
const axios = require('axios');


app.use(cors({
    origin: process.env.CLIENT_URL
}));

app.use(express.json());






app.listen(PORT, () => {
    console.log(`Server Started on ${PORT}`);
    console.log('Press CTRL + C to stop server');
});

