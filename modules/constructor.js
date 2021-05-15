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
      engineCache: false,
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
  templates(engine, folder = "./templates/", shouldCache = (process.env.NODE_ENV === 'production')) {
    this.template.engine = engine;
    this.template.engineCache = require(engine);
    this.template.folder = path.join(
      require.main.path,
      folder
    );
    this.template.shouldCache = shouldCache;
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
  #handleRequest(request, response) {
    let requestBody = [];
    request.on('data', (chunks) => {
      requestBody.push(chunks);
    });
    request.on('end', () => {
      if (Buffer.concat(requestBody).toString()) requestBody = JSON.parse(Buffer.concat(requestBody).toString());
      let queue = this.routes;
      for (let item of queue) {
        if (item.callback instanceof Router) {
          queue.splice(
            queue.indexOf(item),
            1,
            ...item.callback.routes.map(r => {
              let newRoute = r;
              newRoute.match = item.match.slice(0, -2) + newRoute.match;
              return newRoute;
            })
          );
        }
      }
      queue = queue
        .map(route => {
          let r = {...route};
          const match = matchRoute(
            route.match,
            url.parse(request.url).pathname
          );
          r.params = match.params;
          return match.success ? r : false;
        })
        .filter(
          (route) => route !== false
        );
      let req = {
        path: url.parse(request.url).pathname,
        originalURL: JSON.parse(JSON.stringify(request.url)),
        hostname: request.headers.host,
        subdomains: request.headers.host.split('.').slice(0, -2),
        headers: request.headers,
        app: this,
        query: JSON.parse(JSON.stringify(url.parse(request.url, true).query)),
        body: requestBody,
        cookies: request.headers.cookie ? Object.assign(...
          request.headers.cookie
            .split(';')
            .map(c => JSON.parse(JSON.stringify(querystring.parse(c.trim()))))
        ) : {},
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
          if (!this.template.engineCache) this.template.engineCache = require(this.template.engine);
          const engine = this.template.engineCache;
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
        if (queue[q]) {
          req.params = queue[q].params;
          queue[q].callback({...request, ...req}, {...response, ...res}, next);
        } else {
          res.status(404).end('Cannot ' + req.method + ' ' + req.path);
        }
      }

      if (!queue.length) {
        response.writeHead(404);
        return response.end(`Cannot ${req.method} ${req.path}`)
      }
      next();
    });
  }
  // Listen on port
  listen(port, callback) {
    this.server = http.createServer(this.#handleRequest.bind(this));
    this.server.listen(port);

    callback();
  }
}

class Router {
  constructor() {
    this.routes = [];
  }
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
}

exports = module.exports = constructVocado;

function constructVocado() {
  return new Vocado();
}

exports.Router = () => {
  return new Router();
}
