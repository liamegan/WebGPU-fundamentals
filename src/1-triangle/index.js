import shader from "./shader.wgsl";

async function main(){

  const c = canvas;
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

  const config = {
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    alphaMode: "premultiplied"
  }

  ctx.configure(config);

  const colorTexture = ctx.getCurrentTexture();
  const colorTextureView = colorTexture.createView();

  const colorAttachment = {
    view: colorTextureView,
    clearValue: { r:1, g:1, b:0, a:1},
    loadOp: "clear",
    storeOp: "store"
  }

  const renderPassDescriptor = {
    colorAttachments: [colorAttachment]
  }

  const shaderModule = device.createShaderModule({code: shader})

  // A pipeline layout refers to the structure of constants we intend to provide to the pipeline. Each layout
  // represents a group of constants we want to feed into the pipeline.
  const pipelineLayout = { bindGroupLayouts: [] }
  const layout = device.createPipelineLayout(pipelineLayout);
  const colorState = {
    format: 'bgra8unorm', // 8bits per channel, normalized
  };
  const pipelineDesc = {
    layout,
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
      buffers: []
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [colorState]
    },
    primitive: {
      topology: 'triangle-list',
      frontFace: 'ccw',
      cullMode: 'back'
    }
  }
  const pipeline = device.createRenderPipeline(pipelineDesc)


  const commandEncoder = device.createCommandEncoder();

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setViewport(0,0,width,height,0,1);
  passEncoder.setPipeline(pipeline);
  passEncoder.draw(3);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()])
}

main();