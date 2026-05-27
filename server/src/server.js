const express = require('express');
const app = express();
const route = require('./routes');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./Config/db');
const path = require('path');
const bodyParser = require('body-parser');

require('dotenv').config();

const port = process.env.PORT || 3000;

app.use(cookieParser());
app.use(cors({ origin: process.env.REACT_APP_URL, credentials: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/images/products/uploads', express.static(path.join(__dirname, './uploads')));

route(app);
connectDB();

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
