precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 pos = vec2(gl_FragCoord.x / u_resolution.x, gl_FragCoord.y / u_resolution.y);
    float radius = distance(pos, vec2(0.5));
    float circleVal = exp2(radius) - 1.0;
    /*float circleVal = radius;*/
    circleVal = circleVal * step(radius, 0.3);
    gl_FragColor = vec4(circleVal, 0.0, 0.0, 1.0);
}