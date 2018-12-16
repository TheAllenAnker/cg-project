/********************************************************************************
 明暗着色的旋转立方体，四个按钮，三个控制X,Y,Z旋转轴，toggle停止旋转切换
 shadedCube: rotating cube

 注意：视点在原点，WC，WC重合，视点在立方体内。      光源是平行光（1,1,1,0）
 *********************************************************************************/
"use strict";

var canvas;
var gl;

var pointsArray = [];//存放 按每面两个三角形6个顶点顺序放的顶点位置 数组
var normalsArray = [];//存放 按每面两个三角形6个顶点顺序放的顶点法向量 数组

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

// for (let i = 0; i < 8; i++) {
//     for (let j = 0; j < 3; j++) {
//         vertices[i][j] += 0.25;
//     }
// }

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );//A=0表示无穷远光及方向，A=1表示点光源及位置

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

//var ctm;//后面代码并没有用到？？？

var ambientColor, diffuseColor, specularColor;

var scaleMatrix = mat4();
var projectionMatrix = mat4();
var modelViewMatrix;//模视变换矩阵，但是这个例子中只是立方体的模型变换

//视点 eye 的极坐标初始值为
var radius = 1.0;
var theta = 0.0;
var phi = 0.0;

var eye;

const at = vec3(0, 0, 0);
const up = vec3(0, 1, 0);


//平行投影：
const near = -100;
const far = 100;
const left = -1;
const right = 1;
const vtop = 1;
const bottom = -1;

//透视投影：
const fovy = 90.0;  // Field-of-view in Y direction angle (in degrees)
// Viewport aspect ratio
const aspect = 1;

var numVertices = 36;

var width = 0.5;
var height = 0.5;
var depth = 1.0;
var isOrtho = true;

var program;

//var viewerPos=vec3(0.0, 0.0, -20.0 );//wc下观察者位置,事实上没有使用，shader中默认相机在WC原点
var projection;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var thetaRotate =[0, 0, 0];
var thetaLoc;

var flag = false;//Toggle Rotation 开启结束旋转

//立方体每个面6个顶点位置及法向量,先计算每个面的法向量，
//然后，每个面分成两个三角形，按顺序分别将其顶点位置写入pointsArray数组，
//将顶点法向量装入normalsArray数组

function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);

    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    pointsArray.push(vertices[b]);
    normalsArray.push(normal);
    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    pointsArray.push(vertices[d]);
    normalsArray.push(normal);
}


function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}



window.onload = function init() {
    //============init WebGL
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);


    //=========Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    colorCube();//立方体的所有顶点位置和法向量写入缓存

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );//顶点位置数组pointsArray写入缓存vBuffer缓存

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);                     //vBuffer缓存同SHADER中的顶点属性vPosition，建立关联

    var ambientProduct = mult(lightAmbient, materialAmbient);//计算出Ia*Ka
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);//计算出Id*Kd
    var specularProduct = mult(lightSpecular, materialSpecular);//计算出Is*Ks


    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));//传递环境反射向量
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );//传递漫反射向量
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );//传递镜面反射向量
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );//传递光源位置向量
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);//传递镜面反射的高光系数

    thetaLoc = gl.getUniformLocation(program, "theta"); //获取shader变量theta位置

    var x = radius * Math.sin(theta) * Math.cos(phi);
    var y = radius * Math.sin(theta) * Math.sin(phi);
    var z = radius * Math.cos(theta);

    var p = document.getElementById("eye");
    var p2 = document.getElementById("eye2");
    p2.innerHTML = "Cartesian&nbsp;eye(x,y,z): " + x + ", " + y + ", " + z;

    //交互控制，获取旋转轴选项X,Y,Z参数， 和是否继续旋转开关参数
    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    document.getElementById("width").onchange = function (event) {
        width = event.target.value;
    };
    document.getElementById("height").onchange = function (event) {
        height = event.target.value;
    };
    document.getElementById("depth").onchange = function (event) {
        depth = event.target.value;
    };

    document.getElementById("radius").onchange = function (event) {
        radius = event.target.value;
        p.innerHTML = "eye(radius,theta,phi): " + radius + ", " + theta + ", " + phi;
        var x = radius * Math.sin(theta) * Math.cos(phi);
        var y = radius * Math.sin(theta) * Math.sin(phi);
        var z = radius * Math.cos(theta);
        p2.innerHTML = "eye(x,y,z): " + x + ", " + y + ", " + z;
    };
    document.getElementById("theta").onchange = function (event) {
        theta = event.target.value;
        p.innerHTML = "eye(radius,theta,phi): " + radius + ", " + theta + ", " + phi;
        var x = radius * Math.sin(theta) * Math.cos(phi);
        var y = radius * Math.sin(theta) * Math.sin(phi);
        var z = radius * Math.cos(theta);
        p2.innerHTML = "eye(x,y,z): " + x + ", " + y + ", " + z;
    };
    document.getElementById("phi").onchange = function (event) {
        phi = event.target.value;
        p.innerHTML = "eye(radius,theta,phi): " + radius + ", " + theta + ", " + phi;
        var x = radius * Math.sin(theta) * Math.cos(phi);
        var y = radius * Math.sin(theta) * Math.sin(phi);
        var z = radius * Math.cos(theta);
        p2.innerHTML = "eye(x,y,z): " + x + ", " + y + ", " + z;
    };
    // keydown listener for the keyboard events
    document.onkeydown = function(){
        // 'O' keydown
        if (event.keyCode === 79) {
            isOrtho = true;
        }
        // 'P' keydown
        if (event.keyCode === 80) {
            isOrtho = false;
        }
        // 'W' keydown
        if (event.keyCode === 87) {
            axis = yAxis;
            thetaRotate[axis] += 2.0;
        }
        // 'A' keydown
        if (event.keyCode === 65) {
            axis = zAxis;
            thetaRotate[axis] -= 2.0;
        }
        // 'S' keydown
        if (event.keyCode === 83) {
            axis = yAxis;
            thetaRotate[axis] -= 2.0;
        }
        // 'D' keydown
        if (event.keyCode === 68) {
            axis = zAxis;
            thetaRotate[axis] += 2.0;
        }
        // 'Q' keydown
        if (event.keyCode === 81) {
            axis = xAxis;
            thetaRotate[axis] -= 2.0;
        }
        // 'E' keydown
        if (event.keyCode === 69) {
            axis = xAxis;
            thetaRotate[axis] += 2.0;
        }
        // 'Space' keydown
        if (event.keyCode === 32) {
            flag = !flag;
        }
    };

    //进行渲染
    render();
};

var render = function(){

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta));

    if(flag) thetaRotate[axis] += 2.0;

    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = mult(modelViewMatrix, rotate(thetaRotate[xAxis], [1, 0, 0] ));
    modelViewMatrix = mult(modelViewMatrix, rotate(thetaRotate[yAxis], [0, 1, 0] ));
    modelViewMatrix = mult(modelViewMatrix, rotate(thetaRotate[zAxis], [0, 0, 1] ));

    scaleMatrix = scalem(width, height, depth);
    if (isOrtho) {
        projectionMatrix = ortho(left, right, bottom, vtop, near, far);//wc下正交投影裁剪范围
    } else {
        projectionMatrix = perspective(fovy, aspect, near, far);
    }

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix));//传投影变换矩阵
    gl.uniformMatrix4fv( gl.getUniformLocation(program,"modelViewMatrix"), false, flatten(modelViewMatrix) );//传递旋转变换矩阵，即模视矩阵
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "scaleMatrix"), false, flatten(scaleMatrix));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );//启动shader绘制三角形，numVertices初始化为36（6*6=36个三角形顶点）

    requestAnimFrame(render);//双帧切换
};
