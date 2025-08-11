//https://shi-yan.github.io/webgpuunleashed/Basics/using_different_vertex_colors.html
import { createGPUBuffer } from "../utils/createGPUBuffer";
// @ts-ignore
import shadercode from "./shader.wgsl";

async function main() {
  const c:HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('canvas');
  const { width, height } = c;

  if(!navigator.gpu) {
    console.error("WebGPU is not supported");
    return;
  }

  const adapterOptions:GPURequestAdapterOptions = {
    powerPreference: "high-performance"
  }
  const adapter = await navigator.gpu.requestAdapter(adapterOptions);
  if(!adapter) {
    console.error("Failed to get GPU adapter");
    return;
  }

  const deviceDescriptor: GPUDeviceDescriptor = {

  }
  const device = await adapter.requestDevice(deviceDescriptor);
  if(!device) {
    console.error("Failed to get GPU adapter");
    return;
  }

  const ctx:GPUCanvasContext = <GPUCanvasContext>c.getContext("webgpu");

  const canvasConfig:GPUCanvasConfiguration = {
    device,
    format: "rgba8unorm",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    alphaMode: "premultiplied"
  }
  ctx.configure(canvasConfig);

  const position_colours = new Float32Array([
    .8,-.8,0,   1,.6,.6,
    -.8,-.8,0,  .3,1,.7,
    0,.8,0,     .4,.7,1
  ]);
  const positionAttributeDescriptor: GPUVertexAttribute = {
    format: "float32x3",
    offset: 0,
    shaderLocation: 0,
  }
  const colourAttributeDescriptor: GPUVertexAttribute = {
    format: "float32x3",
    offset: 4 * 3, // sizeof(float) * 3
    shaderLocation: 1,
  }
  const {
    buffer: mainBuffer,
    bufferLayoutDesc: mainBufferLayoutDesc
  } = createGPUBuffer({
    device,
    values: position_colours,
    attributes: [positionAttributeDescriptor, colourAttributeDescriptor],
    size: 6 // size of the two buffers added together
  });

  const shaderDesc:GPUShaderModuleDescriptor = {
    code: shadercode
  }
  const shader = device.createShaderModule(shaderDesc)

  const pipelineLayoutDesc: GPUPipelineLayoutDescriptor = {
    bindGroupLayouts: []
  }
  const layout = device.createPipelineLayout(pipelineLayoutDesc);
  const colorState: GPUColorTargetState = {
    format: "rgba8unorm",
  }
  const vertexState: GPUVertexState = {
    module: shader,
    entryPoint: "vs",
    buffers: [mainBufferLayoutDesc],
  }
  const fragmentState: GPUFragmentState = {
    module: shader,
    entryPoint: "fs",
    targets: [colorState]
  }
  const primitiveState: GPUPrimitiveState = {
    topology: "triangle-list",
    frontFace: "cw",
    cullMode: "back"
  }
  const pipelineDesc:GPURenderPipelineDescriptor = {
    layout,
    vertex: vertexState,
    fragment: fragmentState,
    primitive: primitiveState
  }
  const pipeline = device.createRenderPipeline(pipelineDesc);

  const colorTexture = ctx.getCurrentTexture();
  const colorTextureView = colorTexture.createView();

  const colorAttachment:GPURenderPassColorAttachment = {
    view: colorTextureView,
    clearValue: {r:.9, g:.9, b:.9,a:1},
    loadOp: "clear",
    storeOp: "store"
  }

  const renderPassDesc:GPURenderPassDescriptor = {
    colorAttachments:[colorAttachment],
  }

  const commandEncoder = device.createCommandEncoder();

  const passEncoder = commandEncoder.beginRenderPass(renderPassDesc);
  passEncoder.setViewport(0,0,width,height,0,1);
  passEncoder.setPipeline(pipeline);
  passEncoder.setVertexBuffer(0, mainBuffer)
  passEncoder.draw(3,1);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
}

main();