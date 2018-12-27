// @ts-check

const vertexShaderSource = `
attribute vec4 v_position;
attribute vec4 v_color;

varying vec4 f_color;

void main() {
    gl_Position = v_position;
    f_color = v_color;
}
`

const fragmentShaderSource = `
precision mediump float;
varying vec4 f_color;

void main() {
    gl_FragColor = f_color;
}
`