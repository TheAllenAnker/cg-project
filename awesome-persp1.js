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
var textureCoordsArray = [];

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0),

    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0),  // white
];

// set the coordinates for the two objects
for (let i = 0; i < 8; i++) {
    vertices[i][0] -= 1.5;
}

for (let i = 8; i < 16; i++) {
    vertices[i][0] += 1.0;
}

var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

var textureCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);//A=0表示无穷远光及方向，A=1表示点光源及位置

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
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
const near = 0.3;
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

var width = 0.3;
var height = 0.3;
var depth = 1.0;
var isOrtho = true;

var program;

//var viewerPos=vec3(0.0, 0.0, -20.0 );//wc下观察者位置,事实上没有使用，shader中默认相机在WC原点
var projection;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var thetaRotate = [0, 0, 0];
var thetaLoc;

var flag = false;//Toggle Rotation 开启结束旋转
var fogFlag = false; // fog control
var scrollFlag = true; // prevent the page from scrolling when the mouse wheel is scrolling

var numTimesToSubdivide = 3;
var index = 72;

function triangle(a, b, c) {

    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    // normals are vectors
    normalsArray.push(a[0], a[1], a[2], 0.0);
    normalsArray.push(b[0], b[1], b[2], 0.0);
    normalsArray.push(c[0], c[1], c[2], 0.0);

    textureCoordsArray.push(vertexColors[5]);
    textureCoordsArray.push(vertexColors[6]);
    textureCoordsArray.push(vertexColors[7]);

    index += 3;
}


function divideTriangle(a, b, c, count) {
    if (count > 0) {

        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    } else {
        triangle(a, b, c);
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

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
    textureCoordsArray.push(textureCoord[0]);

    pointsArray.push(vertices[b]);
    normalsArray.push(normal);
    textureCoordsArray.push(textureCoord[1]);

    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    textureCoordsArray.push(textureCoord[2]);

    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    textureCoordsArray.push(textureCoord[0]);

    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    textureCoordsArray.push(textureCoord[2]);

    pointsArray.push(vertices[d]);
    normalsArray.push(normal);
    textureCoordsArray.push(textureCoord[3]);
}


function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);

    quad(9, 8, 11, 10);
    quad(10, 11, 15, 14);
    quad(11, 8, 12, 15);
    quad(14, 13, 9, 10);
    quad(12, 13, 14, 15);
    quad(13, 12, 8, 9);
}

window.onload = function init() {
    //============init WebGL
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);


    //=========Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var image = new Image();
    var texture = gl.createTexture();
    image.src = "panda.png";
    image.onload = function () {
        configureTexture(texture, image);
    };

    colorCube();//立方体的所有顶点位置和法向量写入缓存
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);//顶点位置数组pointsArray写入缓存vBuffer缓存

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);                     //vBuffer缓存同SHADER中的顶点属性vPosition，建立关联

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoordsArray), gl.STATIC_DRAW);

    var aTextCoords = gl.getAttribLocation(program, "aTextCoords");
    gl.vertexAttribPointer(aTextCoords, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aTextCoords);

    var ambientProduct = mult(lightAmbient, materialAmbient);//计算出Ia*Ka
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);//计算出Id*Kd
    var specularProduct = mult(lightSpecular, materialSpecular);//计算出Is*Ks


    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));//传递环境反射向量
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));//传递漫反射向量
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));//传递镜面反射向量
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));//传递光源位置向量
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);//传递镜面反射的高光系数

    thetaLoc = gl.getUniformLocation(program, "theta"); //获取shader变量theta位置

    var x = radius * Math.sin(theta) * Math.cos(phi);
    var y = radius * Math.sin(theta) * Math.sin(phi);
    var z = radius * Math.cos(theta);

    var p = document.getElementById("eye");
    var p2 = document.getElementById("eye2");
    p2.innerHTML = "Cartesian&nbsp;eye(x,y,z): " + x + ", " + y + ", " + z;

    //交互控制，获取旋转轴选项X,Y,Z参数， 和是否继续旋转开关参数
    document.getElementById("ButtonX").onclick = function () {
        axis = xAxis;
    };
    document.getElementById("ButtonY").onclick = function () {
        axis = yAxis;
    };
    document.getElementById("ButtonZ").onclick = function () {
        axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function () {
        flag = !flag;
    };
    document.getElementById("fogBtn").onclick = function () {
        fogFlag = !fogFlag;
    };

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
    document.onkeydown = function () {
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
            event.preventDefault();
            flag = !flag;
        }
    };

    if (document.addEventListener) {
        document.addEventListener("DOMMouseScroll", scrollFunc, false);
    } // w3c
    window.onmousewheel = document.onmousewheel = document.onmousewheel = scrollFunc; // IE/Opera/Chrome

    // enable/disable scrolling
    canvas.onclick = function (event) {
        scrollFlag = !scrollFlag;
    };

    //进行渲染
    render();
};

var render = function () {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta));

    if (flag) thetaRotate[axis] += 2.0;

    if (fogFlag) {

    }

    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = mult(modelViewMatrix, rotate(thetaRotate[xAxis], [1, 0, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(thetaRotate[yAxis], [0, 1, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(thetaRotate[zAxis], [0, 0, 1]));

    scaleMatrix = scalem(width, height, depth);
    if (isOrtho) {
        projectionMatrix = ortho(left, right, bottom, vtop, near, far);//wc下正交投影裁剪范围
    } else {
        projectionMatrix = perspective(fovy, aspect, near, far);
    }

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));//传投影变换矩阵
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));//传递旋转变换矩阵，即模视矩阵
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "scaleMatrix"), false, flatten(scaleMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);//启动shader绘制三角形，numVertices初始化为36（6*6=36个三角形顶点）
    gl.depthMask(false);
    gl.drawArrays(gl.TRIANGLES, 36, numVertices);
    gl.depthMask(true);
    for (var i = 72; i < index; i += 3) {
        gl.drawArrays(gl.TRIANGLES, i, 3);
    }
    requestAnimFrame(render);//双帧切换
};

function configureTexture(texture, image) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureSampler"), 0);
}

var scrollFunc = function (event) {
    event = event || window.event;
    if (!scrollFlag) {
        event.preventDefault();
        if (event.wheelDelta) { // IE/Opera/Chrome
            if (event.wheelDelta < 0) {
                width = width + 0.02 <= 2 ? width + 0.02 : width;
                height = height + 0.02 <= 2 ? height + 0.02 : height;
            } else {
                width = width - 0.02 >= 0 ? width - 0.02 : width;
                height = height - 0.02 >= 0 ? height - 0.02 : height;
            }
            document.getElementById("width").value = width;
            document.getElementById("height").value = height;
        } else if (event.detail) { // Firefox
            if (event.detail > 0) {
                width = width + 0.02 <= 2 ? width + 0.02 : width;
                height = height + 0.02 <= 2 ? height + 0.02 : height;
            } else {
                width = width - 0.02 >= 0 ? width - 0.02 : width;
                height = height - 0.02 >= 0 ? height - 0.02 : height;
            }
            document.getElementById("width").value = width;
            document.getElementById("height").value = height;
        }
    }
};
