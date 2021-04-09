'use strict';

module.exports = (match, path) => {
  const split = {
    match: match.split('/'),
    path: path.split('/')
  };
  let params = {};
  for (var m = 0; m < split.match.length; m += 1) {
    if (split.match[m] === '*') {
      if (m === split.match.length - 1 && split.path[m] !== undefined) {
        return {success: true, params};
      }}
    else if (split.match[m][0] === ':') {
      params[split.match[m].slice(1)] = split.path[m];
    }
    else if (split.match[m] !== split.path[m]) return {success: false};
  }
  return {success: true, params};
};
