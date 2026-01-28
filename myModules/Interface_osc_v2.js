// Start up
var { loglv } = require('./config.js')
let selflog = `\x1b[0m[\x1b[34mOSC\x1b[0m]`
console.log(`${loglv().log}${selflog} Loaded`)

// Event emission
const { EventEmitter } = require('events')
const oscEmitter = new EventEmitter();
exports.oscEmitter = oscEmitter;
oscEmitter.on('ready', (ready) => { });
oscEmitter.on('osc', (address, value) => { });


// Actual OSC setup
var osc = require('osc');
var udpPort = new osc.UDPPort({ localAddress: '127.0.0.1', localPort: 9001 })
udpPort.open()
udpPort.on("ready", function () {
    console.log(`${loglv().log}${selflog} Ready..`)
    oscEmitter.emit('ready', true)

    /*
    oscSend('/14a/test/bool',true)
    oscSend('/14a/test/int',255)
    oscSend('/14a/test/float',0.00025)
    */

    //oscChatbox(``)
    
    setInterval(() => {
        sendBinaryTime()
    }, 10_000);

    // setTimeout(() => { process.exit() }, 10_000)

});

function sendBinaryTime() {
    var curTime = new Date().toString().substring(16, 24).split(':');
    var binaryTime = ((curTime[0] > 12 ? curTime[0] - 12 : curTime[0]) >>> 0).toString(2).padStart(4, '0') + '' + (curTime[1] >>> 0).toString(2).padStart(6, '0');
    function sendBinaryStream(binary, last) {
        oscSend('/avatar/parameters/14a/osc/data', binary == 1);
        oscSend('/avatar/parameters/14a/osc/sync', last);
        oscSend('/avatar/parameters/14a/osc/clk', true);
        setTimeout(() => { oscSend('/avatar/parameters/14a/osc/clk', false); }, 200);
    };
    binaryTime.split('').forEach((char, index) => {
        setTimeout(() => {
            sendBinaryStream(parseInt(char), index == binaryTime.length - 1);
        }, 400 * index)
    })
}

// Send OSC data
var allowOSCUsage = true
async function oscSend(addr, valu) {
    if (allowOSCUsage == false) { return }
    udpPort.send({ address: addr, args: [valu] }, '127.0.0.1', 9000);
    console.log(`\x1b[33m<- ${selflog} \x1b[33m${addr}\x1b[0m: ${valu} [${typeof valu}]`)
}
exports.oscSend = oscSend;

// Send OSC Chatbox message
var allowChatboxUsage = true
var tokens = 3
var timestamp = Date.now() / 1000
function oscChatbox(msg) {
    if (allowChatboxUsage == false) { return }
    if (tokens == 0 && Date.now() / 1000 < timestamp + 5) {
        console.log(`\x1b[31mX- ${selflog} \x1b[31mChatBox\x1b[0m: ${msg} [${typeof msg}]`)
        return
    } else if (Date.now() / 1000 > timestamp + 5) {
        tokens = 3
        timestamp = Date.now() / 1000
    } else {
        tokens--
    }

    udpPort.send({ address: "/chatbox/input", args: [msg.slice(0, 144), true, false] }, '127.0.0.1', 9000);
    console.log(`\x1b[33m<- ${selflog} \x1b[33mChatBox\x1b[0m: ${msg} [${typeof msg}]`)
}
exports.oscChatbox = oscChatbox;

// Receive OSC data
udpPort.on("message", function (oscMsg, timeTag, info) {
    console.log(`--> ${selflog} \x1b[36m${oscMsg.address}\x1b[0m: ${oscMsg.args[0]} [${typeof oscMsg.args[0]}] `)
    oscEmitter.emit('osc', oscMsg.address, oscMsg.args[0])
});

