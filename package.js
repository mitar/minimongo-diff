Package.describe({
  summary: "Testing the differences between Minimongo and MongoDB",
  version: '0.1.0',
  git: 'https://github.com/mitar/minimongo-diff.git'
});

Package.on_test(function (api) {
  api.use(['tinytest', 'test-helpers', 'mongo', 'underscore', 'reactive-var', 'random'], 'server');

  api.add_files([
    'tests.js',
    'meteor/packages/minimongo/minimongo_tests.js'
  ], 'server');
});
