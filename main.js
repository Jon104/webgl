const vertexProgram =
'attribute vec4 position;' +
'void main() {' +
'  gl_Position = position;' +
'}'

/**
 * @type {WebGLRenderingContext}
 */
var gl
/**
 * @type {WebGLUniformLocation}
 */
var timeLocation
/**
 * @type {number}
 */
var time

main()
window.requestAnimationFrame(incrementTime)

function main() {
    var request = new XMLHttpRequest();
    request.open('get', 'fragment-program.glsl')
    request.responseType = 'text'
    request.onreadystatechange = function() {
        if (request.readyState == request.DONE && request.status == 200) {
            console.log(request.response)
            load(request.response)
        }
    }

    request.send()
}

/**
 * 
 * @param {string} fragmentProgram
 */
function load(fragmentProgram) {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    document.body.inser
    canvas.width = 800
    canvas.height = 600
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
    gl.uniform2fv(resolutionLocation, new Float32Array([800.0, 600.0]))

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
    gl.uniform1f(timeLocation, timestamp)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    window.requestAnimationFrame(incrementTime)
}