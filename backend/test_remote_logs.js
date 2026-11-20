const Docker = require('dockerode');
const docker = new Docker({ host: '192.168.100.251', port: 2375, protocol: 'http' });

async function test() {
  try {
    const containers = await docker.listContainers({ all: true });
    console.log('Containers:', containers.length);
    const c = containers[0];
    console.log('Target:', c.Id, c.Names.join(','));

    const container = docker.getContainer(c.Id);
    const inspect = await container.inspect();
    console.log('Config.Tty:', inspect.Config.Tty);

    const stream = await container.logs({ stdout: true, stderr: true, tail: 3, follow: false, timestamps: true });
    if (Buffer.isBuffer(stream)) {
      console.log('BUFFER len:', stream.length);
      console.log('CONTENT:', JSON.stringify(stream.toString('utf-8')));
    } else {
      const chunks = [];
      stream.on('data', chunk => {
        chunks.push(chunk);
        console.log('CHUNK len:', chunk.length, 'head bytes:', Array.from(chunk.slice(0, 8)));
      });
      await new Promise(r => stream.on('end', r));
      const full = Buffer.concat(chunks);
      console.log('FULL len:', full.length);
      console.log('CONTENT:', JSON.stringify(full.toString('utf-8')));
    }
  } catch (err) {
    console.error('TEST ERROR:', err.message);
  }
}
test();
