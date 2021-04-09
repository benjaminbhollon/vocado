module.exports = (name, engine) => {
  switch (name) {
    default:
      if (!engine.compile) throw new Error('Template engine `' + name + '` is not supported');
      return engine.compile;
      break;
  }
}
