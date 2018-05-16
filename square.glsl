precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 pos = vec2(gl_FragCoord.x / u_resolution.x, gl_FragCoord.y / u_resolution.y);
    float lerp = (sin(u_time / 100.0) + 1.0) / 2.0;
    float inSquare = step(0.3, pos.x);
    inSquare = inSquare * step(pos.x, 0.7);
    inSquare = inSquare * step(0.3, pos.y);
    inSquare = inSquare * step(pos.y, 0.7);
    gl_FragColor = vec4(pos.x * inSquare, lerp, pos.y * inSquare, 1.0);
}