var { QuestIP } = require('./myModules/config.js');

require('child_process').exec('ping -n 1 '+QuestIP, (err, stdout, stderr) => {
	if(err){
		console.log(`\x1b[41m\x1b[5m\x1b[37m[Warning]\x1b[0m ${err.cmd}, killed:${err.killed}, code:${err.code}, signal:${err.signal}`)
		console.log(`\x1b[0m[Log\x1b[0m] Quest found: False, no ping data`)
		onQuest2 = false
	}else{
		console.log(`\x1b[0m[Log\x1b[0m] Quest found: ${!stdout.includes('Destination host unreachable.')}`)
		onQuest2 = stdout.includes('Reply from '+QuestIP)
	}
	
	exports.onQuest2 = onQuest2
	if( onQuest2 == true ){
		exports.deviceIP = QuestIP;
		require('./myModules/Interface_osc_v1.js')
	}else{
		exports.deviceIP = '127.0.0.1'
		require('./myModules/Interface_osc_v1.js')
	}
})

if( process.argv.slice(2)[0] == 'full-launch' ){
	exports.isFullLaunch = true;
}