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
        @vertex fn vs(
          @builtin(vertex_index) vertexIndex : u32
        ) -> VertexOutput {
          let pos = array(
            vec2f( 0.0,  0.5),  // top center
            vec2f(-0.5, -0.5),  // bottom left
            vec2f( 0.5, -0.5)   // bottom right
          );
          var color = array<vec4f, 3>(
            vec4f(1.0, 0.0, 0.0, 1.0),
            vec4f(0.0, 1.0, 0.0, 1.0),
            vec4f(0.0, 0.0, 1.0, 1.0)
          );
   
          // return vec4f(pos[vertexIndex], 0.0, 1.0);
          var output : VertexOutput;
          output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
          output.color = color[vertexIndex];
          return output;
        }
   
        // setting the struct as the input
        // @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
        //   return input.color;
        // }
        // Setting just the color in the struct as the input
        // @fragment fn fs(@location(0) color: vec4f) -> @location(0) vec4f {
        //   return color;
        // }
        // checkerboard pattern using position, which is equivalent to gl_FragCoord
        @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
          let red = vec4f(1,0,0,1);
          let cyan = vec4f(0,1,1,1);

          let grid = vec2u(input.position.xy)/32;
          let checker = (grid.x+grid.y)%2==1;
          return select(red,cyan,checker);
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

  function render() {
    // Get the current texture from the canvas context
    renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView()

    const encoder = device.createCommandEncoder({
      label: "basic canvas command encoder",
    })

    const pass = encoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline)
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
