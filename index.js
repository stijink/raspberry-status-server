const http      = require('http');
const accesslog = require('access-log');
const execSync  = require('child_process').execSync;
const fs        = require('fs');
const os        = require("os");

const port      = 9360;

console.log('started raspberry-status-server at port ' + port);

http.createServer(function(request, response) {

  response.setHeader('Content-Type', 'application/json');

  response.end(JSON.stringify(
  {
      hostname: os.hostname(),

      uptime: parseInt(os.uptime() / (60 * 60 * 24)),

      load: parseFloat(os.loadavg()[1].toFixed(2)),

      processes: parseInt(getNumberOfProcesses()),

      temperature: parseFloat(getTemperature()),

      cpu: {
          cores: os.cpus().length,
          speed: os.cpus()[0].speed
      },

      memory: {
          total:    inMegabyte(os.totalmem()),
          used:     inMegabyte(os.totalmem() - os.freemem()),
          free:     inMegabyte(os.freemem()),
          percent:  (100 - parseFloat((os.freemem() * 100) / os.totalmem()).toFixed(2))
      }
  }
  ));

  accesslog(request, response);

}).listen(port);

function inMegabyte(bytes) {
    return parseInt(bytes / 1000 / 1000);
}

function getNumberOfProcesses() {
    return execSync('ps aux | wc -l').toString().replace('\n', '');
}

function getTemperature() {

    const filename = '/sys/class/thermal/thermal_zone0/temp';

    if (! fs.existsSync(filename)) {
        return 'not found';
    }

    var content = fs.readFileSync(filename, 'utf8');
    content = content.replace(/\n$/, '');

    return content;
}
