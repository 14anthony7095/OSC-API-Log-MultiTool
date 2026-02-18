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

function oscChatBoxV2(I_say = "~", I_display_time_ms = 5000, I_highPriority = false, I_auto_clear = false, isLoop = false, I_playAudio = false) {
	let firstLong = 0
	if (isLoop == false) {
		oscChatTyping(1)
		if (I_highPriority == true) {
			let msgsplit = I_say.match(/.{0,144}\S(?=$|\s)/g)
			chatboxQueue.length == 0 ? firstLong = msgsplit.length : 0
			for (const seg in msgsplit) {
				chatboxQueue.unshift({ "message": msgsplit[seg], "display_time_ms": I_display_time_ms, "auto_clear": I_auto_clear, "play_audio": I_playAudio })
			}
			// })
			// chatboxQueue.unshift({ "message": I_say, "display_time_ms": I_display_time, "auto_clear": I_auto_clear })
		} else {
			let msgsplit = I_say.match(/.{0,144}\S(?=$|\s)/g)
			chatboxQueue.length == 0 ? firstLong = msgsplit.length : 0
			for (const seg in msgsplit) {
				chatboxQueue.push({ "message": msgsplit[seg], "display_time_ms": I_display_time_ms, "auto_clear": I_auto_clear, "play_audio": I_playAudio })
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
	12	
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

var menuX = 0
var menuY = 0
oscEmitter.on('osc', (address, value) => {

	// /avatar/parameters/14a/oscsrc/testParameter
	// /avatar/parameters/14a/testParameter
	if (address.includes(`/14a/oscsrc/`)) { oscSend(vrcap + '14a/' + address.split('/14a/oscsrc/')[1], value) }

	// Trigger PiShock when rolling a Nat 1 on the D20
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

	if (msg['address'] == vrcap + 'MuteSelf') {
		oscEmitter.emit('voiceActive', msg['args'][0] == true);
	}

	if (msg['address'] == '/avatar/change') {
		var avatarId = msg['args'][0]
		exports.avatarId = msg['args'][0]
		oscEmitter.emit('avatar', msg['args'][0]);
		console.log(`${loglv().log}${selflog} Avatar Changed: ${avatarId}`)
		if (avatarId == `avtr_21cbf284-0c09-423c-9973-5cd41dccd308`) { oscSend(vrcap + `LL/Menu/IsUnlocked`, 1 == 1) }
		if (avatarId == `avtr_2a9a9021-2b82-4564-bb63-2d96deb6a6d7`) { oscSend(vrcap + `Patreon-NDA`, 1 == 1) }
		oscSend(vrcap + `VF100_SecurityLockSync`, 1 == 1)
		oscSend(vrcap + "   locked", false)
		oscSend(vrcap + `14a/osc/14anthony7095`, true)
	}
	// if (msg['address'] == vrcap + 'toolGunHolster_Angle') { return }
	if (logOscIn == true) { console.log(`\x1b[36m->> ${selflog} \x1b[36m` + msg['address'] + `\x1b[0m: ` + msg['args']) }
	// if (msg['address'].includes('/usercamera/')) { console.log(`\x1b[36m->> ${selflog} \x1b[36m` + msg['address'] + `\x1b[0m: ` + msg['args']) }
});

async function avatarRoulette() {
	const ownAvatars = [
		'avtr_75c670ca-4614-4db2-a687-e27994acb0ac',
		'avtr_0c97e918-23d0-4934-b364-5fd28fb10236',
		'avtr_5c866609-f49a-4867-ac74-5dab03d5d713',
		'avtr_0e5ee812-23bb-49be-bf24-ee26d3cce0c3',
		'avtr_4a841638-f1f0-48fa-bf13-d8dc70733c21',
		'avtr_01c72797-2db5-477c-a889-f562e46acec9',
		'avtr_dc40b8ed-06fd-4cf4-a68d-52416789e420',
		'avtr_6b25124e-e141-4df4-ad27-22766608e5dc',
		'avtr_54ad2ca6-ca8b-4a8d-a3d6-e98ecbee6de5',
		'avtr_4facb6a2-46ba-4f51-8913-3115c1576b1c',
		'avtr_5bd23d6b-1256-4d3f-91d4-f444d30d69f7',
		'avtr_305ddd5d-d1f9-4adb-a025-50c2f1a9d219',
		'avtr_445d0b78-9afb-4dbe-8e21-3f67c4df0e2f',
		'avtr_4255f168-2305-45c8-9565-5e71729dc617',
		'avtr_212019dd-1a92-4cad-8fa3-315fc2171f55',
		'avtr_e7606537-1ce4-4b85-bb02-e7cbc65e333b',
		'avtr_ba71f860-9071-4650-99ac-b3807892fe9d',
		'avtr_fd31e468-4dd9-4505-b3c0-cea6c9ad253e',
		'avtr_6865ad14-dfcb-4285-8e3d-1674ed655722',
		'avtr_ed16320a-3446-472d-93c8-04fa275a057f',
		'avtr_61dd6b6f-a3ba-4bce-be2d-6480fc97350e',
		'avtr_56e57e73-d876-4af1-990f-991dcba28379',
		'avtr_9df39891-37ea-4ce1-8559-4cb1f0a8a560',
		'avtr_5415d0a3-c403-43e8-9342-080e372ac971',
		'avtr_6549f8a1-0c3a-4e91-9531-1dd774fd5826',
		'avtr_50d47178-7487-46c0-908e-eeaa2e1c1fe6',
		'avtr_187f519e-38d4-4b54-b794-5f9cd7001996',
		'avtr_422d1875-250b-4e00-8530-0a196325165b',
		'avtr_ef5c0911-f5cd-4606-8ea5-0bb4db14b6b3',
		'avtr_ead22119-58dd-4a83-b091-e9f7cd9c95c1',
		'avtr_0dffad79-784f-4b32-8a09-f56f8358cd1c',
		'avtr_2ebf3bc0-a842-45b9-8ec0-425cb4e1a215',
		'avtr_c61e0706-a19c-49ae-be91-95c991ec43b8',
		'avtr_d31aee66-3407-41e5-8738-daa204335b77',
		'avtr_2bc7b54b-a107-4170-b412-381ce61db870',
		'avtr_404ca82d-61ff-406b-bdc6-44d6eb9adffa',
		'avtr_7e026057-c0a9-4299-ae2b-c7d5dee9775d',
		'avtr_0d24d6f3-54a0-4b43-9a18-1d05037ad5e8',
		'avtr_78736900-6285-4689-8f26-b6535a048615',
		'avtr_aef6b6d9-48b6-4aab-9586-4b9caa2c1a1d',
		'avtr_02bc3200-24a4-49cd-89a2-44d55605c45f',
		'avtr_2425b435-d0c6-4022-a0cf-a48ccd5c8191',
		'avtr_58061b7b-4d26-4f22-9b04-d2b60c14ec70',
		'avtr_3969b9fe-b30f-4a10-a522-de48998484cd',
		'avtr_877a7414-59f9-49b7-9f75-f86e6a549b61',
		'avtr_a3fab8b7-3d41-4a14-bc59-61ae3207473c',
		'avtr_d7d9721b-2da1-4d40-8248-171af0c8308d',
		'avtr_3edd8feb-c6f9-456d-8a18-bbb83bde8f95',
		'avtr_74d986cf-c457-4410-8363-8636a36dd47f',
		'avtr_c0f912ba-e1f0-4292-89f6-ffcbe516473b',
		'avtr_da5ad028-1a5e-4e83-8520-7faea9dfb994',
		'avtr_a10c5aa8-19ce-46b8-b276-c5c6c3a3d98e',
		'avtr_198cdc74-b025-4442-8067-b0fd7e8208db',
		'avtr_42ba17ef-6f50-4236-8b24-ef37d6e99c9d',
		'avtr_2f026532-8efa-4f3c-b15b-21f64c69365a',
		'avtr_a73c2dde-854b-42e6-b395-54c0599ebef5',
		'avtr_a8bb0827-5f00-4d88-b9d9-37e6973e4bc7',
		'avtr_bba034cb-05f7-4159-9ba3-fd5bd08f5526'
	]

	ownAvatars.forEach((avtr,index)=>{
		setTimeout(()=>{
			oscSend('/avatar/change',avtr)
		},index*120_000)
	})
}

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
	console.log(`${loglv().log}${selflog} Ready..`)

	// require('./Interface_vrc-Api.js')
	// require('./interface_midi.js')

	// require('./osc_PingSystem.js') // OSC
	require('./osc_Chessboard-logic.js') // OSC
	require('./Interface_twitch.js') // OSC
	// require('./osc_HeartRate.js') // OSC
	require('./osc_AutoClicker.js') // OSC
	require('./osc_Av3-menu-helper.js') // OSC
	// require('./osc_32display.js') // OSC
	require('./sys_taskKill.js') // OSC , LOG
	require('./osc_vrcPopulation.js') // OSC , API (directly)

	require('./interface_OBS.cjs')

	require('./Interface_vrc-Log.js') // OSC+ , Twitch

});