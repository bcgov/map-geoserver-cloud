module.exports = function (express) {
  var fs = require("fs");
  var pathlib = require("path");
  var send = require("send");
  var parseUrl = require("../node_modules/parseurl");

  function createNotFoundDirectoryListener() {
    return function notFound() {
      this.error(404);
    };
  }

  var newStatic = function (root, options) {
    var opts = Object.create(options || null);

    const onDirectory = createNotFoundDirectoryListener();

    var wrappedHandler = function (req, res, next) {
      var filepath = pathlib.join(root, parseUrl(req).pathname);
      var dirpath = pathlib.dirname(filepath);
      var filename = pathlib.basename(filepath).toLowerCase();

      // @todo Reading the entire directory listing and then searching it is quite inefficient for large folders
      //       We should find a more efficient way to do this for one file at a time
      fs.readdir(dirpath, function (err, files) {
        if (err) return next(err);

        var fileIsThere = files.filter((f) => f.toLowerCase() === filename);
        if (fileIsThere.length > 0) {
          const filematch = fileIsThere.pop();
          // create send stream
          var stream = send(req, `${dirpath}/${filematch}`, opts);

          // add directory handler
          stream.on("directory", onDirectory);

          // forward errors
          stream.on("error", function error(err) {
            if (!(err.statusCode < 500)) {
              next(err);
              return;
            }
            next();
          });

          // pipe
          stream.pipe(res);
        } else {
          res.status(404).end();
        }
      });
    };

    return wrappedHandler;
  };
  express.static = newStatic;
};
