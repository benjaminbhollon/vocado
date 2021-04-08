'use strict';

const vocado = require('./index.js');

const app = vocado();

app.all('/', async (request, response) => {
  response
    .status(200)
    .html('<p>Hello? World?</p>');
});

app.listen(80, () => {
  console.log('Serving on port 80.');
});
