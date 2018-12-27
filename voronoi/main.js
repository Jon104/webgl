// @ts-check
const circleSubdivisions = 64
const cellCount = 50
const movementChangeRate = 0.0000000001
const maxVelocity = 0.0001

/**
 * @type {Coordinate[]}
 */
var unitCircle

var lastTime = 0

/**
 * @typedef {object} Coordinate
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} Color
 * @property {number} r
 * @property {number} g
 * @property {number} b
 */

/**
 * @typedef {object} Vertex
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {number} r
 * @property {number} g
 * @property {number} b
 */

/**
 * @typedef {object} VertexMovement
 * @property {Coordinate} velocity
 * @property {Coordinate} acceleration
 */

/**
 * @type {Coordinate[]}
 */
const voronoiPoints = generateVoronoiPoints()

/**
 * @type {Color[]}
 */
const voronoiColors = generateLandmassColors()

/**
 * @type {VertexMovement[]}
 */
const voronoiMovements = initVoronoiMovements()

/**
 * @returns {Coordinate[]}
 */
function generateVoronoiPoints() {
    /**@type {Coordinate[]} */
    let result = []
    for (let i = 0; i < cellCount; i++) {
        result.push({ x: (Math.random() * 2) - 1, y: (Math.random() * 2) - 1 })
    }

    return result
}

/**
 * @returns {Color[]}
 */
function generateLandmassColors() {
    /**@type {Color[]} */
    let result = []
    for (let i = 0; i < cellCount; i++) {
        let isLand = Math.random() > 0.8
        if (isLand) {
            result.push({ r: 0.0, g: 1.0, b: 0.0 })
        }
        else {
            result.push({r: 0.0, g: 0.0, b: 1.0})
        }
    }

    return result
}

/**
 * @returns {Color[]}
 */
function generateColors() {
    /**@type {Color[]} */
    let result = []
    for (let i = 0; i < cellCount; i++) {
        result.push({ r: Math.random(), g: Math.random(), b: Math.random() })
    }

    return result
}

/**
 * @returns {VertexMovement[]}
 */
function initVoronoiMovements() {
    /**@type {VertexMovement[]} */
    let result = []
    for (let i = 0; i < cellCount; i++) {
        result.push({ velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 } })
    }

    return result
}

/**
 * @param {number} delta
 */
function moveVertices(delta) {
    voronoiMovements.forEach(function(element, index) {
        let xDelta = ((Math.random() * 2) - 1) * delta
        let yDelta = ((Math.random() * 2) - 1) * delta
        element.acceleration.x += xDelta * movementChangeRate
        element.acceleration.y += yDelta * movementChangeRate
        element.velocity.x += element.acceleration.x * delta
        element.velocity.y += element.acceleration.y * delta
        element.velocity.x = Math.max(Math.min(element.velocity.x, maxVelocity), -maxVelocity)
        element.velocity.y = Math.max(Math.min(element.velocity.y, maxVelocity), -maxVelocity)
        let vertices = voronoiVertices[index]
        for (let i = 0; i < vertices.length; i += 6) {
            vertices[i] += element.velocity.x * delta
            vertices[i + 1] += element.velocity.y * delta
        }

        if (vertices[0] > 1.0) {
            for (let i = 0; i < vertices.length; i += 6) {
                vertices[i] -= 2.0
            }
        }
        else if (vertices[0] < -1.0) {
            for (let i = 0; i < vertices.length; i += 6) {
                vertices[i] += 2.0
            }
        }

        if (vertices[1] > 1.0) {
            for (let i = 1; i < vertices.length; i += 6) {
                vertices[i] -= 2.0
            }
        }
        else if (vertices[1] < -1.0) {
            for (let i = 1; i < vertices.length; i += 6) {
                vertices[i] += 2.0
            }
        }
    })
}

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)
canvas.width = 1000
canvas.height = 1000
const gl = canvas.getContext('webgl')

initUnitCircle()

const voronoiVertices = voronoiPoints.map(function(element, index) {
    return createVertexCircle(element, voronoiColors[index])
})
const program = compileProgram()
const arrayBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer)
const positionLocation = gl.getAttribLocation(program, 'v_position')
gl.vertexAttribPointer(
    positionLocation,
    3,
    gl.FLOAT,
    false,
    24,
    0
)
gl.enableVertexAttribArray(positionLocation)

const colorPosition = gl.getAttribLocation(program, 'v_color')
gl.vertexAttribPointer(
    colorPosition,
    3,
    gl.FLOAT,
    false,
    24,
    12
)
gl.enableVertexAttribArray(colorPosition)

gl.enable(gl.DEPTH_TEST)
gl.useProgram(program)
window.requestAnimationFrame(iterate)

function initUnitCircle() {
    let increment = (Math.PI * 2) / circleSubdivisions
    unitCircle = []
    for (var i = 0; i <= circleSubdivisions; i++) {
        var angle = increment * i
        unitCircle.push({
            x: Math.sin(angle) * 2,
            y: Math.cos(angle) * 2
        })
    }
}

/**
 * @param {Coordinate} coords
 * @param {Color} color
 * @returns {number[]}
 */
function createVertexCircle(coords, color) {
    /**@type {Vertex[]} */
    var result = [ { x: coords.x, y: coords.y, z: 0.0, r: color.r, g: color.g, b: color.b } ]
    unitCircle.forEach(function(element) {
        result.push({x: element.x + coords.x, y: element.y + coords.y, z: 1.0, r: color.r, g: color.g, b: color.b })
    })
    return result.reduce(
        function(acc, vertex) {
            acc.push(vertex.x, vertex.y, vertex.z, vertex.r, vertex.g, vertex.b)
            return acc
        },
        []
    )
}

/**
 * @returns {WebGLProgram}
 */
function compileProgram() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vertexShaderSource)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader))
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, fragmentShaderSource)
    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(fragmentShader))
    }

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log('program linking failure')
    }

    return program;
}

/**
 * @type {FrameRequestCallback}
 */
function iterate(timestamp) {
    let delta = timestamp - lastTime
    lastTime = timestamp
    // moveVertices(delta)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    voronoiVertices.forEach(function(vertex) {
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(vertex),
            gl.STATIC_DRAW
        )
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertex.length / 6)
    })

    // window.requestAnimationFrame(iterate)
}