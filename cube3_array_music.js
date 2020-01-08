var gl;
var program;

var N = 15;

var numVertices = N * 2 + 1;

var musicStarted = 0;

var pointsArray = [];
var volumeArray = [];
var texCoordsArray = [];

var texture;

var texCoord = [
    vec2(0, 1),
    vec2(1, 1),
    vec2(0, 0),
    vec2(1, 0),
];

// place one square into pointsArray
function square(midX, midY, width, height) {
    let delX = width / 2;
    let delY = height / 2;
    pointsArray.push(vec2(midX - delX, midY + delY)); // left up
    // console.log(midX - delX, midY + delY); // left up
    texCoordsArray.push(texCoord[0]);
    pointsArray.push(vec2(midX + delX, midY + delY)); // right up
    // console.log(midX + delX, midY + delY); // right up
    texCoordsArray.push(texCoord[1]);
    pointsArray.push(vec2(midX - delX, midY - delY)); // left down
    // console.log(midX - delX, midY - delY); // left down
    texCoordsArray.push(texCoord[2]);
    pointsArray.push(vec2(midX + delX, midY + delY)); // right up
    // console.log(midX + delX, midY + delY); // right up
    texCoordsArray.push(texCoord[1]);
    pointsArray.push(vec2(midX - delX, midY - delY)); // left down
    // console.log(midX - delX, midY - delY); // left down
    texCoordsArray.push(texCoord[2]);
    pointsArray.push(vec2(midX + delX, midY - delY)); // right down
    console.log(midX, midY); // right down
    texCoordsArray.push(texCoord[3]);
}

function colorCube() {
    let padding = 2 / (N * 6 + 4);
    let width = padding * 2;
    let delta = width + padding;
    let leftBorder = -1+padding+(width/2);
    for ( let i=0; i<numVertices; i++ )
        square( leftBorder+i*delta, 0, width, 0.5 );
}

// set a image to texture buffer
// configureImage(src, n) {
//     var image = new Image();
//     image.onload = function () {
//         gl.activeTexture(gl.TEXTURE0 + n);
//         gl.bindTexture(gl.TEXTURE_2D, this.textures[n]);
//         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
//     }.bind(this);
//     image.src = src;

//     return image;
// }

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

	// Generate pointsArray[]
	// We don't use indices and ELEMENT_ARRAY_BUFFER (as in previous example)
	// because we need to assign different face normals to shared vertices.
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

    // setup textures (cat body, cat head)
    // configureImage('image/cat-body.png', 0);
    // configureImage('image/cat-head.png', 1);

    //event listeners for buttons 
    document.getElementById( "myBtn" ).onclick = startMusic;

    render();
};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

	// update data in frequencyData
    if (musicStarted) analyser.getByteFrequencyData(frequencyData);

    // render frame based on values in frequencyData
    if (musicStarted)  {
        volumeArray = [];
        for ( let i=-N; i<=N; i++ ) {
            volumeArray.push(frequencyData[Math.floor(256/numVertices)*(i+N)] / 255 * N );
            volumeArray.push(frequencyData[Math.floor(256/numVertices)*(i+N)] / 255 * N );
            volumeArray.push(10);
            volumeArray.push(frequencyData[Math.floor(256/numVertices)*(i+N)] / 255 * N );
            volumeArray.push(10);
            volumeArray.push(10);
        }

        var vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(volumeArray), gl.STATIC_DRAW );

        var vVolume = gl.getAttribLocation( program, "vVolume" );
        gl.vertexAttribPointer( vVolume, 1, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vVolume );
    }
    gl.drawArrays( gl.TRIANGLES, 0, numVertices*6 );

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