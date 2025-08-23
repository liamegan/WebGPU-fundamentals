struct v {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>
}

@group(0) @binding(0)
var<uniform> transform: mat4x4<f32>;
@group(0) @binding(1)
var<uniform> projection: mat4x4<f32>;
@group(0) @binding(2)
var t_diffuse: texture_2d<f32>;
@group(0) @binding(3)
var s_diffuse: sampler;

@vertex
fn vs(
  @location(0) pos: vec3<f32>,
  @location(1) uv: vec2<f32>
) -> v {
  var out: v;
  out.pos = projection * transform * vec4<f32>(pos,1);
  out.uv = uv;
  return out;
}

@fragment
fn fs( in: v ) -> @location(0) vec4<f32> {
//  return vec4<f32>(in.uv+.5,.5,1);
  return textureSample(t_diffuse, s_diffuse, in.uv);
}