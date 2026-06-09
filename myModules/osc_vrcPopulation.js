/*
-------------------------------------

	VRChat Population

-------------------------------------
*/
//	--	Libraries	--
var { loglv, playerCounter } = require('./config.js');
const { oscSend, oscEmitter, OSCDataBurst, getOSCDataBurstState } = require('./Interface_osc_v1.js');
const { getVisitsCount, apiEmitter, logEmitter, getVrchatRunning } = require('./Interface_vrc-ApiLog.cjs');

//	--	Global Vars	--
let selflog = `\x1b[0m[\x1b[36mCounter\x1b[0m]`
var displayMode = 'off'
var counterTimer
var lastUserCountTimeStamp = 0

console.log(`${loglv.info}${selflog} Loaded -> ${loglv.bool(playerCounter)}${playerCounter}${loglv.reset}`)

var displayValue = 0
function updateDisplay() {
	OSCDataBurst(13, parseFloat(displayMode == 'players' ? 0 : 1)) // Display Mode label
	workload(displayValue)

	setTimeout(() => { updateDisplay() }, 5_000);
}
updateDisplay()


async function useOnlinePlayerCount() {
	if (displayMode != 'players') {
		console.log(`${loglv.info}${selflog} Mode: PlayerCount`)
		displayMode = 'players'

		counterTimer = setInterval(async () => {
			var count = await getVisitsCount()
			if (count != undefined && count != 0) {
				if (Date.now() > lastUserCountTimeStamp + 10_000) {
					lastUserCountTimeStamp = Date.now()
					displayValue = count
				}
			} else {
				lastUserCountTimeStamp = Date.now()
				workload(0, 'Lost Connection')
			}

		}, 5_000)
	}
}
useOnlinePlayerCount()



apiEmitter.on('exploreQueue', (data, type) => {
	// Switch back to Population
	if (data == undefined) {
		useOnlinePlayerCount()

	// Switch to Explore Queue
	} else if (data >= 0) {
		displayValue = data
		if (displayMode != 'worlds') {
			console.log(`${loglv.info}${selflog} Mode: World Queue`)
			displayMode = 'worlds'

			clearInterval(counterTimer)
			counterTimer = null
		}

	}
})

logEmitter.on('gameclose', () => {
	setTimeout(() => {
		if (displayMode == 'worlds') {
			useOnlinePlayerCount()
			clearInterval(worldTimer)
			worldTimer = null
		}
	}, 60000);
})



async function workload(playerCount) {
	// BUFFER COST 6
	if (getOSCDataBurstState() != 'overloaded' && getVrchatRunning() == true) {
		let digitSeg = playerCount.toString().padStart(6, '0')
		let digitLen = playerCount.toString().length
		digitLen == 6 ? OSCDataBurst(1, parseInt(digitSeg[0]) / 10) : OSCDataBurst(1, parseFloat(1))
		digitLen >= 5 ? OSCDataBurst(2, parseInt(digitSeg[1]) / 10) : OSCDataBurst(2, parseFloat(1))
		digitLen >= 4 ? OSCDataBurst(3, parseInt(digitSeg[2]) / 10) : OSCDataBurst(3, parseFloat(1))
		digitLen >= 3 ? OSCDataBurst(4, parseInt(digitSeg[3]) / 10) : OSCDataBurst(4, parseFloat(1))
		digitLen >= 2 ? OSCDataBurst(5, parseInt(digitSeg[4]) / 10) : OSCDataBurst(5, parseFloat(1))
		digitLen >= 1 ? OSCDataBurst(6, parseInt(digitSeg[5]) / 10) : OSCDataBurst(6, parseFloat(1))
	}
	/* 	
VRO: 1 2 3 4 5 6
INS: 7 8 / 9 10
INF: 11 %
	
ADDR	Int 0-255
DATA	Int 0-255 (remap to -1 to 1 Float)
	
Int Double DATA handling
  _0 = 0
  _1 = 1
  _9 = 9
  10 = 10
  11 = 11
  99 = 99
  00 = 100
  01 = 101
  09 = 109  
  0_ = 200
  9_ = 209
  __ = 255
 */
}