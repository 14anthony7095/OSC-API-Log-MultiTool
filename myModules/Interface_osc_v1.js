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

console.log(`${loglv.info}${selflog} Loaded -> ${loglv.bool(logOscIn)}Input${loglv.reset} , ${loglv.bool(logOscOut)}Output${loglv.reset} , ${loglv.bool(useChatBox)}ChatBox${loglv.reset}`)
console.log(`${loglv.info}${selflog} Connected to ${deviceIP}`)

var nanaPartyCCTVtimer;
const vrcap = '/avatar/parameters/'
cmdEmitter.on('cmd', (cmd, args, raw) => {
	if (cmd == 'help') {
		console.log(`${selflog}
-	osc in [true/false]
-	osc out [true/false]
-	osc say ["Message"]
-	osc morse ["Message"]
-	osc avatars
-	osc chat [tall/fat]
-	osc kat [Clear: True/False | Color: 0-7 | "Message"]
-	osc db [ID] [DATA]
-	osc db [ID] [DATA] [DATA2]
-	osc db [ID] [DATA] [DATA2] [DATA3]
-	path [JSONdataObject OR .json File path]`)
	}
	if (cmd == 'osc' && args[0] == 'in') { logOscIn = JSON.parse(args[1]) }
	if (cmd == 'osc' && args[0] == 'out') { logOscOut = JSON.parse(args[1]) }
	if (cmd == 'osc' && args[0] == 'avatars') { avatarRoulette() }
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
	if (cmd == 'osc' && args[0] == 'serial') { OSCBinaryBurst(args[1], 200, 400) }
	if (cmd == 'osc' && args[0] == 'serialx2') { OSCBinaryBurst(args[1], 100, 200) }
	if (cmd == 'osc' && args[0] == 'serialx4') { OSCBinaryBurst(args[1], 20, 100) }
	if (cmd == 'osc' && args[0] == 'scale') {
		oscSend('/avatar/eyeheight', parseFloat(args[1]))
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


function oscChatTyping(active) {
	udpPort.send({
		address: "/chatbox/typing",
		args: [
			{ type: 'i', value: active }
		]
	}, deviceIP, remotePort);
}
exports.oscChatTyping = oscChatTyping;

/* function oscChatBoxV3({
	message = '',
	line1 = '',
	line2 = '',
	line3 = '',
	line4 = '',
	line5 = '',
	minDisplayTime = 1000,
	playAudio = true,
	queueMessage = false,
	forceFrontOfQueue = false,
	currentQueue = []
}) {

} */

var chatboxQueue = []
function oscChatBoxV2(I_say = "~", I_display_time_ms = 5000, I_highPriority = false, I_auto_clear = false, isLoop = false, I_playAudio = false, I_splitV = false) {
	let firstLong = 0
	if (isLoop == false) {
		oscChatTyping(1)
		if (I_highPriority == true) {
			if (I_splitV == false) {
				var msgsplit = I_say.match(/.{0,144}\S(?=$|\s)/g)
				chatboxQueue.length == 0 ? firstLong = msgsplit.length : 0
				for (const seg in msgsplit) {
					chatboxQueue.unshift({ "message": msgsplit[seg], "display_time_ms": I_display_time_ms, "auto_clear": I_auto_clear, "play_audio": I_playAudio })
				}
			} else {
				var msgsplit = I_say.match(/.{0,144}\S(?=$|\v)/g)
				chatboxQueue.length == 0 ? firstLong = msgsplit.length : 0
				for (const seg in msgsplit) {
					chatboxQueue.unshift({ "message": msgsplit[seg], "display_time_ms": I_display_time_ms, "auto_clear": I_auto_clear, "play_audio": I_playAudio })
				}
			}
			// })
			// chatboxQueue.unshift({ "message": I_say, "display_time_ms": I_display_time, "auto_clear": I_auto_clear })
		} else {
			if (I_splitV == false) {
				var msgsplit = I_say.match(/.{0,144}\S(?=$|\s)/g)
				chatboxQueue.length == 0 ? firstLong = msgsplit.length : 0
				for (const seg in msgsplit) {
					chatboxQueue.push({ "message": msgsplit[seg], "display_time_ms": I_display_time_ms, "auto_clear": I_auto_clear, "play_audio": I_playAudio })
				}
			} else {
				var msgsplit = I_say.match(/.{0,144}\S(?=$|\v)/g)
				chatboxQueue.length == 0 ? firstLong = msgsplit.length : 0
				for (const seg in msgsplit) {
					chatboxQueue.push({ "message": msgsplit[seg], "display_time_ms": I_display_time_ms, "auto_clear": I_auto_clear, "play_audio": I_playAudio })
				}
			}
			// })
			// console.log(chatboxQueue)
			// chatboxQueue.push({ "message": I_say, "display_time_ms": I_display_time, "auto_clear": I_auto_clear })
		}
	}

	// console.log(chatboxQueue.length)

	if (chatboxQueue.length < 2 + firstLong || isLoop == true) {
		let msgSlice = chatboxQueue[0].message.slice(0, 144)
		udpPort.send({ address: "/chatbox/input", args: [msgSlice, true, chatboxQueue[0].play_audio] }, deviceIP, remotePort);
		console.log(`${loglv.debug}${selflog} [\x1b[33m/chatbox/input\x1b[0m]${chatboxQueue[0].play_audio == true ? '🔊' : '🔇'} ${msgSlice.replace(/\v/g, '\n                                       ')}`)

		// console.log(`${loglv.debug}${selflog} [\x1b[33m/chatbox/input\x1b[0m] Delay`+Math.max(5000, chatboxQueue[0].display_time_ms))		

		setTimeout(() => {
			if (chatboxQueue.length == 1 && chatboxQueue[0].auto_clear == true) {
				udpPort.send({ address: "/chatbox/input", args: [``, true, chatboxQueue[0].play_audio] }, deviceIP, remotePort);
			}
			chatboxQueue.shift()
			if (chatboxQueue.length != 0) {
				oscChatBoxV2(undefined, undefined, undefined, undefined, true)
			} else {
				// console.log(`${loglv.debug}${selflog} [\x1b[33m/chatbox/input\x1b[0m] Idle.`)
				oscChatTyping(0)
			}
		}, Math.max(1500, chatboxQueue[0].display_time_ms, msgSlice.split(" ").length * 600, msgSlice.length * 120));

	} else {
		oscChatTyping(1)
		console.log(`${loglv.debug}${selflog} [\x1b[33m/chatbox/input\x1b[0m] Busy: Adding to Queue`)
	}
}
exports.oscChatBoxV2 = oscChatBoxV2

// Legacy Bridge
function oscChatBox(say, clearTime) { oscChatBoxV2(say, (clearTime || 0) * 1000, false, clearTime >= 1) }
exports.oscChatBox = oscChatBox


function oscSend(a = '', v) {
	udpPort.send({
		address: a,
		args: [v]
	}, deviceIP, remotePort);

	if (logOscOut == true) { console.log(`\x1b[33m<- ${selflog} \x1b[33m${a}\x1b[0m: ${v}`) }
}
exports.oscSend = oscSend;

var dataBurst = []
var binaryBurstQueue = []
var dataBurstmKAT = []
const katChars = [` `, `!`, `"`, `#`, `$`, `%`, `&`, `'`, `(`, `)`, `*`, `+`, `,`, `-`, `.`, `/`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `:`, `;`, `<`, `=`, `>`, `?`, `@`, `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`, `T`, `U`, `V`, `W`, `X`, `Y`, `Z`, `[`, `\\`, `]`, `^`, `_`, `\``, `a`, `b`, `c`, `d`, `e`, `f`, `g`, `h`, `i`, `j`, `k`, `l`, `m`, `n`, `o`, `p`, `q`, `r`, `s`, `t`, `u`, `v`, `w`, `x`, `y`, `z`, `{`, `|`, `}`, `~`]
//function remapKat(value) { return -1 + value * 2 / 254/ 127.0 }


/*
setInterval(()=>{
	oscSend('/avatar/parameters/ping', true )
	setTimeout(()=>{
		oscSend('/avatar/parameters/ping', false )
	},1000)
},2000)
*/


async function OSCBinaryBurst(serializedBinary = 11111111, pulseClkActive = 200, pulseClkGap = 400, isLoop = false) {
	/* 
	Usage Chart
	[0000][000][000]	PlayerPlatformTrust
	*/
	if (isLoop == false) { binaryBurstQueue.push(serializedBinary) }
	if (binaryBurstQueue.length >= 2 && isLoop == false) {
		console.log(`${loglv.debug}${selflog} [Serial-Burst] Busy: Adding to Queue`)
		return
	}

	console.log(`${loglv.debug}${selflog} [Serial-Burst] Sending ${binaryBurstQueue[0]}...`)
	for (const bit in binaryBurstQueue[0]) {
		// console.log(`${loglv.debug}${selflog} [Serial-Burst] bit ${binaryBurstQueue[0][bit]}`)
		// Loop through all Bits in current string
		await sendSerializedBinary(parseInt(binaryBurstQueue[0][bit]), bit == binaryBurstQueue[0].length - 1)

		// Finish and move to next Bit String
		if (bit == binaryBurstQueue[0].length - 1) {
			binaryBurstQueue.shift()
			if (binaryBurstQueue.length != 0) {
				setTimeout(() => { OSCBinaryBurst(undefined, pulseClkActive, pulseClkGap, true) }, pulseClkGap)
			} else {
				console.log(`${loglv.debug}${selflog} [Serial-Burst] Idle.`)
			}
		}
	}

	async function sendSerializedBinary(bit, isFinalBit = false) {
		return new Promise((resolve, reject) => {
			oscSend(vrcap + '14a/osc/data', bit == 1);
			oscSend(vrcap + '14a/osc/sync', isFinalBit);
			oscSend(vrcap + '14a/osc/clk', true);
			setTimeout(() => {
				oscSend(vrcap + '14a/osc/clk', false);
				setTimeout(() => { resolve(true) }, pulseClkGap)
			}, pulseClkActive);
		})
	};

}
exports.OSCBinaryBurst = OSCBinaryBurst


var OSCDataBurstState = 'ready'
function getOSCDataBurstState() { return OSCDataBurstState }
exports.getOSCDataBurstState = getOSCDataBurstState;
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
	12	MCounter: lobby groupMember bar
	13	MCounter: display mode indicator
	*/
	if (isLoop == false) { dataBurst.push({ 'addr': in_addr, 'dataA': in_dataA }) }
	if (dataBurst.length < 2 || isLoop == true) {
		if (dataBurst.length >= 50) {
			OSCDataBurstState = 'overloaded'
			console.log(`${loglv.debug}${selflog} [OSCDataBurst] ${OSCDataBurstState} by: ${dataBurst.length} - ${dataBurst[0].addr}, ${dataBurst[0].dataA}`)
			dataBurst = []
			/* if(dataBurst.length >= 100){
				console.log(`${loglv.hey}${selflog} [OSCDataBurst] ${OSCDataBurstState}: PURGING BUFFER of ${dataBurst.length} entries`)
								
			} */
		} else { OSCDataBurstState = 'busy' }
		// console.log(`${loglv.debug}${selflog} [OSCDataBurst] ${OSCDataBurstState} Sending: ${dataBurst[0].addr}, ${dataBurst[0].dataA}`)
		if (dataBurst.length != 0) {
			await sendOSCDataBurst_v2(dataBurst[0].addr, dataBurst[0].dataA)
			dataBurst.shift()
		}
		if (dataBurst.length != 0) {
			setTimeout(() => { OSCDataBurst(undefined, undefined, true) }, 200)
		} else {
			oscSend(vrcap + 'oscAddr', 0)
			oscSend(vrcap + 'oscDataA', 1)
			OSCDataBurstState = 'ready'
			// console.log(`${loglv.debug}${selflog} [OSCDataBurst] Idle.`)
		}
		async function sendOSCDataBurst_v2(addr, dataA) {
			return new Promise((resolve, reject) => {
				oscSend(vrcap + 'oscAddr', addr)
				oscSend(vrcap + 'oscDataA', dataA)
				setTimeout(() => { resolve(true) }, 200)
			})
		};
	} else {
		// console.log(`${loglv.debug}${selflog} [OSCDataBurst] Busy: Adding to Queue`)
	}
}
exports.OSCDataBurst = OSCDataBurst;
exports.OSCDataBurstState = OSCDataBurstState;


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


var oscCache = {
	'menuX': 0,
	'menuY': 0,
	'findUp_Hit': false,
	'findUp_Distance': 0,
	'roomScaleRay': false,
	'eyeheight': 0,
	'eyeheightmin': 0,
	'eyeheightmax': 0,
	'eyeheightscalingallowed': 0,
	'eyeheight_RateLimit': 0,
	'doAutoJump': false,
	'earsDown': false
}
udpPort.on("message", function (msg, rinfo) {
	if (logOscIn == true) { console.log(`\x1b[36m->> ${selflog} \x1b[36m` + msg['address'] + `\x1b[0m: ` + msg['args']) }
	oscEmitter.emit('osc', msg['address'], msg['args'][0]);
	var address = msg['address']
	var value = msg['args'][0]


	// 83% of ceiling height
	if (address == vrcap + 'findUp_Distance') { oscCache['findUp_Distance'] = value }
	if (address == vrcap + 'findUp_Hit') { oscCache['findUp_Hit'] = value }
	if (address == vrcap + 'toggle/earsDown') { oscCache['earsDown'] = value }
	if (address == vrcap + '14a/button/roomScaleRay') { oscCache['roomScaleRay'] = value }

	if (oscCache['roomScaleRay'] == true && oscCache['findUp_Hit'] == true && oscCache['eyeheight_RateLimit'] < Date.now()) {
		oscSend('/avatar/eyeheight', parseFloat(oscCache['findUp_Distance'] * parseFloat(oscCache['earsDown'] == true ? 0.83 : 0.7)))
	}


	// Auto-Jumping
	if (address == '/avatar/parameters/osc/doAutoJump') { oscCache['doAutoJump'] = value }
	if (address == '/avatar/parameters/Grounded' && value == true && oscCache['doAutoJump'] == true) {
		oscSend('/input/Jump', true); setTimeout(() => { oscSend('/input/Jump', false) }, 100);
	}


	// Proxy menu parameters
	// oscsrc = in menu
	// remove = sync
	if (address.includes(`/14a/oscsrc/`)) { oscSend(vrcap + '14a/' + address.split('/14a/oscsrc/')[1], value) }


	// Trigger PiShock when rolling a Nat 1 on the D20
	if (address == vrcap + 'd20/d20_Menu' && value == 1) { PiShockAll(50, 2) }


	// Move TheWatcher
	if (address == vrcap + '14a/osc/menuX') { oscCache['menuX'] = value }
	if (address == vrcap + '14a/osc/menuY') { oscCache['menuY'] = value }
	if (address == vrcap + '14a/osc/menuX' || address == vrcap + '14a/osc/menuY') {
		let deg = Math.atan2(oscCache['menuY'], oscCache['menuX']) * (180 / Math.PI) + 180
		playNote(10, 70, clamp((deg / 360) * 127))
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


	// Save XYZ cordnets using camera mode switching
	if (address == `/usercamera/Pose`) { oscCache['lastCameraPos'] = value }
	if (address == `/usercamera/Mode` && value == 2) { fs.appendFile('datasets/cameraPositions.txt', `\r\n${oscCache['lastCameraPos']}`, 'utf-8', (err) => { if (err) { console.log(err) } }) }


	// Tell OBS to toggle my stream mic
	if (address == vrcap + 'MuteSelf') { oscEmitter.emit('voiceActive', value == true); }


	// Avatar change handler
	if (address == '/avatar/change') {
		console.log(`${loglv.info}${selflog} Avatar Changed: ${value}`)
		oscEmitter.emit('avatar', value)

		if (value == `avtr_21cbf284-0c09-423c-9973-5cd41dccd308`) { oscSend(vrcap + `LL/Menu/IsUnlocked`, 1 == 1) } // LL Male Redux
		if (value == `avtr_2a9a9021-2b82-4564-bb63-2d96deb6a6d7`) { oscSend(vrcap + `Patreon-NDA`, 1 == 1) } // LL Lambie

		oscSend(vrcap + `VF100_SecurityLockSync`, 1 == 1)
		oscSend(vrcap + "   locked", false)
		oscSend(vrcap + `14a/osc/14anthony7095`, true)
	}


	// Avatar Scaling - Debug Logging
	if (address == `/avatar/eyeheight`) { oscCache['eyeheight'] = value }
	if (address == `/avatar/eyeheightmin`) { oscCache['eyeheightmin'] = value }
	if (address == `/avatar/eyeheightmax`) { oscCache['eyeheightmax'] = value }
	if (address == `/avatar/eyeheightscalingallowed`) { oscCache['eyeheightscalingallowed'] = value }
	if (address == `/avatar/eyeheight`
		|| address == `/avatar/eyeheightmin`
		|| address == `/avatar/eyeheightmax`
		|| address == `/avatar/eyeheightscalingallowed`) {
		if (oscCache['eyeheight_RateLimit'] < Date.now()) {
			oscCache['eyeheight_RateLimit'] = Date.now() + 500
			console.log(`${loglv.info}${selflog} [AvatarScale] [${oscCache['eyeheightscalingallowed']}] (${Math.round(oscCache['eyeheightmin'] * 100) / 100} <> ${Math.round(oscCache['eyeheightmax'] * 100) / 100}): ${Math.round(oscCache['eyeheight'] * 100) / 100}`)
		}
	}



});

function clamp(input) { return Math.round(Math.max(0, Math.min(127, input))) }
function clamp2(input) { return Math.round(Math.max(0, Math.min(15, input))) }


udpPort.on("ready", function () {
	console.log(`${loglv.info}${selflog} Ready..`)

	// require('./interface_midi.js')
	require('./Interface_twitch.js') // OSC
	// require('./osc_HeartRate.js') // OSC
	require('./sys_taskKill.js') // OSC , LOG
	require('./osc_vrcPopulation.js') // OSC , API (directly)
	require('./interface_OBS.cjs')
	require('./Interface_vrc-ApiLog.cjs') // OSC+ , Twitch

});