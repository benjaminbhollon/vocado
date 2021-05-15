'use strict';

const vocado = require('../index.js');
const port = 800;
const app = vocado();
var parseurl = require('parseurl');

app.templates('pug', './templates/');

app.static('./static/');

app.get('/', async (request, response) => {
  console.log(parseurl(request));
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
