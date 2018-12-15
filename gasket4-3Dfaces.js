/*立方体划分，三角形面图元填充，每个面一种颜色，立体感很好，效果好*/
"use strict";


var canvas;
var gl;

var vertices = [vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5, -0.5, -0.5, 1.0 ),

];

/*var vertices = [vec4( -0.5, -0.5,  0.5, 1.0), 
				vec4( -0.5,  0.5,  0.5, 1.0 ), 
				vec4(  0.5,  0.5,  0.5, 1.0 ), 
				vec4(  0.5, -0.5,  0.5, 1.0 ), 
				vec4( -0.5, -0.5, -0.5, 1.0 ), 
				vec4( -0.5,  0.5, -0.5, 1.0 ), 
				vec4(  0.5,  0.5, -0.5, 1.0 ), 
				vec4(  0.5, -0.5, -0.5, 1.0 ) ];*/
				

var vertexColors = [[ 0.0, 0.0, 0.0, 1.0 ],  // black 
					[ 1.0, 0.0, 0.0, 1.0 ],  // red 
					[ 1.0, 1.0, 0.0, 1.0 ],  // yellow 
					[ 0.0, 1.0, 0.0, 1.0 ],  // green 
					[ 0.0, 0.0, 1.0, 1.0 ],  // blue 
					[ 1.0, 0.0, 1.0, 1.0 ],  // magenta 
					[ 0.0, 1.0, 1.0, 1.0 ],  // cyan 
					[ 1.0, 1.0, 1.0, 1.0 ]   // white 
					];

		
var points=[];
var colors=[];
		
//视点eye的极坐标初始值为
var radius = 1.0;
var theta  = 0.0;
var phi    = 0.0;

var modelViewMatrix=mat4();
var projectionMatrix=mat4();
var scaleMatrix=mat4();
var scaleMatrixLoc;
var modelViewMatrixLoc;
var projectionMatrixLoc;

var eye;

const at=vec3(0,0,0);
const up=vec3(0,1,0);


//平行投影：
const near = 0.2;
const far = 2;
const left = -2;
const right = 2;
const vtop = 2;
const bottom = -2;

//透视投影：
const  fovy = 90.0;  // Field-of-view in Y direction angle (in degrees)
const  aspect=1;      
 // Viewport aspect ratio

 var numVertices=36;
 
 var width=1.0;
 var height=1.0;
 var depth=1.0;
 var exchange=0;

window.onload = function init()
{
    //=====================================================   
//  Initialize our data for the Sierpinski Gasket
    //=====================================================  
// First, initialize the vertices of our 3D gasket   
// Four vertices on unit circle    
// Intial tetrahedron with equal length sides  
//divideTetra( vertices[0], vertices[1], vertices[2], vertices[3],NumTimesToSubdivide);  
//======================================================   
//  Configure WebGL and load shaders
    //==========================================================	
canvas = document.getElementById( "gl-canvas" );   
gl = WebGLUtils.setupWebGL( canvas );  
if ( !gl ) { alert( "WebGL isn't available" ); }  

gl.viewport( 0, 0, canvas.width, canvas.height );  
gl.clearColor( 1.0, 1.0, 1.0, 1.0 ); 
// enable hidden-surface removal
cube();
gl.enable(gl.DEPTH_TEST);
    
//  Load shaders and initialize attribute buffers
    
var program = initShaders( gl, "vertex-shader", "fragment-shader" );   
gl.useProgram( program );	

	//==================================================================
    
// Create a buffer object, initialize it, and associate it with the
    
//  associated attribute variable in our vertex shader
	
//注意： 语句顺序，默认是把当前数组缓存中传递数据到GPU.位置和颜色两组语句不能混杂排列！！！
    //==================================================================
	
	//创建顶点颜色缓存当前缓存，将JS颜色数组colors转换后放入cBuffer.
	
//并关联属性变量vColor和顶点着色器中的颜色变量“vColor”. 
	
//传递数据到GPU：
var cBuffer = gl.createBuffer(); 
gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );  
var vColor = gl.getAttribLocation( program, "vColor" );
//返回顶点着色器中属性变量的索引  
//描述数组中的数据形式（这里每3个浮点数一组，不归一化，跨幅为0，从buffer偏移0开始）
gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
//描述顶点属性数组中的数据形式	 
gl.enableVertexAttribArray( vColor );
//开启着色器中的属性变量
gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
//传递当前缓存数据到GPU


	
//创建顶点位置缓存为当前缓存，将JS顶点数组points转换后放入vBuffer.
//关联属性变量vPositon和顶点着色器中的位置变量"vPosition" 
//传递数据到GPU：
var vBuffer = gl.createBuffer();  
gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );	
var vPosition = gl.getAttribLocation( program, "vPosition" );
//返回顶点着色器中属性变量的索引   
gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
//描述顶点属性数组中的数据形式	  
gl.enableVertexAttribArray( vPosition );
//开启着色器中的属性变量
gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
//传递当前缓存数据到GPU
    //==================================================================
    
// 简单的调用绘制图形函数的自定义渲染函数render function
	//==================================================================
    
	modelViewMatrixLoc=gl.getUniformLocation(program, "modelViewMatrix");
	projectionMatrixLoc=gl.getUniformLocation(program, "projectionMatrix");
	scaleMatrixLoc=gl.getUniformLocation(program, "scaleMatrix");
	
	var x=radius*Math.sin(theta)*Math.cos(phi); 
	var y=radius*Math.sin(theta)*Math.sin(phi); 
	var z=radius*Math.cos(theta);

	var p=document.getElementById("eye");
	var p2=document.getElementById("eye2");
	p2.innerHTML="eye(x,y,z): "+x+", "+y+", "+z;
	document.getElementById("width").onchange=function (event){
		width=event.target.value;
	}
	document.getElementById("height").onchange=function (event){
		height=event.target.value;
	}
	document.getElementById("depth").onchange=function (event){
		depth=event.target.value;
	}
	document.getElementById("radius").onchange=function (event){
		radius=event.target.value;
		p.innerHTML="eye(radius,theta,phi): "+radius+", "+theta+", "+phi;
		var x=radius*Math.sin(theta)*Math.cos(phi); 
		var y=radius*Math.sin(theta)*Math.sin(phi); 
		var z=radius*Math.cos(theta);
		p2.innerHTML="eye(x,y,z): "+x+", "+y+", "+z;
	}
	document.getElementById("theta").onchange=function (event){
		theta=event.target.value;
		p.innerHTML="eye(radius,theta,phi): "+radius+", "+theta+", "+phi;
		var x=radius*Math.sin(theta)*Math.cos(phi); 
		var y=radius*Math.sin(theta)*Math.sin(phi); 
		var z=radius*Math.cos(theta);
		p2.innerHTML="eye(x,y,z): "+x+", "+y+", "+z;
	}
	document.getElementById("phi").onchange=function (event){
		phi=event.target.value;
		p.innerHTML="eye(radius,theta,phi): "+radius+", "+theta+", "+phi;
		var x=radius*Math.sin(theta)*Math.cos(phi); 
		var y=radius*Math.sin(theta)*Math.sin(phi); 
		var z=radius*Math.cos(theta);
		p2.innerHTML="eye(x,y,z): "+x+", "+y+", "+z;
	}
	
	
	document.getElementById("changeBtn").onclick=function (event){
		if(exchange==0){
			exchange=1;
		}else{
			exchange=0;
		}
	}
render();

};

function render()
{
	
//注意：这里不仅设背景色，而且增加了深度缓存的清除，设置初始颜色。
    
gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
			radius*Math.sin(theta)*Math.sin(phi),
			radius*Math.cos(theta));
			
modelViewMatrix=lookAt(eye,at,up);
if(exchange==0){
	projectionMatrix=ortho(left,right,bottom,vtop,near,far);
}else if(exchange==1){
	projectionMatrix=perspective(fovy, aspect, near, far); 
}
scaleMatrix=scalem(width,height,depth);
gl.uniformMatrix4fv(modelViewMatrixLoc,false,flatten(modelViewMatrix));
gl.uniformMatrix4fv(projectionMatrixLoc,false,flatten(projectionMatrix));
gl.uniformMatrix4fv(scaleMatrixLoc,false,flatten(scaleMatrix));
//gl.uniform1f(scaleLoc, scale);
//这里调用绘制的是buffer中的顶点数据，按照三角形基本图元来绘制，四个点一组。
	
gl.drawArrays(gl.TRIANGLES, 0, numVertices );
requestAnimFrame( render );
}

function cube()
{
	quad(1,0,3,2);
	quad(2,3,7,6);
	quad(3,0,4,7);
	quad(6,5,1,2);
	quad(4,5,6,7);
	quad(5,4,0,1);
}

function quad(a,b,c,d)
{
	var indices=[a,b,c,a,c,d];
	
	for(var i=0;i<indices.length;++i){
		points.push(vertices[indices[i]]);
		colors.push(vertexColors[a]);
	}
}
