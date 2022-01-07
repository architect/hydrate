let something = process.env.SOMETHING
await import(something)

// Also import 'c' to test de-duping
await import('c')
