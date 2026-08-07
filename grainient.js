const hexToRgb = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform float uTimeSpeed;
  uniform float uColorBalance;
  uniform float uWarpStrength;
  uniform float uWarpFrequency;
  uniform float uWarpSpeed;
  uniform float uWarpAmplitude;
  uniform float uBlendAngle;
  uniform float uBlendSoftness;
  uniform float uRotationAmount;
  uniform float uNoiseScale;
  uniform float uGrainAmount;
  uniform float uGrainScale;
  uniform float uGrainAnimated;
  uniform float uContrast;
  uniform float uGamma;
  uniform float uSaturation;
  uniform vec2 uCenterOffset;
  uniform float uZoom;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;

  #define S(a,b,t) smoothstep(a,b,t)

  mat2 Rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
  }

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
    return fract(sin(p) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    float n = mix(
      mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
    return 0.5 + 0.5 * n;
  }

  void main() {
    float t = iTime * uTimeSpeed;
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float ratio = iResolution.x / iResolution.y;
    vec2 tuv = uv - 0.5 + uCenterOffset;
    tuv /= max(uZoom, 0.001);

    float degree = noise(vec2(t * 0.1, tuv.x * tuv.y) * uNoiseScale);
    tuv.y *= 1.0 / ratio;
    tuv *= Rot(radians((degree - 0.5) * uRotationAmount + 180.0));
    tuv.y *= ratio;

    float frequency = uWarpFrequency;
    float ws = max(uWarpStrength, 0.001);
    float amplitude = uWarpAmplitude / ws;
    float warpTime = t * uWarpSpeed;
    tuv.x += sin(tuv.y * frequency + warpTime) / amplitude;
    tuv.y += sin(tuv.x * (frequency * 1.5) + warpTime) / (amplitude * 0.5);

    vec3 colLav = uColor1;
    vec3 colOrg = uColor2;
    vec3 colDark = uColor3;
    float b = uColorBalance;
    float s = max(uBlendSoftness, 0.0);
    mat2 blendRot = Rot(radians(uBlendAngle));
    float blendX = (tuv * blendRot).x;
    float edge0 = -0.3 - b - s;
    float edge1 = 0.2 - b + s;
    float v0 = 0.5 - b + s;
    float v1 = -0.3 - b - s;
    vec3 layer1 = mix(colDark, colOrg, S(edge0, edge1, blendX));
    vec3 layer2 = mix(colOrg, colLav, S(edge0, edge1, blendX));
    vec3 col = mix(layer1, layer2, S(v0, v1, tuv.y));

    vec2 grainUv = uv * max(uGrainScale, 0.001);
    if (uGrainAnimated > 0.5) {
      grainUv += vec2(iTime * 0.05);
    }
    float grain = fract(sin(dot(grainUv, vec2(12.9898, 78.233))) * 43758.5453);
    col += (grain - 0.5) * uGrainAmount;

    col = (col - 0.5) * uContrast + 0.5;
    float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(luma), col, uSaturation);
    col = pow(max(col, 0.0), vec3(1.0 / max(uGamma, 0.001)));
    col = clamp(col, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function initGrainient(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Container not found:', containerSelector);
    return;
  }

  const opts = {
    timeSpeed: options.timeSpeed ?? 0.25,
    colorBalance: options.colorBalance ?? 0.0,
    warpStrength: options.warpStrength ?? 1.0,
    warpFrequency: options.warpFrequency ?? 5.0,
    warpSpeed: options.warpSpeed ?? 2.0,
    warpAmplitude: options.warpAmplitude ?? 50.0,
    blendAngle: options.blendAngle ?? 0.0,
    blendSoftness: options.blendSoftness ?? 0.05,
    rotationAmount: options.rotationAmount ?? 500.0,
    noiseScale: options.noiseScale ?? 2.0,
    grainAmount: options.grainAmount ?? 0.1,
    grainScale: options.grainScale ?? 2.0,
    grainAnimated: options.grainAnimated ?? false,
    contrast: options.contrast ?? 1.5,
    gamma: options.gamma ?? 1.0,
    saturation: options.saturation ?? 1.0,
    centerX: options.centerX ?? 0.0,
    centerY: options.centerY ?? 0.0,
    zoom: options.zoom ?? 0.9,
    color1: options.color1 ?? '#1a1a1a',
    color2: options.color2 ?? '#2e2e2e',
    color3: options.color3 ?? '#555555'
  };

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) {
    console.error('WebGL not supported');
    return;
  }

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertex);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragment);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
  }
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    iResolution: gl.getUniformLocation(program, 'iResolution'),
    iTime: gl.getUniformLocation(program, 'iTime'),
    uTimeSpeed: gl.getUniformLocation(program, 'uTimeSpeed'),
    uColorBalance: gl.getUniformLocation(program, 'uColorBalance'),
    uWarpStrength: gl.getUniformLocation(program, 'uWarpStrength'),
    uWarpFrequency: gl.getUniformLocation(program, 'uWarpFrequency'),
    uWarpSpeed: gl.getUniformLocation(program, 'uWarpSpeed'),
    uWarpAmplitude: gl.getUniformLocation(program, 'uWarpAmplitude'),
    uBlendAngle: gl.getUniformLocation(program, 'uBlendAngle'),
    uBlendSoftness: gl.getUniformLocation(program, 'uBlendSoftness'),
    uRotationAmount: gl.getUniformLocation(program, 'uRotationAmount'),
    uNoiseScale: gl.getUniformLocation(program, 'uNoiseScale'),
    uGrainAmount: gl.getUniformLocation(program, 'uGrainAmount'),
    uGrainScale: gl.getUniformLocation(program, 'uGrainScale'),
    uGrainAnimated: gl.getUniformLocation(program, 'uGrainAnimated'),
    uContrast: gl.getUniformLocation(program, 'uContrast'),
    uGamma: gl.getUniformLocation(program, 'uGamma'),
    uSaturation: gl.getUniformLocation(program, 'uSaturation'),
    uCenterOffset: gl.getUniformLocation(program, 'uCenterOffset'),
    uZoom: gl.getUniformLocation(program, 'uZoom'),
    uColor1: gl.getUniformLocation(program, 'uColor1'),
    uColor2: gl.getUniformLocation(program, 'uColor2'),
    uColor3: gl.getUniformLocation(program, 'uColor3')
  };

  const setSize = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * (window.devicePixelRatio || 1)));
    const h = Math.max(1, Math.floor(rect.height * (window.devicePixelRatio || 1)));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uniforms.iResolution, w, h);
  };

  setSize();

  const ro = new ResizeObserver(setSize);
  ro.observe(container);

  let isVisible = true;
  let isPageVisible = !document.hidden;
  let raf = 0;
  const t0 = performance.now();

  const updateUniforms = () => {
    gl.uniform1f(uniforms.uTimeSpeed, opts.timeSpeed);
    gl.uniform1f(uniforms.uColorBalance, opts.colorBalance);
    gl.uniform1f(uniforms.uWarpStrength, opts.warpStrength);
    gl.uniform1f(uniforms.uWarpFrequency, opts.warpFrequency);
    gl.uniform1f(uniforms.uWarpSpeed, opts.warpSpeed);
    gl.uniform1f(uniforms.uWarpAmplitude, opts.warpAmplitude);
    gl.uniform1f(uniforms.uBlendAngle, opts.blendAngle);
    gl.uniform1f(uniforms.uBlendSoftness, opts.blendSoftness);
    gl.uniform1f(uniforms.uRotationAmount, opts.rotationAmount);
    gl.uniform1f(uniforms.uNoiseScale, opts.noiseScale);
    gl.uniform1f(uniforms.uGrainAmount, opts.grainAmount);
    gl.uniform1f(uniforms.uGrainScale, opts.grainScale);
    gl.uniform1f(uniforms.uGrainAnimated, opts.grainAnimated ? 1.0 : 0.0);
    gl.uniform1f(uniforms.uContrast, opts.contrast);
    gl.uniform1f(uniforms.uGamma, opts.gamma);
    gl.uniform1f(uniforms.uSaturation, opts.saturation);
    gl.uniform2f(uniforms.uCenterOffset, opts.centerX, opts.centerY);
    gl.uniform1f(uniforms.uZoom, opts.zoom);
    const c1 = hexToRgb(opts.color1);
    const c2 = hexToRgb(opts.color2);
    const c3 = hexToRgb(opts.color3);
    gl.uniform3f(uniforms.uColor1, c1[0], c1[1], c1[2]);
    gl.uniform3f(uniforms.uColor2, c2[0], c2[1], c2[2]);
    gl.uniform3f(uniforms.uColor3, c3[0], c3[1], c3[2]);
  };

  updateUniforms();

  const loop = t => {
    const elapsed = (t - t0) * 0.001;
    gl.uniform1f(uniforms.iTime, elapsed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(loop);
  };

  const tryStart = () => {
    if (isVisible && isPageVisible && raf === 0) {
      raf = requestAnimationFrame(loop);
    }
  };

  const tryStop = () => {
    if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      isVisible ? tryStart() : tryStop();
    },
    { threshold: 0 }
  );
  io.observe(container);

  const onVisibility = () => {
    isPageVisible = !document.hidden;
    isPageVisible ? tryStart() : tryStop();
  };
  document.addEventListener('visibilitychange', onVisibility);

  tryStart();

  return {
    dispose: () => {
      tryStop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      try {
        container.removeChild(canvas);
      } catch (e) {}
    },
    setOptions: (newOpts) => {
      Object.assign(opts, newOpts);
      updateUniforms();
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const bg = document.getElementById('color-bends-bg');
  if (bg) {
    window.grainient = initGrainient('#color-bends-bg', {
      timeSpeed: 0.8,
      colorBalance: -0.28,
      warpStrength: 0,
      warpFrequency: 8.8,
      warpSpeed: 2.0,
      warpAmplitude: 50.0,
      blendAngle: 0.0,
      blendSoftness: 0.05,
      rotationAmount: 500.0,
      noiseScale: 2.0,
      grainAmount: 0.1,
      grainScale: 2.0,
      grainAnimated: false,
      contrast: 1.5,
      gamma: 1.0,
      saturation: 1.0,
      centerX: 0.0,
      centerY: 0.0,
      zoom: 0.9,
      color1: '#000000',
      color2: '#2e2e2e',
      color3: '#555555'
    });
  }
});
