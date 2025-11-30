
var { loglv, msgVerbose, twitchChannels, ttvAlwaysRun, useChatBox, ttvChatBox, ttvFetchFrom, saltyMode, ttvFetchFrom } = require('./config.js')
const { oscReady, oscSend, oscChatBox, oscEmitter, oscChatTyping } = require('./Interface_osc_v1.js');

const tmi = require('tmi.js');
const say = require('say');
const { cmdEmitter } = require('./input.js');
require('dotenv').config()

//	--	Global Vars	--
let selflog = `\x1b[0m[\x1b[35mTwitch.tv\x1b[0m]`
let selfMode = `Za World`
if (msgVerbose == 0) { selfMode = `\x1b[31mNo Messages\x1b[0m` }
if (msgVerbose == 1) { selfMode = `\x1b[35mCheer Only\x1b[0m` }
if (msgVerbose == 2) { selfMode = `\x1b[32mLatest Messages\x1b[0m` }
if (msgVerbose == 3) { selfMode = `\x1b[36mBuffer All\x1b[0m` }
let selfFetch = 'Za World'
if (ttvFetchFrom == 0) { selfFetch = `\x1b[31mVideo\x1b[0m/\x1b[31mUsers\x1b[0m` }
if (ttvFetchFrom == 1) { selfFetch = `\x1b[32mVideo\x1b[0m/\x1b[31mUsers\x1b[0m` }
if (ttvFetchFrom == 2) { selfFetch = `\x1b[31mVideo\x1b[0m/\x1b[32mUsers\x1b[0m` }
let isttvRunning = false
let isActive = false
var supportedAvatars = ['avtr_6865ad14-dfcb-4285-8e3d-1674ed655722', 'avtr_9d2264c9-0524-44eb-a6da-712b9306e04d', 'avtr_bcc000a7-094b-4adc-9953-4cb95ff86b3e', 'avtr_7c561c55-9225-400a-899e-7300f44ca545', 'avtr_7368d5ea-67cb-41fa-80f0-34c9fed6bc39', 'avtr_e1dbdac0-0a9e-42f0-aeef-bb2d4ef27bc1']
var isTalking = false
var chatBuffer = []
var twitchFromVideo = twitchChannels

//	--	On Load	--

console.log(`${loglv().log}${selflog} Loaded -> ${selfMode} , ${loglv(ttvAlwaysRun)}AlwaysRun${loglv().reset} , ${loglv(ttvChatBox)}UseChatBox${loglv().reset} , ChannelFrom[${selfFetch}]${loglv().reset}`)
const opts = {
	identity: { username: `14aBot`, password: process.env["TWITCH_BOT_AUTH"] },
	channels: twitchChannels
};
const client = new tmi.client(opts);

cmdEmitter.on('cmd', (cmd, args) => {
	if (cmd == 'help') {
		console.log(`${selflog}
-	twitch msg [0-3] // [0] Disable	[1] Cheers	[2] Latest	[3] Buffer
-	twitch chatbox [true/false]
-	twitch join ["Channel"]
-	twitch leave ["Channel"]
-	twitch switch ["Channel"]
-	twitch from [0-2] // [0] None  [1] Videoplayers  [2] Users
-	twitch alwaysrun [true/false]
-	twitch salty [true/false]`)
	}

	if (cmd == 'twitch' && args[0] == 'alwaysrun') { ttvAlwaysRun = args[1] }
	if (cmd == 'twitch' && args[0] == 'msg') { msgVerbose = args[1] }
	if (cmd == 'twitch' && args[0] == 'chatbox') { ttvChatBox = JSON.parse(args[1]) }
	if (cmd == 'twitch' && args[0] == 'join') { ttvFetchFrom = 2; setTimeout(() => { joinChannel(args[1].toString()) }, 100) }
	if (cmd == 'twitch' && args[0] == 'leave') { ttvFetchFrom = 2; setTimeout(() => { leaveChannel(args[1].toString()) }, 100) }
	if (cmd == 'twitch' && args[0] == 'switch') { ttvFetchFrom = 1; setTimeout(() => { switchChannel(args[1].toString()) }, 100) }
	if (cmd == 'twitch' && args[0] == 'from') { ttvFetchFrom = args[1] }
	if (cmd == 'twitch' && args[0] == 'salty') { saltyMode = args[1] }
	if (cmd == 'twitch' && args[0] == 'mediatek') {
		chatBuffer.push({
			'say': 'Mediatek is an homage to the G4 show Cinematech. Edited clips are played at random to create a media collage of games, movie clips, and commercials.',
			'log': 'Mediatek is an homage to the G4 show Cinematech. Edited clips are played at random to create a media collage of games, movie clips, and commercials.',
			'osc': 'Mediatek is an homage to the G4 show Cinematech. Edited clips are played at random to create a media collage of games, movie clips, and commercials.',
			'color': '1,0,0',
			'isCheer': 0
		})
		if (msgVerbose >= 2 && isTalking == false) { saySpeak() }
	}
})

//if( ttvAlwaysRun == true ){ start() }
start()


oscEmitter.on('osc', (address, value) => {
	if (msgVerbose != 0 && address == '/avatar/change') {
		if (isActive == false && supportedAvatars.includes(value)) {
			start()
		} else if (isActive == true && !supportedAvatars.includes(value)) {
			stop()
		}
	}
})


function start() {
	isActive = true
	console.log(`${loglv().log}${selflog} Starting..`)
	if (isttvRunning == false) {
		console.log(`${loglv().log}${selflog} Attempting to Connect`)
		client.connect().catch((err) => { console.error(`${loglv().warn}${selflog} ` + err) })
		isttvRunning = true
	}
	else if (isttvRunning == true) {
		rejoinChannel()
	}
	oscSend('/avatar/parameters/ttvIsTalking', false)
	oscSend('/avatar/parameters/ToN_IsStarted', false)
	oscSend('/avatar/parameters/ToN_ColorR', parseFloat(0.392156) )
	oscSend('/avatar/parameters/ToN_ColorG', parseFloat(0.254901) )
	oscSend('/avatar/parameters/ToN_ColorB', parseFloat(0.643137) )
}


var clearingBuffer = false
function switchChannel(newChannel) {
	if (ttvFetchFrom == 1 && isActive == true) {
		say.stop()
		console.log(`${loglv().log}${selflog} Switching to channel ${newChannel}`)
		twitchFromVideo = newChannel
		client.getChannels().forEach(tc => {
			client.part(tc)
				.catch(err => { console.log(`${loglv().warn}${selflog}`, err) })
		})
		clearingBuffer = true
		chatBuffer = []
		oscSend('/avatar/parameters/ToN_IsStarted', false)
		msgVerbose = 3

		client.join(newChannel).then((data) => {
			//console.log(data)
			clearingBuffer = false
			isActive = true
			isttvRunning = true
			oscSend('/avatar/parameters/ttvIsTalking', false)
			oscSend('/avatar/parameters/ToN_ColorR', parseFloat(0.392156) )
			oscSend('/avatar/parameters/ToN_ColorG', parseFloat(0.254901) )
			oscSend('/avatar/parameters/ToN_ColorB', parseFloat(0.643137) )
		}).catch(err => {
			console.log(`${loglv().warn}${selflog}`, err)
		})
	}
}
exports.switchChannel = switchChannel;
function joinChannel(newChannel) {
	if (ttvFetchFrom == 2 && isActive == true) {
		console.log(`${loglv().log}${selflog} Joining channel ${newChannel}`)
		twitchFromVideo = newChannel

		client.join(newChannel).then((data) => {
			//console.log(data)
			isActive = true
			isttvRunning = true
		}).catch(err => {
			console.log(`${loglv().warn}${selflog}`, err)
			if (err == 'No response from Twitch.') {
				setTimeout(() => {
					console.log(`${loglv().log}${selflog} Retrying Join`)
					joinChannel(newChannel)
				}, 5000);
			}
		})
	}
}
exports.joinChannel = joinChannel;

function leaveChannel(newChannel) {
	if (ttvFetchFrom == 2 && isActive == true) {
		console.log(`${loglv().log}${selflog} Leaving channel ${newChannel}`)

		client.part(newChannel).catch((err) => {
			console.log(`${loglv().warn}${selflog}`, err)
			if (err == 'No response from Twitch.') {
				setTimeout(() => {
					console.log(`${loglv().log}${selflog} Retrying Leave`)
					leaveChannel(newChannel)
				}, 5000);
			}
		})
	}
}
exports.leaveChannel = leaveChannel;

function rejoinChannel() {
	if (ttvFetchFrom == 1 && isActive == true) {
		console.log(`${loglv().log}${selflog} Reconnecting to last channel ${twitchFromVideo}`)

		isActive = true
		isttvRunning = true
		oscSend('/avatar/parameters/ttvIsTalking', false)
		oscSend('/avatar/parameters/ToN_IsStarted', false)
		oscSend('/avatar/parameters/ToN_ColorR', parseFloat(0.392156) )
		oscSend('/avatar/parameters/ToN_ColorG', parseFloat(0.254901) )
		oscSend('/avatar/parameters/ToN_ColorB', parseFloat(0.643137) )

	}
}

function stop() {
	if (ttvAlwaysRun == false) {
		isActive = false
		console.log(`${loglv().log}${selflog} Pausing..`)
	}
}


if (useChatBox == true) { oscChatTyping(0) }
function saySpeak() {
	isTalking = true
	console.log(chatBuffer[0].log)
	if (useChatBox == true && ttvChatBox == true) {
		oscChatBox(`~${chatBuffer[0].osc.slice(0, 144)}`)
	}

	oscSend('/avatar/parameters/ToN_ColorR', parseFloat(chatBuffer[0].color.split(',')[0]) )
	oscSend('/avatar/parameters/ToN_ColorG', parseFloat(chatBuffer[0].color.split(',')[1]) )
	oscSend('/avatar/parameters/ToN_ColorB', parseFloat(chatBuffer[0].color.split(',')[2]) )

	oscSend('/avatar/parameters/ToN_IsStarted', true)
	oscSend('/avatar/parameters/ttvIsTalking', true)
	oscSend('/avatar/parameters/ttvCheerTier', parseFloat(chatBuffer[0].isCheer))
	say.speak(chatBuffer[0].say, 'Microsoft David Desktop', 1.0, (err) => {
		if (err) { return console.error(`${loglv().warn}${selflog} say.js error: ` + err) }
		if (useChatBox == true && ttvChatBox == true) {
			//oscChatBox('~')
		}
		chatBuffer.shift()
		if (msgVerbose == 3) { console.log(`${loglv().debug}${selflog} Messages Left in Buffer: ${chatBuffer.length}`) }
		oscSend('/avatar/parameters/ttvIsTalking', false)
		oscSend('/avatar/parameters/ToN_ColorR', parseFloat(0.392156) )
		oscSend('/avatar/parameters/ToN_ColorG', parseFloat(0.254901) )
		oscSend('/avatar/parameters/ToN_ColorB', parseFloat(0.643137) )

		oscSend('/avatar/parameters/ttvCheerTier', false)
		setTimeout(() => {
			isTalking = false
			if (chatBuffer.length > 100) {
				console.log(`${loglv().hey}${selflog} Messages buffer is too full, switching to Latest Messages mode`)
				clearingBuffer = true
				chatBuffer = []
				oscSend('/avatar/parameters/ToN_IsStarted', false)
				oscChatBox('')
				if (msgVerbose >= 3) { msgVerbose = 2 }
				setTimeout(() => { clearingBuffer = false }, 1000);
			} else if (chatBuffer.length > 0 && clearingBuffer == false) {
				saySpeak()
			} else {
				if (useChatBox == true) {
					oscChatBox('')
					oscChatTyping(0)
				}
			}
		}, 1000)
	})
}

client.on('connected', (addr, port) => {
	console.log(`${loglv().log}${selflog} Connected to ${addr}:${port}`)
})

client.on("join", (channel, username, self) => {
	if (oscReady == false) { return }
	if (self) {
		console.log(`${loglv().log}${selflog} Joined ${channel}'s Chat`)
		if (ttvAlwaysRun == true) { oscSend('/avatar/parameters/ttvEnabled', 1 == 1) }
	}
});



client.on("message", (channel, userstate, message, self) => {
	if (isActive == false) { return }
	if (clearingBuffer == true) { return }

	if (userstate["message-type"] == "chat") {

		if (channel == '#saltybet' && saltyMode == true) {
			//if( userstate['display-name'] != 'WAIFU4u' && userstate['display-name'] != 'Nightbot' && message.slice(0,1) != '!' ){ return }
			if (userstate['display-name'] != 'WAIFU4u') { return }
		}

		if (msgVerbose >= 2) {

			if (msgVerbose == 2 && isTalking == true) { return }

			let usercolor = `0.75294,0,1`
			if (userstate.color != null) {
				usercolor = `${parseInt(userstate.color.slice(1, 3), 16) / 255},${parseInt(userstate.color.slice(3, 5), 16) / 255},${parseInt(userstate.color.slice(5, 7), 16) / 255}`
			}

			let whatpartofmsgwassay = `<` + userstate["display-name"] + `> ` + message
			let userlog = `${loglv().log}${selflog} ` + channel + ` ` + whatpartofmsgwassay
			if (useChatBox == true && ttvChatBox == true && whatpartofmsgwassay.slice(144).length > 0) {
				var partalmsgpercent = ((100 * whatpartofmsgwassay.slice(144).length) / whatpartofmsgwassay.length).toFixed(0)
				userlog = `${loglv().log}${selflog} ` + channel + ` ` + whatpartofmsgwassay.slice(0, 144) + `\x1b[31m` + whatpartofmsgwassay.slice(144) + `
${loglv().log}${selflog} \x1b[33m${partalmsgpercent}% of message was not shown in ChatBox${loglv().reset}`
			}

			if (useChatBox == true) { oscChatTyping(1) }

			chatBuffer.push({
				'say': userstate["display-name"] + ' said ' + message,
				'log': userlog,
				'osc': `<` + userstate["display-name"] + `> ` + message,
				'color': usercolor,
				'isCheer': 0
			})
		}

		if (msgVerbose >= 2 && isTalking == false) { saySpeak() }
	}
});



client.on('cheer', (channel, userstate, message) => {
	if (isActive == false) { return }
	if (clearingBuffer == true) { return }

	if (msgVerbose >= 1) {

		let cheeramount = 0
		if (userstate.bits >= 1) { cheeramount = 1 }
		else if (userstate.bits >= 100) { cheeramount = 2 }
		else if (userstate.bits >= 1000) { cheeramount = 3 }
		else if (userstate.bits >= 5000) { cheeramount = 4 }
		else if (userstate.bits >= 10000) { cheeramount = 5 }

		let usercolor = `0.75294,0,1`
		if (userstate.color != null) {
			usercolor = `${parseInt(userstate.color.slice(1, 3), 16) / 255},${parseInt(userstate.color.slice(3, 5), 16) / 255},${parseInt(userstate.color.slice(5, 7), 16) / 255}`
		}

		var msgNoCheer = message.replace(/\//g, '.').replace(/Cheer10000/g, '').replace(/Cheer5000/g, '').replace(/Cheer1000/g, '').replace(/Cheer100/g, '').replace(/Cheer1/g, '')

		let whatpartofmsgwassay = `<` + userstate["display-name"] + `> ` + message
		let userlog = `${loglv().log}${selflog} Cheer` + userstate.bits + ` ` + channel + ` ` + whatpartofmsgwassay

		if (useChatBox == true && ttvChatBox == true && whatpartofmsgwassay.slice(144).length > 0) {
			var partalmsgpercent = ((100 * whatpartofmsgwassay.slice(144).length) / whatpartofmsgwassay.length).toFixed(0)
			userlog = `${loglv().log}${selflog} Cheer` + userstate.bits + ` ` + channel + ` ` + whatpartofmsgwassay.slice(0, 144) + `\x1b[31m` + whatpartofmsgwassay.slice(144) + `
${loglv().log}${selflog} \x1b[33m${partalmsgpercent}% of message was not shown in ChatBox\x1b[0m`
		}

		chatBuffer.push({
			'say': userstate["display-name"] + ' cheered ' + userstate.bits + ' bits. ' + msgNoCheer,
			'log': userlog,
			'osc': `<` + userstate["display-name"] + `> ` + message,
			'color': usercolor,
			'isCheer': cheeramount
		})

	}
	if (msgVerbose >= 1 && isTalking == false) { saySpeak() }
});

