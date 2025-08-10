export type createGPUBufferProps = {
  device: GPUDevice,
  values: Float32Array,
  shaderLocation: number,
  size?: number,
  format?: GPUVertexAttribute["format"]
  stepMode?: GPUVertexBufferLayout["stepMode"]
  usage?: GPUBufferDescriptor["usage"]
}
export function createGPUBuffer(
  {
    device,
    values,
    shaderLocation,
    size = 3,
    format = "float32x3",
    stepMode = "vertex",
    usage = GPUBufferUsage.VERTEX,
  }: createGPUBufferProps): { buffer: GPUBuffer, bufferLayoutDesc: GPUVertexBufferLayout } {
  const attributeDescriptor: GPUVertexAttribute = {
    format,
    offset: 0,
    shaderLocation,
  }
  const bufferLayoutDesc: GPUVertexBufferLayout = {
    arrayStride: 4*size,
    stepMode,
    attributes: [attributeDescriptor],
  }
  const bufferDesc: GPUBufferDescriptor = {
    size: values.byteLength,
    usage,
    mappedAtCreation: true,
  }
  const buffer = device.createBuffer(bufferDesc);
  new Float32Array(buffer.getMappedRange()).set(values);
  buffer.unmap();

  return { buffer, bufferLayoutDesc }
}