const fragmentShader = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p *= 2.0;

  float t = iTime * 0.5;
  float d = -t * 0.5;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * p.x);
    d += sin(p.y * i + a);
  }
  d += t * 0.5;

  vec3 col = vec3(
    sin(p.x + t * 0.5) * 0.5 + 0.5,
    cos(p.y + t * 0.3) * 0.5 + 0.5,
    sin((p.x + p.y) + t * 0.4) * 0.5 + 0.5
  );

  col *= uColor;
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

function initIridescence(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const opts = {
    color: options.color ?? [0.023529411764705882, 0.7137254901960784, 0.8313725490196079],
    speed: options.speed ?? 1.0
  };

  if (!window.ogl) {
    console.error('OGL library not loaded');
    return;
  }

  const { Renderer, Program, Mesh, Color, Triangle } = window.ogl;

  const renderer = new Renderer();
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 1);

  let program;

  function resize() {
    const scale = 1;
    renderer.setSize(container.offsetWidth * scale, container.offsetHeight * scale);
    if (program) {
      program.uniforms.iResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }
  }

  window.addEventListener('resize', resize, false);
  resize();

  const geometry = new Triangle(gl);
  program = new Program(gl, {
    vertex: `
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
      }
    `,
    fragment: fragmentShader,
    uniforms: {
      iTime: { value: 0 },
      iResolution: {
        value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height)
      },
      uColor: { value: new Color(...opts.color) }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });
  let animateId;

  function update(t) {
    animateId = requestAnimationFrame(update);
    program.uniforms.iTime.value = t * 0.001;
    renderer.render({ scene: mesh });
  }
  animateId = requestAnimationFrame(update);
  container.appendChild(gl.canvas);

  return {
    dispose: () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const bg = document.getElementById('color-bends-bg');
  if (bg) {
    // Wait for OGL library to load
    const checkOGL = () => {
      if (window.ogl) {
        window.iridescence = initIridescence('#color-bends-bg', {
          color: [0.023529411764705882, 0.7137254901960784, 0.8313725490196079],
          speed: 1.0
        });
      } else {
        setTimeout(checkOGL, 100);
      }
    };
    checkOGL();
  }
});
