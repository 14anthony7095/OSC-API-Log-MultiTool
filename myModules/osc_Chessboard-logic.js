const { cmdEmitter } = require('./input.js');
const { OSCDataBurst, oscEmitter } = require('./Interface_osc_v1.js');
let selflog = `\x1b[0m[\x1b[33mChess\x1b[0m]`


// Global Functions
function XYToSpaceID(X,Y){
	if(X>=9|X<=0){return 0} // OverFlowed
	if(Y>=9|Y<=0){return 0} // OverFlowed
	
	if( Y >= 2 ){
		return (Y-1) * 8 + X
	}else if( Y == 1 ){
		return X
	}
}

// User Input Grid
var cursorX = 1 // Left -> Right
var cursorY = 1 // Top -> Bottom
var cursorXtouch = false
var cursorYtouch = false
var cursorXlast = 0
var cursorYlast = 0
const addrpath = '/avatar/parameters/chess'
oscEmitter.on('osc',(address,value)=>{
	if( address == addrpath+'A' && value == true ){ cursorX = 1 }
	if( address == addrpath+'B' && value == true ){ cursorX = 2 }
	if( address == addrpath+'C' && value == true ){ cursorX = 3 }
	if( address == addrpath+'D' && value == true ){ cursorX = 4 }
	if( address == addrpath+'E' && value == true ){ cursorX = 5 }
	if( address == addrpath+'F' && value == true ){ cursorX = 6 }
	if( address == addrpath+'G' && value == true ){ cursorX = 7 }
	if( address == addrpath+'H' && value == true ){ cursorX = 8 }
	if( /\/avatar\/parameters\/chess[A-H]/.test(address) ){ cursorXtouch = value/*; console.log(`[Chess] cursorX: ${cursorX} - Touch: ${cursorXtouch}`)*/ }

    if( address == addrpath+'1' && value == true ){ cursorY = 8 }
    if( address == addrpath+'2' && value == true ){ cursorY = 7 }
    if( address == addrpath+'3' && value == true ){ cursorY = 6 }
    if( address == addrpath+'4' && value == true ){ cursorY = 5 }
    if( address == addrpath+'5' && value == true ){ cursorY = 4 }
    if( address == addrpath+'6' && value == true ){ cursorY = 3 }
    if( address == addrpath+'7' && value == true ){ cursorY = 2 }
    if( address == addrpath+'8' && value == true ){ cursorY = 1 }
	if( /\/avatar\/parameters\/chess[1-8]/.test(address) ){ cursorYtouch = value/*; console.log(`[Chess] cursorY: ${cursorY} - Touch: ${cursorYtouch}`)*/ }

	if( cursorXtouch == true && cursorYtouch == true && /\/avatar\/parameters\/chess/.test(address) ){
		console.log(`[Chess] Cursor Press X: ${cursorX}, Y: ${cursorY} - [${XYToSpaceID(cursorX,cursorY)}]`)
		cursorXlast=cursorX
		cursorYlast=cursorY
	}
	if( cursorXtouch == false && cursorYtouch == false && /\/avatar\/parameters\/chess/.test(address) ){
		let s = XYToSpaceID(cursorX,cursorY)
		if( cursorXlast==cursorX && cursorYlast==cursorY ){
			console.log(`[Chess] Cursor Release X: ${cursorX}, Y: ${cursorY} - [${s}] - Success`)
			
			if( s != chessBoard.pieceLocation['Select'] ){
				chessBoard.moveAction('Select',s)
			}else{
				chessBoard.moveAction('Select',0)
			}

		}else{
			console.log(`[Chess] Cursor Release X: ${cursorX}, Y: ${cursorY} - [${s}]`)
		}
	}	
})

// Read-able Names to DataBurst IDs
const avatarBoneIDs = {
	"wBishop1":17,"wBishop2":18,"wBishop3":19,
	"wKing":20,
	"wKnight1":21,"wKnight2":22,"wKnight3":23,
	"wPawn1":24,"wPawn2":25,"wPawn3":26,"wPawn4":27,"wPawn5":28,"wPawn6":29,"wPawn7":30,"wPawn8":31,
	"wQueen1":32,"wQueen2":33,
	"wRook1":34,"wRook2":35,"wRook3":36,
	"bBishop1":37,"bBishop2":38,"bBishop3":39,
	"bKing":40,
	"bKnight1":41,"bKnight2":42,"bKnight3":43,
	"bPawn1":44,"bPawn2":45,"bPawn3":46,"bPawn4":47,"bPawn5":48,"bPawn6":49,"bPawn7":50,"bPawn8":51,
	"bQueen1":52,"bQueen2":53,
	"bRook1":54,"bRook2":55,"bRook3":56,
	"Move1":57,"Move2":58,"Move3":59,"Move4":60,"Move5":61,"Move6":62,"Move7":63,"Move8":64,"Move9":65,"Move10":66,"Move11":67,"Move12":68,"Move13":69,"Move14":70,"Move15":71,"Move16":72,"Move17":73,"Move18":74,"Move19":75,"Move21":76,"Move22":77,
	"Kill1":78,"Kill2":79,"Kill3":80,"Kill4":81,"Kill5":82,"Kill6":83,"Kill7":84,"Kill8":85,"Kill9":86,"Kill10":87,"Kill11":88,"Kill12":89,"Kill13":90,"Kill14":91,"Kill15":92,"Kill16":93,
	"Select":94,
	"Rotation":95
}

class BoardManager {
	constructor() {}

	// For osc to keep track of what is in which square
	squares = { 0: ["wBishop1","wBishop2","wBishop3","wKing",
	"wKnight1","wKnight2","wKnight3",
	"wPawn1","wPawn2","wPawn3","wPawn4","wPawn5","wPawn6","wPawn7","wPawn8",
	"wQueen1","wQueen2",
	"wRook1","wRook2","wRook3",
	"bBishop1","bBishop2","bBishop3",
	"bKing",
	"bKnight1","bKnight2","bKnight3",
	"bPawn1","bPawn2","bPawn3","bPawn4","bPawn5","bPawn6","bPawn7","bPawn8",
	"bQueen1","bQueen2",
	"bRook1","bRook2","bRook3",
	"Move1","Move2","Move3","Move4","Move5","Move6","Move7","Move8","Move9","Move10","Move11","Move12","Move13","Move14","Move15","Move16","Move17","Move18","Move19","Move21","Move22",
	"Kill1","Kill2","Kill3","Kill4","Kill5","Kill6","Kill7","Kill8","Kill9","Kill10","Kill11","Kill12","Kill13","Kill14","Kill15","Kill16",
	"Select","Rotation"],
		 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[],
		 9:[],10:[],11:[],12:[],13:[],14:[],15:[],16:[],
		17:[],18:[],19:[],20:[],21:[],22:[],23:[],24:[],
		25:[],26:[],27:[],28:[],29:[],30:[],31:[],32:[],
		33:[],34:[],35:[],36:[],37:[],38:[],39:[],40:[],
		41:[],42:[],43:[],44:[],45:[],46:[],47:[],48:[],
		49:[],50:[],51:[],52:[],53:[],54:[],55:[],56:[],
		57:[],58:[],59:[],60:[],61:[],62:[],63:[],64:[]
	}

	pieceLocation = {
		"wBishop1":0,"wBishop2":0,"wBishop3":0,
		"wKing":0,
		"wKnight1":0,"wKnight2":0,"wKnight3":0,
		"wPawn1":0,"wPawn2":0,"wPawn3":0,"wPawn4":0,"wPawn5":0,"wPawn6":0,"wPawn7":0,"wPawn8":0,
		"wQueen1":0,"wQueen2":0,
		"wRook1":0,"wRook2":0,"wRook3":0,
		"bBishop1":0,"bBishop2":0,"bBishop3":0,
		"bKing":0,
		"bKnight1":0,"bKnight2":0,"bKnight3":0,
		"bPawn1":0,"bPawn2":0,"bPawn3":0,"bPawn4":0,"bPawn5":0,"bPawn6":0,"bPawn7":0,"bPawn8":0,
		"bQueen1":0,"bQueen2":0,
		"bRook1":0,"bRook2":0,"bRook3":0,
		"Move1":0,"Move2":0,"Move3":0,"Move4":0,"Move5":0,"Move6":0,"Move7":0,"Move8":0,"Move9":0,"Move10":0,"Move11":0,"Move12":0,"Move13":0,"Move14":0,"Move15":0,"Move16":0,"Move17":0,"Move18":0,"Move19":0,"Move21":0,"Move22":0,
		"Kill1":0,"Kill2":0,"Kill3":0,"Kill4":0,"Kill5":0,"Kill6":0,"Kill7":0,"Kill8":0,"Kill9":0,"Kill10":0,"Kill11":0,"Kill12":0,"Kill13":0,"Kill14":0,"Kill15":0,"Kill16":0,
		"Select":0,
		"Rotation":0
	}

	// Move a chess piece
	moveAction(itemName,squareID=0){
		
		// Check if item is already listed in square
		if( squareID >=0 && squareID <= 64 && this.pieceLocation[ itemName ] != squareID ){
			// Manage Data
			console.log(`
${selflog} [Data] Moving ${itemName} from space ${ this.pieceLocation[itemName] } -> ${squareID}`)
				// Slot
					// Remove
			this.squares[ this.pieceLocation[itemName] ] = this.squares[ this.pieceLocation[itemName] ].filter((i)=>{return i !== itemName})
					// Add
			this.squares[squareID].push( itemName )
				// Piece
			this.pieceLocation[itemName] = squareID
			
			// Manage Visual
			console.log(`${selflog} [Avatar] Visually moving ${itemName} to space ${squareID}`)
			OSCDataBurst( avatarBoneIDs[itemName], squareID / 64 )
		}else{
			console.log(`
${selflog} [Data] ${itemName} is already in space ${squareID}`)
		}

	}

	// Rotate pieces toward active player
	turnRotation(who){
		let whoOf = ["white","west","black","east"]
		OSCDataBurst(avatarBoneIDs["Rotation"], whoOf.indexOf(who) / 4)
	}

	// Bulk Piece Movement
	clear() {

		// Remove from Data
		console.log(`${selflog} Square Data cleared and reset to default`)
		Object.keys(this.squares).forEach((squareID)=>{
			if(squareID==0){
				this.squares[0] = ["wBishop1","wBishop2","wBishop3","wKing",
	"wKnight1","wKnight2","wKnight3",
	"wPawn1","wPawn2","wPawn3","wPawn4","wPawn5","wPawn6","wPawn7","wPawn8",
	"wQueen1","wQueen2",
	"wRook1","wRook2","wRook3",
	"bBishop1","bBishop2","bBishop3",
	"bKing",
	"bKnight1","bKnight2","bKnight3",
	"bPawn1","bPawn2","bPawn3","bPawn4","bPawn5","bPawn6","bPawn7","bPawn8",
	"bQueen1","bQueen2",
	"bRook1","bRook2","bRook3",
	"Move1","Move2","Move3","Move4","Move5","Move6","Move7","Move8","Move9","Move10","Move11","Move12","Move13","Move14","Move15","Move16","Move17","Move18","Move19","Move21","Move22",
	"Kill1","Kill2","Kill3","Kill4","Kill5","Kill6","Kill7","Kill8","Kill9","Kill10","Kill11","Kill12","Kill13","Kill14","Kill15","Kill16",
	"Select"]
			}else{
				this.squares[squareID] = []
			}
		})
		
		// Remove from Avatar
		console.log(`${selflog} Visually removing all Pieces from board`)
		Object.keys(avatarBoneIDs).forEach(boneID=>{
			OSCDataBurst(avatarBoneIDs[boneID], 0)
		})

	}

	start() {
		console.log(`${selflog} Moving starting Pieces to their starting positions`)
		this.moveAction("wKing", XYToSpaceID(5,8) )
		this.moveAction("wQueen1", XYToSpaceID(4,8) )
		this.moveAction("wBishop1", XYToSpaceID(3,8) )
		this.moveAction("wBishop2", XYToSpaceID(6,8) )
		this.moveAction("wKnight1", XYToSpaceID(2,8) )
		this.moveAction("wKnight2", XYToSpaceID(7,8) )
		this.moveAction("wRook1", XYToSpaceID(1,8) )
		this.moveAction("wRook2", XYToSpaceID(8,8) )
		this.moveAction("wPawn1", XYToSpaceID(1,7) )
		this.moveAction("wPawn2", XYToSpaceID(2,7) )
		this.moveAction("wPawn3", XYToSpaceID(3,7) )
		this.moveAction("wPawn4", XYToSpaceID(4,7) )
		this.moveAction("wPawn5", XYToSpaceID(5,7) )
		this.moveAction("wPawn6", XYToSpaceID(6,7) )
		this.moveAction("wPawn7", XYToSpaceID(7,7) )
		this.moveAction("wPawn8", XYToSpaceID(8,7) )
		
		this.moveAction("bKing", XYToSpaceID(5,1) )
		this.moveAction("bQueen1", XYToSpaceID(4,1) )
		this.moveAction("bBishop1", XYToSpaceID(3,1) )
		this.moveAction("bBishop2", XYToSpaceID(6,1) )
		this.moveAction("bKnight1", XYToSpaceID(2,1) )
		this.moveAction("bKnight2", XYToSpaceID(7,1) )
		this.moveAction("bRook1", XYToSpaceID(1,1) )
		this.moveAction("bRook2", XYToSpaceID(8,1) )
		this.moveAction("bPawn1", XYToSpaceID(1,2) )
		this.moveAction("bPawn2", XYToSpaceID(2,2) )
		this.moveAction("bPawn3", XYToSpaceID(3,2) )
		this.moveAction("bPawn4", XYToSpaceID(4,2) )
		this.moveAction("bPawn5", XYToSpaceID(5,2) )
		this.moveAction("bPawn6", XYToSpaceID(6,2) )
		this.moveAction("bPawn7", XYToSpaceID(7,2) )
		this.moveAction("bPawn8", XYToSpaceID(8,2) )
	}

	resync(){
		Object.keys(this.squares).forEach((squareID)=>{
			this.squares[squareID].forEach(itemInSquare=>{
				OSCDataBurst(itemInSquare, squareID / 64)
			})
		})
	}
}
const chessBoard = new BoardManager();


cmdEmitter.on('cmd',(cmd,args,raw)=>{
	if( cmd == 'help' ){ console.log(`${selflog}
Places all Pieces at there starting position
-	chess start
Remove all Pieces and Helper Items
-	chess clear
Rotates all Pieces to an edge direction.
-	chess turn [white/black/west/east]
Clears the board then places all Pieces in starting position
-	chess restart
Resends all stored board infomation over OSC DataBurst
-	chess resync
Prints data stored in OSC_ChessBoard
-	chess data
Moves a specificed Piece to a Cordnet
-	chess move [Piece Name] [X] [Y]
`) }
	if( cmd == 'chess' && args[0] == 'start' ){ chessBoard.start() }
	if( cmd == 'chess' && args[0] == 'clear' ){ chessBoard.clear() }
	if( cmd == 'chess' && args[0] == 'turn' ){ chessBoard.turnRotation(args[1]) }
	if( cmd == 'chess' && args[0] == 'restart' ){ chessBoard.clear(); chessBoard.start() }
	if( cmd == 'chess' && args[0] == 'resync' ){ chessBoard.resync() }
	if( cmd == 'chess' && args[0] == 'data' ){ console.log(chessBoard) }

	if( cmd == 'chess' && args[0] == 'move' ){ chessBoard.moveAction( args[1], XYToSpaceID( parseInt( args[2] ), parseInt( args[3] ) ) ) }
})