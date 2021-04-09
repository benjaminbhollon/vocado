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

app.get('/cookie/', async (request, response) => {
  response.cookie('who', 'me').end();//.redirect('../');
});

app.listen(port, () => {
  console.log('Serving on port ' + port + '.');
});
