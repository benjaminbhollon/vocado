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

app.listen(port, () => {
  console.log('Serving on port ' + port + '.');
});

const router = vocado.Router();

router.get('/', async (request, response) => {
  response.end('Hello! I am a router.');
});

app.use('/router/', router);
