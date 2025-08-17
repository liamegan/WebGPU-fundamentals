import { createGPUBuffer } from "./createGPUBuffer"

export type createUniformProps = {
  device: GPUDevice,
  values?: Float32Array,
  resource?: GPUBindingResource,
  binding: number,
  visibility?: GPUBindGroupLayoutEntry["visibility"]
}
export function createUniform(
  {
    device,
    values,
    resource,
    binding,
    visibility = GPUShaderStage.VERTEX
  }: createUniformProps): { resource: GPUBindingResource, bindGroupEntry: GPUBindGroupEntry, bindGroupLayoutEntry: GPUBindGroupLayoutEntry } {
  let buffer:GPUBuffer|null = null;
  if(!resource) {
    const b = createGPUBuffer({ device, values, usage: GPUBufferUsage.UNIFORM });
    buffer = b.buffer;
    resource = { buffer }
  }
  const bindGroupEntry: GPUBindGroupEntry = {
    binding,
    resource
  }
  const bindGroupLayoutEntry: GPUBindGroupLayoutEntry = {
    binding,
    visibility
  }
  if(buffer) bindGroupLayoutEntry.buffer = {}
  else if (resource instanceof GPUTextureView)
    bindGroupLayoutEntry.texture = {};
  else if (resource instanceof GPUSampler)
    bindGroupLayoutEntry.sampler = {};
  return { resource, bindGroupEntry, bindGroupLayoutEntry }
}