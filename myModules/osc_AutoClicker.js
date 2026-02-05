const { oscEmitter,oscSend } = require("./Interface_osc_v1");

var autoClick;
oscEmitter.on('osc', (address, value) => {
	if( address == '/avatar/parameters/rightHand' && value == 1 ){
		oscSend('/input/UseRight',0)
		   autoClick = setInterval(() => {
			oscSend('/input/UseRight',1)
			setTimeout(() => {
				oscSend('/input/UseRight',0)
			}, 10);
		}, 50);
	   }else if( address == '/avatar/parameters/rightHand' && value != 1 ){
		   clearInterval(autoClick)
		   autoClick = null
	   }
})