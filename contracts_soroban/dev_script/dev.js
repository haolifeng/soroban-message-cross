let env_address = "0x8E7fbb49f436d0e8a50c02F631e729A57a9a0aCA";

let buffer = Buffer.from(env_address.slice(2), 'hex');
console.log('buffer.length: ', buffer.length);