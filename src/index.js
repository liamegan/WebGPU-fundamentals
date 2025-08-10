async function main() {
  const c = canvas;
  const { width, height } = c;
  console.log(width, height);

  if(!navigator.gpu) {
    console.error("WebGPU is not supported");
    showWarning("WebGPU is not supported");
    throw new Error("WebGPU is not supported");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if(!adapter) {
    console.error("Failed to get GPU adapter");
    return;
  }

  const device = await adapter.requestDevice();
  if(!device) {
    console.error("Failed to get GPU device");
    return;
  }

  const context = c.getContext("webgpu");

  const config = {
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
    alphaMode: "premultiplied"
  }
  context.configure(config);

  const colorTexture = context.getCurrentTexture();
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

  const commandEncoder = device.createCommandEncoder();

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setViewport(0,0,width,height,0,1);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()])
}

main();