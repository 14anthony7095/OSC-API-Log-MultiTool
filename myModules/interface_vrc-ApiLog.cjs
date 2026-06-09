/*
-------------------------------------

	VRChat Log Reader

-------------------------------------
*/
// Libraries
var { loglv, printAllLogs, ChatVideoURL, ChatVideoTitle, ttvAlwaysRun, ttvFetchFrom, ChatImageStringURL, ChatDownSpeed, logStickers, downloadStickers } = require('./config.js')
var { oscSend, OSCDataBurst, oscEmitter, oscChatBoxV2, getOSCDataBurstState } = require('./Interface_osc_v1.js')
var { switchChannel, joinChannel, leaveChannel } = require('./Interface_twitch.js');
var fs = require('fs')
const fsp = require('fs').promises
var ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const say = require('say');
const { EventEmitter, once } = require('events');
const apiEmitter = new EventEmitter
exports.apiEmitter = apiEmitter;
const logEmitter = new EventEmitter
exports.logEmitter = logEmitter;
const { cmdEmitter } = require('./input.js');
const { PiShock, PiShockAll } = require('./Interface_PS.js');
const { config } = require('process');
require('dotenv').config({ 'quiet': true })
const { undiscoveredEvent, groupMemberJoinAdded, groupMemberJoin, groupMemberLeave, groupMemberRemove, groupMemberUserUpdate, groupMemberRoleAssign, groupMemberRoleUnassign, groupPostCreate, groupPostUpdate, groupPostDelete, groupRoleCreate, groupRoleDelete, groupRequestCreate, groupRequestReject, groupInstanceCreate, groupInstanceClose, groupInstanceWarn, groupInstanceKick, groupInviteCreate, groupInviteCancel, groupUserBan, groupUserUnban, groupUpdate } = require('./interace_WebHook.js')
const { VRChat } = require("vrchat");
const { KeyvFile } = require("keyv-file");
const { WebSocket } = require("ws");
const { table } = require('table');
const { default: open } = require('open');
// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('datasets/vrchat-X-discord.db');

// Global Scope
let selflogL = `\x1b[0m[\x1b[32mVRC_Log\x1b[0m]`
let selflogA = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
let selflogWS = `\x1b[0m[\x1b[33mVRC_WebSocket\x1b[0m]`
var path = 'C:/Users/14anthony7095/AppData/LocalLow/VRChat/VRChat/'
var verboseAvatarStatLogging = true
var tarFile = 'nothing'
var tarFileSize = 0
var tarFilePath = 'nothing'
var playersInInstance = []
var membersInInstance = []
var playersInstanceObject = []
var playerHardLimit = 99
var playerRatio = 0.5
var memberRatio = 0.5
var G_autoNextWorldHop = false
var worldHoppers = []
var vrchatDiscord; fs.readFile('datasets/vrc-X-dis.json', 'utf8', (err, data) => { vrchatDiscord = JSON.parse(data) })
var lastFetchGroupLogs;
var currentUser;
var userAutoAcceptWhiteList = []
var worldQueueTxt = './datasets/worldQueue.txt'
var explorePrivacyLevel = 0
var authToken = null
var isApiErrorSkip = false
var socket_VRC_API
var cacheWS = {}
var lastVideoURL = ``
var seenVideoURLs = [] // For current instance only
var worldHopTimeout;
var worldHopTimeoutHour;
var tonRoundType = ''
var tonAvgStartWait = []
var tonRoundReadyTime = 0
var InstanceHistory = [
	{
		'location': 'offline',
		'join_timestamp': 0,
		"leave_timestamp": 0,
		'timeSpent': 0,
		'worldID': '',
		'ownerID': '',
		'groupID': '',
		'instanceType': ''
	},
	{
		'location': 'offline',
		'join_timestamp': 0,
		"leave_timestamp": 0,
		'timeSpent': 0,
		'worldID': '',
		'ownerID': '',
		'groupID': '',
		'instanceType': ''
	}
]
var G_InstanceClosed = false
var G_groupMembersVisible = false
var G_instanceJoinQueue = []
var vrcUserStatusText = ''
var vrcUserHasVRCplus = false
var cooldownPortalVanish = false
var vrchatRunning = false
var vrchatFoundThisSession = false
var loadingAvatarTimer;
var watcher;
var lastChecked = 0
var previousLength = 0
var currentLength = 0
var cooldownLogRead = false
var urlType = 'none'
var logCooldown = 0.001 // secs

// Restore saved into Scope
fs.readFile('./lastFetchGroupLogs.txt', 'utf8', (err, data) => {
	if (err) { console.log(err); return }
	console.log(`${loglv.debug}${selflogA} set last log fetch to ${data}`)
	if (!data.includes(`Z`)) {
		lastFetchGroupLogs = new Date().toISOString()
	} else {
		lastFetchGroupLogs = data
	}
	setTimeout(() => {
		main()
	}, 1000)
})
fs.readFile('./datasets/autoAcceptWhitelist.txt', 'utf8', (err, data) => {
	if (err) { console.log(err); return }
	userAutoAcceptWhiteList = data.split('\r\n')
})

//	--	On Load	--
console.log(`${loglv.info}${selflogL} Loaded -> ${loglv.bool(printAllLogs)}printAllLogs${loglv.reset} , ${loglv.bool(ChatVideoURL)}ChatVideoURL${loglv.reset} , ${loglv.bool(ChatVideoTitle)}ChatVideoTitle${loglv.reset}`)

var vrchat = new VRChat({
	// baseUrl: "https://api.vrchat.cloud/api/1",
	// meta: {},
	application: {
		name: "OSC_Multi-Interface",
		version: "2.5",
		contact: process.env["CONTACT_EMAIL"]
	},
	authentication: {
		credentials: {
			username: process.env["VRC_ACC_LOGIN_1"],
			password: process.env["VRC_ACC_PASSWORD_1"],
			totpSecret: process.env["VRC_ACC_TOTPSECRET_1"]
		}
	},
	keyv: new KeyvFile({ filename: "./datasets/vrcA.json" })
	/* 
		1   95
		2   96
		3   97
		4   98 / 69
		5   Wonder
		6   WatchDog
		7   Absent
	*/
});

const { ratelimitHandler } = require("./ratelimitHandler.cjs");
const limiter = new ratelimitHandler();

cmdEmitter.on('cmd', (cmd, args, raw) => {
	if (cmd == 'help') {
		console.log(`
-   api requestall
-   years [open/close]
-   hypetrain
-   forceaudit
-   preload [wrld_UUID...]
-   addworlds [<string>]
-   explore
        > prefill
        > autonext [True/False]
-   hoppers
-   log
        > vidurl [True/False]
        > vidtitle [True/False]
        > printall [True/False]
        > queue [True/False]
        > speed [True/False]
-   twitch
        > alwaysrun [True/False]
        > join [channel:<string>]
        > leave [channel:<string>]
        > switch [channel:<string>]
        > from [0-3]`)
	}
	if (cmd == 'api' && args[0] == 'requestall') { requestAllOnlineFriends(currentUser) }
	if (cmd == 'years' && args[0] == 'close') { switchYearGroupsClosed() }
	if (cmd == 'hypetrain') { hypeTrainLocater() }
	if (cmd == 'years' && args[0] == 'open') { switchYearGroupsReOpen() }
	if (cmd == 'forceaudit') { scanGroupAuditLogs() }
	if (cmd == 'findjoinable') {
		findJoinableInstances().then(d => { G_instanceJoinQueue = d })
	}

	if (cmd == 'preload') { worldAutoPreloadQueue(args[0].split(',')) }
	if (cmd == 'addworlds') { addSearchToLocalQueue(raw.slice(10)) }
	if (cmd == 'explore' && args[0] == 'prefill') { addLabWorldsToLocalQueue() }
	if (cmd == 'explore' && args[0] == 'autonext') { G_autoNextWorldHop = JSON.parse(args[1]) }

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

	if (cmd == 'hoppers') {
		var string = ''
		worldHoppers.sort((a, b) => { return b.playtime - a.playtime }).forEach((a) => {
			var discordInfo = vrchatDiscord.filter(e => e.vrcUUID == a.id)
			if (discordInfo.length != 0) {
				string += `${string.length == 0 ? '' : '\n'}\`${new Date(a.playtime).toISOString().substring(11, 19)}\` ${a.groupMember == true ? `💜` : `👻`} ${a.name} <@${discordInfo[0].discordid}> - [${discordInfo[0].discordid}]`
			} else {
				string += `${string.length == 0 ? '' : '\n'}\`${new Date(a.playtime).toISOString().substring(11, 19)}\` ${a.groupMember == true ? `💜` : `👻`} ${a.name} [profile](<https://vrchat.com/home/user/${a.id}>)`
			}
		})
		console.log(string)
	}
	if (cmd == 'clearhoppers') {
		worldHoppers = []
	}
})

async function main() {
	console.log(`${loglv.debug}${selflogA} Started main function`)

	currentUser = await limiter.req(vrchat.getCurrentUser({ throwOnError: true }))
	console.log(`${loglv.info}${selflogA} Logged in as: ${currentUser.data.displayName}`);
	const { data: auth } = await limiter.req(vrchat.verifyAuthToken())
	if (auth.ok == true) {
		authToken = auth.token
		socket_VRC_API_Connect()
	}

	vrcUserStatusText = currentUser.data.statusDescription
	console.log(`${loglv.info}${selflogA} User status: ${vrcUserStatusText}`)

	vrcUserHasVRCplus = currentUser.data.badges.find(b => b.badgeName == "Supporter") == undefined ? false : true
	console.log(`${loglv.info}${selflogA} User has VRC+ ${vrcUserHasVRCplus}`)
}

async function manualCall(vrcapiEndpoint, methodType = 'GET', bodyJson) {
	return new Promise(async (resolve, reject) => {
		const vrcapihttp = `https://api.vrchat.cloud/api/1/`

		var apiRequest = {
			method: methodType,
			headers: { 'User-Agent': `${process.env['VRC_USER_AGENT']} (${process.env['CONTACT_EMAIL']})`, 'Cookie': 'auth=' + authToken },
		}
		if (bodyJson != undefined) {
			apiRequest['body'] = JSON.stringify(bodyJson)
			apiRequest['headers']['Content-Type'] = 'application/json'
		}

		var request = await fetch(vrcapihttp + '' + vrcapiEndpoint, apiRequest)
		// console.log(request)
		var jsonResponse = await request.json()
		if (jsonResponse.error) {
			reject(jsonResponse.error)
		} else {
			resolve(jsonResponse)
		}
	})
}


async function updateCurrentUserInfo(isFirstLaunch = false) {
	try {
		currentUser = await limiter.req(vrchat.getCurrentUser({ throwOnError: true }))

		if (currentUser.data.presence.world != 'offline') {
			var instanceType = 'public'
			var groupID = ''
			var ownerID = ''

			if (currentUser.data.presence.instance.includes(`~group(grp_`)) {
				groupID = /grp_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}/.exec(currentUser.data.presence.instance)[0]
				console.log(`${loglv.info}${selflogL} Group ID ${groupID}`)
			}
			if (currentUser.data.presence.instance.includes(`~groupAccessType(plus)`)) {
				instanceType = `groupPlus`
			} else if (currentUser.data.presence.instance.includes(`~groupAccessType(public)`)) {
				instanceType = `groupPublic`
			} else if (currentUser.data.presence.instance.includes(`~groupAccessType(members)`)) {
				instanceType = `group`
			} else if (currentUser.data.presence.instance.includes(`~canRequestInvite`)) {
				ownerID = currentUser.data.presence.instance.split(`~private(`)[1].slice(0, 40)
				instanceType = `invitePlus`
			} else if (currentUser.data.presence.instance.includes(`~private(`)) {
				ownerID = currentUser.data.presence.instance.split(`~private(`)[1].slice(0, 40)
				instanceType = `invite`
			} else if (currentUser.data.presence.instance.includes(`~friends(`)) {
				ownerID = currentUser.data.presence.instance.split(`~friends(`)[1].slice(0, 40)
				instanceType = `friends`
			} else if (currentUser.data.presence.instance.includes(`~hidden(`)) {
				ownerID = currentUser.data.presence.instance.split(`~hidden(`)[1].slice(0, 40)
				instanceType = `friendsPlus`
			}
			InstanceHistory[0] = {
				'groupID': groupID,
				'instanceType': instanceType,
				'ownerID': ownerID,
				'join_timestamp': Date.now(),
				'leave_timestamp': 0,
				'location': currentUser.data.presence.world + ':' + currentUser.data.presence.instance,
				'worldID': currentUser.data.presence.world,
				'timeSpent': 0
			}
			console.log(`${loglv.info}${selflogA} Adding User Presence instance to history: `, InstanceHistory[0])

			if (vrchatRunning == false) {
				vrchatRunning = true
				if (vrchatFoundThisSession == false) {
					vrchatFoundThisSession = true
				}
			}

		}

	} catch (error) {
		console.log(`${loglv.warn}${selflogA} API is down.. Cry`)
		isApiErrorSkip = true
	}
}

function socket_VRC_API_Connect() {
	if (authToken == null) { console.log('No AuthToken stored'); return }
	socket_VRC_API = new WebSocket(`wss://pipeline.vrchat.cloud/?authToken=` + authToken, { headers: { "cookie": `auth=${authToken}`, "user-agent": `${process.env['VRC_USER_AGENT']} (${process.env['CONTACT_EMAIL']})` } })
	socket_VRC_API.on('error', (data) => {
		console.log(`${loglv.warn}${selflogWS}`)
		console.log(data)
	})
	socket_VRC_API.on('close', (code, reason) => {
		console.log(`${loglv.warn}${selflogWS} ${code} ${Buffer.from(reason, 'utf8')}`)
		setTimeout(() => {
			socket_VRC_API_Connect()
		}, 120_000)
	})

	socket_VRC_API.on('message', async (data) => {
		var line = Buffer.from(data, 'utf8')

		var wsContent
		try { wsContent = JSON.parse(JSON.parse(line).content) }
		catch (error) { wsContent = JSON.parse(line).content }

		switch (JSON.parse(line).type) {
			case 'notification':
				if (wsContent.type == 'requestInvite') {
					console.log(`${loglv.info}${selflogWS} [InviteRequest] ${wsContent.senderUsername} has Requested an Invite.${userAutoAcceptWhiteList.includes(wsContent.senderUsername) == true ? ' (✅ Whitelisted )' : ''}`);

					if (userAutoAcceptWhiteList.includes(wsContent.senderUsername)) {
						// Requester is Whitelisted
						if (InstanceHistory[0].location == 'offline' && InstanceHistory[1].location == 'offline') {
							let res = await limiter.req(vrchat.getCurrentUser())
							if (res.data.presence.world != 'offline') {
								let resIU = await limiter.req(vrchat.inviteUser({ 'path': { 'userId': wsContent.senderUserId }, 'body': { 'instanceId': res.data.presence.world + ":" + res.data.presence.instance, 'messageSlot': 0 } }))
								resIU.data == undefined ? console.log(resIU.error) : console.log(resIU.data)
							} else {
								await limiter.req(vrchat.respondInvite({ 'body': { 'responseSlot': 0 }, 'path': { 'notificationId': wsContent.id } }))
							}
						} else {
							let resIU = await limiter.req(vrchat.inviteUser({ 'path': { 'userId': wsContent.senderUserId }, 'body': { 'instanceId': InstanceHistory[0].location, 'messageSlot': 0 } }))
							resIU.data == undefined ? console.log(resIU.error) : console.log(resIU.data)
						}
					}
				} else {
					console.log(`${loglv.info}${selflogWS} [InviteRequest]`);
					console.log(wsContent);

					console.log(`${loglv.debug}${selflogA} Checking if Invite location is an Unlisted world.`)
					isWorldUnlisted(wsContent.details.worldId, 'Invited')

				}
				break;

			// case 'response-notification': break;
			// case 'see-notification': break;
			// case 'hide-notification': break;
			// case 'clear-notification': break;
			case 'notification-v2':
				if (wsContent.type == 'group.invite') {
					console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${wsContent.message} - ${wsContent.link.slice(6)}`)

					// Auto Block if not long enough
					if (wsContent.link.slice(6) == InstanceHistory[0].groupID && Date.now() < (InstanceHistory[0].join_timestamp + 120_000)) {

						if (currentAccountInUse['Agroup'] == true) {
							oscChatBoxV2(`Group performed an undesirable action.\vTaking countermeasures`, 10_000, true, true, false, false)
						}

						// Block Group Owner
						var resG = await limiter.reqCached('group', wsContent.link.slice(6)).catch(async () => {
							return await limiter.req(vrchat.getGroup({ 'path': { 'groupId': wsContent.link.slice(6) } }), 'group')
						})
						if (resG.data != undefined) {
							var resMu1 = await limiter.req(vrchat.moderateUser({ 'body': { 'type': 'block', 'moderated': resG.data.ownerId } }))
							console.log(`You've blocked Group Owner: ${resMu1.data.targetDisplayName}`)
						} else { console.log(resG) }

						// Block Inviter
						var resS = await limiter.req(vrchat.searchUsers({ 'query': { 'search': wsContent.data.managerUserDisplayName } }))
						if (resS.data != undefined && resS.data.length >= 1) {
							// var resMu2 = await limiter.req(vrchat.moderateUser({'body':{'type':'block','moderated':resS.data[0].id}}))

							// Skip auto-block incase search miss-lands
							console.log(`User that invited you`, resS.data[0].displayName, resS.data[0].id)
							open(`vrcx://user/${resS.data[0].id}`)
						}

						// Block Group
						var resBG = await limiter.req(vrchat.blockGroup({ 'path': { 'groupId': wsContent.link.slice(6) } }))
						if (resBG.data != undefined) {
							console.log(resBG.data.success.message)
						} else {
							console.log(resBG)
						}
					}

				} else if (wsContent.type == 'boop') {
					console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${wsContent.message} ${JSON.stringify(wsContent.details)}`)

				} else {
					console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}]`); console.log(wsContent);
				}
				break;

			// case 'notification-v2-update': break;
			// case 'notification-v2-delete': break;
			// case 'content-refresh': break;
			// case 'modified-image-update': break;
			// case 'instance-queue-joined': break;
			// case 'instance-queue-ready': break;
			// case 'group-joined': break;
			// case 'group-left': break;
			// case 'group-member-updated': break;
			// case 'group-role-updated': break;
			// case 'friend-add': break;
			// case 'friend-delete': break;
			case 'friend-online':
				console.log(`${loglv.info}${selflogWS} [GPS] ${wsContent.user.displayName} - Now Online`);
				// console.log(wsContent)

				if (wsContent.location != 'private' || wsContent.travelingToLocation != 'private' || wsContent.travelingToLocation != 'private') {
					var notif_user_location = wsContent.location.includes('wrld_') ? wsContent.location.split(':')[0] : wsContent.travelingToLocation.includes('wrld_') ? wsContent.travelingToLocation.split(':')[0] : wsContent.worldId.includes('wrld_') ? wsContent.worldId : 'private'
					if (notif_user_location != 'private') {
						console.log(`${loglv.debug}${selflogA} Checking if Friend location is an Unlisted world.`)
						isWorldUnlisted(notif_user_location, wsContent.user.displayName)
					}
				}

				break;

			case 'friend-offline':
				let notif_user_displayName = 'unknown'
				if ((cacheWS[wsContent.userId] || "").displayName) {
					notif_user_displayName = cacheWS[wsContent.userId].displayName
					console.log(`${loglv.info}${selflogWS} [GPS] ${notif_user_displayName} - Offline`);
				} else {
					notif_user_displayName = await limiter.reqCached('user', wsContent.userId).catch(async () => {
						return await limiter.req(vrchat.getUser({ 'path': { 'userId': wsContent.userId } }), 'user')
					})
					console.log(`${loglv.info}${selflogWS} [GPS] ${(notif_user_displayName.data || "").displayName} - Offline`);
				}
				break;

			case 'friend-active':
				console.log(`${loglv.info}${selflogWS} [GPS] ${wsContent.user.displayName} - Active on Web`);
				break;

			case 'friend-update':
				break;
				let notif_user_changes = ''
				let notif_user_status = ''
				if (wsContent.user.status == 'join me') { notif_user_status = '🔵' }
				if (wsContent.user.status == 'active') { notif_user_status = '🟢' }
				if (wsContent.user.status == 'ask me') { notif_user_status = '🟠' }
				if (wsContent.user.status == 'busy') { notif_user_status = '🔴' }

				if (cacheWS[wsContent.userId]) {
					Object.keys(cacheWS[wsContent.userId]).forEach(async key => {
						if (cacheWS[wsContent.userId][key] != wsContent.user[key]) {

							if (key == 'status') {
								let notif_user_status_old = ''
								if (cacheWS[wsContent.userId].status == 'join me') { notif_user_status_old = '🔵' }
								if (cacheWS[wsContent.userId].status == 'active') { notif_user_status_old = '🟢' }
								if (cacheWS[wsContent.userId].status == 'ask me') { notif_user_status_old = '🟠' }
								if (cacheWS[wsContent.userId].status == 'busy') { notif_user_status_old = '🔴' }

								notif_user_changes += `\n${loglv.info}    ${key}: ${notif_user_status_old} -> ${notif_user_status}`
							} else {
								let notif_user_status_old = ''
								if (cacheWS[wsContent.userId].status == 'join me') { notif_user_status_old = '🔵' }
								if (cacheWS[wsContent.userId].status == 'active') { notif_user_status_old = '🟢' }
								if (cacheWS[wsContent.userId].status == 'ask me') { notif_user_status_old = '🟠' }
								if (cacheWS[wsContent.userId].status == 'busy') { notif_user_status_old = '🔴' }

								notif_user_changes += `\n${loglv.info}    ${key}: "${cacheWS[wsContent.userId][key]}" -> "${wsContent.user[key]}"`
							}
						}
					})
					console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${wsContent.user.displayName} ${notif_user_status} ${notif_user_changes != '' ? notif_user_changes : ''}`);
				} else {
					console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${wsContent.user.displayName} ${notif_user_status} ${wsContent.user.statusDescription}`);
				}

				cacheWS[wsContent.userId] = {
					"ageVerificationStatus": wsContent.user.ageVerificationStatus,
					"ageVerified": wsContent.user.ageVerified,
					"allowAvatarCopying": wsContent.user.allowAvatarCopying,
					"bio": wsContent.user.bio,
					"displayName": wsContent.user.displayName,
					"last_platform": wsContent.user.last_platform,
					"platform": wsContent.user.platform,
					"pronouns": wsContent.user.pronouns,
					"state": wsContent.user.state,
					"status": wsContent.user.status,
					"statusDescription": wsContent.user.statusDescription,
					"userIcon": wsContent.user.userIcon
				}
			// break;

			case 'friend-location':
				// break;
				var notif_user_location = wsContent.location != '' ? wsContent.location : wsContent.travelingTolocation != '' ? wsContent.travelingTolocation : 'private'
				if (notif_user_location != 'private' && notif_user_location != 'traveling') {
					isWorldUnlisted(notif_user_location.split(':')[0], wsContent.user.displayName)
				}
				// console.log(`${loglv.info}${selflogWS} [GPS] ${wsContent.user.displayName} - ${notif_user_location}`);
				break;

			case 'user-update': break;
			case 'user-location': break;
			case 'user-badge-assigned':
				console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${wsContent.badge.badgeName}`);
				break;
			case 'user-badge-unassigned':
				console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${JSON.stringify(wsContent)}`);
				break;

			default:
				console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}]`);
				console.log(wsContent);
				break;
		}
	});
}


async function isWorldUnlisted(I_worldID = '', I_userDisplayName = '') {
	var gotWorld = await limiter.req(vrchat.getWorld({ 'path': { 'worldId': I_worldID } }), 'world', I_worldID)
	if (gotWorld.data != undefined && gotWorld.data?.releaseStatus == 'private') {
		var fileHandler;
		try {
			fileHandler = await fsp.open('./datasets/private-worlds.txt')
			var fileRead = await fileHandler.readFile('utf8')
			if (!fileRead.includes(gotWorld.data.id)) {
				console.log(`${loglv.hey}${selflogA} Saving Unlisted world.\nSource: ${I_userDisplayName}\n${gotWorld.data.id} ${gotWorld.data.name} by ${gotWorld.data.authorName}`)
				// console.log(`${loglv.debug}${selflogA} World not saved, Saving..`)
				var appendText = `\r\n${gotWorld.data.name}|${gotWorld.data.authorName}|${gotWorld.data.id}|${gotWorld.data.authorId}`
				fs.appendFile('./datasets/private-worlds.txt', appendText, (err) => { if (err) { console.error(err) } })
				// open(`vrcx://world/${gotWorld.data.id}`)
			} else {
				// console.log(`${loglv.debug}${selflogA} World already saved.`)
			}
		} catch (error) {
			console.log(`${loglv.warn}${selflogL}`, error)
		} finally { if (fileHandler) { await fileHandler.close() } }
	}
}

function sleep(time) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(true)
		}, time)
	})
}
function formatBytes(bytes, decimals = 1) {
	return new Promise((resolve, reject) => {
		if (bytes === 0) { resolve('0 Bytes') };
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		resolve(parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i])
	})
}
function mathSumValues(values_Arr) {
	var sum = 0
	for (const i in values_Arr) {
		sum += values_Arr[i]
	}
	return sum
}



const readline = require('readline')
function startWatching() {
	console.log(`${loglv.info}${selflogL} Started Watcher`)
	if (tarFilePath.includes('undefined')) {
		setTimeout(() => { updateWatcher() }, 5000)
		return
	} else {
		watcher = fs.watch(tarFilePath, 'utf8', (eventType, filename) => {
			//console.log( `${loglv.debug}${selflog}`, eventType, filename)
			if (eventType == 'change' && filename == tarFile) {
				// readLogFile()

				const newSize = fs.statSync(tarFilePath).size
				if (newSize > tarFileSize) {
					const stream = fs.createReadStream(tarFilePath, { 'start': tarFileSize, 'end': newSize })
					const rl = readline.createInterface({ 'input': stream })
					rl.on('line', (line) => { processLogLine(line) })
					tarFileSize = newSize
				}

			}
			if (eventType == 'rename' && filename.includes('output_log_')) {
				console.log(`${loglv.hey}${selflogL} A newer log file might of just been created`)
				// if (vrchatRunning == false) { updateCurrentUserInfo() }
				updateWatcher()
			}
		})
	}
}
function updateWatcher() {
	console.log(`${loglv.info}${selflogL} Updating Watcher`)
	watcher?.close()
	fetchLogFile()
}
function fetchLogFile() {
	console.log(`${loglv.info}${selflogL} Finding latest log file`)
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
		try {
			tarFileSize = fs.statSync(tarFilePath).size || 0
			console.log(`${loglv.info}${selflogL} Found newest log file: ${files[files.length - 1]}`)
			if (vrchatRunning == false /* && vrchatFoundThisSession == true */) { updateCurrentUserInfo() }

		} catch (err) {
			console.log(`${loglv.error}${selflogL} tarFileSize Failed: ${err}`)
		} finally {
			startWatching()
		}
	})
}
exports.fetchLogFile = fetchLogFile;
fetchLogFile()



oscSend('/avatar/parameters/log/instance_closed', false)

function getVrchatRunning() { return vrchatRunning }
exports.getVrchatRunning = getVrchatRunning;

function average(array) {
	if (array.length == 0) { return 0 }
	return Math.floor(array.reduce((a, b) => a + b) / array.length)
}

const videoPlayerURLmasks = [
	/\[Video Playback\] .+\x27([^\x27]+)\x27/,
	/\[USharpVideo\] Started video: (.+)/,
	/\[USharpVideo\] Started video (.+?),/,
	/\[AVProHQ\] loading URL: (.+)/,
	/User .+ added URL (.+)/
]
function processLogLine(line) {

	if (vrchatRunning == false) {
		vrchatRunning = true
		if (vrchatFoundThisSession == false) {
			vrchatFoundThisSession = true
		}
	}

	logEmitter.emit('log', line)
	// log without TimeStamp and LogLevel
	// no expanded details
	const lineC = line.slice(34)

	if (line.includes('[Behaviour] Destination set: wrld_')) { eventHeadingToWorld(line) }
	if (line.includes('[Behaviour] Joining wrld_')) { eventJoiningWorld() }
	if (line.includes('Instance closed: ')) { eventInstanceClosed() }
	if (line.includes(`Shocked: `) && line.includes(process.env["VRC_ACC_NAME_1"])) { PiShockAll(30, 1) }
	if (line.includes('[Behaviour] Hard max is ')) {
		playerHardLimit = parseInt(line.slice(58))
		oscSend('/avatar/parameters/log/player_max', playerHardLimit > 80 ? 80 : playerHardLimit)
	}
	if (line.includes('[Behaviour] Initialized player')) { eventPlayerInitialized(line) }
	if (line.includes('[Behaviour] OnPlayerJoined')) { eventPlayerJoin(line) }
	if (line.includes('[Behaviour] OnPlayerLeft')) { eventPlayerLeft(line) }

	if (line.includes('[Behaviour] Switching ') && line.includes(' to avatar ')) { eventPlayerAvatarSwitch(line) }

	if (line.includes(`Received Notification: <`)) { eventReceivedNotification(line) }

	if (line.includes(`VRCApplication: HandleApplicationQuit`)) { eventGameClose() }

	if (line.includes(`[VRCItems] Item prop_`)) { eventPropSpawned(line.split('prop_')[1].split(' ')[0]) }

	if (line.includes(`[VRCX] VideoPlay(PopcornPalace) `)) { eventPopcornPalace(line.slice(66)) }

	// [Behaviour] Could not enter room because: If the instance exists‚ you're not allowed to access it․ (You are not allowed to travel to that location. If the instance exists‚ you're not allowed to access it․ (Code: 403))
	if (line.includes(`[Behaviour] Could not enter room because: ` && line.includes('You are not allowed to travel to that location'))) {
		logEmitter.emit('notAllowedToTravel')
	}

	// Terrors of Nowhere
	// [2026.05.17 02:18:04 Debug      -  ] 
	if (InstanceHistory[0].worldID == 'wrld_a61cdabe-1218-4287-9ffc-2a4d1414e5bd') {
		// if (line.includes(`[DEATH][14anthony7095]`)) { PiShockAll(30, 1) }
		if (line.includes(`Round type is`)) {
			tonRoundType = line.split('Round type is ')[1]
			console.log(`${loglv.info}${selflogL} [TON] Round type is ${tonRoundType}`)
		}
		if (line.includes(`Sus player =`)) {
			tonSusPlayer = line.split('Sus player = ')[1]
			say.speak('Impostor is ' + tonSusPlayer, 'Microsoft Zira Desktop', 1.0)
			console.log(`${loglv.info}${selflogL} [TON] Impostor is ${tonSusPlayer}`)
		}
		if (lineC == `Verified Round End`) {
			tonRoundReadyTime = Date.now()
			let avgStartDisplay = new Date(average(tonAvgStartWait)).toISOString()
			let avgRoundsPerHour = Math.floor(3600000 / (192000 + average(tonAvgStartWait)))
			console.log(`${loglv.info}${selflogL} [TON] Intermission.. Ready to start next round. ${tonAvgStartWait.length > 1 ? `Avg. wait time: ${avgStartDisplay.substring(11, 19)} | Rounds Per Hour: ${avgRoundsPerHour}` : ''}`)

			if (currentAccountInUse['Agroup'] == true) {
				tonAvgStartWait.length > 1 ? oscChatBoxV2(`~Round ready to start\vAvg. wait time: ${avgStartDisplay.substring(11, 19)}\vRounds Per Hour: ${avgRoundsPerHour}`, 5000, false, true) : oscChatBoxV2(`~Round ready to start`, 5000, false, true)
			}
		}
		if (lineC.includes(`Everything recieved, looks good`)) {
			console.log(`${loglv.info}${selflogL} [TON] Round Starting.`)
			if (tonRoundReadyTime != 0) {
				tonAvgStartWait.push(Date.now() - (tonRoundReadyTime + 12000))
			}
		}
		if (lineC == 'RoundOver' || lineC == 'You died.') {
			oscSend('/avatar/parameters/osc/doAutoJump', false)
		}
	}

	// Fish! [RELEASE]
	if (InstanceHistory[0].worldID == 'wrld_ae001ea3-ed05-42f0-adf2-3d47efd10a77') {
		if (line.includes(`[PlayerStats] `)) {
			var plystats = line.split(`[PlayerStats] `)[1].split(' ')
			console.log(`${loglv.info}${selflogL} [FISH] You're Level ${plystats[2].slice(2)} with ${plystats[3].slice(3)} XP and ${plystats[4].slice(6)} Gold.`)
			console.log(`${loglv.info}${selflogL} [FISH] You've caught ${plystats[5].slice(5)} fish (${plystats[6].slice(5)} rare). Sold ${plystats[7].slice(5)}. Turned in ${plystats[8].slice(9)} Bounties`)
			console.log(`${loglv.info}${selflogL} [FISH] With a Playtime of ${plystats[9].slice(11, -1) >= 86400 ? "" + Math.floor(plystats[9].slice(11, -1) / 86400) + ":" : ""}${new Date(plystats[9].slice(11, -1) * 1000).toISOString().substring(11, 19)}`)
		}

		if (line.includes(`[VersionChecker] Lobby version stamped: `)) {
			var lobbyver = line.split('[VersionChecker] Lobby version stamped: ')[1]
			console.log(`${loglv.info}${selflogL} [FISH] Lobby Version ${lobbyver}.`)
		}

	}


	// Portal Manager
	if (line.includes(`[PortalManager]`)) {
		var PortalLog = line.slice(50)
		if (PortalLog == 'Received portal destroy event.') {
			if (cooldownPortalVanish == false && currentAccountInUse['Agroup'] == true) {
				// oscChatBoxV2('~Portal has vanished', 5000, true, true, false, false, false)
				setTimeout(() => { cooldownPortalVanish = true }, 120_000)
			}
		}
		console.log(`${loglv.info}${selflogL} [PortalManager]: ${PortalLog}`)
	}

	// Local Moderation Manager
	if (line.includes(`[ModerationManager]`)) {
		var moderationlog = line.split(`[ModerationManager] `)[1]
		console.log(`${loglv.info}${selflogL} [ModerationManager]: ${moderationlog}`)
	}

	// Asset Bundle Download Manager
	if (line.includes(`[AssetBundleDownloadManager]`)) { eventAssetDownload(line) }

	// Image Downloading
	if (line.includes('[Image Download] Attempting to load image from URL')) {
		var imageurl = line.split('[Image Download] Attempting to load image from URL ')[1].trim()
		// console.log(`${loglv.info}${selflog} Downloading Image from ${imageurl}`)
		if (ChatImageStringURL == true && currentAccountInUse['Agroup'] == true) {
			oscChatBoxV2(`~ImageURL: ${imageurl}`, 5000, true, true, false, false, false)
		}
	}

	// String Downloading
	// I assume this is the same as Image downloading.. may need to change later
	if (line.includes('[String Download] Attempting to load String from URL')) {
		var stringurl = line.split('[String Download] Attempting to load String from URL ')[1].trim()
		if (/https?\:\/\/vr-m\.net\/[0-9]\/keepalive/.test(stringurl)) { return } // Surpress Moves&Chill heartbeat
		// if( stringurl == `'https://vr-m.net/1/keepalive'` ){ return	} // Surpress Moves&Chill heartbeat
		// console.log(`${loglv.info}${selflog} Downloading String from ${stringurl}`)
		if (ChatImageStringURL == true && currentAccountInUse['Agroup'] == true) {
			oscChatBoxV2(`~StringURL: ${stringurl}`, 5000, true, true, false, false, false)
		}
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
		console.log(`${loglv.info}${selflogL} [StickersManager]: ${stickerOwner} placed ${stickerFile}`)
	}

	// Fetch Video Player URL
	for (const regex of videoPlayerURLmasks) {
		var match = lineC.match(regex)
		if (match) { videoUrlResolver(match[1].trim()); return }
	}
}

function fitChars(I_line = '', lineCount = 1) {
	I_line = I_line || ''
	const charWidth = {
		" ": 0.018181, "a": 0.037037, "A": 0.041666, "b": 0.04, "B": 0.043478, "c": 0.03125, "C": 0.041666,
		"d": 0.04, "D": 0.047619, "e": 0.037037, "<": 0.037037, "g": 0.04, "G": 0.047619, "0": 0.037037, "1": 0.037037,
		"2": 0.037037, "3": 0.037037, "4": 0.037037, "5": 0.037037, "6": 0.037037, "7": 0.037037, "8": 0.037037, "9": 0.037037,
		"h": 0.04, "H": 0.05, ">": 0.037037, "K": 0.04, "?": 0.028571, "E": 0.037037, "M": 0.058823, "n": 0.04,
		"N": 0.05, "o": 0.04, "!": 0.017543, "@": 0.058823, "p": 0.04, "u": 0.04, "q": 0.04, "r": 0.026315,
		"s": 0.03125, "f": 0.022222, "F": 0.034482, "i": 0.016666, "I": 0.022222, "j": 0.016666, "J": 0.017857, "k": 0.034482,
		"l": 0.016666, "L": 0.034482, "m": 0.0625, "t": 0.023255, "v": 0.033333, "w": 0.052631, "x": 0.034482, "y": 0.033333,
		"z": 0.030303, "O": 0.052631, "P": 0.04, "Q": 0.052631, "R": 0.04, "S": 0.035714, "T": 0.037037, "U": 0.047619,
		"V": 0.04, "W": 0.0625, "X": 0.038461, "Y": 0.037037, "Z": 0.037037, "#": 0.041666, "$": 0.037037, "%": 0.055555,
		"^": 0.037037, "&": 0.047619, "*": 0.035714, "（": 0.066666, "）": 0.066666, "(": 0.019607, ")": 0.019607, "_": 0.028571,
		"-": 0.020833, "+": 0.037037, "=": 0.037037, "`": 0.018181, "~": 0.037037, "[": 0.021276, "]": 0.021276, "{": 0.025,
		"}": 0.025, "|": 0.035714, ";": 0.017241, "'": 0.014492, ":": 0.017241, "\"": 0.026315, ",": 0.017241, ".": 0.017241,
		"/": 0.024390
	}
	var trackingWidth = 0
	var limitLength = 0
	for (const item in I_line) {
		trackingWidth += charWidth[I_line[item]] != undefined ? charWidth[I_line[item]] : 0.0625
		if (trackingWidth >= lineCount) { limitLength = item; break; }
	}
	return I_line.slice(0, limitLength != 0 ? limitLength : I_line.length)
}

async function worldAutoPreloadQueue(worldList = []) {
	console.log(`${loglv.info}${selflogA} [Auto World Preload] Starting, have ${worldList.length} worlds to go through`)
	setUserStatus('Preloading worlds')
	for (const wrd in worldList) {
		await joinWorld(worldList[wrd])
		if (wrd == worldList.length - 1) {
			console.log(`${loglv.hey}${selflogA} [Auto World Preload] Finished, can close VRC if want.`)
			oscChatBoxV2(`Automatic Preload has finished \v Can close VRC if want.`, 30_000)
			setUserStatus('')
		}
	}
	async function joinWorld(world) {
		return new Promise((resolve, reject) => {
			console.log(`${loglv.hey}${selflogA} [Auto World Preload] Creating Preload Instance for ${world}`)
			vrchat.createInstance({
				body: {
					'worldId': world,
					'type': 'hidden',
					'region': 'use',
					// 'displayName': 'Preloading Worlds',
					// 'minimumAvatarPerformance': 'Poor',
					'ownerId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752'
				}
			}).then(created_instance => {
				startvrc(created_instance.data.location, true)
			}).catch((err) => {
				console.log(`${loglv.warn}${selflogA}` + err)
			})
			once(logEmitter, 'joinedworld').then((worldId) => {
				if (world == worldId) {
					setTimeout(() => {
						resolve(true);
					}, 10000)
				}
			})
		})
	}
}

function queueInstanceDataBurst() {
	// BUFFER COST 5
	if (getOSCDataBurstState() != 'overloaded' && vrchatRunning == true) {
		OSCDataBurst(7, parseFloat((playersInInstance.length > 80 ? 80 : playersInInstance.length).toString().padStart(2, '0')[0] == 0 ? 10 : (playersInInstance.length > 80 ? 80 : playersInInstance.length).toString().padStart(2, '0')[0]) / 10)
		OSCDataBurst(8, parseFloat((playersInInstance.length > 80 ? 80 : playersInInstance.length).toString().padStart(2, '0')[1]) / 10)
		OSCDataBurst(9, parseFloat((playerHardLimit > 80 ? 80 : playerHardLimit) < 10 ? (playerHardLimit > 80 ? 80 : playerHardLimit) : (playerHardLimit > 80 ? 80 : playerHardLimit).toString()[0]) / 10)
		OSCDataBurst(10, parseFloat((playerHardLimit > 80 ? 80 : playerHardLimit) < 10 ? 10 : (playerHardLimit > 80 ? 80 : playerHardLimit).toString()[1]) / 10)
		OSCDataBurst(11, parseFloat(playerRatio))
		OSCDataBurst(12, parseFloat(memberRatio))
	}
	// membersInInstance.length
	// memberRatio
}

oscEmitter.on('osc', (addr, value) => {
	if (addr == `/avatar/parameters/api/explore/start` && value == true) { inviteHubQueue() }
	if (addr == `/avatar/parameters/api/explore/next` && value == true) { inviteLocalQueue() }
	// if (address == `/avatar/parameters/api/explore/hub` && value == true) { }
	if (addr == `/avatar/parameters/api/explore/stop` && value == true) {
		apiEmitter.emit('exploreQueue', undefined, 'world')
	}
	if (addr == `/avatar/parameters/api/explore/prefill` && value == true) { addLabWorldsToLocalQueue() }
	if (addr == `/avatar/parameters/api/explore/privacy` && value == 0) { explorePrivacyLevel = 0 }
	if (addr == `/avatar/parameters/api/explore/privacy` && value == 1) { explorePrivacyLevel = 1 }
	if (addr == `/avatar/parameters/api/explore/privacy` && value == 2) { explorePrivacyLevel = 2 }
	if (addr == `/avatar/parameters/api/explore/privacy` && value == 3) { explorePrivacyLevel = 3 }
	if (addr == `/avatar/parameters/api/requestall` && value == true) { requestAllOnlineFriends(currentUser) }
	if (addr == '/avatar/parameters/api/favWorld' && value != 0) {
		switch (value) {
			case 1:
				findJoinableInstances().then(d => {
					G_instanceJoinQueue = d
					oscChatBoxV2(`~Found ${d.length} joinable instances`, 5000, false, true, false, false)
					console.log(`${loglv.hey}${selflogA} Found ${d.length} joinable instances`)
				})
				break
			case 2:
				inviteJoinableInstanceQueue(); break;
			default: break;
		}
	}

})
oscEmitter.on('avatar', (avtrID) => {
	if (['avtr_305ddd5d-d1f9-4adb-a025-50c2f1a9d219',
		`avtr_5c866609-f49a-4867-ac74-5dab03d5d713`,
		`avtr_75c670ca-4614-4db2-a687-e27994acb0ac`,
		'avtr_6b25124e-e141-4df4-ad27-22766608e5dc',
	].includes(avtrID)) {
		queueInstanceDataBurst()
		oscSend('/avatar/parameters/log/instance_closed', G_InstanceClosed)
		applyGroupLogo(InstanceHistory[0]?.groupID)
	}
});

async function addLabWorldsToLocalQueue() {
	console.log(`${loglv.info}${selflogA} Adding 100 Community Labs worlds to queue`)
	console.log(`${loglv.info}${selflogA} Adding 100 New-and-Noteworthy worlds to queue`)
	let { data: worldData } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, sort: 'labsPublicationDate', order: 'descending', offset: 0, tag: 'system_labs' } }))
	let { data: newAndNote } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, sort: 'heat', order: 'descending', offset: 0, tag: 'system_approved,system_published_recently' } }))
	fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
		let localQueueList = data.split(`\r\n`)
		let lastInQueue = localQueueList[localQueueList.length - 2]
		// console.log(lastInQueue)

		let worldlist = ''
		let skipAdd = false
		worldData.forEach((w, index, arr) => {
			console.log(`${loglv.info}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
			// console.log(`${loglv.info}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
			lastInQueue == w.id ? skipAdd = true : ''
			index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
		})
		newAndNote.forEach((w, index, arr) => {
			console.log(`${loglv.info}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
			// console.log(`${loglv.info}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
			lastInQueue == w.id ? skipAdd = true : ''
			index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
		})

		if (worldlist.includes(lastInQueue) || skipAdd == true) {
			console.log(`${loglv.hey}${selflogA} Cancelled list appendage, Queue already contains part of latest batch`)
			oscChatBoxV2(`Cancelled queue append:\v Queue already contains latest labs batch`, 5000, true, true, false, false, false)

		} else {
			fs.appendFile(worldQueueTxt, `\r\n` + worldlist, { 'encoding': 'utf8' }, (err) => { if (err) { console.log(err) } })
		}
	})
}
async function addSearchToLocalQueue(i_searchString) {
	console.log(`${loglv.info}${selflogA} Adding searched worlds to queue`)
	let { data: worldData } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, search: i_searchString, sort: 'labsPublicationDate', order: 'descending', offset: 0, tag: 'system_labs' } }))
	let { data: worldData2 } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, search: i_searchString, order: 'descending', offset: 0, notag: 'system_labs' } }))
	fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
		let localQueueList = data.split(`\r\n`)
		let lastInQueue = localQueueList[localQueueList.length - 2]
		// console.log(lastInQueue)

		let worldlist = ''
		let skipAdd = false
		worldData.forEach((w, index, arr) => {
			console.log(`${loglv.info}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
			// console.log(`${loglv.info}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
			lastInQueue == w.id ? skipAdd = true : ''
			index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
		})
		worldData2.forEach((w, index, arr) => {
			console.log(`${loglv.info}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
			// console.log(`${loglv.info}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
			lastInQueue == w.id ? skipAdd = true : ''
			index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
		})
		fs.appendFile(worldQueueTxt, `\r\n` + worldlist, { 'encoding': 'utf8' }, (err) => { if (err) { console.log(err) } })
	})
}
function inviteHubQueue() {
	var instanceBody = {
		'worldId': 'wrld_112c5336-0329-4293-83ac-96f37f8a6405',
		'type': 'group',
		'region': 'use',
		'minimumAvatarPerformance': 'Poor',
		'ownerId': 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce',
		'groupAccessType': 'plus',
		'queueEnabled': true
	}
	if (vrcUserHasVRCplus == true) { instanceBody['displayName'] = 'World Hop' }

	console.log(`${loglv.hey}${selflogA} Creating group instance for wrld_112c5336-0329-4293-83ac-96f37f8a6405`)

	vrchat.createInstance({ body: instanceBody })
		.then(created_instance => { startvrc(created_instance.data.location, false) })
		.catch(err => { console.log(`${loglv.warn}${selflogA}` + err) })
}

function inviteLocalQueue(I_autoNext = false) {
	fs.readFile(worldQueueTxt, 'utf8', async (err, data) => {
		// err ? console.log(err); return : ''
		let localQueueList = data.split('\r\n===')[0].split(`\r\n`)
		if (localQueueList.length == 0) {
			console.log(`${loglv.hey}${selflogA} Explore queue is empty${data.includes('===') ? `: Remove bookmark` : ``}`);
			oscChatBoxV2(`~Explore Queue is empty${data.includes('===') ? `\vRemove bookmark.` : ``}`, 5000, true, true, false, false, false);
			return
		}

		if (playersInInstance.length >= 2 && currentAccountInUse.id == process.env['VRC_ACC_ID_1'] && InstanceHistory[0].worldHopNoticeSent != true && InstanceHistory[0].groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
			console.log(`${loglv.debug} [InstanceHistory] Appending WorldHop Notice Sent`)
			InstanceHistory[0].worldHopNoticeSent = true
			manualCall(`instances/${InstanceHistory[0].location}/announce`, 'POST', { "title": 'Explorer Notice', "message": 'Genarating portal to the next world.\nRespawn if you are lost.', "imageId": 'file_072c4481-1642-4226-91b8-01bbb61444d9', "imageVersion": 1 }).catch(c => { console.error(c) })
		}


		let randnum = Math.round(Math.random() * (localQueueList.length - 1))
		let world_id = localQueueList[randnum]

		let extimelow = Math.floor((localQueueList.length * 2) / 60)
		let extimehig = Math.floor((localQueueList.length * 10) / 60)
		console.log(`${loglv.info}${selflogA} ${localQueueList.length} worlds to explore. [${extimelow} to ${extimehig} Hours]`)
		apiEmitter.emit('exploreQueue', localQueueList.length, 'world')

		let gotWorld = await limiter.reqCached('world', world_id).catch(async () => {
			return await limiter.req(vrchat.getWorld({ 'path': { 'worldId': world_id } }), 'world')
		})
		if (gotWorld.data == undefined) {
			console.log(`${loglv.hey}${selflogA} World failed to fetch. Try again..`);
			oscChatBoxV2(`World fetch failed.\vTry another.`, 5000, true, true, false, false, false)
			fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
				if (data.includes(world_id)) {
					fs.writeFile(worldQueueTxt, data.replaceAll(`${world_id}\r\n`, ''), (err) => { if (err) { console.log(err) } })
				}
			})
			return
		}
		isWorldUnlisted(world_id, '14anthony7095')

		var filter_UserAndroid = playersInstanceObject.find(u => u.platform == 'android')
		var filter_PlatformAdnroid = gotWorld.data.unityPackages.find(p => p.platform == 'android')
		// if (gotWorld.data.capacity < playersInInstance.length && G_InstanceHistory[0].groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
		if (gotWorld.data.capacity < playersInInstance.length) {
			console.log(`${loglv.hey}${selflogA} World can not fit everyone. Retry..`);
			oscChatBoxV2(`World can not fit everyone.\vTry another.`, 5000, true, true, false, false, false)
			return
			// } else if (filter_UserAndroid != undefined && filter_PlatformAdnroid == undefined && G_InstanceHistory[0].groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
		} else if (filter_UserAndroid != undefined && filter_PlatformAdnroid == undefined) {
			console.log(`${loglv.hey}${selflogA} World is not Quest compatible. Retry..`);
			oscChatBoxV2(`World is not Quest compatible.\vTry another.`, 5000, true, true, false, false, false)
			return
		}

		var instanceBody = {
			'worldId': world_id,
			'region': 'use',
			'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
		}
		if (vrcUserHasVRCplus == true) { instanceBody['displayName'] = 'World Hop' }
		switch (explorePrivacyLevel) {
			case 0:
				instanceBody['type'] = 'group'
				instanceBody['ownerId'] = 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce'
				instanceBody['groupAccessType'] = 'public'
				instanceBody['minimumAvatarPerformance'] = 'Poor'
				instanceBody['queueEnabled'] = true
				break;
			case 1:
				instanceBody['type'] = 'group'
				instanceBody['ownerId'] = 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce'
				instanceBody['groupAccessType'] = 'plus'
				instanceBody['minimumAvatarPerformance'] = 'Poor'
				instanceBody['queueEnabled'] = true
				break;
			case 2:
				instanceBody['type'] = 'private'
				instanceBody['ownerId'] = process.env["VRC_ACC_ID_1"]
				instanceBody['canRequestInvite'] = true
				break;
			default:
				instanceBody['type'] = 'hidden'
				instanceBody['ownerId'] = process.env["VRC_ACC_ID_1"]
				break;
		}

		console.log(`${loglv.hey}${selflogA} Creating group instance for ${world_id}`)
		var created_instance = await vrchat.createInstance({ 'body': instanceBody })
		if (created_instance.data != undefined) {
			startvrc(created_instance.data.location, I_autoNext)
			apiEmitter.emit('exploreQueue', localQueueList.length, 'world')
			console.log(`${loglv.info}${selflogA} Auto-Close set for ${created_instance.data.closedAt}.`)
		} else {
			oscChatBoxV2(`instance create failed.\v[${created_instance.error.response.status}] ${created_instance.error.response.statusText}\v${created_instance.error.message}`, 5000, true, true)
			console.log(`${loglv.warn}${selflogA} `, created_instance.error.cause)
			fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
				// err ? console.log(err); return : ''
				if (data.includes(world_id)) {
					fs.writeFile(worldQueueTxt, data.replaceAll(`${world_id}\r\n`, ''), (err) => { if (err) { console.log(err) } })
				}
				if (I_autoNext == true) { setTimeout(() => { inviteLocalQueue(true) }, 5000) }
			})
		}
	})
}




var vrcUserStatusText = ''
function setUserStatus(I_statusText = '', I_status) {
	// console.log(`${loglv.hey}${selflog} Status Update Cancelled`);return
	if (I_statusText.slice(0, 32) !== vrcUserStatusText && currentAccountInUse['Agroup'] == true) {
		var bodyJson = { 'statusDescription': I_statusText.slice(0, 32) }
		if (I_status != undefined) { bodyJson['status'] = I_status }

		vrchat.updateUser({ 'path': { 'userId': process.env["VRC_ACC_ID_1"] }, 'body': bodyJson })

		console.log(`${loglv.hey}${selflogA} Status Updated: ${I_statusText.slice(0, 32)}`)
		vrcUserStatusText = I_statusText.slice(0, 32)
	}
}


async function hypeTrainLocater() {
	console.log(`${loglv.info}${selflogA} [HypeTrainLocater] Searching for active HypeTrain..`)
	// Active World List
	var activeworlds = await limiter.req(vrchat.getActiveWorlds({ 'query': { 'offset': 0, 'n': 100, 'order': 'ascending' } }))
	// Worlds Data
	var count = 0
	var highestPercent = [0, 0] // Percent , Gift Count, Gift Goal
	for (const wrld in activeworlds.data) {
		// console.log(`${loglv.info}${selflogA} [HypeTrainLocater] World Target: ${activeworlds.data[wrld].name}`)

		var gotworld = await limiter.req(vrchat.getWorld({ 'path': { 'worldId': activeworlds.data[wrld].id } }))
		// Instances Data
		for (const ints in gotworld.data.instances) {
			if (gotworld.data.instances[ints][1] <= 2) { continue }

			var gotInstance = await limiter.req(vrchat.getInstance({ 'path': { 'worldId': activeworlds.data[wrld].id, 'instanceId': gotworld.data.instances[ints][0] } }))
			// Has Hypetrain data
			if (gotInstance.data.hypeTrain?.current != null) {
				count++
				require('open').default('vrcx://world/' + activeworlds.data[wrld].id + ':' + gotworld.data.instances[ints][0])
				G_instanceJoinQueue.unshift(activeworlds.data[wrld].id + ':' + gotworld.data.instances[ints][0])

				var goalPercent = Math.floor(gotInstance.data.hypeTrain.current.currentGiftCount / gotInstance.data.hypeTrain.current.totalGiftGoal * 100)
				highestPercent = goalPercent > highestPercent[0] ? [goalPercent, gotInstance.data.hypeTrain.current.currentGiftCount] : highestPercent
				console.log(`${loglv.info}${selflogA} [HypeTrainLocater] Active: [ ${goalPercent}% ]  ${activeworlds.data[wrld].name}\n${activeworlds.data[wrld].id}:${gotworld.data.instances[ints][0]}`)

			} else if (gotInstance.data.hypeTrain?.potentialTrain != null) {
				console.log(`${loglv.info}${selflogA} [HypeTrainLocater] Warm: ${gotworld.data.instances[ints][0]}`)
			}

		}
	}
	console.log(`${loglv.info}${selflogA} [HypeTrainLocater] Finished search..`)
	oscChatBoxV2(`~Found ${count} instance${count != 1 ? 's' : ''} with active HypeTrain.${count >= 1 ? '\v' : ''}${count >= 2 ? 'Highest ' : ''}${count >= 1 ? 'Goal: ' + highestPercent[0] + '%  (' + highestPercent[1] + ' of 50)' : ''}`, 5000, false, true)
}


var highestCount = 0
fs.readFile('./datasets/vrcMaxPop.txt', 'utf-8', (err, data) => { highestCount = data })
function getVisitsCount() {
	return new Promise(async (resolve, reject) => {
		if (isApiErrorSkip == true) { resolve(0) } else {
			let { data: visitsCount } = await vrchat.getCurrentOnlineUsers()
			resolve(visitsCount == undefined ? 0 : visitsCount)

			if (visitsCount > highestCount) {
				highestCount = visitsCount
				console.log(`${loglv.hey}\x1b[0m[\x1b[36mCounter\x1b[0m] New Highest Population reached: ${visitsCount}`)
				fs.writeFile('./datasets/vrcMaxPop.txt', visitsCount.toString(), 'utf-8', (err) => { if (err) { console.log(err) } })
			}
		}
	})
}
exports.getVisitsCount = getVisitsCount;

async function startvrc(vrclocation, autoGo = false, openToHome = false) {
	// vrcIsOpen = true
	if (openToHome == true) {
		require('child_process').execSync(`"C:\\Program Files (x86)\\Steam\\steamapps\\common\\VRChat\\start_protected_game.exe" --no-vr`)
	} else {
		await open(`vrchat://launch/?ref=vrchat.com&id=${vrclocation}&attach=1`)
		if (autoGo == true) {
			setTimeout(() => {
				require('child_process').execSync(`"C:\\Users\\14Anthony7095\\Documents\\14aOSC_Multi-Interface\\bin\\vrcPressGoOnWorldPage.exe"`)
			}, 2000);
		}
	}
}
exports.startvrc = startvrc;


var tenMinuteTick = 0
console.log(`${loglv.hey}${selflogA} First Audit scan at ${new Date(new Date().getTime() + 600_000).toTimeString()}`)
setTimeout(() => {
	if (isApiErrorSkip == false) { scanGroupAuditLogs() }
}, 600_000)
setInterval(() => {
	queueInstanceDataBurst()
}, 10_000)

async function scanGroupAuditLogs() {
	console.log(`${loglv.info}${selflogA} Scanning through audit logs.`)

	// var targetGroupLogID_NHI = 'grp_3473d54b-8e10-4752-9548-d77a092051a4' // Nanachi's Hollow Inn
	var targetGroupLogID_14aHop = 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce' // 14aHop
	// var targetGroupLogID_14aClone = 'grp_b7f14d28-d1cb-4441-8c1a-3632675293ec' // 14aClone
	var targetGroupLogID_WEFURS = 'grp_cdb7c49d-9a90-4b17-8137-ff17bc624c6c' // WEFURS

	var targetGroupLogID_1year = 'grp_4f5d0456-4200-4b2c-8331-78856d1869e4' // Years of VRC Service - START
	var targetGroupLogID_2year = 'grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233'
	var targetGroupLogID_3year = 'grp_378c0550-07a1-4cab-aa45-65ad4a817117'
	var targetGroupLogID_4year = 'grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8'
	var targetGroupLogID_5year = 'grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4'
	var targetGroupLogID_6year = 'grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675'
	var targetGroupLogID_7year = 'grp_5eb28410-68df-4609-b0c5-bc98cf754264'
	var targetGroupLogID_8year = 'grp_18aa4b68-9118-4716-9a39-42413e54db8c'
	var targetGroupLogID_9year = 'grp_768a2c3d-b22c-48d2-aae1-650483c347ea'
	var targetGroupLogID_10year = 'grp_243d9742-ce05-4fc3-b399-cd436528c432'  // Years of VRC Service - END


	// const { data: logOutput_NHI } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_NHI }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_14aHop } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_14aHop }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	// const { data: logOutput_14aClone } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_14aClone }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_WEFURS } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_WEFURS }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))

	const { data: logOutput_1year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_1year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_2year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_2year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_3year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_3year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_4year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_4year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_5year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_5year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_6year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_6year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_7year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_7year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_8year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_8year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_9year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_9year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_10year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_10year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))

	lastFetchGroupLogs = new Date().toISOString()
	fs.writeFile('./lastFetchGroupLogs.txt', lastFetchGroupLogs, (err) => { if (err) { console.log(err) } })


	// await scanaudit(logOutput_NHI, targetGroupLogID_NHI);
	await scanaudit(logOutput_14aHop, targetGroupLogID_14aHop);
	// await scanaudit(logOutput_14aClone, targetGroupLogID_14aClone);
	await scanaudit(logOutput_WEFURS, targetGroupLogID_WEFURS);

	await scanaudit(logOutput_1year, targetGroupLogID_1year);
	await scanaudit(logOutput_2year, targetGroupLogID_2year);
	await scanaudit(logOutput_3year, targetGroupLogID_3year);
	await scanaudit(logOutput_4year, targetGroupLogID_4year);
	await scanaudit(logOutput_5year, targetGroupLogID_5year);
	await scanaudit(logOutput_6year, targetGroupLogID_6year);
	await scanaudit(logOutput_7year, targetGroupLogID_7year);
	await scanaudit(logOutput_8year, targetGroupLogID_8year);
	await scanaudit(logOutput_9year, targetGroupLogID_9year);
	await scanaudit(logOutput_10year, targetGroupLogID_10year);

	if (tenMinuteTick == 6) {
		await updateBioWorldQueue()
	}

	// Updating friend Whitelist
	fs.readFile('./datasets/autoAcceptWhitelist.txt', 'utf8', (err, data) => {
		if (err) { console.log(err); return }
		userAutoAcceptWhiteList = data.split('\r\n')
	})


	console.log(`${loglv.hey}${selflogA} Next Audit scan at ${new Date(new Date().getTime() + 600_000).toTimeString()}`)
	limiter.sweepCache()

	setTimeout(() => {
		scanGroupAuditLogs()
		tenMinuteTick >= 6 ? tenMinuteTick = 0 : tenMinuteTick++
	}, 600_000)
}

async function requestAllOnlineFriends() {
	var { data: onlineFriends } = await limiter.req(vrchat.getFriends({ query: { offset: 0, n: 100, offline: false } }))
	var privateFriends = onlineFriends.filter(onlineFriends => onlineFriends.location == 'private')
	var privateFriendsNotHere = privateFriends.filter(privateFriends => playersInInstance.includes(privateFriends.displayName) == false)
	privateFriendsNotHere.forEach((friend, index, friendArr) => {
		setTimeout(() => {
			console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) Checking ${friend.displayName}`)
			if (['active', 'join me', 'ask me'].includes(friend.status)) {
				console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is in Private`)

				const reqBlacklist = new Set([
					`usr_39a91182-0df7-476e-bc4a-e5d709cca692`, // ghost
					`usr_49590946-943b-4835-ba7e-2e370b596b4d`, // Samoi
					`usr_060e1976-dfda-44b0-8f71-fa911d8bf580`, // luna-the-bunny
					`usr_bba4ca7a-5447-4672-828d-0a09d85f854e`, // melting
					`usr_ee815921-8067-4486-a3e2-ded009457cf3` // turtlesnack
				])
				var logPrefix = `${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName}`
				var friendStatusLower = friend.statusDescription.toLowerCase()

				if (reqBlacklist.has(friend.id)) {
					console.log(`${logPrefix} is on Do-Not-Request Blacklist`)
					return
				} else if (friendStatusLower.includes('busy')) {
					console.log(`${logPrefix} has "Busy" in status`)
					return
				} else if (friendStatusLower.includes('zzz') || friendStatusLower.includes('sleep')) {
					console.log(`${logPrefix} has "Sleeping" status`)
					return
				} else if (friendStatusLower.includes('furality') && !friendStatusLower.includes('no')) {
					console.log(`${logPrefix} has "Furality" status, check the FOX Portal`)
					return
				}

				vrchat.requestInvite({ path: { userId: friend.id }, body: { requestSlot: 1 } }).then((send_invite) => {
					console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) Request Sent to ${friend.displayName} - "${send_invite.data.message}"`)
				}).catch((err) => console.log(err))

			} else if (friend.status == 'busy') {
				console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is Busy`)
			}
			if (index + 1 == friendArr.length) {
				setTimeout(() => {
					console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] 10 minutes has past since sending Requests`)
				}, 600_000);
				console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] Done Requesting`)
			}
		}, (2_000 * index) + Math.random())
	})
}

var popcornPalaceMovieTitle = ''
function eventPopcornPalace(json) {
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
	var movieShowName = ''
	try { movieShowName = JSON.parse(json).videoName } catch (error) { movieShowName = 'Youtube' }

	// Reformat title for One Piece watch sessions
	if (movieShowName.includes('One Piece')) { movieShowName = movieShowName.replace('- S1E', 'ep.').split(' -')[0] }

	// Difference while on Main accounts
	if (movieShowName != popcornPalaceMovieTitle && currentAccountInUse['Agroup'] == true) {
		popcornPalaceMovieTitle = movieShowName

		if (movieShowName != '') {
			oscChatBoxV2(`~MovieTitle:\v ${movieShowName}`, 5000, true, true, false, false, false)

			// Been in world long enough
			if ((InstanceHistory[0].join_timestamp + 300_000 < Date.now() || InstanceHistory[0].ownerID == currentAccountInUse['id']) && InstanceHistory[0].join_timestamp != 0) {
				setUserStatus(`Watching ${movieShowName}`)
			}

		}
	}
}


async function findJoinableInstances() {
	return new Promise(async (resolve, reject) => {
		// Creating instance array to return later
		var joinableInstances = []
		console.log(`${loglv.debug}${selflogL} [InstanceHistory]`, InstanceHistory)

		// Fetching 100 online friends from api
		var gotOnlineFriends = await limiter.req(vrchat.getFriends({ 'query': { 'n': 100, 'offline': false, 'offset': 0 } }))
		if (gotOnlineFriends.data != undefined) {
			if (gotOnlineFriends.data.length == 100) {
				// Fetching 100 more online friends from api
				var gotMoreOnlineFriends = await limiter.req(vrchat.getFriends({ 'query': { 'n': 100, 'offline': false, 'offset': 100 } }))
				if (gotMoreOnlineFriends.data != undefined) {
					// Merging with first
					gotOnlineFriends.data = gotOnlineFriends.data.concat(gotMoreOnlineFriends.data)
				}
			}
			// Filtering Private and Offline instances out of friend data
			gotOnlineFriends.data
				.filter(f => f.location != 'private' && f.location != 'offline' && f.id != 'usr_bba4ca7a-5447-4672-828d-0a09d85f854e')
				.forEach((i) => {
					// Pushing instance locations into return array
					var srcInstHistory = InstanceHistory.find(f => f.location == i.location)
					if (srcInstHistory == undefined && !joinableInstances.includes(i.location)) {
						joinableInstances.push(i.location)
					}
				})
		}

		// Joinable Group Instances
		// Fetching active Group Instances from api
		var gotUserGroupInstances = await limiter.req(vrchat.getUserGroupInstances({ 'path': { 'userId': process.env['VRC_ACC_ID_1'] } }))
		if (gotUserGroupInstances.data != undefined) {
			// Filtering out Full instances without queue enabled
			gotUserGroupInstances.data.instances
				.filter(f => f.closedAt == null || (f.closedAt != null && f.closedAt > Date.now()))
				.forEach((i) => {
					// Pushing instance locations into return array
					var srcInstHistory = InstanceHistory.find(f => f.location == i.location)
					if (srcInstHistory == undefined && !joinableInstances.includes(i.location)) {
						joinableInstances.push(i.location)
					}
				})

		}

		// Resolving function's Promise
		resolve(joinableInstances)
	})
}


function inviteJoinableInstanceQueue() {
	if (G_instanceJoinQueue.length == 0) {
		console.log(`${loglv.hey}${selflogA} Joinable queue is empty`);
		oscChatBoxV2(`~Joinable Queue is empty`, 5000, false, true, false, false, false);
		return
	}
	// let randnum = Math.round(Math.random() * (G_instanceJoinQueue.length - 1))
	// let instanceJoinID = G_instanceJoinQueue[randnum]

	startvrc(G_instanceJoinQueue[0])
	// G_instanceJoinQueue.splice(randnum, 1)
	G_instanceJoinQueue.shift()
}

function applyGroupLogo(gID) {
	/*
0111 - El Alba
0110 - VRDance

0101 - Furry Argentina VR
0100 - The Lunar Howl
0011 - Nanachis of VRChat

0010 - Nanachi's hollow inn
0001 - Community Events
0000 - CORE Default
	*/
	switch (gID) {
		case 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad':
			// El Alba
			// 0111 - 7
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
			break;
		case 'grp_d960be54-cfc2-44cb-863d-6d624d8975c1':
			// VR Dance
			// 0110 - 6
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
			break;
		case `grp_a8f9e8f8-6ccb-410e-b96e-8977bd3a094f`:
			// Furry Argentina VR
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
	console.log(`${loglv.hey}${selflogL} VRChat has Closed.`)
	clearTimeout(worldHopTimeout)
	clearTimeout(worldHopTimeoutHour)
	clearTimeout(userTrustTableTimer)

	apiEmitter.emit('exploreQueue', undefined, 'world')

	const resetOnTheseStats = ['Instance is closed', `Exploring World Queue`, 'At Furality']
	for (const status in resetOnTheseStats) {
		if (vrcUserStatusText.includes(resetOnTheseStats[status])) {
			vrcUserStatusText = ''
			setUserStatus('')
		}
	}

	console.log(`${loglv.info}${selflogL}${ttvFetchFrom == 1 && urlType == 'twitch' ? ` Resetting Twitch target channel${lastVideoURL != '' ? ` &` : ''}` : ''}${lastVideoURL != '' ? ` Clearing Video-URL history` : ''}`)
	switchChannel(process.env["VRC_ACC_NAME_1"])

	G_InstanceClosed = false
	worldHopTimeout = null
	worldHopTimeoutHour = null
	userTrustTableTimer = null
	lastVideoURL = ''
	tarFile = 'nothing'
	tonAvgStartWait = []
	seenVideoURLs = []

	process.title = `14anthony7095 OSC Multi-Interface`

	console.log(`${loglv.debug} [InstanceHistory] Post-Game Closer: Setting location to Offline`)
	InstanceHistory[0] = {
		'groupID': '',
		'instanceType': 'offline',
		'ownerID': '',
		'join_timestamp': Date.now(),
		'leave_timestamp': 0,
		'location': 'offline',
		'worldID': 'offline',
		'timeSpent': 0
	}

	setTimeout(() => {
		vrchatRunning = false
		setTimeout(() => {
			console.log(`${loglv.debug} [InstanceHistory] Post-Game Closer: Clearing "gone an hour" instances past index 2`)
			InstanceHistory = InstanceHistory.filter((ih, index) => ih.leave_timestamp + 3600_000 > Date.now() || index <= 1)
		}, 3605_000)
	}, 5_000)

}
exports.eventGameClose = eventGameClose;

var vrcpropcount = {
	'prop_id': {
		"Name": 'sample',
		"Count": 999
	}
}
fs.readFile('./datasets/propcounts.json', 'utf8', (err, data) => { vrcpropcount = JSON.parse(data) })
async function eventPropSpawned(propID) {
	// console.log(`${loglv.debug}${selflog} Item spawned: ${propID}`)
	if (!vrcpropcount[propID]) {
		console.log(`${loglv.hey}${selflogL} Unseen Item spawned: ${propID}`)
		// console.log(`${loglv.debug}${selflog} ${propID} for ${vrcpropcount}`)
		let res = await limiter.req(vrchat.getProp({ 'path': { 'propId': 'prop_' + propID } }))
		// console.log(`${loglv.debug}${selflog} ${res.data}`)
		if (res.data != undefined) {
			if (!vrcpropcount[propID]) {
				vrcpropcount[propID] = { "name": "", "count": 0 }
			}
			vrcpropcount[propID].name = res.data.name
			if (res.data.itemTemplate != undefined) {
				var gotInvTemplate = await limiter.req(vrchat.getInventoryTemplate({ 'path': { 'inventoryTemplateId': res.data.itemTemplate } }))
				if (gotInvTemplate.data != undefined) {
					vrcpropcount[propID].name = gotInvTemplate.data.name
				}
			}

			vrcpropcount[propID].count = 1
			console.log(`${loglv.hey}${selflogA} Added ${vrcpropcount[propID].name} to the Items list`)
			fs.writeFile('./datasets/propcounts.json', JSON.stringify(vrcpropcount, null, 2), (err) => { if (err) { console.log(err); return } })
		}

	} else {
		vrcpropcount[propID].count = vrcpropcount[propID].count + 1
		console.log(`${loglv.info}${selflogL} Item spawned: ${vrcpropcount[propID].name} - ${vrcpropcount[propID].count - 1} -> ${vrcpropcount[propID].count}`)
		fs.writeFile('./datasets/propcounts.json', JSON.stringify(vrcpropcount, null, 2), (err) => { if (err) { console.log(err); return } })
	}
}

function requestUserTrustTable() {

	var playersInstancePlatforms = playersInstanceObject.reduce((acc, ply) => {
		// console.log(`${loglv.debug} [DEBUG % JOINING]`, ply, ply.platform)
		acc[ply.platform || loglv.false + 'Joining' + loglv.reset] = (acc[ply.platform] || 0) + 1;
		return acc
	}, {})
	playersInstancePlatforms = Object.fromEntries(Object.entries(playersInstancePlatforms).map(e => [e[0], [e[1], Math.round(e[1] / playersInstanceObject.length * 100) + '%']]))

	var playersInstanceTrustRanks = playersInstanceObject.reduce((acc, ply) => {
		acc[ply.trust || loglv.false + 'Joining' + loglv.reset] = (acc[ply.trust] || 0) + 1;
		return acc
	}, {})
	playersInstanceTrustRanks = Object.fromEntries(Object.entries(playersInstanceTrustRanks).map(e => [e[0], [e[1], Math.round(e[1] / playersInstanceObject.length * 100) + '%']]))

	var playersInstanceStatus = playersInstanceObject.reduce((acc, ply) => {
		acc[ply.status || loglv.false + 'Joining' + loglv.reset] = (acc[ply.status] || 0) + 1;
		return acc
	}, {})
	playersInstanceStatus = Object.fromEntries(Object.entries(playersInstanceStatus).map(e => [e[0], [e[1], Math.round(e[1] / playersInstanceObject.length * 100) + '%']]))


	var a = table(Object.entries(playersInstanceTrustRanks).sort((a, b) => b[1][0] - a[1][0]).map(([k, v]) => [k, ...v]))
	var b = table(Object.entries(playersInstancePlatforms).sort((a, b) => b[1][0] - a[1][0]).map(([k, v]) => [k, ...v]))
	var c = table(Object.entries(playersInstanceStatus).sort((a, b) => b[1][0] - a[1][0]).map(([k, v]) => [k, ...v]))
	var stringDebugTables = table([['Trust Ranks', 'Platform', 'Status'], [a, b, c]])
	console.log(`${loglv.debug}\n${stringDebugTables}`)
}

async function switchYearGroupsClosed() {
	return new Promise(async (resolve, reject) => {

		const FC_yearGroups = [`grp_4f5d0456-4200-4b2c-8331-78856d1869e4`,
			`grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c33`,
			`grp_378c0550-07a1-4cab-aa45-65ad4a817117`,
			`grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`,
			`grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`,
			`grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`,
			`grp_5eb28410-68df-4609-b0c5-bc98cf754264`,
			`grp_18aa4b68-9118-4716-9a39-42413e54db8c`,
			`grp_768a2c3d-b22c-48d2-aae1-650483c347ea`,
			`grp_243d9742-ce05-4fc3-b399-cd436528c432`
		]

		for (const item in FC_yearGroups) {
			console.log(`${loglv.hey}${selflogA} Closing Access to "${item + 1} Year${(item + 1) > 1 ? 's' : ''} of VRC Collector" group`)
			await limiter.req(vrchat.updateGroup({ 'path': { 'groupId': FC_yearGroups[item] }, 'body': { 'joinState': 'request' } }))
			await sleep(10000)
		}

		resolve(true)

	})
}
async function switchYearGroupsReOpen() {
	return new Promise(async (resolve, reject) => {

		const FC_yearGroups = [`grp_4f5d0456-4200-4b2c-8331-78856d1869e4`,
			`grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c33`,
			`grp_378c0550-07a1-4cab-aa45-65ad4a817117`,
			`grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`,
			`grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`,
			`grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`,
			`grp_5eb28410-68df-4609-b0c5-bc98cf754264`,
			`grp_18aa4b68-9118-4716-9a39-42413e54db8c`,
			`grp_768a2c3d-b22c-48d2-aae1-650483c347ea`,
			`grp_243d9742-ce05-4fc3-b399-cd436528c432`
		]

		for (const item in FC_yearGroups) {
			console.log(`${loglv.hey}${selflogA} Opening Access to "${item + 1} Year${(item + 1) > 1 ? 's' : ''} of VRC Collector" group`)
			await limiter.req(vrchat.updateGroup({ 'path': { 'groupId': FC_yearGroups[item] }, 'body': { 'joinState': 'open' } }))
			await sleep(10000)
		}

		resolve(true)

	})
}

async function updateBioWorldQueue() {
	return new Promise((resolve) => {
		fs.readFile(worldQueueTxt, 'utf8', async (err, dataw) => {
			let localQueueList = dataw.split('===')[0].split(`\r\n`)
			console.log(`${loglv.hey}${selflogA} Preping Bio for world queue update`)
			if (localQueueList.length != 0) {
				console.log(`${loglv.info}${selflogA} Fetching current Bio`)
				let { data: mybio } = await limiter.req(vrchat.getUser({ 'path': { 'userId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752' } }))

				if (mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/) != null) {
					if (parseInt(mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/)[1]) != localQueueList.length) {
						console.log(`${loglv.info}${selflogA} Updating Bio queue count: ${mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/)[1]} -> ${localQueueList.length}`)
						// console.log(`${loglv.debug}${selflog} ${mybio.bio}`)
						let mybioUpdated = mybio.bio.replace(/Worlds in queue[:˸] \d{1,4}/, 'Worlds in queue: ' + localQueueList.length)
						await limiter.req(vrchat.updateUser({ 'path': { 'userId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752' }, 'body': { 'bio': mybioUpdated } }))

						// console.log(`${loglv.debug}${selflog} ${mybioUpdated}`)
						setTimeout(() => { resolve(true) }, 2000)
					} else {
						console.log(`${loglv.info}${selflogA} Bio already contains current queue count`)
						setTimeout(() => { resolve(true) }, 2000)
					}
				}
			} else {
				console.log(`${loglv.info}${selflogA} world queue empty, Skiping`)
				setTimeout(() => { resolve(true) }, 2000)
			}
		})
	})
}

function scanaudit(logoutput, groupID) {
	// console.log(`${loglv.info}${selflog} Scanning through audit log for group ${groupID}`)
	return new Promise((resolve, reject) => {
		if (logoutput == undefined) {
			resolve(false)
		} else if (logoutput.results.length == 0) {
			setTimeout(() => {
				resolve(true)
				// console.log(`${loglv.info}${selflog} Audit Log was Empty for ${groupID}`)
			}, 2_000)
		}
		for (const item in logoutput.results) {
			// fs.appendFile('./output.txt', JSON.stringify(logoutput.results[item]), (err) => { if (err) { console.error(err) } })

		}

		logoutput.results.forEach(async (l, index, arr) => {
			setTimeout(async () => {
				// var fetchedData = {
				//     "actorHookImage": '',
				//     "locationWorldID": '',
				//     "locationName": '',
				//     "locationImageURL": '',
				//     "locationID": '',
				//     "locationType": '',
				//     "locationRegion": '',
				//     "postAuthorName": 'unknown',
				//     "postImage": 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96',
				//     "userPlatform": '',
				//     "userJoinDate": '',
				//     "userAgeVerified": '',
				//     "userTrust": '',
				//     "targetUserPlatform": '',
				//     "targetUserJoinDate": '',
				//     "targetUserAgeVerified": '',
				//     "targetUserTrust": ''
				// }
				var actorHookImage = ''
				var locationWorldID = ''
				var locationName = ''
				var locationImageURL = ''
				var locationID = ''
				var locationType = ''
				var locationRegion = ''
				var postAuthorName = 'unknown'
				var postImage = 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96'
				var userPlatform = ''
				var userJoinDate = ''
				var userAgeVerified = ''
				var userTrust = ''
				var targetUserPlatform = ''
				var targetUserJoinDate = ''
				var targetUserAgeVerified = ''
				var targetUserTrust = ''
				var hasWindowsVersion = false
				var hasAndroidVersion = false
				var hasIOSVersion = false
				var userBadgeYearNum = 0
				if (l.actorId != null) {
					let { data: userData } = await limiter.reqCached('user', l.actorId).catch(async () => {
						return await limiter.req(vrchat.getUser({ path: { userId: l.actorId } }), 'user')
					})
					if (userData.userIcon) {
						actorHookImage = userData.userIcon
						console.log(`Icon Pic ${userData.userIcon}`)
					} else if (userData.profilePicOverrideThumbnail) {
						actorHookImage = userData.profilePicOverride
						console.log(`Profile Pic ${userData.profilePicOverride}`)
					} else {
						actorHookImage = userData.currentAvatarImageUrl
						console.log(`Avatar Pic ${userData.currentAvatarImageUrl}`)
					}

					findHighestBadage = userData.badges
						.filter(e => e.badgeDescription.includes('Joined VRChat'))
						.sort((a, b) => parseInt(b.badgeName.substring(0, 2).trim()) - parseInt(a.badgeName.substring(0, 2).trim()))
					userBadgeYearNum = findHighestBadage.length > 0 ? parseInt(findHighestBadage[0].badgeName.substring(0, 2).trim()) : 0
					if (userBadgeYearNum == 0) {
						console.log(`No year badge found? Falling back on Date Joined`)
						userBadgeYearNum = parseInt(new Date(Date.now() - userData.date_joined.getTime()).toISOString().substring(0, 4) - 1970)
					}

					userPlatform = userData.last_platform
					userJoinDate = userData.date_joined.toISOString().split('T')[0]
					if (userData.ageVerified == true) { userAgeVerified = userData.ageVerificationStatus } else { userAgeVerified = 'False' }
					if (userData.tags.includes('system_trust_veteran')) {
						userTrust = 'Trusted User'
						//                         if( !userData.tags.includes('show_social_rank') ){ userTrust = `${userTrust}
						// *(Hidden)*`}
					}
					else if (userData.tags.includes('system_trust_trusted')) {
						userTrust = 'Known User'
						//                         if( !userData.tags.includes('show_social_rank') ){ userTrust = `${userTrust}
						// *(Hidden)*`}
					}
					else if (userData.tags.includes('system_trust_known')) { userTrust = 'User' }
					else if (userData.tags.includes('system_trust_basic')) { userTrust = 'New User' }
					else { userTrust = 'Visitor' }
				}
				if (l.targetId.includes('usr_')) {
					let { data: userData } = await limiter.reqCached('user', l.targetId).catch(async () => {
						return await limiter.req(vrchat.getUser({ path: { userId: l.targetId } }), 'user')
					})

					targetUserPlatform = userData.last_platform
					targetUserJoinDate = userData.date_joined.toISOString().split('T')[0]
					if (userData.ageVerified == true) { targetUserAgeVerified = userData.ageVerificationStatus } else { targetUserAgeVerified = 'False' }
					if (userData.tags.includes('system_trust_veteran')) {
						targetUserTrust = 'Trusted User'
						//                         if( userData.tags.includes('show_social_rank') == false ){ targetUserTrust = `${targetUserTrust}
						// *(Hidden)*`}
					}
					else if (userData.tags.includes('system_trust_trusted')) {
						targetUserTrust = 'Known User'
						//                         if( userData.tags.includes('show_social_rank') == false ){ targetUserTrust = `${targetUserTrust}
						// *(Hidden)*`}
					}
					else if (userData.tags.includes('system_trust_known')) { targetUserTrust = 'User' }
					else if (userData.tags.includes('system_trust_basic')) { targetUserTrust = 'New User' }
					else { targetUserTrust = 'Visitor' }
				}
				if (l.data.authorId != null) {
					let { data: userData } = await limiter.reqCached('user', l.actorId).catch(async () => {
						return await limiter.req(vrchat.getUser({ path: { userId: l.actorId } }))
					})
					postAuthorName = userData.displayName
				}
				if (l.data.imageId != null) {
					let { data: filedata } = await limiter.reqCached('file', l.data.imageId).catch(async () => {
						return await limiter.req(vrchat.getFile({ path: { fileId: l.data.imageId } }), 'file')
					})
					postImage = filedata != undefined ? filedata.versions[1].file.url : 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96'
				}
				if (l.data.bannerId != null) {
					let { data: filedata } = await limiter.reqCached('file', l.data.bannerId.new).catch(async () => {
						return await limiter.req(vrchat.getFile({ path: { fileId: l.data.bannerId.new } }), 'file')
					})
					postImage = filedata != undefined ? filedata.versions[1].file.url : 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96'
				}
				if (l.targetId.includes('wrld_')) {
					let regex = /(wrld_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}):([0-9]{5})~group\(grp_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}\)~groupAccessType\((members|plus|public)\)(?:~canRequestInvite)?~region\((us|use|eu|jp)\)/
					if (regex.test(l.targetId)) {
						locationWorldID = regex.exec(l.targetId)[1]
						locationID = regex.exec(l.targetId)[2]
						locationType = regex.exec(l.targetId)[3]
						locationRegion = regex.exec(l.targetId)[4].toUpperCase()
						let { data: worldData } = await limiter.reqCached('world', locationWorldID).catch(async () => {
							return await limiter.req(vrchat.getWorld({ 'path': { 'worldId': locationWorldID } }), 'world')
						})
						isWorldUnlisted(locationWorldID, '14anthony7095')
						hasWindowsVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'standalonewindows') != undefined)
						hasAndroidVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'android') != undefined)
						hasIOSVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'ios') != undefined)
						locationName = worldData.name
						locationImageURL = worldData.imageUrl
					}
				} else if (l.data.location != null && l.data.location.includes('wrld_')) {
					let regex = /(wrld_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}):([0-9]{5})~group\(grp_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}\)~groupAccessType\((members|plus|public)\)(?:~canRequestInvite)?~region\((us|use|eu|jp)\)/
					if (regex.test(l.data.location) == true) {
						locationWorldID = regex.exec(l.data.location)[1]
						console.log(locationWorldID)
						locationID = regex.exec(l.data.location)[2]
						locationType = regex.exec(l.data.location)[3]
						locationRegion = regex.exec(l.data.location)[4].toUpperCase()
						let { data: worldData } = await limiter.reqCached('world', locationWorldID).catch(async () => {
							return await limiter.req(vrchat.getWorld({ 'path': { 'worldId': locationWorldID } }), 'world')
						})
						isWorldUnlisted(locationWorldID, '14anthony7095')
						hasWindowsVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'standalonewindows') != undefined)
						hasAndroidVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'android') != undefined)
						hasIOSVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'ios') != undefined)
						console.log(worldData)
						locationName = worldData.name
						locationImageURL = worldData.imageUrl
					}
				}
				console.log(`${l.created_at} ${l.eventType} ${l.actorDisplayName} - ${l.description}`)
				if (groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
					if (l.eventType == 'group.post.create') {
						let img = l.data.imageId == null ? '' : postImage
						groupPostCreate(groupID, l.created_at, l.description.split('post created by ')[1], l.data.title, l.data.text, img, actorHookImage)
					} else if (l.eventType == 'group.instance.create') {
						groupInstanceCreate(groupID, l.created_at, l.actorDisplayName, actorHookImage, locationWorldID, locationID, locationType, locationRegion, locationName, locationImageURL, [hasWindowsVersion, hasAndroidVersion, hasIOSVersion])
					}
				} else if (l.eventType == 'group.post.create') {
					let img = l.data.imageId == null ? '' : postImage
					groupPostCreate(groupID, l.created_at, l.description.split('post created by ')[1], l.data.title, l.data.text, img, actorHookImage)
				} else if (l.eventType == 'group.post.update') {
					groupPostUpdate(groupID, l.created_at, l.actorDisplayName, l.description, l.data.text.new)
				} else if (l.eventType == 'group.post.delete') {
					let img = l.data.imageId == null ? '' : postImage
					groupPostDelete(groupID, l.created_at, actorHookImage, l.description, postAuthorName, l.data.title, l.data.text, img)
				} else if (l.eventType == 'group.member.join') {
					if (l.description.includes('has been added')) {
						// User Quasar300 has been added to the group by 14anthony7095.
						groupMemberJoinAdded(groupID, l.created_at, l.description.split(' has been added')[0].split('User ')[1], l.actorDisplayName, actorHookImage, l.targetId, targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate)
					} else {
						// User Amaih40 has joined the group.
						groupMemberJoin(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.actorId, userPlatform, userTrust, userAgeVerified, userJoinDate)
						switch (groupID) {
							case `grp_4f5d0456-4200-4b2c-8331-78856d1869e4`:
								// 1 Year of VRC Collector
								if (userBadgeYearNum < 1) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								break;
							case `grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233`:
								// 2 Year of VRC Collector
								if (userBadgeYearNum < 2) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 2) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_378c0550-07a1-4cab-aa45-65ad4a817117`:
								// 3 Year of VRC Collector
								if (userBadgeYearNum < 3) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 3) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_378c0550-07a1-4cab-aa45-65ad4a817117' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`:
								// 4 Year of VRC Collector
								if (userBadgeYearNum < 4) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 4) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`:
								// 5 Year of VRC Collector
								if (userBadgeYearNum < 5) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 5) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`:
								// 6 Year of VRC Collector
								if (userBadgeYearNum < 6) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 6) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_5eb28410-68df-4609-b0c5-bc98cf754264`:
								// 7 Year of VRC Collector
								if (userBadgeYearNum < 7) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 7) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_5eb28410-68df-4609-b0c5-bc98cf754264' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_18aa4b68-9118-4716-9a39-42413e54db8c`:
								// 8 Year of VRC Collector
								if (userBadgeYearNum < 8) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 8) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_18aa4b68-9118-4716-9a39-42413e54db8c' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_768a2c3d-b22c-48d2-aae1-650483c347ea`:
								// 9 Year of VRC Collector
								if (userBadgeYearNum < 9) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 9) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_768a2c3d-b22c-48d2-aae1-650483c347ea' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_243d9742-ce05-4fc3-b399-cd436528c432`:
								// 10 Year of VRC Collector
								if (userBadgeYearNum < 10) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 10) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_243d9742-ce05-4fc3-b399-cd436528c432' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							default: break;
						}
					}
				} else if (l.eventType == 'group.member.leave') {
					groupMemberLeave(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.actorId, userPlatform, userTrust, userAgeVerified, userJoinDate)
				} else if (l.eventType == 'group.instance.warn') {
					groupInstanceWarn(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split('instance warn for ')[1], locationWorldID, locationID, locationType, locationRegion, l.targetId, locationName, '', targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate, [hasWindowsVersion, hasAndroidVersion, hasIOSVersion])
				} else if (l.eventType == 'group.instance.kick') {
					groupInstanceKick(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split('instance kick for ')[1], locationWorldID, locationID, locationType, locationRegion, l.targetId, locationName, '', targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate, [hasWindowsVersion, hasAndroidVersion, hasIOSVersion])
				} else if (l.eventType == 'group.member.remove') {
					groupMemberRemove(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' was removed from')[0].split('User ')[1], l.targetId, targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate)
				} else if (l.eventType == 'group.instance.create') {
					groupInstanceCreate(groupID, l.created_at, l.actorDisplayName, actorHookImage, locationWorldID, locationID, locationType, locationRegion, locationName, locationImageURL, [hasWindowsVersion, hasAndroidVersion, hasIOSVersion])
				} else if (l.eventType == 'group.instance.close') {
					groupInstanceClose(groupID, l.created_at, l.actorDisplayName, actorHookImage, locationWorldID, locationID, locationType, locationRegion, locationName, locationImageURL, [hasWindowsVersion, hasAndroidVersion, hasIOSVersion])
				} else if (l.eventType == 'group.user.ban') {
					if (l.description.includes(`preemptively banned`)) {
						groupUserBan(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' was preemptively banned by')[0].split('User ')[1], l.targetId, targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate)
					} else {
						groupUserBan(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' was banned by')[0].split('User ')[1], l.targetId, targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate)
					}
				} else if (l.eventType == 'group.user.unban') {
					groupUserUnban(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' was unbanned by')[0].split('User ')[1], l.targetId)
				} else if (l.eventType == 'group.invite.create') {
					groupInviteCreate(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' has been invited')[0].split('User ')[1], l.targetId, targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate)
				} else if (l.eventType == 'group.invite.cancel') {
					groupInviteCancel(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' has been uninvited')[0].split('User ')[1], l.targetId)
				} else if (l.eventType == 'group.member.user.update') {
					groupMemberUserUpdate(groupID, l.created_at, l.description, JSON.stringify(l.data))
				} else if (l.eventType == 'group.member.role.assign') {
					groupMemberRoleAssign(groupID, l.created_at, l.description, actorHookImage)
				} else if (l.eventType == 'group.member.role.unassign') {
					groupMemberRoleUnassign(groupID, l.created_at, l.description, actorHookImage)
				} else if (l.eventType == 'group.request.create') {
					groupRequestCreate(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.actorId, userPlatform, userTrust, userAgeVerified, userJoinDate)
				} else if (l.eventType == 'group.request.reject') {
					groupRequestReject(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split('has rejected ')[1].split(`'s join request.`)[0], l.targetId)
				} else if (l.eventType == 'group.role.create') {
					var dataOrderText = '???'
					if (l.data.order != undefined) { dataOrderText = l.data.order };
					groupRoleCreate(groupID, l.created_at, l.description, actorHookImage, dataOrderText, l.data.isSelfAssignable, l.data.isAddedOnJoin, l.data.requiresPurchase, l.data.requiresTwoFactor, ` ${JSON.stringify(l.data.permissions)}`)
				} else if (l.eventType == 'group.role.delete') {
					groupRoleDelete(groupID, l.created_at, l.description, actorHookImage, l.data.order, l.data.isSelfAssignable, l.data.isAddedOnJoin, l.data.requiresPurchase, l.data.requiresTwoFactor, l.data.isManagementRole, ` ${JSON.stringify(l.data.permissions)}`)
				} else if (l.eventType == 'group.update') {
					groupUpdate(groupID, l.created_at, l.description)
				} else {
					if (![`grp_4f5d0456-4200-4b2c-8331-78856d1869e4`,
						`grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233`,
						`grp_378c0550-07a1-4cab-aa45-65ad4a817117`,
						`grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`,
						`grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`,
						`grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`,
						`grp_5eb28410-68df-4609-b0c5-bc98cf754264`,
						`grp_18aa4b68-9118-4716-9a39-42413e54db8c`,
						`grp_768a2c3d-b22c-48d2-aae1-650483c347ea`,
						`grp_243d9742-ce05-4fc3-b399-cd436528c432`].includes(groupID)) {
						undiscoveredEvent(groupID, l.created_at, l.eventType, JSON.stringify(l))
						console.log(`${loglv.warn} - ${l.eventType} does not exist yet`)
					}
				}
			}, 10_000 * (arr.length - 1 - index))
			if (index == arr.length - 1) {
				setTimeout(() => {
					resolve(true); console.log(`${loglv.info}${selflogA} Audit Log scan finished for ${groupID}`)
				}, 20_000)
			}
		})
		// const invertedIndex = arr.length - 1 - index;

	})
}


async function eventHeadingToWorld(logOutputLine) {
	clearTimeout(worldHopTimeout)
	worldHopTimeout = null
	clearTimeout(worldHopTimeoutHour)
	worldHopTimeoutHour = null

	var worldID = /wrld_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}/.exec(logOutputLine)[0]
	var groupID = ''
	var ownerID = ''
	var instanceType = ''
	console.log(`${loglv.info}${selflogL} World ID ${worldID}`)
	G_groupMembersVisible = false

	// 2026.01.27 14:20:50 Debug      -  [Behaviour] Destination set: wrld_6c4492e6-a0f2-4fb0-a211-234c573ab7d5:65895~hidden(usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752)~region(use)

	if (logOutputLine.includes(`~group(grp_`)) {
		groupID = /grp_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}/.exec(logOutputLine)[0]
		console.log(`${loglv.info}${selflogL} Group ID ${groupID}`)
		if (logOutputLine.includes(`~groupAccessType(plus)`)) {
			instanceType = `groupPlus`
		} else if (logOutputLine.includes(`~groupAccessType(public)`)) {
			instanceType = `groupPublic`
		} else {
			instanceType = `group`
		}

		// Group Member visibility
		var gotGroup = await limiter.reqCached('group', groupID).catch(async () => {
			return await limiter.req(vrchat.getGroup({ 'path': { 'groupId': groupID } }), 'group')
		})
		if (gotGroup.data.membershipStatus == 'member' || gotGroup.data.privacy == 'default') {
			G_groupMembersVisible = true
		} else {
			console.log(`${loglv.hey}${selflogA} Group is Private and/or you're not a member. [ ${gotGroup.data.privacy} - ${gotGroup.data.membershipStatus}] `)
		}

	} else {
		if (logOutputLine.includes(`~canRequestInvite`)) {
			ownerID = logOutputLine.split(`~private(`)[1].slice(0, 40)
			instanceType = `invitePlus`
		} else if (logOutputLine.includes(`~private(`)) {
			ownerID = logOutputLine.split(`~private(`)[1].slice(0, 40)
			instanceType = `invite`
		} else if (logOutputLine.includes(`~friends(`)) {
			ownerID = logOutputLine.split(`~friends(`)[1].slice(0, 40)
			instanceType = `friends`
		} else if (logOutputLine.includes(`~hidden(`)) {
			ownerID = logOutputLine.split(`~hidden(`)[1].slice(0, 40)
			instanceType = `friendsPlus`
		} else {
			instanceType = `public`
		}
	}


	console.log(`${loglv.debug} [InstanceHistory] Marking instance as Leaving: ${InstanceHistory[0].location}`)
	InstanceHistory[0].leave_timestamp = Date.now()
	InstanceHistory[0].timespentDisplay = new Date(InstanceHistory[1].leave_timestamp - InstanceHistory[1].join_timestamp).toISOString().substring(11, 19)
	InstanceHistory[0].timeSpent = InstanceHistory[1].leave_timestamp - InstanceHistory[1].join_timestamp

	InstanceHistory.unshift({
		'location': 'wrld_' + logOutputLine.split('wrld_')[1],
		'worldID': worldID,
		'groupID': groupID,
		'ownerID': ownerID,
		'instanceType': instanceType,
		'join_timestamp': 0,
		'leave_timestamp': 0,
		'timespentDisplay': 0,
		'timeSpent': 0
	});
	console.log(`${loglv.debug} [InstanceHistory] Adding upcoming instance to history: `, InstanceHistory[0])


	// Get world info for OBS Stream
	let gotWorld = await limiter.reqCached('world', worldID).catch(async () => {
		return await limiter.req(vrchat.getWorld({ 'path': { 'worldId': worldID } }), 'world')
	})
	isWorldUnlisted(worldID, '14anthony7095')
	apiEmitter.emit('fetchedDistThumbnail', gotWorld.data.imageUrl, gotWorld.data.name.slice(0, 50), gotWorld.data.authorName.slice(0, 50), worldID)


	// El Alba starting world
	if (groupID == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad' && worldID == 'wrld_f6445b27-037d-4926-b51f-d79ada716b31') { worldHoppers = [] }
	if (groupID != 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad' && InstanceHistory[1]?.groupID != 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad' && groupID != '') { worldHoppers = [] }


	/*
	// Furality World Auto-Status
	const furalityLocations = {
		'wrld_8583ffb2-35b8-4ef6-adfc-7ccfc4c5449f': `Dealer's Den`,
		'wrld_43917d5e-c6ff-46c8-87e8-c31fd6d9ce3e': `Meetup`,
		'wrld_6cc9b560-4ea2-4677-a401-c8f657c6f871': `Event Stage`,
		'wrld_211f195e-2a56-4e14-bde5-ad0dbce64b1e': `Club F.Y.N.N.`,
		'wrld_ee4143f7-e5b8-496d-9760-7875432258c6': `Lobby`,
		'wrld_2a495d02-6da6-4d3a-be2a-aa3f1a70544a': `Fireworks Show`
	}
	if (InstanceHistory[0].worldID != InstanceHistory[1].worldID) {
		if (furalityLocations[InstanceHistory[0].worldID]) {
			setUserStatus('At Furality: ' + furalityLocations[InstanceHistory[0].worldID])
		} else if (!furalityLocations[InstanceHistory[0].worldID] && furalityLocations[InstanceHistory[1].worldID]) {
			setUserStatus('')
		} else if (InstanceHistory[0].groupID == 'grp_210dbc09-c3da-4ebb-b641-73c99ce2619b') {
			if (gotWorld.data.authorName == 'Furality') {
				setUserStatus('At Furality: ' + gotWorld.data.name)
			} else {
				setUserStatus('At Furality: Gaming')
			}
		}
	}
	*/



	console.log(`${loglv.info}${selflogL} Instance Type ${instanceType}`)

}


function eventJoiningWorld() {
	worldHopTimeout = setTimeout(() => {
		say.speak(`Been in world for too long. Proceed to next in queue`, 'Microsoft David Desktop', 1.0, (err) => {
			if (err) { return console.error(`${loglv.warn}${selflogL} say.js error: ` + err) }
		})
	}, 600_000)
	worldHopTimeoutHour = setTimeout(() => {
		say.speak(`Been in world for over an hour. Find a new world`, 'Microsoft David Desktop', 1.0, (err) => {
			if (err) { return console.error(`${loglv.warn}${selflogL} say.js error: ` + err) }
		})
	}, 3600_000)

	if (cooldownUrl == true) { cooldownUrl = false }

	// console.log(`${loglv.debug}${selflogL} [InstanceHistory]`, InstanceHistory)

	playersInInstance = []
	membersInInstance = []
	playersInstanceObject = []


	if (vrcUserStatusText == 'Watching ' + popcornPalaceMovieTitle.slice(0, 23) && InstanceHistory[0].worldID != 'wrld_266523e8-9161-40da-acd0-6bd82e075833') {
		setUserStatus(``)
	}

}

var currentAccountInUse = { name: process.env["VRC_ACC_NAME_1"], id: process.env["VRC_ACC_ID_1"], Agroup: true }
async function eventPlayerInitialized(logOutputLine) {
	var playerDisplayName = logOutputLine.split('[Behaviour] Initialized player ')[1]

	if (playerDisplayName != undefined) {
		console.log(`${loglv.info}${selflogL} Player Joining: ` + playerDisplayName)
		logEmitter.emit('playerJoin', playerDisplayName)

		playersInInstance.push(playerDisplayName)
		playersInstanceObject.push({ 'name': playerDisplayName })

		playerRatio = playersInInstance.length / playerHardLimit

		if ([`groupPlus`, `groupPublic`].includes(InstanceHistory[0].instanceType)) {
			memberRatio = membersInInstance.length / playersInInstance.length
			console.log(`${loglv.info}${selflogL} There are now ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`)
			process.title = `Instance: ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`
		} else {
			console.log(`${loglv.info}${selflogL} There are now ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${Math.round(playerRatio * 100)}% ]`)
			process.title = `Instance: ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${Math.round(playerRatio * 100)}% ]`
		}

		if (Date.now() > (InstanceHistory[0].join_timestamp + 30000)) { queueInstanceDataBurst() }

		switch (playerDisplayName) {
			case process.env["VRC_ACC_NAME_6"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_6"], id: process.env["VRC_ACC_ID_6"], Agroup: false }
				break;
			case process.env["VRC_ACC_NAME_4"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_4"], id: process.env["VRC_ACC_ID_4"], Agroup: true }
				break;
			case process.env["VRC_ACC_NAME_7"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_7"], id: process.env["VRC_ACC_ID_7"], Agroup: false }
				break;
			case process.env["VRC_ACC_NAME_3"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_3"], id: process.env["VRC_ACC_ID_3"], Agroup: true }
				break;
			case process.env["VRC_ACC_NAME_5"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_5"], id: process.env["VRC_ACC_ID_5"], Agroup: false }
				break;
			case process.env["VRC_ACC_NAME_2"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_2"], id: process.env["VRC_ACC_ID_2"], Agroup: true }
				break;
			case process.env["VRC_ACC_NAME_1"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_1"], id: process.env["VRC_ACC_ID_1"], Agroup: true }
				break;
			case process.env["VRC_ACC_NAME_8"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_8"], id: process.env['VRC_ACC_ID_1'], Agroup: false }
				break;
			default:
				break;
		}
	}
}

var userTrustTableTimer
async function eventPlayerJoin(logOutputLine) {
	var playerDisplayName = logOutputLine.split('[Behaviour] OnPlayerJoined ')[1]

	if (playerDisplayName != undefined) {
		var playerID = /(?:\([0-z]{10}\))|(?:\(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\))/.exec(playerDisplayName)[0].replace(/\(/, '').replace(/\)/, '')

		playerDisplayName = playerDisplayName.replace(/ \(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\)/, '').replace(/ \([0-z]{10}\)/, '')

		// Append UserID to tracked player
		let pioIndex = playersInstanceObject.findIndex(playersInstanceObject => playersInstanceObject.name == playerDisplayName)


		// When I join instance
		if (playerDisplayName == currentAccountInUse.name) {
			logEmitter.emit('joinedworld', InstanceHistory[0].worldID)

			InstanceHistory[0].join_timestamp = Date.now()
			console.log(`${loglv.debug} [InstanceHistory] Loaded into world, appending join Timestamp ${InstanceHistory[0].join_timestamp}`)

			// Remove world from Explore Queue
			fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
				if (data.includes(InstanceHistory[0].worldID) && InstanceHistory[0].worldID != '') {
					fs.writeFile(worldQueueTxt, data.replaceAll(`${InstanceHistory[0].worldID}\r\n`, ''), (err) => {
						if (err) { console.log(err) }
						console.log(`${loglv.debug}${selflogL} ${InstanceHistory[0].worldID} was successfully purged from queue`)
					})
				}
			})

			// Remove joined instance from Joinable Queue
			let isinstanceInJoinableQueue = G_instanceJoinQueue.find(i => i.location == InstanceHistory[0].location)
			if (isinstanceInJoinableQueue != undefined) {
				G_instanceJoinQueue.splice(G_instanceJoinQueue.findIndex(isinstanceInJoinableQueue), 1)
			}

			// Instance History Cleanup
			if (InstanceHistory.length > 2) {
				let ihl = InstanceHistory.length
				InstanceHistory = InstanceHistory.filter((ih, index) => ih.leave_timestamp + 3600_000 > Date.now() || index <= 1)
				console.log(`${loglv.debug} [InstanceHistory] Clearing "gone an hour" instances past index 2 - ${ihl} -> ${InstanceHistory.length}`)
			}

		}

		// Group Member tagging
		function markUserAsMember(I_memberStatus, I_groupName = 'GroupMember', I_addToWorldHop = false) {
			console.log(`${loglv.info}${selflogA} [${I_groupName}] ${I_memberStatus == true ? '💜' : '👻'} ${playerDisplayName} ${I_memberStatus == true ? 'is' : 'NOT a'} member`)

			try { playersInstanceObject[pioIndex].isGroupMember = I_memberStatus } catch (error) {
				console.log(`${loglv.hey}${selflogL} playerTracker Object got Member before PlayerName - ${error}`)
				playersInstanceObject.push({ 'name': playerDisplayName, 'id': playerID, 'isGroupMember': I_memberStatus })
			} finally {
				if (I_addToWorldHop) {
					worldHoppers.push({ "name": playerDisplayName, "id": playerID, "playtime": 0, "joinTime": Date.now(), "groupMember": I_memberStatus })
				}
			}

			membersInInstance = playersInstanceObject.filter(p => p.isGroupMember == true)
			memberRatio = membersInInstance.length / playersInInstance.length
			playerRatio = playersInInstance.length / playerHardLimit
			console.log(`${loglv.info}${selflogA} There are now ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`)
			process.title = `Instance: ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`
		}


		if (InstanceHistory[0].groupID == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad') {

			var gotUserGroups = await limiter.reqCached('userGroups', playerID).catch(async () => {
				return await limiter.req(vrchat.getUserGroups({ 'path': { 'userId': playerID } }), 'userGroups', playerID)
			})

			if (gotUserGroups.data.find(g => g.groupId == InstanceHistory[0].groupID) == undefined) {
				markUserAsMember(false, 'ElAlba', true)
			} else { markUserAsMember(true, 'ElAlba', true) }

		} else if (InstanceHistory[0].groupID == 'grp_c24efb98-3234-4060-94f1-7729523e9689') {

			var gotUserGroups = await limiter.reqCached('userGroups', playerID).catch(async () => {
				return await limiter.req(vrchat.getUserGroups({ 'path': { 'userId': playerID } }), 'userGroups', playerID)
			})

			if (gotUserGroups.data.find(g => g.groupId == InstanceHistory[0].groupID) == undefined) {
				markUserAsMember(false, 'CommunityMeetup', true)
			} else { markUserAsMember(true, 'CommunityMeetup', true) }

		} else if (InstanceHistory[0].groupID != '' && G_groupMembersVisible == true) {

			var gotUserGroups = await limiter.reqCached('userGroups', playerID).catch(async () => {
				return await limiter.req(vrchat.getUserGroups({ 'path': { 'userId': playerID } }), 'userGroups', playerID)
			})

			if (gotUserGroups.data.find(g => g.groupId == InstanceHistory[0].groupID) == undefined) {
				markUserAsMember(false)
			} else { markUserAsMember(true) }

		}


		// POSSIBLY HEAVY ON API CALLS
		// var ttt = await vrchat.getUser({ 'path': { 'userId': playerID } })
		// ttt.data.last_platform ==
		var gotUser = await limiter.reqCached('user', playerID).catch(async () => {
			return await limiter.req(vrchat.getUser({ 'path': { 'userId': playerID } }), 'user')
		})
		if (gotUser != undefined) {
			var userCachePlatform = gotUser.data.platform == 'offline' ? gotUser.data.last_platform : gotUser.data.platform
			var userCachePlatformLog = userCachePlatform == 'android' ? '🍏 Android' :
				userCachePlatform == 'ios' ? '📱 iOS    ' :
					'🖥️ PC     '

			var userCacheStatus = gotUser.data.status
			var userCacheStatusLog = gotUser.data.status == 'join me' ? '🔵 Join Me' :
				gotUser.data.status == 'busy' ? '🔴 Busy' :
					gotUser.data.status == 'ask me' ? '🟠 Ask Me' :
						'🟢 Active'

			var userCacheTrust = gotUser.data.tags.includes('system_trust_veteran') ? ['🟪 Trusted User', 'Trusted User'] :
				gotUser.data.tags.includes('system_trust_trusted') ? ['🟧 Known User  ', 'Known User'] :
					gotUser.data.tags.includes('system_trust_known') ? ['🟩 User        ', 'User'] :
						gotUser.data.tags.includes('system_trust_basic') ? ['🟦 New User    ', 'New User'] :
							['👻 Visitor     ', 'Visitor']

			console.log(`${loglv.info}${selflogA} [User] ${loglv.true}${playerDisplayName.replace(/[^\x20-\x7E]/g, "?").padEnd(20, ' ').slice(0, 20)}${loglv.reset} is a ${userCacheTrust[0]} on ${userCachePlatformLog} set to ${userCacheStatusLog}`)
			// console.log(`${loglv.info}${selflogA} [User] ${loglv.true}${playerDisplayName.replace(/[^\x00-\x7F]/g, "?").padEnd(20,' ').slice(0,20)}${loglv.reset} is a ${userCacheTrust[0]} on ${userCachePlatformLog} set to ${userCacheStatusLog}`)

			try {
				playersInstanceObject[pioIndex].platform = userCachePlatform || 'standalonewindows'
				playersInstanceObject[pioIndex].status = userCacheStatus
				playersInstanceObject[pioIndex].trust = userCacheTrust[1]
			} catch (err) {
				console.log(`${loglv.hey}${selflogL} playerTrackerObject - ${err}`)
				playersInstanceObject.push({
					'name': playerDisplayName, 'id': playerID, 'platform': userCachePlatform || 'standalonewindows', 'status': userCacheStatus, 'trust': userCacheTrust[1]
				})
			}

			clearTimeout(userTrustTableTimer)
			userTrustTableTimer = setTimeout(() => { requestUserTrustTable() }, 10000);

		}


		try {
			playersInstanceObject[pioIndex].id = playerID
		} catch (error) {
			console.log(`${loglv.hey}${selflogL} playerTracker Object got UserID before PlayerName - ${error}`)
			playersInstanceObject.push({ 'name': playerDisplayName, 'id': playerID })
		}

	}
}

function eventPlayerLeft(logOutputLine) {
	var playerDisplayName = logOutputLine.split('[Behaviour] OnPlayerLeft ')[1]

	if (playerDisplayName != undefined || playerDisplayName != null) {
		// var playerID = /(?:\([0-z]{10}\))|(?:\(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\))/.exec(playerDisplayName)[0]

		playerDisplayName = playerDisplayName.replace(/ \(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\)/, '').replace(/ \([0-z]{10}\)/, '')
		console.log(`${loglv.info}${selflogL} Player Left: ` + playerDisplayName)

		playersInInstance = playersInInstance.filter(name => name != playerDisplayName)
		playersInstanceObject = playersInstanceObject.filter(playersInstanceObject => playersInstanceObject.name !== playerDisplayName)
		playerRatio = playersInInstance.length / playerHardLimit

		if (Date.now() > (InstanceHistory[0].join_timestamp + 30000) && worldHopTimeout != null) { queueInstanceDataBurst() }


		if ([`groupPlus`, `groupPublic`].includes(InstanceHistory[0].instanceType)) {
			membersInInstance = playersInstanceObject.filter(p => p.isGroupMember == true)
			memberRatio = membersInInstance.length / playersInInstance.length
			console.log(`${loglv.info}${selflogL} There are now ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`)
			process.title = `Instance: ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`
		} else {
			console.log(`${loglv.info}${selflogL} There are now ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${Math.round(playerRatio * 100)}% ]`)
			process.title = `Instance: ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${Math.round(playerRatio * 100)}% ]`
		}
		// logEmitter.emit('playerLeft', playerDisplayName, playerID, playersInInstance)

		// El Alba starting world
		if (InstanceHistory[0].groupID == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad') {
			var filteredhoppers = worldHoppers.find(a => a.name == playerDisplayName)
			if (filteredhoppers != undefined) {
				var foundindex = worldHoppers.findIndex(a => a.name == playerDisplayName)
				console.debug(worldHoppers[foundindex]["playtime"])
				console.debug(worldHoppers[foundindex]["joinTime"])
				console.debug(Date.now() - worldHoppers[foundindex]["joinTime"])
				worldHoppers[foundindex]["playtime"] += Date.now() - worldHoppers[foundindex]["joinTime"]
			} else {
				console.log(`${loglv.hey}${selflogL} [WorldHoppers] Skipping undetected join`)
			}
		}


		// When I leave instance
		if (playerDisplayName == currentAccountInUse.name) {
			clearTimeout(worldHopTimeout)
			clearTimeout(loadingAvatarTimer)
			clearTimeout(userTrustTableTimer)
			userTrustTableTimer = null
			loadingAvatarTimer = null
			worldHopTimeout = null
			cooldownUrl = true

			if (G_InstanceClosed == true) {
				G_InstanceClosed = false
				if (vrcUserStatusText != `Exploring World Queue`) {
					vrcUserStatusText = ``
					setUserStatus('')
				}
			}


			oscSend('/avatar/parameters/log/instance_closed', false)
			tonAvgStartWait = []
			let buildLog = `${loglv.info}${selflogL}`
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

function eventInstanceClosed() {
	if (InstanceHistory[0].worldID != 'wrld_6c4492e6-a0f2-4fb0-a211-234c573ab7d5' && InstanceHistory[0].groupID != 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {

		vrcUserStatusText = 'Instance is closed'
		setUserStatus('Instance is closed')

	} else if (InstanceHistory[0].groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
		if (vrcUserStatusText != `Exploring World Queue`) {
			vrcUserStatusText = `Exploring World Queue`
			setUserStatus(`Exploring World Queue`)
		}
		inviteLocalQueue(G_autoNextWorldHop)

	}

	G_InstanceClosed = true
	oscSend('/avatar/parameters/log/instance_closed', true)

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
					vrcUserStatusText = `Instance Reset in ${remainingTime}`
					setUserStatus(`Instance Reset in ${remainingTime}`)
					G_InstanceClosed = true
					oscSend('/avatar/parameters/log/instance_closed', true)
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






// async function enqueueUserDataFetch(I_userID) {
//     let gotuser = await limiter.req(vrchat.getUser({ 'path': { 'userId': I_userID } }))

//     gotuser.data.id
// }



function eventPlayerAvatarSwitch(logOutputLine) {
	let playerswitching = logOutputLine.split(`Switching `)[1].split(`to avatar `)[0].trim()
	let avatarswitchedto = logOutputLine.split(`to avatar `)[1].trim()

	console.log(`${loglv.info}${selflogL} [AvatarChange]: ${playerswitching} switching to (${avatarswitchedto})`)

	clearTimeout(loadingAvatarTimer)
	loadingAvatarTimer = setTimeout(() => {
		logEmitter.emit('avatarQueueFinish', true)
	}, 10000);
}


function eventAssetDownload(logOutputLine) {
	var assetbundlelog = logOutputLine.split(`[AssetBundleDownloadManager] `)[1]
	// console.log(`${loglv.info}${selflog} [AssetBundleDownloadManager]: ${assetbundlelog}`)

	if (assetbundlelog.includes('Unpacking Avatar')) {
		// console.log(`${loglv.info}${selflog} [AssetBundle]: ${assetbundlelog}`)
		// [AssetBundle]: [593] Unpacking Avatar (Alula v3․48 Basic by 14anthony7095)
		let avatarswitchedto = assetbundlelog.split('Unpacking Avatar (')[1].split(' by ')[0]
		let avatarauthor = assetbundlelog.split('Unpacking Avatar (')[1].split(' by ')[1].slice(0, -1)

		clearTimeout(loadingAvatarTimer)
		loadingAvatarTimer = setTimeout(() => {
			logEmitter.emit('avatarQueueFinish', true)
		}, 10000);
	}

	if (assetbundlelog.includes('Starting download of')) {
		let dlqueue = parseInt(logOutputLine.split(', ')[1].split(' ')[0].trim())
		if (dlqueue >= 1) {
			console.log(`${loglv.info}${selflogL} [AssetBundle]: Download Queue: ${dlqueue}`)
		}
	}
}



var cooldownUrl = false
function videoUrlResolver(videourl) {
	if (lastVideoURL === videourl) { console.log(`${loglv.info}${selflogL} Skipping url, already been displayed.`); return }
	if (seenVideoURLs.includes(videourl)) { console.log(`${loglv.info}${selflogL} Skipping url, is in seen list.`); return }
	if (videourl.includes('media.cdn.furality')) { console.log(`${loglv.info}${selflogL} Skipping url, Furality Content network.`); return }
	/*
	console.log(`${loglv.debug}${selflog}\n	OLD= ${lastVideoURL}\n	NEW= ${videourl}`)
	console.log(`${loglv.debug}${selflog} IS EQUAL? ${lastVideoURL === videourl}`)
	console.log(`${loglv.debug}${selflog} Stringifiy ${JSON.stringify(videourl)}`)
	*/
	lastVideoURL = videourl
	seenVideoURLs.push(videourl)

	if (cooldownUrl == true) { console.log(`${loglv.info}${selflogL} Skipping url, forcing Ratelimit`); return }

	cooldownUrl = true
	setTimeout(() => { cooldownUrl = false }, 5000);

	//	--- Print Video URL ---
	console.log(`${loglv.info}${selflogL} Video URL: ${videourl}`)
	if (ChatVideoURL == true && currentAccountInUse['Agroup'] == true) { oscChatBoxV2(`~VideoURL:\v${fitChars(videourl, 3)}`, 5000, true, true) }

	//	---	Twitch Channel URL Resolver	---
	if (videourl.includes('twitch.tv/') && !videourl.includes('twitch.tv/videos')) {
		//oscSend('/avatar/parameters/ttvEnabled', 1 )
		if (ttvFetchFrom == 1) { switchChannel(videourl.split('twitch.tv/')[1]) }
		if (urlType != 'twitch') {
			console.log(`${loglv.info}${selflogL} Video URL Type set to "Twitch"`)
			urlType = 'twitch'
		}
	}


	//	---	Youtube Title Resolver	---
	if (videourl.includes('youtube.com/')) {
		videourl = 'http://www.youtube.com/' + videourl.split('youtube.com/')[1].split(' ')[0]
	} else if (videourl.includes('youtu.be/')) {
		videourl = 'http://www.youtube.com/watch?v=' + videourl.split('youtu.be/')[1].split(' ')[0]
	}

	var isValidateYTurl = ytdl.validateURL(videourl)
	//console.log(`${loglv.debug}${selflog} yt-dl is validate url? ${isValidateYTurl}`)

	if (isValidateYTurl == true) {
		//if( ttvAlwaysRun == false ){ oscSend('/avatar/parameters/ttvEnabled', 0 ) }

		if (urlType != 'youtube') {
			console.log(`${loglv.info}${selflogL} Video URL Type set to "Youtube"`)
			urlType = 'youtube'
			if (ttvFetchFrom == 1) { switchChannel(process.env["VRC_ACC_NAME_1"]) }
		}
		ytdl.getBasicInfo(videourl)
			.then((data) => {
				setTimeout(() => {
					console.log(`${loglv.info}${selflogL} Video Title: ${data.videoDetails.title}`)
					if (ChatVideoTitle == true && currentAccountInUse['Agroup'] == true) { oscChatBoxV2(`~VideoTitle:\v${fitChars(data.videoDetails.title, 3)}`, 2000, true, true) }
				}, 2000)
			})
			.catch((err) => {
				console.log(`${loglv.warn}${selflogL} Youtube-dl: ${err}`)
				if (ChatVideoURL == true && currentAccountInUse['Agroup'] == true) { oscChatBoxV2(`~${err}`, 2000, true, true, false, false, false) }
			})
	}
}


function worldDownloadProgress(dlduration, dlprogress) {
	var dlETAtotal = 0
	var crossmulti;
	try {
		crossmulti = dlduration * 100
		try { dlETAtotal = Math.floor(crossmulti / whole) }
		catch { dlETAtotal = Math.floor(crossmulti / dlprogress) }
	} catch {
		crossmulti = whole * dlprogress
		dlETAtotal = Math.floor(crossmulti / 100)
	}

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
	console.log(`${loglv.info}${selflogL} World Download ETA ${dlETA}`);
	say.speak(`E T A ${dlETA}`, 'Microsoft Zira Desktop', 1.0, (err) => {
		if (err) { return console.error(`${loglv.warn}${selflogL} say.js error: ` + err) }
		setTimeout(() => {
			isTalking = false
		}, 1000)
	})
}