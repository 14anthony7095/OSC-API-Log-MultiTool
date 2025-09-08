// Start up
var { loglv } = require('./config.js')
let selfLog = `\x1b[0m[\x1b[34mOSC\x1b[0m]`
console.log(`${loglv().log}${selfLog} Loaded`)

// Event emission
const { EventEmitter } = require('events')
const oscEmitter = new EventEmitter();
exports.oscEmitter = oscEmitter;
oscEmitter.on('ready', (ready) => {} );
oscEmitter.on('osc', (address,value) => {} );

// Actual OSC setup
var osc = require('osc');
var udpPort = new osc.UDPPort({ localAddress: '127.0.0.1', localPort: 9001 })
udpPort.open()
udpPort.on("ready", function () {
    console.log(`${loglv().log}${selfLog} Ready..`)
    oscEmitter.emit('ready',true)

    /*
    oscSend('/14a/test/bool',true)
    oscSend('/14a/test/int',255)
    oscSend('/14a/test/float',0.00025)
    */
   
    //oscChatbox(``)
    
    setTimeout(()=>{ process.exit() },10_000)

});

// Send OSC data
var allowOSCUsage = true
function oscSend(addr,valu) {
    if(allowOSCUsage==false){return}
	udpPort.send({ address: addr, args: [ valu ] }, '127.0.0.1', 9000);
	console.log(`\x1b[33m<- ${selfLog} \x1b[33m${addr}\x1b[0m: ${valu} [${typeof valu}]`)
}
exports.oscSend = oscSend;

// Send OSC Chatbox message
var allowChatboxUsage = true
var tokens = 3
var timestamp = Date.now()/1000
function oscChatbox(msg) {
    if(allowChatboxUsage==false){return}
    if( tokens == 0 && Date.now()/1000 < timestamp+5 ){
        console.log(`\x1b[31mX- ${selfLog} \x1b[31mChatBox\x1b[0m: ${msg} [${typeof msg}]`)
        return
    }else if( Date.now()/1000 > timestamp+5 ){
        tokens = 3
        timestamp = Date.now()/1000
    }else{
        tokens--
    }

	udpPort.send({ address: "/chatbox/input", args: [ msg.slice(0,144), true, false ] }, '127.0.0.1', 9000);
	console.log(`\x1b[33m<- ${selfLog} \x1b[33mChatBox\x1b[0m: ${msg} [${typeof msg}]`)
}
exports.oscChatbox = oscChatbox;

// Receive OSC data
udpPort.on("message", function (oscMsg, timeTag, info) {
    console.log(`--> ${selfLog} \x1b[36m${oscMsg.address}\x1b[0m: ${oscMsg.args[0]} [${typeof oscMsg.args[0]}] `)
    oscEmitter.emit('osc',oscMsg.address,oscMsg.args[0])
});

