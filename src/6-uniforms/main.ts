import { createGPUBuffer } from "../utils/createGPUBuffer"

// @ts-ignore
import code from "./shader.wgsl";

async function main()  {
  const c:HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('canvas');
  const { width, height } = c;
  // Setup and availability checking
  if(!navigator.gpu) {
    console.log("WebGPU is not supported");
    return;
  }
  const adapter = await navigator.gpu.requestAdapter();
  if(!adapter) {
    console.log("Failed to get GPU adapter");
    return;
  }
  const device = await adapter.requestDevice();
  if(!device) {
    console.log("Failed to get GPU device");
    return;
  }

  // Canvas configuration
  const canvasConfig: GPUCanvasConfiguration = {
    device,
    format: "rgba8unorm",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    alphaMode: "premultiplied"
  }
  const ctx = c.getContext('webgpu');
  ctx.configure(canvasConfig);

  // Geometry
  const vertData = new Float32Array([
    // pos      // col
    .8,-.8,0,   1,.6,.6,
    -.8,-.8,0,  .3,1,.7,
    0,.8,0,     .4,.7,1
  ]);
  const posDesc: GPUVertexAttribute = {
    format: "float32x3",
    offset: 0,
    shaderLocation: 0,
  }
  const colDesc: GPUVertexAttribute = {
    format: "float32x3",
    offset: 4*3,
    shaderLocation: 1,
  }
  const {
    buffer: vertexBuffer,
    bufferLayoutDesc: vertexLayoutDesc,
  } = createGPUBuffer({
    device,
    values: vertData,
    attributes: [posDesc, colDesc],
    size: 6
  });

  // Shader setup
  const shaderDesc: GPUShaderModuleDescriptor = { code }
  const shader = device.createShaderModule(shaderDesc)

  // Pipeline layout
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
    buffers: [vertexLayoutDesc],
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

  // Create and confiture the render pass
  const renderTexture = ctx.getCurrentTexture();
  const renderTextureView = renderTexture.createView();
  const colorAttachment: GPURenderPassColorAttachment = {
    view: renderTextureView,
    clearValue: {r:.9, g:.9, b:.9,a:1},
    loadOp: "clear",
    storeOp: "store"
  }
  const renderPassDesc: GPURenderPassDescriptor = {
    colorAttachments: [colorAttachment],
  }

  // Create and draw the pipeline
  const pipeline = device.createRenderPipeline(pipelineDesc);

  const commandEncoder = device.createCommandEncoder();

  const passEncoder = commandEncoder.beginRenderPass(renderPassDesc)
  passEncoder.setViewport(0,0,width,height,0,1)
  passEncoder.setVertexBuffer(0, vertexBuffer)
  passEncoder.setPipeline(pipeline);
  passEncoder.draw(3,1);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()])
}

main();