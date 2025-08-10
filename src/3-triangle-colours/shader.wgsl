struct v_out {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) colour: vec3<f32>
}

@vertex
fn vs(
  @location(0) inPos: vec3<f32>,
  @location(1) colour: vec3<f32>
) -> v_out {
  var out: v_out;
  out.clip_position = vec4<f32>(inPos,1);
  out.colour = vec3<f32>(colour);
  return out;
}

@fragment
fn fs(in: v_out) -> @location(0) vec4<f32> {
  return vec4<f32>(in.colour,1);
}