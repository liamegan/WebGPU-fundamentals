
async function main() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if(!device) {
    fail(`browser doesn't support webGPU`);
    return;
  }

  const c = document.querySelector('canvas');
  const ctx = c.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({
    device,
    format
  });
  
  const module = device.createShaderModule({
    label: 'a red triangle',
    code: `
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.5, -0.5),  // bottom left
          vec2f( 0.5, -0.5)   // bottom right
        );
 
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
 
      @fragment fn fs() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `,
  });
  const pipeline = device.createRenderPipeline({
    label: 'a hardcoded red triangle pipeline',
    layout: 'auto',
    vertex: {
      entryPoint: 'vs', // optional if there's only one vertex EP
      module
    },
    fragment: {
      entryPoint: 'fs', // optional if there's only one vertex EP
      module,
      // Element 0 for the targets array corresponds to location 0 
      // as we specified for the fragment shader’s return value.
      targets: [{ format }]
    }
  });

  const renderPassDescriptor = {
    label: 'basic canvas RenderPass',
    colorAttachments: [
      {
        // view: undefined, // to be filled in later
        clearValue: [.3,.3,.3,1],
        loadOp: 'clear',
        storeOp: 'store'
      }
    ]
  }

  function render() {
    // Get the current texture from the canvas context
    renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();

    const encoder = device.createCommandEncoder({ label: 'basic canvas command encoder' });

    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);
    pass.draw(3);
    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([ commandBuffer ]);
  }
  render();
}
main();