const Docker = require('dockerode');
const docker = new Docker({ host: '192.168.100.251', port: 2375, protocol: 'http' });

async function test() {
  const containers = await docker.listContainers({ all: false });
  const c = containers.find(x => x.Names.some(n => n.includes('dnscrypt')));
  const container = docker.getContainer(c.Id);
  
  console.log('Testing follow:false with timeout...');
  const promise = container.logs({ stdout: true, stderr: true, tail: 5, follow: false, timestamps: false });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 4000));
  
  try {
    const res = await Promise.race([promise, timeout]);
    console.log('Result type:', typeof res, Buffer.isBuffer(res) ? res.length : 'stream');
    if (Buffer.isBuffer(res)) {
      console.log('CONTENT:', res.toString('utf8'));
    } else {
      const chunks = [];
      res.on('data', ch => chunks.push(ch));
      await new Promise(r => res.on('end', r));
      console.log('STREAM CONTENT:', Buffer.concat(chunks).toString('utf8'));
    }
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}
test();
