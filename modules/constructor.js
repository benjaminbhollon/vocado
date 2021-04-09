'use strict';
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const matchRoute = require('./matchRoute');
const engineCompile = require('./engineCompile');

class Vocado {
  constructor() {
    this.routes = [];
    this.template = {
      engine: 'amole',
      folder: path.join(
        require.main.path,
        './templates/'
      ),
      shouldCache: process.env.NODE_ENV === 'production',
      cache: {},
    };
  }
  // Routes
  all(route, callback) {
    if (typeof route !== 'string') throw "Invalid route '" + route + "'";
    if (typeof callback !== 'function') throw "Expected callback to be a function, received " + (typeof callback);
    this.routes.push({
      match: route,
      callback
    });
    return true;
  }
  get(route, callback) {
    if (typeof route !== 'string') throw "Invalid route '" + route + "'";
    if (typeof callback !== 'function') throw "Expected callback to be a function, received " + (typeof callback);
    this.routes.push({
      match: route,
      method: 'GET',
      callback
    });
    return true;
  }
  post(route, callback) {
    if (typeof route !== 'string') throw "Invalid route '" + route + "'";
    if (typeof callback !== 'function') throw "Expected callback to be a function, received " + (typeof callback);
    this.routes.push({
      match: route,
      method: 'POST',
      callback
    });
    return true;
  }
  put(route, callback) {
    if (typeof route !== 'string') throw "Invalid route '" + route + "'";
    if (typeof callback !== 'function') throw "Expected callback to be a function, received " + (typeof callback);
    this.routes.push({
      match: route,
      method: 'PUT',
      callback
    });
    return true;
  }
  delete(route, callback) {
    if (typeof route !== 'string') throw "Invalid route '" + route + "'";
    if (typeof callback !== 'function') throw "Expected callback to be a function, received " + (typeof callback);
    this.routes.push({
      match: route,
      method: 'DELETE',
      callback
    });
    return true;
  }
  patch(route, callback) {
    if (typeof route !== 'string') throw "Invalid route '" + route + "'";
    if (typeof callback !== 'function') throw "Expected callback to be a function, received " + (typeof callback);
    this.routes.push({
      match: route,
      method: 'PATCH',
      callback
    });
    return true;
  }
  // Middleware
  use(route, callback) {
    if (typeof callback === "undefined") {
      callback = route;
      route = '/';
    }

    this.routes.push({
      match: route + "*",
      callback
    });
  }
  // Templates
  templates(engine, folder = "./templates/") {
    this.template.engine = engine;
    this.template.folder = path.join(
      require.main.path,
      folder
    );
  }
  // Static and directory
  static(root, options = {mount: '/', index: 'index.html'}) {
    this.use(options.mount, async (request, response, next) => {
      if (request.method.toUpperCase() !== 'GET') return next();
      const searchAt = path.join(
        require.main.path,
        root,
        request.path.slice(options.mount.length),
        (request.path.slice(-1) === '/' ? 'index.html' : '')
      );
      let data;
      const stream = fs.createReadStream(searchAt);
      stream.on('error', next);
      stream.pipe(response.originalResponse);
    });
  }
  // Handle requests
  handleRequest(request, response) {
    let requestBody = [];
    request.on('data', (chunks) => {
      requestBody.push(chunks);
    });
    request.on('end', () => {
      if (Buffer.concat(requestBody).toString()) requestBody = JSON.parse(Buffer.concat(requestBody).toString());
      const queue = this.routes.filter(
        (route) => matchRoute(
            route.match,
            url.parse(request.url).pathname
          ) &&
          (!route.method || route.method === request.method.toUpperCase())
      );
      let req = {
        path: url.parse(request.url).pathname,
        originalURL: request.url,
        hostname: request.headers.host,
        subdomains: request.headers.host.split('.').slice(0, -2),
        method: request.method,
        headers: request.headers,
        app: this,
        query: JSON.parse(JSON.stringify(url.parse(request.url, true).query)),
        body: requestBody,
        cookies: JSON.parse(JSON.stringify(querystring.parse(request.headers.cookie ? request.headers.cookie : ''))),
      };
      let res = {
        set: (field, value) => {
          response.setHeader(field, value);
          return res;
        },
        get: (field) => {
          return response.getHeader(field);
        },
        append: (field, value) => {
          let current = res.get(field);
          let newValue = value;
          if (current) {
            newValue = Array.isArray(current) ? current.concat(newValue)
              : Array.isArray(newValue) ? [current].concat(newValue)
              : [current, newValue];;
          }
          return res.set(field, newValue);
        },
        status: (code) => {
          if (typeof code !== 'number') throw code + " is not a valid status code.";

          response.statusCode = parseInt(code);
          return res;
        },
        end: (message) => {
          response.end(message);
          return res;
        },
        send: (message, end = true) => {
          response.write(message);
          if (end) res.end();
          return res;
        },
        html: (html, end = true) => {
          response.setHeader('Content-Type', 'text/html');
          return res.send(html, end);
        },
        json: (json, end = true) => {
          response.setHeader('Content-Type', 'application/json');
          return res.send(JSON.stringify(json), end);
        },
        render: (template = 'index.pug', variables = {}, callback) => {
          const engine = require(this.template.engine);
          const templatePath = path.join(
            this.template.folder,
            template
          );

          let raw = '';
          try {
            raw = fs.readFileSync(
              templatePath,
              {encoding: 'utf8', flag: 'r'}
            );
          } catch (err) {
            throw new Error(err);
          }

          let compiled = () => true;
          if (this.template.cache[templatePath]) {
            compiled = this.template.cache[templatePath];
          } else {
            compiled = engineCompile(this.template.engine, engine)(raw, {filename: templatePath});
            if (this.template.shouldCache) this.template.cache[templatePath] = compiled;
          }

          let final = "";
          try {
            final = compiled(variables);
          } catch (err) {
            throw new Error(err);
          }

          if (callback) callback();
          return res.html(final);
        },
        originalResponse: response,
        cookie: (name, value, options = {}) => {
          value = typeof value === 'object'
            ? 'j:' + JSON.stringify(value)
            : String(value);
            console.log(value);
          let finalCookie = {};
          finalCookie[name] = value;
          return res.append('Set-Cookie', [querystring.encode(finalCookie) + "; path=" + (options.path ? options.path : '/')]);
        },
        redirect: (status, destination) => {
          let code = 302;
          if (typeof destination === 'undefined') {
            destination = status;
          } else {
            code = status;
          }
          return res.set('Location', destination).status(code).end();
        }
      };
      let q = -1;
      function next() {
        q += 1;
        if (queue[q]) queue[q].callback(req, res, next);
        else {
          res.status(404).end('Cannot ' + req.method + ' ' + req.path);
        }
      }
      //console.log(Object.keys(request));

      if (!queue.length) {
        response.writeHead(404);
        return response.end(`Cannot ${req.method} ${req.path}`)
      }
      next();
    });
  }
  // Listen on port
  listen(port, callback) {
    const server = http.createServer(this.handleRequest.bind(this));
    server.listen(port);

    callback();
  }
}

function constructVocado() {
  const app = new Vocado();

  return app;
}

module.exports = constructVocado;
