'use strict';
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const matchRoute = require('./matchRoute');

class Vocado {
  constructor() {
    this.routes = [];
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
  //Middleware
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
  // Static and directory
  static(root, options = {mount: '/', index: 'index.html'}) {
    this.use(options.mount, async (request, response) => {
      const searchAt = path.join(
        require.main.path,
        root,
        request.path,
        (request.path.slice(-1) === '/' ? 'index.html' : '')
      );
      let data;
      try {
        data = fs.readFileSync(
          searchAt,
          {encoding: 'utf8', flag: 'r'}
        )
      } catch (err) {
        data = undefined;
      }
      if (typeof data !== 'undefined') response.send(data);
    });
  };
  // Handle requests
  handleRequest(request, response) {
    let requestBody = [];
    request.on('data', (chunks) => {
      requestBody.push(chunks);
    });
    request.on('end', () => {
      if (Buffer.concat(requestBody).toString()) requestBody = JSON.parse(Buffer.concat(requestBody).toString());
      let finished = false;
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
        status: (code) => {
          if (typeof code !== 'number') throw code + " is not a valid status code.";

          response.statusCode = parseInt(code);
          return res;
        },
        end: (message) => {
          response.end(message);
          finished = true;
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
      };
      //console.log(Object.keys(request));

      const queue = this.routes.filter(
        (route) => matchRoute(
            route.match,
            url.parse(request.url).pathname
          ) &&
          (!route.method || route.method === request.method.toUpperCase())
      );

      if (!queue.length) {
        response.writeHead(404);
        return response.end(`Cannot ${req.method} ${req.path}`)
      }

      queue.forEach((q) => {
        if (!finished) q.callback(req, res, () => {
          console.warn("WARNING: Vocado doesn't use the next() function the way express does.\nVocado just keeps going through the queue until headers are sent. next() may be implemented in a later update to allow the queue to continue regardless of headers.");
          return false;
        });
      });
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
