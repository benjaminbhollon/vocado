'use strict';

const vocado = require('./index.js');

const app = vocado();

app.all('/', async (request, response) => {
  response.status(200);
  response.send('Hello, world!');
});

app.listen(80, () => {
  console.log('Serving on port 80.');
});
