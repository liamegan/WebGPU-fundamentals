import { createGPUBuffer } from "./createGPUBuffer"

export type createUniformProps = {
  device: GPUDevice,
  values: Float32Array,
  binding: number,
  visibility?: GPUBindGroupLayoutEntry["visibility"]
}
export function createUniform(
  {
    device,
    values,
    binding,
    visibility = GPUShaderStage.VERTEX
  }: createUniformProps): { buffer: GPUBuffer, bindGroupEntry: GPUBindGroupEntry, bindGroupLayoutEntry: GPUBindGroupLayoutEntry } {
  const { buffer } = createGPUBuffer({ device, values, usage: GPUBufferUsage.UNIFORM });
  const bindGroupEntry: GPUBindGroupEntry = {
    binding,
    resource: {
      buffer
    }
  }
  const bindGroupLayoutEntry: GPUBindGroupLayoutEntry = {
    binding,
    visibility,
    buffer: {}
  }
  return { buffer, bindGroupEntry, bindGroupLayoutEntry }
}