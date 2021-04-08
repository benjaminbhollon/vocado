'use strict';

const vocado = require('./index.js');

const app = vocado();

app.get('/', async (request, response) => {
  console.log('YAAAS');
});

app.listen(80, () => {
  console.log('Serving on port 80.');
});
