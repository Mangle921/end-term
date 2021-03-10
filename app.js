const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const port = 3000;

const mimeType = {
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.doc': 'application/msword',
  '.eot': 'application/vnd.ms-fontobject',
  '.ttf': 'application/x-font-ttf',
};

http.createServer(function (req, res) {
  console.log(`${req.method} ${req.url}`);
  const parsedUrl = url.parse(req.url);

  const sanitizePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
  let pathdir = path.join(__dirname, sanitizePath);

  fs.exists(pathdir, function (exist) {

    let pathname = pathdir;

    if(!exist) {
      // if the file is not found, return 404
      res.statusCode = 404;
      fs.readFile('error.html', function(err, data){
        res.setHeader('Content-type', 'text/html' );
        res.end(data);
      })
      return false;
    }

    // if is a directory, then look for index.html
    if (fs.statSync(pathname).isDirectory()) {
        pathname += '/index.html';
    }

    let ext = path.parse(pathname).ext;

    if(ext == ".mp4"){
        video(pathname, req, res)
    }
    else {
        // read file from file system
        fs.readFile(pathname, function(err, data){
            if(err){
                res.statusCode = 500;
                res.end(`Internal error with a response code 500`);
            } else {
                // based on the URL path, extract the file extention. e.g. .js, .doc, ...
                // if the file is found, set Content-type and send data
                res.setHeader('Content-type', mimeType[ext] || 'text/plain' );
                res.end(data);
            }
        });
    }
  });
}).listen(parseInt(port));

function video(path, req, res) {
    var stat = fs.statSync(path);
    var total = stat.size;
    if (req.headers['range']) {
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : total-1;
        var chunksize = (end-start)+1;

        var file = fs.createReadStream(path, {start: start, end: end});
        res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
        file.pipe(res);
    } 
    else {
        res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
        fs.createReadStream(path).pipe(res);
  }
}

console.log(`Server listening on port ${port}`);
