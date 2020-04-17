const DEBUG = false;

// Plugins used:
// pixe-textinput https://github.com/ONode/pixi-textinput



// Note: game scales speed against actual FPS. Optimal gameplay 60 Hz or better

let Application = PIXI.Application,
    loader = PIXI.Loader.shared,
    resources = PIXI.Loader.shared.resources,
    Container = PIXI.Container,
    Sprite = PIXI.Sprite,
    Graphics = PIXI.Graphics,
    Text = PIXI.Text,
    TextStyle = PIXI.TextStyle;


let app,stage,state1 = idle,state2 = idle;
let textBlock = [];


const gameWidth = 960;
const gameHeight = 540;


const beeCircleRadius = 50;   // Radius of bee circle

let intro,bee,honeycomb, hello, submitter;

const raatPolygon = [0.5,587.82,0.5,196.32,339.55,0.58,678.59,196.32,678.59,587.82,339.55,783.57,0.5,587.82]
const raatScale = 0.1;
const raatColors = [0xed7004,0x62ad2c,0xfdc500,0x00a0de,0x97ceec]
const explainerColors = ["#ed7004","#62ad2c","#fdc500","#00a0de","#97ceec"];

let targetRaat = null;



function loadJSON(callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', './hallo.json', true); 
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);  
}

loadJSON(function(response) {
    // Parse JSON string into object
    helloTexts = JSON.parse(response);
    jsonReady = true;
    console.log('Hello texts loaded: ' + helloTexts.length);
});



function shuffleArray(array) {
    // Shuffel array function taken from https://stackoverflow.com/a/2450976/1293256
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


function resize() {
    /* Resize and scale app to the window-width */
    var w = window.innerWidth;
    var h = window.innerHeight;

    app.renderer.resize(w, h);

    scaleFactor = w / gameWidth;
    stage.scale.x = scaleFactor;
    stage.scale.y = scaleFactor;
}


loader
    .add("images/bee.png")
    .add("images/close.png")
    .add("images/info.png")
    .add("images/background.png")
    .add("images/papier.jpg")
    .add("images/pijl.png")
    .load(function() {
        assetsReady = true;
        preLoaderCheck();   // This script lives in the head and will ultimately call setup()
    });


/* setup() is called as soon as all assets are loaded */
function setup() {
    app = new Application({width: gameWidth, height: gameHeight, antialias: true, transparent: false, resolution:1});
    app.renderer.view.style.position = "absolute";
    app.renderer.view.style.display = "block";
    app.renderer.backgroundColor = 0xffffff;

    document.getElementById('canvas-placeholder').appendChild(app.view);
    // document.body.appendChild(app.view);
    stage = app.stage;
    stage.sortableChildren = true;  // obey the zindex

    state1 = idle;
    honeycomb = new Honeycomb();
    
    app.ticker.add(delta => gameLoop(delta));

    if (!DEBUG) resize();

    for (i = 0; i < 5; i++) {
        honeycomb.addRaat(0,i)
    }
    for (i = 0; i < 4; i++) {
       honeycomb.addRaat(1,i,3)
    }
    for (i = 0; i < 4; i++) {
        honeycomb.addRaat(2,i,1)
    }
    for (i = 0; i < 3; i++) {
        honeycomb.addRaat(3,i,4)
    }

    bee = new Bee();
    if (DEBUG) bee.beeSpeed = 25;

    bee.flyTo(675,50);

    intro = new Intro();
    info = new Info();
    info.show();
    state1 = introAnimation;
}


function initializeGame(e) {
    // Cleanup
    //state2 = idle;


    if (DEBUG) bee.beeSpeed = 25;
    bee.goAway();
    bee.canBeHit();
    //state1 = idle;

    info.hide();
    intro.destroy();
    targetRaat = null;


    // fill enire screen (and even more) with raten

    let rowFill = 13;
    let totalRows = 30;
    let rowStart = new Array(totalRows).fill(0);

    // Several raten are already displayed. Do not overwrite them
    rowStart[0] = 5;
    rowStart[1] = 4;
    rowStart[2] = 4;
    rowStart[3] = 3;

    // The color offset
    colorOffset = [0,3,1,4,2]

    for (let r = 0; r < totalRows; r++) {
        // console.log('for (i = ' + rowStart[r] + ',i < ' + rowFill + '; i++ {' );
        // console.log('   honeycomb.addRaat(' + r + ',i,' + colorOffset[r % 5] + ');');
        // console.log('}');
        for (let i = rowStart[r]; i < rowFill; i++) {
            honeycomb.addRaat(r,i,colorOffset[r % 5])
        }
        // The number of raten per row alternates
        if (rowFill == 13)
            rowFill = 12;
        else
            rowFill = 13;
    }

    console.log('Game initialized');
    state1 = waitingForRaatClick;

    hello = new Hellobox();
    submitter = new Submitform();

}


 //   __ _    __ _   _ __ ___     ___  | |   ___     ___    _ __  
 //  / _` |  / _` | | '_ ` _ \   / _ \ | |  / _ \   / _ \  | '_ \ 
 // | (_| | | (_| | | | | | | | |  __/ | | | (_) | | (_) | | |_) |
 //  \__, |  \__,_| |_| |_| |_|  \___| |_|  \___/   \___/  | .__/ 
 //  |___/                                                 |_|    

function gameLoop(delta) {
    state1(delta);  
    //state2(delta);  
}

/* Functions to be used as state */
function idle(delta) {
    ;
}

function introAnimation(delta) {
    if (bee.fly()) {
        if (DEBUG) bee.beeSpeed = 4;
        state1 = introIdle;
    }
    intro.animate();    // will eventually pass control to intializeGame() and then to waitingForRaatClick
}

function introIdle(delta) {
    // This gamestate is reached when the bee quit flying but the intro is still visible
    intro.animate();    // will eventually pass control to intializeGame() 
}


function waitingForRaatClick(delta) {

    // the bee is flying away and keeps trying to fly
    if (bee.fly())
        if (DEBUG) bee.beeSpeed = 4;
        bee.canBeHit(false);

    if (targetRaat !== null) {
        // bee.flyTo(targetRaat.x,targetRaat.y);
        //console.log('We should be flying to the raat at ' + targetRaat.x + ',' + targetRaat.y);
        // wait until a raat gets clicked
        honeycomb.initGlow();
        //raatGlowCounter = 0;
        bee.canBeHit();
        bee.gotoRaat(targetRaat);
        state1 = flyToRaat;
    }
}


function flyToRaat(delta) {
    if (bee.fly()) {
        // we've reached the raat
        bee.shakeCounter = 0;
        state1 = beeShake;
        bee.canBeHit(false);
         // Reset raatscale
        targetRaat.scale.set(raatScale,raatScale);
   }
   honeycomb.raatGlow();
}


function beeCircle(delta) {
    // When circle is done, we set state back to beeFly
    if (bee.flyCircle()) {
        console.log('PREPARE');
        submitter.prepare();
        bee.flyTo(860,50);
        state1 = showSubmit;
    }
}

function beeShake(delta) {
    if (bee.shake()) {
        hello.prepare();
        bee.flyTo(860,50);
        bee.canBeHit();
        state1 = showHello;
    }
}

function showHello(delta) {
    let statusHello = hello.show();
    let statusFly = bee.fly();
    if (statusFly) bee.canBeHit(false);
    if (statusHello && statusFly) {
        hello.closeButton();
        state1 = idle;
    }
}


function showSubmit(delta) {
    let statusSubmit = submitter.show();
    let statusFly = bee.fly();
    if (statusSubmit && statusFly) {
        info.show();
        submitter.closeButton();
        state1 = doSubmit;
    }
}

function doSubmit(delta) {
    if (submitter.isCompleted) {
        state1 = idle;
    }
}




 //  ____     ___    __  __                                   _         
 // |  _ \   / _ \  |  \/  |     ___  __   __   ___   _ __   | |_   ___ 
 // | | | | | | | | | |\/| |    / _ \ \ \ / /  / _ \ | '_ \  | __| / __|
 // | |_| | | |_| | | |  | |   |  __/  \ V /  |  __/ | | | | | |_  \__ \
 // |____/   \___/  |_|  |_|    \___|   \_/    \___| |_| |_|  \__| |___/



window.onload = function() {

    window.addEventListener("resize",resize);
}



// Triggered when someone clicks the bee
function mouseHitBee(e) {
    console.log("Bee was hit");
    bee.canBeHit(false);
    bee.circleAngle = 0;
    bee.centerX = bee.bee.x - beeCircleRadius;
    bee.centerY = bee.bee.y;
    state1 = beeCircle;
}


function closeHello(e) {
    console.log('Button to close hello dialog clicked');
    targetRaat = null;
    hello.hide();
    bee.goAway();
    state1 = waitingForRaatClick;
}


function closeSubmit(e) {
    console.log('Button to close submit dialog clicked');
    targetRaat = null;
    info.hide();
    submitter.hide();
    bee.goAway();
    state1 = waitingForRaatClick;
}


// Triggered when someone clicks the arrow in the submitform


function mouseHitArrow(e) {
    if (submitter.form.text.length >= submitter.form.minLength) {
        let validData = true;
        if (submitter.field == 'group') {
            // Only for group some basic checking
            group = parseInt(submitter.form.text);
            if (isNaN(group)) validData = false;
            if (group < 0 || group > 8) validData = false;
        }
        if (validData) submitter.saveField();
    }
}


function mouseHitInfo(e) {
    let win = window.open('info.html','_blank');
    win.focus();
}

 //   ____   _                                  
 //  / ___| | |   __ _   ___   ___    ___   ___ 
 // | |     | |  / _` | / __| / __|  / _ \ / __|
 // | |___  | | | (_| | \__ \ \__ \ |  __/ \__ \
 //  \____| |_|  \__,_| |___/ |___/  \___| |___/


class Honeycomb {

    constructor() {
        this.raten = []
        this.raatGlowCounter = 0;

        // Ensure the colors match other groups for each run
        this.colorsToGroups = shuffleArray(raatColors.slice()); // 0: groups 1+2  1: groups 3+4  2: groups 5+6   3: groups 7+8    4: teachers and others

        // Process the texts we imported using JSON
        this.textBlock = [];
        for (let i = 0; i < 5; i++ ) {
            this.textBlock[i] = []; 
        }
        let helloTextsLength = helloTexts.length;   // just to speed up processing larger textfiles
        for (let i = 0; i < helloTexts.length; i++) {
            let group = parseInt(helloTexts[i].group.match(/\d+/),10);
            switch (group) {
                case 1:
                case 2: 
                    this.textBlock[0].push(helloTexts[i]);
                    break;
                case 3:
                case 4:
                    this.textBlock[1].push(helloTexts[i]);
                    break;
                case 5:
                case 6:
                    this.textBlock[2].push(helloTexts[i]);
                    break;
                case 7:
                case 8:
                    this.textBlock[3].push(helloTexts[i]);
                    break;
                default:
                    this.textBlock[4].push(helloTexts[i]);
            }
        }

        // Now shuffle those textblocks
        for (let i = 0; i < 5; i++ ) {
            shuffleArray(this.textBlock[i]);
            // this.textBlockSize[i] = this.textBlock[i].length;   // speed consideration with addRaat
        }
        
        this.textBlockCounter = [0,0,0,0,0];
    }


    addRaat(row,index,colorOffset = 0) {
        // row = row counted from the top
        // index = nth raat from the right
        // colorOffset is a shift in the raatColors array
        let raatColor = raatColors[(index + colorOffset) % raatColors.length];

        // Find the raatColor in the colorsToGroups array to find what group 
        // is assigned to raatColor this run
        let block;
        for (block = 0; block < 4; block++) {
            if (this.colorsToGroups[block] == raatColor) {
                break;
            }
        }

        // Create the raat
        let raat = new Graphics();
        raat.beginFill(raatColor);
        raat.drawPolygon(raatPolygon);
        raat.endFill(); 

        // Get the text content
        let textContent = this.textBlock[block][this.textBlockCounter[block]];

        // Write the text content to the raat
        raat.group = textContent.group;
        raat.submitter = textContent.submitter;
        raat.text = textContent.text;
        raat.submitter = textContent.submitter;

        // Position and scale the raat
        raat.pivot.x = 340;
        raat.pivot.y = 390;
        raat.x = 925 - (index * 82) - 41 * (row % 2) + 44;
        raat.y = 20 + (row * 72) -30;
        raat.scale.set(raatScale,raatScale);

        // Store the raat
        this.raten.push(raat);  // write to raten array
        stage.addChild(raat);   // write to stage

        raat.interactive = true;    // enable activity on the raat

        raat.on('touchstart', function(e){
            targetRaat = raat;  // targetRaat is a global
        });

        raat.on('mousedown', function(e){
            console.log('Raat clicked at ' + raat.x + ',' + raat.y);
            targetRaat = raat;  // targetRaat is a global
        });

        // Just loop through all texts for this group
        this.textBlockCounter[block] = (this.textBlockCounter[block] + 1) % this.textBlock[block].length;
    }


    initGlow() {
        this.raatGlowCounter = 0;
    }


    raatGlow() {
        this.raatGlowCounter += 0.1 * 60 / app.ticker.FPS;
        let scale = 0.1 + 0.01 * Math.sin(this.raatGlowCounter);
        targetRaat.scale.set(scale,scale);
    }

}



class Info {

    constructor() {
        this.button = new Sprite.from("images/info.png");
        this.button.width = 40;
        this.button.height = 40;
        this.button.position.set(910,10);
        this.button.interactive = true;
        this.button.on('touchstart', function(e){
            mouseHitInfo(e);
        });        
        this.button.on('mousedown', function(e){
            mouseHitInfo(e);
        });
    }


    show() {
        stage.addChild(this.button);
    }


    hide() {
        stage.removeChild(this.button);
    }
}


class Hellobox {
    constructor() {
        this.popup = new Sprite.from("images/background.png");
        this.popup.position.set(100,50);
        this.popup.width = 760;
        this.popup.height = 445;

        this.alphaCounter = 0;
        this.alphaStep = 0;

        let style = new TextStyle({
            fontFamily: googleFontExplainer,
            fontSize: 44,
            fill: "#444444",
            fontWeight: 300,
            wordWrap: true,
            wordWrapWidth: 660,
            stroke: '#ffffff',
            strokeThickness: 4,
        });

        this.hello = new Text('Nothing yet',style);
        this.hello.position.set(50,50);
        this.popup.addChild(this.hello);
    }

    prepare() {
        this.alphaCounter = 0;
        this.alphaStep = 0.01 * 60 / app.ticker.FPS;
        this.popup.alpha = 0;
        this.hello.alpha = 0;

        // Set the content
        let textContent = targetRaat.text + '\n\n';
        if (targetRaat.submitter) {
            textContent += targetRaat.submitter;
            if (targetRaat.group != 0) {
                textContent = textContent + ', groep ' + targetRaat.group;
            }
        }
        this.hello.text = textContent;
        
        stage.addChild(this.popup);     
        console.log('Textbox prepared');
    }

    show() {
        // returns false as long as the opacity isn't yet 1. Otherwise true
        if (this.alphaCounter < 1) {
            this.alphaCounter += this.alphaStep;
            this.popup.alpha = this.alphaCounter;
            this.hello.alpha = this.alphaCounter;
            return false;
        }
        else {
            console.log('Textbox fully visible now');
            this.popup.opacity = this.hello.opacity = 1;
            return true;
        }
    }

    closeButton() {
        let close = new Sprite.from("images/close.png");
        close.anchor.set(0.5,0.5);
        close.position.set(0,0);
        close.width = 50;
        close.height = 50;

        close.interactive = true;
        // We need to do this in the global scope
        close.on('mousedown',closeHello);
        close.on('touchstart',closeHello);

        this.popup.addChild(close);
    }

    hide() {
        stage.removeChild(this.popup);
    }

    setText(text) {
        this.hello.text = text;
    }
}


class Submitform {

    constructor() {

        this.minLength = 0;

        this.popup = new Sprite.from("images/papier.jpg");
        this.popup.position.set(100,50);
        this.popup.width = 760;
        this.popup.height = 445;

        this.alphaCounter = 0;
        this.alphaStep = 0;

        this.submitData = {};
        this.isCompleted = false;
        this.field = '';    // current field in form

        this.inputWidth = this.popup.width - 150;

        this.form = new PIXI.TextInput({
            input:{
                fontFamily: googleFontExplainer,
                multiline: true,
                fontSize: '36px',
                padding: '12px',
                width: this.inputWidth +'px',
                height:'200px',
                color: '#26272E',
            },
            box: {fill: 0xE8E9F3, rounded: 16, stroke: {color: 0xCBCEE0, width: 4}}
        }),
        this.form.x = 50;
        this.form.y = 50;
        //this.form.restrict = '[a-zA-Z0-9\ ]*';
        // this.popup.addChild(this.form);

        this.explainer = new Text('Hebben meer kinderen in jouw klas dezelfde voornaam? Geef dan ook je achternaam in.',{
            fontFamily: googleFontSchool,
            fontSize: 22,
            fill: "#b04020",
            fontWeight: 700,
            wordWrap: true,
            wordWrapWidth: 350,
            align:"left"

        });
        this.explainer.position.set(50,320);

        // Feedback prepare
        this.feedback = new Text('n/a', {
            fontFamily: googleFontExplainer,
            fontSize: 22,
            fill: "#2040b0",
            fontWeight: 700,
            wordWrap: true,
            wordWrapWidth: 350,
            align:"center"
        });

        // Setup the arrow
        this.arrow = new Sprite.from("images/pijl.png");
        this.arrow.position.set(490,300);
        this.arrow.width = 200;
        this.arrow.height = 100

        this.arrow.interactive = true;

        this.arrow.on('touchstart', function(e){
            mouseHitArrow(e);
        });

        this.arrow.on('mousedown', function(e){
            mouseHitArrow(e);
        });
    }

    clear() {
        this.submitData = {};
        this.field = '';
    }

    prepare() {
        this.field = 'name'
        this.explainer.text = 'Hebben meer kinderen in jouw klas dezelfde voornaam? Geef dan ook je achternaam in.';
        this.explainer.style.y = 320;

        this.form.text = '';
        this.form.placeholder = 'Hoe heet je?'
        // this.form.restrict = '[a-zA-Z0-9\ ]*';
        this.form.restrict = '[a-zA-Z\- ]*'
        this.form.minLength = 2;
        this.form.maxLength = 30;
        this.isCompleted = false;

        this.alphaCounter = 0;
        this.alphaStep = 0.01 * 60 / app.ticker.FPS;
        this.popup.alpha = 0;
        // this.form.alpha = 0;

        this.popup.addChild(this.form);
        this.popup.addChild(this.explainer);
        this.popup.addChild(this.arrow);
        stage.addChild(this.popup);        
    }


    show() {
        // returns false as long as the opacity isn't yet 1. Otherwise true
        if (this.alphaCounter < 1) {
            this.alphaCounter += this.alphaStep;
            this.popup.alpha = this.alphaCounter;
            // this.hello.alpha = this.alphaCounter;
            return false;
        }
        else {
            console.log('Submitbox fully visible now');
            this.popup.opacity = 1;
            // this.hello.opacity = 1;
            return true;
        }
    }

    saveField(data) {
        console.log('Received "' + this.form.text + '" as '+ this.field);
        this.submitData[this.field] = this.form.text;
        let retValue = false;
        switch (this.field) {
            case 'name':
                this.field = 'group';
                this.form.text = ''
                this.form.placeholder = 'In welke groep zit je?'
                this.form.minLength = 1;
                this.form.maxLength = 5; 
                // this.form.restrict = '[a-eA-E0-8\/\-\ ]*';
                this.form.restrict = '[a-eA-E0-8\/]*'
                this.explainer.text = 'Juffen en meesters kunnen\nhier 0 invullen.';
                break;
            case 'group':
                this.field = 'text';
                this.form.text = ''
                this.form.placeholder = 'Jouw hallo-berichtje.'
                this.form.restrict = '[a-zA-Z0-9:!?., ]*'

                this.form.minLength = 10;
                this.form.maxLength = 150;
                this.explainer.y = 305;
                this.explainer.text = 'Wat zou jij graag aan de kinderen in je klas willen zeggen? Of aan de andere kinderen? Of aan de meesters en juffen?';
                break;
            case 'text':
                this.save();
                this.popup.removeChild(this.arrow);
                this.explainer.text = 'Nieuwe hallo-berichten komen niet vanzelf in het scherm. Je moet daarvoor het spel opnieuw starten.'
                this.popup.removeChild(this.form);
                this.feedback.text = 'Het ingestuurde hallo-bericht is:\n\n' + this.submitData['text'] + "\n\n" + this.submitData['name'] + ', ' + this.submitData['group'];
                this.feedback.position.set(100,50);
                this.popup.addChild(this.feedback);
                this.isCompleted = true;
        }
    }

    save() {
        this.submit();
        console.log('Submitting ' + this.submitData['name'] + ' (' + this.submitData['group'] +'): ' + this.submitData['text']);
    }


    closeButton() {
        let close = new Sprite.from("images/close.png");
        close.anchor.set(0.5,0.5);
        close.position.set(0,0);
        close.width = 50;
        close.height = 50;

        close.interactive = true;
        // We need to do this in the global scope
        close.on('mousedown',closeSubmit);
        close.on('touchstart',closeSubmit);

        this.popup.addChild(close);
    }

    hide() {
        this.clear();
        this.popup.removeChild(this.feedback);
        stage.removeChild(this.popup);
    }

    submit() {
        let xhttp = new XMLHttpRequest();

        xhttp.open("POST", "inzenden.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send('name=' + encodeURIComponent(this.submitData['name']) + '&group=' + encodeURIComponent(this.submitData['group']) + '&text=' + encodeURIComponent(this.submitData['text']));
    }
}



class Intro {


    constructor() {
        this.schoolName1 = new Text("NICOLAAS");
        this.schoolName2 = new Text("BEETSSCHOOL");
        this.explainerTitle = new Text('Zeg hallo met de TSO');
        this.explainerText = new Text('Klik een honingraat om een hallo te bekijken.\n' + 
            'Klik een vliegend bijtje om zelf een hallo in te zenden.\n\n' + 
            'Wil je beginnen? Klik met je muis of tik op het scherm.\n\n' + 
            'Voor vragen, mail naar ' + contactEmail + '.');

        this.explainerText
        this.schoolNameY = -20;
        this.explainerVisible = false;
        this.schoolName();
        this.glowCounter = 0;

    }


    schoolName() {
        const style1 = new TextStyle({
            fontFamily: googleFontSchool,
            fontSize: 42,
            fill: "#fdc500",
            fontWeight:700,
            letterSpacing:2,
        });

        const style2 = Object.assign({}, style1);   // Clone
        style2.fill = "#ed7004";

        this.schoolName1.style = style1;
        this.schoolName2.style = style2;

        this.schoolName1.position.set(40,this.schoolNameY);
        this.schoolName2.position.set(270,this.schoolNameY);

        stage.addChild(this.schoolName1);
        stage.addChild(this.schoolName2);
    }


    schoolNameMove() {
        // Returns false when schoolname hasn't arrived destination yet. Otherwise true
        if (this.schoolNameY >= 120) return true;
        this.schoolNameY += 1 * 60 / app.ticker.FPS;
        if (DEBUG) this.schoolNameY += 10;
        this.schoolName1.y = this.schoolNameY;
        this.schoolName2.y = this.schoolNameY;
        return false;

        if (this.schoolNameY >= 120) {
            explainer();
            // counter = 0;
            state2 = explainerGlow; 
        }
    }


    explainer() {
        // Returns true when explainer is visible
        if (this.eplainerVisible) return true;
        const style1 = new TextStyle({
            fontFamily: googleFontExplainer,
            fontSize: 38,
            fill: "#aaaaaa",
            fontWeight: 700,
        });

        let style2 = new TextStyle({
            fontFamily: googleFontExplainer,
            fontSize: 26,
            fill: "#444444",
            letterSpacing:2,
            fontWeight: 400,
            wordWrap: true,
            wordWrapWidth: 800,
        });

        this.explainerTitle.style = style1;
        this.explainerText.style = style2;

        this.explainerTitle.position.set(40,240);
        this.explainerText.position.set(40,320);

        stage.addChild(this.explainerTitle);
        stage.addChild(this.explainerText);

        this.explainerVisible = true;

        // Wait for the click to start the game
        document.addEventListener('mousedown', initializeGame, true);
        document.addEventListener('touchstart', initializeGame, true);

        return false;

    }


    animate() {
        if (this.schoolNameMove()) {
            if (this.explainer()) {
                this.glowCounter += 1
                explainerTitle.style.fill = explainerColors[Math.floor(this.glowCounter/10) % explainerColors.length]
            }
        }
    }


    destroy() {
        document.removeEventListener('mousedown', initializeGame, true);
        document.removeEventListener('touchstart', initializeGame, true);
        stage.removeChild(this.explainerTitle);
        stage.removeChild(this.explainerText);
        stage.removeChild(this.schoolName1);
        stage.removeChild(this.schoolName2);
    }
}


class Bee {


    constructor() {
        /* ES6 class properties */
        this.stepX = this.stepY = 0;    /* defines horizontal and vertical movement speed of bee */
        this.destX = this.destY = 0;    /* defines the current target location for bee */
        this.targetAccuracy = 10;       /* bee needs to get this close to target position */
        this.beeScale = 0.5;            /* Scale of the bee image */
        this.beeSpeed = 4;              /* speed of the bee movement */
        this.maxShake = 2;              /* maximum shake while flying */
        this.faceFlipSpeed = 150;      /* speed of face flip on destination */

        //* Ensure faceFlipSpeed counts to a multiple of faceFlipSpeed
        this.faceFlipCounterEnd = ~~(1000 / this.faceFlipSpeed) * this.faceFlipSpeed;

        // some flags
        this.isFlying = false;  // deprecated
        this.doCircle = false;
        this.circleDirection = 0;
        this.travelingToRaat = false;
        this.targetRaat = null;
        this.isFaceFlipping = false;
        this.raatreached = false;
        this.beeShaken = false;

        // some counters
        this.faceFlipCounter = 0;
        this.faceFlipStep = 0;
        // this.raatGlowCounter = 0;
        this.beeShakeCounter = 0;

        this.bee = new Sprite(PIXI.Loader.shared.resources["images/bee.png"].texture);
        this.bee.zIndex = 100;
        this.bee.anchor.set(0.5,0.5);
        this.bee.scale.set(this.beeScale,this.beeScale);
        this.startPos();    // Set bee to some random location off-stage

        // Prepare the bee to be hit by the mouse (sounds kinda silly)
        this.bee.on('mousedown',mouseHitBee);
        this.bee.on('touchstart',mouseHitBee);

        stage.addChild(this.bee);
        // this.flyTo(this.welcomeX,this.welcomeY);
    }

    canBeHit(status = true) {
        this.bee.interactive = status;
    }

    
    turnFace() {
        // Immediately turn face into traven direction
        if (this.stepX > 0) {
            this.bee.scale.x = -1 * this.beeScale;
        }
        else if (this.stepX < 0) {
            this.bee.scale.x = this.beeScale;
        }
    }


    _randomLocation(offstage = true) {
        let x,y;
        if (offstage) {
            switch(Math.floor(Math.random() * 4)) {
                case 0: /* right side */
                    x = gameWidth + 70;
                    y = gameHeight / 4 + Math.floor(Math.random() * gameHeight / 2);
                    break;
                case 1: /* top */
                    x = gameWidth / 4 + Math.floor(Math.random() * (gameWidth / 2));
                    y = -70;
                    break;
                case 2: /* bottom */
                    x = gameWidth / 4 + Math.floor(Math.random() * (gameWidth / 2));
                    y = window.innerHeight + 90;    // Smartasses resize window during game, we need the bee to go off-window
                    // y = gameHeight + 90;
                    break;
                case 3: /* right side */
                    x = -70;
                    y = gameHeight / 4 + Math.floor(Math.random() * gameHeight / 2);
                    break;
            }
        }
        else {
            x = gameWidth / 8 + Math.floor(Math.random() * (gameWidth * 6 / 8));
            y = gameHeight / 6 * Math.floor(Math.random() * (gameHeight * 4 / 6));
        }
        return [x,y];
    }


    goAway() {
        let [x,y] = this._randomLocation();
        this.flyTo(x,y);
    }

    
    startPos() {
        let [x,y] = this._randomLocation();
        this.bee.position.set(x,y);
        console.log('Bee teleported to ' + x + ',' + y);
    }

   
    flyTo(x,y) {

        this.isFaceFlipping = false;

        if (Math.abs(x - this.bee.x) < this.targetAccuracy || Math.abs(y - this.bee.y) < this.targetAccuracy) {

            // if bee is not already at x,y
            this.destX = x;
            this.destY = y;
            this.offsetX = 0;
            this.offsetY = 0;
            this.isFlying = true;

            // console.log("fly to " + x + "," + y);
            console.log("Bee asked to fly to " + x + "," + y + ' from ' + this.bee.x +',' + this.bee.y + '. We are already there');
            this.fly();
        }
        else {
            this.destX = x;
            this.destY = y;

            // Calculate the distance to travel
            this.distX = Math.abs(this.destX - this.bee.x);
            this.distY = Math.abs(this.destY - this.bee.y);

            console.log("Bee asked to fly to " + x + "," + y + ' from ' + this.bee.x +',' + this.bee.y + '. So distance is ' + this.distX + ',' + this.distY);

            // Calculate the direction we should head
            this.updateDirection();

            // this.destX = this.destY = this.stepX = this.stepY = 0;
            // this.isFlying = false;
        }
    }


    gotoRaat(targetRaat) {
        // if (this.targetRaat === null) {
            this.targetRaat = targetRaat;
            this.travelingToRaat = this.isFlying = true;
            // this.raatGlowCounter = 
            this.beeShaker = 0;
            this.raatreached = this.beeShaken = false;
            this.flyTo(this.targetRaat.x +4,this.targetRaat.y - 10);
        // }
    }


    updateDirection() {
        if (this.distX == 0) {
            this.stepX = 0;
            this.stepY = 1;
        }
        else if (this.distY == 0) {
            this.stepX = 1;
            this.stepY = 0;
        }
        else if (this.distX > this.distY) {
            this.stepX = 1;
            this.stepY = this.distY / this.distX;
        }
        else {
            this.stepX = this.distX / this.distY;
            this.stepY = 1;
        }

        /* set the direction of the movement */
        this.stepX = this.beeSpeed * (this.stepX * Math.sign(this.bee.x - this.destX) * -1);
        this.stepY = this.beeSpeed * (this.stepY * Math.sign(this.bee.y - this.destY) * -1);

        console.log('Bee will fly with speed ' + this.stepX + ',' + this.stepY);
        // console.log("stepX=" + this.stepX +" stepY=" + this.stepY);

        this.turnFace();
    }


    fly() {
        // Returns false when still flying
        // Returns true when destination reached
        if (this.bee.x == this.destX && this.bee.y == this.destY) {
            // reached destination, maybe the face needs to be flipped

            // Check direction of face. If face is facing to the left, then scale == this.beeScale. Otherwise scale == -1 * this.beeScale
            switch(this.bee.scale.x) {
                case -0.5: // facing tot the right
                    if (this.bee.x > gameWidth / 2) {
                        // we need to flip the face to the left
                        this.faceFlipCounter = -1 * this.faceFlipCounterEnd;
                        this.faceFlipStep = Math.abs(this.faceFlipSpeed);
                        // Start flipping
                        this.faceFlipCounter += this.faceFlipStep;
                        // scale
                        this.bee.scale.x = this.faceFlipCounter * this.beeScale / 1000;
                        console.log('Need to flip face to the left');
                    }
                    else {
                        // No need to flip face
                        return true;
                    }
                    break;
                case 0.5: // facing to the left
                    if (this.bee.x < gameWidth / 2) {
                        console.log("Need to flip face to the right");
                        // We need to flip the face to the right
                        this.faceFlipCounter = this.faceFlipCounterEnd;
                        this.faceFlipStep = -1 * Math.abs(this.faceFlipSpeed);
                        // Start flipping
                        this.faceFlipCounter += this.faceFlipStep;
                        // scale
                        this.bee.scale.x = this.faceFlipCounter * this.beeScale / 1000;
                    }
                    else {
                        // No need to flip face
                        return true;
                    }     
                    break;
                default: // moving from left to right or otherwise
                    // Continue flipping
                    this.faceFlipCounter += this.faceFlipStep;

                    this.bee.scale.x = this.faceFlipCounter * this.beeScale / 1000;

                    if (this.faceFlipStep < 0 && this.faceFlipCounter <= (-1 * this.faceFlipCounterEnd)) {
                        this.bee.scale.x = -0.5;
                    }
                    else if (this.faceFlipStep > 0 && this.faceFlipCounter >= this.faceFlipCounterEnd) {
                        this.bee.scale.x = 0.5;
                    }
            }
        }
        else {
            this.bee.x += this.stepX * 60 / app.ticker.FPS;
            this.bee.y += this.stepY * 60 / app.ticker.FPS;
            if ((this.stepX < 0 && this.bee.x < this.destX) || this.stepX > 0 && this.bee.x > this.destX) {
                this.bee.x = this.destX;
            }
            if ((this.stepY < 0 && this.bee.y < this.destY) || (this.stepY > 0 && this.bee.y > this.destY) ) {
                this.bee.y = this.destY;
            }
        }
    }

    shake() {
        this.shakeCounter += 0.3 * 60 / app.ticker.FPS;
        this.bee.rotation = Math.sin(this.shakeCounter) / 10;
        if (this.shakeCounter > (30 + Math.floor(Math.random() * 15))) {
            this.shakeCounter = 0;
            return true;
        }
        else {
            return false;
        }
    }



    flyCircle() {
        // Returns false when still circling
        // Returns true when done

        if (this.circleAngle == 0) {
            // console.log("Angle = " + this.circleAngle + " position=" + this.bee.x + "," + this.bee.y);
        }
        this.bee.position.set(bee.centerX + Math.cos(this.circleAngle) * beeCircleRadius,bee.centerY + Math.sin(this.circleAngle) * beeCircleRadius)
        if (this.circleAngle >= 12.566) {
            // console.log("Angle = " + this.circleAngle + " position=" + this.bee.x + "," + this.bee.y);
            return true;
        }
        this.circleAngle = this.circleAngle + 0.12566 * 60/app.ticker.FPS;
        if (DEBUG) this.circleAngle += 0,26;
        return false;
    }
}





// function helemaalniets() {
//     let logo1;
//     let raat = [0.5,587.82,0.5,196.32,339.55,0.58,678.59,196.32,678.59,587.82,339.55,783.57,0.5,587.82]
//     let raten = []


//     var graphics = new Graphics;
//     graphics.beginFill(0xed7004);
//     graphics.drawPolygon(raat);
//     graphics.endFill();
//     graphics.x = 925;
//     graphics.y = -50;
//     graphics.scale.set(0.1,0.1);
//     stage.addChild(graphics);


//     // raatTexture = new PIXI.Texture.from(raatSvg);
//     // raat = new Sprite(raatTexture);

//     // raat2 = new Sprite.from( "/images/raat2.svg")

//     loader
//         .add("images/logo-fair-life.png")
//         .load(setup);

//     // raat2.tint=0x00ff00;
//     // app.stage.addChild(raat);
//     // app.stage.addChild(raat2);


//     let state1 = play; 

//     let rotationspeed = 0.01;



//     let style = new TextStyle({
//     fontFamily: "Arial",
//     fontSize: 36,
//     fill: "white",
//     stroke: '#ff3300',
//     strokeThickness: 4,
//     dropShadow: true,
//     dropShadowColor: "#000000",
//     dropShadowBlur: 4,
//     dropShadowAngle: Math.PI / 6,
//     dropShadowDistance: 6,
//     });

//     let message = new Text("Hello Pixi!",style);
//     app.stage.addChild(message);
// }

// function setup_old() {
//     // This code will be run when the loader has finished loading the page
//     logo1 = new Sprite(PIXI.Loader.shared.resources["images/logo-fair-life.png"].texture);
//     logo1.anchor.set(0.5,0.5);
//     logo1.position.set(500,300);
//     logo1.scale.set(0.5,0.5);
//     app.stage.addChild(logo1);

//     let right = keyboard(39), left = keyboard(37);

//     left.press = () => {
//         rotationspeed = -0.05;
//     }
//     left.release = () => {
//         rotationspeed = -0.01;
//     }
//     right.press = () => {
//         rotationspeed = 0.05;
//     }
//     right.release = () => {
//         rotationspeed = 0.01;
//     }


//     app.ticker.add(delta => gameLoop(delta));
// }



// function play2(delta) {
//     logo1.rotation += rotationspeed;
// }


//     function keyboard(keyCode) {
//         var key = {}
//         key.code = keyCode;
//         key.isDown = false;
//         key.isUp= true;
//         key.release = undefined;
//         key.press = undefined;

//         key.upHandler = event => {
//             if (event.keyCode === key.code) {
//                 if (key.isDown && key.release) key.release();
//                 key.isDown = false;
//                 key.isUp = true;
//             }
//             event.preventDefault();
//         }
//         key.downHandler = event => {
//             if (event.keyCode === key.code) {
//                 if (key.isUp && key.press) key.press();
//                 key.isUp = false;
//                 key.isDown = true;
//                 console.log("key down");
//             }
//             event.preventDefault();
//         }

//         const downListener = key.downHandler.bind(key);
//         const upListener = key.upHandler.bind(key);

//         window.addEventListener("keydown", downListener,false);
//         window.addEventListener("keyup",upListener,false);

//         key.unsubscribe = () => {
//             window.removeEventListener("keydown",downListener);
//             window.removeEventListener("keyup",upListener);
//         }
//         return key;
//     }


