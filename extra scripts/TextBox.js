console.log('Started..')
var osc = require('osc'),
	http = require("http"),
	WebSocket = require("ws");
var udpPort = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: 9100,
    metadata: true
});
udpPort.on("message", function (oscMsg, timeTag, info) {
    //console.log("An OSC message just arrived!", oscMsg);
    //console.log("Remote info is: ", info);
});
udpPort.open();

function oscChatBox(say) {
	udpPort.send({
	address: "/chatbox/input",
	args: [
		{
			type: 's',
			value: say
		},
		{
			type: 'i',
			value: 1
		}
	]
	}, "127.0.0.1", 9000);
}

udpPort.on("ready", function () {

var say = `<START OF TEST>
0x0000+col		abcdefghijklmno
0x7f70+col		pqrstuvwxyz{|}~
0xc2a0+col		 ¡¢£¤¥¦§¨©ª«¬­®¯
0xc2b0+col		°±²³´µ¶·¸¹º»¼½¾¿
0xc380+col		ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ
0xc390+col		ÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞß
0xc3a0+col		àáâãäåæçèéêëìíîï
0xc3b0+col		ðñòóôõö÷øùúûüýþÿ
0xc480+col		ĀāĂăĄąĆćĈĉĊċČčĎď
0xc490+col		ĐđĒēĔĕĖėĘęĚěĜĝĞğ
0xc4a0+col		ĠġĢģĤĥĦħĨĩĪīĬĭĮį
0xc4b0+col		İıĲĳĴĵĶķĸĹĺĻļĽľĿ
0xc580+col		ŀŁłŃńŅņŇňŉŊŋŌōŎŏ
0xc590+col		ŐőŒœŔŕŖŗŘřŚśŜŝŞş
0xc5a0+col		ŠšŢţŤťŦŧŨũŪūŬŭŮů
0xc5b0+col		ŰűŲųŴŵŶŷŸŹźŻżŽžſ
0xc680+col		ƀƁƂƃƄƅƆƇƈƉƊƋƌƍƎƏ
0xc690+col		ƐƑƒƓƔƕƖƗƘƙƚƛƜƝƞƟ
0xc6a0+col		ƠơƢƣƤƥƦƧƨƩƪƫƬƭƮƯ
0xc6b0+col		ưƱƲƳƴƵƶƷƸƹƺƻƼƽƾƿ
0xc780+col		ǀǁǂǃǄǅǆǇǈǉǊǋǌǍǎǏ
0xc790+col		ǐǑǒǓǔǕǖǗǘǙǚǛǜǝǞǟ
0xc7a0+col		ǠǡǢǣǤǥǦǧǨǩǪǫǬǭǮǯ
0xc7b0+col		ǰǱǲǳǴǵǶǷǸǹǺǻǼǽǾǿ
0xc880+col		ȀȁȂȃȄȅȆȇȈȉȊȋȌȍȎȏ
0xc890+col		ȐȑȒȓȔȕȖȗȘșȚțȜȝȞȟ
0xc8a0+col		ȠȡȢȣȤȥȦȧȨȩȪȫȬȭȮȯ
0xc8b0+col		ȰȱȲȳȴȵȶȷȸȹȺȻȼȽȾȿ
0xc980+col		ɀɁɂɃɄɅɆɇɈɉɊɋɌɍɎɏ
0xc990+col		ɐɑɒɓɔɕɖɗɘəɚɛɜɝɞɟ
0xc9a0+col		ɠɡɢɣɤɥɦɧɨɩɪɫɬɭɮɯ
0xc9b0+col		ɰɱɲɳɴɵɶɷɸɹɺɻɼɽɾɿ
0xca80+col		ʀʁʂʃʄʅʆʇʈʉʊʋʌʍʎʏ
0xca90+col		ʐʑʒʓʔʕʖʗʘʙʚʛʜʝʞʟ
0xcaa0+col		ʠʡʢʣʤʥʦʧʨʩʪʫʬʭʮʯ
0xcab0+col		ʰʱʲʳʴʵʶʷʸʹʺʻʼʽʾʿ
0xcb80+col		ˀˁ˂˃˄˅ˆˇˈˉˊˋˌˍˎˏ
0xcb90+col		ːˑ˒˓˔˕˖˗˘˙˚˛˜˝˞˟
0xcba0+col		ˠˡˢˣˤ˥˦˧˨˩˪˫ˬ˭ˮ˯
0xcbb0+col		˰˱˲˳˴˵˶˷˸˹˺˻˼˽˾˿
0xcc80+col		̀́̂̃̄̅̆̇̈̉̊̋̌̍̎̏
0xcc90+col		̛̖̗̘̙̜̝̞̟̐̑̒̓̔̕̚
0xcca0+col		̡̢̧̨̠̣̤̥̦̩̪̫̬̭̮̯
0xccb0+col		̴̵̶̷̸̰̱̲̳̹̺̻̼̽̾̿
0xcd80+col		͇͈͉͍͎̀́͂̓̈́͆͊͋͌ͅ͏
0xcd90+col		͓͔͕͖͙͚͐͑͒͗͛͘͜͟͝͞
0xcda0+col		ͣͤͥͦͧͨͩͪͫͬͭͮͯ͢͠͡
0xcdb0+col		ͰͱͲͳʹ͵Ͷͷ͸͹ͺͻͼͽ;Ϳ
0xce80+col		΀΁΂΃΄΅Ά·ΈΉΊ΋Ό΍ΎΏ
0xce90+col		ΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟ
0xcea0+col		ΠΡ΢ΣΤΥΦΧΨΩΪΫάέήί
0xceb0+col		ΰαβγδεζηθικλμνξο
0xcf80+col		πρςστυφχψωϊϋόύώϏ
0xcf90+col		ϐϑϒϓϔϕϖϗϘϙϚϛϜϝϞϟ
0xcfa0+col		ϠϡϢϣϤϥϦϧϨϩϪϫϬϭϮϯ
0xcfb0+col		ϰϱϲϳϴϵ϶ϷϸϹϺϻϼϽϾϿ
0xd080+col		ЀЁЂЃЄЅІЇЈЉЊЋЌЍЎЏ
0xd090+col		АБВГДЕЖЗИЙКЛМНОП
0xd0a0+col		РСТУФХЦЧШЩЪЫЬЭЮЯ
0xd0b0+col		абвгдежзийклмноп
0xd180+col		рстуфхцчшщъыьэюя
0xd190+col		ѐёђѓєѕіїјљњћќѝўџ
0xd1a0+col		ѠѡѢѣѤѥѦѧѨѩѪѫѬѭѮѯ
0xd1b0+col		ѰѱѲѳѴѵѶѷѸѹѺѻѼѽѾѿ
0xd280+col		Ҁҁ҂҃҄҅҆҇҈҉ҊҋҌҍҎҏ
0xd290+col		ҐґҒғҔҕҖҗҘҙҚқҜҝҞҟ
0xd2a0+col		ҠҡҢңҤҥҦҧҨҩҪҫҬҭҮү
0xd2b0+col		ҰұҲҳҴҵҶҷҸҹҺһҼҽҾҿ
0xd380+col		ӀӁӂӃӄӅӆӇӈӉӊӋӌӍӎӏ
0xd390+col		ӐӑӒӓӔӕӖӗӘәӚӛӜӝӞӟ
0xd3a0+col		ӠӡӢӣӤӥӦӧӨөӪӫӬӭӮӯ
0xd3b0+col		ӰӱӲӳӴӵӶӷӸӹӺӻӼӽӾӿ
0xd480+col		ԀԁԂԃԄԅԆԇԈԉԊԋԌԍԎԏ
0xd490+col		ԐԑԒԓԔԕԖԗԘԙԚԛԜԝԞԟ
0xd4a0+col		ԠԡԢԣԤԥԦԧԨԩԪԫԬԭԮԯ
0xd4b0+col		԰ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿ
0xd580+col		ՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏ
0xd590+col		ՐՑՒՓՔՕՖ՗՘ՙ՚՛՜՝՞՟
0xd5a0+col		ՠաբգդեզէըթժիլխծկ
0xd5b0+col		հձղճմյնշոչպջռսվտ
0xd680+col		րցւփքօֆևֈ։֊֋֌֍֎֏
0xd690+col		֐֑֖֛֚֒֓֔֕֗֘֙֜֝֞֟
0xd6a0+col		֢֣֤֥֦֧֪֭֮֠֡֨֩֫֬֯
0xd6b0+col		ְֱֲֳִֵֶַָֹֺֻּֽ־ֿ
0xd780+col		׀ׁׂ׃ׅׄ׆ׇ׈׉׊׋׌׍׎׏
0xd790+col		אבגדהוזחטיךכלםמן
0xd7a0+col		נסעףפץצקרשת׫׬׭׮ׯ
0xd7b0+col		װױײ׳״׵׶׷׸׹׺׻׼׽׾׿
0xd880+col		؀؁؂؃؄؅؆؇؈؉؊؋،؍؎؏
0xd890+col		ؘؙؚؐؑؒؓؔؕؖؗ؛؜؝؞؟
0xd8a0+col		ؠءآأؤإئابةتثجحخد
0xd8b0+col		ذرزسشصضطظعغػؼؽؾؿ
0xd980+col		ـفقكلمنهوىيًٌٍَُ
0xd990+col		ِّْٕٖٜٟٓٔٗ٘ٙٚٛٝٞ
0xd9a0+col		٠١٢٣٤٥٦٧٨٩٪٫٬٭ٮٯ
0xd9b0+col		ٰٱٲٳٴٵٶٷٸٹٺٻټٽپٿ
0xda80+col		ڀځڂڃڄڅچڇڈډڊڋڌڍڎڏ
0xda90+col		ڐڑڒړڔڕږڗژڙښڛڜڝڞڟ
0xdaa0+col		ڠڡڢڣڤڥڦڧڨکڪګڬڭڮگ
0xdab0+col		ڰڱڲڳڴڵڶڷڸڹںڻڼڽھڿ
0xdb80+col		ۀہۂۃۄۅۆۇۈۉۊۋیۍێۏ
0xdb90+col		ېۑےۓ۔ەۖۗۘۙۚۛۜ۝۞۟
0xdba0+col		ۣ۠ۡۢۤۥۦۧۨ۩۪ۭ۫۬ۮۯ
0xdbb0+col		۰۱۲۳۴۵۶۷۸۹ۺۻۼ۽۾ۿ
0xdc80+col		܀܁܂܃܄܅܆܇܈܉܊܋܌܍܎܏
0xdc90+col		ܐܑܒܓܔܕܖܗܘܙܚܛܜܝܞܟ
0xdca0+col		ܠܡܢܣܤܥܦܧܨܩܪܫܬܭܮܯ
0xdcb0+col		ܱܴܷܸܹܻܼܾܰܲܳܵܶܺܽܿ
0xdd80+col		݂݄݆݈݀݁݃݅݇݉݊݋݌ݍݎݏ
0xdd90+col		ݐݑݒݓݔݕݖݗݘݙݚݛݜݝݞݟ
0xdda0+col		ݠݡݢݣݤݥݦݧݨݩݪݫݬݭݮݯ
0xddb0+col		ݰݱݲݳݴݵݶݷݸݹݺݻݼݽݾݿ
0xde80+col		ހށނރބޅކއވމފދތލގޏ
0xde90+col		ސޑޒޓޔޕޖޗޘޙޚޛޜޝޞޟ
0xdea0+col		ޠޡޢޣޤޥަާިީުޫެޭޮޯ
0xdeb0+col		ްޱ޲޳޴޵޶޷޸޹޺޻޼޽޾޿
0xdf80+col		߀߁߂߃߄߅߆߇߈߉ߊߋߌߍߎߏ
0xdf90+col		ߐߑߒߓߔߕߖߗߘߙߚߛߜߝߞߟ
0xdfa0+col		ߠߡߢߣߤߥߦߧߨߩߪ߫߬߭߮߯
0xdfb0+col		߲߰߱߳ߴߵ߶߷߸߹ߺ߻߼߽߾߿
<END OF TEST>`;
var LineReadDelay = 0
function sayText() {
say.split('\n').forEach((line,index)=>{
	
	var currentLineReadTime = line.split(' ').length * 120
	if( currentLineReadTime < 1500 ){ currentLineReadTime = 1500 }
	//var currentLineReadTime = line.length * 100
	
	setTimeout(()=>{
		oscChatBox( line )
		console.log( line )
	},LineReadDelay)
	
	LineReadDelay = LineReadDelay + 1510
})	
}
sayText()


function loopRandomText() {
	var randomNumberStuff = Math.random().toString().slice(3)+""+Math.random().toString().slice(3)+""+Math.random().toString().slice(3)+""+Math.random().toString().slice(3)+""+Math.random().toString().slice(3)+""+Math.random().toString().slice(3)+""+Math.random().toString().slice(3)+""+Math.random().toString().slice(3)+""+Math.random().toString().slice(3)+""+Math.random().toString().slice(3)+""+Math.random().toString().slice(3)
	oscChatBox( randomNumberStuff.slice(0,144) )
	//oscChatBox( "Portable Mirrors exist in Action Menu now" )
	setTimeout(()=>{
		loopRandomText()
	},3000)
}
//loopRandomText()

});










