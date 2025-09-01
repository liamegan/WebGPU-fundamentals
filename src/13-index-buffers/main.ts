// https://shi-yan.github.io/webgpuunleashed/Basics/index_buffers.html
import { Vec3, Mat4 } from "wtc-math";

import { createGPUBuffer } from "../utils/createGPUBuffer"
import { createUniform } from "../utils/createUniform"

import imageTex from "@/public/image.png";
console.log(imageTex)

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
  // Indexed buffer
  const vertData = new Float32Array([
    -.8,  .8, 0,    // v1
    -.8,  .8, 1.6,  // v2

    .8,  .8, 0,     // v3
    .8,  .8, 1.6,    // v4

    .8, -.8, 0,     // v5
    .8, -.8, 1.6,   // v6

    -.8, -.8, 0,    // v7
    -.8, -.8, 1.6,  // v8
  ]);
  const posDesc: GPUVertexAttribute = {
    format: "float32x3",
    offset: 0,
    shaderLocation: 0,
  }
  const {
    buffer: vertexBuffer,
    bufferLayoutDesc: vertexLayoutDesc,
  } = createGPUBuffer({
    device,
    values: vertData,
    attributes: [posDesc],
    size: 3
  });

  const indices = new Uint16Array([0, 1, 2, 3, 4, 5, 6, 7, 0, 1]);
  const indexDesc: GPUVertexAttribute = {
    format: "uint16",
    offset: 0,
    shaderLocation: 1,
  }
  const {
    buffer: indexBuffer,
    bufferLayoutDesc: indexLayoutDesc,
  } = createGPUBuffer({
    device,
    values: indices,
    attributes: [indexDesc],
    size: 1,
    usage: GPUBufferUsage.INDEX
  })

  const indices2 = new Uint16Array([3, 1, 5, 7]);
  const index2Desc: GPUVertexAttribute = {
    format: "uint16",
    offset: 0,
    shaderLocation: 2,
  }
  const {
    buffer: index2Buffer,
    bufferLayoutDesc: index2LayoutDesc,
  } = createGPUBuffer({
    device,
    values: indices2,
    attributes: [index2Desc],
    size: 1,
    usage: GPUBufferUsage.INDEX
  })

  // uniforms
  const uniformBufferLayoutDescEntries = []
  const uniformBindGroupDescEntries = [];
  // Transform uniform
  const transform = Mat4.lookAt(
    new Vec3(2,2,-2),
    new Vec3(0,0,0),
    new Vec3(0,1,0)
  );
  {
    const { bindGroupEntry, bindGroupLayoutEntry } = createUniform({
      device,
      values: Float32Array.from(transform.array),
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
    })
    uniformBindGroupDescEntries.push(bindGroupEntry)
    uniformBufferLayoutDescEntries.push(bindGroupLayoutEntry)
  }
  // Projection uniform
  const projection = Mat4.perspective(
    1.4, width / height, .1, 1000)
  {
    const { bindGroupEntry, bindGroupLayoutEntry } = createUniform({
      device,
      values: Float32Array.from(projection.array),
      binding: 1,
      visibility: GPUShaderStage.VERTEX,
    })
    uniformBindGroupDescEntries.push(bindGroupEntry)
    uniformBufferLayoutDescEntries.push(bindGroupLayoutEntry)
  }
  console.log(uniformBufferLayoutDescEntries)

  // Texture
  const img = await fetch(imageTex);
  const blob = await img.blob();
  const bmp = await createImageBitmap(blob);
  const textureDesc:GPUTextureDescriptor = {
    size: { width: bmp.width, height:bmp.height },
    format: "rgba8unorm",
    // COPY_DST and RENDER_ATTACHMENT are necessary when using the copyExternalImageToTexture function
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  }
  const texture = device.createTexture(textureDesc);
  const sourceInfo:  GPUCopyExternalImageSourceInfo = {
    source: bmp,
    flipY: true
  }
  const destInfo: GPUCopyExternalImageDestInfo = {
    texture
  }
  device.queue.copyExternalImageToTexture(sourceInfo, destInfo, textureDesc.size);
  const samplerInfo: GPUSamplerDescriptor = {
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
  }
  const sampler = device.createSampler(samplerInfo)

  {
    const { bindGroupEntry, bindGroupLayoutEntry } = createUniform({
      device,
      resource: texture.createView(),
      binding: 2,
      visibility: GPUShaderStage.FRAGMENT,
    })
    uniformBindGroupDescEntries.push(bindGroupEntry)
    uniformBufferLayoutDescEntries.push(bindGroupLayoutEntry)
  }
  {
    const { bindGroupEntry, bindGroupLayoutEntry } = createUniform({
      device,
      resource: sampler,
      binding: 3,
      visibility: GPUShaderStage.FRAGMENT,
    })
    uniformBindGroupDescEntries.push(bindGroupEntry)
    uniformBufferLayoutDescEntries.push(bindGroupLayoutEntry)
  }
  // pulling them together
  const uniformBufferLayoutDesc: GPUBindGroupLayoutDescriptor = {
    entries: uniformBufferLayoutDescEntries
  }
  const uniformBindGroupLayout = device.createBindGroupLayout(uniformBufferLayoutDesc)
  const uniformBindGroupDesc: GPUBindGroupDescriptor = {
    layout: uniformBindGroupLayout,
    entries: uniformBindGroupDescEntries
  }
  const uniformBindGroup = device.createBindGroup(uniformBindGroupDesc)

  // Shader setup
  const shaderDesc: GPUShaderModuleDescriptor = { code }
  const shader = device.createShaderModule(shaderDesc)

  // Pipeline layout
  const pipelineLayoutDesc: GPUPipelineLayoutDescriptor = {
    bindGroupLayouts: [uniformBindGroupLayout]
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
    topology: "triangle-strip",
    stripIndexFormat: "uint16",
    frontFace: "ccw",
    cullMode: "none"
  }
  const depthStencil: GPUDepthStencilState = {
    depthWriteEnabled: true,
    depthCompare: "less",
    format: "depth24plus-stencil8",
  }
  const pipelineDesc:GPURenderPipelineDescriptor = {
    layout,
    vertex: vertexState,
    fragment: fragmentState,
    primitive: primitiveState,
    depthStencil
  }

  // Create the depth texture
  const depthTextureDesc: GPUTextureDescriptor = {
    size: [width, height, 1],
    dimension: '2d',
    format: 'depth24plus-stencil8',
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  }
  const depthTexture = device.createTexture(depthTextureDesc);
  const depthTextureView = depthTexture.createView();
  const depthStencilAttachment: GPURenderPassDepthStencilAttachment = {
    view: depthTextureView,
    depthClearValue: 1,
    depthLoadOp: "clear",
    depthStoreOp: "store",
    stencilClearValue: 0,
    stencilLoadOp: "clear",
    stencilStoreOp: "store",
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
    depthStencilAttachment
  }

  // Create and draw the pipeline
  const pipeline = device.createRenderPipeline(pipelineDesc);

  const commandEncoder = device.createCommandEncoder();

  const passEncoder = commandEncoder.beginRenderPass(renderPassDesc)
  passEncoder.setViewport(0,0,width,height,0,1)
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, uniformBindGroup)
  passEncoder.setVertexBuffer(0, vertexBuffer)
  passEncoder.setIndexBuffer(indexBuffer, 'uint16');
  passEncoder.drawIndexed(10,1);
  passEncoder.setIndexBuffer(index2Buffer, 'uint16');
  passEncoder.drawIndexed(4);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()])
}

main();