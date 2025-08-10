struct VertexOutput {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) colour: vec3<f32>
}

@vertex
fn vs_main(
  @location(0) inPos: vec3<f32>
) -> VertexOutput {
  var out: VertexOutput;
  out.clip_position = vec4<f32>(inPos,1);
  out.colour = vec3<f32>(inPos+.5);
  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(in.colour,1);
}