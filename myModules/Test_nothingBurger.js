const { oscSend } = require('./Interface_osc_v1')


function old() {
    var dataCache = {}
    memberlist.forEach((mem, index, arr) => {
        var dataTarget = mem.isRepresenting
        if (isNaN(dataCache[dataTarget])) {
            dataCache[dataTarget] = 1
        } else {
            dataCache[dataTarget]++
        }

        if (index + 1 == arr.length) {
            console.log(dataCache)
        }
    })
}

var cycleParamList = {
    'Hat Toggle': 'bool',
    'Uniform Toggle': 'bool',
    'reinit': 'bool'
}
function cycleParams(List) {
    Object.keys(List).forEach(param => {
        let valtype = List[param]
        oscSend('/avatar/parameters/'+param, valtype == 'bool' ? Math.random() > 0.5 : false )
    })
    setTimeout(()=>{ cycleParams(List) },1000)
}
cycleParams(cycleParamList)

function makeEpisodeQueueList(series = 'unnamed', type = 'TV-Show', seasondata = [10, 11, 4]) {
    var eplist = `# ${series}
**${type}**`
    seasondata.forEach((s, index, arr) => {
        eplist += `\n    Season ${index + 1}
\``
        for (i = 0; i < s; i++) {
            eplist += ` ${i + 1}`.padStart(2, "0")
        }
        eplist += `\``
    })

    console.log(eplist)
}

// makeEpisodeQueueList(`Samurai Jack`,`Anime`,[13,13,13,13,10])

function startvrc(vrclocation) {
    // vrcIsOpen = true
    require('child_process').execSync(`start "C:\\Program Files (x86)\\Steam\\steamapps\\common\\VRChat\\start_protected_game.exe" "vrchat://launch/?ref=vrchat.com&id=${vrclocation}"`)
}



function nonkeyJong() {
    let nonkeyJongLines = [
        `"Nonkey Jong Heard There Was A Secret Here", "But Nonkey Jong Can't Find"`,
        `"People Sometimes Leave Flowers On Grave", "Nonkey Jong Is Very Hungry"`,
        `"Nonkey Jong Found Cool Bones", "ENA Can't Have; They All For Nonkey Jong"`,
        `"Nonkey Jong Have Hint About Secrets", "Sometimes Walls Are Secrets"`,
        `"Nonkey Jong Heard Museum Around Somewhere", "Maybe Nonkey Jong Find More Bones There"`,
        `"Maybe If Nonkey Jong Was Clever, Nonkey Jong Could Invent Stairs"`,
        `"Nonkey Jong Love Doors", "Blue Is Nonkey Jong Favorite Color"`,
        `"Nonkey Jong Saw Olympics Once", "Cool Ads"`,
        `"Nonkey Jong Star Athlete", "Win Pole Vault"`,
        `"Maybe If Nonkey Jong Was Human, Nonkey Jong Could Be Stairs"`,
        `"Banana Is Sign Of Moral Turpitude", "Nonkey Jong Would Never Touch"`,
        `"Nonkey Jong Favorite Food Is Cigarette", "Crunchy"`,
        `"Nonkey Jong Star Athlete", "Win Standing-In-One-Place Competition"`,
        `"Nonkey Jong Heard There Was Great Artist In Museum", "Maybe Artist Want To Paint Nonkey Jong"`,
        `"Nonkey Jong Saving Up For Playground Ticket", "Nearly Enough Bones"`,
        `"Nonkey Jong Favorite Drink. Joca-Jola", "Nonkey Jong Pour It On Things To Kill Them"`,
        `"Nonkey Jong Star Athlete", "Win Slightly-Rotating-To-Face-You Competition"`,
        `"Nonkey Jong Went To Seaside Once", "Felt Watched"`,
        `"Nonkey Jong Loves Corn", "Corn, Nonkey Jong's Ideal Woman"`,
        `"Nonkey Jong Want To Meet Famous Person Someday", "Maybe Like Same Things"`,
        `"Nonkey Jong Has Never Seen Own Face", "Maybe Café Do Latte Art Of?"`,
        `"Nonkey Jong Star Short-Order Cook", "Run To Convenince Store And Back Like Lightning"`,
        `"Nonkey Jong Trade Old Games For Cool Guitar At Flea Market", "Nonkey Jong Wear Cool Shoes. Rock Star Soon"`,
        `"Nonkey Jong Wish He Had Fingers"`,
        `"Nonkey Jong. Not Actually Original Nonkey Jong", "Complicated Topic."`,
        `"Nonkey Jong Visit Art Gallery Once", "Felt Watched"`,
        `"Nonkey Jong Star Farmer", "Pollenate Turron By Hand"`,
        `"Nonkey Jong Not Monkey; Comment Misconception", "Nonkey Jong Ape"`,
        `"Sometimes Nonkey Jong Walks By The River And Thinks", "Thinks About The Most Important Things In Life"`,
        `"Nonkey Jong Like Bees"`,
        `"Nonkey Jong Think Maybe Nonkey Jong Go Back To School", "Get Square Hat"`,
        `"Nonkey Jong Think About Cheese Sometimes"`,
        `"Nonkey Jong Still Thinking"`,
        `"Nonkey Jong Wish Upon A Star", "Maybe Fingers Some Day"`,
        `"Nonkey Jong Went To Support Group Once", "Felt Seen"`,
        `"When Shipping Containers, Round VS Square?"`,
        `"Nonkey Jong Asking You; Not Really Sure"`,
        `"Nonkey Jong Look For Breath Mints", "Had Some In Drawer. Did Not Eat"`,
        `"Mmmm Mmmmm Mmm Mmmmmmmm", "Sorry, Nonkey Jong's Lips Stuck Together"`,
        `"Why Compare Apples To Apples", "Apple Is Apple"`,
        `"Nonkey Jong Heard Secret Code For Ultimate Power", Up Up Down Down Left Right Left Right Alt F4"`,
        `"Nonkey Jong Star Farmer", Pollenate Dogs By Hand"`,
        `"Nonkey Jong Web Browser Running Slow", "Help"`,
        `"Nonkey Jong Look For Breath Mints", "Nonkey Jong Like To Admire Them Sometimes"`,
        `"Nonkey Jong Invent New Candle Fragrance", "'Despair'"`,
        `"Hear New Song By Nonkey Jong?", "Nonkey Jong Is So Peaceful", "Nonkey Jong Is So Peaceful", "Can't Interrupt Nonkey Jong", "Can't Interrupt Monkey Song", "Wind Blows", "Nonkey Jong Stays", "So Peaceful"`,
        `"Nonkey Jong Recieve Review Of Song", "Nonkey Jong Is Enraged"`,
        `"Nonkey Jong Invent New Candle Fragrance", "Breath Mints"`,
        `"Nonkey Jong Burned Tongue"`,
        `"Nonkey Jong Heard Secret Code For Ultimate Power", "What If Power... Change Nonkey Jong?"`,
        `"Nonkey Jong Write List So Nonkey Jong Organized", "List Around Here Somewhere"`,
        `"Nonkey Jong Served Dark Lord Once", "Health Insurance, Very High Deductable"`,
        `"All Nonkey Jong Teeth, Wisdom Teeth", "Very Good At Parking"`,
        `"[Program Halted At Line 320571]", "Collecting Exemption Data...", "End Program and Send Report?" (Player is given options 'Yes' and 'No'.) "Sorry", "Nonkey Jong Not Sure What Came Over Nonkey Jong For Moment, There"`,
        `"What Was Nonkey Jong Saying..?", "Oh Yes--", "Nonkey Jong Heard Secret Code For Ultimate Power", "Nonkey Jong Think It 500... Maybe 1000 Watts"`,
        `"Nonkey Jong Collect Wisdom Teeth", "Enought To Be Great Sage, Some Day"`,
        `"Nonkey Jong Visit Famous Conservatory Once", "Snack Bar Very Expensive"`,
        `"Nonkey Jong Actually Nickname", "Short For Nonkalicious Jongitude"`,
        `"Nonkey Jong Visit Opera Once; Heard There Would Be Crudités For Intermission", "Only Carrots In Ranch Dressing"`,
        `"Nonkey Jong Wish Corn Would Return Nonkey Jong's Love", "Nonkey Jong Wish Corn Would Return Nonkey Jong's Calls"`,
        `"Corn Take Out Restraining Order On Nonkey Jong"`,
        `"Nonkey Jong Look For Job Once", "How To Decide Between Blue And White Collar"`,
        `"Nonkey Jong Have Strong Brain", "Bench Three, Maybe Four Pounds"`,
        `"Nonkey Jong Visit Art Gallery Once", "Nonkey Jong Biggest Work Of Art"`,
        `"Can Nonkey Jong Borrow 10 Chocolates? Pay Back Soon", "Fine"`,
        `"Nonkey Jong Have Strong Jaw", Three, Maybe Four Chins"`,
        `"Nonkey Jong Broke Up With Girlfriend"`,
        `"Nonkey Jong Look For Job", "Find It Under Bush"`,
        `"Nonkey Jong Conduct Orchestra Once", "Wave Arms"`,
        `"Nonkey Jong Went To Comedy Club", "Ran Out Of Crab Rangoons So Nonkey Jong Leave"`,
        `"Down Dark Hallways, Nonkey Jong Prowls", "Feel Like Vampire; Maybe Bite Leg"`,
        `"Nonkey Jong Try Fast Food Once", "NcNonalds"`,
        `"Nonkey Jong Heard About Library Of Babel", "Maybe Find What Nonkey Jong Say Next"`,
        `"Nonkey Jong Like Orange Juice", "Nonkey Jong Really Really Really Like Orange Juice"`,
        `"Nonkey Jong Wonder, Why Office Lady Cut Half Donut, Leave Half In Box", "Nonkey Jong Know Office Lady Come Back For Other Half Later"`,
        `"Nonkey Jong Went To Gala Opening Of Hospital Wing", "Fight Mayor For Miniature Salmon Mousses"`,
        `"Hear People Say Lot About 'Food For Thought' But Nonkey Jong Wonder", "What About Clean Water, Shelter For Thought? Love For Thought? Self-Actualization For Thought?", "Is Thought OK???"`,
        `"Nonkey Jong Save Up Wisdom For Later", "Bury Wisdom Teeth Under Tombstone"`,
        `"Nonkey Jong Fired From Job", "Nonkey Jong Tell Self: Still Good Person"`,
        `"Nonkey Jong MC Night of Inauguration", "City Comptroller Eat Entire Spanakopita Before Nonkey Jong Have Any"`,
        `"You Talk To Nonkey Jong Lots", "Nonkey Jong Get Achievement"`,
        `"Nonkey Jong Not Really Conduct Orchestra", "Sorry, Nonkey Jong Pretend Sometimes And Forget."`,
        `"Nonkey Jong Star Animator", "Win Internet Raytracing Competition 1996"`,
        `"Nonkey Jong Work On Comedy Routine", "With What Things Anyway??", "With What Oranges", "Is Fruit? Is Color?", "Get With It"`,
        `"Nonkey Jong Arms Tired"`,
        `"Nonkey Jong Think Force Between Two Electrostatic Chrages Is Equal To Electrostatic Force Constant Times Product Of Two Charges Divided By Distance Squared Between Two Charges"`,
        `"Nonkey Jong Went To Syposium, Royal Astronomical Society", "Spilled Bouillabaisse"`,
        `"Nonkey Jong Happy For Any Company", "Even ENA"`
    ]
    let nonkeyLineID = Math.floor(Math.random() * nonkeyJongLines.length)
    if (nonkeyJongLines[nonkeyLineID].includes(`", "`)) {
        nonkeyJongLines[nonkeyLineID].split(`", "`).forEach((nonkeyLinePart, index, arr) => {
            setTimeout(() => {
                oscChatBox(`${nonkeyLinePart.replace(/"/g, '')}`)
                console.log(`${nonkeyLinePart.replace(/"/g, '')}`)
            }, index * 5000)
        })
        setTimeout(() => { nonkeyJong() }, (nonkeyJongLines[nonkeyLineID].split(`", "`).length * 5000) + 10_000)
    } else {
        oscChatBox(nonkeyJongLines[nonkeyLineID])
        console.log(`${nonkeyJongLines[nonkeyLineID].replace(/"/g, '')}`)
        setTimeout(() => { nonkeyJong() }, 10_000)
    }
}

// nonkeyJong()

// countEntries(``)
function countEntries(list) {
    let counts = {}
    list.split(`\n`).forEach(name => {
        if (!counts[name]) {
            counts[name] = 1
        } else {
            counts[name]++
        }
    })
    console.log(counts)
}
// setInterval(()=>{},30)



