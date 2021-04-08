'use strict';

const vocado = require('./index.js');

const app = vocado();

app.use('/app/', (request, response, next) => {
  console.log(request.method + " " + request.path);
});

app.get('/', async (request, response) => {
  response
    .html('<p>Hello, world? Are you there?</p>');
});

app.listen(80, () => {
  console.log('Serving on port 80.');
});
