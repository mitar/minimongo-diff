var newCollection = function () {
  if (Meteor.isServer) {
    var collection = new Mongo.Collection(Random.id());
    collection._ensureIndex({'a.b': '2d'});
    return collection;
    }
  else {
    return new Mongo.Collection(null);
  }
};
var modifyWithQuery = function (test, doc, query, mod, expected) {
  var coll = newCollection();
  coll.insert(doc);
  // The query is relevant for 'a.$.b'.
  coll.update(query, mod);
  var actual = coll.findOne();
  delete actual._id;  // added by insert
  test.equal(actual, expected, EJSON.stringify({input: doc, mod: mod}));
};
var modify = function (test, doc, mod, expected) {
  modifyWithQuery(test, doc, {}, mod, expected);
};
var exceptionWithQuery = function (test, doc, query, mod) {
  var coll = newCollection();
  coll.insert(doc);
  test.throws(function () {
    coll.update(query, mod);
  });
};
var exception = function (test, doc, mod) {
  exceptionWithQuery(test, doc, {}, mod);
};

Tinytest.add("minimongo - modify-with-near", function (test) {
  // with $near, make sure it finds the closest one
  modifyWithQuery(test, {a: [{b: [1,1]},
                       {b: [ [3,3], [4,4] ]},
                       {b: [9,9]}]},
                  {'a.b': {$near: [5, 5]}},
                  {$set: {'a.$.b': 'k'}},
                  {a: [{b: [1,1]}, {b: 'k'}, {b: [9,9]}]});
});

Tinytest.add("minimongo - positive-numbers-slice", function (test) {
  // No positive numbers for $slice
  exception(test, {}, {$push: {a: {$each: [], $slice: 5}}});
});

Tinytest.add("minimongo - each-storage", function (test) {
  modify(test, {a: [1, 2]}, {$addToSet: {a: {b: 12, $each: [3, 1, 4]}}},
         {a: [1, 2, {b: 12, $each: [3, 1, 4]}]}); // tested
});

Tinytest.add("minimongo - $near operator tests", function (test) {
  // array tests
  coll = newCollection();
  coll.insert({
    _id: "x",
    k: 9,
    a: [
      {b: [
        [100, 100],
        [1,  1]]},
      {b: [150,  150]}]});
  coll.insert({
    _id: "y",
    k: 9,
    a: {b: [5, 5]}});
  var testNear = function (near, md, expected) {
    test.equal(
      _.pluck(
        coll.find({'a.b': {$near: near, $maxDistance: md}}).fetch(), '_id'),
      expected);
  };
  testNear([149, 149], 4, ['x']);
  testNear([149, 149], 1000, ['x', 'y']);
  // It's important that we figure out that 'x' is closer than 'y' to [2,2] even
  // though the first within-1000 point in 'x' (ie, [100,100]) is farther than
  // 'y'.
  testNear([2, 2], 1000, ['x', 'y']);

  // Ensure that distance is used as a tie-breaker for sort.
  test.equal(
    _.pluck(coll.find({'a.b': {$near: [1, 1]}}, {sort: {k: 1}}).fetch(), '_id'),
    ['x', 'y']);
  test.equal(
    _.pluck(coll.find({'a.b': {$near: [5, 5]}}, {sort: {k: 1}}).fetch(), '_id'),
    ['y', 'x']);
});
