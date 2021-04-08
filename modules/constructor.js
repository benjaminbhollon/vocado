'use strict';
const http = require('http');
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
  handleRequest(request, response) {
    const res = {
      status: (code) => {
        if (typeof code !== 'number') throw code + " is not a valid status code.";

        response.writeHead(parseInt(code));
      },
      send: (message) => {
        response.end(message);
      }
    }

    const queue = this.routes.filter(
      (route) => matchRoute(route, request.url) && (!route.method || route.method === request.method.toUpperCase())
    );

    queue.forEach((q) => {
      const req = {};
      q.callback(req, res);
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
