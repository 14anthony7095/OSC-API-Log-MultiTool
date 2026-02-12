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
const { oscEmitter } = require('./Interface_osc_v1.js');
const find = require('find-process');
const { fetchLogFile, eventGameClose } = require('./Interface_vrc-Log.js');

//	--	Global Vars	--
let selflog = `\x1b[0m[\x1b[31mTaskKiller\x1b[0m]`
var vrchatprocessid = null

//	--	On Load	--
console.log(`${loglv().log}${selflog} Loaded -> ${loglv(vrckiller)}${vrckiller}${loglv().reset}`)
killprep()

//	--	Functions	--
async function killprep() {
	return new Promise((resolve, reject) => {
		console.log(`${loglv().log}${selflog} Looking up VRChat's process ID`)
		find('name', "VRChat.exe", true).then((list, err) => {
			if (err) console.error(err);
			// if (list.length > 1) {
			// 	console.log(`${loglv().log}${selflog} VRChat's process ID is ${list[0].pid}`)
			// 	vrchatprocessidArr
			// 	for (let x = 0; x < list.length; x++) {
			// 		list[x].pid
			// 	}
			// 	vrchatprocessidArr = list[0].pid
			// 	//setTimeout(()=>{ fetchLogFile() },60_000)
			// }
			if (list.length > 0) {
				console.log(`${loglv().log}${selflog} VRChat's process ID is ${list[0].pid}`)
				vrchatprocessid = list[0].pid
				resolve(true)
				//setTimeout(()=>{ fetchLogFile() },60_000)
				require('./bedtimeProtocol.js')
			} else {
				console.log(`${loglv().hey}${selflog} VRChat not running.. Will check again when avatar change is detected`)
				resolve(false)
			}
		})
	})
}
function killvrc(delay) {
	if (vrckiller == false) {
		console.log(`${loglv().hey}${selflog} vrckiller is currently disabled. Attempted delay ${delay}sec`)
		return;
	}

	console.log(`${loglv().warn}${selflog} Death in ${delay}sec`)
	setTimeout(() => {
		console.log(`${loglv().warn}${selflog} Killing process ${vrchatprocessid} (VRChat.exe)`)
		try { process.kill(vrchatprocessid) } catch (e) { console.log(e) }
		console.log(`${loglv().log}${selflog} Resetting process ID target to NULL`)
		vrchatprocessid = null
		eventGameClose()
	}, delay * 1000)
}
exports.killvrc = killvrc;
exports.killprep = killprep;

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