const http = require('http');
const url = require('url');
const uuidv4 = require('uuid/v4');
var dayInMinutes = 10;
function getSinWave(t) {
    const amplitude = 500;
    const shiftx = 0.5 * Math.PI;
    const frequency = 2 * Math.PI / dayInMinutes;
    return amplitude * Math.sin(frequency * t - shiftx) + amplitude;
}
class EnergyReading {
    constructor(value) {
        this.Value = value;
        this.Unit = "WH";
    }
}
class Device {
    constructor() {
        this.Id = uuidv4();
        this.DAY_ENERGY = new EnergyReading(0);
        this.TOTAL_ENERGY = new EnergyReading(0);
    }
    generateEnergy(energyGenerated) {
        this.DAY_ENERGY.Value += energyGenerated;
        this.TOTAL_ENERGY.Value += energyGenerated;
    }
    resetDayEnergy() {
        this.DAY_ENERGY.Value = 0;
    }
}
class DeviceSimulator {
    constructor() {
        this.devices = new Array();
    }
    getDevices() {
        return this.devices;
    }
    provisionDevice() {
        const device = new Device();
        this.devices.push(device);
        return device.Id;
    }
    generateEnergy(energyGenerated) {
        for (let i = 0; i < this.devices.length; i++) {
            this.devices[i].generateEnergy(energyGenerated);
        }
    }
    resetDevices() {
        for (let i = 0; i < this.devices.length; i++) {
            this.devices[i].resetDayEnergy();
        }
    }
}
class InverterSimulator {
    constructor() {
        this.minuteInMilliseconds = 1000 * 60;
        this.minuteCounter = 0;
        this.deviceSimulator = new DeviceSimulator();
        this.deviceSimulator.provisionDevice();
    }
    provisionDevice() {
        return this.deviceSimulator.provisionDevice();
    }
    getResponse() {
        const response = this.deviceSimulator.getDevices();
        this.deviceSimulator.resetDevices();
        return response;
    }
    generateEnergyEveryMinute() {
        const self = this;
        setInterval(() => {
            //todo: add some randomness to the generateEnergy
            const energyGenerated = getSinWave(self.minuteCounter);
            self.deviceSimulator.generateEnergy(energyGenerated);
            if (self.minuteCounter < 10) {
                self.minuteCounter += 1;
            }
            else {
                self.minuteCounter = 0;
            }
        }, self.minuteInMilliseconds);
    }
}
const inverterSimulator = new InverterSimulator();
const port = 1337;
http.createServer((req, res) => {
    const reqUrl = url.parse(req.url).pathname;
    if (reqUrl === "/solar_api/v1/GetInverterRealtimeData.cgi") {
        res.writeHead(200, {
            'Content-Type': "application/json"
        });
        const response = inverterSimulator.getResponse();
        res.end(JSON.stringify(response));
    }
    if (reqUrl === "/provision") {
        res.writeHead(200, {
            'Content-Type': "application/json"
        });
        const response = inverterSimulator.provisionDevice();
        res.end(response);
    }
    res.writeHead(400, {
        'Content-Type': "application/json"
    });
    res.end();
}).listen(port);
//# sourceMappingURL=server.js.map