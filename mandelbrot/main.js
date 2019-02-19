const vertexProgram =
'attribute vec4 position;' +
'void main() {' +
'  gl_Position = position;' +
'}'

const canvasWidth = 800
const canvasHeight = 800

var lastTimestamp = 0
var xVal = 0
var yVal = 0
var zoom = 4

var xVel = 0
var yVel = 0
var zoomVel = 0

/**
 * @type {WebGLRenderingContext}
 */
var gl
/**
 * @type {WebGLUniformLocation}
 */
var timeLocation
/**
 * @type {WebGLUniformLocation}
 */
var xValLocation
/**
 * @type {WebGLUniformLocation}
 */
var yValLocation
/**
 * @type {WebGLUniformLocation}
 */
var zoomLocation
/**
 * @type {number}
 */
var time

main()
window.requestAnimationFrame(incrementTime)

function main() {
    load(fragmentProgram)
}

/**
 * 
 * @param {string} fragmentProgram
 */
function load(fragmentProgram) {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    document.body.inser
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    gl = canvas.getContext('webgl')

    if (!gl) {
        console.log('init failed')
        return
    }
    else {
        console.log('init success')
    }

    const program = compileProgram(fragmentProgram)

    var arrayBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            -1.0, -1.0
        ]),
        gl.STATIC_DRAW
    )

    const positionLocation = gl.getAttribLocation(program, 'position')
    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    )
    gl.enableVertexAttribArray(positionLocation)

    gl.useProgram(program)

    timeLocation = gl.getUniformLocation(program, 'u_time')
    gl.uniform1f(timeLocation, 0.0)
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    gl.uniform2fv(resolutionLocation, new Float32Array([canvasWidth, canvasHeight]))
    xValLocation = gl.getUniformLocation(program, 'u_x_val')
    yValLocation = gl.getUniformLocation(program, 'u_y_val')
    zoomLocation = gl.getUniformLocation(program, 'u_zoom')

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

/**
 * 
 * @param {string} fragmentProgram
 * @returns {WebGLProgram}
 */
function compileProgram(fragmentProgram) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vertexProgram)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader))
    }

    const shader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(shader, fragmentProgram)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader))
    }

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, shader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log('program linking failure')
    }

    return program;
}

function incrementTime(timestamp) {
    const zoomAdjustment = Math.min(zoom, 1.0)
    const delta = (timestamp - lastTimestamp) * zoomAdjustment * 0.001
    lastTimestamp = timestamp
    xVal += xVel * delta
    yVal += yVel * delta
    zoom += zoomVel * delta
    gl.uniform1f(xValLocation, xVal)
    gl.uniform1f(yValLocation, yVal)
    gl.uniform1f(zoomLocation, zoom)

    gl.uniform1f(timeLocation, timestamp)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    window.requestAnimationFrame(incrementTime)
}

document.onkeydown = function(event) {
    switch (event.code) {
        case 'KeyW':
            yVel = 1
            break;
        case 'KeyA':
            xVel = -1
            break;
        case 'KeyS':
            yVel = -1
            break;
        case 'KeyD':
            xVel = 1
            break;
        case 'KeyO':
            zoomVel = 1
            break;
        case 'KeyL':
            zoomVel = -1
            break;
    }
}

document.onkeyup = function(event) {
    switch (event.code) {
        case 'KeyW':
        case 'KeyS':
            yVel = 0
            break;
        case 'KeyA':
        case 'KeyD':
            xVel = 0
            break;
        case 'KeyL':
        case 'KeyO':
            zoomVel = 0
            break;
    }
}