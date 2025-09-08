/*
-------------------------------------

	What all does this module do?
Send "ping" parameter every 3sec

-------------------------------------
*/
//	--	Libraries	--
var config = require('./config.js')
const { loglv } = require('./config.js')
const { oscSend } = require('./Interface_osc_v1.js');

//	--	On Load	--
let selfLog = `\x1b[0m[AvatarPingSystem\x1b[0m]`
console.log(`${loglv().log}${selfLog} Loaded -> ${loglv(config.avatarPingSystem)}${config.avatarPingSystem}${loglv().reset}`)

console.log(`${loglv().log}${selfLog} Starting..`)
setInterval(()=>{
	oscSend('/avatar/parameters/ping', true )
	setTimeout(()=>{
		oscSend('/avatar/parameters/ping', false )
	},1000)
},2000)