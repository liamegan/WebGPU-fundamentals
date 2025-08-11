struct v {
  @builtin(position) pos: vec4<f32>,
  @location(0) col: vec3<f32>
}

@vertex
fn vs(
  @location(0) pos: vec3<f32>,
  @location(1) col: vec3<f32>
) -> v {
  var out: v;
  out.pos = vec4<f32>(pos,1);
  out.col = col;
  return out;
}

@fragment
fn fs( in: v ) -> @location(0) vec4<f32> {
  return vec4<f32>(in.col,1);
}