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

app.get('/redirect/', async (request, response) => {
  response.redirect('../');
});

app.listen(port, () => {
  console.log('Serving on port ' + port + '.');
});
