// https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html#run-computations-on-the-gpu

async function main() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if(!device) {
    fail('Browser does\'t support WebGPU');
    return;
  }

  const module = device.createShaderModule({
    label: 'doubling compute module',
    code: `
      @group(0) @binding(0) var<storage, read_write> data: array<f32>;

      @compute @workgroup_size(1) fn computeSomething(
        @builtin(global_invocation_id) id: vec3u
      ) {
        let i=id.x;
        data[i] = data[i] * 2.0;
      }
    `
  });

  const pipeline = device.createComputePipeline({
    label: 'doubling compute pipeline',
    layout: 'auto',
    compute: {
      module
    }
  });

  const input = new Float32Array([1, 3, 4, 5]);

  // Create a buffer on the GPU to hold our computation data
  const workBuffer = device.createBuffer({
    label: 'work buffer',
    size: input.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
  });
  // copy the data into the buffer
  device.queue.writeBuffer(workBuffer, 0, input);

  // Create a buffer on the GPU to get a copy of the results
  const resultBuffer = device.createBuffer({
    label: 'result buffer',
    size: input.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });

  // Set up a bind grou to tell the shader which buffer to use for computation
  const bindGroup = device.createBindGroup({
    label: 'bindGroup for work buffer',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: workBuffer } }
    ]
  });

  const encoder = device.createCommandEncoder({
    label: 'doubling encoder'
  });
  const pass = encoder.beginComputePass({
    label: 'doubling pass'
  });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(input.length);
  pass.end();

  // Encode a command to copy the results to a mappable buffer
  encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);

  // Finish and submit
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);

  // Read the results
  await resultBuffer.mapAsync(GPUMapMode.READ);
  const result = new Float32Array(resultBuffer.getMappedRange());
  console.log(input)
  console.log(result);
  resultBuffer.unmap();
}

main();