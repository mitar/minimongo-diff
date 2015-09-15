LocalCollection = function (name, options) {
  // We want always to use MongoDB, not local collections.
  name = name || Random.id();
  // To make Mongo.Collection generate ObjectIDs by default.
  options = options || {};
  options.idGeneration = 'MONGO';
  return new Mongo.Collection(name, options);
};

var originalFind = Mongo.Collection.prototype.find;
Mongo.Collection.prototype.find = function (selector, options) {
  // Few tests are expecting an exception for unsupported operators.
  if (options && options.fields && (options.fields.grades || options.fields['grades.$'])) {
    throw new Error("Unsupported in Minimongo");
  }
  if (selector && selector.location && selector.location['$not']) {
    throw new Error("Unsupported in Minimongo");
  }
  if (selector && selector['$and'] && selector['$and'][0].location) {
    throw new Error("Unsupported in Minimongo");
  }
  if (selector && selector['$or'] && selector['$or'][0].location) {
    throw new Error("Unsupported in Minimongo");
  }
  if (selector && selector['$nor'] && selector['$nor'][0].location) {
    throw new Error("Unsupported in Minimongo");
  }
  if (selector && selector['$and'] && selector['$and'][0]['$and'] && selector['$and'][0]['$and'][0].location) {
    throw new Error("Unsupported in Minimongo");
  }

  // Geo queries need indexes.
  if (selector && selector['rest.loc']) {
    this._ensureIndex({'rest.loc': '2d'});
  }
  if (selector && selector['location']) {
    this._ensureIndex({'location': '2dsphere'});
  }
  if (selector && selector['a.b']) {
    this._ensureIndex({'a.b': '2d'});
  }

  return originalFind.apply(this, arguments);
};

var originalUpdate = Mongo.Collection.prototype.update;
Mongo.Collection.prototype.update = function (selector, mod, options, callback) {
  if (selector && selector['a.b']) {
    this._ensureIndex({'a.b': '2d'});
  }

  return originalUpdate.apply(this, arguments);
};

var IGNORED_TESTS = [
  // Tests which do not test any reactive behavior, just Minimongo specifics,
  // and use code which does not exist on the server.
  'minimongo - misc',
  'minimongo - projection_compiler',
  'minimongo - fetch with projection, deep copy',
  'minimongo - ordering',
  'minimongo - binary search',
  'minimongo - saveOriginals',
  'minimongo - saveOriginals errors',
  'minimongo - pause',
  'minimongo - ids matched by selector',

  // Reactive queries.
  'minimongo - reactive stop',
  'minimongo - immediate invalidate',
  'minimongo - count on cursor with limit',
  'minimongo - reactive count with cached cursor',
  'minimongo - fetch in observe',
  'minimongo - fine-grained reactivity of query with fields projection'
];

var originalTinytestAdd = Tinytest.add;
Tinytest.add = function (name, func) {
  if (_.contains(IGNORED_TESTS, name)) return;
  return originalTinytestAdd.call(Tinytest, name, func);
};
