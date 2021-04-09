'use strict';

const vocado = require('../index.js');
const port = 80;
const app = vocado();

app.templates('pug', './templates/');

app.static('./static/');

app.get('/', async (request, response) => {
  response
    .render('index.pug', {cookies: request.cookies});
});

app.get('/:name/', async (request, response) => {
  response.end('Hello, ' + request.params.name + '.');
});

app.listen(port, () => {
  console.log('Serving on port ' + port + '.');
});
