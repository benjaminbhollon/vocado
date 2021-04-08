'use strict';

const vocado = require('./index.js');

const app = vocado();

app.post('/', async (request, response) => {
  response
    .html('<p>Hello, world? Are you there?</p>');
});

app.listen(80, () => {
  console.log('Serving on port 80.');
});
