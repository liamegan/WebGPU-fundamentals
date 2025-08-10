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

  const positions = new Float32Array([
    .8,-.8,0,
    -.8,-.8,0,
    0,.8,0
  ]);
  const {
    buffer: positionBuffer,
    bufferLayoutDesc: positionBufferLayoutDesc
  } = createGPUBuffer({
    device,
    values: positions,
    shaderLocation: 0
  });

  const colours = new Float32Array([
    1,.6,.6,
    .3,1,.7,
    .4,.7,1
  ])
  const {
    buffer: colourBuffer,
    bufferLayoutDesc: colourBufferLayoutDesc
  } = createGPUBuffer({
    device,
    values: colours,
    shaderLocation: 1
  })

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
    buffers: [positionBufferLayoutDesc, colourBufferLayoutDesc],
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
  passEncoder.setVertexBuffer(0, positionBuffer)
  passEncoder.setVertexBuffer(1, colourBuffer)
  passEncoder.draw(3,1);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
}

main();