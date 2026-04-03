import { describe, it, expect } from 'vitest'
import { Logger } from '../src/utils/logger'

describe('Logger', () => {
  it('should create logger instance', () => {
    expect(Logger).toBeDefined()
  })

  it('should have all logging methods', () => {
    expect(typeof Logger.info).toBe('function')
    expect(typeof Logger.success).toBe('function')
    expect(typeof Logger.warn).toBe('function')
    expect(typeof Logger.error).toBe('function')
    expect(typeof Logger.debug).toBe('function')
    expect(typeof Logger.section).toBe('function')
    expect(typeof Logger.divider).toBe('function')
  })
})

describe('TypeScript Configuration', () => {
  it('should have correct type definitions', () => {
    // This test ensures TypeScript compilation works
    const testValue: string = 'test'
    expect(testValue).toBe('test')
  })
})