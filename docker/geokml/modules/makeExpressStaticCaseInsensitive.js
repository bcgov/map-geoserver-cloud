module.exports = function (express) {
  var fs = require("fs");
  var pathlib = require("path");
  var parseUrl = require("../node_modules/parseurl");

  var oldStatic = express.static;
  var newStatic = function (root, options) {
    var opts = Object.create(options || null);

    var originalHandler = oldStatic(root, options);

    var wrappedHandler = function (req, res, next) {
      var filepath = pathlib.join(root, parseUrl(req).pathname).toLowerCase();
      var dirpath = pathlib.dirname(filepath);
      var filename = pathlib.basename(filepath);

      // @todo Reading the entire directory listing and then searching it is quite inefficient for large folders
      //       We should find a more efficient way to do this for one file at a time
      fs.readdir(dirpath, function (err, files) {
        if (err) return next(err);

        var fileIsThere = files.indexOf(filename) >= 0;
        if (fileIsThere) {
          originalHandler(req, res, next);
        } else {
          res.status(404).end();
        }
      });
    };

    return wrappedHandler;
  };
  express.static = newStatic;
};
