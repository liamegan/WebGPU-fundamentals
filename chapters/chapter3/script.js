async function main() {
  const adapter = await navigator.gpu?.requestAdapter()
  const device = await adapter?.requestDevice()
  if (!device) {
    fail(`browser doesn't support webGPU`)
    return
  }

  const c = document.querySelector("canvas")
  const ctx = c.getContext("webgpu")
  const format = navigator.gpu.getPreferredCanvasFormat()
  ctx.configure({
    device,
    format,
  })

  const module = device.createShaderModule({
    label: "an rgb triangle",
    code: `
        struct VertexOutput {
          @builtin(position) position : vec4f,
          @location(0) color : vec4f,
        };
        struct Uniforms {
          color: vec4f,
          scale: vec2f,
          offset: vec2f,
        }
        @group(0) @binding(0) var<uniform> uniforms: Uniforms;
        @vertex fn vs(
          @builtin(vertex_index) vertexIndex : u32
        ) -> VertexOutput {
          let pos = array(
            vec2f( 0.0,  0.5),  // top center
            vec2f(-0.5, -0.5),  // bottom left
            vec2f( 0.5, -0.5)   // bottom right
          );
   
          var output : VertexOutput;
          output.position = vec4f(
            pos[vertexIndex] * uniforms.scale + uniforms.offset, 0.0, 1.0);
          return output;
        }
   
        @fragment fn fs() -> @location(0) vec4f {
          return uniforms.color;
        }
      `,
  })
  const pipeline = device.createRenderPipeline({
    label: "a hardcoded red triangle pipeline",
    layout: "auto",
    vertex: {
      entryPoint: "vs", // optional if there's only one vertex EP
      module,
    },
    fragment: {
      entryPoint: "fs", // optional if there's only one vertex EP
      module,
      // Element 0 for the targets array corresponds to location 0
      // as we specified for the fragment shader’s return value.
      targets: [{ format }],
    },
  })

  const renderPassDescriptor = {
    label: "basic canvas RenderPass",
    colorAttachments: [
      {
        // view: undefined, // to be filled in later
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  }

  const uniformBufferSize =
    4 * 4 + // color is 4 32bit floats
    2 * 4 + // scale is 2 32bit floats
    2 * 4 // offset is 2 32bit floats
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  const uniformValues = new Float32Array(uniformBufferSize / 4)
  // indices for different uniform values
  const colorOffset = 0
  const scaleOffset = 4
  const offsetOffset = 6
  uniformValues.set([0, 1, 0, 1], colorOffset)
  uniformValues.set([-0.5, -0.25], offsetOffset)

  // The bind group can reference the source array, which will be written in the render call
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  })

  function render() {
    const aspect = c.width / c.height
    uniformValues.set([0.5 / aspect, 0.5], scaleOffset)
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues)
    // Get the current texture from the canvas context
    renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView()

    const encoder = device.createCommandEncoder({
      label: "basic canvas command encoder",
    })

    const pass = encoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup) // Set the bind group
    pass.draw(3)
    pass.end()

    const commandBuffer = encoder.finish()
    device.queue.submit([commandBuffer])
  }
  // render();

  const dpr = Math.min(window.devicePixelRatio, 2)
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const c = entry.target
      const w = entry.contentBoxSize[0].inlineSize * dpr
      const h = entry.contentBoxSize[0].blockSize * dpr
      c.width = Math.max(1, Math.min(w, device.limits.maxTextureDimension2D))
      c.height = Math.max(1, Math.min(h, device.limits.maxTextureDimension2D))
      render()
    }
  })
  observer.observe(c)
}
main()
