/*
-------------------------------------

		Master Config List

-------------------------------------
*/

// TODO: make config watched for changes and emit to other modules to fetch changes via a function-return

require('dotenv').config({ 'quiet': true })

// ---	OSC Dependant	---
// Quest 2 related
exports.QuestIP = "192.168.2.140" // Work

// Log OSC travel
exports.logOscIn = false  // from VRChat
exports.logOscOut = false  // to VRChat

// Log and Download Stickers
exports.logStickers = true
exports.downloadStickers = false

// Use Avatar Ping System?
exports.avatarPingSystem = true

// Allow VRChat to be force closed?
exports.vrckiller = true

// ---	ChatBox Dependant	---
// Allow Chatbox use?
exports.useChatBox = true

// Keep track of AFK minutes
exports.afkclock = false

// Allow Twitch Chat in ChatBox
// == ttvChatBox

// Videoplayer URL in Chatbox
var ChatVideoURL = false
var ChatVideoTitle = false

// Image and String Download URL in Chatbox
exports.ChatImageStringURL = false

// Average Download Speed
exports.ChatDownSpeed = false


// ---	VRChat API Dependant	---
// Use Auth-based Api
exports.useVrcApi = true
exports.vrcUserAgent = process.env["VRC_USER_AGENT"] + '/' + process.env["CONTACT_EMAIL"]

// Use Player Counter?
exports.playerCounter = true
exports.graphTimeRangeMinutes = 5

// --- WebSocket Dependant	---
// Use Invite Detection?
exports.inviteDetection = true // Unused?


// ---	Log File Dependant	---
// Print VRC LOG to console
exports.printAllLogs = false

// Twitch Channel from videoplayer
// == ttvVideoPlayer

// Videoplayer URL in Chatbox
exports.ChatVideoURL = ChatVideoURL
exports.ChatVideoTitle = ChatVideoTitle


// ---	Twitch Related	---
// Message Queue Mode
// [0] Disable	[1] Cheers	[2] Latest	[3] Buffer
let ttvlevel = 3

// Watched channels at start up
let ttvchans = ['14anthony7095']

// Monitor twitch chat without Twitch Follower being Active
exports.ttvAlwaysRun = true

// Fetch Twitch Chat from?
// [0] None  [1] Videoplayers  [2] Users
exports.ttvFetchFrom = 0
// TODO: Don't force enable Twitch Follower unless a message is received from someone's chat while in "Users" mode

// Allow Twitch Chat in ChatBox
exports.ttvChatBox = false

// Filter SaltyBet chat messages to only bots
exports.saltyMode = false



process.title = `14anthony7095 OSC Multi-Interface`

/*
	Internal stuff for Logging
*/
class loglv2 {
	#terminalTime = 0
	get time() { return new Date(process.uptime() * 1000).toISOString().substring(11, 19) }
	/* 
		Reset = "\x1b[0m"
		Bright = "\x1b[1m"
		Dim = "\x1b[2m"
		Underscore = "\x1b[4m"
		Blink = "\x1b[5m"
		Reverse = "\x1b[7m"
		Hidden = "\x1b[8m"

		FgBlack = "\x1b[30m"
		FgRed = "\x1b[31m"
		FgGreen = "\x1b[32m"
		FgYellow = "\x1b[33m"
		FgBlue = "\x1b[34m"
		FgMagenta = "\x1b[35m"
		FgCyan = "\x1b[36m"
		FgWhite = "\x1b[37m"

		BgBlack = "\x1b[40m"
		BgRed = "\x1b[41m"
		BgGreen = "\x1b[42m"
		BgYellow = "\x1b[43m"
		BgBlue = "\x1b[44m"
		BgMagenta = "\x1b[45m"
		BgCyan = "\x1b[46m"
		BgWhite = "\x1b[47m"
	 */
	get debug() { return `\x1b[0m${this.time} \x1b[4mDebug\x1b[0m ` }
	get info() { return `\x1b[0m${this.time} \x1b[36mInfo\x1b[0m  ` }
	get hey() { return `\x1b[0m${this.time} \x1b[33mHEY\x1b[0m   ` }
	get warn() { return `\x1b[0m${this.time} \x1b[31mWarn\x1b[0m  ` }
	get error() { return `\x1b[0m${this.time} \x1b[31m\x1b[5mERROR\x1b[0m ` }

	get true() { return `\x1b[32m` }
	get false() { return `\x1b[31m` }
	get reset() { return `\x1b[0m` }
	bool(bool) { return bool == true ? `\x1b[32m` : `\x1b[31m` }
}
exports.loglv = new loglv2()


exports.msgVerbose = ttvlevel
if (ttvlevel == 0) {
	exports.twitchChannels = [`14anthony7095`]
} else {
	exports.twitchChannels = ttvchans
}