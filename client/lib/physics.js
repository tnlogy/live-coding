var box2d = _.require('lib/box2d');

exports.World = _.def({ 
  init: function (params) {
    _.defaults(params, {
      gravity: {x: 0, y: 10},
      sleep: true
    });
    
    this._gravity = new box2d.b2Vec2(params.gravity.x, params.gravity.y);
    this._world = new box2d.b2World(this._gravity, params.sleep);
    this._items = [];
  },

  getItems: function () {
    return this._items;
  },
  create: function (items) {
    var that = this;
    items.forEach(function (item) {
      if(item.radius !== undefined) { return that.createCircle(item); }
      if(item.path !== undefined) { return that.createPolygon(item); }
      that.createBox(item);
    });
  },
  
  _createBodyObject: function (params) {
    var bodyDef = new box2d.b2BodyDef();
    if(params.dynamic) {
      bodyDef.type = box2d.b2Body.b2_dynamicBody;
    }
    if(params.x !== undefined) {
      bodyDef.position.Set(params.x, params.y);
    }
    var body = this._world.CreateBody(bodyDef);
    if(params.linearDamping) { body.SetLinearDamping(params.linearDamping); }
    if(params.angularDamping) { body.SetAngularDamping(params.angularDamping); }
    params.id = _.uniqueId();
    this._items.push(params);
    body.SetUserData(params);
    return body;
  },
  _createFixture: function (shape, params) {
    _.defaults(params, {
      density: 1, friction: 0.3, restitution: 0.5
    });
    var fixture = new box2d.b2FixtureDef();
    fixture.shape = shape;
    fixture.density = params.density;
    fixture.friction = params.friction;
    fixture.restitution = params.restitution;
    return fixture;
  },
  _createBody: function (shape, params) {
    _.defaults(params, {
      dynamic: true
    });

    var body = this._createBodyObject(params);
    body.SetAwake(params.dynamic);
    body.CreateFixture(this._createFixture(shape, params));
    return body;
  },

  createBox: function (params) {
    _.defaults(params, {
      x: 0, y: 0, width: 1, height: 1,
      type: "box"
    });

    var boxShape = new box2d.b2PolygonShape();
    boxShape.SetAsBox(params.width/2, params.height/2);
    return this._createBody(boxShape, params);
  },
  
  createCircle: function (params) {
    _.defaults(params, {
      x: 0, y: 0, radius: 0.5,
      type: "circle"
    });
    
    var circleShape = new box2d.b2CircleShape(params.radius);
    return this._createBody(circleShape, params);
  },
  
  createPolygon: function (params) {
    _.defaults(params, {
      x: 0, y: 0,
      path: [{x: 0, y: 0}, {x:1, y:0}, {x:0, y:1}],
      type: "polygon"
    });
    
    var polygonShape = new box2d.b2PolygonShape();
    var vertices = [];
    for(var i = 0; i < params.path.length; i++) {
      vertices.push(new box2d.b2Vec2(params.path[i].x, params.path[i].y));
    }
    polygonShape.SetAsArray(vertices, vertices.length);
    return this._createBody(polygonShape, params);
  },
  
  destroyBody: function (body) {
    this._world.DestroyBody(body);
  },
  
  step: function (params) {
    _.defaults(params, {
      timeStep: 1 / 60,
      velocityIterations: 10,
      positionIterations: 10
    });

    this._world.Step(params.timeStep, params.velocityIterations, params.positionIterations);
    this._world.ClearForces();
    this._updateParams();
  },
  
  _updateParams: function () {
    var body = this._world.GetBodyList();
    do {
      // check body.IsAwake()
      var data = body.GetUserData();
      if(data) {
        var p = body.GetPosition();
        var r = body.GetAngle();
        data.x = p.x; data.y = p.y; data.r = r;
      }
    } while(body = body.GetNext());
  }
});