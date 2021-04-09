'use strict';

const vocado = require('../index.js');
const port = 80;
const app = vocado();

app.templates('pug', './templates/');

app.static('./static/', {mount: '/static/'});

app.get('/', async (request, response) => {
  response
    .render('index.pug');
});

app.listen(port, () => {
  console.log('Serving on port ' + port + '.');
});
