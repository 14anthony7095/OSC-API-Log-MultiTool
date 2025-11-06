var config = require('./config.js')
var oscm = require('./oscManager.js');
let selflog = `\x1b[0m(AutoClicker\x1b[0m)`
console.log(`${config.ll(2)}${selflog} Loaded`)

var autoClock;
function click(){
	oscm.oscSend('/input/UseRight',1)
	setTimeout(()=>{ oscm.oscSend('/input/UseRight', 0) },10)
}
function startAutoClicker(){
	autoClock = setInterval(()=>{
		click()
	},20)
}
oscm.oscdata.on('oscdata', (data) => {
	if( data.address == '/avatar/parameters/rightHand' && data.value == 1 ){
		startAutoClicker()
	}
	if( data.address == '/avatar/parameters/rightHand' && data.value != 1 ){
		clearInterval(autoClock)
	}
})