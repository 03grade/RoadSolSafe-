import React, { useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, LayoutChangeEvent, GestureResponderEvent, ViewProps } from "react-native";
import { GLView } from "expo-gl";

type Props = ViewProps & {
  color?: [number, number, number]; // 0..1 RGB
  speed?: number;                   // default 1.0
  amplitude?: number;               // default 0.1
  mouseReact?: boolean;             // default true
};

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3  uColor;
uniform vec3  uResolution;
uniform vec2  uMouse;
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

export const IridescentBackgroundNative: React.FC<Props> = ({
  color = [0.05, 0.15, 0.3], // Dark blue theme - matches main app
  speed = 0.6,
  amplitude = 0.08,
  mouseReact = false,
  style,
  children,
  ...rest
}) => {
  const state = useRef<{
    gl?: WebGLRenderingContext;
    program?: WebGLProgram;
    time?: WebGLUniformLocation | null;
    color?: WebGLUniformLocation | null;
    res?: WebGLUniformLocation | null;
    mouse?: WebGLUniformLocation | null;
    amp?: WebGLUniformLocation | null;
    spd?: WebGLUniformLocation | null;
    start?: number;
    raf?: number;
    size?: { w: number; h: number };
  }>({});

  const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || "Shader compile error");
    }
    return s;
  };

  const link = (gl: WebGLRenderingContext, vsSrc: string, fsSrc: string) => {
    const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || "Program link error");
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return prog;
  };

  const setResolution = (gl: WebGLRenderingContext) => {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    gl.viewport(0, 0, w, h);
    if (state.current.res) {
      gl.uniform3f(state.current.res, w, h, w / Math.max(1.0, h));
    }
    state.current.size = { w, h };
  };

  const onContextCreate = useCallback((gl: WebGLRenderingContext) => {
    const program = link(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Fullscreen triangle (equivalent to OGL's Triangle)
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const uvs       = new Float32Array([ 0,  0, 2,  0,  0, 2]);

    // position
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // uv
    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    // uniforms
    state.current = {
      ...state.current,
      gl,
      program,
      time: gl.getUniformLocation(program, "uTime"),
      color: gl.getUniformLocation(program, "uColor"),
      res: gl.getUniformLocation(program, "uResolution"),
      mouse: gl.getUniformLocation(program, "uMouse"),
      amp: gl.getUniformLocation(program, "uAmplitude"),
      spd: gl.getUniformLocation(program, "uSpeed"),
      start: Date.now(),
    };

    gl.uniform3f(state.current.color!, color[0], color[1], color[2]);
    gl.uniform1f(state.current.amp!, amplitude);
    gl.uniform1f(state.current.spd!, speed);
    gl.uniform2f(state.current.mouse!, 0.5, 0.5);

    setResolution(gl);

    const loop = () => {
      const s = state.current;
      if (!s.gl) return;
      const t = (Date.now() - (s.start || 0)) / 1000.0;
      s.gl.useProgram(s.program!);
      s.gl.uniform1f(s.time!, t);
      s.gl.clearColor(0.02, 0.05, 0.15, 1); // Darker blue theme background
      s.gl.clear(s.gl.COLOR_BUFFER_BIT);
      s.gl.drawArrays(s.gl.TRIANGLES, 0, 3);
      // @ts-ignore — Expo GL
      s.gl.endFrameEXP?.();
      s.raf = requestAnimationFrame(loop);
    };
    state.current.raf = requestAnimationFrame(loop);
  }, []);

  // keep uniforms in sync with props
  useEffect(() => {
    const s = state.current;
    if (s.gl && s.color) {
      s.gl.useProgram(s.program!);
      s.gl.uniform3f(s.color, color[0], color[1], color[2]);
    }
  }, [color]);

  useEffect(() => {
    const s = state.current;
    if (s.gl && s.amp) {
      s.gl.useProgram(s.program!);
      s.gl.uniform1f(s.amp, amplitude);
    }
  }, [amplitude]);

  useEffect(() => {
    const s = state.current;
    if (s.gl && s.spd) {
      s.gl.useProgram(s.program!);
      s.gl.uniform1f(s.spd, speed);
    }
  }, [speed]);

  useEffect(() => {
    return () => {
      if (state.current.raf) cancelAnimationFrame(state.current.raf);
    };
  }, []);

  const onLayout = (_e: LayoutChangeEvent) => {
    // layout change (orientation/resize) → refresh viewport & uResolution
    const s = state.current;
    if (s.gl) setResolution(s.gl);
  };

  const onTouchMove = (e: GestureResponderEvent) => {
    if (!mouseReact) return;
    const s = state.current;
    if (!s.gl || !s.mouse || !s.size) return;
    const { locationX, locationY } = e.nativeEvent;
    const x = Math.max(0, Math.min(1, locationX / s.size.w));
    const y = Math.max(0, Math.min(1, 1.0 - locationY / s.size.h));
    s.gl.useProgram(s.program!);
    s.gl.uniform2f(s.mouse, x, y);
  };

  return (
    <View
      {...rest}
      style={[styles.container, style]}
      onLayout={onLayout}
      onStartShouldSetResponder={() => mouseReact}
      onMoveShouldSetResponder={() => mouseReact}
      onResponderMove={onTouchMove}
    >
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    width: "100%", 
    height: "100%",
    flex: 1,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});
