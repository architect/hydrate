let something = process.env.SOMETHING
await import(something)

for (let item of [ 1, 2, 3 ]) {
  await import(item)
}

// Also import 'c' to test de-duping
await import('c')
