import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidAbn } from './abn.ts'

test('accepts a valid ABN with spaces', () => {
  assert.equal(isValidAbn('51 824 753 556'), true)
})
test('rejects a wrong check digit', () => {
  assert.equal(isValidAbn('51 824 753 557'), false)
})
test('rejects wrong length', () => {
  assert.equal(isValidAbn('1234'), false)
})
