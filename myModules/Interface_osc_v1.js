/*
-------------------------------------

	OSC easify

-------------------------------------
*/
//	--	Libraries	--
const { loglv, useChatBox } = require('./config.js')
var { logOscIn, logOscOut } = require('./config.js')
const { deviceIP } = require('../index.js')
let selflog = `\x1b[0m[\x1b[34mOSC\x1b[0m]`
var osc = require('osc');
var udpPort = new osc.UDPPort({ localAddress: '127.0.0.1', localPort: 9100 })
const remotePort = 9000
const { cmdEmitter } = require('./input.js');
const { playNote } = require('./interface_midi.js')
const { PiShock, PiShockAll } = require('./Interface_PS.js');
const { toUnicode } = require('punycode');
const fs = require('fs');
const { EventEmitter } = require('events');
const oscEmitter = new EventEmitter();
exports.oscEmitter = oscEmitter;

console.log(`${loglv().log}${selflog} Loaded -> ${loglv(logOscIn)}Input${loglv().reset} , ${loglv(logOscOut)}Output${loglv().reset} , ${loglv(useChatBox)}ChatBox${loglv().reset}`)
console.log(`${loglv().log}${selflog} Connected to ${deviceIP}`)

var nanaPartyCCTVtimer;
const vrcap = '/avatar/parameters/'
cmdEmitter.on('cmd', (cmd, args, raw) => {
	if (cmd == 'help') {
		console.log(`${selflog}
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
	if (cmd == 'osc' && args[0] == 'say') {
		oscChatBoxV2(raw.slice(8).toString(), undefined, false, false, false, true)
	}
	if (cmd == 'osc' && args[0] == 'send') { oscSend('/avatar/parameters/' + args[1], JSON.parse(args[2])) }
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
	if (cmd == 'osc' && args[0] == 'serial') {
		OSCBinaryBurst(args[1], 200, 400)
	}
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
var chatboxQueue = []

function oscChatTyping(active) {
	udpPort.send({
		address: "/chatbox/typing",
		args: [
			{ type: 'i', value: active }
		]
	}, deviceIP, remotePort);
}
exports.oscChatTyping = oscChatTyping;

function oscChatBoxV2(I_say = "~", I_display_time = 5000, I_highPriority = false, I_auto_clear = false, isLoop = false, I_playAudio = false) {
	let firstLong = 0
	if (isLoop == false) {
		oscChatTyping(1)
		if (I_highPriority == true) {
			let msgsplit = I_say.match(/.{0,144}\S(?=$|\s)/g)
			chatboxQueue.length == 0 ? firstLong = msgsplit.length : 0
			for (const seg in msgsplit) {
				chatboxQueue.unshift({ "message": msgsplit[seg], "display_time_ms": I_display_time, "auto_clear": I_auto_clear, "play_audio": I_playAudio })
			}
			// })
			// chatboxQueue.unshift({ "message": I_say, "display_time_ms": I_display_time, "auto_clear": I_auto_clear })
		} else {
			let msgsplit = I_say.match(/.{0,144}\S(?=$|\s)/g)
			chatboxQueue.length == 0 ? firstLong = msgsplit.length : 0
			for (const seg in msgsplit) {
				chatboxQueue.push({ "message": msgsplit[seg], "display_time_ms": I_display_time, "auto_clear": I_auto_clear, "play_audio": I_playAudio })
			}
			// })
			// console.log(chatboxQueue)
			// chatboxQueue.push({ "message": I_say, "display_time_ms": I_display_time, "auto_clear": I_auto_clear })
		}
	}

	// console.log(chatboxQueue.length)

	if (chatboxQueue.length < 2 + firstLong || isLoop == true) {

		udpPort.send({ address: "/chatbox/input", args: [chatboxQueue[0].message.slice(0, 144), true, chatboxQueue[0].play_audio] }, deviceIP, remotePort);
		console.log(`${loglv().debug}${selflog} [\x1b[33m/chatbox/input\x1b[0m]${chatboxQueue[0].play_audio == true ? '🔊' : '🔇'} ${chatboxQueue[0].message.slice(0, 144)}`)

		// console.log(`${loglv().debug}${selflog} [\x1b[33m/chatbox/input\x1b[0m] Delay`+Math.max(5000, chatboxQueue[0].display_time_ms))		

		setTimeout(() => {
			if (chatboxQueue.length == 1 && chatboxQueue[0].auto_clear == true) { udpPort.send({ address: "/chatbox/input", args: [``, true, chatboxQueue[0].play_audio] }, deviceIP, remotePort); }
			chatboxQueue.shift()
			if (chatboxQueue.length != 0) {
				oscChatBoxV2(undefined, undefined, undefined, undefined, true)
			} else {
				// console.log(`${loglv().debug}${selflog} [\x1b[33m/chatbox/input\x1b[0m] Idle.`)
				oscChatTyping(0)
			}
		}, Math.max(1500, chatboxQueue[0].display_time_ms, (chatboxQueue[0].message.slice(0, 144).split(" ").length / 150) * 60_000));

	} else {
		oscChatTyping(1)
		console.log(`${loglv().debug}${selflog} [\x1b[33m/chatbox/input\x1b[0m] Busy: Adding to Queue`)
	}
}
exports.oscChatBoxV2 = oscChatBoxV2

// Legacy Bridge
function oscChatBox(say, clearTime) { oscChatBoxV2(say, (clearTime || 0) * 1000, false, clearTime >= 1) }
exports.oscChatBox = oscChatBox


function oscSend(a, v) {
	udpPort.send({
		address: a,
		args: [v]
	}, deviceIP, remotePort);

	if (logOscOut == true) {
		console.log(`\x1b[33m<- ${selflog} \x1b[33m${a}\x1b[0m: ${v}`)
	}
}
exports.oscSend = oscSend;

var dataBurst = []
var binaryBurstQueue = []
var dataBurstmKAT = []
const katChars = [` `, `!`, `"`, `#`, `$`, `%`, `&`, `'`, `(`, `)`, `*`, `+`, `,`, `-`, `.`, `/`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `:`, `;`, `<`, `=`, `>`, `?`, `@`, `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`, `T`, `U`, `V`, `W`, `X`, `Y`, `Z`, `[`, `\\`, `]`, `^`, `_`, `\``, `a`, `b`, `c`, `d`, `e`, `f`, `g`, `h`, `i`, `j`, `k`, `l`, `m`, `n`, `o`, `p`, `q`, `r`, `s`, `t`, `u`, `v`, `w`, `x`, `y`, `z`, `{`, `|`, `}`, `~`]
//function remapKat(value) { return -1 + value * 2 / 254/ 127.0 }


async function OSCBinaryBurst(serializedBinary = 11111111, pulseClkHold = 200, bitGapDelay = 400, isLoop = false) {
	if (isLoop == false) { binaryBurstQueue.push(serializedBinary) }
	if (binaryBurstQueue.length < 2 || isLoop == true) {
		console.log(`${loglv().debug}${selflog} [Serial-Burst] Sending ${binaryBurstQueue[0]}...`)
		for (const bit in binaryBurstQueue[0]) {
			// console.log(`${loglv().debug}${selflog} [Serial-Burst] bit ${binaryBurstQueue[0][bit]}`)
			await sendSerializedBinary(parseInt(binaryBurstQueue[0][bit]), bit == binaryBurstQueue[0].length - 1)
			if (bit == binaryBurstQueue[0].length - 1) {
				binaryBurstQueue.shift()
				if (binaryBurstQueue.length != 0) {
					setTimeout(() => { OSCBinaryBurst(undefined, pulseClkHold, bitGapDelay, true) }, bitGapDelay)
				} else {
					console.log(`${loglv().debug}${selflog} [Serial-Burst] Idle.`)
				}
			}
		}
		async function sendSerializedBinary(bit, lastbit) {
			return new Promise((resolve, reject) => {
				oscSend(vrcap + '14a/osc/data', bit == 1);
				oscSend(vrcap + '14a/osc/sync', lastbit);
				oscSend(vrcap + '14a/osc/clk', true);
				setTimeout(() => {
					oscSend(vrcap + '14a/osc/clk', false);
					setTimeout(() => { resolve(true) }, bitGapDelay)
				}, pulseClkHold);
			})
		};
	} else {
		console.log(`${loglv().debug}${selflog} [Serial-Burst] Busy: Adding to Queue`)
	}
}
exports.OSCBinaryBurst = OSCBinaryBurst


async function OSCDataBurst(in_addr, in_dataA, isLoop = false) {
	/*
	Usage Chart
	0	Null Space / No Selection
	1	MCounter: online digits, position 1
	2	MCounter: online digits, position 2
	3	MCounter: online digits, position 3
	4	MCounter: online digits, position 4
	5	MCounter: online digits, position 5
	6	MCounter: online digits, position 6
	7	MCounter: lobby digits, position 1
	8	MCounter: lobby digits, position 2
	9	MCounter: lobby digits, position 3
	10	MCounter: lobby digits, position 4
	11	MCounter: lobby progress bar
	12	ToN-Wait-Time: 0 - 4:15 Float
	13	MCounter: display mode indicator
	*/
	if (isLoop == false) { dataBurst.push({ 'addr': in_addr, 'dataA': in_dataA }) }
	if (dataBurst.length < 2 || isLoop == true) {
		// console.log(`${loglv().debug}${selflog} [OSCDataBurst] Sending ${JSON.stringify(dataBurst[0])}`)
		await sendOSCDataBurst_v2(dataBurst[0].addr, dataBurst[0].dataA)
		dataBurst.shift()
		if (dataBurst.length != 0) {
			setTimeout(() => { OSCDataBurst(undefined, undefined, true) }, 200)
		} else {
			oscSend(vrcap + 'oscAddr', 0)
			oscSend(vrcap + 'oscDataA', 1)
			// console.log(`${loglv().debug}${selflog} [OSCDataBurst] Idle.`)
		}
		async function sendOSCDataBurst_v2(addr, dataA) {
			return new Promise((resolve, reject) => {
				oscSend(vrcap + 'oscAddr', addr)
				oscSend(vrcap + 'oscDataA', dataA)
				setTimeout(() => { resolve(true) }, 200)
			})
		};
	} else {
		// console.log(`${loglv().debug}${selflog} [OSCDataBurst] Busy: Adding to Queue`)
	}
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
		console.log(`\x1b[33m<- ${selflog} \x1b[33m${addr}\x1b[0m: ${valu} ${valu2}`)
	}
}
exports.oscSend2 = oscSend2;

function oscSend3(addr, valu, valu2, valu3) {
	udpPort.send({
		address: addr,
		args: [valu, valu2, valu3]
	}, deviceIP, remotePort);

	if (logOscOut == true) {
		console.log(`\x1b[33m<- ${selflog} \x1b[33m` + addr + `\x1b[0m: ` + valu + ` ` + valu2 + ` ` + valu3)
	}
}
exports.oscSend3 = oscSend3;

function oscSend6(addr, v1, v2, v3, v4, v5, v6) {
	udpPort.send({
		address: addr,
		args: [v1, v2, v3, v4, v5, v6]
	}, deviceIP, remotePort);

	if (logOscOut == true) {
		console.log(`\x1b[33m<- ${selflog} \x1b[33m` + addr + `\x1b[0m: ` + v1 + ` ` + v2 + ` ` + v3 + ` ` + v4 + ` ` + v5 + ` ` + v6)
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
	if (address.includes(`/14a/oscsrc/`)) { oscSend(vrcap + '14a/' + address.split('/14a/oscsrc/')[1], value) }

	if (address == vrcap + `PiS_duration`) { PiS_duration = value }
	if (address == vrcap + `PiS_power`) { PiS_power = value }
	if (address == vrcap + `Contacts/PiActivate` && value == false) {
		if (PiS_duration >= 1 && PiS_power >= 1) {
			PiShockAll(PiS_power, PiS_duration)
		}
	}

	if (address == vrcap + 'd20/d20_Menu' && value == 1) {
		PiShockAll(50, 2)
	}

	if (address == vrcap + '14a/osc/menuX') { menuX = value }
	if (address == vrcap + '14a/osc/menuY') { menuY = value }
	if (address == vrcap + '14a/osc/menuX' || address == vrcap + '14a/osc/menuY') {
		let deg = Math.atan2(menuY, menuX) * (180 / Math.PI) + 180
		playNote(10, 70, clamp((deg / 360) * 127))
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

var lastCameraPos
udpPort.on("message", function (msg, rinfo) {
	// console.log(msg);
	// console.log(msg['args'][0]);
	//console.log("Remote info is: ", rinfo);

	oscEmitter.emit('osc', msg['address'], msg['args'][0]);

	if (msg['address'] == `/usercamera/Pose`) {
		lastCameraPos = msg['args']
		// console.log(`${loglv().debug} storing: ${msg['args']}`)
	}
	if (msg['address'] == `/usercamera/Mode` && msg['args'][0] == 2) {
		// console.log(`${loglv().debug} saving to file: ${lastCameraPos}`)
		fs.appendFile('datasets/cameraPositions.txt', `\r\n${lastCameraPos}`, 'utf-8', (err) => { if (err) { console.log(err) } })
	}

	if (msg['address'] == '/avatar/change') {
		var avatarId = msg['args'][0]
		exports.avatarId = msg['args'][0]
		oscEmitter.emit('avatar', msg['args'][0]);
		console.log(`${loglv().log}${selflog} Avatar Changed: ${avatarId}`)
		if (avatarId == `avtr_21cbf284-0c09-423c-9973-5cd41dccd308`) { oscSend(vrcap + `LL/Menu/IsUnlocked`, 1 == 1) }
		if (avatarId == `avtr_2a9a9021-2b82-4564-bb63-2d96deb6a6d7`) { oscSend(vrcap + `Patreon-NDA`, 1 == 1) }
		if (avatarId == `avtr_94237663-3ed4-48fd-b29d-b3d6b174e004`) { oscSend(vrcap + `VF100_SecurityLockSync`, 1 == 1) }
		oscSend(vrcap + "   locked", false)
		oscSend(vrcap + `14a/osc/14anthony7095`, true)
	}
	if (msg['address'] == vrcap + 'toolGunHolster_Angle') { return }
	if (logOscIn == true) { console.log(`\x1b[36m->> ${selflog} \x1b[36m` + msg['address'] + `\x1b[0m: ` + msg['args']) }
	// if (msg['address'].includes('/usercamera/')) { console.log(`\x1b[36m->> ${selflog} \x1b[36m` + msg['address'] + `\x1b[0m: ` + msg['args']) }
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
	console.log(`${loglv().log}${selflog} Ready..`)

	require('./Interface_vrc-Api.js')
	// require('./interface_midi.js')

	// require('./osc_PingSystem.js') // OSC
	require('./osc_Chessboard-logic.js') // OSC
	require('./Interface_twitch.js') // OSC
	require('./osc_AfkClock.js') // OSC
	// require('./osc_HeartRate.js') // OSC
	require('./osc_AutoClicker.js') // OSC
	require('./osc_Av3-menu-helper.js') // OSC
	// require('./osc_32display.js') // OSC
	require('./sys_taskKill.js') // OSC , LOG
	require('./osc_vrcPopulation.js') // OSC , API (directly)

	require('./Interface_vrc-Log.js') // OSC+ , Twitch

});