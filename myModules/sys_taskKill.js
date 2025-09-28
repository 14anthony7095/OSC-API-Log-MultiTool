/*
-------------------------------------

	What all does this module do?
finds the PID of vrchat.exe (retries if wasn't running)
taskkills vrchat.exe when using the "Die" emote
kill vrchat function with a timer in secs

-------------------------------------
*/
//	--	Libraries	--
const { loglv, vrckiller } = require('./config.js')
const { isFullLaunch } = require('../index.js');
const { oscEmitter, oscSend, oscChatBox } = require('./Interface_osc_v1.js');
const find = require('find-process');
const { fetchLogFile, logEmitter } = require('./Interface_vrc-Log.js');

//	--	Global Vars	--
let selfLog = `\x1b[0m[\x1b[31mTaskKiller\x1b[0m]`
var vrchatprocessid = null

//	--	On Load	--
console.log(`${loglv().log}${selfLog} Loaded -> ${loglv(vrckiller)}${vrckiller}${loglv().reset}`)
killprep()

//	--	Functions	--
function killprep() {
	console.log(`${loglv().log}${selfLog} Looking up VRChat's process ID`)
	find('name', "VRChat.exe", true).then((list, err) => {
		if (err) console.error(err);
		// if (list.length > 1) {
		// 	console.log(`${loglv().log}${selfLog} VRChat's process ID is ${list[0].pid}`)
		// 	vrchatprocessidArr
		// 	for (let x = 0; x < list.length; x++) {
		// 		list[x].pid
		// 	}
		// 	vrchatprocessidArr = list[0].pid
		// 	//setTimeout(()=>{ fetchLogFile() },60_000)
		// 	if (isFullLaunch == true) { require('./bedtimeProtocol.js') }
		// }
		if (list.length > 0) {
			console.log(`${loglv().log}${selfLog} VRChat's process ID is ${list[0].pid}`)
			vrchatprocessid = list[0].pid
			//setTimeout(()=>{ fetchLogFile() },60_000)
			if (isFullLaunch == true) { require('./bedtimeProtocol.js') }
		} else {
			console.log(`${loglv().hey}${selfLog} VRChat not running.. Will check again when avatar change is detected`)
		}
	})
}
function killvrc(delay) {
	if (vrckiller == false) {
		console.log(`${loglv().hey}${selfLog} vrckiller is currently disabled. Attempted delay ${delay}sec`)
		return;
	}

	console.log(`${loglv().warn}${selfLog} Death in ${delay}sec`)
	setTimeout(() => {
		console.log(`${loglv().warn}${selfLog} Killing process ${vrchatprocessid} (VRChat.exe)`)
		try { process.kill(vrchatprocessid) } catch (e) { console.log(e) }
		console.log(`${loglv().log}${selfLog} Resetting process ID target to NULL`)
		vrchatprocessid = null
	}, delay * 1000)
}
exports.killvrc = killvrc;
exports.killprep = killprep;

logEmitter.on('playerJoin', playername => {
	//playername == 'Snake Dog' ? killvrc(1) : ''
})

oscEmitter.on('osc', (address, value) => {
	if (address == '/avatar/change' && vrchatprocessid == null) {
		killprep()
		fetchLogFile()
	} else if (address == '/avatar/change' && vrchatprocessid != null) {
		try {
			process.kill(vrchatprocessid, 0) // Does process still exist?
		}
		catch (e) {
			killprep()
			fetchLogFile()
		}
	}
	if (vrckiller == true) {
		// exitGame
		if (address == '/avatar/parameters/VRCEmote' && value == 96) {
			killvrc(1)
		}
	}
});