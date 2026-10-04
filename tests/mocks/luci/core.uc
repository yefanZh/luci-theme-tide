// Test-only substitute for the native router module.
export function getuid() { return 0; }
export function getspnam(name) { return {pwdp: 'configured'}; }
