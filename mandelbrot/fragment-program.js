const fragmentProgram = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

uniform float u_x_val;
uniform float u_y_val;
uniform float u_zoom;

const int iterationLimit = 20;

vec2 iterate(vec2 acc, vec2 value) {
    return vec2(
        (acc.x * acc.x) - (acc.y * acc.y) + value.x,
        (2.0 * acc.x * acc.y) + value.y
    );
}

void main() {
    vec2 pos = vec2(gl_FragCoord.x / u_resolution.x, gl_FragCoord.y / u_resolution.y);
    pos = pos - vec2(0.5, 0.5);
    pos = pos * u_zoom;
    pos = pos + vec2(u_x_val, u_y_val);
    vec2 result = pos;
    float limitValue = 1.0;
    for (int i = 0; i < iterationLimit; i++) {
        result = iterate(result, pos);
        if (result.x >= 2.0) {
            limitValue = float(i) / float(iterationLimit);
            break;
        }
    }

    // limitValue = 1.0 - limitValue;
    gl_FragColor = vec4(limitValue, limitValue, limitValue, 1.0);
}
`