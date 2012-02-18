var nextFrame = (function(){
  return window.requestAnimationFrame || 
  window.webkitRequestAnimationFrame || 
  window.mozRequestAnimationFrame    || 
  window.oRequestAnimationFrame      || 
  window.msRequestAnimationFrame     || 
  function( callback ){
    window.setTimeout(callback, 1000 / 60);
  };
})();

_.extend(exports, {
  image: function (url, f) {
    $("<img/>").attr("src", url).load(f);
  },

  images: function (params) {
    var res = {};
    _.each(params.images, function (url) {
      $("<img/>").attr("src", url).load(function () {
        var key = url.split(".")[0];
        res[key] = this;
        if(_.keys(res).length == params.images.length) {
          params.callback(res);
        }
      });
    });
  },

  buffer: function (width, height, renderFunction) {
    var buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    renderFunction(buffer.getContext('2d'));
    return buffer;
  },

  nextFrame: function (f) {
    return nextFrame(f);
  }
});
