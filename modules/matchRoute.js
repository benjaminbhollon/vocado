module.exports = (match, path) => {
  const split = {
    match: match.split('/'),
    path: path.split('/')
  };
  for (var m = 0; m < split.match.length; m += 1) {
    if (split.match[m] !== split.path[m]) return false;
  }
  return true;
};
