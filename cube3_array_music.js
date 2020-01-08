var gl;
var program;

var N = 15;

var numVertices = N * 2 + 1;

var musicStarted = 0;

var pointsArray = [];
var volumeArray = [];
var texCoordsArray = [];
var texArray = [];

var textures = [];

var texCoord = [
    vec2(0, 1),
    vec2(1, 1),
    vec2(0, 0),
    vec2(1, 0),
];

// place one square into pointsArray
function square(midX, midY, width, height, tex) {
    let delX = width / 2;
    let delY = height / 2;
    pointsArray.push(vec2(midX - delX, midY + delY)); // left up
    texCoordsArray.push(texCoord[0]);
    texArray.push(tex);
    pointsArray.push(vec2(midX + delX, midY + delY)); // right up
    texCoordsArray.push(texCoord[1]);
    texArray.push(tex);
    pointsArray.push(vec2(midX - delX, midY - delY)); // left down
    texCoordsArray.push(texCoord[2]);
    texArray.push(tex);
    pointsArray.push(vec2(midX + delX, midY + delY)); // right up
    texCoordsArray.push(texCoord[1]);
    texArray.push(tex);
    pointsArray.push(vec2(midX - delX, midY - delY)); // left down
    texCoordsArray.push(texCoord[2]);
    texArray.push(tex);
    pointsArray.push(vec2(midX + delX, midY - delY)); // right down
    texCoordsArray.push(texCoord[3]);
    texArray.push(tex);
}

var meowDiff = 2 / (N * 6 + 4) * 2;

function colorCube() {
    let padding = 2 / (N * 6 + 4);
    let width = padding * 2;
    let delta = width + padding;
    let leftBorder = -1+padding+(width/2);
    for ( let i=0; i<numVertices; i++ ) {
        // bar
        square( leftBorder+i*delta, 0, width, 0.4, 1 );
        // meow
        square( leftBorder+i*delta, 0.4, width, width, 0);
    }
}

function configureTexture() {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

// set a image to texture buffer
function configureImage(src, n) {
    var image = new Image();
    image.onload = function () {
        gl.activeTexture(gl.TEXTURE0 + n);
        gl.bindTexture(gl.TEXTURE_2D, textures[n]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }
    image.src = src;

    return image;
}

var analyser;
var frequencyData = new Uint8Array();

window.onload = function init() {
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	//
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // setup textures meow.png
    textures.push(this.configureTexture());
    configureImage('image/meow.png', 0);

    textures.push(this.configureTexture());
    configureImage('image/blank.png', 1);

    gl.uniform1iv(gl.getUniformLocation(program, 'u_texture'), [0, 1]);

    //event listeners for buttons 
    document.getElementById( "myBtn" ).onclick = startMusic;

    render();
};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    // setup bars
    colorCube();
    
    // vertex array attribute buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // texture-coordinate array atrribute buffer
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    // tex attribute
    var ttBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, ttBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texArray), gl.STATIC_DRAW );
    
    var vTexIdx = gl.getAttribLocation( program, "vTexIdx" );
    gl.vertexAttribPointer( vTexIdx, 1, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexIdx );

	// update data in frequencyData
    if (musicStarted) analyser.getByteFrequencyData(frequencyData);
    
    // render frame based on values in frequencyData
    if (musicStarted)  {
        volumeArray = [];
        // bar: 3, 5, 6 wont move
        // meow: all move
        for ( let i=-N; i<=N; i++ ) {
            let volumeValue = frequencyData[Math.floor(256/numVertices)*(i+N)] / 255 * N;
            volumeValue = Math.pow(volumeValue, 4)*0.001;
            for ( let j=1; j<=12; j++ ) {
                if ( j == 3 || j == 5 || j == 6 ) {
                    volumeArray.push(1);
                } else if ( j == 7 || j == 8 || j == 10 ) {
                    if ( volumeValue == 0 ) {
                        volumeArray.push(1);
                    } else {
                        volumeArray.push(volumeValue*((meowDiff/volumeValue+0.4-meowDiff)/0.4+meowDiff))
                    }
                } else {
                    if ( volumeValue == 0 ) {
                        volumeArray.push(1);
                    } else {
                        volumeArray.push(volumeValue);
                    }
                }
            }
        }

        var vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(volumeArray), gl.STATIC_DRAW );

        var vVolume = gl.getAttribLocation( program, "vVolume" );
        gl.vertexAttribPointer( vVolume, 1, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vVolume );
    }
    gl.drawArrays( gl.TRIANGLES, 0, numVertices*12 );

    pointsArray = [];
    texCoordsArray = [];
    texArray = [];

    requestAnimFrame( render );
}

function startMusic() {
	if (musicStarted) return;

  //=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // Experimenting with HTML5 audio
 
	var context = new AudioContext();
	var audio = document.getElementById('myAudio');
	var audioSrc = context.createMediaElementSource(audio);
	var sourceJs = context.createScriptProcessor(2048); // createJavaScriptNode() deprecated.

	analyser = context.createAnalyser();

  // we could configure the analyser: e.g. analyser.fftSize (for further infos read the spec)
    analyser.smoothingTimeConstant = 0.8;
	analyser.fftSize = 2048;

  // we have to connect the MediaElementSource with the analyser 
	audioSrc.connect(analyser);
	analyser.connect(sourceJs);
	sourceJs.buffer = audioSrc.buffer;
	sourceJs.connect(context.destination);
	audioSrc.connect(context.destination);

 	sourceJs.onaudioprocess = function(e) {
		// frequencyBinCount tells you how many values you'll receive from the analyser
		frequencyData = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(frequencyData);
	};

	musicStarted = 1;
	audio.play();
 //=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-	
}