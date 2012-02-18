var utils = _.require("lib/utils");

var Phys = _.def({
  init: function (func) {
    var physics = _.require("lib/physics");
    var world = new physics.World({gravity: {x:0, y:10}});

    world.create([
      {x: 10, y: 10, width: 20, dynamic: false},
      {x: 1, y: 0, height: 20, dynamic: false},
      {x: 14, y: 0, height: 20, dynamic: false},

      {x: 10, y: 0},
      {x: 10, y: 5, radius: 0.5},
      {x: 9, y: 4, width: 3},
      {x: 10, y: 7, path: [{x: 0, y: 0}, {x:1, y:0}, {x:0, y:1}]}
    ]);

    this.world = world;
  },

  step: function (params) {
    this.world.step({});
    this.render(params);
  },

  render: function (params) {
    var ctx = params.ctx;
    var images = params.images;
    var scale = 40;
//    ctx.fillStyle = ctx.createPattern(images.wall, "repeat");
    ctx.fillStyle = "orange";

    this.world.getItems().forEach(function (p, i) {
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      
      if(p.type === "polygon") {
        var path = p.path;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (var j = 1; j < path.length; j++) {
           ctx.lineTo(path[j].x, path[j].y);
        }
        ctx.lineTo(path[0].x, path[0].y);
        ctx.fill();
      } else if(p.type === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, 2 * Math.PI, false);
        ctx.fill();
      } else {
        ctx.drawImage([images.crate, images.crate2][i%2], 
          -p.width/2, -p.height/2,
           p.width, p.height);
      }
      ctx.restore();
    })
  }
});

var Scene = _.def({
  init: function () {
    this.width = 640;
    this.height = 480;
    this.id = _.uniqueId();
    this.canvas = $('<canvas width="' + this.width + '" height="' + this.height + '"></canvas>');
    this.ctx = this.canvas[0].getContext("2d");
    $(".canvas").append(this.canvas);
  },

  _createBackground: function () {
    var that = this;
    this.bg = utils.buffer(this.width, this.height, function (ctx) {
      var tiles = 10;
      var wx = that.width/tiles, wy = that.height/tiles;
      ctx.save();
      for(var i = 0; i < tiles; i++) {
        ctx.rotate(0.01);
        for(var j = 0; j < tiles; j++) {
          if((i+j) % 2) {
            ctx.fillStyle = "#5566" + ((i+1)*10);
            ctx.fillRect(wx*i, wy*j, wx, wy);  
          }
        }
      }
      ctx.restore();

      ctx.fillStyle = ctx.createPattern(that.images.wall, "repeat");
      ctx.fillRect(0, 400, that.width, 50);
    });
  },

  run: function () {
    var that = this;
    this.phys = new Phys();

    utils.images({
      images: ["wall.jpg", "cards.png", "crate.jpg", "crate2.jpg"],
      callback: function (images) {
        that.images = images;
        that._createBackground();
        that.step();
      }
    });
  },

  _drawCards: function () {
    var t = +new Date;
    var i = Math.PI/360*t*0.5;
    var zoom = 1;
  
    for(var j = 0; j < 5; j++) {
      var x = 120 + Math.sin(i-j*0.2) * 240;
      var y = 60 + Math.cos(i+j*160) * 40;
      this.ctx.drawImage(this.images.cards, 180 * (j), 0, 180, 340, x + j*50, y, 180/zoom, 340/zoom);
    }  
  },

  step: function () {
    if(this._stopped) { return; }
    utils.nextFrame(_.bind(this.step, this));
    
    this.canvas[0].width = this.width;
    
    
    if(false) { this._drawCards(); }

    this.ctx.drawImage(this.bg, 0, 0);
    this.phys.step({ctx: this.ctx, images: this.images});
  },

  stop: function () {
    this._stopped = true;
    this.canvas.remove();
  }
});

exports = new Scene();