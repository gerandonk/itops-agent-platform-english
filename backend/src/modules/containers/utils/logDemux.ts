function demux(buf: Buffer): Buffer {
  if (!buf.length) return buf;

  const parts: Buffer[] = [];
  let offset = 0;

  while (offset + 8 <= buf.length) {
    const streamType = buf[offset];
    const payloadLen = buf.readUInt32BE(offset + 4);
    const validFrame =
      (streamType === 0 || streamType === 1 || streamType === 2) &&
      payloadLen >= 0 &&
      offset + 8 + payloadLen <= buf.length;

    if (!validFrame) {
      parts.push(buf.slice(offset));
      return Buffer.concat(parts);
    }

    if (payloadLen > 0) parts.push(buf.slice(offset + 8, offset + 8 + payloadLen));
    offset += 8 + payloadLen;
  }

  if (offset < buf.length) parts.push(buf.slice(offset));
  return parts.length ? Buffer.concat(parts) : Buffer.alloc(0);
}

export function demuxDockerLog(buf: Buffer): string {
  return demux(buf).toString('utf-8');
}

export function demuxDockerLogChunk(chunk: Buffer): Buffer {
  return demux(chunk);
}
