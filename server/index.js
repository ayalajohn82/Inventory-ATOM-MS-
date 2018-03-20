const express = require('express');
const parser = require('body-parser');

const port = process.env.PORT || 8080;
const app = express();

app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));

app.listen(port);

console.log('server started on port ', port);