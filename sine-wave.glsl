precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 pos = vec2(gl_FragCoord.x / u_resolution.x, gl_FragCoord.y / u_resolution.y);
    float slowedTime = u_time / 100.0;
    float displacedTime = slowedTime + (pos.x * 15.0);
    float normSine = (sin(displacedTime) + 1.0) / 2.0;

    float targetY = (pos.y / 0.5) - 0.5;
    float onLine = step(normSine, targetY);
    onLine = step(targetY, normSine + 0.005) * onLine;
    gl_FragColor = vec4(onLine, onLine, onLine, 1.0);
}