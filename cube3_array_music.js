
var gl;
var program;

var N = 10;  // The number of cubes will be (2N+1)^3

// var axis = 0;
// var theta = [ 0, 0, 0 ];
var musicStarted = 0;

// var moonRotationMatrix = mat4();

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
    analyser.smoothingTimeConstant = 0.6;
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

// ModelView and Projection matrices
var modelingLoc, viewingLoc, projectionLoc, lightMatrixLoc;
var modeling, viewing, projection;

var volumeLoc;

var numVertices = 18;

var pointsArray = [];
var colorsArray = [];
var normalsArray = [];
var texCoordsArray = [];

var texture;

var texCoord = [
    vec2(0, 2),
    vec2(0, 0),
    vec2(1, 0),
    vec2(1, 2)
];

var vertices = [
	vec4( -0.5, -0.5,  0.5, 1 ),
	vec4( -0.5,  0.5,  0.5, 1 ),
	vec4(  0.5,  0.5,  0.5, 1 ),
	vec4(  0.5, -0.5,  0.5, 1 ),
	vec4( -0.5, -0.5, -0.5, 1 ),
	vec4( -0.5,  0.5, -0.5, 1 ),
	vec4(  0.5,  0.5, -0.5, 1 ),
	vec4(  0.5, -0.5, -0.5, 1 )
];

// Using off-white cube for testing
var vertexColors = [
	vec4( 1.0, 1.0, 0.8, 1.0 ),  
	vec4( 1.0, 1.0, 0.8, 1.0 ),  
	vec4( 1.0, 1.0, 0.8, 1.0 ),  
	vec4( 1.0, 1.0, 0.8, 1.0 ),  
	vec4( 1.0, 1.0, 0.8, 1.0 ),  
	vec4( 1.0, 1.0, 0.8, 1.0 ),  
	vec4( 1.0, 1.0, 0.8, 1.0 ),  
	vec4( 1.0, 1.0, 0.8, 1.0 )
];

var eyePosition = vec4( 0.0, 0.0, 2.0, 1.0);
var lightPosition = vec4( 0.0, 100.0, 100.0, 1.0 );

var materialAmbient = vec4( 0.25, 0.25, 0.25, 1.0 );
var materialDiffuse = vec4( 0.8, 0.8, 0.8, 1.0);
var materialSpecular = vec4( 1.0, 0.0, 0.0, 1.0 );
var materialShininess = 100.0;

function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

function quad(a, b, c, d) {

    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);  // cross returns vec3
    normal.push(0.0); // convert to vec4
    normal = normalize(normal);

    pointsArray.push(vertices[a]); 
	 colorsArray.push(vertexColors[a]);
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[0]);
    pointsArray.push(vertices[b]); 
	 colorsArray.push(vertexColors[b]);
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[1]);
    pointsArray.push(vertices[c]); 
	 colorsArray.push(vertexColors[c]);
     normalsArray.push(normal);   
     texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[a]);  
	 colorsArray.push(vertexColors[a]);
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[0]);
    pointsArray.push(vertices[c]); 
	 colorsArray.push(vertexColors[c]);
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[2]);
    pointsArray.push(vertices[d]); 
	 colorsArray.push(vertexColors[d]);
     normalsArray.push(normal);
     texCoordsArray.push(texCoord[3]);	 
}


function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 3, 0, 4, 7 );
    // quad( 1, 1, 1, 1 );
    quad( 6, 5, 1, 2 );
    // quad( 1, 1, 1, 1 );
    quad( 4, 5, 6, 7 );
    // quad( 1, 1, 1, 1 );
    quad( 5, 4, 0, 1 );
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
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	// Generate pointsArray[], colorsArray[] and normalsArray[] from vertices[] and vertexColors[].
	// We don't use indices and ELEMENT_ARRAY_BUFFER (as in previous example)
	// because we need to assign different face normals to shared vertices.
	colorCube();
    
    // vertex array attribute buffer
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // color array atrribute buffer
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    // var vColor = gl.getAttribLocation( program, "vColor" );
    // gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    // gl.enableVertexAttribArray( vColor );

    // normal array atrribute buffer

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    // texture-coordinate array atrribute buffer

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    //
    // Initialize a texture
    //
    var image = new Image();
    image.onload = function() { 
        configureTexture( image );
    }
    image.src = "bump.jpg";

	// uniform variables in shaders
    modelingLoc   = gl.getUniformLocation(program, "modelingMatrix"); 
    viewingLoc    = gl.getUniformLocation(program, "viewingMatrix"); 
    projectionLoc = gl.getUniformLocation(program, "projectionMatrix"); 
    // lightMatrixLoc= gl.getUniformLocation(program, "lightMatrix"); 

	volumeLoc = gl.getUniformLocation(program, "volume");

    // gl.uniform4fv( gl.getUniformLocation(program, "eyePosition"), 
    //    flatten(eyePosition) );
    // gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),
       // flatten(lightPosition) );
    gl.uniform4fv( gl.getUniformLocation(program, "materialAmbient"),
       flatten(materialAmbient) );
    gl.uniform4fv( gl.getUniformLocation(program, "materialDiffuse"),
       flatten(materialDiffuse) );
    gl.uniform4fv( gl.getUniformLocation(program, "materialSpecular"), 
       flatten(materialSpecular) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), materialShininess);

    //event listeners for buttons 
    document.getElementById( "myBtn" ).onclick = startMusic;

    render();
};

function render() {
	// modeling = mult(rotate(theta[xAxis], 1, 0, 0),
	//                 mult(rotate(theta[yAxis], 0, 1, 0),rotate(theta[zAxis], 0, 0, 1)));

    modeling = rotate(90, 1, 0, 0);
	
	viewing = lookAt(vec3(eyePosition), [0,0,0], [0,1,0]);

	projection = perspective(45, 1.0, 1.0, 2.0);

    gl.clear( gl.COLOR_BUFFER_BIT );

    gl.uniformMatrix4fv( viewingLoc,    0, flatten(viewing) );
	gl.uniformMatrix4fv( projectionLoc, 0, flatten(projection) );
	// gl.uniformMatrix4fv( lightMatrixLoc,0, flatten(moonRotationMatrix) );

	// update data in frequencyData
    if (musicStarted) analyser.getByteFrequencyData(frequencyData);

	// Uncomment the next line to see the frequencyData[] in the console
	// console.log(frequencyData)

	var N2 = 2*N+1;
	var step = 1.0/N2;
	var size = step * 0.6;
	
	for (i=-N; i<=N; i++) {
		// render frame based on values in frequencyData
		if (musicStarted) gl.uniform1f( volumeLoc, frequencyData[Math.floor(256/N2)*(i+N)] /255 * N );	

		for (j=-0; j<=0; j++) {
			for (k=-0; k<=0; k++) {
//				var cloned = mult(mult(translate(step*i, step*j, step*k), scale(0.12, 0.12, 0.12)), modeling);
				var cloned = mult(modeling, mult(translate(step*i, step*j, step*k), scale(size, 0, size*3)));
				
				gl.uniformMatrix4fv( modelingLoc, 0, flatten(cloned) );
				gl.drawArrays( gl.TRIANGLES, 0, numVertices );
			}
		}
	}

    requestAnimFrame( render );
}
