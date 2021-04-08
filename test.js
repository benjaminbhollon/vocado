'use strict';

const vocado = require('./index.js');

const app = vocado();

app.get('/', async (request, response) => {
  response
    .html('<p>Hello, world? Are you there?</p>');
  console.log(request.hostname);
});

app.listen(80, () => {
  console.log('Serving on port 80.');
});
