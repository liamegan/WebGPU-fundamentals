// https://shi-yan.github.io/webgpuunleashed/Basics/implementing_cameras.html#
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
  const vertData = new Float32Array([
    // pos      // uv
    .8,-.8,0,   1,0,
    -.8,-.8,0,  0,0,
    0,.8,0,     .5,1,
  ]);
  const posDesc: GPUVertexAttribute = {
    format: "float32x3",
    offset: 0,
    shaderLocation: 0,
  }
  const uvDesc: GPUVertexAttribute = {
    format: "float32x2",
    offset: 4*3,
    shaderLocation: 1,
  }
  const {
    buffer: vertexBuffer,
    bufferLayoutDesc: vertexLayoutDesc,
  } = createGPUBuffer({
    device,
    values: vertData,
    attributes: [posDesc, uvDesc],
    size: 5
  });

  // uniforms
  const uniformBufferLayoutDescEntries = []
  const uniformBindGroupDescEntries = [];
  // Transform uniform
  const transform = Mat4.lookAt(
    new Vec3(2,0,2),
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
    1.4, window.innerWidth / window.innerHeight, .1, 1000)
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
  passEncoder.setBindGroup(0, uniformBindGroup)
  passEncoder.setPipeline(pipeline);
  passEncoder.draw(3,1);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()])
}

main();