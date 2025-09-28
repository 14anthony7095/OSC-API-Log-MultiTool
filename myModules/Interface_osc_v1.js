/*
-------------------------------------

	OSC easify

-------------------------------------
*/
//	--	Libraries	--
const { loglv, useChatBox } = require('./config.js')
var { logOscIn, logOscOut } = require('./config.js')
const { deviceIP, isFullLaunch } = require('../index.js')
let selfLog = `\x1b[0m[\x1b[34mOSC\x1b[0m]`
var osc = require('osc');
var udpPort = new osc.UDPPort({ localAddress: '127.0.0.1', localPort: 9100 })
const remotePort = 9000
const { cmdEmitter } = require('./input.js');
const { playNote } = require('./interface_midi.js')
const { EventEmitter } = require('events');
const { PiShock, PiShockAll } = require('./Interface_PS.js');
const { toUnicode } = require('punycode');
const oscEmitter = new EventEmitter();
exports.oscEmitter = oscEmitter;

console.log(`${loglv().log}${selfLog} Loaded -> ${loglv(logOscIn)}Input${loglv().reset} , ${loglv(logOscOut)}Output${loglv().reset} , ${loglv(useChatBox)}ChatBox${loglv().reset}`)
console.log(`${loglv().log}${selfLog} Connected to ${deviceIP}`)

var nanaPartyCCTVtimer;

cmdEmitter.on('cmd', (cmd, args, raw) => {
	if (cmd == 'help') {
		console.log(`${selfLog}
-	osc in [true/false]
-	osc out [true/false]
-	osc say ["Message"]
-	osc morse ["Message"]
-	osc chat [tall/fat]
-	osc kat [Clear: True/False | Color: 0-7 | "Message"]
-	osc db [ID] [DATA]
-	osc db [ID] [DATA] [DATA2]
-	osc db [ID] [DATA] [DATA2] [DATA3]
-	path [JSONdataObject OR .json File path]`)
	}
	if (cmd == 'osc' && args[0] == 'in') { logOscIn = JSON.parse(args[1]) }
	if (cmd == 'osc' && args[0] == 'out') { logOscOut = JSON.parse(args[1]) }
	if (cmd == 'osc' && args[0] == 'db') { OSCDataBurst(parseInt(args[1]), parseFloat(args[2])) }
	if (cmd == 'osc' && args[0] == 'db2') { OSCDataBurst(parseInt(args[1]), parseFloat(args[2]), parseFloat(args[3])) }
	if (cmd == 'osc' && args[0] == 'db3') { OSCDataBurst(parseInt(args[1]), parseFloat(args[2]), parseFloat(args[3]), parseFloat(args[4])) }
	if (cmd == 'osc' && args[0] == 'say') { oscChatBox(raw.slice(8).toString()) }
	// if( cmd == 'cctv' ){
	// 	if( args[0] == 'stop' ){
	// 		clearInterval(nanaPartyCCTVtimer)
	// 		oscSend('/dolly/Play',1==0)
	// 		return
	// 	}
	// 	[`partyhouseSet1`,`partyhouseSet2`,`partyhouseSet3`,`partyhouseSet4`,`partyhouseSet5`].forEach((fname,index,arr)=>{
	// 		setTimeout(()=>{
	// 			oscSend('/dolly/Play',1==0)
	// 			oscSend('/dolly/Import', `C:\\Users\\14Anthony7095\\Documents\\VRChat\\CameraPaths\\${fname}.json`);
	// 			oscSend('/dolly/Play',1==1)
	// 			// setTimeout(() => { oscSend('/dolly/Play',1==1) }, 100);
	// 		},10_000*index)
	// 	})
	// 	nanaPartyCCTVtimer = setInterval(()=>{
	// 		[`partyhouseSet1`,`partyhouseSet2`,`partyhouseSet3`,`partyhouseSet4`,`partyhouseSet5`].forEach((fname,index,arr)=>{
	// 			setTimeout(()=>{
	// 				oscSend('/dolly/Play',1==0)
	// 				oscSend('/dolly/Import', `C:\\Users\\14Anthony7095\\Documents\\VRChat\\CameraPaths\\${fname}.json`);
	// 				oscSend('/dolly/Play',1==1)
	// 				// setTimeout(() => { oscSend('/dolly/Play',1==1) }, 100);
	// 			},10_000*index)
	// 		})
	// 	},60_000)
	// }
	if (cmd == 'osc' && args[0] == 'kat') { oscSendKATmsg(sendStringKAT = raw.slice(8 + ((args[1] || "false").length + 1) + ((args[2] || "3").length + 1)).toString() + ' ', clearBefore = JSON.parse(args[1] || "false"), displayColor = parseInt(args[2] || "3")) }
	if (cmd == 'osc' && args[0] == 'chat') {
		if (args[1] == 'tall') {
			oscChatBox(`0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0`)
		}
		if (args[1] == 'fat') {
			oscChatBox(`0 0 0 0 0 0 0 0 0 0 0 0 0 0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0\v0 0 0 0 0 0 0 0 0 0 0 0 0 0`)
		}
		if (args[1] == 'bottom') {
			oscChatBox(`😳\v👉👈`)
		}
	}
})


udpPort.open()
//udpPortMeta.open()
exports.udpPortObj = udpPort

var oscReady
var bucket = 4
var timerActive = false
var timerstart;
var timerend;

function oscChatTyping(active) {
	udpPort.send({
		address: "/chatbox/typing",
		args: [
			{ type: 'i', value: active }
		]
	}, deviceIP, remotePort);
}
exports.oscChatTyping = oscChatTyping;


function oscChatBox(say, sec_to_clear) {
	if (useChatBox == false) { return }

	if (bucket <= 0) {
		console.log(`${loglv().warn}${selfLog} Sending messages to fast [TimeLeft: ${(timerend - Date.now()) / 1000}sec ]`)
		return
	}

	if (timerActive == false) {
		timerstart = Date.now()
		timerend = timerstart + 6000
		timerActive = true
		setTimeout(() => {
			timerActive = false
			bucket = 4
			//console.log(`${loglv().debug}${selfLog} ChatBox RateLimiter Reset`)
		}, 6000)
	}
	bucket--

	//console.log(`${loglv().debug}${selfLog} \x1b[33m/chatbox/input\x1b[0m: `+say.slice(0,144))
	//,{ type: "i", value: 0 } MessageSentSFX

	udpPort.send({
		address: "/chatbox/input",
		args: [
			say.slice(0, 144),
			true,
			false
		]
	}, deviceIP, remotePort);
	if (logOscOut == true) { console.log(`\x1b[33m<- ${selfLog} \x1b[33m/chatbox/input\x1b[0m: ` + say.slice(0, 144)) }
	if (sec_to_clear >= 1) {
		setTimeout(() => {
			udpPort.send({
				address: "/chatbox/input",
				args: [
					``,
					true,
					false
				]
			}, deviceIP, remotePort);
		}, sec_to_clear * 1000);
	}

	//oscChatTyping(0)

}
exports.oscChatBox = oscChatBox;
// console.log( String.fromCharCode(1) )


function oscSend(a, v) {
	udpPort.send({
		address: a,
		args: [v]
	}, deviceIP, remotePort);

	if (logOscOut == true) {
		console.log(`\x1b[33m<- ${selfLog} \x1b[33m${a}\x1b[0m: ${v}`)
	}
}
exports.oscSend = oscSend;


var dataBurstsQueue = []
var dataBurstdQueue = []
var dataBurstd2Queue = []
var dataBurstd3Queue = []
var dataBurstd4Queue = []

var dataBurstmKAT = []
const katChars = [` `, `!`, `"`, `#`, `$`, `%`, `&`, `'`, `(`, `)`, `*`, `+`, `,`, `-`, `.`, `/`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `:`, `;`, `<`, `=`, `>`, `?`, `@`, `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`, `T`, `U`, `V`, `W`, `X`, `Y`, `Z`, `[`, `\\`, `]`, `^`, `_`, `\``, `a`, `b`, `c`, `d`, `e`, `f`, `g`, `h`, `i`, `j`, `k`, `l`, `m`, `n`, `o`, `p`, `q`, `r`, `s`, `t`, `u`, `v`, `w`, `x`, `y`, `z`, `{`, `|`, `}`, `~`]
//function remapKat(value) { return -1 + value * 2 / 254/ 127.0 }

var isBurstingData = false

function OSCDataBurst(slot = 0, data1 = 0, data2 = 0, data3 = 0, data4 = 0, katMode = false) {
	//console.log(`${loglv().debug}${selfLog} [DataBurst] Adding buffer data ${data1}, ${data2}, ${data3} to Slot ${slot}`)
	dataBurstsQueue.push(slot)
	dataBurstdQueue.push(data1)
	dataBurstd2Queue.push(data2)
	dataBurstd3Queue.push(data3)
	dataBurstd4Queue.push(data4)
	dataBurstmKAT.push(katMode)

	if (isBurstingData == false) {
		isBurstingData = true
		setTimeout(() => {
			sendOscDataBurst()
		}, 200)
	}
}
function sendOscDataBurst() {
	//isBurstingData = true
	//console.log(`${loglv().debug}${selfLog} [DataBurst] Sending data ${dataBurstdQueue[0]}, ${dataBurstd2Queue[0]}, ${dataBurstd3Queue[0]} to Slot ${dataBurstsQueue[0]}`)
	if (dataBurstmKAT[0] == false) {
		oscSend('/avatar/parameters/oscSlot', dataBurstsQueue[0])
		oscSend('/avatar/parameters/oscData', dataBurstdQueue[0])
		oscSend('/avatar/parameters/oscData2', dataBurstd2Queue[0])
		oscSend('/avatar/parameters/oscData3', dataBurstd3Queue[0])
		oscSend('/avatar/parameters/oscData4', dataBurstd4Queue[0])
	} else if (dataBurstmKAT[0] == true) {
		oscSend('/avatar/parameters/KAT_Pointer', dataBurstsQueue[0])
		oscSend('/avatar/parameters/KAT_CharSync0', parseFloat(katChars.indexOf(dataBurstdQueue[0]) / 127))
		oscSend('/avatar/parameters/KAT_CharSync1', parseFloat(katChars.indexOf(dataBurstd2Queue[0]) / 127))
		oscSend('/avatar/parameters/KAT_CharSync2', parseFloat(katChars.indexOf(dataBurstd3Queue[0]) / 127))
		oscSend('/avatar/parameters/KAT_CharSync3', parseFloat(katChars.indexOf(dataBurstd4Queue[0]) / 127))
	}
	setTimeout(() => {
		//console.log(`${loglv().debug}${selfLog} Shifting`)
		dataBurstsQueue.shift()
		dataBurstdQueue.shift()
		dataBurstd2Queue.shift()
		dataBurstd3Queue.shift()
		dataBurstd4Queue.shift()
		dataBurstmKAT.shift()
		//console.log(`${loglv().debug}${selfLog} Still more?`)
		if (dataBurstsQueue.length > 0) {
			sendOscDataBurst()
		} else {
			//console.log(`${loglv().debug}${selfLog} [DataBurst] Idling`)
			isBurstingData = false
			oscSend('/avatar/parameters/oscSlot', 0)
			oscSend('/avatar/parameters/oscData', 0.5)
			oscSend('/avatar/parameters/oscData2', 0.5)
			oscSend('/avatar/parameters/oscData3', 0.5)
			oscSend('/avatar/parameters/oscData4', 0.5)
		}
	}, 200)
}
exports.OSCDataBurst = OSCDataBurst;


function oscSendKATmsg(sendStringKAT = '', clearBefore = false, displayColor = 3) {
	if (clearBefore == true) { OSCDataBurst(255, '', '', '', '', true) }
	OSCDataBurst(14, parseFloat(displayColor / 7), 0, 0, 0, false)
	/*
	Black	0
	White	1
	Red		2
	Green	3
	Blue	4
	Pink	5
	Yellow	6
	Cyan	7
	*/
	sendStringKAT.slice(0, 255).match(/.{1,4}/g).forEach((charSet, index) => {
		OSCDataBurst(index + 1, charSet.split('')[0], charSet.split('')[1] || " ", charSet.split('')[2] || " ", charSet.split('')[3] || " ", true)
	})
}
exports.oscSendKATmsg = oscSendKATmsg;


function oscSend2(addr, valu, valu2) {
	udpPort.send({
		address: addr,
		args: [valu, valu2]
	}, deviceIP, remotePort);

	if (logOscOut == true) {
		console.log(`\x1b[33m<- ${selfLog} \x1b[33m${addr}\x1b[0m: ${valu} ${valu2}`)
	}
}
exports.oscSend2 = oscSend2;

function oscSend3(addr, valu, valu2, valu3) {
	udpPort.send({
		address: addr,
		args: [valu, valu2, valu3]
	}, deviceIP, remotePort);

	if (logOscOut == true) {
		console.log(`\x1b[33m<- ${selfLog} \x1b[33m` + addr + `\x1b[0m: ` + valu + ` ` + valu2 + ` ` + valu3)
	}
}
exports.oscSend3 = oscSend3;

function oscSend6(addr, v1, v2, v3, v4, v5, v6) {
	udpPort.send({
		address: addr,
		args: [v1, v2, v3, v4, v5, v6]
	}, deviceIP, remotePort);

	if (logOscOut == true) {
		console.log(`\x1b[33m<- ${selfLog} \x1b[33m` + addr + `\x1b[0m: ` + v1 + ` ` + v2 + ` ` + v3 + ` ` + v4 + ` ` + v5 + ` ` + v6)
	}
}
exports.oscSend6 = oscSend6;

var PiS_duration = 0
var PiS_power = 0
var menuX = 0
var menuY = 0
oscEmitter.on('ready', (ready) => { });
oscEmitter.on('osc', (address, value) => {

	// /avatar/parameters/14a/oscsrc/testParameter
	// /avatar/parameters/14a/testParameter
	if (address.includes(`/14a/oscsrc/`)) { oscSend('/avatar/parameters/14a/' + address.split('/14a/oscsrc/')[1], value) }

	if (address == `/avatar/parameters/PiS_duration`) { PiS_duration = value }
	if (address == `/avatar/parameters/PiS_power`) { PiS_power = value }
	if (address == `/avatar/parameters/Contacts/PiActivate` && value == false) {
		if (PiS_duration >= 1 && PiS_power >= 1) {
			PiShockAll(PiS_power, PiS_duration)
		}
	}

	if (address == '/avatar/parameters/14a/osc/menuX') { menuX = value }
	if (address == '/avatar/parameters/14a/osc/menuY') { menuY = value }
	if (address == '/avatar/parameters/14a/osc/menuX' || address == '/avatar/parameters/14a/osc/menuY') {
		let deg = Math.atan2(menuY, menuX) * (180 / Math.PI) + 180
		playNote(10,70, clamp( (deg / 360) * 127 ) )
		// console.log(`aTan ${Math.atan2(menuY, menuX)}`)
		// console.log(`Angle ${deg}`)
	}

	if (address.includes('14a/midi')) {
		var channel = clamp2(address.split('14a/midi/')[1].split('/')[0])
		var number = clamp(address.split('14a/midi/')[1].split('/')[1])
		var velocity = 0
		if (value % 1 == 0) {
			// Int: Clamp [ 0 - 255 ] to 127
			velocity = clamp(value)
		} else {
			// Float: Clamp [ -1.0 - 1.0 ]
			velocity = clamp(value * 127)
		}
		playNote(channel, number, velocity)
	}

});
function clamp(input) { return Math.round(Math.max(0, Math.min(127, input))) }
function clamp2(input) { return Math.round(Math.max(0, Math.min(15, input))) }

udpPort.on("message", function (msg, rinfo) {
	// console.log(msg);
	// console.log(msg['args'][0]);
	//console.log("Remote info is: ", rinfo);

	oscEmitter.emit('osc', msg['address'], msg['args'][0]);

	if (msg['address'] == '/avatar/change') {
		var avatarId = msg['args'][0]
		exports.avatarId = msg['args'][0]
		oscEmitter.emit('avatar', msg['args'][0]);
		console.log(`${loglv().log}${selfLog} Avatar Changed: ${avatarId}`)
		if (avatarId == `avtr_21cbf284-0c09-423c-9973-5cd41dccd308`) { oscSend(`/avatar/parameters/LL/Menu/IsUnlocked`, 1 == 1) }
		if (avatarId == `avtr_2a9a9021-2b82-4564-bb63-2d96deb6a6d7`) { oscSend(`/avatar/parameters/Patreon-NDA`, 1 == 1) }
		if (avatarId == `avtr_94237663-3ed4-48fd-b29d-b3d6b174e004`) { oscSend(`/avatar/parameters/VF100_SecurityLockSync`, 1 == 1) }
		oscSend(`/avatar/parameters/14a/osc/14anthony7095`, true)
	}
	if (msg['address'] == '/avatar/parameters/toolGunHolster_Angle') { return }
	if (logOscIn == true) { console.log(`\x1b[36m->> ${selfLog} \x1b[36m` + msg['address'] + `\x1b[0m: ` + msg['args'][0]) }
	// if (msg['address'].includes('/usercamera/')) { console.log(`\x1b[36m->> ${selfLog} \x1b[36m` + msg['address'] + `\x1b[0m: ` + msg['args']) }
});

// function lerp(start,end,factor){ return start + (end - start) * factor; }
// // var transformExample = { x: 0, y: 0, z: 0, pitch: 0, yaw: 0 }
// function lerpTransform(transformStart, transformEnd, factor) {
// 	const x = transformStart.x + (transformEnd.x - transformStart.x) * factor
// 	const y = transformStart.y + (transformEnd.y - transformStart.y) * factor
// 	const z = transformStart.z + (transformEnd.z - transformStart.z) * factor
// 	const pitch = transformStart.pitch + (transformEnd.pitch - transformStart.pitch) * factor
// 	const yaw = transformStart.yaw + (transformEnd.yaw - transformStart.yaw) * factor
// 	oscSend6('/usercamera/Pose', x, y, z, pitch, yaw, 0)
// }

// setTimeout(() => {
// 	for (let index = 0; index < 300; index++) {
// 		setTimeout(() => {
// 			lerpTransform(
// 				{ x: 3, y: 1.2, z: -2, pitch: 0, yaw: -41 },
// 				{ x: -0.29, y: 1.252, z: -4.196, pitch: 0, yaw: 13.81 },
// 				index / 300
// 			)
// 		}, index * 30)
// 	}
// }, 5000)
// setTimeout(()=>{
// 	for (let index = 0; index < 300; index++) {
// 		setTimeout(() => {
// 			oscSend6('/usercamera/Pose', 0.45, 1.59, -3.92, 2.4, 357, lerp(0,360,index/300) )
// 		}, index * 30)
// 	}
// },15000)

udpPort.on("ready", function () {
	oscReady = true
	exports.oscReady = oscReady
	oscEmitter.emit('ready', true);
	console.log(`${loglv().log}${selfLog} Ready..`)

	if (isFullLaunch == true) {
		require('./Interface_vrc-Api.js')
		// require('./Interface_websocket-server.js')
		// require('./interface_midi.js')

		require('./osc_PingSystem.js') // OSC
		require('./osc_Chessboard-logic.js') // OSC
		require('./Interface_twitch.js') // OSC
		require('./osc_AfkClock.js') // OSC
		require('./osc_HeartRate.js') // OSC
		require('./osc_AutoClicker.js') // OSC
		require('./osc_Av3-menu-helper.js') // OSC
		// require('./osc_32display.js') // OSC
		require('./sys_taskKill.js') // OSC , LOG
		require('./osc_vrcPopulation.js') // OSC , API (directly)

		require('./Interface_vrc-Log.js') // OSC+ , Twitch

	}
});