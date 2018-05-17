precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

mat2 rotationMat(float rotation) {
    return mat2(
        cos(rotation), -sin(rotation),
        sin(rotation), cos(rotation)
    );
}

/*float isOnLine(vec2 pos, float rotation) {
    pos = pos - vec2(0.5, 0.5);
    pos = pos * rotationMat(rotation);
    pos = pos + vec2(0.5, 0.5);
    float onLine = step(0.5, pos.y);
    onLine = step(pos.y, 0.9) * onLine;
    onLine = step(0.499, pos.x) * onLine;
    onLine = step(pos.x, 0.501) * onLine;
    return onLine;
}*/

vec3 getColor(vec2 pos, float rotation, vec3 gapColor) {
    pos = pos - vec2(0.5, 0.5);
    pos = pos * rotationMat(rotation);
    float aboveOrigin = step(0.0, pos.y);
    float onLine = step(pos.y, 0.4) * aboveOrigin;
    onLine = step(-0.001, pos.x) * onLine;
    onLine = step(pos.x, 0.001) * onLine;
    if(onLine == 1.0) {
        return vec3(1.0);
    }
    else {
        return gapColor * aboveOrigin;
    }
}

void main() {
    float fullRotation = 6.28;
    float thirdRotation = fullRotation / 3.0;
    vec2 pos = vec2(gl_FragCoord.x / u_resolution.x, gl_FragCoord.y / u_resolution.y);
    float slowedTime = u_time / 1000.0;
    vec3 color = getColor(pos, slowedTime, vec3(1.0, 0.3, 0.3));
    color = max(getColor(pos, slowedTime + thirdRotation, vec3(0.3, 1.0, 0.3)), color);
    color = max(getColor(pos, slowedTime + (thirdRotation * 2.0), vec3(0.3, 0.3, 1.0)), color);
    gl_FragColor = vec4(color, 1.0);
}