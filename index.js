const http      = require('http');
const execSync  = require('child_process').execSync;
const fs        = require('fs');
const os        = require("os");
const diskspace = require('fd-diskspace');

const port      = 9360;

console.log('started raspberry-status-server at port ' + port);
console.log(getOperatingSystem());

http.createServer(function(request, response) {

  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(
  {
      hostname: os.hostname(),

      model: getModel(),

      operatingsystem: getOperatingSystem(),

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
      },

      disks: diskspace.diskSpaceSync().disks
  }
  ));
}).listen(port);

function inMegabyte(bytes) {
    return parseInt(bytes / 1000 / 1000);
}

function getNumberOfProcesses() {
    return execSync('ps aux | wc -l').toString().replace('\n', '');
}

function getModel() {
    const filename = '/proc/device-tree/model';

    if (! fs.existsSync(filename)) {
        return 'unknown';
    }

    model = fs.readFileSync(filename, 'ascii');
    model.replace(/\0/g, '');

    return model;
}

function getOperatingSystem() {
    const filename = '/etc/os-release';

    if (! fs.existsSync(filename)) {
        return 'unknown';
    }

    const content = fs.readFileSync(filename, 'utf8');
    const regexp  = /PRETTY_NAME="(.*)"/g;
    return regexp.exec(content)[1];
}

function getTemperature() {

    const filename = '/sys/class/thermal/thermal_zone0/temp';

    if (! fs.existsSync(filename)) {
        return 'not found';
    }

    var temperature = fs.readFileSync(filename, 'utf8');
    temperature = temperature.replace(/\n$/, '');

    return parseFloat(temperature / 1000).toFixed(2);
}
