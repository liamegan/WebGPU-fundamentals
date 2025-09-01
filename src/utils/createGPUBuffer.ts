export type createGPUBufferProps = {
  device: GPUDevice
  values: Float32Array | Uint16Array
  attributes?: GPUVertexAttribute[] // Array of attributes
  size?: number
  stepMode?: GPUVertexBufferLayout["stepMode"]
  usage?: GPUBufferDescriptor["usage"]
}
export function createGPUBuffer(
  {
    device,
    values,
    attributes,
    size = 3,
    stepMode = "vertex",
    usage = GPUBufferUsage.VERTEX,
  }: createGPUBufferProps): { buffer: GPUBuffer, bufferLayoutDesc: GPUVertexBufferLayout |null } {
  let bufferLayoutDesc = null;
  if(usage === GPUBufferUsage.VERTEX) {
    bufferLayoutDesc = {
      arrayStride: 4*size,
      stepMode,
      attributes,
    } as GPUVertexBufferLayout
  }
  const bufferDesc: GPUBufferDescriptor = {
    size: values.byteLength,
    usage,
    mappedAtCreation: true,
  }
  const buffer = device.createBuffer(bufferDesc);
  if (values instanceof Float32Array) new Float32Array(buffer.getMappedRange()).set(values);
  else if (values instanceof Uint16Array) new Uint16Array(buffer.getMappedRange()).set(values);
  else if (values instanceof Uint8Array) new Uint8Array(buffer.getMappedRange()).set(values);
  else if (values instanceof Uint32Array) new Uint32Array(buffer.getMappedRange()).set(values);
  else new Uint32Array(buffer.getMappedRange()).set(values);
  buffer.unmap();

  return { buffer, bufferLayoutDesc }
}