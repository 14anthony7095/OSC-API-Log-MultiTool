var JZZ = require('jzz');

// function lerp(start, end, factor) { return start + (end - start) * factor; }

async function playNote(chan, num, vel) {
	var port = await JZZ().openMidiOut('LoopBe Internal MIDI');
	port.control(chan, num, vel)
}
exports.playNote = playNote;



// setInterval(() => {
// 	console.log('keep alive')
// }, 30000);