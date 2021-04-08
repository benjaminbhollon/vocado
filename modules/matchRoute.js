module.exports = (pattern, path) => {
  if (pattern.match === path) return true;
  else return false;
};
