// https://shi-yan.github.io/webgpuunleashed/Basics/drawing_a_triangle_with_defined_vertices.html
// @ts-ignore
import shader from "./shader.wgsl";

// import "@webgpu/types";


async function main() {
  const c:HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('canvas');
  const { width, height } = c;

  if(!navigator.gpu) {
    console.error("WebGPU is not supported");
    return;
  }

  const adaptor = await navigator.gpu.requestAdapter();
  if(!adaptor) {
    console.error("Failed to get GPU adapter");
    return;
  }

  const device = await adaptor.requestDevice();
  if(!device) {
    console.error("Failed to get GPU device");
    return;
  }

  const ctx = c.getContext("webgpu");

  const canvasConfig: GPUCanvasConfiguration = {
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    alphaMode: "premultiplied"
  };
  ctx.configure(canvasConfig);

  const colorTexture = ctx.getCurrentTexture();
  const colorTextureView = colorTexture.createView();
  const colorAttachment: GPURenderPassColorAttachment = {
    view: colorTextureView,
    clearValue: { r:1, g:1, b:0, a:1},
    loadOp: "clear",
    storeOp: "store"
  }

  const renderPassDescriptor = {
    colorAttachments: [colorAttachment]
  }

  const positionAttributeDesc: GPUVertexAttribute = {
    shaderLocation: 0,
    offset: 0,
    format: 'float32x3'
  };
  const positionBufferLayoutDesc: GPUVertexBufferLayout = {
    attributes: [positionAttributeDesc],
    arrayStride: 4 * 3, // sizeof(float) * 3
    stepMode: 'vertex'
  }
  const positions = new Float32Array([
    1,-1,0,
    -1,-1,0,
    0,1,0,
  ])
  const positionBufferDesc: GPUBufferDescriptor = {
    size: positions.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  }
  const positionBuffer = device.createBuffer(positionBufferDesc);
  new Float32Array(positionBuffer.getMappedRange()).set(positions);
  // Once we've finished writing the data, we call unmap to flush the data to the GPU.
  positionBuffer.unmap();

  const shaderModule = device.createShaderModule({ code: shader });

  // A pipeline layout refers to the structure of constants we intend to provide to the pipeline. Each layout
  // represents a group of constants we want to feed into the pipeline.
  const pipelineLayout = { bindGroupLayouts: [] }
  const layout = device.createPipelineLayout(pipelineLayout);
  const colorState: GPUColorTargetState = {
    format: 'bgra8unorm',
  }
  const pipelineDesc: GPURenderPipelineDescriptor = {
    layout,
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
      buffers: [positionBufferLayoutDesc] // It's important to note that this field can accommodate multiple buffer descriptors if needed.
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [colorState],
    },
    primitive: {
      topology: 'triangle-list',
      frontFace: 'cw',
      cullMode: 'back'
    }
  }
  const pipeline = device.createRenderPipeline(pipelineDesc);

  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setViewport(0,0,width,height,0,1);
  passEncoder.setPipeline(pipeline);
  passEncoder.setVertexBuffer(0, positionBuffer);
  passEncoder.draw(3)
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()])
}

main();