/*
-------------------------------------

	VRChat Log Reader

-------------------------------------
*/
// Libraries
var { loglv, printAllLogs, ChatVideoURL, ChatVideoTitle, ttvAlwaysRun, ttvFetchFrom, ChatImageStringURL, ChatDownSpeed, logStickers, downloadStickers } = require('./config.js')
var { oscSend, oscChatBox, avatarId, oscEmitter } = require('./Interface_osc_v1.js')
var { switchChannel, joinChannel, leaveChannel } = require('./Interface_twitch.js');
var fs = require('fs')
var ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const say = require('say');
const EventEmitter = require('events');
const { cmdEmitter } = require('./input.js');
const { PiShock, PiShockAll } = require('./Interface_PS.js');
const { config } = require('process');
const logEmitter = new EventEmitter
exports.logEmitter = logEmitter;
require('dotenv').config()

let selfLog = `\x1b[0m[\x1b[32mVRC_Log\x1b[0m]`
var path = 'C:/Users/14anthony7095/AppData/LocalLow/VRChat/VRChat/'
var tarFile = 'nothing'
var tarFilePath = 'nothing'
var playersInInstance = []
var playersInstanceObject = []
var playerHardLimit = 99
var playerRatio = 0.5

//	--	On Load	--
console.log(`${loglv().log}${selfLog} Loaded -> ${loglv(printAllLogs)}printAllLogs${loglv().reset} , ${loglv(ChatVideoURL)}ChatVideoURL${loglv().reset} , ${loglv(ChatVideoTitle)}ChatVideoTitle${loglv().reset}`)

cmdEmitter.on('cmd', (cmd, args) => {
	if (cmd == 'help') {
		console.log(`${selfLog}
-	log vidurl [true/false]
-	log vidtitle [true/false]
-	log printall [true/false]
-	log queue [true/false]
-	log speed [true/false]`)
	}
	if (cmd == 'log' && args[0] == 'vidurl') { ChatVideoURL = JSON.parse(args[1]) }
	if (cmd == 'log' && args[0] == 'vidtitle') { ChatVideoTitle = JSON.parse(args[1]) }
	if (cmd == 'log' && args[0] == 'printall') { printAllLogs = JSON.parse(args[1]) }
	if (cmd == 'log' && args[0] == 'queue') { ChatAvyQueue = JSON.parse(args[1]) }
	if (cmd == 'log' && args[0] == 'speed') { ChatDownSpeed = JSON.parse(args[1]) }

	if (cmd == 'twitch' && args[0] == 'alwaysrun') { ttvAlwaysRun = args[1] }
	if (cmd == 'twitch' && args[0] == 'join') { ttvFetchFrom = 2; setTimeout(() => { joinChannel(args[1].toString()) }, 100) }
	if (cmd == 'twitch' && args[0] == 'leave') { ttvFetchFrom = 2; setTimeout(() => { leaveChannel(args[1].toString()) }, 100) }
	if (cmd == 'twitch' && args[0] == 'switch') { ttvFetchFrom = 1; setTimeout(() => { switchChannel(args[1].toString()) }, 100) }
	if (cmd == 'twitch' && args[0] == 'from') { ttvFetchFrom = args[1] }
})

function fetchLogFile() {
	console.log(`${loglv().log}${selfLog} Finding latest log file`)
	fs.readdir(path, function (err, files) {
		files = files.map(function (fileName) {
			return {
				name: fileName,
				time: fs.statSync(path + '/' + fileName).mtime.getTime()
			}
		})
			.sort(function (a, b) {
				return a.time - b.time
			})
			.map(function (v) {
				return v.name
			})
			.filter(function (a) {
				return a.includes('output_log_')
			})
		tarFile = files[files.length - 1]
		tarFilePath = path + '' + files[files.length - 1]
		console.log(`${loglv().log}${selfLog} Found newest log file: ${files[files.length - 1]}`)
		//require('./oscPlyNameToggle.js')
		startWatching()
	})
}
exports.fetchLogFile = fetchLogFile;
fetchLogFile()


function partWhole(part = null, whole = null, percent = null) {
	// Missing Part
	var crossmulti;
	try {
		crossmulti = part * 100
		try { return crossmulti / whole }
		catch { return crossmulti / percent }
	}
	catch {
		crossmulti = whole * percent
		return crossmulti / 100
	}
}


var watcher;
//var vurl = null
var lastUpdated = 0
var lastChecked = 0
function startWatching() {
	console.log(`${loglv().log}${selfLog} Started Watcher`)
	if (tarFilePath.includes('undefined')) {
		setTimeout(() => { updateWatcher() }, 5000)
		return
	} else {
		watcher = fs.watch(tarFilePath, 'utf8', (eventType, filename) => {
			//console.log( `${loglv().debug}${selfLog}`, eventType, filename)
			if (eventType == 'change' && filename == tarFile) {
				lastUpdated = Date.now()
				//console.log(`${loglv().debug}${selfLog} ${lastUpdated} Log updated`)
				readLogFile()
			}
			if (eventType == 'rename' && filename.includes('output_log_')) {
				console.log(`${loglv().warn}${selfLog} A newer log file might of just been created`)
				updateWatcher()
			}
		})
	}
}


function updateWatcher() {
	console.log(`${loglv().log}${selfLog} Updating Watcher`)
	watcher.close()
	fetchLogFile()
}


var previousLength = 0
var currentLength = 0
var cooldown = false
var urlType = 'none'
var logCooldown = 0.001 // secs
function readLogFile(cooldownSkip) {
	if (cooldown == false || cooldownSkip == true) {
		lastChecked = Date.now()
		//console.log(`${loglv().debug}${selfLog} ${lastChecked} Reading Log`)
		cooldown = true

		// Replace with createReadStream
		// const readStream = fs.createReadStream( tarFilePath, { encoding: 'utf8' });
		// readStream.on('data', (chunk) => {
		//   	// Process the chunk of data
		// 	var newDataPerLine = chunk.replace(/^\s*\n/gm, "").trim().split('\n')
		// 	currentLength = newDataPerLine.length
		// 	// console.log( newDataPerLine )
		// 	// varibles to check for within the line scan
		// 	newDataPerLine.slice( currentLength - previousLength ).forEach((line,index)=>{
		// 		if( line.length != 0 ){
		// 			console.log(`${loglv().debug}${selfLog} ${line}`)
		// 			outputLogLines(index, newDataPerLine.length-1, line);
		// 		}
		// 	})
		// });
		// readStream.on('end', () => {
		// 	previousLength = currentLength
		// 	setTimeout(()=>{
		// 		if( lastChecked < lastUpdated ){ readLogFile(true) }
		// 		else{ cooldown = false }
		// 	},logCooldown*1000)
		//   console.log('File read complete');
		// });
		// readStream.on('error', (err) => {
		//   // Handle errors
		//   console.error(err);
		// });

		fs.readFile(tarFilePath, 'utf8', (err, data) => {
			if (err) { console.log(err); return }
			dataNE = data.replace(/^\s*\n/gm, "").trim()
			currentLength = dataNE.length
			if (previousLength == 0) { previousLength = currentLength }
			newData = dataNE.slice(previousLength)
			var newDataPerLine = newData.split('\r')
			//newDataPerLine.shift()

			// varibles to check for within the line scan
			newDataPerLine.forEach((line, index) => {
				if (line.length != 0) {
					outputLogLines(index, newDataPerLine.length - 1, line);
				}

				// Reached end of new lines
				if (index == newDataPerLine.length - 1) {
					setTimeout(() => {
						if (lastChecked < lastUpdated) { readLogFile(true) }
						else { cooldown = false }
					}, logCooldown * 1000)
				}
			})
			previousLength = currentLength

		})
	}
}


// logEmitter.on('log', line => { })
// logEmitter.on('playerJoin', playerName => {})
// logEmitter.on('playerLeft', playerName => {})

function getPlayersInInstance() { return playersInInstance }
exports.getPlayersInInstance = getPlayersInInstance;
function getPlayersInstanceObject() { return playersInstanceObject }
exports.getPlayersInstanceObject = getPlayersInstanceObject;


var lastVideoURL = ``
var seenVideoURLs = [] // For current instance only
var worldHopTimeout;
var worldHopTimeoutHour;
var tonRoundType = ''
var worldID = ``
var worldID_Closed = false
oscSend('/avatar/parameters/log/instance_closed', false)
var groupID = ``

function getInstanceGroupID() { return groupID }
exports.getInstanceGroupID = getInstanceGroupID;

function outputLogLines(currentLineIndexFromBuffer, totalLinesInBuffer, line) {
	if (printAllLogs == true) {
		console.log(`${loglv().debug}${selfLog} [${currentLineIndexFromBuffer}/${totalLinesInBuffer}] ${line}`)
	}

	logEmitter.emit('log', line)

	if (line.includes('[Behaviour] Destination set: wrld_')) { eventHeadingToWorld(line) }
	if (line.includes('[Behaviour] Joining wrld_')) { eventJoinWorld() }
	if (line.includes('Instance closed: ')) { eventInstanceClosed() }
	if (line.includes(`Shocked: `) && line.includes(process.env["VRC_ACC_NAME_1"])) { PiShockAll(30, 1) }
	if (line.includes('[Behaviour] Hard max is ')) {
		playerHardLimit = parseInt(line.split('[Behaviour] Hard max is ')[1])
		oscSend('/avatar/parameters/log/player_max', playerHardLimit > 80 ? 80 : playerHardLimit)
	}
	if (line.includes('[Behaviour] Initialized player')) { eventPlayerInitialized(line) }
	if (line.includes('[Behaviour] OnPlayerJoined')) { eventPlayerJoin(line) }
	if (line.includes('[Behaviour] OnPlayerLeft')) { eventPlayerLeft(line) }

	if (line.includes('[Behaviour] Switching ') && line.includes(' to avatar ')) { eventPlayerAvatarSwitch(line) }

	if (line.includes(`Received Notification: <`)) { eventReceivedNotification(line) }

	if (line.includes(`VRCApplication: HandleApplicationQuit`)) { eventGameClose() }

	if (line.includes(`[VRCProps] Prop prop_829ba6f6-b837-49d9-b9a9-056b82103b58`)) { eventCubePropSpawned() }
	if (line.includes(`[VRCProps] Prop prop_89be973f-9e1a-4260-8deb-211e32da8196`)) { eventWandPropSpawned() }
	if (line.includes(`[VRCProps] Prop prop_5c54ccdb-cafb-461b-b07f-91d189fc7b72`)) { eventBlasterPropSpawned() }

	if (line.includes(`[VRCX] VideoPlay(PopcornPalace) `)) { eventPopcornPalace(line.split('[VRCX] VideoPlay(PopcornPalace) ')[1]) }

	// Terrors of Nowhere
	/*
	if( line.includes(`[DEATH][14anthony7095]`) ){ PiShockAll(30,1) }
	if (worldID == 'wrld_a61cdabe-1218-4287-9ffc-2a4d1414e5bd') {
		if (line.includes(`Round type is`)) {
			tonRoundType = line.split('Round type is ')[1]
			console.log(`${loglv().log}${selfLog} [TON] Round type is ${tonRoundType}`)
		}
		if (line.includes(`Sus player =`)) {
			tonSusPlayer = line.split('Sus player = ')[1]
			console.log(`${loglv().log}${selfLog} [TON] Impostor is ${tonSusPlayer}`)
			oscChatBox(`~Impostor is ${tonSusPlayer}`)
		}
		if (tonRoundType == 'Fog' && line.includes(`14anthony7095 landed a stun against`)) {
			tonStunned = line.split('14anthony7095 landed a stun against ')[1]
			console.log(`${loglv().log}${selfLog} [TON] landed stun on ${tonStunned}`)
			oscChatBox(`~Fog Terror is ${tonStunned}`)
		}
	}
	*/

	// Portal Manager
	if (line.includes(`[PortalManager]`)) {
		var PortalLog = line.split(`[PortalManager] `)[1]
		if (PortalLog == 'Received portal destroy event.') { oscChatBox(`~Portal has vanished`, 5) }
		console.log(`${loglv().log}${selfLog} [PortalManager]: ${PortalLog}`)
	}

	// Local Moderation Manager
	if (line.includes(`[ModerationManager]`)) {
		var moderationlog = line.split(`[ModerationManager] `)[1]
		console.log(`${loglv().log}${selfLog} [ModerationManager]: ${moderationlog}`)
	}

	// Asset Bundle Download Manager
	if (line.includes(`[AssetBundleDownloadManager]`)) { eventAssetDownload(line) }

	// Image Downloading
	if (line.includes('[Image Download] Attempting to load image from URL')) {
		var imageurl = line.split('[Image Download] Attempting to load image from URL ')[1].trim()
		// console.log(`${loglv().log}${selfLog} Downloading Image from ${imageurl}`)
		if (ChatImageStringURL == true) { oscChatBox(`~ImageURL: ${imageurl}`, 5) }
	}

	// String Downloading
	// I assume this is the same as Image downloading.. may need to change later
	if (line.includes('[String Download] Attempting to load String from URL')) {
		var stringurl = line.split('[String Download] Attempting to load String from URL ')[1].trim()
		if (/https?\:\/\/vr-m\.net\/[0-9]\/keepalive/.test(stringurl)) { return } // Surpress Moves&Chill heartbeat
		// if( stringurl == `'https://vr-m.net/1/keepalive'` ){ return	} // Surpress Moves&Chill heartbeat
		// console.log(`${loglv().log}${selfLog} Downloading String from ${stringurl}`)
		if (ChatImageStringURL == true) { oscChatBox(`~StringURL: ${stringurl}`, 5) }
	}

	// World download progress ETA
	if (line.includes('[Behaviour] Preparation has taken')) {
		// Seconds download has been running (in Sec) , Current download percent
		var timeSecs = parseInt(line.split('[Behaviour] Preparation has taken ')[1].split(' ')[0].trim())
		var progressPercent = parseFloat(line.split('progress is ')[1].split('%,')[0].trim()) * 100
		worldDownloadProgress(timeSecs, progressPercent)
	}

	// StickerManager
	if (line.includes(`[StickersManager]`) && logStickers == true) {
		var stickerlog = line.split(`[StickersManager] `)[1]
		var stickerOwner = stickerlog.split('(')[1].split(')')[0]
		var stickerFile = stickerlog.split('spawned sticker ')[1]
		console.log(`${loglv().log}${selfLog} [StickersManager]: ${stickerOwner} placed ${stickerFile}`)
	}

	// Fetch Video Player URL
	if (line.includes('[Video Playback] Attempting to resolve URL ')) {
		videourl = line.split('URL \'')[1].split('\'')[0]
		videoUrlResolver(videourl)
	} else if (line.includes('[USharpVideo] Started video load for URL: ')) {
		videourl = line.split('[USharpVideo] Started video load for URL: ')[1].split(', requested by')[0]
		videoUrlResolver(videourl)
	} else if (line.includes('[USharpVideo] Started video: ')) {
		videourl = line.split('[USharpVideo] Started video: ')[1]
		videoUrlResolver(videourl)
	} else if (line.includes('[AVProHQ] loading URL: ')) {
		videourl = line.split('[AVProHQ] loading URL: ')[1]
		videoUrlResolver(videourl)
	} else if (line.includes('User ') && line.includes('added URL ')) {
		videourl = line.split('added URL ')[1]
		videoUrlResolver(videourl)
	}
}

oscEmitter.on('avatar', (avtrID) => {
	if (['avtr_305ddd5d-d1f9-4adb-a025-50c2f1a9d219',
		`avtr_5c866609-f49a-4867-ac74-5dab03d5d713`,
		`avtr_0c97e918-23d0-4934-b364-5fd28fb10236`,
		'avtr_6b25124e-e141-4df4-ad27-22766608e5dc'
	].includes(avtrID)) {
		oscSend('/avatar/parameters/log/player_count', playersInInstance.length > 80 ? 80 : playersInInstance.length)
		oscSend('/avatar/parameters/log/player_max', playerHardLimit > 80 ? 80 : playerHardLimit)
		oscSend('/avatar/parameters/log/player_ratio', parseFloat(playerRatio))
		oscSend('/avatar/parameters/log/instance_closed', worldID_Closed)
		applyGroupLogo(groupID)
	}
});

var movieShowNameLast = ''
function eventPopcornPalace(json) {
	let jsondata = JSON.parse(json)
	// {
	//     "videoName": "Lilo and Stitch - 2025-05-17",
	//     "videoPos": 0,
	//     "videoLength": 6453.958,
	//     "thumbnailUrl": "https://web.vr-m.net/api/media/thumbnail/24f5e268-c778-4d46-981b-01e598acd925.png",
	//     "displayName": "14anthony7095",
	//     "isPaused": false,
	//     "is3D": false,
	//     "looping": false
	// }
	let movieShowName = ''
	if (jsondata.videoName != '') {
		if (jsondata.videoName.includes('One Piece')) {
			movieShowName = jsondata.videoName.replace('- S1E', 'ep.').split(' -')[0]
		} else {
			movieShowName = jsondata.videoName
		}
		if (movieShowName != movieShowNameLast) {
			movieShowNameLast = movieShowName
			logEmitter.emit('moviename', movieShowName)
		}
	}
}

function applyGroupLogo(gID) {
	/*
0110 - VRDance
0101 - VRC Reach
0100 - The Lunar Howl
0011 - Nanachis of VRChat
0010 - Nanachi's hollow inn
0001 - Community Events
0000 - CORE Default
	*/
	switch (gID) {
		case 'grp_d960be54-cfc2-44cb-863d-6d624d8975c1':
			// VR Dance
			// 0110 - 6
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
			break;
		case `grp_fd1e2422-38b8-4230-9886-85378537681b`:
			// VRC Reach
			// 0101 - 5
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
			break;
		case 'grp_f018a0ac-2ec6-4176-aa47-a0fd2b7ea817':
			// The Lunar Howl
			// 0100 - 4
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
			break;
		case `grp_e483cc04-a610-471f-90eb-ec4eda8420be`:
			// Nanachis of VRChat
			// 0011 - 3
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
			break;
		case `grp_3473d54b-8e10-4752-9548-d77a092051a4`:
			// Nanachi's hollow inn
			// 0010 - 2
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
			break;
		case `grp_c24efb98-3234-4060-94f1-7729523e9689`:
			// Community Events
			// 0001 - 1
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
			break;
		default:
			// CORE Default
			// 0000 - 0
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
			break;
	}
}

function eventGameClose() {
	clearTimeout(worldHopTimeout)
	clearTimeout(worldHopTimeoutHour)
	console.log(`${loglv().hey}${selfLog} VRChat has Closed.`)
	// if (lastSetUserStatus.includes('Furality')) { lastSetUserStatus = ''; logEmitter.emit('setstatus', '') }
}

var vrcpropcount = { "cubes": 0, "wands": 0, "blasters": 0 }
fs.readFile('./datasets/propcounts.json', 'utf8', (err, data) => { vrcpropcount = JSON.parse(data) })
function eventCubePropSpawned() {
	vrcpropcount["cubes"]++
	fs.writeFile('./datasets/propcounts.json', JSON.stringify(vrcpropcount, null, 2), (err) => {
		if (err) { console.log(err); return }
	})
	console.log(`${loglv().log}${selfLog} Total cubes: ${vrcpropcount.cubes} / Total wands: ${vrcpropcount.wands} / Total blasters: ${vrcpropcount.blasters}`)
}
function eventWandPropSpawned() {
	vrcpropcount["wands"]++
	fs.writeFile('./datasets/propcounts.json', JSON.stringify(vrcpropcount, null, 2), (err) => {
		if (err) { console.log(err); return }
	})
	console.log(`${loglv().log}${selfLog} Total cubes: ${vrcpropcount.cubes} / Total wands: ${vrcpropcount.wands} / Total blasters: ${vrcpropcount.blasters}`)
}
function eventBlasterPropSpawned() {
	vrcpropcount["blasters"]++
	fs.writeFile('./datasets/propcounts.json', JSON.stringify(vrcpropcount, null, 2), (err) => {
		if (err) { console.log(err); return }
	})
	console.log(`${loglv().log}${selfLog} Total cubes: ${vrcpropcount.cubes} / Total wands: ${vrcpropcount.wands} / Total blasters: ${vrcpropcount.blasters}`)
}

var lastSetUserStatus = ''
function eventHeadingToWorld(logOutputLine) {
	clearTimeout(worldHopTimeout)
	clearTimeout(worldHopTimeoutHour)

	worldID = /wrld_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}/.exec(logOutputLine)[0]
	console.log(`${loglv().debug}${selfLog} World ID ${worldID}`)

	if (logOutputLine.includes(`~group(grp_`)) {
		groupID = /grp_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}/.exec(logOutputLine)[0]
		console.log(`${loglv().debug}${selfLog} Group ID ${groupID}`)
	} else { groupID = 'none' }

	// World Check -- 14aHome V5
	// if (worldID == `wrld_769c587a-46e8-47f3-b124-ac39c67e0de3`) { }

	// Group Check -- Furality
	/*
		if (groupID == 'grp_210dbc09-c3da-4ebb-b641-73c99ce2619b') {
			let statusPrep = `at Furality`
			switch (worldID) {
				case `wrld_7cd9bc43-94a7-476c-96d8-4dc75983e152`: statusPrep += `: Lobby`; break;
				case `wrld_0b5de5e7-d4d4-46c6-93c2-2354731d1cb2`: statusPrep += `: Meetup`; break;
				case `wrld_ed46f15c-f111-412a-ab23-462b1cb7b0c7`: statusPrep += `: Event Stage`; break;
				case `wrld_8974ee14-1c24-49f5-b2eb-9f52b0662d5a`: statusPrep += `: Club F.Y.N.N.`; break;
				case `wrld_90d58e58-9173-419e-8ff4-1df862507426`: statusPrep += `: Dealer's Den`; break;
				case `wrld_ab93c6a0-d158-4e07-88fe-f8f222018faa`: statusPrep += `: Gaming / Fishing`; break;
				case `wrld_be619393-04ac-48c9-bdfa-73f23e7b54e6`: statusPrep += `: Fireworks Show`; break;
				default: statusPrep += `: Gaming`; break;
			}
			lastSetUserStatus = statusPrep
			logEmitter.emit('setstatus', statusPrep)
		} else if (lastSetUserStatus.includes('Furality')) {
			lastSetUserStatus = ''
			logEmitter.emit('setstatus', '')
		}
	*/

}

function eventJoinWorld() {
	worldHopTimeout = setTimeout(() => {
		say.speak(`Been in world for too long. Proceed to next in queue`, 'Microsoft David Desktop', 1.0, (err) => {
			if (err) { return console.error(`${loglv().warn}${selfLog} say.js error: ` + err) }
		})
	}, 600_000)
	worldHopTimeoutHour = setTimeout(() => {
		say.speak(`Been in world for over an hour. Find a new world`, 'Microsoft David Desktop', 1.0, (err) => {
			if (err) { return console.error(`${loglv().warn}${selfLog} say.js error: ` + err) }
		})
	}, 3600_000)

	if (cooldownUrl == true) { cooldownUrl = false }

	playersInInstance = []
	playersInstanceObject = []

	logEmitter.emit('eventJoinWorld', worldID)
}

function eventInstanceClosed() {
	if (worldID != 'wrld_6c4492e6-a0f2-4fb0-a211-234c573ab7d5' && groupID != 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
		logEmitter.emit('setstatus', 'Instance is closed')
	} else if (groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
		logEmitter.emit('nextworld')
	}
	worldID_Closed = true
	oscSend('/avatar/parameters/log/instance_closed', 1 == 1)
}

function eventReceivedNotification(line) {
	let senderUserID = line.split(', sender user id:')[1].split(',')[0]
	let notifType = line.split(', type:')[1].split(',')[0]

	switch (notifType) {
		case 'invite':
			oscSend('/avatar/parameters/log/inviteNotif', true)
			break;
		case 'localNotifs':
			if (senderUserID == '8JoV9XEdpo') {
				if (line.includes(`This instance will be reset`)) {
					let remainingTime = line.split('will be reset in ')[1].split(' due')[0]
					logEmitter.emit('setstatus', `Instance Reset in ${remainingTime}`)
					worldID_Closed = true
					oscSend('/avatar/parameters/log/instance_closed', 1 == 1)
				}
			}
			break;
		default: break;
	}

	// Received Notification: <Notification from 
	// username:14anthony7095, 
	// sender user id:usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752 to usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752 of type: invite, 
	// id: not_f7a7c0af-84e9-4c2f-8e54-f0757ed3632b, 
	// created at: 06/17/2025 18:28:11 UTC, 
	// details: {{worldId=wrld_ab93c6a0-d158-4e07-88fe-f8f222018faa:68053~hidden(usr_498c8e8a-1e14-4ef1-8952-e9e9297167b3)~region(use), worldName=A Simple Fishing World}}, 
	// type:invite, 
	// m seen:False, 
	// message: "This is a generated invite to A Simple Fishing World">
}

var currentAccountInUse = { name: process.env["VRC_ACC_NAME_1"], id: process.env["VRC_ACC_ID_1"] }
function getCurrentAccountInUse() { return currentAccountInUse }; exports.getCurrentAccountInUse = getCurrentAccountInUse;
function eventPlayerInitialized(logOutputLine) {
	var playerDisplayName = logOutputLine.split('[Behaviour] Initialized player ')[1]

	if (playerDisplayName != undefined) {
		console.log(`${loglv().log}${selfLog} Player Joined: ` + playerDisplayName)
		logEmitter.emit('playerJoin', playerDisplayName)

		playersInInstance.push(playerDisplayName)
		playersInstanceObject.push({ 'name': playerDisplayName })

		playerRatio = playersInInstance.length / playerHardLimit
		oscSend('/avatar/parameters/log/player_count', playersInInstance.length > 80 ? 80 : playersInInstance.length)
		oscSend('/avatar/parameters/log/player_max', playerHardLimit > 80 ? 80 : playerHardLimit)
		oscSend('/avatar/parameters/log/player_ratio', parseFloat(playerRatio))
		console.log(`${loglv().log}${selfLog} There are now ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${playerRatio} ]`)

		switch (playerDisplayName) {
			case process.env["VRC_ACC_NAME_6"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selfLog} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_6"], id: process.env["VRC_ACC_ID_6"] }
				break;
			case process.env["VRC_ACC_NAME_4"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selfLog} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_4"], id: process.env["VRC_ACC_ID_4"] }
				break;
			case process.env["VRC_ACC_NAME_7"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selfLog} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_7"], id: process.env["VRC_ACC_ID_7"] }
				break;
			case process.env["VRC_ACC_NAME_3"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selfLog} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_3"], id: process.env["VRC_ACC_ID_3"] }
				break;
			case process.env["VRC_ACC_NAME_5"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selfLog} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_5"], id: process.env["VRC_ACC_ID_5"] }
				break;
			case process.env["VRC_ACC_NAME_2"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selfLog} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_2"], id: process.env["VRC_ACC_ID_2"] }
				break;
			case process.env["VRC_ACC_NAME_1"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selfLog} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_1"], id: process.env["VRC_ACC_ID_1"] }
				break;
			default:
				break;
		}
	}
}

function eventPlayerJoin(logOutputLine) {
	var playerDisplayName = logOutputLine.split('[Behaviour] OnPlayerJoined ')[1]

	if (playerDisplayName != undefined) {
		var playerID = /(?:\([0-z]{10}\))|(?:\(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\))/.exec(playerDisplayName)[0]

		playerDisplayName = playerDisplayName.replace(/ \(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\)/, '')

		// Append UserID to tracked player
		let pioIndex = playersInstanceObject.findIndex(playersInstanceObject => playersInstanceObject.name == playerDisplayName)
		try {
			playersInstanceObject[pioIndex].id = playerID.replace(/\(/, '').replace(/\)/, '')
		} catch (error) {
			console.log(`${loglv().hey}${selfLog} playerTracker Object got UserID before PlayerName - ${error}`)
			playersInstanceObject.push({ 'name': playerDisplayName, 'id': playerID.replace(/\(/, '').replace(/\)/, '') })
		}
	}
}

function eventPlayerLeft(logOutputLine) {
	var playerDisplayName = logOutputLine.split('[Behaviour] OnPlayerLeft ')[1]

	if (playerDisplayName != undefined || playerDisplayName != null) {
		// var playerID = /(?:\([0-z]{10}\))|(?:\(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\))/.exec(playerDisplayName)[0]

		playerDisplayName = playerDisplayName.replace(/ \(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\)/, '').replace(/ \([0-z]{10}\)/, '')
		console.log(`${loglv().log}${selfLog} Player Left: ` + playerDisplayName)
		//oscChatBox(`~${playerDisplayName} Left`)

		playersInInstance = playersInInstance.filter(name => name != playerDisplayName)
		playersInstanceObject = playersInstanceObject.filter(playersInstanceObject => playersInstanceObject.name !== playerDisplayName)
		playerRatio = playersInInstance.length / playerHardLimit
		oscSend('/avatar/parameters/log/player_count', playersInInstance.length > 80 ? 80 : playersInInstance.length)
		oscSend('/avatar/parameters/log/player_max', playerHardLimit > 80 ? 80 : playerHardLimit)
		oscSend('/avatar/parameters/log/player_ratio', parseFloat(playerRatio))
		console.log(`${loglv().log}${selfLog} There are now ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${playerRatio} ]`)
		// logEmitter.emit('playerLeft', playerDisplayName, playerID, playersInInstance)

		if (playerDisplayName == getCurrentAccountInUse().name) {
			clearTimeout(worldHopTimeout)
			cooldownUrl = true
			if (worldID_Closed == true) {
				logEmitter.emit('setstatus', '')
				worldID_Closed = false
			}
			oscSend('/avatar/parameters/log/instance_closed', false)
			let buildLog = `${loglv().log}${selfLog}`
			if (ttvFetchFrom == 1 && urlType == 'twitch') {
				buildLog += ` Resetting Twitch target channel`
				switchChannel(process.env["VRC_ACC_NAME_1"])
				if (lastVideoURL != '') { buildLog += ` &` }
			}
			if (lastVideoURL != '') {
				buildLog += ` Clearing Video-URL history`
				lastVideoURL = ''
				seenVideoURLs = []
			}
			console.log(buildLog)
		}
	}
}

function eventPlayerAvatarSwitch(logOutputLine) {
	let playerswitching = logOutputLine.split(`Switching `)[1].split(`to avatar `)[0].trim()
	let avatarswitchedto = logOutputLine.split(`to avatar `)[1].trim()

	console.log(`${loglv().log}${selfLog} [AvatarChange]: ${playerswitching} switching to (${avatarswitchedto})`)

}

function eventAssetDownload(logOutputLine) {
	var assetbundlelog = logOutputLine.split(`[AssetBundleDownloadManager] `)[1]
	// console.log(`${loglv().log}${selfLog} [AssetBundleDownloadManager]: ${assetbundlelog}`)

	if (assetbundlelog.includes('Unpacking Avatar')) {
		console.log(`${loglv().log}${selfLog} [AssetBundle]: ${assetbundlelog}`)
	}

	if (assetbundlelog.includes('Starting download of')) {
		let dlqueue = parseInt(logOutputLine.split(', ')[1].split(' ')[0].trim())
		if (dlqueue >= 1) {
			console.log(`${loglv().log}${selfLog} [AssetBundle]: Download Queue: ${dlqueue}`)
			// oscChatBox(`~Loading ${dlqueue} avatars`, dlqueue == 1 ? 5 : undefined)
		}
	}


	// if (assetbundlelog.includes('Average download speed')) {
	// 	var avyspeed = Math.floor(parseInt(logOutputLine.split(`: `)[1].split(' ')[0]) / 1000)
	// 	if (ChatDownSpeed == true) {
	// 		oscChatBox(`~Average avatar download speed ${avyspeed}KB/s`)
	// 	}
	// }
}

var cooldownUrl = false
function videoUrlResolver(videourl) {
	if (lastVideoURL === videourl) { console.log(`${loglv().log}${selfLog} Skipping url, already been displayed.`); return }
	if (seenVideoURLs.includes(videourl)) { console.log(`${loglv().log}${selfLog} Skipping url, is in seen list.`); return }
	if (videourl.includes('media.cdn.furality')) { console.log(`${loglv().log}${selfLog} Skipping url, Furality Content network.`); return }
	/*
	console.log(`${loglv().debug}${selfLog}\n	OLD= ${lastVideoURL}\n	NEW= ${videourl}`)
	console.log(`${loglv().debug}${selfLog} IS EQUAL? ${lastVideoURL === videourl}`)
	console.log(`${loglv().debug}${selfLog} Stringifiy ${JSON.stringify(videourl)}`)
	*/
	lastVideoURL = videourl
	seenVideoURLs.push(videourl)

	if (cooldownUrl == true) { console.log(`${loglv().log}${selfLog} Skipping url, forcing Ratelimit`); return }

	cooldownUrl = true
	setTimeout(() => { cooldownUrl = false }, 5000);

	//	--- Print Video URL ---
	console.log(`${loglv().log}${selfLog} Video URL: ${videourl}`)
	if (ChatVideoURL == true) { oscChatBox(`~VideoURL:\v${videourl}`, 5) }

	//	---	Twitch Channel URL Resolver	---
	if (videourl.includes('twitch.tv/') && !videourl.includes('twitch.tv/videos')) {
		//oscSend('/avatar/parameters/ttvEnabled', 1 )
		if (ttvFetchFrom == 1) { switchChannel(videourl.split('twitch.tv/')[1]) }
		if (urlType != 'twitch') {
			console.log(`${loglv().log}${selfLog} Video URL Type set to "Twitch"`)
			urlType = 'twitch'
		}
	}

	//	---	Hyperbeam URL Resolver	---
	if (videourl.includes('hyperbeam.com') && groupID == 'grp_ce0e2343-485b-45b9-97f5-241d169c7d6f') {
		if (ttvFetchFrom == 1) { switchChannel('sirlarr') }
		if (urlType != 'twitch') {
			console.log(`${loglv().log}${selfLog} Video URL Type set to "Twitch"`)
			urlType = 'twitch'
		}
	}

	//  --- Karaoke in Sync Resolver ---
	// https://static.174.3.12.49.clients.your-server.de/video/redir-search/Michael%20Jackson%20%26%20Naomi%20Campbell%20In%20the%20Closet%20Karaoke
	// if( videourl.includes('clients.your-server.de/video/redir-search/') ){
	// 	let songtitle = videourl.split('redir-search/')[1].replace(/\%20/g,' ').replace(/\%21/g,'!').replace(/\%23/g,'#').replace(/\%24/g,'$').replace(/\%26/g,'&').replace(/\%27/g,`'`).replace(/\%28/g,'(').replace(/\%29/g,')').replace(/\%2A/g,'*').replace(/\%2B/g,'+').replace(/\%2C/g,',').replace(/\%2F/g,'/').replace(/\%3A/g,':').replace(/\%3B/g,';').replace(/\%3D/g,'=').replace(/\%3F/g,'?').replace(/\%40/g,'@').replace(/\%5B/g,'[').replace(/\%5D/g,']')
	// 	setTimeout(()=>{
	// 		console.log(`${loglv().log}${selfLog} Song Title: ${songtitle}`)
	// 		if( ChatVideoTitle == true ){ oscChatBox( `~SongTitle:\v`+songtitle ) }
	// 	},2000)
	// }

	//	---	Youtube Title Resolver	---
	if (videourl.includes('youtube.com/')) {
		videourl = 'http://www.youtube.com/' + videourl.split('youtube.com/')[1].split(' ')[0]
	} else if (videourl.includes('youtu.be/')) {
		videourl = 'http://www.youtube.com/watch?v=' + videourl.split('youtu.be/')[1].split(' ')[0]
	}

	var isValidateYTurl = ytdl.validateURL(videourl)
	//console.log(`${loglv().debug}${selfLog} yt-dl is validate url? ${isValidateYTurl}`)

	if (isValidateYTurl == true) {
		//if( ttvAlwaysRun == false ){ oscSend('/avatar/parameters/ttvEnabled', 0 ) }

		if (urlType != 'youtube') {
			console.log(`${loglv().log}${selfLog} Video URL Type set to "Youtube"`)
			urlType = 'youtube'
			if (ttvFetchFrom == 1) { switchChannel(process.env["VRC_ACC_NAME_1"]) }
		}
		ytdl.getBasicInfo(videourl)
			.then((data) => {
				setTimeout(() => {
					console.log(`${loglv().log}${selfLog} Video Title: ${data.videoDetails.title}`)
					if (ChatVideoTitle == true) { oscChatBox(`~VideoTitle:\v` + data.videoDetails.title, 2) }
				}, 2000)
			})
			.catch((err) => {
				console.log(`${loglv().warn}${selfLog} Youtube-dl: ${err}`)
				if (ChatVideoURL == true) { oscChatBox(`~${err}`, 2) }
			})
	}

	// if (videourl.includes('vr-m.net/')) {
	// 	fetch(videourl).then(res => {
	// 		var movname = res.url.split('/').pop().replace(/0?x0x0/g, ' ').replace(/\.m3u8/, '').replace(/PieceEpisode/, 'Piece Episode').trim()

	// 		if (movname == "64FPIlc2.mp4") { movname = "Movie Load Failed for internal reasons" }
	// 		logEmitter.emit('moviename', movname.replace(/(\d{4}$)/, "($1)"))

	// 		setTimeout(() => {
	// 			console.log(`${loglv().log}${selfLog} Movie Title: ${movname}`)
	// 			console.log(`${loglv().debug}${selfLog} Movie URL: ${res.url}`)

	// 			if (ChatVideoTitle == true) { oscChatBox(`~Movie Title:\v` + movname.replace(/(\d{4}$)/, "($1)"), 5) }
	// 		}, 2000)
	// 	})
	// }


	//videourl = ``
}


function worldDownloadProgress(dlduration, dlprogress) {
	var dlETAtotal = Math.floor(partWhole(part = dlduration, percent = dlprogress));
	var dlETA = dlETAtotal - dlduration;

	if (dlETAtotal >= 60) {
		min = Math.floor(dlETAtotal / 60);
		sec = Math.floor(dlETAtotal - (min * 60));
		dlETAtotal = min + 'm' + sec + 's';
	} else {
		dlETAtotal = dlETAtotal + 'sec';
	}

	if (dlETA >= 60) {
		min = Math.floor(dlETA / 60);
		sec = Math.floor(dlETA - (min * 60));
		dlETA = min + ' min ' + sec + ' seconds';
	} else {
		dlETA = dlETA + ' seconds';
	}
	console.log(`${loglv().log}${selfLog} World Download ETA ${dlETA}`);
	say.speak(`E T A ${dlETA}`, 'Microsoft Zira Desktop', 1.0, (err) => {
		if (err) { return console.error(`${loglv().warn}${selfLog} say.js error: ` + err) }
		setTimeout(() => {
			isTalking = false
		}, 1000)
	})
}