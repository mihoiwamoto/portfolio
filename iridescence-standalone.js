// Standalone Iridescence Component - Pure WebGL Implementation
// Using exact shader from React Bits for authentic iridescent effect

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

function initIridescence(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const opts = {
    color: options.color ?? [0.023529411764705882, 0.7137254901960784, 0.8313725490196079],
    speed: options.speed ?? 1.0,
    amplitude: options.amplitude ?? 0.1,
    mouseReact: options.mouseReact ?? false
  };

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    console.error('WebGL not supported');
    return;
  }

  // Compile shader
  function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vShader = compileShader(vertexShader, gl.VERTEX_SHADER);
  const fShader = compileShader(fragmentShader, gl.FRAGMENT_SHADER);

  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  // Create buffer with position and UV coordinates
  const vertices = new Float32Array([
    -1, -1, 0, 0,    // bottom-left
    1, -1, 1, 0,     // bottom-right
    -1, 1, 0, 1,     // top-left
    1, 1, 1, 1       // top-right
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  const uvLocation = gl.getAttribLocation(program, 'uv');

  gl.enableVertexAttribArray(positionLocation);
  gl.enableVertexAttribArray(uvLocation);

  // Position attribute
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
  // UV attribute
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 16, 8);

  // Get uniform locations
  const timeLocation = gl.getUniformLocation(program, 'uTime');
  const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
  const colorLocation = gl.getUniformLocation(program, 'uColor');
  const mouseLocation = gl.getUniformLocation(program, 'uMouse');
  const amplitudeLocation = gl.getUniformLocation(program, 'uAmplitude');
  const speedLocation = gl.getUniformLocation(program, 'uSpeed');

  let mousePos = { x: 0.5, y: 0.5 };

  function resize() {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    // uResolution is vec3: (width, height, aspect ratio)
    gl.uniform3f(resolutionLocation, w, h, w / h);
  }

  function handleMouseMove(e) {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    mousePos = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }

  if (opts.mouseReact) {
    container.addEventListener('mousemove', handleMouseMove);
  }

  window.addEventListener('resize', resize);
  resize();

  // Set uniforms
  gl.uniform3f(colorLocation, opts.color[0], opts.color[1], opts.color[2]);
  gl.uniform1f(amplitudeLocation, opts.amplitude);
  gl.uniform1f(speedLocation, opts.speed);

  let animateId;

  function animate(t) {
    animateId = requestAnimationFrame(animate);
    gl.uniform1f(timeLocation, t * 0.001);
    gl.uniform2f(mouseLocation, mousePos.x, mousePos.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  animateId = requestAnimationFrame(animate);

  return {
    dispose: () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      if (opts.mouseReact) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vShader);
      gl.deleteShader(fShader);
      gl.deleteBuffer(buffer);
      container.removeChild(canvas);
    }
  };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const bg = document.getElementById('color-bends-bg');
  if (bg) {
    window.iridescence = initIridescence('#color-bends-bg', {
      color: [0.023529411764705882, 0.7137254901960784, 0.8313725490196079],
      speed: 1.0,
      amplitude: 0.1,
      mouseReact: false
    });
  }
});
