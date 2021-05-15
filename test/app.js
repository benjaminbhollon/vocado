'use strict';

const vocado = require('../index.js');
const port = 800;
const app = vocado();

app.templates('pug', './templates/');

app.static('./static/');

app.use((request, response, next) => {
  request.fun = 'Smiley!';
  next();
});

app.get('/', async (request, response) => {
  console.log(request.fun);
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
