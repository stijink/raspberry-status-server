const http = require('http');
const execSync = require('child_process').execSync;
const fs = require('fs');
const os = require("os");
const diskspace = require('fd-diskspace');

const port = 9360;

console.log('started raspberry-status-server at port ' + port);

http.createServer(function (request, response) {

    // Set CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    response.setHeader('Access-Control-Allow-Headers', '*');

    if (request.method === 'OPTIONS') {
        response.writeHead(200);
        response.end();
        return;
    }

    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(
        {
            hostname: os.hostname(),

            model: getModel(),

            operatingsystem: getOperatingSystem(),

            uptime: parseInt(os.uptime() / (60 * 60 * 24)),

            load: parseFloat(os.loadavg()[1].toFixed(2)),

            num_processes: parseInt(getNumberOfProcesses()),

            temperature: parseFloat(getTemperature()),

            has_poe: hasPoeAdapter(),

            cpu: {
                cores: os.cpus().length,
                current_speed: os.cpus()[0].speed,
                max_speed: getCPUMaxSpeed(),
            },

            memory: {
                total: inMegabyte(os.totalmem()),
                used: inMegabyte(os.totalmem() - os.freemem()),
                free: inMegabyte(os.freemem()),
                percent: (100 - parseFloat((os.freemem() * 100) / os.totalmem()).toFixed(2))
            },

            disks: diskspace.diskSpaceSync().disks,

            network: getNetworkInterfaces(),
        }
    ));
}).listen(port);

function inMegabyte(bytes) {
    return parseInt(bytes / 1000 / 1000);
}

function getCPUMaxSpeed() {
    const filename = '/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq';

    if (!fs.existsSync(filename)) {
        return 0;
    }

    return parseInt(fs.readFileSync(filename, 'utf8')) / 1000;
}

function getNetworkInterfaces() {
    const statusLAN  = execSync('ip -o link show | awk \'{print $2,$9}\' | grep "eth0"').toString();
    const statusWLAN = execSync('ip -o link show | awk \'{print $2,$9}\' | grep "wlan0"').toString();

    return {
        'status_eth0':  statusLAN === 'UP',
        'status_wlan0': statusWLAN === 'UP',
    };
}

function getNumberOfProcesses() {
    return execSync('ps aux | wc -l').toString().replace('\n', '');
}

function getModel() {
    const filename = '/proc/device-tree/model';

    if (!fs.existsSync(filename)) {
        return 'unknown';
    }

    model = fs.readFileSync(filename, 'utf8');
    return model.replace(/\u0000/g, '');
}

function getOperatingSystem() {
    const filename = '/etc/os-release';

    if (!fs.existsSync(filename)) {
        return 'unknown';
    }

    const content = fs.readFileSync(filename, 'utf8');
    const regexp = /PRETTY_NAME="(.*)"/g;
    return regexp.exec(content)[1];
}

function getTemperature() {

    const filename = '/sys/class/thermal/thermal_zone0/temp';

    if (!fs.existsSync(filename)) {
        return 'not found';
    }

    var temperature = fs.readFileSync(filename, 'utf8');
    temperature = temperature.replace(/\n$/, '');

    return parseFloat(temperature / 1000).toFixed(2);
}

function hasPoeAdapter() {

    const filename = '/sys/class/thermal/cooling_device0/cur_state';
    return fs.existsSync(filename);
}
