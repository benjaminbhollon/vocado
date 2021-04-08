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
  // Static and directory
  // Handle requests
  handleRequest(request, response) {
    let finished = false;
    let req = {
      path: request.url,
      method: request.method,
      headers: request.headers
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
    }
    //console.log(Object.keys(request));

    const queue = this.routes.filter(
      (route) => matchRoute(route.match, request.url) && (!route.method || route.method === request.method.toUpperCase())
    );

    if (!queue.length) {
      return response.end(`Cannot ${req.method} ${req.path}`)
    }

    queue.forEach((q) => {
      if (!finished) q.callback(req, res);
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
